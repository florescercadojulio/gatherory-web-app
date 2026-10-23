import { expect, test, vi } from 'vitest'
import * as rankingPolicy from '@/server/blueprints/services/blueprint-ranking'
import { BlueprintCatalogPageRequestSchema } from '@/contracts/blueprint-discovery.contracts'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { BLUEPRINT_RANKING_CONFIG } from '@/server/blueprints/catalog/blueprint-ranking-config'
import {
  applyBlueprintViewerPreferences,
  buildBlueprintCatalog,
  pageBlueprintCatalog,
  parseBlueprintDiscoverySessionContext,
  BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS,
  publicBlueprintCatalog,
} from '@/server/blueprints/services/blueprint-discovery'

const now = new Date('2026-10-22T23:30:00.000Z')
const request = { limit: 2, q: '', ranking: 'baseline_v1' as const }
function entry(catalogKey: string, name = 'A gathering', creatorKey: string | null = null) {
  const source = structuredClone(weddingBlueprintV1)
  source.catalogKey = catalogKey
  source.definition.blueprint.id = catalogKey
  source.definition.blueprint.name = name
  source.definition.experienceDefaults.type = 'custom'
  for (const module of source.definition.modules) {
    if (module.type === 'experience_tree') {
      module.config.children = []
      module.config.mainEventType = 'custom'
    }
    if (module.type === 'ideas') module.config.ideas = []
    if (module.type === 'instructions') module.config.sections = []
  }
  return {
    ...source,
    rankingMetadata: {
      creatorKey,
      firstPublishedAt: creatorKey ? '2026-10-21T00:00:00.000Z' : null,
    },
  }
}
const catalog = () =>
  buildBlueprintCatalog([
    entry('a'),
    entry('b'),
    entry('birthday'),
    entry('thanksgiving'),
    entry('wedding'),
  ])
function keys(result: ReturnType<typeof pageBlueprintCatalog>) {
  if (!result.ok) throw new Error(result.reason)
  return result.page.entries.map((item) => item.catalogKey)
}

test('ranked paging is explicit, with editorial order and an additive summary; legacy order stays stable', () => {
  const legacy = pageBlueprintCatalog(catalog(), { limit: 40, q: '' }, 'actor', { now })
  const ranked = pageBlueprintCatalog(catalog(), { ...request, limit: 40 }, 'actor', { now })
  expect(keys(legacy)).toEqual(['a', 'b', 'birthday', 'thanksgiving', 'wedding'])
  expect(legacy.ok && legacy.page.ranking).toBeUndefined()
  expect(keys(ranked)).toEqual(['wedding', 'birthday', 'thanksgiving', 'a', 'b'])
  expect(ranked.ok && ranked.page.ranking).toMatchObject({
    mode: 'baseline_v1',
    algorithmVersion: 'blueprint-baseline-v2',
    asOf: now.toISOString(),
  })
  expect(BlueprintCatalogPageRequestSchema.safeParse({ ranking: 'unknown' }).success).toBe(false)
  expect(BlueprintCatalogPageRequestSchema.parse({ ranking: 'baseline_v1' }).limit).toBe(20)
})

test('all ranked pages preserve the first snapshot across a UTC day boundary without skips or duplicates', () => {
  const source = catalog()
  const first = pageBlueprintCatalog(source, request, 'actor', { now })
  expect(first.ok).toBe(true)
  if (!first.ok) return
  let cursor = first.page.nextCursor
  const collected = keys(first)
  while (cursor) {
    const next = pageBlueprintCatalog(source, { ...request, cursor }, 'actor', {
      now: new Date('2026-10-23T00:30:00.000Z'),
    })
    expect(next.ok).toBe(true)
    if (!next.ok) return
    expect(next.snapshotId).toBe(first.snapshotId)
    expect(next.page.ranking?.asOf).toBe(now.toISOString())
    expect(next.offset).toBe(collected.length)
    collected.push(...keys(next))
    cursor = next.page.nextCursor
  }
  expect(collected).toEqual(['wedding', 'birthday', 'thanksgiving', 'a', 'b'])
  expect(new Set(collected).size).toBe(5)
})

