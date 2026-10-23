import { createHash } from 'node:crypto'
import { expect, test } from 'vitest'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
  buildBlueprintLikeAffinity,
  type BlueprintLikeAffinityLike,
  type BlueprintLikeAffinitySource,
} from '@/server/blueprints/services/blueprint-like-affinity'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const source = (
  catalogKey: string,
  publicText: string[],
  revision = 1,
  roles: Partial<
    Pick<
      BlueprintLikeAffinitySource,
      'name' | 'summary' | 'eventTitles' | 'ideaTitles' | 'ideaNotes'
    >
  > = {}
): BlueprintLikeAffinitySource => ({
  catalogKey,
  revision,
  contentHash: hash(`${catalogKey}-revision-${revision}`),
  publicText,
  name: roles.name ?? publicText[0] ?? '',
  summary: roles.summary ?? '',
  eventTitles: roles.eventTitles ?? [],
  ideaTitles: roles.ideaTitles ?? [],
  ideaNotes: roles.ideaNotes ?? [],
})
const like = (
  item: BlueprintLikeAffinitySource,
  options: Partial<BlueprintLikeAffinityLike> = {}
): BlueprintLikeAffinityLike => ({
  catalogKey: item.catalogKey,
  liked: true,
  likeRevision: item.revision,
  likeContentHash: item.contentHash,
  ...options,
})

test('uses bounded English and Spanish aliases over public content tokens', () => {
  const sources = [
    source('spanish-wedding', ['Boda ceremony recepción']),
    source('english-wedding', ['Wedding ceremony dinner']),
    source('spanish-birthday', ['Cumpleaños cake celebración']),
    source('english-birthday', ['Birthday cake invitations']),
    source('english-outdoor', ['Outdoor picnic meadow']),
    source('spanish-outdoor', ['Aire libre picnic bosque']),
  ]
  const report = buildBlueprintLikeAffinity(sources, [
    like(sources[0]!),
    like(sources[2]!),
    like(sources[4]!),
  ])

  expect(report.scores['english-wedding']).toBeGreaterThan(0)
  expect(report.scores['english-birthday']).toBeGreaterThan(0)
  expect(report.scores['spanish-outdoor']).toBeGreaterThan(0)
  expect(report.scores['spanish-wedding']).toBeUndefined()
  expect(report.scores['spanish-birthday']).toBeUndefined()
  expect(report.scores['english-outdoor']).toBeUndefined()
  expect(report.diagnostics.eligibleLikeCount).toBe(3)
})

test('generic planning words and body-only matches do not create affinity', () => {
  const sources = [
    source('liked', [''], 1, {
      name: 'Wedding',
      summary: 'Plan the event and gathering together',
      ideaNotes: ['garden picnic celebration'],
    }),
    source('generic-only', [''], 1, {
      name: 'Planning event template',
      summary: 'Plan your event party together',
    }),
    source('one-token', [''], 1, { name: 'Garden', summary: 'Planning a garden event' }),
    source('body-only', [''], 1, {
      name: 'Quiet evening',
      summary: 'A relaxed schedule for guests',
      ideaNotes: ['garden picnic celebration'],
    }),
  ]
  const report = buildBlueprintLikeAffinity(sources, [like(sources[0]!)])

  expect(report.scores).toEqual({})
  expect(report.diagnostics.boostedCandidateCount).toBe(0)
  expect(report.diagnostics.matchedCandidateCount).toBe(0)
  expect(report.fingerprint).toMatch(/^[a-f0-9]{64}$/)
  expect(BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT).toMatch(/^[a-f0-9]{64}$/)
})

test('no history keeps the score map empty and does not alter source eligibility', () => {
  const seed = source('seed', [''], 1, { name: 'Food allergy picnic' })
  const candidate = source('candidate', [''], 1, { name: 'Food allergy menu' })
  const withoutHistory = buildBlueprintLikeAffinity([seed, candidate], [])
  const withExactLike = buildBlueprintLikeAffinity([seed, candidate], [like(seed)])

  expect(withoutHistory.scores).toEqual({})
  expect(withoutHistory.diagnostics).toMatchObject({ sourceCount: 2, selectedSeedCount: 0 })
  expect(withExactLike.scores.candidate).toBeGreaterThan(0)
  expect(withExactLike.diagnostics.sourceCount).toBe(withoutHistory.diagnostics.sourceCount)
})

test('ignores numeric-only date/count tokens and generic blueprint/template vocabulary', () => {
  const sources = [
    source('seed', ['Template blueprint 2030 2027']),
    source('candidate', ['Blueprint template 2030 2027']),
  ]
  const report = buildBlueprintLikeAffinity(sources, [like(sources[0]!)])
  expect(report.scores).toEqual({})
  expect(report.diagnostics.matchedCandidateCount).toBe(0)
})

