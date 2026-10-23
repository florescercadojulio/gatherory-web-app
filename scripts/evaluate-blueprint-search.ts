import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  buildOrphanTargetCatalog,
  buildSearchEvaluationCatalog,
  challengeCases,
  developmentCases,
} from '../tests/fixtures/blueprint-search-evaluation'
import { searchLegacyV1 } from './blueprint-search-legacy-v1'
import { pageBlueprintCatalog } from '../src/server/blueprints/services/blueprint-discovery'

const OUTPUT = resolve('tests/fixtures/blueprint-search-evaluation-report.json')
const SOURCE_SHA256 = '1c606eeec95358e856f3cbd9c394608f2f725407a53331972b5e777017318e18'
const check = process.argv.includes('--check')

function dcg(keys: string[], relevant: Set<string>, at: number) {
  return keys
    .slice(0, at)
    .reduce((sum, key, index) => sum + (relevant.has(key) ? 1 / Math.log2(index + 2) : 0), 0)
}
function metrics(keys: string[], relevantKeys: string[]) {
  const relevant = new Set(relevantKeys.map((key) => key.replaceAll('-', '_')))
  const top = keys.slice(0, 5)
  const first = keys.findIndex((key) => relevant.has(key))
  const ideal = Math.min(relevant.size, 5)
  return {
    precisionAt5: top.filter((key) => relevant.has(key)).length / 5,
    recallAt5: relevant.size ? top.filter((key) => relevant.has(key)).length / relevant.size : null,
    reciprocalRank: relevant.size ? (first < 0 ? 0 : 1 / (first + 1)) : null,
    ndcgAt5: ideal ? dcg(keys, relevant, 5) / dcg([...relevant], relevant, 5) : null,
    returnedCount: keys.length,
    falsePositive: relevant.size === 0 && keys.length > 0,
  }
}
function runCase(
  catalog: ReturnType<typeof buildSearchEvaluationCatalog>,
  scenario: (typeof developmentCases)[number]
) {
  const legacy = searchLegacyV1(catalog.entries, scenario.query)
  const page = pageBlueprintCatalog(catalog, { q: scenario.query, limit: 40 })
  if (!page.ok) throw new Error(`Search failed for ${scenario.id}: ${page.reason}`)
  const candidate = page.page.entries.map(({ catalogKey }) => catalogKey)
  return {
    id: scenario.id,
    query: scenario.query,
    family: scenario.family,
    relevant: scenario.relevant,
    legacy: { top5: legacy.slice(0, 5), metrics: metrics(legacy, scenario.relevant) },
    candidate: { top5: candidate.slice(0, 5), metrics: metrics(candidate, scenario.relevant) },
    candidateOnly: candidate.filter((key) => !legacy.includes(key)),
    legacyOnly: legacy.filter((key) => !candidate.includes(key)),
  }
}
function allPages(
  catalog: ReturnType<typeof buildSearchEvaluationCatalog>,
  limit: number,
  query = ''
) {
  const keys: string[] = []
  let cursor: string | undefined
  for (let count = 0; count < catalog.entries.length + 1; count++) {
    const page = pageBlueprintCatalog(catalog, {
      q: query,
      limit,
      ...(cursor ? { cursor } : {}),
    })
    if (!page.ok) throw new Error(`Paging failed: ${page.reason}`)
    keys.push(...page.page.entries.map(({ catalogKey }) => catalogKey))
    cursor = page.page.nextCursor
    if (!cursor) return keys
  }
  throw new Error('Paging failed to terminate')
}
function buildReport() {
  const catalog = buildSearchEvaluationCatalog()
  const development = developmentCases.map((scenario) => runCase(catalog, scenario))
  const challenge = challengeCases.map((scenario) => runCase(catalog, scenario))
  const positiveRows = (rows: typeof development) => rows.filter((row) => row.relevant.length > 0)
  const aggregate = (rows: typeof development, system: 'legacy' | 'candidate') => {
    const positives = positiveRows(rows)
    return Object.fromEntries(
      ['precisionAt5', 'recallAt5', 'reciprocalRank', 'ndcgAt5'].map((key) => [
        key,
        Number(
          (
            positives.reduce(
              (sum, row) =>
                sum + Number(row[system].metrics[key as keyof typeof row.candidate.metrics]),
              0
            ) / positives.length
          ).toFixed(4)
        ),
      ])
    )
  }
  const negativeQueryMetrics = (rows: typeof development, system: 'legacy' | 'candidate') => {
    const negatives = rows.filter((row) => row.relevant.length === 0)
    const falsePositiveCount = negatives.filter((row) => row[system].metrics.falsePositive).length
    return {
      queryCount: negatives.length,
      falsePositiveCount,
      falsePositiveRate: negatives.length
        ? Number((falsePositiveCount / negatives.length).toFixed(4))
        : null,
    }
  }
  const compareMetrics = (rows: typeof development) =>
    Object.fromEntries(
      ['precisionAt5', 'recallAt5', 'reciprocalRank', 'ndcgAt5'].map((key) => [
        key,
        Number(
          (
            Number(aggregate(rows, 'candidate')[key]) - Number(aggregate(rows, 'legacy')[key])
          ).toFixed(4)
        ),
      ])
    )
  const paged = [1, 2, 3, 5].map((size) => ({ pageSize: size, keys: allPages(catalog, size) }))
  const pagingStable = paged.every(
    ({ keys }) => JSON.stringify(keys) === JSON.stringify(paged[0]!.keys)
  )
  const searchPaged = [1, 2, 3, 5].map((size) => ({
    pageSize: size,
    keys: allPages(catalog, size, 'outdoors wedding'),
  }))
  const searchPagingStable = searchPaged.every(
    ({ keys }) => JSON.stringify(keys) === JSON.stringify(searchPaged[0]!.keys)
  )
  return {
    formatVersion: 1,
    purpose:
      'Deterministic, hand-judged offline fixture comparison. These small authored cases do not estimate universal or production search uplift.',
    challengeSetStatus:
      'The separately named challenge queries were reviewed during matcher tuning; they are not a blind held-out estimate.',
    metricsMethod:
      'Precision@5 uses a fixed denominator of 5 (unfilled result slots count as misses). Precision@5, recall@5, MRR, and nDCG@5 macro averages include only cases with at least one judged relevant item. Empty-judgment cases are reported separately as negative-query false-positive counts and rates.',
    frozenLegacySource: {
      path: '/tmp/gatherory-search-v1-source.ts',
      sha256: SOURCE_SHA256,
      copiedScorer: 'scripts/blueprint-search-legacy-v1.ts',
    },
    candidate: 'pageBlueprintCatalog from current workspace source; unranked catalog search',
    corpus: {
      count: catalog.entries.length,
      keys: catalog.entries.map(({ catalogKey }) => catalogKey),
    },
    development: {
      caseCount: development.length,
      positiveRelevanceCaseCount: positiveRows(development).length,
      negativeQueryMetrics: {
        legacy: negativeQueryMetrics(development, 'legacy'),
        candidate: negativeQueryMetrics(development, 'candidate'),
      },
      meanLegacyMetrics: aggregate(development, 'legacy'),
      meanCandidateMetrics: aggregate(development, 'candidate'),
      candidateDelta: compareMetrics(development),
      cases: development,
    },
    freshChallenge: {
      interpretation:
        'Tuning-reviewed challenge cases, included to expose regressions and current gaps; not blind held-out evidence.',
      caseCount: challenge.length,
      positiveRelevanceCaseCount: positiveRows(challenge).length,
      negativeQueryMetrics: {
        legacy: negativeQueryMetrics(challenge, 'legacy'),
        candidate: negativeQueryMetrics(challenge, 'candidate'),
      },
      meanLegacyMetrics: aggregate(challenge, 'legacy'),
      meanCandidateMetrics: aggregate(challenge, 'candidate'),
      candidateDelta: compareMetrics(challenge),
      cases: challenge,
    },
    safety: {
      orphanTargetIdeaNotSearchable: (() => {
        const result = pageBlueprintCatalog(buildOrphanTargetCatalog(), {
          q: 'wedding venue',
          limit: 40,
        })
        return result.ok && result.page.entries.length === 0
      })(),
      orphanFixtureRejectedByPublicBrowseResponse: (() => {
        try {
          pageBlueprintCatalog(buildOrphanTargetCatalog(), { q: '', limit: 40 })
          return false
        } catch {
          return true
        }
      })(),
      shortQueryHasNoFuzzyExpansion: !runCase(catalog, {
        id: 'short',
        query: 'wed',
        relevant: [],
        family: 'safety',
      }).candidate.top5.length,
      pagingStableAcrossSizes: pagingStable,
      pagingUnique: new Set(paged[0]!.keys).size === catalog.entries.length,
      nonemptySearchPagingStableAcrossSizes: searchPagingStable,
      nonemptySearchPagingUnique:
        new Set(searchPaged[0]!.keys).size === searchPaged[0]!.keys.length,
      pageSizes: paged.map(({ pageSize }) => pageSize),
      searchPageSizes: searchPaged.map(({ pageSize }) => pageSize),
    },
    limitations: [
      'Hand-authored synthetic catalog, not deployed inventory or traffic.',
      'Relevance judgments are local to this fixture and require human review.',
      'Mean metrics combine diverse query families and can hide individual regressions.',
      'Empty-judgment negative cases are excluded from relevance metric averages and summarized with false-positive rates.',
      'The legacy scorer is a frozen source-derived comparator; fixture data is shared by both systems.',
      'Orphan child-target fixture is rejected by public response validation; this does not test private or draft authorization.',
    ],
  }
}

const report = `${JSON.stringify(buildReport(), null, 2)}\n`
if (check) {
  const existing = await readFile(OUTPUT, 'utf8').catch(() => '')
  if (existing !== report) {
    console.error(
      `${OUTPUT} is stale. Run pnpm tsx scripts/evaluate-blueprint-search.ts to refresh it.`
    )
    process.exitCode = 1
  }
} else {
  await writeFile(OUTPUT, report)
  console.log(`Wrote ${OUTPUT}`)
}
