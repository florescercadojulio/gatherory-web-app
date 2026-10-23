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
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT as FINAL_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION as FINAL_VERSION,
  buildBlueprintLikeAffinity as buildFinal,
  type BlueprintLikeAffinityLike,
  type BlueprintLikeAffinitySource,
} from '../src/server/blueprints/services/blueprint-like-affinity'
import {
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
  rankBlueprintRecommendations,
  type BlueprintRankingCandidate,
} from '../src/server/blueprints/services/blueprint-ranking'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT as V1_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION as V1_VERSION,
  buildBlueprintLikeAffinity as buildV1,
  type BlueprintLikeAffinitySource as V1Source,
} from '../tests/fixtures/blueprint-like-affinity-v1'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT as INITIAL_V2_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION as INITIAL_V2_VERSION,
  buildBlueprintLikeAffinity as buildInitialV2,
} from '../tests/fixtures/blueprint-like-affinity-v2-initial'
import {
  PERSONAL_LIKE_CHALLENGE_LOCK,
  PERSONAL_LIKE_CHALLENGE_PAIRS,
  PERSONAL_LIKE_CHALLENGE_PLANS,
  type PersonalLikeChallengeJudgment,
} from '../tests/fixtures/blueprint-personal-like-challenge'
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
const ARTIFACT_PATH = resolve(
  'docs/roadmaps/blueprint-ranking-roadmap/artifacts/personal-like-precision-evaluation.json'
)
const check = process.argv.includes('--check')

type Family = string
type Plan = {
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
  intentFamily: Family
}
type Pair = {
  seedKey: string
  candidateKey: string
  judgment: PersonalLikeChallengeJudgment | 'relevant' | 'ambiguous' | 'unrelated'
}
type Fixture = {
  label: string
  plans: readonly Plan[]
  pairs: readonly Pair[]
  seeds: Readonly<Record<string, string>>
  lock: string
  status: 'development' | 'validation-informed' | 'locked-challenge'
}
type Source = BlueprintLikeAffinitySource
type Scored = {
  baseline: Readonly<Record<string, number>>
  frozenV1: Readonly<Record<string, number>>
  initialV2: Readonly<Record<string, number>>
  finalV2: Readonly<Record<string, number>>
}
type ProfileDiagnostic = {
  seedKey: string
  seedLanguage: Plan['language'] | undefined
  sourceCount: number
  v1: ReturnType<typeof buildV1>['diagnostics']
  initialV2: ReturnType<typeof buildInitialV2>['diagnostics']
  finalV2: ReturnType<typeof buildFinal>['diagnostics']
}

const development: Fixture = {
  label: 'development',
  plans: PERSONAL_LIKE_DEVELOPMENT_PLANS,
  pairs: PERSONAL_LIKE_DEVELOPMENT_PAIRS,
  seeds: PERSONAL_LIKE_DEVELOPMENT_SEEDS,
  lock: PERSONAL_LIKE_DEVELOPMENT_LOCK,
  status: 'development',
}
const validation: Fixture = {
  label: 'prior validation-informed iteration',
  plans: PERSONAL_LIKE_HELDOUT_PLANS,
  pairs: PERSONAL_LIKE_HELDOUT_PAIRS,
  seeds: PERSONAL_LIKE_HELDOUT_SEEDS,
  lock: PERSONAL_LIKE_HELDOUT_LOCK,
  status: 'validation-informed',
}
const challenge: Fixture = {
  label: 'new-family multilingual challenge',
  plans: PERSONAL_LIKE_CHALLENGE_PLANS,
  pairs: PERSONAL_LIKE_CHALLENGE_PAIRS,
  seeds: {
    book_circle: 'challenge-book_circle-01',
    tabletop_games: 'challenge-tabletop_games-01',
    live_music: 'challenge-live_music-01',
    plant_exchange: 'challenge-plant_exchange-01',
  },
  lock: PERSONAL_LIKE_CHALLENGE_LOCK,
  status: 'locked-challenge',
}

function sourceRows(plans: readonly Plan[]): Source[] {
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
    name: plan.name,
    summary: plan.summary,
    eventTitles: plan.eventTitles,
    ideaTitles: plan.ideaTitles,
    ideaNotes: plan.ideaNotes,
  }))
}

