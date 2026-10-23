// Frozen personal Like v1 policy for offline comparison. Do not tune this fixture.
// Original source SHA-256: cd21a91a4df115f976bdbabc9d4b5ce4a4c2c8dec9407e0c9f61239130551b1e
import { createHash } from 'node:crypto'

export const BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION = 'blueprint-personal-likes-v1' as const

export const BLUEPRINT_PERSONAL_LIKE_POLICY = Object.freeze({
  version: BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION,
  minimumSharedTokens: 2,
  tokenLimitPerSource: 64,
  seedLimit: 50,
  maximumScore: 3,
  tokenizationVersion: 'en-es-public-content-v1',
})

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

const STOP_WORDS = new Set([
  'a',
  'about',
  'after',
  'all',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'get',
  'have',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'plan',
  'planning',
  'the',
  'their',
  'this',
  'to',
  'together',
  'with',
  'your',
  'you',
  'event',
  'events',
  'party',
  'gathering',
  'gatherings',
  'ideas',
  'idea',
  'celebration',
  'celebrate',
  'organize',
  'organise',
  'schedule',
  'host',
  'hosts',
  'guest',
  'guests',
  'family',
  'friends',
  'blueprint',
  'blueprints',
  'template',
  'templates',
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'la',
  'las',
  'los',
  'para',
  'por',
  'que',
  'se',
  'su',
  'sus',
  'un',
  'una',
  'uno',
  'y',
  'evento',
  'eventos',
  'fiesta',
  'fiestas',
  'reunion',
  'reuniones',
  'ideas',
  'idea',
  'plan',
  'planificar',
  'organizar',
  'celebracion',
  'celebrar',
  'anfitrion',
  'anfitriona',
  'invitado',
  'invitados',
  'familia',
  'amigos',
  'juntos',
  'plantilla',
  'plantillas',
  'proyecto',
  'proyectos',
])

const ALIASES: Readonly<Record<string, string>> = Object.freeze({
  boda: 'wedding',
  bodas: 'wedding',
  weddings: 'wedding',
  cumple: 'birthday',
  cumpleanos: 'birthday',
  birthdays: 'birthday',
  outdoors: 'outdoor',
})

export const BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT = createHash('sha256')
  .update(
    canonicalJson({
      policy: BLUEPRINT_PERSONAL_LIKE_POLICY,
      stopWords: [...STOP_WORDS].sort(),
      aliases: ALIASES,
    })
  )
  .digest('hex')

export type BlueprintLikeAffinitySource = {
  catalogKey: string
  revision: number
  contentHash: string
  /** Public title, summary, event titles, and idea titles/notes only. */
  publicText: readonly string[]
}

export type BlueprintLikeAffinityLike = {
  catalogKey: string
  liked: boolean
  likeRevision: number | null
  likeContentHash: string | null
  /** False when hidden or otherwise ineligible in the caller's current scope. */
  eligible?: boolean
}

export type BlueprintLikeAffinityDiagnostics = {
  sourceCount: number
  ambiguousSourceCount: number
  likeRowCount: number
  eligibleLikeCount: number
  invalidLikeCount: number
  ineligibleLikeCount: number
  unlikedRowCount: number
  selectedSeedCount: number
  seedLimitApplied: boolean
  tokenCappedSourceCount: number
  matchedCandidateCount: number
  boostedCandidateCount: number
  maxScore: number
}

export type BlueprintLikeAffinityResult = {
  /** Internal per-catalog scores. Callers must not serialize these to public cards. */
  scores: Record<string, number>
  /** Private binding digest; includes every eligible exact Like, even beyond the seed cap. */
  fingerprint: string
  diagnostics: BlueprintLikeAffinityDiagnostics
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/\baire\s+libre\b/g, ' outdoor ')
}

