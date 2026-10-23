import { expect, test } from 'vitest'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import {
  applyBlueprintViewerPreferences,
  blueprintLikeAffinityLikes,
  blueprintLikeAffinitySources,
  buildBlueprintCatalog,
  pageBlueprintCatalog,
} from '@/server/blueprints/services/blueprint-discovery'
import { buildBlueprintLikeAffinity } from '@/server/blueprints/services/blueprint-like-affinity'

const now = new Date('2026-10-22T23:30:00.000Z')
function entry(catalogKey: string, name: string) {
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
  return source
}
function keys(result: ReturnType<typeof pageBlueprintCatalog>) {
  if (!result.ok) throw new Error(result.reason)
  return result.page.entries.map((item) => item.catalogKey)
}

const catalog = () =>
  buildBlueprintCatalog(
    ['a', 'b', 'c', 'd'].map((catalogKey) => {
      const entry = structuredClone(weddingBlueprintV1)
      entry.catalogKey = catalogKey
      entry.definition.blueprint.id = catalogKey
      return entry
    })
  )
const hidden = { a: { liked: false, bookmarked: true, notInterested: true } }

test('hidden results are removed before paging and changing actor or hide scope restarts continuation', () => {
  const original = catalog()
  const visible = {
    entries: applyBlueprintViewerPreferences(original.entries, hidden, true),
  }
  const first = pageBlueprintCatalog(visible, { limit: 2, q: '' }, 'account-one')
  expect(first.ok).toBe(true)
  if (!first.ok) return
  expect(first.page.entries.map((entry) => entry.catalogKey)).toEqual(['b', 'c'])
  expect(first.offset).toBe(0)
  expect(first.snapshotId).toMatch(/^[a-f0-9]{64}$/)
  expect(first.page.nextCursor).toBeDefined()
  const request = { limit: 2, q: '', cursor: first.page.nextCursor }
  const second = pageBlueprintCatalog(visible, request, 'account-one')
  expect(second.ok).toBe(true)
  if (!second.ok) return
  expect(second.page.entries.map((entry) => entry.catalogKey)).toEqual(['d'])
  expect(second.offset).toBe(2)
  expect(second.snapshotId).toBe(first.snapshotId)
  expect(second.page.nextCursor).toBeUndefined()
  expect(pageBlueprintCatalog(visible, request, 'account-two')).toEqual({
    ok: false,
    reason: 'stale_cursor',
  })
  expect(pageBlueprintCatalog(original, request, 'account-one')).toEqual({
    ok: false,
    reason: 'stale_cursor',
  })
})

test('explicit search retains hidden matching entries and snapshot metadata contains no raw scope', () => {
  const visible = {
    entries: applyBlueprintViewerPreferences(catalog().entries, hidden, false),
  }
  const result = pageBlueprintCatalog(visible, { limit: 2, q: 'wedding' }, 'private-account-id')
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.page.entries[0]).toMatchObject({
    catalogKey: 'a',
    viewerState: { bookmarked: true, notInterested: true },
  })
  expect(result.snapshotId).toMatch(/^[a-f0-9]{64}$/)
  expect(result.snapshotId).not.toContain('wedding')
  expect(result.snapshotId).not.toContain('private-account-id')
  // The client cursor may retain request scope, but no raw account identity.
  expect(Buffer.from(result.page.nextCursor!, 'base64url').toString()).not.toContain(
    'private-account-id'
  )
})