test('ranked continuations reject changes to actor, configuration, category, query, size or clock expiry', () => {
  const source = catalog()
  const first = pageBlueprintCatalog(source, request, 'actor', { now })
  if (!first.ok) throw new Error(first.reason)
  const continuation = { ...request, cursor: first.page.nextCursor }
  const stale = { ok: false, reason: 'stale_cursor' }
  expect(pageBlueprintCatalog(source, continuation, 'another-actor', { now })).toEqual(stale)
  expect(
    pageBlueprintCatalog(source, { ...continuation, category: 'weddings' }, 'actor', { now })
  ).toEqual(stale)
  expect(
    pageBlueprintCatalog(source, { ...continuation, q: 'gathering' }, 'actor', { now })
  ).toEqual(stale)
  expect(pageBlueprintCatalog(source, { ...continuation, limit: 1 }, 'actor', { now })).toEqual(
    stale
  )
  expect(
    pageBlueprintCatalog(source, continuation, 'actor', {
      now,
      configuration: { ...BLUEPRINT_RANKING_CONFIG, maxConsecutiveAuthoredPerCreator: 3 },
    })
  ).toEqual(stale)
  expect(
    pageBlueprintCatalog(source, continuation, 'actor', {
      now,
      configuration: { ...BLUEPRINT_RANKING_CONFIG, version: 'blueprint-baseline-v1' },
    })
  ).toEqual(stale)
  expect(
    pageBlueprintCatalog(source, continuation, 'actor', {
      now: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    })
  ).toEqual(stale)
})

