import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { blueprintStarters } from '../src/server/blueprints/catalog/starters'
import {
  buildBlueprintCatalog,
  blueprintLikeAffinitySources,
  pageBlueprintCatalog,
} from '../src/server/blueprints/services/blueprint-discovery'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION,
  buildBlueprintLikeAffinity,
  type BlueprintLikeAffinityLike,
  type BlueprintLikeAffinitySource,
} from '../tests/fixtures/blueprint-like-affinity-v2-initial'
import {
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
  rankBlueprintRecommendations,
  type BlueprintRankingCandidate,
} from '../src/server/blueprints/services/blueprint-ranking'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT as V1_POLICY_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION as V1_POLICY_VERSION,
  buildBlueprintLikeAffinity as buildV1Affinity,
  type BlueprintLikeAffinityLike as V1Like,
  type BlueprintLikeAffinitySource as V1Source,
} from '../tests/fixtures/blueprint-like-affinity-v1'
import {
  PERSONAL_LIKE_DEVELOPMENT_LOCK,
  PERSONAL_LIKE_DEVELOPMENT_PAIRS,
  PERSONAL_LIKE_DEVELOPMENT_PLANS,
  PERSONAL_LIKE_DEVELOPMENT_SEEDS,
} from '../tests/fixtures/blueprint-personal-like-development'
import {
  PERSONAL_LIKE_HELDOUT_LOCK,
  PERSONAL_LIKE_HELDOUT_PAIRS,
  PERSONAL_LIKE_HELDOUT_PLANS,
  PERSONAL_LIKE_HELDOUT_SEEDS,
} from '../tests/fixtures/blueprint-personal-like-heldout'

const AS_OF = '2026-10-22T12:00:00.000Z'
const FORMAT_VERSION = 1
const FROZEN_DEVELOPMENT_LOCK = '31309b41556e52ddb5a6a1121b1150780eb012aadd5787192bc048b4bc74ca7b'
const FROZEN_HELDOUT_LOCK = 'b8bab4bb4f69e6ceacb12cca33e44ae2f5a1cbaa95f5ddf0e35a7f07bc5493cc'
const ARTIFACT_PATH = resolve(
  'docs/roadmaps/blueprint-ranking-roadmap/artifacts/personal-like-tuning-evaluation.json'
)
const check = process.argv.includes('--check')

type PolicyName = 'baseline' | 'frozenV1' | 'roleAwareV2'
type PersonalLikeJudgment = 'relevant' | 'ambiguous' | 'unrelated'
type PersonalLikeFixturePlan = {
  catalogKey: string
  revision: number
  contentHash: string
  name: string
  summary: string
  eventTitles: string[]
  ideaTitles: string[]
  ideaNotes: string[]
  creatorKey: string
  firstPublishedAt: string
  language: 'en' | 'es' | 'mixed' | 'und'
  intentFamily: string
  split: 'development' | 'heldout'
}
type PersonalLikeFixturePair = {
  split: 'development' | 'heldout'
  seedKey: string
  candidateKey: string
  judgment: PersonalLikeJudgment
}
type FixtureSet = {
  split: 'development' | 'heldout'
  plans: readonly PersonalLikeFixturePlan[]
  pairs: readonly PersonalLikeFixturePair[]
  seeds: Readonly<Record<string, string>>
  lock: string
}

const development: FixtureSet = {
  split: 'development',
  plans: PERSONAL_LIKE_DEVELOPMENT_PLANS,
  pairs: PERSONAL_LIKE_DEVELOPMENT_PAIRS,
  seeds: PERSONAL_LIKE_DEVELOPMENT_SEEDS,
  lock: PERSONAL_LIKE_DEVELOPMENT_LOCK,
}
const heldout: FixtureSet = {
  split: 'heldout',
  plans: PERSONAL_LIKE_HELDOUT_PLANS,
  pairs: PERSONAL_LIKE_HELDOUT_PAIRS,
  seeds: PERSONAL_LIKE_HELDOUT_SEEDS,
  lock: PERSONAL_LIKE_HELDOUT_LOCK,
}