test('personal Like affinity ranks only eligible exact likes and binds private cursor state', () => {
  const fullCatalog = buildBlueprintCatalog([
    entry('seed', 'Cottage lantern camp'),
    entry('a_candidate', 'Garden invitation'),
    entry('z_candidate', 'Cottage lantern invitation'),
  ])
  const visibleCatalog = {
    entries: applyBlueprintViewerPreferences(fullCatalog.entries, {}, false),
  }
  const seed = fullCatalog.entries.find((candidate) => candidate.catalogKey === 'seed')!
  const publicTextSources = blueprintLikeAffinitySources(fullCatalog)
  expect(publicTextSources.find((source) => source.catalogKey === 'seed')).toMatchObject({
    name: 'Cottage lantern camp',
    summary: '',
    eventTitles: [],
    ideaTitles: [],
    ideaNotes: [],
    publicText: ['Cottage lantern camp', ''],
  })
  const storedPreferenceStates = [
    {
      catalogKey: 'seed',
      liked: true,
      likeRevision: seed.revision,
      likeContentHash: seed.contentHash,
      notInterested: false,
    },
    {
      catalogKey: 'bookmark-only',
      liked: false,
      likeRevision: null,
      likeContentHash: null,
      notInterested: false,
    },
  ]
  const likeStates = blueprintLikeAffinityLikes(storedPreferenceStates)
  expect(likeStates).toEqual([
    {
      catalogKey: 'seed',
      liked: true,
      likeRevision: seed.revision,
      likeContentHash: seed.contentHash,
      eligible: true,
    },
  ])
  const affinity = buildBlueprintLikeAffinity(publicTextSources, likeStates)
  expect(affinity.scores['z_candidate']).toBeGreaterThan(0)
  expect(affinity.scores['a_candidate']).toBeUndefined()

  const personalized = pageBlueprintCatalog(
    visibleCatalog,
    { limit: 1, q: 'invitation', ranking: 'baseline_v1' },
    'account-one',
    { now, personalLikes: { enabled: true, affinity } }
  )
  expect(keys(personalized)).toEqual(['z_candidate'])
  expect(personalized.ok && personalized.page.ranking).toMatchObject({
    mode: 'baseline_v1',
    algorithmVersion: 'blueprint-personal-likes-v2',
    configurationVersion: 'blueprint-personal-likes-v2',
  })
  expect(JSON.stringify(personalized)).not.toContain(affinity.fingerprint)
  expect(JSON.stringify(personalized)).not.toContain('scores')

  // Captured from the same fixed catalog/account/time under the previous v1
  // personal policy. Even though v2 keeps this page order, its config binding
  // must reject the old continuation rather than mixing policy snapshots.
  const frozenV1Cursor =
    'eyJ2ZXJzaW9uIjoyLCJyYW5raW5nIjoiYmFzZWxpbmVfdjEiLCJtb2RlIjoiYmFzZWxpbmVfdjEiLCJhc09mIjoiMjAyNi0xMC0yMlQyMzozMDowMC4wMDBaIiwiY29uZmlndXJhdGlvbkRpZ2VzdCI6ImY4YWY2OTUyNDc0ZjYyNmFjOGZiNGUzMDViMzlmOTAwZWRmMTVmNGMxZDQ3YTE4OTYzYzEyMzIzODIwYzgxNjQiLCJjYXRhbG9nRGlnZXN0IjoiZ1llTTJscXhNUFJqaGVNT0F1T29vZ1BQSUZFb1BCNVhBTV83R1VwY1dJcyIsImxpbWl0IjoxLCJjYXRlZ29yeSI6bnVsbCwicXVlcnkiOiJpbnZpdGF0aW9uIiwiYWZ0ZXJDYXRhbG9nS2V5Ijoiel9jYW5kaWRhdGUifQ'
  expect(
    pageBlueprintCatalog(
      visibleCatalog,
      { limit: 1, q: 'invitation', ranking: 'baseline_v1', cursor: frozenV1Cursor },
      'account-one',
      { now, personalLikes: { enabled: true, affinity } }
    )
  ).toEqual({ ok: false, reason: 'stale_cursor' })

  const bookmarkOnlyState = {
    catalogKey: 'another-bookmark',
    liked: false,
    likeRevision: null,
    likeContentHash: null,
    bookmarked: true,
    notInterested: false,
  }
  const bookmarkOnlyChange = blueprintLikeAffinityLikes([
    ...storedPreferenceStates,
    bookmarkOnlyState,
  ])
  const sameAffinity = buildBlueprintLikeAffinity(publicTextSources, bookmarkOnlyChange)
  expect(sameAffinity.fingerprint).toBe(affinity.fingerprint)
  const continuation = pageBlueprintCatalog(
    visibleCatalog,
    {
      limit: 1,
      q: 'invitation',
      ranking: 'baseline_v1',
      cursor: personalized.ok ? personalized.page.nextCursor : undefined,
    },
    'account-one',
    { now, personalLikes: { enabled: true, affinity: sameAffinity } }
  )
  expect(keys(continuation)).toEqual(['a_candidate'])

  const hiddenSeedStates = blueprintLikeAffinityLikes([
    {
      catalogKey: 'seed',
      liked: true,
      likeRevision: seed.revision,
      likeContentHash: seed.contentHash,
      notInterested: true,
    },
  ])
  const hiddenSeedAffinity = buildBlueprintLikeAffinity(publicTextSources, hiddenSeedStates)
  const hiddenSeedPage = pageBlueprintCatalog(
    visibleCatalog,
    {
      limit: 1,
      q: 'invitation',
      ranking: 'baseline_v1',
      cursor: personalized.ok ? personalized.page.nextCursor : undefined,
    },
    'account-one',
    { now, personalLikes: { enabled: true, affinity: hiddenSeedAffinity } }
  )
  expect(hiddenSeedPage).toEqual({ ok: false, reason: 'stale_cursor' })
  expect(keys(hiddenSeedPage.ok ? hiddenSeedPage : personalized)).toEqual(['z_candidate'])

  const unliked = buildBlueprintLikeAffinity(
    publicTextSources,
    blueprintLikeAffinityLikes([
      {
        catalogKey: 'seed',
        liked: false,
        likeRevision: null,
        likeContentHash: null,
        notInterested: false,
      },
    ])
  )
  const unlikePage = pageBlueprintCatalog(
    visibleCatalog,
    {
      limit: 1,
      q: 'invitation',
      ranking: 'baseline_v1',
      cursor: personalized.ok ? personalized.page.nextCursor : undefined,
    },
    'account-one',
    { now, personalLikes: { enabled: true, affinity: unliked } }
  )
  expect(unlikePage).toEqual({ ok: false, reason: 'stale_cursor' })

  const withdrawnSource = buildBlueprintCatalog([
    entry('seed', 'Cottage lantern camp'),
    entry('a_candidate', 'Garden invitation'),
    entry('z_candidate', 'Cottage lantern invitation'),
  ])
  withdrawnSource.entries.find((candidate) => candidate.catalogKey === 'seed')!.revision =
    seed.revision + 1
  const withdrawnAffinity = buildBlueprintLikeAffinity(
    blueprintLikeAffinitySources(withdrawnSource),
    likeStates
  )
  expect(withdrawnAffinity.diagnostics.invalidLikeCount).toBe(1)
  expect(
    pageBlueprintCatalog(
      visibleCatalog,
      {
        limit: 1,
        q: 'invitation',
        ranking: 'baseline_v1',
        cursor: personalized.ok ? personalized.page.nextCursor : undefined,
      },
      'account-one',
      { now, personalLikes: { enabled: true, affinity: withdrawnAffinity } }
    )
  ).toEqual({ ok: false, reason: 'stale_cursor' })
})

