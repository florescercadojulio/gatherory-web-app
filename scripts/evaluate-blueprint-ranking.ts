import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { blueprintStarters } from '../src/server/blueprints/catalog/starters'
import {
  buildBlueprintCatalog,
  pageBlueprintCatalog,
} from '../src/server/blueprints/services/blueprint-discovery'
import {
  evaluateBlueprintRanking,
  type RankingEvaluationCandidate,
} from '../src/server/blueprints/services/blueprint-ranking-evaluation'
import {
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
} from '../src/server/blueprints/services/blueprint-ranking'

const AS_OF = '2026-10-22T12:00:00.000Z'
const SYNTHETIC_SCENARIO_VERSION = 'blueprint-ranking-offline-v2'
const ARTIFACT_PATH = resolve(
  'docs/roadmaps/blueprint-ranking-roadmap/artifacts/baseline-evaluation.json'
)
const check = process.argv.includes('--check')

function authored(
  catalogKey: string,
  creatorKey: string,
  firstPublishedAt = '2026-10-18T12:00:00.000Z',
  relevance: number[] = []
): RankingEvaluationCandidate {
  return {
    catalogKey,
    relevance,
    cohort: 'authored',
    metadata: { creatorKey, firstPublishedAt },
  }
}

function syntheticScenarios(): Record<string, RankingEvaluationCandidate[]> {
  const repeatedCreators = [
    ...Array.from({ length: 30 }, (_, index) =>
      authored(`creator-a-${index.toString().padStart(2, '0')}`, 'synthetic-creator-a')
    ),
    ...Array.from({ length: 8 }, (_, index) =>
      authored(`creator-b-${index.toString().padStart(2, '0')}`, 'synthetic-creator-b')
    ),
  ]
  const singleCreator = Array.from({ length: 7 }, (_, index) =>
    authored(`single-${index.toString().padStart(2, '0')}`, 'synthetic-only-creator')
  )
  const smallRelevanceGroups = Array.from({ length: 9 }, (_, groupIndex) =>
    Array.from({ length: groupIndex + 1 }, (_, index) => {
      const ordinal = index + 1
      return authored(
        `group-${groupIndex + 1}-${ordinal}`,
        `synthetic-small-${groupIndex + 1}-${ordinal}`,
        '2026-10-20T12:00:00.000Z',
        [groupIndex]
      )
    })
  ).flat()
  const newItemComparison = [
    ...Array.from({ length: 18 }, (_, index) =>
      authored(
        `old-${index.toString().padStart(2, '0')}`,
        `synthetic-old-${index}`,
        '2026-07-01T00:00:00.000Z'
      )
    ),
    ...Array.from({ length: 4 }, (_, index) =>
      authored(`new-${index.toString().padStart(2, '0')}`, `synthetic-new-${index}`)
    ),
    { catalogKey: 'wedding', relevance: [], cohort: 'curated' as const },
    { catalogKey: 'birthday', relevance: [], cohort: 'curated' as const },
  ]
  const overlookedRecentPromotion = [
    ...Array.from({ length: 18 }, (_, index) =>
      authored(
        `old-${index.toString().padStart(2, '0')}`,
        `synthetic-promotion-old-${index}`,
        '2026-07-01T00:00:00.000Z'
      )
    ),
    ...Array.from({ length: 4 }, (_, index) =>
      authored(
        `z-new-${index.toString().padStart(2, '0')}`,
        `synthetic-promotion-new-${index}`,
        '2026-10-20T12:00:00.000Z'
      )
    ),
  ]
  const relevanceBarriers = [
    { catalogKey: 'wedding', relevance: [2], cohort: 'curated' as const },
    authored('a-direct-match', 'synthetic-direct', '2026-10-20T12:00:00.000Z', [0]),
    authored('z-related-match', 'synthetic-related', '2026-10-20T12:00:00.000Z', [1]),
    { catalogKey: 'birthday', relevance: [0], cohort: 'curated' as const },
  ]
  const crossGroupCreatorCapReset = [
    authored('a-group-one', 'synthetic-repeat', '2026-07-01T00:00:00.000Z', [0]),
    authored('b-group-one', 'synthetic-repeat', '2026-07-01T00:00:00.000Z', [0]),
    authored('c-group-one', 'synthetic-repeat', '2026-07-01T00:00:00.000Z', [0]),
    authored('d-group-one', 'synthetic-alternative', '2026-07-01T00:00:00.000Z', [0]),
    authored('e-group-two', 'synthetic-repeat', '2026-07-01T00:00:00.000Z', [1]),
    authored('f-group-two', 'synthetic-repeat', '2026-07-01T00:00:00.000Z', [1]),
  ]
  const dailyRotation = Array.from({ length: 60 }, (_, index) =>
    authored(`daily-${index.toString().padStart(2, '0')}`, `synthetic-daily-${index}`)
  )
  return {
    repeatedCreatorInventory: repeatedCreators,
    sparseSingleCreatorInventory: singleCreator,
    smallRelevanceGroups: smallRelevanceGroups,
    newItemVsEditorialAndCatalogControl: newItemComparison,
    overlookedRecentPromotion,
    equalRelevanceBarriers: relevanceBarriers,
    creatorRunResetsAtRelevanceGroup: crossGroupCreatorCapReset,
    utcDayTieStability: dailyRotation,
  }
}

