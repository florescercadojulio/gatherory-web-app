import { blueprintStarters } from '../src/server/blueprints/catalog/starters'
import {
  buildBlueprintCatalog,
  pageBlueprintCatalog,
  type BlueprintDiscoverySessionContext,
} from '../src/server/blueprints/services/blueprint-discovery'

export const EVALUATION_AS_OF = '2026-10-22T12:00:00.000Z'
export const FETCH_SIZE = 20
export const MEANINGFUL_VISIBLE_COUNT = 6
export const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000

const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
const experienceTypes = ['wedding', 'birthday', 'holiday', 'custom'] as const

export function syntheticCatalog(count: number) {
  const template = blueprintStarters[0]
  if (!template) throw new Error('Expected at least one starter blueprint fixture')
  const entries = Array.from({ length: count }, (_, index) => {
    const entry = structuredClone(template)
    entry.catalogKey = `synthetic_${index.toString().padStart(3, '0')}`
    entry.definition.blueprint.id = entry.catalogKey
    entry.definition.blueprint.name = `Synthetic Picnic ${index.toString().padStart(3, '0')}`
    const experienceType = experienceTypes[index % experienceTypes.length]!
    entry.definition.experienceDefaults.type = experienceType
    for (const module of entry.definition.modules) {
      if (module.type === 'experience_tree') module.config.mainEventType = experienceType
    }
    return {
      ...entry,
      creator: { displayName: `Synthetic Creator ${Math.floor(index / 8) + 1}` },
      rankingMetadata: {
        creatorKey: `synthetic_creator_${Math.floor(index / 8) + 1}`,
        firstPublishedAt: new Date(Date.parse(EVALUATION_AS_OF) - (index % 40) * day).toISOString(),
      },
    }
  })
  return buildBlueprintCatalog(entries)
}

function makeSession(
  visit: number,
  startedAt: string,
  seen: BlueprintDiscoverySessionContext['seen']
): BlueprintDiscoverySessionContext {
  return {
    version: 1,
    sessionId: `00000000-0000-4000-8000-${visit.toString().padStart(12, '0')}`,
    startedAt,
    seen,
  }
}

function fetchAll(
  catalog: ReturnType<typeof syntheticCatalog>,
  session?: BlueprintDiscoverySessionContext,
  q = ''
) {
  let cursor: string | undefined
  const keys: string[] = []
  let pageCount = 0
  do {
    const result = pageBlueprintCatalog(
      catalog,
      {
        limit: FETCH_SIZE,
        q,
        ranking: 'baseline_v1',
        ...(cursor ? { cursor } : {}),
        ...(session ? { discoverySession: session } : {}),
      },
      'freshness-offline-evaluation-actor',
      { now: new Date(session?.startedAt ?? EVALUATION_AS_OF) }
    )
    if (!result.ok) throw new Error(`Paging failed: ${result.reason}`)
    keys.push(...result.page.entries.map(({ catalogKey }) => catalogKey))
    cursor = result.page.nextCursor
    pageCount++
    if (pageCount > catalog.entries.length + 1) throw new Error('Paging failed to terminate')
  } while (cursor)
  return {
    keys,
    pageCount,
    duplicateCount: keys.length - new Set(keys).size,
  }
}

function prefixMetrics(
  current: string[],
  previous: Set<string> | undefined,
  previouslyExposed = previous
) {
  const top10 = current.slice(0, 10)
  const repeated = previous ? top10.filter((key) => previous.has(key)).length : 0
  return {
    top10,
    repeatRateTop10: previous ? repeated / top10.length : null,
    unseenTop10: previous ? top10.length - repeated : top10.length,
    firstUnseenRank: top10.findIndex((key) => !previouslyExposed?.has(key)) + 1 || null,
  }
}