test('personal Like kill switch keeps baseline ordering and default callers stay unchanged', () => {
  const fullCatalog = buildBlueprintCatalog([
    entry('seed', 'Cottage lantern camp'),
    entry('a_candidate', 'Garden invitation'),
    entry('z_candidate', 'Cottage lantern invitation'),
  ])
  const seed = fullCatalog.entries.find((candidate) => candidate.catalogKey === 'seed')!
  const affinity = buildBlueprintLikeAffinity(blueprintLikeAffinitySources(fullCatalog), [
    {
      catalogKey: 'seed',
      liked: true,
      likeRevision: seed.revision,
      likeContentHash: seed.contentHash,
    },
  ])
  const disabled = pageBlueprintCatalog(
    fullCatalog,
    { limit: 1, q: 'invitation', ranking: 'baseline_v1' },
    'account-one',
    { now, personalLikes: { enabled: false, affinity } }
  )
  expect(keys(disabled)).toEqual(['a_candidate'])
  expect(disabled.ok && disabled.page.ranking?.algorithmVersion).toBe('blueprint-baseline-v2')
  const unranked = pageBlueprintCatalog(fullCatalog, { limit: 1, q: 'invitation' }, 'account-one', {
    now,
    personalLikes: { enabled: true, affinity },
  })
  expect(keys(unranked)).toEqual(['a_candidate'])
  expect(unranked.ok && unranked.page.ranking).toBeUndefined()
})