function sourcesFor(plans: readonly PersonalLikeFixturePlan[]): BlueprintLikeAffinitySource[] {
  return plans.map((plan) => ({
    catalogKey: plan.catalogKey,
    revision: plan.revision,
    contentHash: plan.contentHash,
    // This is the legacy role-flattening used by v1; v2 deliberately ignores it.
    publicText: [
      plan.name,
      plan.summary,
      ...plan.eventTitles,
      ...plan.ideaTitles,
      ...plan.ideaNotes,
    ],
    name: plan.name,
    summary: plan.summary,
    eventTitles: plan.eventTitles,
    ideaTitles: plan.ideaTitles,
    ideaNotes: plan.ideaNotes,
  }))
}

function v1SourcesFor(plans: readonly PersonalLikeFixturePlan[]): V1Source[] {
  return plans.map((plan) => ({
    catalogKey: plan.catalogKey,
    revision: plan.revision,
    contentHash: plan.contentHash,
    publicText: [
      plan.name,
      plan.summary,
      ...plan.eventTitles,
      ...plan.ideaTitles,
      ...plan.ideaNotes,
    ],
  }))
}

function exactLike(source: {
  catalogKey: string
  revision: number
  contentHash: string
}): BlueprintLikeAffinityLike {
  return {
    catalogKey: source.catalogKey,
    liked: true,
    likeRevision: source.revision,
    likeContentHash: source.contentHash,
  }
}

function exactV1Like(source: V1Source): V1Like {
  return {
    catalogKey: source.catalogKey,
    liked: true,
    likeRevision: source.revision,
    likeContentHash: source.contentHash,
  }
}

function rankingCandidates(plans: readonly PersonalLikeFixturePlan[]): BlueprintRankingCandidate[] {
  return plans.map((plan) => ({
    catalogKey: plan.catalogKey,
    relevance: [],
    metadata: { creatorKey: plan.creatorKey, firstPublishedAt: plan.firstPublishedAt },
  }))
}

function rounded(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(4))
}

function evaluateBinary(
  pairs: readonly PersonalLikeFixturePair[],
  scoreByPair: ReadonlyMap<string, number>
) {
  const scored = pairs.map((pair) => ({
    ...pair,
    score: scoreByPair.get(`${pair.seedKey}\u0000${pair.candidateKey}`) ?? 0,
  }))
  const predicted = scored.filter((pair) => pair.score > 0)
  const relevantCount = scored.filter((pair) => pair.judgment === 'relevant').length
  const unrelatedCount = scored.filter((pair) => pair.judgment === 'unrelated').length
  const ambiguousCount = scored.filter((pair) => pair.judgment === 'ambiguous').length
  const truePositiveCount = predicted.filter((pair) => pair.judgment === 'relevant').length
  const falsePositiveCount = predicted.filter((pair) => pair.judgment === 'unrelated').length
  const ambiguousPredictionCount = predicted.filter((pair) => pair.judgment === 'ambiguous').length
  const bins = [
    { range: '[0, 0.05)', min: 0, max: 0.05, includeMax: false },
    { range: '[0.05, 0.5)', min: 0.05, max: 0.5, includeMax: false },
    { range: '[0.5, 1)', min: 0.5, max: 1, includeMax: false },
    { range: '[1, 2)', min: 1, max: 2, includeMax: false },
    { range: '[2, 3]', min: 2, max: 3, includeMax: true },
  ].map((bin) => ({
    range: bin.range,
    pairCount: scored.filter(
      ({ score }) => score >= bin.min && (bin.includeMax ? score <= bin.max : score < bin.max)
    ).length,
  }))
  return {
    pairCount: scored.length,
    relevantLabelCount: relevantCount,
    unrelatedLabelCount: unrelatedCount,
    ambiguousLabelCount: ambiguousCount,
    predictedPairCount: predicted.length,
    truePositiveCount,
    falsePositiveCount,
    ambiguousPredictionCount,
    strictPrecision: rounded(truePositiveCount, truePositiveCount + falsePositiveCount),
    conservativePrecisionCountingAmbiguousAsFalse: rounded(truePositiveCount, predicted.length),
    strictRecall: rounded(truePositiveCount, relevantCount),
    falsePositiveRate: rounded(falsePositiveCount, unrelatedCount),
    labeledPairEvaluationCoverage: rounded(scored.length, pairs.length),
    positiveMatchShare: rounded(predicted.length, pairs.length),
    seedCountWithNoPredictionInSubset: [...new Set(pairs.map((pair) => pair.seedKey))].filter(
      (seedKey) => !scored.some((pair) => pair.seedKey === seedKey && pair.score > 0)
    ).length,
    scoreBins: bins,
  }
}

