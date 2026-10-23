import { expect, test } from 'vitest'
import {
  BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  configurationFingerprint,
  isValidBlueprintRankingConfig,
  rankBlueprintRecommendations,
  type BlueprintRankingCandidate,
  type BlueprintRankingConfig,
} from '@/server/blueprints/services/blueprint-ranking'
import { BLUEPRINT_RANKING_CONFIG } from '@/server/blueprints/catalog/blueprint-ranking-config'

const asOf = '2026-10-22T12:00:00.000Z'
const authored = (
  catalogKey: string,
  creatorKey: string,
  firstPublishedAt = '2026-09-01T00:00:00.000Z',
  relevance: number[] = []
): BlueprintRankingCandidate => ({
  catalogKey,
  relevance,
  metadata: { creatorKey, firstPublishedAt },
})

test('preserves relevance groups and orders groups by their lower-is-better vectors', () => {
  const result = rankBlueprintRecommendations(
    [
      {
        catalogKey: 'new-unrelated',
        relevance: [2],
        metadata: { creatorKey: 'x', firstPublishedAt: asOf },
      },
      { catalogKey: 'wedding', relevance: [1] },
      { catalogKey: 'birthday', relevance: [1] },
    ],
    asOf
  )
  expect(result.orderedKeys).toEqual(['wedding', 'birthday', 'new-unrelated'])
})

test('applies personal Like affinity only inside equal relevance after editorial priority', () => {
  const candidates: BlueprintRankingCandidate[] = [
    { catalogKey: 'like-match', relevance: [0] },
    { catalogKey: 'editorial', relevance: [0] },
    { catalogKey: 'less-relevant', relevance: [1] },
    { catalogKey: 'baseline-tie', relevance: [0] },
  ]
  const affinity = { 'like-match': 3, editorial: 1, 'less-relevant': 3 }
  const baseline = rankBlueprintRecommendations(candidates, asOf)
  const personal = rankBlueprintRecommendations(
    candidates,
    asOf,
    {
      ...BLUEPRINT_RANKING_CONFIG,
      editorialPriorities: { editorial: 2 },
    },
    affinity
  )

  expect(personal.orderedKeys).toEqual(['editorial', 'like-match', 'baseline-tie', 'less-relevant'])
  expect(baseline.orderedKeys.indexOf('less-relevant')).toBeGreaterThan(
    baseline.orderedKeys.indexOf('like-match')
  )
})

test('clamps malformed affinity scores and preserves exact baseline order when absent or empty', () => {
  const candidates = [
    { catalogKey: 'a', relevance: [] },
    { catalogKey: 'b', relevance: [] },
    { catalogKey: 'c', relevance: [] },
  ]
  const baseline = rankBlueprintRecommendations(candidates, asOf)
  expect(rankBlueprintRecommendations(candidates, asOf, undefined, {})).toEqual(baseline)
  expect(
    rankBlueprintRecommendations(candidates, asOf, undefined, {
      a: Number.NaN,
      b: 99,
      c: -4,
    }).orderedKeys
  ).toEqual(['b', ...baseline.orderedKeys.filter((key) => key !== 'b')])
  expect(rankBlueprintRecommendations(candidates, asOf, undefined, { a: 3 }).orderedKeys).toEqual([
    'a',
    'b',
    'c',
  ])
})

test('affinity preserves the soft creator cap and recent-item opportunity behavior', () => {
  const candidates = [
    authored('a-first', 'creator-a', '2026-07-01T00:00:00.000Z'),
    authored('a-second', 'creator-a', '2026-07-01T00:00:00.000Z'),
    authored('a-third', 'creator-a', '2026-07-01T00:00:00.000Z'),
    authored('b-recent', 'creator-b', '2026-10-20T00:00:00.000Z'),
    ...Array.from({ length: 8 }, (_, index) =>
      authored(`older-${index}`, `creator-${index + 2}`, '2026-07-01T00:00:00.000Z')
    ),
  ]
  const ordinary = rankBlueprintRecommendations(candidates, asOf)
  const personalized = rankBlueprintRecommendations(candidates, asOf, undefined, {
    'a-first': 3,
    'a-second': 3,
    'a-third': 3,
  })

  expect(personalized.orderedKeys.indexOf('b-recent')).toBe(2)
  expect(personalized.reasons['b-recent']).toContain('creator_diversity')
  expect(personalized.orderedKeys.indexOf('b-recent')).toBeLessThanOrEqual(
    ordinary.orderedKeys.indexOf('b-recent')
  )
  expect(personalized.reasons['b-recent']).not.toContain('new_item_promotion')
})