function meaningfulTokens(source: BlueprintLikeAffinitySource): Set<string> {
  const tokens = new Set<string>()
  for (const text of source.publicText) {
    if (typeof text !== 'string') continue
    for (const rawToken of normalizeText(text).match(/[a-z0-9]+/g) ?? []) {
      const token = ALIASES[rawToken] ?? rawToken
      if (token.length < 3 || /^\d+$/.test(token) || STOP_WORDS.has(token)) continue
      tokens.add(token)
    }
  }
  return tokens
}

function tokensFor(source: BlueprintLikeAffinitySource): Set<string> {
  return new Set(
    [...meaningfulTokens(source)]
      .sort()
      .slice(0, BLUEPRINT_PERSONAL_LIKE_POLICY.tokenLimitPerSource)
  )
}

function validSource(source: BlueprintLikeAffinitySource): boolean {
  return (
    typeof source.catalogKey === 'string' &&
    source.catalogKey.length > 0 &&
    Number.isInteger(source.revision) &&
    source.revision > 0 &&
    typeof source.contentHash === 'string' &&
    /^[a-f0-9]{64}$/i.test(source.contentHash) &&
    Array.isArray(source.publicText)
  )
}

/**
 * Derive private, bounded affinity from an actor's current exact-source Likes.
 * The caller supplies one account's current public catalog and eligible preference rows.
 */
