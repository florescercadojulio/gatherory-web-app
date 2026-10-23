import { createHash } from 'node:crypto'
import {
  BLUEPRINT_RANKING_CONFIG,
  type BlueprintRankingConfig,
} from '../catalog/blueprint-ranking-config'

export type { BlueprintRankingConfig } from '../catalog/blueprint-ranking-config'

export type BlueprintRankingMetadata = {
  /** Internal identity for creator diversity. Never serialize this as a display name. */
  creatorKey: string | null
  /** Earliest publication timestamp. Republishing must retain this value. */
  firstPublishedAt: string | null
}

export type BlueprintRankingCandidate = {
  catalogKey: string
  relevance: number[]
  metadata?: BlueprintRankingMetadata
}

export type BlueprintRankingResult = {
  orderedKeys: string[]
  reasons: Record<string, string[]>
}

const DEFAULT_CONFIG: BlueprintRankingConfig = BLUEPRINT_RANKING_CONFIG
const DAY_MS = 24 * 60 * 60 * 1000

export const BLUEPRINT_RANKING_ALGORITHM_VERSION = 'blueprint-baseline-v2' as const

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

/** Stable SHA-256 fingerprint suitable for binding a snapshot to its policy. */
export function configurationFingerprint(config: BlueprintRankingConfig = DEFAULT_CONFIG): string {
  return createHash('sha256').update(canonicalJson(config)).digest('hex')
}

export const BLUEPRINT_RANKING_CONFIG_FINGERPRINT = configurationFingerprint()

export function isValidBlueprintRankingConfig(config: unknown): config is BlueprintRankingConfig {
  if (typeof config !== 'object' || config === null) return false
  const candidate = config as BlueprintRankingConfig
  return (
    typeof candidate.version === 'string' &&
    candidate.version.length > 0 &&
    candidate.version.length <= 80 &&
    Number.isFinite(candidate.newItemShare) &&
    candidate.newItemShare >= 0 &&
    candidate.newItemShare <= 1 &&
    Number.isInteger(candidate.newItemWindowDays) &&
    candidate.newItemWindowDays >= 0 &&
    Number.isInteger(candidate.maxConsecutiveAuthoredPerCreator) &&
    candidate.maxConsecutiveAuthoredPerCreator >= 1 &&
    typeof candidate.editorialPriorities === 'object' &&
    candidate.editorialPriorities !== null &&
    !Array.isArray(candidate.editorialPriorities) &&
    Object.entries(candidate.editorialPriorities).every(
      ([key, priority]) => key.length > 0 && Number.isFinite(priority)
    )
  )
}

function effectiveConfig(config: BlueprintRankingConfig): BlueprintRankingConfig {
  return isValidBlueprintRankingConfig(config) ? config : DEFAULT_CONFIG
}

function parseTimestamp(value: unknown): number | undefined {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)
  ) {
    return undefined
  }
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareRelevance(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return left.length - right.length
}