test('ranked and legacy cursors cannot silently cross ordering modes', () => {
  const source = catalog()
  const legacy = pageBlueprintCatalog(source, { limit: 2, q: '' }, 'actor', { now })
  const ranked = pageBlueprintCatalog(source, request, 'actor', { now })
  if (!legacy.ok || !ranked.ok) throw new Error('Expected first pages')
  expect(
    pageBlueprintCatalog(source, { ...request, cursor: legacy.page.nextCursor }, 'actor', { now })
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  expect(
    pageBlueprintCatalog(source, { limit: 2, q: '', cursor: ranked.page.nextCursor }, 'actor', {
      now,
    })
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  const payload = JSON.parse(Buffer.from(ranked.page.nextCursor!, 'base64url').toString())
  expect(payload.version).toBe(2)
  expect(payload.mode).toBe('baseline_v1')
})

test('kill switch and invalid configuration keep the existing deterministic fallback and scoped continuations', () => {
  const source = catalog()
  const frozenContext = discoverySession(
    ['a', 'b', 'birthday', 'thanksgiving'].map((catalogKey) => ({
      catalogKey,
      lastSeenAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    }))
  )
  const disabledWithContext = pageBlueprintCatalog(
    source,
    { ...request, limit: 40, discoverySession: frozenContext },
    'actor',
    { now, enabled: false }
  )
  expect(keys(disabledWithContext)).toEqual(['a', 'b', 'birthday', 'thanksgiving', 'wedding'])
  expect(disabledWithContext.ok && disabledWithContext.page.ranking).toMatchObject({
    mode: 'catalog',
    algorithmVersion: 'blueprint-baseline-v2',
    configurationVersion: 'blueprint-baseline-v2',
  })
  const first = pageBlueprintCatalog(source, request, 'actor', { now, enabled: false })
  expect(keys(first)).toEqual(['a', 'b'])
  if (!first.ok) return
  expect(first.page.ranking?.mode).toBe('catalog')
  const continuation = { ...request, cursor: first.page.nextCursor }
  expect(
    keys(pageBlueprintCatalog(source, continuation, 'actor', { now, enabled: false }))
  ).toEqual(['birthday', 'thanksgiving'])
  expect(pageBlueprintCatalog(source, continuation, 'actor', { now })).toEqual({
    ok: false,
    reason: 'stale_cursor',
  })
  const invalid = pageBlueprintCatalog(source, request, 'actor', {
    now,
    configuration: { ...BLUEPRINT_RANKING_CONFIG, newItemShare: NaN },
  })
  expect(keys(invalid)).toEqual(['a', 'b'])
  expect(invalid.ok && invalid.page.ranking).toMatchObject({
    mode: 'catalog',
    configurationVersion: 'unavailable',
  })
})

test('recommendations never bury direct query content under a loose related or unrelated editorial plan', () => {
  const source = buildBlueprintCatalog([
    entry('a_direct', 'Outdoor gathering'),
    entry('birthday', 'Picnic gathering'),
    entry('wedding', 'Indoor wedding'),
  ])
  expect(
    keys(pageBlueprintCatalog(source, { ...request, q: 'outdoors', limit: 40 }, 'actor', { now }))
  ).toEqual(['a_direct', 'birthday'])
  expect(keys(pageBlueprintCatalog(source, { ...request, q: '!!!' }, 'actor', { now }))).toEqual([])
  expect(
    keys(pageBlueprintCatalog(source, { ...request, category: 'birthdays' }, 'actor', { now }))
  ).toEqual(['birthday'])
})

test('retirement, new revision, or hide scope changes restart rather than serving an old ranked candidate', () => {
  const source = catalog()
  const first = pageBlueprintCatalog(source, request, 'actor', { now })
  if (!first.ok) throw new Error(first.reason)
  const continuation = { ...request, cursor: first.page.nextCursor }
  expect(
    pageBlueprintCatalog(
      { entries: source.entries.filter((item) => item.catalogKey !== 'wedding') },
      continuation,
      'actor',
      { now }
    )
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  const changed = structuredClone(source)
  changed.entries[0]!.revision += 1
  expect(pageBlueprintCatalog(changed, continuation, 'actor', { now })).toEqual({
    ok: false,
    reason: 'stale_cursor',
  })
  const hidden = {
    entries: applyBlueprintViewerPreferences(
      source.entries,
      {
        wedding: { liked: false, bookmarked: false, notInterested: true },
      },
      true
    ),
  }
  expect(pageBlueprintCatalog(hidden, continuation, 'actor', { now })).toEqual({
    ok: false,
    reason: 'stale_cursor',
  })
  expect(
    keys(pageBlueprintCatalog(hidden, { ...request, limit: 40 }, 'actor', { now }))
  ).not.toContain('wedding')
})

test('creator identities, source metadata and internal reasons never enter full or paged wire objects', () => {
  const source = buildBlueprintCatalog([
    entry('authored', 'Public title', 'secret-server-creator-id'),
    entry('wedding'),
  ])
  const full = publicBlueprintCatalog(source)
  const ranked = pageBlueprintCatalog(source, { ...request, limit: 1 }, 'secret-server-actor-id', {
    now,
  })
  if (!ranked.ok) throw new Error(ranked.reason)
  const wire = JSON.stringify([
    full,
    ranked.page,
    Buffer.from(ranked.page.nextCursor!, 'base64url').toString(),
  ])
  for (const forbidden of [
    'rankingMetadata',
    'creatorKey',
    'firstPublishedAt',
    'secret-server-creator-id',
    'secret-server-actor-id',
    'reasons',
  ])
    expect(wire).not.toContain(forbidden)
})

test('an unexpected policy failure returns a catalog fallback without disrupting discovery', () => {
  const policy = vi
    .spyOn(rankingPolicy, 'rankBlueprintRecommendations')
    .mockImplementationOnce(() => {
      throw new Error('Unavailable policy')
    })
  try {
    const source = catalog()
    const context = discoverySession(
      ['a', 'b', 'birthday', 'thanksgiving'].map((catalogKey) => ({
        catalogKey,
        lastSeenAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      }))
    )
    const result = pageBlueprintCatalog(
      source,
      { ...request, discoverySession: context },
      'actor',
      { now }
    )
    expect(keys(result)).toEqual(['a', 'b'])
    expect(result.ok && result.page.ranking).toMatchObject({
      mode: 'catalog',
      algorithmVersion: 'blueprint-baseline-v2',
      configurationVersion: 'blueprint-baseline-v2',
    })
  } finally {
    policy.mockRestore()
  }
})

function discoverySession(
  seen: Array<{ catalogKey: string; lastSeenAt: string }>,
  startedAt = now.toISOString()
) {
  return { version: 1 as const, sessionId: '7e9d1f13-5a19-4a1e-9ad6-6f4f68081a54', startedAt, seen }
}

test('unseen ranked browse entries precede fixed editorial priorities, then seen entries cool down', () => {
  const startedAt = now.getTime()
  const session = discoverySession([
    { catalogKey: 'wedding', lastSeenAt: new Date(startedAt - 25 * 60 * 60 * 1000).toISOString() },
    { catalogKey: 'birthday', lastSeenAt: new Date(startedAt - 60 * 60 * 1000).toISOString() },
    { catalogKey: 'thanksgiving', lastSeenAt: new Date(startedAt - 2 * 60 * 60 * 1000).toISOString() },
    { catalogKey: 'b', lastSeenAt: new Date(startedAt - 28 * 60 * 60 * 1000).toISOString() },
  ])
  expect(keys(pageBlueprintCatalog(catalog(), { ...request, limit: 40 }, 'actor', { now }))).toEqual([
    'wedding', 'birthday', 'thanksgiving', 'a', 'b',
  ])
  const unseen = pageBlueprintCatalog(
    catalog(),
    { ...request, limit: 40, discoverySession: session },
    'actor',
    { now }
  )
  expect(keys(unseen)).toEqual(['a', 'b', 'wedding', 'thanksgiving', 'birthday'])
  expect(unseen.ok && unseen.page.ranking).toMatchObject({
    algorithmVersion: 'blueprint-unseen-first-v1',
    configurationVersion: 'blueprint-baseline-v2+unseen-first-v1',
  })
})

test('baseline-equal candidates use deterministic session seeded jitter', () => {
  const candidates = ['alpha', 'beta', 'gamma', 'delta'].map((catalogKey) => ({
    catalogKey,
    relevance: [],
  }))
  const baseline = rankingPolicy.rankBlueprintRecommendations(
    candidates,
    now.toISOString(),
    BLUEPRINT_RANKING_CONFIG
  )
  const seeded = rankingPolicy.rankBlueprintRecommendations(
    candidates,
    now.toISOString(),
    BLUEPRINT_RANKING_CONFIG,
    undefined,
    'session-a'
  )
  expect(baseline.orderedKeys).toEqual(['alpha', 'beta', 'delta', 'gamma'])
  expect(seeded.orderedKeys).toEqual(['beta', 'delta', 'alpha', 'gamma'])
  expect(
    rankingPolicy.rankBlueprintRecommendations(
      candidates,
      now.toISOString(),
      BLUEPRINT_RANKING_CONFIG,
      undefined,
      'session-a'
    ).orderedKeys
  ).toEqual(seeded.orderedKeys)
})

test('freshness tiers preserve creator diversity where another creator is available', () => {
  const startedAt = now.getTime()
  const source = buildBlueprintCatalog([
    entry('x1', 'One', 'creator-x'),
    entry('x2', 'Two', 'creator-x'),
    entry('x3', 'Three', 'creator-x'),
    entry('y1', 'Four', 'creator-y'),
  ])
  const session = discoverySession([
    { catalogKey: 'x1', lastSeenAt: new Date(startedAt - 27 * 60 * 60 * 1000).toISOString() },
    { catalogKey: 'x2', lastSeenAt: new Date(startedAt - 26 * 60 * 60 * 1000).toISOString() },
    { catalogKey: 'x3', lastSeenAt: new Date(startedAt - 25 * 60 * 60 * 1000).toISOString() },
    { catalogKey: 'y1', lastSeenAt: new Date(startedAt - 24 * 60 * 60 * 1000).toISOString() },
  ])
  const ordered = keys(
    pageBlueprintCatalog(
      source,
      { ...request, limit: 40, discoverySession: session },
      'actor',
      { now }
    )
  )
  expect(ordered.slice(0, 3)).toEqual(['x1', 'x2', 'y1'])
})

test('a frozen session also freezes baseline new-item age on repeated first-page requests', () => {
  const startedAt = now.toISOString()
  const source = buildBlueprintCatalog([
    entry('baseline', 'Baseline', 'creator-baseline'),
    entry('middle', 'Middle', 'creator-middle'),
    entry('new', 'New', 'creator-new'),
  ])
  const metadataByKey = new Map(source.entries.map((item) => [item.catalogKey, item.rankingMetadata]))
  const entries = source.entries.map((item) => ({
    ...item,
    rankingMetadata: {
      ...metadataByKey.get(item.catalogKey)!,
      firstPublishedAt: item.catalogKey === 'new'
        ? new Date(now.getTime() + 30_000).toISOString()
        : null,
    },
  }))
  const frozenSource = { entries }
  const config = {
    ...BLUEPRINT_RANKING_CONFIG,
    newItemShare: 0.5,
    editorialPriorities: { baseline: 30, middle: 20, new: 0 },
  }
  const session = discoverySession([], startedAt)
  const first = pageBlueprintCatalog(
    frozenSource,
    { ...request, limit: 40, discoverySession: session },
    'actor',
    { now, configuration: config }
  )
  const repeated = pageBlueprintCatalog(
    frozenSource,
    { ...request, limit: 40, discoverySession: session },
    'actor',
    { now: new Date(now.getTime() + 60_000), configuration: config }
  )
  expect(keys(first)).toEqual(['baseline', 'middle', 'new'])
  expect(keys(repeated)).toEqual(keys(first))
  expect(repeated.ok && repeated.page.ranking?.asOf).toBe(startedAt)
})

test('typed search ignores discovery context and preserves its existing relevance ordering', () => {
  const source = buildBlueprintCatalog([
    entry('a_direct', 'Outdoor gathering'),
    entry('birthday', 'Picnic gathering'),
    entry('wedding', 'Indoor wedding'),
  ])
  const search = { ...request, q: 'outdoors', limit: 40 }
  const session = discoverySession([
    { catalogKey: 'a_direct', lastSeenAt: now.toISOString() },
    { catalogKey: 'birthday', lastSeenAt: now.toISOString() },
  ])
  const baseline = pageBlueprintCatalog(source, search, 'actor', { now })
  const withContext = pageBlueprintCatalog(
    source,
    { ...search, discoverySession: session },
    'actor',
    { now }
  )
  expect(keys(withContext)).toEqual(keys(baseline))
  expect(withContext.ok && baseline.ok && withContext.snapshotId).toBe(baseline.ok && baseline.snapshotId)
})

test('discovery context is frozen into ranked pagination and account-scoped cursors', () => {
  const session = discoverySession([
    {
      catalogKey: 'birthday',
      lastSeenAt: new Date(now.getTime() - BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS).toISOString(),
    },
  ])
  const first = pageBlueprintCatalog(catalog(), request, 'actor', { now })
  const contextualFirst = pageBlueprintCatalog(
    catalog(),
    { ...request, discoverySession: session },
    'actor',
    { now }
  )
  if (!contextualFirst.ok || !first.ok) throw new Error('Expected first page')
  const continuation = {
    ...request,
    discoverySession: session,
    cursor: contextualFirst.page.nextCursor,
  }
  expect(
    pageBlueprintCatalog(catalog(), continuation, 'actor', {
      now: new Date(now.getTime() + 30_000),
    }).ok
  ).toBe(true)
  expect(pageBlueprintCatalog(catalog(), continuation, 'other-account', { now })).toEqual({
    ok: false,
    reason: 'stale_cursor',
  })
  const changedSession = discoverySession([
    ...session.seen,
    {
      catalogKey: 'a',
      lastSeenAt: new Date(now.getTime() - 1_000).toISOString(),
    },
  ])
  expect(
    pageBlueprintCatalog(
      catalog(),
      { ...continuation, discoverySession: changedSession },
      'actor',
      { now }
    )
  ).toEqual({ ok: false, reason: 'stale_cursor' })
})

test('discovery context parser rejects future, duplicate, and over-retention history', () => {
  const valid = (seen: Array<{ catalogKey: string; lastSeenAt: string }>, startedAt = now.toISOString()) =>
    JSON.stringify(discoverySession(seen, startedAt))
  const future = new Date(now.getTime() + 61_000).toISOString()
  expect(parseBlueprintDiscoverySessionContext(valid([], future), now)).toBeUndefined()
  expect(
    parseBlueprintDiscoverySessionContext(
      valid(
        [{ catalogKey: 'a', lastSeenAt: new Date(now.getTime() + 1_000).toISOString() }],
        new Date(now.getTime() + 30_000).toISOString()
      ),
      now
    )
  ).toBeUndefined()
  expect(
    parseBlueprintDiscoverySessionContext(
      valid([
        { catalogKey: 'a', lastSeenAt: now.toISOString() },
        { catalogKey: 'a', lastSeenAt: now.toISOString() },
      ]),
      now
    )
  ).toBeUndefined()
  expect(
    parseBlueprintDiscoverySessionContext(
      valid([
        {
          catalogKey: 'a',
          lastSeenAt: new Date(now.getTime() - BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS - 1).toISOString(),
        },
      ]),
      now
    )
  ).toBeUndefined()
  const boundary = valid([
    {
      catalogKey: 'a',
      lastSeenAt: new Date(now.getTime() - BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS).toISOString(),
    },
  ])
  expect(
    parseBlueprintDiscoverySessionContext(boundary, new Date(now.getTime() + 30_000))
  ).toBeDefined()
})