function sourceRowsV1(plans: readonly Plan[]): V1Source[] {
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

function rounded(n: number, d: number): number | null {
  return d ? Number((n / d).toFixed(4)) : null
}

function scorePolicies(fixture: Fixture): {
  byPair: Map<string, Scored>
  profileDiagnostics: ProfileDiagnostic[]
} {
  const rows = sourceRows(fixture.plans)
  const byKey = new Map(rows.map((row) => [row.catalogKey, row]))
  const oldRows = sourceRowsV1(fixture.plans)
  const oldByKey = new Map(oldRows.map((row) => [row.catalogKey, row]))
  const byPair = new Map<string, Scored>()
  const profileDiagnostics: ProfileDiagnostic[] = []
  for (const seedKey of Object.values(fixture.seeds)) {
    const source = byKey.get(seedKey)
    const oldSource = oldByKey.get(seedKey)
    if (!source || !oldSource) throw new Error(`Missing seed source: ${seedKey}`)
    const like = exactLike(source)
    const v1Like = exactLike(oldSource)
    const v1 = buildV1(oldRows, [v1Like])
    const initialV2 = buildInitialV2(rows, [like])
    const finalV2 = buildFinal(rows, [like])
    for (const pair of fixture.pairs.filter((item) => item.seedKey === seedKey)) {
      byPair.set(`${seedKey}\u0000${pair.candidateKey}`, {
        baseline: {},
        frozenV1: v1.scores,
        initialV2: initialV2.scores,
        finalV2: finalV2.scores,
      })
    }
    profileDiagnostics.push({
      seedKey,
      seedLanguage: fixture.plans.find((plan) => plan.catalogKey === seedKey)?.language,
      sourceCount: finalV2.diagnostics.sourceCount,
      v1: v1.diagnostics,
      initialV2: initialV2.diagnostics,
      finalV2: finalV2.diagnostics,
    })
  }
  return { byPair, profileDiagnostics }
}

function judgmentMetrics(fixture: Fixture, scores: ReadonlyMap<string, Scored>) {
  const judgements = (['relevant', 'ambiguous', 'unrelated'] as const).map((judgment) => [
    judgment,
    fixture.pairs.filter((pair) => pair.judgment === judgment).length,
  ])
  const output = Object.fromEntries(judgements)
  const policyNames = ['baseline', 'frozenV1', 'initialV2', 'finalV2'] as const
  const evaluate = (pairs: readonly Pair[]) =>
    Object.fromEntries(
      policyNames.map((policy) => {
        if (policy === 'baseline')
          return [
            policy,
            {
              affinityPredictionApplicable: false,
              note: 'The non-personal baseline has no affinity prediction; ranking P@K is reported separately.',
            },
          ]
        const rows = pairs.map((pair) => ({
          ...pair,
          score:
            scores.get(`${pair.seedKey}\u0000${pair.candidateKey}`)?.[policy][pair.candidateKey] ??
            0,
        }))
        const predicted = rows.filter((row) => row.score > 0)
        const tp = predicted.filter((row) => row.judgment === 'relevant').length
        const fp = predicted.filter((row) => row.judgment === 'unrelated').length
        const ambiguous = predicted.filter((row) => row.judgment === 'ambiguous').length
        const relevant = rows.filter((row) => row.judgment === 'relevant').length
        const unrelated = rows.filter((row) => row.judgment === 'unrelated').length
        return [
          policy,
          {
            affinityPredictionApplicable: true,
            predictedPairs: predicted.length,
            truePositive: tp,
            falsePositive: fp,
            ambiguousPredictions: ambiguous,
            strictPrecision: rounded(tp, tp + fp),
            conservativePrecision: rounded(tp, predicted.length),
            recall: rounded(tp, relevant),
            falsePositiveRate: rounded(fp, unrelated),
            positivePairShare: rounded(predicted.length, rows.length),
            seedCountWithoutPositivePairInScope: [
              ...new Set(pairs.map((pair) => pair.seedKey)),
            ].filter(
              (seedKey) =>
                !pairs.some(
                  (pair) =>
                    pair.seedKey === seedKey &&
                    (scores.get(`${pair.seedKey}\u0000${pair.candidateKey}`)?.[policy][
                      pair.candidateKey
                    ] ?? 0) > 0
                )
            ).length,
          },
        ]
      })
    )
  return {
    labels: output,
    overall: evaluate(fixture.pairs),
    candidateLanguage: Object.fromEntries(
      ['en', 'es', 'mixed', 'und'].map((language) => {
        const byKey = new Map(fixture.plans.map((plan) => [plan.catalogKey, plan.language]))
        return [
          language,
          evaluate(fixture.pairs.filter((pair) => byKey.get(pair.candidateKey) === language)),
        ]
      })
    ),
  }
}

function rankingCandidates(plans: readonly Plan[]): BlueprintRankingCandidate[] {
  return plans.map((plan) => ({
    catalogKey: plan.catalogKey,
    relevance: [],
    metadata: { creatorKey: plan.creatorKey, firstPublishedAt: plan.firstPublishedAt },
  }))
}

function aggregateRanking(fixture: Fixture, scored: ReadonlyMap<string, Scored>) {
  const policyNames = ['baseline', 'frozenV1', 'initialV2', 'finalV2'] as const
  const byPolicy = Object.fromEntries(
    policyNames.map((policy) => [
      policy,
      {
        topK: [1, 3, 5, 10, 20].map((k) => ({
          k,
          positions: 0,
          relevant: 0,
          ambiguous: 0,
          unrelated: 0,
        })),
        top10MembershipChangesVsBaseline: 0,
        top10OrderChangedPositionsVsBaseline: 0,
        seedCount: 0,
      },
    ])
  ) as Record<
    (typeof policyNames)[number],
    {
      topK: {
        k: number
        positions: number
        relevant: number
        ambiguous: number
        unrelated: number
      }[]
      top10MembershipChangesVsBaseline: number
      top10OrderChangedPositionsVsBaseline: number
      seedCount: number
    }
  >
  for (const seedKey of Object.values(fixture.seeds)) {
    const candidates = rankingCandidates(fixture.plans).filter(
      (candidate) => candidate.catalogKey !== seedKey
    )
    const baseline = rankBlueprintRecommendations(candidates, AS_OF)
    const scoreSet = (policy: (typeof policyNames)[number]) => {
      if (policy === 'baseline') return {}
      const result: Record<string, number> = {}
      for (const candidate of candidates) {
        result[candidate.catalogKey] =
          scored.get(`${seedKey}\u0000${candidate.catalogKey}`)?.[policy][candidate.catalogKey] ?? 0
      }
      return result
    }
    const orders = Object.fromEntries(
      policyNames.map((policy) => [
        policy,
        policy === 'baseline'
          ? baseline.orderedKeys
          : rankBlueprintRecommendations(candidates, AS_OF, undefined, scoreSet(policy))
              .orderedKeys,
      ])
    ) as Record<(typeof policyNames)[number], string[]>
    const judgments = new Map(
      fixture.pairs
        .filter((pair) => pair.seedKey === seedKey)
        .map((pair) => [pair.candidateKey, pair.judgment])
    )
    for (const policy of policyNames) {
      const summary = byPolicy[policy]
      summary.seedCount++
      if (policy !== 'baseline') {
        const baselineTop10 = orders.baseline.slice(0, 10)
        const currentTop10 = orders[policy].slice(0, 10)
        const currentSet = new Set(currentTop10)
        summary.top10MembershipChangesVsBaseline += baselineTop10.filter(
          (key) => !currentSet.has(key)
        ).length
        summary.top10OrderChangedPositionsVsBaseline += baselineTop10.filter(
          (key, index) => currentTop10[index] !== key
        ).length
      }
      for (const metric of summary.topK) {
        const keys = orders[policy].slice(0, metric.k)
        metric.positions += keys.length
        for (const key of keys) {
          const judgment = judgments.get(key)
          if (judgment === 'relevant') metric.relevant++
          else if (judgment === 'ambiguous') metric.ambiguous++
          else if (judgment === 'unrelated') metric.unrelated++
        }
      }
    }
  }
  return Object.fromEntries(
    policyNames.map((policy) => [
      policy,
      {
        ...byPolicy[policy],
        topK: byPolicy[policy].topK.map((row) => ({
          ...row,
          relevantShareAtK: rounded(row.relevant, row.positions),
          strictPrecisionExcludingAmbiguous: rounded(row.relevant, row.relevant + row.unrelated),
          conservativePrecisionCountingAmbiguousAsFalse: rounded(row.relevant, row.positions),
        })),
      },
    ])
  )
}

function evaluateFixture(fixture: Fixture) {
  const scored = scorePolicies(fixture)
  return {
    fixture: fixture.label,
    status: fixture.status,
    fixtureLock: fixture.lock,
    sourcePopulation: fixture.plans.length,
    profileCount: Object.keys(fixture.seeds).length,
    pairCount: fixture.pairs.length,
    judgments: judgmentMetrics(fixture, scored.byPair),
    ranking: aggregateRanking(fixture, scored.byPair),
    profiles: scored.profileDiagnostics,
  }
}

function curatedWeddingDiagnostic() {
  const catalog = buildBlueprintCatalog(blueprintStarters)
  const sources = blueprintLikeAffinitySources(catalog)
  const sourcesByKey = new Map(sources.map((source) => [source.catalogKey, source]))
  const wedding = sourcesByKey.get('wedding')
  if (!wedding) throw new Error('Curated wedding starter is missing')
  const oldSources: V1Source[] = sources.map(
    ({ catalogKey, revision, contentHash, publicText }) => ({
      catalogKey,
      revision,
      contentHash,
      publicText,
    })
  )
  const like = exactLike(wedding)
  const v1 = buildV1(oldSources, [like])
  const initialV2 = buildInitialV2(sources, [like])
  const finalV2 = buildFinal(sources, [like])
  const noHistoryAffinity = buildFinal(sources, [])
  const candidates: BlueprintRankingCandidate[] = catalog.entries.map((entry) => ({
    catalogKey: entry.catalogKey,
    relevance: [],
    metadata: entry.rankingMetadata,
  }))
  const baseline = rankBlueprintRecommendations(candidates, AS_OF)
  const orders = {
    baseline: baseline.orderedKeys,
    frozenV1: rankBlueprintRecommendations(candidates, AS_OF, undefined, v1.scores).orderedKeys,
    initialV2: rankBlueprintRecommendations(candidates, AS_OF, undefined, initialV2.scores)
      .orderedKeys,
    finalV2: rankBlueprintRecommendations(candidates, AS_OF, undefined, finalV2.scores).orderedKeys,
  }
  const noHistoryOrder = rankBlueprintRecommendations(
    candidates,
    AS_OF,
    undefined,
    noHistoryAffinity.scores
  ).orderedKeys
  const traverse = (pageSize: number, personal: boolean) => {
    const orderedKeys: string[] = []
    let cursor: string | undefined
    let pageCount = 0
    do {
      const page = pageBlueprintCatalog(
        catalog,
        { limit: pageSize, q: '', ranking: 'baseline_v1', ...(cursor ? { cursor } : {}) },
        'offline-personal-like-precision-evaluation',
        {
          now: new Date(AS_OF),
          ...(personal ? { personalLikes: { enabled: true, affinity: finalV2 } } : {}),
        }
      )
      if (!page.ok) throw new Error(`Curated pagination failed: ${page.reason}`)
      orderedKeys.push(...page.page.entries.map((entry) => entry.catalogKey))
      cursor = page.page.nextCursor
      pageCount++
      if (pageCount > catalog.entries.length + 1)
        throw new Error('Curated pagination did not terminate')
    } while (cursor)
    return {
      pageSize,
      pageCount,
      itemCount: orderedKeys.length,
      complete: orderedKeys.length === catalog.entries.length,
      duplicateCount: orderedKeys.length - new Set(orderedKeys).size,
      matchesDirectRanking:
        orderedKeys.join('\u0000') === (personal ? orders.finalV2 : orders.baseline).join('\u0000'),
      orderedKeys,
    }
  }
  const pagination = [1, 2, 3, 7, 20].map((pageSize) => ({
    baseline: traverse(pageSize, false),
    finalV2: traverse(pageSize, true),
  }))
  return {
    label:
      'Public curated `wedding` starter used as a synthetic exact Like; no relevance judgments attached.',
    catalogSize: catalog.entries.length,
    likedSeed: wedding.catalogKey,
    probeCandidate: 'shared_city_break',
    behavioralGuards: {
      noHistoryBoostCount: Object.keys(noHistoryAffinity.scores).length,
      noHistoryOrderMatchesBaseline:
        noHistoryOrder.join('\u0000') === orders.baseline.join('\u0000'),
      exactLikeSelectsOneSeed: finalV2.diagnostics.eligibleLikeCount === 1,
      likedSeedIsNotAffinityTarget: !('wedding' in finalV2.scores),
      likedSeedRemainsInCatalogRanking: orders.finalV2.includes('wedding'),
      candidateCountPreserved: orders.finalV2.length === catalog.entries.length,
    },
    affinityScores: {
      frozenV1: v1.scores.shared_city_break ?? 0,
      initialV2: initialV2.scores.shared_city_break ?? 0,
      finalV2: finalV2.scores.shared_city_break ?? 0,
    },
    boostedCandidateCounts: {
      frozenV1: Object.keys(v1.scores).length,
      initialV2: Object.keys(initialV2.scores).length,
      finalV2: Object.keys(finalV2.scores).length,
    },
    scoreSaturation: Object.fromEntries(
      (['frozenV1', 'initialV2', 'finalV2'] as const).map((policy) => [
        policy,
        {
          maxScore: Math.max(
            0,
            ...Object.values({ frozenV1: v1, initialV2, finalV2 }[policy].scores)
          ),
          atMaximumCount: Object.values({ frozenV1: v1, initialV2, finalV2 }[policy].scores).filter(
            (score) => score >= 3
          ).length,
        },
      ])
    ),
    top10: Object.fromEntries(
      Object.entries(orders).map(([policy, keys]) => [policy, keys.slice(0, 10)])
    ),
    top10ChangesVsBaseline: Object.fromEntries(
      Object.entries(orders)
        .filter(([policy]) => policy !== 'baseline')
        .map(([policy, keys]) => [
          policy,
          {
            membershipChanges: orders.baseline
              .slice(0, 10)
              .filter((key) => !new Set(keys.slice(0, 10)).has(key)).length,
            orderChangedPositions: orders.baseline
              .slice(0, 10)
              .filter((key, index) => keys[index] !== key).length,
          },
        ])
    ),
    actualCursorPagination: {
      pageSizes: [1, 2, 3, 7, 20],
      traversals: pagination,
      baselineStableAcrossPageSizes:
        new Set(pagination.map((item) => item.baseline.orderedKeys.join('\u0000'))).size === 1,
      finalV2StableAcrossPageSizes:
        new Set(pagination.map((item) => item.finalV2.orderedKeys.join('\u0000'))).size === 1,
      allCompleteWithoutDuplicates: pagination.every(
        (item) =>
          item.baseline.complete &&
          item.finalV2.complete &&
          item.baseline.duplicateCount === 0 &&
          item.finalV2.duplicateCount === 0 &&
          item.baseline.matchesDirectRanking &&
          item.finalV2.matchesDirectRanking
      ),
    },
  }
}

function buildArtifact() {
  const developmentResult = evaluateFixture(development)
  const validationResult = evaluateFixture(validation)
  const challengeResult = evaluateFixture(challenge)
  const curatedResult = curatedWeddingDiagnostic()
  return {
    formatVersion: 1,
    asOf: AS_OF,
    purpose:
      'Offline comparison of four fixed personal Like ranking policies on fictional, predeclared, family-labeled plan fixtures plus an unlabeled curated ranking diagnostic. This is not observed user quality or engagement uplift.',
    protocol: {
      idfPopulation:
        'Each fixture file is a separate current public source corpus; N is the number of plans in that file.',
      exactSeeds:
        'One source-bound exact Like seed per listed family; each actor profile is evaluated separately. Liked seed item is omitted from candidate ranking and pair metric denominators.',
      ambiguous:
        'Ambiguous predictions are excluded from strict precision/recall/FPR and counted as false in conservative precision.',
      noPostLockChallengeChanges: challenge.lock === PERSONAL_LIKE_CHALLENGE_LOCK,
    },
    policies: {
      baseline: {
        version: BLUEPRINT_RANKING_ALGORITHM_VERSION,
        fingerprint: BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
        affinity: null,
      },
      frozenV1: { version: V1_VERSION, fingerprint: V1_FINGERPRINT },
      frozenInitialV2: {
        version: INITIAL_V2_VERSION,
        fingerprint: INITIAL_V2_FINGERPRINT,
        snapshotFileSha256: 'c1a8507033bf7e13d30c80d0f89b029576cb68de44569d897b085680f171e050',
        originalSourceSha256: '18666aa462b0dac5f50860a8afd226db60e53c5d2d383912d4edf2ed1dd912d9',
      },
      finalV2: {
        version: FINAL_VERSION,
        fingerprint: FINAL_FINGERPRINT,
        formula: {
          threshold: 0.03,
          sharedTerms: 'At least two distinct shared meaningful terms.',
          anchor:
            'A shared token must be identity-role text (name/event title/idea title) on at least one side and non-notes text on both sides. Summary-summary overlap cannot anchor; notes cannot be the non-notes counterpart.',
          roles: { name: 3, eventTitles: 2, ideaTitles: 2, summary: 1, ideaNotes: 0.5 },
          cap: 64,
          similarity: 'Maximum per-seed IDF-adjusted role-weighted Jaccard × 3, capped at 3.',
        },
      },
    },
    development: developmentResult,
    priorValidationInformedIteration: validationResult,
    newLockedChallenge: challengeResult,
    curatedWeddingLikeDiagnostic: curatedResult,
    caveats: [
      'All fixture plans are fictional. Judgments are manually authored at the intent-family level with selected ambiguous adjacent formats; they are not independent reviewer labels or real-user evaluations.',
      'The prior 24-plan set was evaluated before this iteration and informed the revised rule; it is included only as a validation-informed diagnostic, not a pristine test set.',
      'The new 28-plan challenge fixture was frozen before the Variant B.03 policy lock and was not used to choose the rule or threshold.',
      'Pairs share seed profiles and are correlated; do not treat pair counts as independent users or derive user-population confidence intervals from them.',
      'The Spanish and cross-language sample is small and hand-authored. Zero matches can indicate lexical coverage limitations but cannot quantify a population rate.',
      'The curated wedding ranking diagnostic is unlabeled. A score/order change is not evidence that shared_city_break is relevant or improved.',
      'No feature-on experiment, click/install outcome, production exposure, or causal uplift is represented.',
    ],
    checks: {
      lockedDevelopmentMatchesExpected: (() => {
        const metrics = developmentResult.judgments.overall.finalV2
        return (
          metrics.truePositive === 17 &&
          metrics.falsePositive === 9 &&
          metrics.ambiguousPredictions === 5
        )
      })(),
      challengeFixtureLockMatches:
        challenge.lock === '9c446f787b1e8dc773cf4c5930ad9d56b876d4eb8e4ebe25e28bbb10700291c1',
      finalPolicyFingerprintMatches:
        FINAL_FINGERPRINT === 'c7f7218e57aa1717dbf840a6e61cc23e2ee50ee60ba7a645512bb4e221ae4204',
      finalScoresStayBounded: [
        ...developmentResult.profiles,
        ...validationResult.profiles,
        ...challengeResult.profiles,
      ].every((profile) => profile.finalV2.maxScore <= 3),
      curatedNoHistoryAndSeedGuardsHold:
        curatedResult.behavioralGuards.noHistoryBoostCount === 0 &&
        curatedResult.behavioralGuards.noHistoryOrderMatchesBaseline &&
        curatedResult.behavioralGuards.exactLikeSelectsOneSeed &&
        curatedResult.behavioralGuards.likedSeedIsNotAffinityTarget &&
        curatedResult.behavioralGuards.likedSeedRemainsInCatalogRanking &&
        curatedResult.behavioralGuards.candidateCountPreserved,
      curatedActualPaginationCompleteStableAndDeduplicated:
        curatedResult.actualCursorPagination.allCompleteWithoutDuplicates &&
        curatedResult.actualCursorPagination.baselineStableAcrossPageSizes &&
        curatedResult.actualCursorPagination.finalV2StableAcrossPageSizes,
    },
  }
}

async function main() {
  const artifact = buildArtifact()
  const failedChecks = Object.entries(artifact.checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)
  if (failedChecks.length > 0)
    throw new Error(`Personal-like precision checks failed: ${failedChecks.join(', ')}`)
  const expected = `${JSON.stringify(artifact, null, 2)}\n`
  if (check) {
    const actual = await readFile(ARTIFACT_PATH, 'utf8').catch(() => '')
    if (actual !== expected) {
      console.error(`Personal-like precision artifact is stale: ${ARTIFACT_PATH}`)
      process.exitCode = 1
      return
    }
    console.log(`Personal-like precision artifact is current: ${ARTIFACT_PATH}`)
    return
  }
  await mkdir(dirname(ARTIFACT_PATH), { recursive: true })
  await writeFile(ARTIFACT_PATH, expected)
  console.log(`Wrote ${ARTIFACT_PATH}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void main()