test('requires an exact current public revision and excludes unliked or ineligible seeds', () => {
  const sources = [
    source('current', [''], 1, { name: 'Garden picnic camping' }),
    source('revised', [''], 2, { name: 'Garden picnic camping' }),
    source('hidden', [''], 1, { name: 'Garden picnic camping' }),
    source('candidate', [''], 1, { name: 'Garden picnic hiking' }),
  ]
  const report = buildBlueprintLikeAffinity(sources, [
    like(sources[0]!),
    like(sources[1]!, { likeRevision: 1, likeContentHash: hash('revised-revision-1') }),
    like(sources[2]!, { eligible: false }),
    like(sources[3]!, { liked: false }),
    {
      catalogKey: 'withdrawn',
      liked: true,
      likeRevision: 1,
      likeContentHash: hash('withdrawn-revision-1'),
    },
  ])

  expect(report.scores.candidate).toBeGreaterThan(0)
  expect(report.scores.revised).toBeUndefined()
  expect(report.scores.current).toBeUndefined()
  expect(report.scores.hidden).toBeUndefined()
  expect(report.diagnostics).toMatchObject({
    eligibleLikeCount: 1,
    invalidLikeCount: 2,
    ineligibleLikeCount: 1,
    unlikedRowCount: 1,
    selectedSeedCount: 1,
  })
})

test('deduplicates identical likes and fails closed on conflicting rows or sources', () => {
  const seed = source('seed', [''], 1, { name: 'picnic garden' })
  const candidate = source('candidate', [''], 1, { name: 'picnic garden meadow' })
  const ambiguousSource = source('ambiguous', [''], 2, { name: 'picnic garden' })
  const report = buildBlueprintLikeAffinity(
    [seed, candidate, source('ambiguous', ['picnic garden'], 1), ambiguousSource],
    [like(seed), like(seed), like(ambiguousSource)]
  )

  expect(report.scores.candidate).toBeGreaterThan(0)
  expect(report.scores.ambiguous).toBeUndefined()
  expect(report.diagnostics).toMatchObject({
    ambiguousSourceCount: 1,
    eligibleLikeCount: 1,
    invalidLikeCount: 1,
  })
})

test('seed selection is deterministic and capped at 50 while fingerprinting later Likes', () => {
  const seeds = Array.from({ length: 51 }, (_, index) =>
    source(`seed-${index.toString().padStart(2, '0')}`, [''], 1, {
      name: `commonword subject${index}`,
      eventTitles: [`topic${index} meadow${index}`],
    })
  )
  const tail = source('z-seed-tail', [''], 1, { name: 'tailtopic tailgarden' })
  const candidate = source('candidate', [''], 1, { name: 'tailtopic tailgarden picnic' })
  const sources = [...seeds, tail, candidate]
  const likes = [...seeds.map((item) => like(item)), like(tail)]
  const first = buildBlueprintLikeAffinity(sources, likes)
  const shuffled = buildBlueprintLikeAffinity([...sources].reverse(), [...likes].reverse())
  const withoutTail = buildBlueprintLikeAffinity(sources, likes.slice(0, -1))

  expect(first).toEqual(shuffled)
  expect(first.scores.candidate).toBeUndefined()
  expect(first.fingerprint).not.toBe(withoutTail.fingerprint)
  expect(first.diagnostics).toMatchObject({
    eligibleLikeCount: 52,
    selectedSeedCount: 50,
    seedLimitApplied: true,
  })
})

test('caps source tokens, ignores repeated terms and caps a float score at three', () => {
  const seed = source('seed', [''], 1, { name: 'rarealpha rarebeta meadow' })
  const seedSources = [seed]
  const extraNotes = Array.from(
    { length: 70 },
    (_, index) => `topic${index.toString().padStart(2, '0')}`
  )
  const stuffed = source('stuffed', [''], 1, {
    name: 'rarealpha rarebeta meadow',
    ideaNotes: extraNotes,
  })
  const duplicateText = source('duplicate-text', [''], 1, {
    name: 'rarealpha rarebeta meadow',
    ideaNotes: [...extraNotes, 'rarealpha rarebeta '.repeat(40)],
  })
  const singleFieldLongText = source('single-field-long-text', [''], 1, {
    name: Array.from(
      { length: 70 },
      (_, index) =>
        `uniqueterm${String.fromCharCode(97 + Math.floor(index / 26))}${String.fromCharCode(97 + (index % 26))}`
    ).join(' '),
  })
  const result = buildBlueprintLikeAffinity(
    [...seedSources, stuffed, duplicateText, singleFieldLongText],
    seedSources.map((item) => like(item))
  )

  expect(result.scores.stuffed).toBeGreaterThan(0)
  expect(result.scores.stuffed).toBeLessThanOrEqual(3)
  expect(result.scores['duplicate-text']).toBe(result.scores.stuffed)
  expect(result.diagnostics.maxScore).toBeLessThanOrEqual(3)
  expect(result.diagnostics.tokenCappedSourceCount).toBe(3)
})

