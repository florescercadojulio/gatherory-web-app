import {
  BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  configurationFingerprint,
  rankBlueprintRecommendations,
  type BlueprintRankingCandidate,
} from './blueprint-ranking'
import { BLUEPRINT_RANKING_CONFIG } from '../catalog/blueprint-ranking-config'

export type RankingEvaluationCandidate = BlueprintRankingCandidate & {
  cohort?: 'curated' | 'authored'
}

export type RankingOrderMetrics = {
  itemCount: number
  top10: string[]
  top20: string[]
  top10Coverage: number | null
  top20Coverage: number | null
  fullCandidateCoverage: number | null
  duplicateCount: number
  unknownKeyCount: number
  relevanceViolations: number
  maxConsecutiveAuthoredCreatorRun: number
  maxAuthoredCreatorRunWithinRelevanceGroup: number
  promotedItemCount: number
  promotedItemShare: number | null
  firstPromotionRank: number | null
  inventoryCreatorConcentration: {
    eligibleAuthoredCount: number
    distinctCreators: number
    maxCreatorShare: number | null
    hhi: number | null
  }
  top10CreatorConcentration: CreatorConcentrationMetrics
  top20CreatorConcentration: CreatorConcentrationMetrics
  authoredTop10Share: number | null
  authoredTop20Share: number | null
  trulyNewTop10Share: number | null
  trulyNewTop20Share: number | null
}

type CreatorConcentrationMetrics = {
  authoredPositions: number
  distinctCreators: number
  maxCreatorShare: number | null
  hhi: number | null
}

