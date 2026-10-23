import { expect, test } from 'vitest'
import {
  evaluateBlueprintRanking,
  evaluateRankingOrder,
  type RankingEvaluationCandidate,
} from '@/server/blueprints/services/blueprint-ranking-evaluation'

const asOf = '2026-10-22T12:00:00.000Z'

test('metrics count catalog coverage, duplicate keys, and relevance inversions accurately', () => {
  const candidates: RankingEvaluationCandidate[] = [
    { catalogKey: 'direct', relevance: [0], cohort: 'curated' },
    { catalogKey: 'related', relevance: [1], cohort: 'curated' },
    { catalogKey: 'other', relevance: [2], cohort: 'curated' },
  ]
  const metrics = evaluateRankingOrder(candidates, ['direct', 'other', 'related', 'related'], asOf)
  expect(metrics).toMatchObject({
    itemCount: 4,
    top10: ['direct', 'other', 'related', 'related'],
    top10Coverage: 1,
    duplicateCount: 1,
    relevanceViolations: 2,
    inventoryCreatorConcentration: {
      eligibleAuthoredCount: 0,
      distinctCreators: 0,
      maxCreatorShare: null,
      hhi: null,
    },
    trulyNewTop10Share: 0,
  })
})

test('empty and unknown result keys do not inflate catalog coverage', () => {
  const candidate = [{ catalogKey: 'known', relevance: [], cohort: 'curated' as const }]
  expect(evaluateRankingOrder([], [], asOf).top10Coverage).toBeNull()
  expect(evaluateRankingOrder(candidate, ['unknown'], asOf).top10Coverage).toBe(0)
})

test('top-k coverage counts only unique known keys inside each prefix', () => {
  const candidates = Array.from({ length: 12 }, (_, index) => ({
    catalogKey: `known-${index}`,
    relevance: [],
    cohort: 'curated' as const,
  }))
  const order = [
    ...Array.from({ length: 8 }, (_, index) => `known-${index}`),
    'known-0',
    'unknown',
    'known-8',
    'known-9',
    'known-10',
    'known-11',
  ]
  expect(evaluateRankingOrder(candidates, order, asOf)).toMatchObject({
    top10Coverage: 0.8,
    top20Coverage: 1,
    fullCandidateCoverage: 1,
    duplicateCount: 1,
    unknownKeyCount: 1,
  })
})

test('creator concentration excludes curated entries and omits creator identities', () => {
  const candidates: RankingEvaluationCandidate[] = [
    { catalogKey: 'curated-a', relevance: [], cohort: 'curated' },
    { catalogKey: 'curated-b', relevance: [], cohort: 'curated' },
    {
      catalogKey: 'authored-a',
      relevance: [],
      cohort: 'authored',
      metadata: { creatorKey: 'private-creator-key', firstPublishedAt: '2026-10-20T00:00:00Z' },
    },
    {
      catalogKey: 'authored-b',
      relevance: [],
      cohort: 'authored',
      metadata: { creatorKey: 'private-creator-key', firstPublishedAt: '2026-10-20T00:00:00Z' },
    },
  ]
  const report = evaluateBlueprintRanking(candidates, asOf)
  expect(report.baseline.metrics.inventoryCreatorConcentration).toEqual({
    eligibleAuthoredCount: 2,
    distinctCreators: 1,
    maxCreatorShare: 1,
    hhi: 1,
  })
  expect(JSON.stringify(report)).not.toContain('private-creator-key')
})

test('top-k creator concentration reflects ranking order while inventory concentration stays fixed', () => {
  const candidates: RankingEvaluationCandidate[] = [
    ...Array.from({ length: 11 }, (_, index) => ({
      catalogKey: `a-${index.toString().padStart(2, '0')}`,
      relevance: [],
      cohort: 'authored' as const,
      metadata: { creatorKey: 'creator-a', firstPublishedAt: '2026-07-01T00:00:00.000Z' },
    })),
    {
      catalogKey: 'z-alternative',
      relevance: [],
      cohort: 'authored',
      metadata: { creatorKey: 'creator-b', firstPublishedAt: '2026-07-01T00:00:00.000Z' },
    },
  ]
  const report = evaluateBlueprintRanking(candidates, asOf)
  expect(report.baseline.metrics.inventoryCreatorConcentration).toEqual(
    report.unrankedRelevanceKeyControl.metrics.inventoryCreatorConcentration
  )
  expect(report.baseline.metrics.top10CreatorConcentration.hhi).toBeLessThan(
    report.unrankedRelevanceKeyControl.metrics.top10CreatorConcentration.hhi!
  )
  expect(report.baseline.metrics.authoredTop10Share).toBe(1)
})