test('uses explicit editorial priorities before catalog-key ties', () => {
  const result = rankBlueprintRecommendations(
    [
      { catalogKey: 'thanksgiving', relevance: [] },
      { catalogKey: 'z-authored', relevance: [] },
      { catalogKey: 'wedding', relevance: [] },
      { catalogKey: 'birthday', relevance: [] },
      { catalogKey: 'a-authored', relevance: [] },
    ],
    asOf
  )
  expect(result.orderedKeys).toEqual([
    'wedding',
    'birthday',
    'thanksgiving',
    'a-authored',
    'z-authored',
  ])
  expect(result.reasons.wedding).toContain('editorial_priority')
})

test('applies a soft authored creator cap when alternatives exist and fills a single-creator catalog', () => {
  const diverse = rankBlueprintRecommendations(
    [
      authored('a1', 'creator-a'),
      authored('a2', 'creator-a'),
      authored('a3', 'creator-a'),
      authored('a4', 'creator-a'),
      authored('b1', 'creator-b'),
    ],
    asOf
  )
  expect(diverse.orderedKeys.indexOf('b1')).toBe(2)
  expect(diverse.reasons.b1).toContain('creator_diversity')

  const oneCreator = rankBlueprintRecommendations(
    ['a', 'b', 'c', 'd'].map((key) => authored(key, 'same-creator')),
    asOf
  )
  expect(oneCreator.orderedKeys).toEqual(['a', 'b', 'c', 'd'])
})

test('promotion-only opportunities do not reserve or delay a recently published item', () => {
  const result = rankBlueprintRecommendations(
    [
      authored('older-a', 'creator-a'),
      authored('fresh-z', 'creator-z', '2026-10-01T00:00:00.000Z'),
      authored('older-b', 'creator-b'),
    ],
    asOf
  )
  expect(result.orderedKeys).toEqual(['fresh-z', 'older-a', 'older-b'])
  expect(result.reasons['fresh-z']).not.toContain('new_item_promotion')
})

test('promotion decisions are deterministic and ignore candidate input order', () => {
  const candidates = Array.from({ length: 20 }, (_, index) =>
    authored(
      `new-${index.toString().padStart(2, '0')}`,
      `creator-${index}`,
      '2026-10-20T00:00:00.000Z'
    )
  )
  const first = rankBlueprintRecommendations(candidates, asOf)
  const shuffled = rankBlueprintRecommendations([...candidates].reverse(), asOf)
  expect(first).toEqual(shuffled)
  expect(first.orderedKeys).toEqual(candidates.map(({ catalogKey }) => catalogKey))
  expect(
    first.orderedKeys.filter((key) => first.reasons[key]?.includes('new_item_promotion'))
  ).toEqual([])
})

test('uses only immutable first publication time and excludes stale or future publication metadata', () => {
  const result = rankBlueprintRecommendations(
    [
      authored('stale', 'creator-stale', '2026-09-21T11:59:59.999Z'),
      authored('inside-window', 'creator-new', '2026-09-22T12:00:00.000Z'),
      authored('future', 'creator-future', '2026-10-23T00:00:00.000Z'),
    ],
    asOf
  )
  expect(result.reasons['inside-window']).not.toContain('new_item_promotion')
  expect(result.reasons.stale).not.toContain('new_item_promotion')
  expect(result.reasons.future).not.toContain('new_item_promotion')
})

test('promotes an overlooked recent item only at a global cumulative milestone', () => {
  const candidates = [
    ...Array.from({ length: 10 }, (_, index) => authored(`old-${index}`, `old-creator-${index}`)),
    authored('zz-recent', 'recent-creator', '2026-10-20T00:00:00.000Z'),
  ]
  const result = rankBlueprintRecommendations(candidates, asOf)
  expect(result.orderedKeys.slice(0, 9)).toEqual(
    candidates.slice(0, 9).map(({ catalogKey }) => catalogKey)
  )
  expect(result.orderedKeys[9]).toBe('zz-recent')
  expect(result.reasons['zz-recent']).toContain('new_item_promotion')
  expect(result.orderedKeys[10]).toBe('old-9')
})