function compareRelevance(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return left.length - right.length
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function isTrulyNew(candidate: RankingEvaluationCandidate, asOf: string): boolean {
  const publishedAt = candidate.metadata?.firstPublishedAt
  if (candidate.cohort !== 'authored' || !candidate.metadata?.creatorKey || !publishedAt)
    return false
  const age = Date.parse(asOf) - Date.parse(publishedAt)
  return (
    Number.isFinite(age) &&
    age >= 0 &&
    age <= BLUEPRINT_RANKING_CONFIG.newItemWindowDays * 86_400_000
  )
}

function roundedShare(count: number, denominator: number): number | null {
  return denominator === 0 ? null : Number((count / denominator).toFixed(4))
}

function creatorConcentrationForKeys(
  candidatesByKey: ReadonlyMap<string, RankingEvaluationCandidate>,
  keys: readonly string[]
): CreatorConcentrationMetrics {
  const counts = new Map<string, number>()
  for (const key of keys) {
    const candidate = candidatesByKey.get(key)
    const creator =
      candidate?.cohort === 'authored' ? (candidate.metadata?.creatorKey ?? undefined) : undefined
    if (creator) counts.set(creator, (counts.get(creator) ?? 0) + 1)
  }
  const authoredPositions = [...counts.values()].reduce((sum, count) => sum + count, 0)
  const maxCount = Math.max(0, ...counts.values())
  return {
    authoredPositions,
    distinctCreators: counts.size,
    maxCreatorShare: roundedShare(maxCount, authoredPositions),
    hhi:
      authoredPositions === 0
        ? null
        : Number(
            [...counts.values()]
              .reduce((sum, count) => sum + (count / authoredPositions) ** 2, 0)
              .toFixed(4)
          ),
  }
}

export function evaluateRankingOrder(
  candidates: readonly RankingEvaluationCandidate[],
  orderedKeys: readonly string[],
  asOf: string,
  promotionKeys: ReadonlySet<string> = new Set()
): RankingOrderMetrics {
  const uniqueCandidates = new Map(candidates.map((candidate) => [candidate.catalogKey, candidate]))
  const uniqueCandidateCount = uniqueCandidates.size
  const uniqueKeys = new Set(orderedKeys)
  const ordered = orderedKeys
    .map((key) => uniqueCandidates.get(key))
    .filter((item) => item !== undefined)
  const top10 = orderedKeys.slice(0, 10)
  const top20 = orderedKeys.slice(0, 20)
  const top10KnownUnique = new Set(top10.filter((key) => uniqueCandidates.has(key))).size
  const top20KnownUnique = new Set(top20.filter((key) => uniqueCandidates.has(key))).size
  const fullKnownUnique = new Set(orderedKeys.filter((key) => uniqueCandidates.has(key))).size
  let relevanceViolations = 0
  for (let left = 0; left < ordered.length; left++) {
    for (let right = left + 1; right < ordered.length; right++) {
      if (compareRelevance(ordered[left]!.relevance, ordered[right]!.relevance) > 0)
        relevanceViolations++
    }
  }

  const creatorCounts = new Map<string, number>()
  const eligibleAuthored = [...uniqueCandidates.values()].filter(
    (candidate) => candidate.cohort === 'authored' && candidate.metadata?.creatorKey
  )
  for (const candidate of eligibleAuthored) {
    const creator = candidate.metadata!.creatorKey!
    creatorCounts.set(creator, (creatorCounts.get(creator) ?? 0) + 1)
  }
  const maxCreatorCount = Math.max(0, ...creatorCounts.values())
  const eligibleByKey = new Map(
    eligibleAuthored.map((candidate) => [candidate.catalogKey, candidate])
  )
  let maxConsecutiveAuthoredCreatorRun = 0
  let maxAuthoredCreatorRunWithinRelevanceGroup = 0
  let previousGlobalCreator: string | undefined
  let globalCreatorRun = 0
  let previousGroupCreator: string | undefined
  let previousRelevance: readonly number[] | undefined
  let groupCreatorRun = 0
  for (const key of orderedKeys) {
    const candidate = eligibleByKey.get(key)
    const creator = candidate?.metadata?.creatorKey ?? undefined
    const relevance = candidate?.relevance
    if (relevance && previousRelevance && compareRelevance(relevance, previousRelevance) !== 0) {
      previousGroupCreator = undefined
      groupCreatorRun = 0
    }
    if (!creator) {
      previousGlobalCreator = undefined
      globalCreatorRun = 0
      previousGroupCreator = undefined
      groupCreatorRun = 0
    } else {
      if (creator === previousGlobalCreator) globalCreatorRun++
      else {
        previousGlobalCreator = creator
        globalCreatorRun = 1
      }
      if (creator === previousGroupCreator) groupCreatorRun++
      else {
        previousGroupCreator = creator
        groupCreatorRun = 1
      }
    }
    maxConsecutiveAuthoredCreatorRun = Math.max(maxConsecutiveAuthoredCreatorRun, globalCreatorRun)
    maxAuthoredCreatorRunWithinRelevanceGroup = Math.max(
      maxAuthoredCreatorRunWithinRelevanceGroup,
      groupCreatorRun
    )
    if (relevance) previousRelevance = relevance
  }

  const newKeys = new Set(
    candidates
      .filter((candidate) => isTrulyNew(candidate, asOf))
      .map(({ catalogKey }) => catalogKey)
  )
  const observedPromotionKeys = new Set(
    [...promotionKeys].filter((key) => uniqueCandidates.has(key) && uniqueKeys.has(key))
  )
  return {
    itemCount: orderedKeys.length,
    top10,
    top20,
    top10Coverage:
      uniqueCandidateCount === 0
        ? null
        : Number((Math.min(top10KnownUnique, 10) / Math.min(uniqueCandidateCount, 10)).toFixed(4)),
    top20Coverage:
      uniqueCandidateCount === 0
        ? null
        : Number((Math.min(top20KnownUnique, 20) / Math.min(uniqueCandidateCount, 20)).toFixed(4)),
    fullCandidateCoverage:
      uniqueCandidateCount === 0
        ? null
        : Number((fullKnownUnique / uniqueCandidateCount).toFixed(4)),
    duplicateCount: orderedKeys.length - uniqueKeys.size,
    unknownKeyCount: orderedKeys.filter((key) => !uniqueCandidates.has(key)).length,
    relevanceViolations,
    maxConsecutiveAuthoredCreatorRun,
    maxAuthoredCreatorRunWithinRelevanceGroup,
    promotedItemCount: observedPromotionKeys.size,
    promotedItemShare: roundedShare(observedPromotionKeys.size, uniqueCandidateCount),
    firstPromotionRank:
      observedPromotionKeys.size === 0
        ? null
        : orderedKeys.findIndex((key) => observedPromotionKeys.has(key)) + 1,
    inventoryCreatorConcentration: {
      eligibleAuthoredCount: eligibleAuthored.length,
      distinctCreators: creatorCounts.size,
      maxCreatorShare: roundedShare(maxCreatorCount, eligibleAuthored.length),
      hhi:
        eligibleAuthored.length === 0
          ? null
          : Number(
              [...creatorCounts.values()]
                .reduce((sum, count) => sum + (count / eligibleAuthored.length) ** 2, 0)
                .toFixed(4)
            ),
    },
    top10CreatorConcentration: creatorConcentrationForKeys(uniqueCandidates, top10),
    top20CreatorConcentration: creatorConcentrationForKeys(uniqueCandidates, top20),
    authoredTop10Share: roundedShare(
      top10.filter((key) => uniqueCandidates.get(key)?.cohort === 'authored').length,
      top10.length
    ),
    authoredTop20Share: roundedShare(
      top20.filter((key) => uniqueCandidates.get(key)?.cohort === 'authored').length,
      top20.length
    ),
    trulyNewTop10Share: roundedShare(top10.filter((key) => newKeys.has(key)).length, top10.length),
    trulyNewTop20Share: roundedShare(top20.filter((key) => newKeys.has(key)).length, top20.length),
  }
}

export function evaluateBlueprintRanking(
  candidates: readonly RankingEvaluationCandidate[],
  asOf: string
) {
  const baseline = rankBlueprintRecommendations(candidates, asOf)
  const promotionFreeBaseline = rankBlueprintRecommendations(candidates, asOf, {
    ...BLUEPRINT_RANKING_CONFIG,
    newItemShare: 0,
  })
  const editorialPriorities: Readonly<Record<string, number>> = {
    ...BLUEPRINT_RANKING_CONFIG.editorialPriorities,
  }
  const unrankedControl = [...candidates]
    .sort(
      (left, right) =>
        compareRelevance(left.relevance, right.relevance) ||
        compareText(left.catalogKey, right.catalogKey)
    )
    .map(({ catalogKey }) => catalogKey)
  const editorialOnlyControl = [...candidates]
    .sort(
      (left, right) =>
        compareRelevance(left.relevance, right.relevance) ||
        (editorialPriorities[right.catalogKey] ?? 0) -
          (editorialPriorities[left.catalogKey] ?? 0) ||
        compareText(left.catalogKey, right.catalogKey)
    )
    .map(({ catalogKey }) => catalogKey)
  const promotionKeys = new Set(
    Object.entries(baseline.reasons)
      .filter(([, reasons]) => reasons.includes('new_item_promotion'))
      .map(([key]) => key)
  )
  const observedPromotionKeys = new Set(
    [...promotionKeys].filter((key) => baseline.orderedKeys.includes(key))
  )

  return {
    policy: {
      algorithmVersion: BLUEPRINT_RANKING_ALGORITHM_VERSION,
      configurationVersion: BLUEPRINT_RANKING_CONFIG.version,
      configurationFingerprint: BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
      editorialPriorities: BLUEPRINT_RANKING_CONFIG.editorialPriorities,
      newItemShare: BLUEPRINT_RANKING_CONFIG.newItemShare,
      newItemWindowDays: BLUEPRINT_RANKING_CONFIG.newItemWindowDays,
      maxConsecutiveAuthoredPerCreator: BLUEPRINT_RANKING_CONFIG.maxConsecutiveAuthoredPerCreator,
      recomputedFingerprint: configurationFingerprint(BLUEPRINT_RANKING_CONFIG),
    },
    baseline: {
      metrics: evaluateRankingOrder(candidates, baseline.orderedKeys, asOf, observedPromotionKeys),
      promotionRanks: baseline.orderedKeys.flatMap((key, index) =>
        observedPromotionKeys.has(key) ? [{ catalogKey: key, rank: index + 1 }] : []
      ),
    },
    promotionFreeBaselineControl: {
      metrics: evaluateRankingOrder(candidates, promotionFreeBaseline.orderedKeys, asOf),
    },
    unrankedRelevanceKeyControl: {
      metrics: evaluateRankingOrder(candidates, unrankedControl, asOf),
    },
    editorialOnlyControl: {
      metrics: evaluateRankingOrder(candidates, editorialOnlyControl, asOf),
    },
  }
}