function languageBreakdown(
  plans: readonly PersonalLikeFixturePlan[],
  pairs: readonly PersonalLikeFixturePair[],
  scores: ReadonlyMap<string, number>
) {
  const languageByKey = new Map(plans.map((plan) => [plan.catalogKey, plan.language]))
  return Object.fromEntries(
    (['en', 'es', 'mixed', 'und'] as const).map((language) => {
      const subset = pairs.filter((pair) => languageByKey.get(pair.candidateKey) === language)
      return [
        language,
        evaluateBinary(
          subset,
          new Map(
            subset.map((pair) => [
              `${pair.seedKey}\u0000${pair.candidateKey}`,
              scores.get(`${pair.seedKey}\u0000${pair.candidateKey}`) ?? 0,
            ])
          )
        ),
      ]
    })
  )
}

function creatorSummary(plans: readonly PersonalLikeFixturePlan[], keys: readonly string[]) {
  const planByKey = new Map(plans.map((plan) => [plan.catalogKey, plan]))
  const counts = new Map<string, number>()
  const recentCutoff = Date.parse(AS_OF) - 30 * 86_400_000
  let recentCount = 0
  for (const key of keys) {
    const plan = planByKey.get(key)
    if (!plan) continue
    counts.set(plan.creatorKey, (counts.get(plan.creatorKey) ?? 0) + 1)
    const published = Date.parse(plan.firstPublishedAt)
    if (published > recentCutoff && published <= Date.parse(AS_OF)) recentCount++
  }
  const denominator = keys.length
  const creatorCount = [...counts.values()].reduce((sum, count) => sum + count, 0)
  return {
    creatorCount,
    distinctCreators: counts.size,
    maxCreatorShare: rounded(Math.max(0, ...counts.values()), creatorCount),
    hhi:
      creatorCount === 0
        ? null
        : Number(
            [...counts.values()]
              .reduce((sum, count) => sum + (count / creatorCount) ** 2, 0)
              .toFixed(4)
          ),
    recentItemShare: rounded(recentCount, denominator),
  }
}

function rankingMetrics(
  fixture: FixtureSet,
  seedKey: string,
  policy: PolicyName,
  scores: Readonly<Record<string, number>>
) {
  const plans = fixture.plans
  const candidates = rankingCandidates(plans).filter(
    (candidate) => candidate.catalogKey !== seedKey
  )
  const baseline = rankBlueprintRecommendations(candidates, AS_OF)
  const ordered =
    policy === 'baseline'
      ? baseline.orderedKeys
      : rankBlueprintRecommendations(candidates, AS_OF, undefined, scores).orderedKeys
  const labelByCandidate = new Map(
    fixture.pairs
      .filter((pair) => pair.seedKey === seedKey)
      .map((pair) => [pair.candidateKey, pair.judgment])
  )
  const resultAtK = (k: number) => {
    const keys = ordered.slice(0, k)
    const judgments = keys
      .map((key) => labelByCandidate.get(key))
      .filter(Boolean) as PersonalLikeJudgment[]
    const relevant = judgments.filter((value) => value === 'relevant').length
    const unrelated = judgments.filter((value) => value === 'unrelated').length
    const ambiguous = judgments.filter((value) => value === 'ambiguous').length
    return {
      k: keys.length,
      precisionRelevantOnly: rounded(relevant, keys.length),
      relevantCount: relevant,
      unrelatedCount: unrelated,
      ambiguousCount: ambiguous,
      conservativePrecision: rounded(relevant, keys.length),
      creatorDiversity: creatorSummary(plans, keys),
    }
  }
  const baselineTop10 = baseline.orderedKeys.slice(0, 10)
  const top10 = ordered.slice(0, 10)
  const baselineSet = new Set(baselineTop10)
  const top10Set = new Set(top10)
  return {
    orderedKeys: ordered,
    pairwiseRelevanceViolations: 0,
    top10MembershipChanges: baselineTop10.filter((key) => !top10Set.has(key)).length,
    top10OrderChangedPositions: baselineTop10.filter((key, index) => top10[index] !== key).length,
    top10MembershipOverlap: baselineTop10.filter((key) => top10Set.has(key)).length,
    topK: [1, 3, 5, 10, 20].map(resultAtK),
    baselineTop10MembershipCount: baselineSet.size,
  }
}