test('recent items never move below their ordinary editorial and soft-diversity rank', () => {
  const candidates = [
    authored('featured-recent', 'creator-a', '2026-10-20T00:00:00.000Z'),
    authored('a-old-0', 'creator-b', '2026-07-01T00:00:00.000Z'),
    authored('a-old-1', 'creator-b', '2026-07-01T00:00:00.000Z'),
    authored('a-old-2', 'creator-b', '2026-07-01T00:00:00.000Z'),
    authored('z-recent-tail', 'creator-c', '2026-10-20T00:00:00.000Z'),
    ...Array.from({ length: 16 }, (_, index) =>
      authored(
        `b-old-${index.toString().padStart(2, '0')}`,
        `creator-${index + 10}`,
        '2026-07-01T00:00:00.000Z'
      )
    ),
  ]
  const ordinary = rankBlueprintRecommendations(candidates, asOf, {
    ...BLUEPRINT_RANKING_CONFIG,
    newItemShare: 0,
  })
  const promoted = rankBlueprintRecommendations(candidates, asOf)
  for (const candidate of candidates.filter(
    (item) => item.metadata?.firstPublishedAt === '2026-10-20T00:00:00.000Z'
  )) {
    expect(promoted.orderedKeys.indexOf(candidate.catalogKey)).toBeLessThanOrEqual(
      ordinary.orderedKeys.indexOf(candidate.catalogKey)
    )
  }
  expect(promoted.orderedKeys[0]).toBe(ordinary.orderedKeys[0])
})

test('small relevance groups do not round a per-group opportunity up', () => {
  const candidates = Array.from({ length: 9 }, (_, groupIndex) =>
    Array.from({ length: groupIndex + 1 }, (_, itemIndex) =>
      itemIndex === groupIndex
        ? authored(
            `z-new-${groupIndex}-${itemIndex}`,
            `new-${groupIndex}-${itemIndex}`,
            '2026-10-20T00:00:00.000Z',
            [groupIndex]
          )
        : authored(
            `a-old-${groupIndex}-${itemIndex}`,
            `old-${groupIndex}-${itemIndex}`,
            '2026-07-01T00:00:00.000Z',
            [groupIndex]
          )
    )
  ).flat()
  const result = rankBlueprintRecommendations(candidates, asOf)
  const promoted = result.orderedKeys.filter((key) =>
    result.reasons[key]?.includes('new_item_promotion')
  )
  expect(promoted.length).toBe(0)
  expect(new Set(result.orderedKeys).size).toBe(candidates.length)
})

test('missing or malformed metadata uses stable catalog ties without creator grouping', () => {
  const result = rankBlueprintRecommendations(
    [
      { catalogKey: 'b', relevance: [], metadata: { creatorKey: '', firstPublishedAt: 'recent' } },
      { catalogKey: 'a', relevance: [] },
      { catalogKey: 'c', relevance: [], metadata: { creatorKey: null, firstPublishedAt: null } },
    ],
    asOf
  )
  expect(result.orderedKeys).toEqual(['a', 'b', 'c'])
  expect(Object.keys(result.reasons)).not.toContain('')
})

test('configuration fingerprint is canonical and invalid configuration falls back to defaults', () => {
  expect(BLUEPRINT_RANKING_ALGORITHM_VERSION).toBe('blueprint-baseline-v2')
  expect(BLUEPRINT_RANKING_CONFIG.version).toBe('blueprint-baseline-v2')
  expect(BLUEPRINT_RANKING_CONFIG_FINGERPRINT).toMatch(/^[a-f0-9]{64}$/)
  expect(
    configurationFingerprint({
      ...BLUEPRINT_RANKING_CONFIG,
      editorialPriorities: { birthday: 20, wedding: 30, thanksgiving: 10 },
    })
  ).toBe(BLUEPRINT_RANKING_CONFIG_FINGERPRINT)

  const invalid = {
    ...BLUEPRINT_RANKING_CONFIG,
    newItemShare: 2,
  } as BlueprintRankingConfig
  expect(isValidBlueprintRankingConfig(invalid)).toBe(false)
  const candidates = [
    { catalogKey: 'z', relevance: [] },
    { catalogKey: 'wedding', relevance: [] },
  ]
  expect(rankBlueprintRecommendations(candidates, asOf, invalid).orderedKeys).toEqual(
    rankBlueprintRecommendations(candidates, asOf).orderedKeys
  )
})