export function buildBlueprintLikeAffinity(
  sources: readonly BlueprintLikeAffinitySource[],
  likes: readonly BlueprintLikeAffinityLike[]
): BlueprintLikeAffinityResult {
  const rowsByKey = new Map<string, BlueprintLikeAffinitySource[]>()
  for (const source of sources) {
    if (!validSource(source)) continue
    const rows = rowsByKey.get(source.catalogKey) ?? []
    rows.push(source)
    rowsByKey.set(source.catalogKey, rows)
  }

  const sourceByKey = new Map<string, BlueprintLikeAffinitySource>()
  let ambiguousSourceCount = 0
  for (const [catalogKey, rows] of rowsByKey) {
    const identities = new Set(rows.map((row) => `${row.revision}\u0000${row.contentHash}`))
    if (identities.size !== 1) {
      ambiguousSourceCount++
      continue
    }
    sourceByKey.set(catalogKey, rows[0]!)
  }

  const likesByKey = new Map<string, BlueprintLikeAffinityLike[]>()
  for (const like of likes) {
    if (typeof like.catalogKey !== 'string' || like.catalogKey.length === 0) continue
    const rows = likesByKey.get(like.catalogKey) ?? []
    rows.push(like)
    likesByKey.set(like.catalogKey, rows)
  }

  let invalidLikeCount = 0
  let ineligibleLikeCount = 0
  let unlikedRowCount = 0
  const exactLikes: { catalogKey: string; revision: number; contentHash: string }[] = []
  for (const [catalogKey, rows] of likesByKey) {
    const uniqueBindings = new Map(
      rows.map((row) => [
        canonicalJson({
          liked: row.liked,
          likeRevision: row.likeRevision,
          likeContentHash: row.likeContentHash,
          eligible: row.eligible ?? true,
        }),
        row,
      ])
    )
    if (uniqueBindings.size > 1) {
      invalidLikeCount++
      continue
    }
    const like = uniqueBindings.values().next().value as BlueprintLikeAffinityLike | undefined
    if (!like) continue
    if (!like.liked) {
      unlikedRowCount++
      continue
    }
    if (like.eligible === false) {
      ineligibleLikeCount++
      continue
    }
    const source = sourceByKey.get(catalogKey)
    if (
      !source ||
      !Number.isInteger(like.likeRevision) ||
      like.likeRevision !== source.revision ||
      typeof like.likeContentHash !== 'string' ||
      like.likeContentHash !== source.contentHash
    ) {
      invalidLikeCount++
      continue
    }
    exactLikes.push({
      catalogKey,
      revision: like.likeRevision,
      contentHash: like.likeContentHash,
    })
  }

  exactLikes.sort((left, right) =>
    left.catalogKey < right.catalogKey ? -1 : left.catalogKey > right.catalogKey ? 1 : 0
  )
  const fingerprintLikeBindings = [...likesByKey]
    .map(([catalogKey, rows]) => {
      const currentSource = sourceByKey.get(catalogKey)
      return {
        catalogKey,
        currentSource: currentSource
          ? { revision: currentSource.revision, contentHash: currentSource.contentHash }
          : null,
        likes: rows
          .map((row) => ({
            liked: typeof row.liked === 'boolean' ? row.liked : null,
            likeRevision: Number.isInteger(row.likeRevision) ? row.likeRevision : null,
            likeContentHash:
              typeof row.likeContentHash === 'string' && row.likeContentHash.length <= 128
                ? row.likeContentHash
                : null,
            eligible: row.eligible !== false,
          }))
          .sort((left, right) =>
            canonicalJson(left) < canonicalJson(right)
              ? -1
              : canonicalJson(left) > canonicalJson(right)
                ? 1
                : 0
          ),
      }
    })
    .sort((left, right) =>
      left.catalogKey < right.catalogKey ? -1 : left.catalogKey > right.catalogKey ? 1 : 0
    )
  const fingerprint = createHash('sha256')
    .update(
      canonicalJson({
        policyFingerprint: BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
        currentLikeBindings: fingerprintLikeBindings,
      })
    )
    .digest('hex')
  const selectedLikes = exactLikes.slice(0, BLUEPRINT_PERSONAL_LIKE_POLICY.seedLimit)
  const selectedSeeds = selectedLikes.flatMap((like) => {
    const source = sourceByKey.get(like.catalogKey)
    return source ? [{ catalogKey: like.catalogKey, tokens: tokensFor(source) }] : []
  })
  // A liked source is never a recommendation target for affinity, even when
  // its Like cannot seed because it is hidden, stale, or otherwise invalid.
  // Explicit unlikes remain eligible candidates and can match another seed.
  const likedKeys = new Set(
    [...likesByKey].flatMap(([catalogKey, rows]) =>
      rows.some((row) => row.liked === true) ? [catalogKey] : []
    )
  )
  const tokenSets = new Map(
    [...sourceByKey].map(([catalogKey, source]) => [catalogKey, tokensFor(source)])
  )
  let tokenCappedSourceCount = 0
  for (const source of sourceByKey.values()) {
    if (meaningfulTokens(source).size > BLUEPRINT_PERSONAL_LIKE_POLICY.tokenLimitPerSource)
      tokenCappedSourceCount++
  }

  const scores: Record<string, number> = {}
  let matchedCandidateCount = 0
  let maxScore = 0
  for (const [catalogKey, tokens] of tokenSets) {
    if (likedKeys.has(catalogKey) || tokens.size === 0) continue
    let score = 0
    let matched = false
    for (const seed of selectedSeeds) {
      let sharedCount = 0
      for (const token of tokens) if (seed.tokens.has(token)) sharedCount++
      if (sharedCount < BLUEPRINT_PERSONAL_LIKE_POLICY.minimumSharedTokens) continue
      matched = true
      score = Math.min(BLUEPRINT_PERSONAL_LIKE_POLICY.maximumScore, score + sharedCount - 1)
      if (score === BLUEPRINT_PERSONAL_LIKE_POLICY.maximumScore) break
    }
    if (matched) matchedCandidateCount++
    if (score > 0) scores[catalogKey] = score
    maxScore = Math.max(maxScore, score)
  }

  return {
    scores: Object.fromEntries(
      Object.entries(scores).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    ),
    fingerprint,
    diagnostics: {
      sourceCount: sourceByKey.size,
      ambiguousSourceCount,
      likeRowCount: likes.length,
      eligibleLikeCount: exactLikes.length,
      invalidLikeCount,
      ineligibleLikeCount,
      unlikedRowCount,
      selectedSeedCount: selectedSeeds.length,
      seedLimitApplied: exactLikes.length > selectedSeeds.length,
      tokenCappedSourceCount,
      matchedCandidateCount,
      boostedCandidateCount: Object.keys(scores).length,
      maxScore,
    },
  }
}