async function traversePages(limit: number) {
  const catalog = buildBlueprintCatalog(blueprintStarters)
  const ordered: string[] = []
  let cursor: string | undefined
  let pageCount = 0
  do {
    const result = pageBlueprintCatalog(
      catalog,
      { limit, q: '', ranking: 'baseline_v1', ...(cursor ? { cursor } : {}) },
      'offline-evaluation-actor',
      { now: new Date(AS_OF) }
    )
    if (!result.ok) throw new Error(`Unexpected page failure for limit ${limit}: ${result.reason}`)
    if (result.page.ranking?.mode !== 'baseline_v1')
      throw new Error(`Expected baseline_v1 mode for limit ${limit}`)
    ordered.push(...result.page.entries.map(({ catalogKey }) => catalogKey))
    cursor = result.page.nextCursor
    pageCount++
    if (pageCount > catalog.entries.length + 1) throw new Error('Paging did not terminate')
  } while (cursor)
  return {
    pageSize: limit,
    pageCount,
    itemCount: ordered.length,
    duplicateCount: ordered.length - new Set(ordered).size,
    complete:
      ordered.length === catalog.entries.length && new Set(ordered).size === catalog.entries.length,
    orderedKeys: ordered,
  }
}

function evaluateActualCatalogRequest(
  catalog: ReturnType<typeof buildBlueprintCatalog>,
  request: { q: string; category?: 'weddings' }
) {
  const pageRequest = { ...request, limit: 20, ranking: 'baseline_v1' as const }
  const baseline = pageBlueprintCatalog(catalog, pageRequest, 'offline-evaluation-actor', {
    now: new Date(AS_OF),
  })
  const control = pageBlueprintCatalog(catalog, pageRequest, 'offline-evaluation-actor', {
    now: new Date(AS_OF),
    enabled: false,
  })
  if (!baseline.ok || !control.ok)
    throw new Error(`Unexpected curated query failure for ${JSON.stringify(request)}`)
  const baselineKeys = baseline.page.entries.map(({ catalogKey }) => catalogKey)
  const controlKeys = control.page.entries.map(({ catalogKey }) => catalogKey)
  return {
    itemCount: baselineKeys.length,
    baselineMode: baseline.page.ranking?.mode,
    controlMode: control.page.ranking?.mode,
    baselineTop10: baselineKeys.slice(0, 10),
    baselineTop20: baselineKeys.slice(0, 20),
    unrankedRelevanceKeyTop10: controlKeys.slice(0, 10),
    unrankedRelevanceKeyTop20: controlKeys.slice(0, 20),
    baselineDiffersFromControl: JSON.stringify(baselineKeys) !== JSON.stringify(controlKeys),
    baselineDuplicateCount: baselineKeys.length - new Set(baselineKeys).size,
    controlDuplicateCount: controlKeys.length - new Set(controlKeys).size,
    baselineHasNextPage: Boolean(baseline.page.nextCursor),
    controlHasNextPage: Boolean(control.page.nextCursor),
  }
}