function scoreFixture(fixture: FixtureSet) {
  // Each predeclared split is a separate self-contained evaluation corpus.
  // Its source population is the exact N used by that split's IDF.
  const sourceRows = sourcesFor(fixture.plans)
  const sourceByKey = new Map(sourceRows.map((source) => [source.catalogKey, source]))
  const v1Sources = v1SourcesFor(fixture.plans)
  const v1SourceByKey = new Map(v1Sources.map((source) => [source.catalogKey, source]))
  const scoresByPolicy: Record<PolicyName, Map<string, number>> = {
    baseline: new Map(),
    frozenV1: new Map(),
    roleAwareV2: new Map(),
  }
  const profileRows = []
  for (const seedKey of Object.values(fixture.seeds)) {
    const source = sourceByKey.get(seedKey)
    const oldSource = v1SourceByKey.get(seedKey)
    if (!source || !oldSource) throw new Error(`Fixture seed source missing: ${seedKey}`)
    const v2Result = buildBlueprintLikeAffinity(sourceRows, [exactLike(source)])
    const v1Result = buildV1Affinity(v1Sources, [exactV1Like(oldSource)])
    for (const pair of fixture.pairs.filter((item) => item.seedKey === seedKey)) {
      const key = `${pair.seedKey}\u0000${pair.candidateKey}`
      scoresByPolicy.roleAwareV2.set(key, v2Result.scores[pair.candidateKey] ?? 0)
      scoresByPolicy.frozenV1.set(key, v1Result.scores[pair.candidateKey] ?? 0)
    }
    profileRows.push({
      seedKey,
      seedLanguage:
        fixture.plans.find((plan) => plan.catalogKey === seedKey)?.language ?? 'unknown',
      eligibleSeedCount: v2Result.diagnostics.eligibleLikeCount,
      v2Diagnostic: v2Result.diagnostics,
      rankings: {
        baseline: rankingMetrics(fixture, seedKey, 'baseline', {}),
        frozenV1: rankingMetrics(fixture, seedKey, 'frozenV1', v1Result.scores),
        roleAwareV2: rankingMetrics(fixture, seedKey, 'roleAwareV2', v2Result.scores),
      },
    })
  }
  for (const policy of ['frozenV1', 'roleAwareV2'] as const) {
    // Keep each fixture's full pair universe represented, with explicit zeros.
    for (const pair of fixture.pairs) {
      const key = `${pair.seedKey}\u0000${pair.candidateKey}`
      if (!scoresByPolicy[policy].has(key)) scoresByPolicy[policy].set(key, 0)
    }
  }
  return {
    labelCounts: Object.fromEntries(
      (['relevant', 'ambiguous', 'unrelated'] as const).map((judgment) => [
        judgment,
        fixture.pairs.filter((pair) => pair.judgment === judgment).length,
      ])
    ),
    policies: {
      baseline: {
        note: 'Non-personal baseline has no preference scores; binary affinity precision/recall are not applicable.',
        perSeed: profileRows.map((row) => ({
          seedKey: row.seedKey,
          seedLanguage: row.seedLanguage,
          ...row.rankings.baseline,
        })),
      },
      frozenV1: {
        pairPrediction: evaluateBinary(fixture.pairs, scoresByPolicy.frozenV1),
        candidateLanguageBreakdown: languageBreakdown(
          fixture.plans,
          fixture.pairs,
          scoresByPolicy.frozenV1
        ),
        perSeed: profileRows.map((row) => ({
          seedKey: row.seedKey,
          seedLanguage: row.seedLanguage,
          ...row.rankings.frozenV1,
        })),
      },
      roleAwareV2: {
        pairPrediction: evaluateBinary(fixture.pairs, scoresByPolicy.roleAwareV2),
        candidateLanguageBreakdown: languageBreakdown(
          fixture.plans,
          fixture.pairs,
          scoresByPolicy.roleAwareV2
        ),
        perSeed: profileRows.map((row) => ({
          seedKey: row.seedKey,
          seedLanguage: row.seedLanguage,
          ...row.rankings.roleAwareV2,
        })),
      },
    },
    profileDiagnostics: profileRows.map(
      ({ seedKey, seedLanguage, eligibleSeedCount, v2Diagnostic }) => ({
        seedKey,
        seedLanguage,
        eligibleSeedCount,
        v2Diagnostic,
      })
    ),
  }
}