function sameRelevance(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function validCandidate(candidate: BlueprintRankingCandidate): boolean {
  return (
    !!candidate &&
    typeof candidate.catalogKey === 'string' &&
    candidate.catalogKey.length > 0 &&
    Array.isArray(candidate.relevance) &&
    candidate.relevance.every(Number.isFinite)
  )
}

function creatorKey(candidate: BlueprintRankingCandidate): string | undefined {
  const value = candidate.metadata?.creatorKey
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function canonicalCandidate(candidate: BlueprintRankingCandidate): string {
  return canonicalJson({
    catalogKey: candidate.catalogKey,
    relevance: candidate.relevance,
    creatorKey: creatorKey(candidate) ?? null,
    firstPublishedAt:
      typeof candidate.metadata?.firstPublishedAt === 'string'
        ? candidate.metadata.firstPublishedAt
        : null,
  })
}

function deduplicateCandidates(candidates: readonly BlueprintRankingCandidate[]) {
  const byKey = new Map<string, BlueprintRankingCandidate>()
  for (const candidate of candidates.filter(validCandidate)) {
    const previous = byKey.get(candidate.catalogKey)
    if (!previous || compareRelevance(candidate.relevance, previous.relevance) < 0) {
      byKey.set(candidate.catalogKey, candidate)
    } else if (
      compareRelevance(candidate.relevance, previous.relevance) === 0 &&
      canonicalCandidate(candidate) < canonicalCandidate(previous)
    ) {
      byKey.set(candidate.catalogKey, candidate)
    }
  }
  return [...byKey.values()]
}

function isNewlyPublished(
  candidate: BlueprintRankingCandidate,
  asOfMs: number | undefined,
  config: BlueprintRankingConfig
): boolean {
  if (creatorKey(candidate) === undefined || asOfMs === undefined) return false
  const publishedAt = parseTimestamp(candidate.metadata?.firstPublishedAt)
  if (publishedAt === undefined || publishedAt > asOfMs) return false
  return asOfMs - publishedAt <= config.newItemWindowDays * DAY_MS
}

function hasAvoidableCreatorCapRun(
  candidates: readonly BlueprintRankingCandidate[],
  maxRun: number
): boolean {
  let previousCreator: string | undefined
  let run = 0
  let start = 0
  while (start < candidates.length) {
    const creator = creatorKey(candidates[start]!)
    if (!creator) {
      previousCreator = undefined
      run = 0
      start++
      continue
    }
    run = creator === previousCreator ? run + 1 : 1
    previousCreator = creator
    if (run > maxRun) {
      let end = start + 1
      while (end < candidates.length && creatorKey(candidates[end]!) === creator) end++
      if (candidates.slice(end).some((candidate) => creatorKey(candidate) !== creator)) return true
      start = end
      previousCreator = undefined
      run = 0
    } else {
      start++
    }
  }
  return false
}

/**
 * Rank an already-authorized and filtered candidate snapshot. Relevance vectors
 * are sorted lexicographically (the search service's lower-is-better ordering);
 * recommendation policy only changes order inside identical vectors.
 */
export function rankBlueprintRecommendations(
  candidates: readonly BlueprintRankingCandidate[],
  asOf: string,
  config: BlueprintRankingConfig = DEFAULT_CONFIG,
  affinityScores?: Readonly<Record<string, number>>,
  tieBreakerSeed?: string
): BlueprintRankingResult {
  const policy = effectiveConfig(config)
  const asOfMs = parseTimestamp(asOf)
  const unique = deduplicateCandidates(candidates)
  const grouped: BlueprintRankingCandidate[][] = []

  for (const candidate of unique.sort(
    (left, right) =>
      compareRelevance(left.relevance, right.relevance) ||
      compareText(left.catalogKey, right.catalogKey)
  )) {
    const current = grouped[grouped.length - 1]
    if (!current || !sameRelevance(current[0]!.relevance, candidate.relevance)) {
      grouped.push([candidate])
    } else {
      current.push(candidate)
    }
  }

  const orderedKeys: string[] = []
  const reasonEntries: [string, string[]][] = []
  let globalPosition = 0
  let recentItemsInPrefix = 0

  for (const group of grouped) {
    const priority = (candidate: BlueprintRankingCandidate) =>
      policy.editorialPriorities[candidate.catalogKey] ?? 0
    const affinity = (candidate: BlueprintRankingCandidate) => {
      const score = affinityScores?.[candidate.catalogKey]
      return Number.isFinite(score) ? Math.max(0, Math.min(3, score!)) : 0
    }
    const baseOrder = [...group].sort(
      (left, right) =>
        priority(right) - priority(left) ||
        affinity(right) - affinity(left) ||
        (tieBreakerSeed
          ? compareText(
              createHash('sha256').update(`${tieBreakerSeed}:${left.catalogKey}`).digest('hex'),
              createHash('sha256').update(`${tieBreakerSeed}:${right.catalogKey}`).digest('hex')
            )
          : compareText(left.catalogKey, right.catalogKey))
    )
    const remaining = new Map(baseOrder.map((candidate) => [candidate.catalogKey, candidate]))
    const ordinaryOrder: BlueprintRankingCandidate[] = []
    const ordinaryReasons = new Map<string, string[]>()
    let lastCreator: string | undefined
    let creatorRun = 0
    while (remaining.size > 0) {
      const candidatesInOrder = baseOrder.filter((item) => remaining.has(item.catalogKey))
      const capAllows = (candidate: BlueprintRankingCandidate) => {
        const key = creatorKey(candidate)
        return !key || key !== lastCreator || creatorRun < policy.maxConsecutiveAuthoredPerCreator
      }
      const selectedIndex = candidatesInOrder.findIndex(capAllows)
      const allowedIndex = selectedIndex < 0 ? 0 : selectedIndex
      const selected = candidatesInOrder[allowedIndex]!
      remaining.delete(selected.catalogKey)
      const selectedReasons = ['deterministic_baseline']
      if (priority(selected) > 0) selectedReasons.push('editorial_priority')
      if (allowedIndex > 0) selectedReasons.push('creator_diversity')
      if (selectedIndex < 0 && creatorKey(selected) !== undefined)
        selectedReasons.push('creator_diversity_cap_relaxed')
      ordinaryReasons.set(selected.catalogKey, selectedReasons)
      ordinaryOrder.push(selected)
      const selectedCreator = creatorKey(selected)
      if (selectedCreator && selectedCreator === lastCreator) creatorRun++
      else {
        lastCreator = selectedCreator
        creatorRun = selectedCreator ? 1 : 0
      }
    }

    // Recent items in the ordinary editorial/diversity order keep their place.
    // A cumulative floor target can only promote the earliest remaining recent
    // item over non-recent entries, never reserve or delay a recent item.
    const promotedKeys = new Set<string>()
    const promotedOrder = [...ordinaryOrder]
    for (let groupIndex = 0; groupIndex < promotedOrder.length; groupIndex++) {
      const globalSlot = globalPosition + 1
      const current = promotedOrder[groupIndex]!
      const cumulativeTarget = Math.floor(globalSlot * policy.newItemShare)
      let wasPromoted = false
      if (
        policy.newItemShare > 0 &&
        !isNewlyPublished(current, asOfMs, policy) &&
        recentItemsInPrefix < cumulativeTarget
      ) {
        const promotionIndex = promotedOrder.findIndex(
          (candidate, index) => index > groupIndex && isNewlyPublished(candidate, asOfMs, policy)
        )
        if (promotionIndex > groupIndex) {
          const promoted = promotedOrder[promotionIndex]!
          const trial = [...promotedOrder]
          trial.splice(promotionIndex, 1)
          trial.splice(groupIndex, 0, promoted)
          let priorCreator: string | undefined
          let priorRun = 0
          for (let index = 0; index < groupIndex; index++) {
            const key = creatorKey(trial[index]!)
            if (key && key === priorCreator) priorRun++
            else {
              priorCreator = key
              priorRun = key ? 1 : 0
            }
          }
          const key = creatorKey(promoted)
          const capAllows =
            !key || key !== priorCreator || priorRun < policy.maxConsecutiveAuthoredPerCreator
          if (
            !capAllows ||
            hasAvoidableCreatorCapRun(trial, policy.maxConsecutiveAuthoredPerCreator)
          ) {
            // Keep the ordinary position; a skipped promotion cannot lower a
            // previously earned recent-item position or violate creator variety.
          } else {
            promotedOrder.splice(
              groupIndex,
              promotedOrder.length - groupIndex,
              ...trial.slice(groupIndex)
            )
            promotedKeys.add(promoted.catalogKey)
            wasPromoted = true
          }
        }
      }

      const selected = promotedOrder[groupIndex]!
      if (isNewlyPublished(selected, asOfMs, policy)) recentItemsInPrefix++
      const itemReasons = [...ordinaryReasons.get(selected.catalogKey)!]
      if (wasPromoted || promotedKeys.has(selected.catalogKey))
        itemReasons.push('new_item_promotion')
      reasonEntries.push([selected.catalogKey, itemReasons])
      orderedKeys.push(selected.catalogKey)
      globalPosition++
    }
  }

  return { orderedKeys, reasons: Object.fromEntries(reasonEntries) }
}