function buildArtifact() {
  const curatedCatalog = buildBlueprintCatalog(blueprintStarters)
  const curatedCandidates: RankingEvaluationCandidate[] = curatedCatalog.entries.map((entry) => ({
    catalogKey: entry.catalogKey,
    relevance: [],
    cohort: 'curated',
  }))
  const synthetic = syntheticScenarios()
  const syntheticReports = Object.fromEntries(
    Object.entries(synthetic).map(([name, candidates]) => [
      name,
      evaluateBlueprintRanking(candidates, AS_OF),
    ])
  )
  const daily = synthetic.utcDayTieStability!
  const dayTwo = evaluateBlueprintRanking(daily, '2026-10-23T12:00:00.000Z')
  const dayOneOrder = syntheticReports.utcDayTieStability!.baseline.metrics.top20
  const dayTwoOrder = dayTwo.baseline.metrics.top20
  const pageSizes = [1, 2, 3, 7, 20].map((limit) => limit)
  const firstPage = pageBlueprintCatalog(
    curatedCatalog,
    { limit: 1, q: '', ranking: 'baseline_v1' },
    'offline-evaluation-actor',
    { now: new Date(AS_OF) }
  )
  if (!firstPage.ok) throw new Error(`Unexpected first page failure: ${firstPage.reason}`)
  const activeConfig = firstPage.page.ranking
  const traversals = pageSizes.map((pageSize) => ({ pageSize, result: undefined as unknown }))

  return {
    formatVersion: 2,
    purpose:
      'Offline deterministic policy evaluation; not simulated traffic, production inventory, or an uplift estimate.',
    asOf: AS_OF,
    syntheticScenarioVersion: SYNTHETIC_SCENARIO_VERSION,
    activePolicy: {
      algorithmVersion: BLUEPRINT_RANKING_ALGORITHM_VERSION,
      configurationVersion: activeConfig?.configurationVersion,
      configurationFingerprint: BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
      mode: activeConfig?.mode,
    },
    actualRepositoryCuratedCatalog: {
      fixtureLabel:
        'Repository curated starter fixtures; not a claim about the deployed or production inventory.',
      itemCount: curatedCandidates.length,
      catalogKeys: curatedCandidates.map(({ catalogKey }) => catalogKey),
      comparison: evaluateBlueprintRanking(curatedCandidates, AS_OF),
      actualSearchAndCategoryRequests: {
        method:
          'pageBlueprintCatalog with ranking enabled and with enabled:false; search relevance is computed by repository searchRank.',
        requests: {
          outdoors: evaluateActualCatalogRequest(curatedCatalog, { q: 'outdoors' }),
          wedding: evaluateActualCatalogRequest(curatedCatalog, { q: 'wedding' }),
          picnic: evaluateActualCatalogRequest(curatedCatalog, { q: 'picnic' }),
          weddingsCategory: evaluateActualCatalogRequest(curatedCatalog, {
            q: '',
            category: 'weddings',
          }),
        },
      },
      pageSizes: pageSizes.map((limit) => limit),
    },
    syntheticAuthoredScenarios: {
      definitions: {
        repeatedCreatorInventory:
          '30 items from one creator and 8 from another, all published within the 30-day window.',
        sparseSingleCreatorInventory:
          'Seven recent authored items from one creator; demonstrates soft-cap relaxation.',
        smallRelevanceGroups:
          'Nine relevance groups sized one through nine, all authored items recent.',
        newItemVsEditorialAndCatalogControl:
          '18 old authored items, 4 new authored items, and curated wedding/birthday entries in one relevance group.',
        overlookedRecentPromotion:
          '18 old authored items sort ahead of four recent authored items; cumulative global milestones may promote a recent item over older items without demoting any recent item from its ordinary position.',
        equalRelevanceBarriers:
          'Direct [0], related [1], and less relevant [2] vectors with editorial keys across groups.',
        creatorRunResetsAtRelevanceGroup:
          'The same creator spans adjacent relevance groups to test cap scope.',
        utcDayTieStability:
          '60 eligible recent authored items; order remains stable across adjacent UTC days without rotating or holding recent items.',
      },
      evaluations: syntheticReports,
      previousBaselineV1Finding: {
        provenance:
          'Historical offline result recorded in slice 05 before this version; it is carried forward as a prior fixture finding and is not recomputed by the current policy.',
        oldPolicy: {
          algorithmVersion: 'blueprint-baseline-v1',
          newItemVsEditorialAndCatalogControl: {
            baselineTrulyNewTop10Share: 0.2,
            editorialAndCatalogControlTrulyNewTop10Share: 0.4,
            reservedRanks: [10, 20, 24],
          },
        },
        currentPolicyOnSameNamedScenario: {
          algorithmVersion: BLUEPRINT_RANKING_ALGORITHM_VERSION,
          baselineTrulyNewTop10Share:
            syntheticReports.newItemVsEditorialAndCatalogControl!.baseline.metrics
              .trulyNewTop10Share,
          promotionFreeControlTrulyNewTop10Share:
            syntheticReports.newItemVsEditorialAndCatalogControl!.promotionFreeBaselineControl
              .metrics.trulyNewTop10Share,
          promotedItemCount:
            syntheticReports.newItemVsEditorialAndCatalogControl!.baseline.metrics
              .promotedItemCount,
        },
      },
      utcDayTieStability: {
        dayOne: '2026-10-22',
        dayTwo: '2026-10-23',
        sameTop20Order: JSON.stringify(dayOneOrder) === JSON.stringify(dayTwoOrder),
        perDayRotation: false,
      },
    },
    paging: {
      mode: 'baseline_v1',
      asOf: activeConfig?.asOf,
      snapshotId: firstPage.snapshotId,
      traversals,
      stableOrderAcrossPageSizes: false,
    },
  }
}

