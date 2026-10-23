import { expect, test } from 'vitest'
import {
  EVALUATION_AS_OF,
  evaluateFixtureBoundaries,
  evaluateRepeatedVisits,
  FETCH_SIZE,
  MEANINGFUL_VISIBLE_COUNT,
  REPEAT_WINDOW_MS,
  syntheticCatalog,
} from '../../scripts/blueprint-discovery-freshness-evaluation'
import {
  pageBlueprintCatalog,
  type BlueprintDiscoverySessionContext,
} from '@/server/blueprints/services/blueprint-discovery'

const actor = 'freshness-evaluation-test-actor'
const session = (
  sessionId: string,
  seen: BlueprintDiscoverySessionContext['seen'],
  startedAt = EVALUATION_AS_OF
): BlueprintDiscoverySessionContext => ({ version: 1, sessionId, startedAt, seen })

test('repeated visits reduce top-ten repeats while recording only meaningful exposure', () => {
  const report = evaluateRepeatedVisits(120, 5)
  expect(report.variedCreatorCount).toBe(15)
  expect(report.categoryCounts).toEqual({ birthdays: 30, events: 30, holidays: 30, weddings: 30 })
  expect(report.visitCount).toBe(5)
  expect(report.fetchedPerVisit).toBe(FETCH_SIZE)
  expect(report.meaningfulVisibleCount).toBe(MEANINGFUL_VISIBLE_COUNT)
  expect(report.visitResults[0]?.candidate.repeatRateTop10).toBeNull()
  expect(report.visitResults[1]?.baseline.repeatRateTop10).toBe(0.6)
  expect(report.visitResults[1]?.candidate.repeatRateTop10).toBeLessThan(1)
  expect(report.visitResults[2]?.candidate.repeatRateTop10).toBe(0)
  expect(report.visitResults[1]?.candidate.firstUnseenRank).toBe(1)
  expect(report.uniqueTop10AcrossVisits.candidate).toBeGreaterThan(
    report.uniqueTop10AcrossVisits.baseline
  )
  for (const visit of report.visitResults) {
    expect(visit.baselineDuplicateCount).toBe(0)
    expect(visit.candidateDuplicateCount).toBe(0)
    expect(visit.candidateTop20).toHaveLength(FETCH_SIZE)
    expect(visit.candidateTop20.slice(0, MEANINGFUL_VISIBLE_COUNT)).toHaveLength(
      MEANINGFUL_VISIBLE_COUNT
    )
    expect(visit.meaningfullyExposedKeys).toHaveLength(MEANINGFUL_VISIBLE_COUNT)
    expect(visit.fetchedButNotExposedCount).toBe(FETCH_SIZE - MEANINGFUL_VISIBLE_COUNT)
  }
  expect(report.paging).toEqual({
    stableSessionContinues: true,
    sameContextOrderStable: true,
    sameContextDuplicateCount: 0,
    changedHistoryReason: 'stale_cursor',
  })
})

test('tiny, empty, all-seen cooldown, and changed-catalog fixtures remain bounded', () => {
  const boundary = evaluateFixtureBoundaries()
  expect(boundary.tinyInventory).toEqual({ count: 6, returned: 6, complete: true })
  expect(boundary.emptyInventory).toEqual({ count: 0, returned: 0, complete: true })
  expect(boundary.allSeenCooldown).toHaveLength(8)
  expect(boundary.changedCatalog).toEqual({
    firstPageCount: 3,
    changedInventoryReason: 'stale_cursor',
  })
})

test('cooldown-expired items rank before recently exposed items', () => {
  const catalog = syntheticCatalog(4)
  const now = Date.parse(EVALUATION_AS_OF)
  const context = session('00000000-0000-4000-8000-000000000101', [
    { catalogKey: 'synthetic_000', lastSeenAt: new Date(now - REPEAT_WINDOW_MS - 1).toISOString() },
    { catalogKey: 'synthetic_001', lastSeenAt: new Date(now - 2 * REPEAT_WINDOW_MS).toISOString() },
    { catalogKey: 'synthetic_002', lastSeenAt: new Date(now - 60_000).toISOString() },
  ])
  const result = pageBlueprintCatalog(
    catalog,
    { limit: 4, q: '', ranking: 'baseline_v1', discoverySession: context },
    actor,
    { now: new Date(EVALUATION_AS_OF) }
  )
  expect(result.ok).toBe(true)
  if (result.ok) {
    const keys = result.page.entries.map(({ catalogKey }) => catalogKey)
    expect(keys.indexOf('synthetic_003')).toBeLessThan(keys.indexOf('synthetic_001'))
    expect(keys.indexOf('synthetic_001')).toBeLessThan(keys.indexOf('synthetic_000'))
    expect(keys.indexOf('synthetic_000')).toBeLessThan(keys.indexOf('synthetic_002'))
  }
})

test('typed exact phrase stays relevant even when matching item is seen and unrelated items are unseen', () => {
  const catalog = syntheticCatalog(40)
  const result = pageBlueprintCatalog(
    catalog,
    {
      limit: 20,
      q: 'Synthetic Picnic 000',
      ranking: 'baseline_v1',
      discoverySession: session('00000000-0000-4000-8000-000000000102', [
        { catalogKey: 'synthetic_000', lastSeenAt: EVALUATION_AS_OF },
      ]),
    },
    actor,
    { now: new Date(EVALUATION_AS_OF) }
  )
  expect(result.ok).toBe(true)
  if (result.ok)
    expect(result.page.entries.map(({ catalogKey }) => catalogKey)).toEqual(['synthetic_000'])
})

test('account scoped histories and cursor scopes do not cross', () => {
  const catalog = syntheticCatalog(30)
  const accountA = session('00000000-0000-4000-8000-000000000201', [
    ...Array.from({ length: 6 }, (_, index) => ({
      catalogKey: `synthetic_${index.toString().padStart(3, '0')}`,
      lastSeenAt: EVALUATION_AS_OF,
    })),
  ])
  const accountB = session('00000000-0000-4000-8000-000000000202', [])
  const pageA = pageBlueprintCatalog(
    catalog,
    { limit: 3, q: '', ranking: 'baseline_v1', discoverySession: accountA },
    'account-a',
    { now: new Date(EVALUATION_AS_OF) }
  )
  const pageB = pageBlueprintCatalog(
    catalog,
    { limit: 3, q: '', ranking: 'baseline_v1', discoverySession: accountB },
    'account-b',
    { now: new Date(EVALUATION_AS_OF) }
  )
  expect(pageA.ok && pageB.ok).toBe(true)
  if (pageA.ok && pageB.ok) {
    expect(pageA.page.entries.map(({ catalogKey }) => catalogKey)).not.toEqual(
      pageB.page.entries.map(({ catalogKey }) => catalogKey)
    )
    const crossScope = pageBlueprintCatalog(
      catalog,
      {
        limit: 3,
        q: '',
        ranking: 'baseline_v1',
        cursor: pageA.page.nextCursor,
        discoverySession: accountA,
      },
      'account-b',
      { now: new Date(EVALUATION_AS_OF) }
    )
    expect(crossScope).toEqual({ ok: false, reason: 'stale_cursor' })
  }
})