export function evaluateRepeatedVisits(count = 120, visits = 5) {
  const catalog = syntheticCatalog(count)
  let seen: BlueprintDiscoverySessionContext['seen'] = []
  const baselineSeen = new Set<string>()
  const visitReports = []
  const distinctBaseline = new Set<string>()
  const distinctCandidate = new Set<string>()
  // The baseline ranking has no session history and uses the fixed evaluation
  // timestamp, so its complete cursor traversal is identical for every visit.
  const baselineResult = fetchAll(catalog)
  const baseline = baselineResult.keys

  for (let visit = 0; visit < visits; visit++) {
    const at = new Date(Date.parse(EVALUATION_AS_OF) + visit * hour).toISOString()
    const candidateResult = fetchAll(catalog, makeSession(visit + 1, at, seen))
    const candidate = candidateResult.keys
    const baselineMetrics = prefixMetrics(baseline, baselineSeen.size ? baselineSeen : undefined)
    const previouslyExposed = new Set(seen.map(({ catalogKey }) => catalogKey))
    const candidateMetrics = prefixMetrics(
      candidate,
      seen.length ? previouslyExposed : undefined,
      previouslyExposed
    )
    baseline.slice(0, 10).forEach((key) => distinctBaseline.add(key))
    candidate.slice(0, 10).forEach((key) => distinctCandidate.add(key))
    visitReports.push({
      visit: visit + 1,
      baseline: baselineMetrics,
      candidate: candidateMetrics,
      baselineTop20: baseline.slice(0, FETCH_SIZE),
      candidateTop20: candidate.slice(0, FETCH_SIZE),
      baselineDuplicateCount: baselineResult.duplicateCount,
      candidateDuplicateCount: candidateResult.duplicateCount,
      meaningfullyExposedKeys: candidate.slice(0, MEANINGFUL_VISIBLE_COUNT),
      fetchedButNotExposedCount: Math.max(
        0,
        Math.min(FETCH_SIZE, candidate.length) - MEANINGFUL_VISIBLE_COUNT
      ),
    })

    // Only the six cards treated as meaningfully visible are recorded. The other
    // fourteen fetched cards are deliberately left unexposed.
    const exposedAt = at
    for (const catalogKey of candidate.slice(0, MEANINGFUL_VISIBLE_COUNT)) {
      seen = seen.filter((item) => item.catalogKey !== catalogKey)
      seen.push({ catalogKey, lastSeenAt: exposedAt })
    }
    baseline.slice(0, MEANINGFUL_VISIBLE_COUNT).forEach((key) => baselineSeen.add(key))
  }

  const finalAt = new Date(Date.parse(EVALUATION_AS_OF) + visits * hour).toISOString()
  const finalContext = makeSession(visits + 1, finalAt, seen)
  const cursorPage = pageBlueprintCatalog(
    catalog,
    { limit: 3, q: '', ranking: 'baseline_v1', discoverySession: finalContext },
    'freshness-offline-evaluation-actor',
    { now: new Date(finalAt) }
  )
  if (!cursorPage.ok || !cursorPage.page.nextCursor) throw new Error('Expected a paged cursor')
  const frozenOrderA = fetchAll(catalog, finalContext)
  const frozenOrderB = fetchAll(catalog, finalContext)
  const changedKey = catalog.entries.find(
    ({ catalogKey }) => !seen.some((item) => item.catalogKey === catalogKey)
  )?.catalogKey
  if (!changedKey) throw new Error('Expected an unexposed key to change the session history')
  const changedContext = {
    ...finalContext,
    seen: [...seen, { catalogKey: changedKey, lastSeenAt: finalAt }],
  }
  const changedHistoryResult = pageBlueprintCatalog(
    catalog,
    {
      limit: 3,
      q: '',
      ranking: 'baseline_v1',
      cursor: cursorPage.page.nextCursor,
      discoverySession: changedContext,
    },
    'freshness-offline-evaluation-actor',
    { now: new Date(finalAt) }
  )
  const stableNextPage = pageBlueprintCatalog(
    catalog,
    {
      limit: 3,
      q: '',
      ranking: 'baseline_v1',
      cursor: cursorPage.page.nextCursor,
      discoverySession: finalContext,
    },
    'freshness-offline-evaluation-actor',
    { now: new Date(finalAt) }
  )

  return {
    count,
    variedCreatorCount: new Set(
      catalog.entries.map(({ rankingMetadata }) => rankingMetadata?.creatorKey)
    ).size,
    categoryCounts: Object.fromEntries(
      [...new Set(catalog.entries.flatMap(({ discovery }) => discovery.categories))]
        .sort()
        .map((category) => [
          category,
          catalog.entries.filter(({ discovery }) => discovery.categories.includes(category)).length,
        ])
    ),
    visitCount: visits,
    meaningfulVisibleCount: MEANINGFUL_VISIBLE_COUNT,
    fetchedPerVisit: FETCH_SIZE,
    uniqueTop10AcrossVisits: { baseline: distinctBaseline.size, candidate: distinctCandidate.size },
    visitResults: visitReports,
    paging: {
      stableSessionContinues: stableNextPage.ok,
      sameContextOrderStable:
        JSON.stringify(frozenOrderA.keys) === JSON.stringify(frozenOrderB.keys),
      sameContextDuplicateCount: frozenOrderA.duplicateCount,
      changedHistoryReason: changedHistoryResult.ok ? null : changedHistoryResult.reason,
    },
  }
}