async function main() {
  const artifact = buildArtifact() as ReturnType<typeof buildArtifact> & {
    paging: { traversals: { pageSize: number; result?: unknown }[] }
  }
  for (const traversal of artifact.paging.traversals)
    traversal.result = await traversePages(traversal.pageSize)
  const pageOrders = artifact.paging.traversals.map(
    ({ result }) => (result as Awaited<ReturnType<typeof traversePages>>).orderedKeys
  )
  artifact.paging.stableOrderAcrossPageSizes = pageOrders.every(
    (keys) => JSON.stringify(keys) === JSON.stringify(pageOrders[0])
  )
  const json = `${JSON.stringify(artifact, null, 2)}\n`
  if (check) {
    const existing = await readFile(ARTIFACT_PATH, 'utf8')
    if (existing !== json) throw new Error(`${ARTIFACT_PATH} is stale; rerun without --check`)
  } else {
    await mkdir(dirname(ARTIFACT_PATH), { recursive: true })
    await writeFile(ARTIFACT_PATH, json)
  }
  const baseline = artifact.actualRepositoryCuratedCatalog.comparison.baseline.metrics
  const syntheticCount = Object.keys(artifact.syntheticAuthoredScenarios.evaluations).length
  process.stdout.write(
    `${JSON.stringify({
      artifact: ARTIFACT_PATH,
      mode: artifact.activePolicy.mode,
      algorithmVersion: artifact.activePolicy.algorithmVersion,
      configurationVersion: artifact.activePolicy.configurationVersion,
      curatedFixtureCount: artifact.actualRepositoryCuratedCatalog.itemCount,
      curatedTop10: baseline.top10,
      syntheticScenarios: syntheticCount,
      pagingSizes: artifact.paging.traversals.map(({ pageSize, result }) => ({
        pageSize,
        complete: (result as { complete: boolean }).complete,
        duplicates: (result as { duplicateCount: number }).duplicateCount,
      })),
      bytes: Buffer.byteLength(json),
      check,
    })}\n`
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
