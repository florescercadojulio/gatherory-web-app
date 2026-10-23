/** Stable configuration for the deterministic Blueprint recommendation baseline. */
const EDITORIAL_PRIORITIES = Object.freeze({
  wedding: 30,
  birthday: 20,
  thanksgiving: 10,
})

export const BLUEPRINT_RANKING_CONFIG = Object.freeze({
  version: 'blueprint-baseline-v2',
  /** Higher values appear first, and only affect candidates with equal relevance. */
  editorialPriorities: EDITORIAL_PRIORITIES,
  /** Cumulative target: floor(k * share) recent authored items by global rank k. */
  newItemShare: 0.1,
  newItemWindowDays: 30,
  /** Soft cap: relaxed when it would otherwise prevent filling a relevance group. */
  maxConsecutiveAuthoredPerCreator: 2,
})

export type BlueprintRankingConfig = {
  version: string
  editorialPriorities: Readonly<Record<string, number>>
  newItemShare: number
  newItemWindowDays: number
  maxConsecutiveAuthoredPerCreator: number
}