function exactLikesForCatalog(
  sources: readonly BlueprintLikeAffinitySource[],
  keys: readonly string[]
) {
  const byKey = new Map(sources.map((source) => [source.catalogKey, source]))
  return keys.map((key) => {
    const source = byKey.get(key)
    if (!source) throw new Error(`Unknown catalog fixture seed ${key}`)
    return exactLike(source)
  })
}

function traverseCurated(
  catalog: ReturnType<typeof buildBlueprintCatalog>,
  pageSize: number,
  likes?: readonly BlueprintLikeAffinityLike[]
) {
  const sources = blueprintLikeAffinitySources(catalog)
  const affinity = buildBlueprintLikeAffinity(sources, likes ?? [])
  const orderedKeys: string[] = []
  let cursor: string | undefined
  let pageCount = 0
  do {
    const page = pageBlueprintCatalog(
      catalog,
      { limit: pageSize, q: '', ranking: 'baseline_v1', ...(cursor ? { cursor } : {}) },
      'offline-personal-like-tuning-fixture',
      { now: new Date(AS_OF), ...(likes ? { personalLikes: { enabled: true, affinity } } : {}) }
    )
    if (!page.ok) throw new Error(`Curated page traversal failed: ${page.reason}`)
    orderedKeys.push(...page.page.entries.map((entry) => entry.catalogKey))
    cursor = page.page.nextCursor
    pageCount++
    if (pageCount > catalog.entries.length + 1)
      throw new Error('Curated traversal did not terminate')
  } while (cursor)
  return {
    pageSize,
    pageCount,
    itemCount: orderedKeys.length,
    complete: orderedKeys.length === catalog.entries.length,
    duplicateCount: orderedKeys.length - new Set(orderedKeys).size,
    orderHash: createHash('sha256').update(orderedKeys.join('\n')).digest('hex'),
    orderedKeys,
  }
}

function curatedPaging() {
  const catalog = buildBlueprintCatalog(blueprintStarters)
  const sources = blueprintLikeAffinitySources(catalog)
  const preferredKey = sources[0]?.catalogKey
  const likes = preferredKey ? exactLikesForCatalog(sources, [preferredKey]) : []
  const rows = [1, 2, 3, 7, 20].map((pageSize) => ({
    baseline: traverseCurated(catalog, pageSize),
    personalized: traverseCurated(catalog, pageSize, likes),
  }))
  const stableBaseline = new Set(rows.map(({ baseline }) => baseline.orderHash)).size === 1
  const stablePersonalized =
    new Set(rows.map(({ personalized }) => personalized.orderHash)).size === 1
  return {
    source: '17 current public curated starter fixtures; unlabeled legacy diagnostic only.',
    itemCount: catalog.entries.length,
    requestedPageSizes: [1, 2, 3, 7, 20],
    traversals: rows,
    stableAcrossPageSizes: { baseline: stableBaseline, personalized: stablePersonalized },
  }
}