test('identity terms anchor food matches while notes only add attenuated corroboration', () => {
  const seed = source('seed', ['legacy text is ignored'], 1, {
    name: 'Food allergy picnic',
    summary: 'A shared meal with safe ingredients',
    ideaTitles: ['Allergy label cards'],
    ideaNotes: ['Keep separate utensils and mark ingredients.'],
  })
  const foodCandidate = source('food-candidate', ['legacy text is ignored'], 1, {
    name: 'Community food table',
    summary: 'A shared potluck meal',
    ideaTitles: ['Allergy menu cards'],
    ideaNotes: ['Label safe ingredients and separate utensils.'],
  })
  const bodyOnlyCandidate = source('body-only-candidate', ['legacy text is ignored'], 1, {
    name: 'Relaxed neighborhood evening',
    summary: 'A simple schedule for friends',
    ideaNotes: ['Food allergy picnic with safe ingredients and labels.'],
  })
  const report = buildBlueprintLikeAffinity([seed, foodCandidate, bodyOnlyCandidate], [like(seed)])

  expect(report.scores['food-candidate']).toBeGreaterThan(0)
  expect(report.scores['body-only-candidate']).toBeUndefined()
})

test('fingerprint changes for exact Like, source revision, withdrawal and ineligibility changes', () => {
  const original = source('seed', ['legacy garden ignored'], 1, { name: 'garden picnic' })
  const candidate = source('candidate', ['legacy meadow ignored'], 1, {
    name: 'garden picnic meadow',
  })
  const exact = like(original)
  const baselineFingerprint = buildBlueprintLikeAffinity([original, candidate], [exact]).fingerprint
  const unlikedFingerprint = buildBlueprintLikeAffinity(
    [original, candidate],
    [{ ...exact, liked: false }]
  ).fingerprint
  const hiddenFingerprint = buildBlueprintLikeAffinity(
    [original, candidate],
    [{ ...exact, eligible: false }]
  ).fingerprint
  const newRevision = source('seed', ['legacy garden ignored'], 2, { name: 'garden picnic' })
  const revisedFingerprint = buildBlueprintLikeAffinity(
    [newRevision, candidate],
    [exact]
  ).fingerprint
  const withdrawnFingerprint = buildBlueprintLikeAffinity([candidate], [exact]).fingerprint

  expect(baselineFingerprint).not.toBe(unlikedFingerprint)
  expect(baselineFingerprint).not.toBe(hiddenFingerprint)
  expect(baselineFingerprint).not.toBe(revisedFingerprint)
  expect(baselineFingerprint).not.toBe(withdrawnFingerprint)
})

test('never returns raw content tokens or like hashes in the result', () => {
  const seed = source('private-seed-key', ['SecretUniqueToken Picnicking Meadow'], 1, {
    name: 'SecretUniqueToken Picnicking Meadow',
  })
  const candidate = source('candidate', ['SecretUniqueToken Picnicking Sunset'], 1, {
    name: 'SecretUniqueToken Picnicking Sunset',
  })
  const result = buildBlueprintLikeAffinity([seed, candidate], [like(seed)])
  const serialized = JSON.stringify(result)

  expect(serialized).not.toContain('SecretUniqueToken')
  expect(serialized).not.toContain(seed.contentHash)
  expect(serialized).not.toContain('Picnicking')
})

test('identity anchors can corroborate with summaries but never summaries or notes alone', () => {
  const seed = source('seed', [''], 1, {
    name: 'Ceramic activity night',
    ideaNotes: ['painting activity with friends'],
  })
  const bodyOnly = source('body-only', [''], 1, {
    name: 'A relaxed afternoon',
    summary: 'A quiet meetup with people',
    ideaNotes: ['ceramic painting activity for friends'],
  })
  const titleAnchor = source('title-anchor', [''], 1, {
    name: 'A relaxed ceramic afternoon',
    eventTitles: ['Painting activity'],
    ideaNotes: ['Bring paint and small bowls.'],
  })
  const summaryAnchor = source('summary-anchor', [''], 1, {
    name: 'A relaxed afternoon',
    summary: 'Ceramic activity with a guided painting session.',
  })
  const summaryOnlySeed = source('summary-only-seed', [''], 1, {
    name: 'Moonlit evening',
    summary: 'Ceramic activity with a guided painting session.',
  })
  const summaryOnlyCandidate = source('summary-only-candidate', [''], 1, {
    name: 'A restful afternoon',
    summary: 'Ceramic activity with a guided painting session.',
  })
  const titleToNotesOnly = source('title-to-notes-only', [''], 1, {
    name: 'A quiet afternoon',
    ideaNotes: ['Ceramic activity with a guided painting session.'],
  })
  const report = buildBlueprintLikeAffinity(
    [seed, bodyOnly, titleAnchor, summaryAnchor, titleToNotesOnly],
    [like(seed)]
  )
  const summaryOnlyReport = buildBlueprintLikeAffinity(
    [summaryOnlySeed, summaryOnlyCandidate],
    [like(summaryOnlySeed)]
  )

  expect(report.scores['body-only']).toBeUndefined()
  expect(report.scores['title-anchor']).toBeGreaterThan(0)
  expect(report.scores['summary-anchor']).toBeGreaterThan(0)
  expect(summaryOnlyReport.scores['summary-only-candidate']).toBeUndefined()
  expect(report.scores['title-to-notes-only']).toBeUndefined()
})