export function evaluateFixtureBoundaries() {
  const asOf = Date.parse(EVALUATION_AS_OF)
  const tiny = syntheticCatalog(6)
  const empty = syntheticCatalog(0)
  const allSeen = syntheticCatalog(8)
  const seen = allSeen.entries.map(({ catalogKey }, index) => ({
    catalogKey,
    lastSeenAt: new Date(asOf - (index < 3 ? REPEAT_WINDOW_MS + 1 : hour)).toISOString(),
  }))
  const allSeenPage = pageBlueprintCatalog(
    allSeen,
    {
      limit: 8,
      q: '',
      ranking: 'baseline_v1',
      discoverySession: makeSession(90, EVALUATION_AS_OF, seen),
    },
    'freshness-offline-evaluation-actor',
    { now: new Date(EVALUATION_AS_OF) }
  )
  const tinyOrder = fetchAll(tiny, makeSession(91, EVALUATION_AS_OF, [])).keys
  const emptyOrder = fetchAll(empty).keys

  const changed = syntheticCatalog(7)
  const changedCatalogPage = pageBlueprintCatalog(
    changed,
    {
      limit: 3,
      q: '',
      ranking: 'baseline_v1',
      discoverySession: makeSession(92, EVALUATION_AS_OF, []),
    },
    'freshness-offline-evaluation-actor',
    { now: new Date(EVALUATION_AS_OF) }
  )
  const changedCatalogContinuation =
    changedCatalogPage.ok && changedCatalogPage.page.nextCursor
      ? pageBlueprintCatalog(
          syntheticCatalog(8),
          {
            limit: 20,
            q: '',
            ranking: 'baseline_v1',
            cursor: changedCatalogPage.page.nextCursor,
            discoverySession: makeSession(92, EVALUATION_AS_OF, []),
          },
          'freshness-offline-evaluation-actor',
          { now: new Date(EVALUATION_AS_OF) }
        )
      : undefined

  const searchContext = makeSession(93, EVALUATION_AS_OF, [
    { catalogKey: 'synthetic_000', lastSeenAt: EVALUATION_AS_OF },
  ])
  const typed = pageBlueprintCatalog(
    syntheticCatalog(40),
    {
      limit: 20,
      q: 'Synthetic Picnic 000',
      ranking: 'baseline_v1',
      discoverySession: searchContext,
    },
    'freshness-offline-evaluation-actor',
    { now: new Date(EVALUATION_AS_OF) }
  )

  return {
    tinyInventory: {
      count: tiny.entries.length,
      returned: tinyOrder.length,
      complete: tinyOrder.length === tiny.entries.length,
    },
    emptyInventory: {
      count: empty.entries.length,
      returned: emptyOrder.length,
      complete: emptyOrder.length === empty.entries.length,
    },
    allSeenCooldown: allSeenPage.ok
      ? allSeenPage.page.entries.map(({ catalogKey }) => catalogKey)
      : allSeenPage.reason,
    changedCatalog: {
      firstPageCount: changedCatalogPage.ok ? changedCatalogPage.page.entries.length : null,
      changedInventoryReason:
        changedCatalogContinuation && !changedCatalogContinuation.ok
          ? changedCatalogContinuation.reason
          : null,
    },
    typedExactPhrase: typed.ok
      ? typed.page.entries.map(({ catalogKey }) => catalogKey)
      : typed.reason,
  }
}