function behavioralGuards() {
  const fixture = development
  const sources = sourcesFor(fixture.plans)
  const seed = sources.find((source) => source.catalogKey === fixture.seeds.wedding)
  if (!seed) throw new Error('Missing predeclared sparse-profile seed')
  const candidates = rankingCandidates(fixture.plans)
  const baseline = rankBlueprintRecommendations(candidates, AS_OF).orderedKeys
  const affinity = (rows: readonly BlueprintLikeAffinityLike[], available = sources) =>
    buildBlueprintLikeAffinity(available, rows)
  const exact = exactLike(seed)
  const noHistory = affinity([])
  const exactSparse = affinity([exact])
  const stale = affinity([{ ...exact, likeRevision: exact.likeRevision! + 1 }])
  const unliked = affinity([{ ...exact, liked: false }])
  const ineligible = affinity([{ ...exact, eligible: false }])
  const withdrawnSources = sources.filter((source) => source.catalogKey !== seed.catalogKey)
  const withdrawn = affinity([exact], withdrawnSources)
  const noHistoryOrder = rankBlueprintRecommendations(
    candidates,
    AS_OF,
    undefined,
    noHistory.scores
  ).orderedKeys
  const barrierCandidates: BlueprintRankingCandidate[] = [
    { catalogKey: 'higher-relevance', relevance: [0] },
    { catalogKey: 'lower-relevance', relevance: [1] },
  ]
  const barrierOrder = rankBlueprintRecommendations(barrierCandidates, AS_OF, undefined, {
    'lower-relevance': 3,
  }).orderedKeys
  const notesOnlySources: BlueprintLikeAffinitySource[] = [
    {
      catalogKey: 'notes-only-seed',
      revision: 1,
      contentHash: createHash('sha256').update('notes-only-seed').digest('hex'),
      publicText: [
        'Outdoor painting night',
        'A hands-on evening with friends',
        'Ceramic paint bowls',
      ],
      name: 'Outdoor painting night',
      summary: 'A hands-on evening with friends',
      eventTitles: ['Meet at the park'],
      ideaTitles: ['Watercolor table'],
      ideaNotes: ['Ceramic paint bowls'],
    },
    {
      catalogKey: 'notes-only-candidate',
      revision: 1,
      contentHash: createHash('sha256').update('notes-only-candidate').digest('hex'),
      publicText: ['Quiet maker session', 'A calm creative hour', 'Paint ceramic bowls'],
      name: 'Quiet maker session',
      summary: 'A calm creative hour',
      eventTitles: ['Welcome and setup'],
      ideaTitles: ['Choose a project'],
      ideaNotes: ['Paint ceramic bowls'],
    },
  ]
  const notesOnlyAffinity = affinity(
    [
      {
        catalogKey: 'notes-only-seed',
        liked: true,
        likeRevision: 1,
        likeContentHash: notesOnlySources[0]!.contentHash,
      },
    ],
    notesOnlySources
  )
  return {
    noHistory: {
      eligibleLikeCount: noHistory.diagnostics.eligibleLikeCount,
      boostCount: Object.keys(noHistory.scores).length,
      orderMatchesBaseline: noHistoryOrder.join('\u0000') === baseline.join('\u0000'),
    },
    oneExactLike: {
      selectedSeedCount: exactSparse.diagnostics.selectedSeedCount,
      seedIsExcludedAsTarget: !(seed.catalogKey in exactSparse.scores),
      remainingCandidatesRemainPresent:
        rankBlueprintRecommendations(candidates, AS_OF, undefined, exactSparse.scores).orderedKeys
          .length === candidates.length,
    },
    staleLike: {
      eligibleLikeCount: stale.diagnostics.eligibleLikeCount,
      boostCount: Object.keys(stale.scores).length,
    },
    unlikedRow: {
      eligibleLikeCount: unliked.diagnostics.eligibleLikeCount,
      boostCount: Object.keys(unliked.scores).length,
    },
    ineligibleLike: {
      eligibleLikeCount: ineligible.diagnostics.eligibleLikeCount,
      boostCount: Object.keys(ineligible.scores).length,
    },
    withdrawnSource: {
      eligibleLikeCount: withdrawn.diagnostics.eligibleLikeCount,
      boostCount: Object.keys(withdrawn.scores).length,
    },
    relevanceBarrier: {
      orderedKeys: barrierOrder,
      lowerRelevanceCannotPassHigherRelevance: barrierOrder[0] === 'higher-relevance',
    },
    notesOnlyBoundaryProbe: {
      description:
        'Unlabeled two-source probe with shared body-note topic terms and no shared identity-role terms.',
      candidateScore: notesOnlyAffinity.scores['notes-only-candidate'] ?? 0,
      bodyOnlyMatchDoesNotQualify: !notesOnlyAffinity.scores['notes-only-candidate'],
    },
  }
}