test('reports global creator runs separately from runs within one relevance group', () => {
  const candidates: RankingEvaluationCandidate[] = [
    {
      catalogKey: 'first-group',
      relevance: [0],
      cohort: 'authored',
      metadata: { creatorKey: 'same-creator', firstPublishedAt: '2026-07-01T00:00:00.000Z' },
    },
    {
      catalogKey: 'second-group-a',
      relevance: [1],
      cohort: 'authored',
      metadata: { creatorKey: 'same-creator', firstPublishedAt: '2026-07-01T00:00:00.000Z' },
    },
    {
      catalogKey: 'second-group-b',
      relevance: [1],
      cohort: 'authored',
      metadata: { creatorKey: 'same-creator', firstPublishedAt: '2026-07-01T00:00:00.000Z' },
    },
  ]
  const metrics = evaluateRankingOrder(
    candidates,
    ['first-group', 'second-group-a', 'second-group-b'],
    asOf
  )
  expect(metrics.maxConsecutiveAuthoredCreatorRun).toBe(3)
  expect(metrics.maxAuthoredCreatorRunWithinRelevanceGroup).toBe(2)
})

test('new-item shares use authored cohort and a bounded first-publication window', () => {
  const candidates: RankingEvaluationCandidate[] = [
    {
      catalogKey: 'new',
      relevance: [],
      cohort: 'authored',
      metadata: { creatorKey: 'creator-a', firstPublishedAt: '2026-10-20T00:00:00.000Z' },
    },
    {
      catalogKey: 'old',
      relevance: [],
      cohort: 'authored',
      metadata: { creatorKey: 'creator-b', firstPublishedAt: '2026-07-01T00:00:00.000Z' },
    },
    { catalogKey: 'curated', relevance: [], cohort: 'curated' },
  ]
  const metrics = evaluateRankingOrder(candidates, ['new', 'old', 'curated'], asOf)
  expect(metrics.trulyNewTop10Share).toBeCloseTo(1 / 3)
  expect(metrics.inventoryCreatorConcentration.eligibleAuthoredCount).toBe(2)
})

test('active configuration fingerprint agrees with the ranked report', () => {
  const report = evaluateBlueprintRanking([], asOf)
  expect(report.policy.configurationFingerprint).toMatch(/^[a-f0-9]{64}$/)
  expect(report.policy.configurationFingerprint).toBe(report.policy.recomputedFingerprint)
  expect(report.policy.algorithmVersion).toBe('blueprint-baseline-v2')
  expect(report.policy.configurationVersion).toBe('blueprint-baseline-v2')
})

test('promotion preserves ordinary fresh positions and reports only actual promotions', () => {
  const candidates: RankingEvaluationCandidate[] = [
    ...Array.from({ length: 18 }, (_, index) => ({
      catalogKey: `old-${index.toString().padStart(2, '0')}`,
      relevance: [],
      cohort: 'authored' as const,
      metadata: {
        creatorKey: `old-creator-${index}`,
        firstPublishedAt: '2026-07-01T00:00:00.000Z',
      },
    })),
    ...Array.from({ length: 4 }, (_, index) => ({
      catalogKey: `new-${index.toString().padStart(2, '0')}`,
      relevance: [],
      cohort: 'authored' as const,
      metadata: {
        creatorKey: `new-creator-${index}`,
        firstPublishedAt: '2026-10-20T00:00:00.000Z',
      },
    })),
    { catalogKey: 'wedding', relevance: [], cohort: 'curated' as const },
    { catalogKey: 'birthday', relevance: [], cohort: 'curated' as const },
  ]
  const report = evaluateBlueprintRanking(candidates, asOf)
  expect(report.baseline.metrics.trulyNewTop10Share).toBe(0.4)
  expect(report.promotionFreeBaselineControl.metrics.trulyNewTop10Share).toBe(0.4)
  expect(report.baseline.metrics.promotedItemCount).toBe(0)
})

test('small relevance groups accrue no per-group ceiling promotions', () => {
  const candidates = Array.from({ length: 9 }, (_, groupIndex) =>
    Array.from({ length: groupIndex + 1 }, (_, itemIndex) => ({
      catalogKey:
        itemIndex === groupIndex
          ? `z-new-${groupIndex}-${itemIndex}`
          : `a-old-${groupIndex}-${itemIndex}`,
      relevance: [groupIndex],
      cohort: 'authored' as const,
      metadata: {
        creatorKey: `creator-${groupIndex}-${itemIndex}`,
        firstPublishedAt:
          itemIndex === groupIndex ? '2026-10-20T00:00:00.000Z' : '2026-07-01T00:00:00.000Z',
      },
    }))
  ).flat()
  const metrics = evaluateBlueprintRanking(candidates, asOf).baseline.metrics
  expect(metrics.promotedItemCount).toBe(0)
  expect(metrics.promotedItemShare).toBe(0)
})