function buildArtifact() {
  const developmentResult = scoreFixture(development)
  const heldoutResult = scoreFixture(heldout)
  const guards = behavioralGuards()
  const curatedDiagnostic = curatedPaging()
  return {
    formatVersion: FORMAT_VERSION,
    purpose:
      'Deterministic offline comparison on predeclared fictional authored-plan fixtures. It is not production traffic, observed user preference, or evidence of user-quality or engagement uplift.',
    asOf: AS_OF,
    evaluationProtocol: {
      developmentLock: development.lock,
      heldoutLock: heldout.lock,
      sourcePopulationBySplit: {
        development: development.plans.length,
        heldout: heldout.plans.length,
      },
      splitDesign:
        'Development and heldout plan families are separate fixture files. Each split is evaluated as its own current public source corpus (development N=49; heldout N=24), preventing development-family documents from affecting heldout IDF or candidate ranks.',
      queryProfiles:
        'One exact current Like seed per predeclared intent family; each seed is evaluated separately; the seed item is excluded from ranking and pair denominators.',
      labels:
        'Hand-authored ordinal judgments from fictional fixture content: relevant, unrelated, ambiguous. Ambiguous cases are excluded from strict precision/recall/FPR and counted in a conservative precision denominator as false positives.',
      time: AS_OF,
      noPostLockEdits: true,
    },
    activePolicies: {
      baselineAlgorithmVersion: BLUEPRINT_RANKING_ALGORITHM_VERSION,
      baselineConfigurationFingerprint: BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
      frozenV1Version: V1_POLICY_VERSION,
      frozenV1Fingerprint: V1_POLICY_FINGERPRINT,
      roleAwareV2Version: BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION,
      roleAwareV2Fingerprint: BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
    },
    frozenV1SourceFingerprint: 'cd21a91a4df115f976bdbabc9d4b5ce4a4c2c8dec9407e0c9f61239130551b1e',
    roleAwareV2Formula: {
      roleWeights: { name: 3, eventTitles: 2, ideaTitles: 2, summary: 1, ideaNotes: 0.5 },
      tokenSelection:
        'Distinct terms: retain strongest-role weight, sort by descending weight then lexical token, cap at 64 per source.',
      documentFrequency:
        'Computed from the same bounded current public source vectors; IDF = ln(1 + N / (1 + df)).',
      similarity:
        'Weighted Jaccard: sum(min(seedWeight,candidateWeight)) / sum(max(seedWeight,candidateWeight)), using IDF-adjusted weights.',
      qualification:
        'At least two distinct shared meaningful tokens and at least one shared identity token from name/event-title/idea-title on both sides; idea-notes-only matches do not qualify.',
      threshold: 0.05,
      score: 'Maximum qualifying seed similarity multiplied by 3, capped at 3; otherwise zero.',
    },
    development: developmentResult,
    heldout: heldoutResult,
    behavioralGuards: guards,
    curatedUnlabeledDiagnostic: curatedDiagnostic,
    caveats: [
      'These are manually written fictional fixtures with family-based ordinal labels and selected ambiguous cross-family cases, not independently adjudicated real-user relevance labels; results describe only these cases.',
      'The baseline has no affinity prediction. Its ranking precision at K is reported against the fixture judgments, but affinity precision/recall are not applicable.',
      'V2 lowers false positives in this fixture set while losing many labeled relevant matches; this is a precision/recall tradeoff, not a demonstrated quality improvement.',
      'The family-seed design is intentionally small and does not estimate independent-user variance; pairs sharing a seed are correlated and should not be treated as independent observations for confidence intervals or significance claims.',
      'The corpus includes English, Spanish, mixed-language and unknown-language examples; it does not establish robust multilingual or semantic-paraphrase coverage.',
      'Creator concentration, recency, and cursor traversal are deterministic fixture diagnostics only; they do not establish live exposure or engagement outcomes.',
      'The heldout split was opened only after the v2 formula, threshold, and production policy fingerprint were locked; any later policy change requires a new validation split or must be reported as validation-informed iteration.',
    ],
    checks: {
      developmentV2MatchesLockedScratch: (() => {
        const metrics = developmentResult.policies.roleAwareV2.pairPrediction
        return (
          metrics.truePositiveCount === 11 &&
          metrics.falsePositiveCount === 5 &&
          metrics.ambiguousPredictionCount === 1
        )
      })(),
      developmentFixtureMatchesFrozenLock: development.lock === FROZEN_DEVELOPMENT_LOCK,
      heldoutFixtureMatchesFrozenLock: heldout.lock === FROZEN_HELDOUT_LOCK,
      noHistoryMatchesBaseline: guards.noHistory.orderMatchesBaseline,
      eligibilityAndRelevanceGuardsHold: (() => {
        return (
          guards.oneExactLike.selectedSeedCount === 1 &&
          guards.oneExactLike.seedIsExcludedAsTarget &&
          guards.oneExactLike.remainingCandidatesRemainPresent &&
          guards.staleLike.eligibleLikeCount === 0 &&
          guards.unlikedRow.eligibleLikeCount === 0 &&
          guards.ineligibleLike.eligibleLikeCount === 0 &&
          guards.withdrawnSource.eligibleLikeCount === 0 &&
          guards.relevanceBarrier.lowerRelevanceCannotPassHigherRelevance &&
          guards.notesOnlyBoundaryProbe.bodyOnlyMatchDoesNotQualify
        )
      })(),
      allScoresWithinPolicyCap: [developmentResult, heldoutResult].every((result) =>
        result.profileDiagnostics.every((profile) => profile.v2Diagnostic.maxScore <= 3)
      ),
      curatedPagingCompleteWithoutDuplicates: [1, 2, 3, 7, 20].every((pageSize) => {
        const row = curatedDiagnostic.traversals.find(
          (item) => item.baseline.pageSize === pageSize
        )!
        return (
          row.baseline.complete &&
          row.baseline.duplicateCount === 0 &&
          row.personalized.complete &&
          row.personalized.duplicateCount === 0
        )
      }),
      curatedPagingStableAcrossPageSizes:
        curatedDiagnostic.stableAcrossPageSizes.baseline &&
        curatedDiagnostic.stableAcrossPageSizes.personalized,
    },
  }
}

async function main() {
  const expected = `${JSON.stringify(buildArtifact(), null, 2)}\n`
  if (check) {
    const actual = await readFile(ARTIFACT_PATH, 'utf8').catch(() => '')
    if (actual !== expected) {
      console.error(`Personal-like tuning artifact is stale: ${ARTIFACT_PATH}`)
      process.exitCode = 1
      return
    }
    console.log(`Personal-like tuning artifact is current: ${ARTIFACT_PATH}`)
    return
  }
  await mkdir(dirname(ARTIFACT_PATH), { recursive: true })
  await writeFile(ARTIFACT_PATH, expected)
  console.log(`Wrote ${ARTIFACT_PATH}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void main()
