import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  BLUEPRINT_BROWSE_CATEGORIES,
  BLUEPRINT_DISCOVERY_LIMITS,
  BlueprintCatalogPageResponseSchema,
  BlueprintCatalogResponseSchema,
  BlueprintDiscoverySchema,
  BlueprintPublicCoverURLSchema,
  type BlueprintCatalogPageRequest,
  type BlueprintDiscovery,
} from '@/contracts/blueprint-discovery.contracts'
import {
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  type BlueprintCatalogRevision,
} from '@/contracts/blueprint-install.contracts'
import { exploreCollections } from '../catalog/explore-collections'
import { blueprintStarters } from '../catalog/starters'
import exploreCoverImageRegistry from '../catalog/explore-cover-images.json'
import seedImageAssignmentsRaw from '../catalog/seed-image-assignments.json'
import seedImageAssetsRaw from '../catalog/seed-image-assets.json'
import {
  SeedImageAssetsSchema,
  SeedImageAssignmentsSchema,
  resolveSeedImageTargets,
  seedImageCardURL,
} from '../catalog/seed-image-registry'
import {
  BLUEPRINT_RANKING_CONFIG,
  type BlueprintRankingConfig,
} from '../catalog/blueprint-ranking-config'
import {
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  configurationFingerprint,
  isValidBlueprintRankingConfig,
  rankBlueprintRecommendations,
  type BlueprintRankingMetadata,
} from './blueprint-ranking'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION,
  type BlueprintLikeAffinityResult,
} from './blueprint-like-affinity'

const curatedCatalogKeys = [
  ...new Set([
    ...exploreCollections.map(({ key }) => key),
    ...blueprintStarters.map(({ catalogKey }) => catalogKey),
  ]),
] as [string, ...string[]]
const ExploreCoverImageRegistrySchema = z.partialRecord(
  z.enum(curatedCatalogKeys),
  BlueprintPublicCoverURLSchema
)
const exploreCoverImages = ExploreCoverImageRegistrySchema.parse(exploreCoverImageRegistry)
const seedImageAssignments = SeedImageAssignmentsSchema.parse(seedImageAssignmentsRaw)
const seedImageAssets = SeedImageAssetsSchema.parse(seedImageAssetsRaw)

function attachCuratedCover(
  entry: BlueprintCatalogRevision,
  discovery: BlueprintDiscovery
): BlueprintDiscovery {
  const isKnownCuratedRevision = blueprintStarters.some(
    (starter) =>
      starter.catalogKey === entry.catalogKey &&
      starter.revision === entry.revision &&
      starter.contentHash === entry.contentHash
  )
  const registeredExploreCover = isKnownCuratedRevision
    ? exploreCoverImages[entry.catalogKey]
    : undefined
  const seedImages = resolveSeedImageTargets({
    entry,
    assignments: seedImageAssignments,
    assets: seedImageAssets,
  })
  return BlueprintDiscoverySchema.parse({
    ...discovery,
    ...(registeredExploreCover ? { coverImageURL: registeredExploreCover } : {}),
    ...(seedImages?.root ? { coverImageURL: seedImageCardURL(seedImages.root.manifest) } : {}),
    ...(seedImages &&
    (Object.keys(seedImages.children).length || Object.keys(seedImages.ideas).length)
      ? {
          coverImages: {
            children: Object.fromEntries(
              Object.entries(seedImages.children).map(([key, image]) => [
                key,
                seedImageCardURL(image.manifest),
              ])
            ),
            ideas: Object.fromEntries(
              Object.entries(seedImages.ideas).map(([key, image]) => [
                key,
                seedImageCardURL(image.manifest),
              ])
            ),
          },
        }
      : {}),
  })
}

/** Discovery copy is editable independently of the immutable installation source. */
export function blueprintDiscovery(entry: BlueprintCatalogRevision): BlueprintDiscovery {
  const collection = exploreCollections.find(({ key }) => key === entry.catalogKey)
  if (collection) return attachCuratedCover(entry, collection.discovery)
  if (entry.catalogKey === 'birthday') {
    return attachCuratedCover(entry, {
      categories: ['birthdays'],
      tags: ['birthday', 'party', 'cake', 'games', 'celebration'],
      summary: 'Bring a birthday party together with food, activities, and time to celebrate.',
    })
  }
  if (entry.catalogKey === 'thanksgiving') {
    return attachCuratedCover(entry, {
      categories: ['holidays'],
      tags: ['thanksgiving', 'friendsgiving', 'holiday', 'dinner', 'potluck'],
      summary:
        'Plan a Thanksgiving gathering on your chosen date, with shared food and time together.',
    })
  }
  if (entry.catalogKey === 'wedding') {
    return attachCuratedCover(entry, {
      categories: ['weddings'],
      tags: ['wedding', 'ceremony', 'reception', 'celebration'],
      summary: 'Plan your wedding, from the first venue visit to the celebration.',
    })
  }
  // Every published starter has a browse destination, including future types.
  const categories: Record<string, BlueprintDiscovery['categories'][number]> = {
    wedding: 'weddings',
    birthday: 'birthdays',
    holiday: 'holidays',
  }
  return attachCuratedCover(entry, {
    categories: [categories[entry.definition.experienceDefaults.type] ?? 'events'],
    tags: [],
    summary: '',
  })
}

export function buildBlueprintCatalog(
  entries: (BlueprintCatalogRevision & {
    description?: string
    creator?: { displayName: string }
    rankingMetadata?: BlueprintRankingMetadata
  })[]
) {
  const latest = new Map<
    string,
    BlueprintCatalogRevision & {
      description?: string
      creator?: { displayName: string }
      rankingMetadata?: BlueprintRankingMetadata
    }
  >()
  for (const entry of entries) {
    if (entry.revision > (latest.get(entry.catalogKey)?.revision ?? 0)) {
      latest.set(entry.catalogKey, entry)
    }
  }
  return {
    entries: [...latest.values()]
      .sort((a, b) => (a.catalogKey < b.catalogKey ? -1 : a.catalogKey > b.catalogKey ? 1 : 0))
      .map(
        ({
          catalogKey,
          revision,
          contentHash,
          definition,
          description,
          creator,
          rankingMetadata,
        }) => ({
          catalogKey,
          revision,
          contentHash,
          definition,
          ...(creator ? { creator } : {}),
          ...(rankingMetadata ? { rankingMetadata } : {}),
          discovery: {
            ...blueprintDiscovery({ catalogKey, revision, contentHash, definition }),
            ...(description ? { summary: Array.from(description).slice(0, 500).join('') } : {}),
          },
        })
      ),
  }
}

type BuiltBlueprintCatalog = ReturnType<typeof buildBlueprintCatalog>
/** The only public serialization path for full catalog reads. */
export const publicBlueprintCatalog = (catalog: BuiltBlueprintCatalog) =>
  BlueprintCatalogResponseSchema.parse(catalog)
type PageResponse = z.infer<typeof BlueprintCatalogPageResponseSchema>

/** Extract only authored public text used by the private Like-affinity policy. */
export function blueprintLikeAffinitySources(catalog: BuiltBlueprintCatalog) {
  return catalog.entries.map((entry) => {
    const sources = catalogSearchProjection(entry).sources.filter(
      (source) => source.kind !== 'metadata'
    )
    const firstText = (kind: SearchSource['kind']) =>
      sources.find((source) => source.kind === kind)?.text ?? ''
    return {
      catalogKey: entry.catalogKey,
      revision: entry.revision,
      contentHash: entry.contentHash,
      // Preserve the frozen v1 projection exactly for its offline comparator.
      publicText: sources.map((source) => source.text),
      // V2 consumes role-aware fields only. This projection inherits the same
      // public authored-source and valid idea-target boundary as search.
      name: firstText('blueprint-name'),
      summary: firstText('blueprint-summary'),
      eventTitles: sources
        .filter((source) => source.kind === 'child-title')
        .map((source) => source.text),
      ideaTitles: sources
        .filter((source) => source.kind === 'idea-title')
        .map((source) => source.text),
      ideaNotes: sources
        .filter((source) => source.kind === 'idea-notes')
        .map((source) => source.text),
    }
  })
}

/** Bookmark-only and unliked states never participate in personal Like ranking. */
export function blueprintLikeAffinityLikes(
  states: readonly {
    catalogKey: string
    liked: boolean
    likeRevision: number | null
    likeContentHash: string | null
    notInterested: boolean
  }[]
) {
  return states
    .filter((state) => state.liked)
    .map((state) => ({
      catalogKey: state.catalogKey,
      liked: true,
      likeRevision: state.likeRevision,
      likeContentHash: state.likeContentHash,
      eligible: !state.notInterested,
    }))
}

export function applyBlueprintViewerPreferences<T extends { catalogKey: string }>(
  entries: T[],
  states: Record<string, { liked: boolean; bookmarked: boolean; notInterested: boolean }>,
  suppressNotInterested: boolean
) {
  return entries
    .filter((entry) => !suppressNotInterested || !states[entry.catalogKey]?.notInterested)
    .map((entry) => {
      const state = states[entry.catalogKey]
      return {
        ...entry,
        viewerState: {
          liked: state?.liked ?? false,
          bookmarked: state?.bookmarked ?? false,
          notInterested: state?.notInterested ?? false,
        },
      }
    })
}

type LegacyCursorPayload = {
  version: 1
  catalogDigest: string
  limit: number
  category: BlueprintCatalogPageRequest['category'] | null
  query: string
  afterCatalogKey: string
}

type RankedCursorPayload = Omit<LegacyCursorPayload, 'version'> & {
  version: 2
  ranking: 'baseline_v1'
  mode: 'baseline_v1' | 'catalog'
  asOf: string
  configurationDigest: string
  discoveryContextDigest?: string
}
type CursorPayload = LegacyCursorPayload | RankedCursorPayload

type CursorDecodeResult = { ok: true; payload: CursorPayload } | { ok: false; reason: 'invalid' }

type BlueprintCatalogPageResult =
  | {
      ok: true
      page: PageResponse
      offset: number
      snapshotId: string
      rankingContext?: {
        mode: 'baseline_v1' | 'catalog'
        algorithmVersion: string
        configurationVersion: string
        configurationDigest: string
        asOf: string
      }
    }
  | { ok: false; reason: 'invalid_cursor' | 'stale_cursor' }

const CATEGORY_SEARCH_TERMS: Record<
  (typeof BLUEPRINT_BROWSE_CATEGORIES)[number],
  readonly string[]
> = {
  weddings: ['Weddings', 'Bodas'],
  birthdays: ['Birthdays', 'Cumpleaños'],
  holidays: ['Holidays', 'Festividades'],
  engagements: ['Engagements', 'Compromisos'],
  showers: ['Showers & Welcomes', 'Fiestas de bienvenida'],
  bachelor_parties: ['Bachelor & Bachelorette', 'Despedidas de soltería'],
  anniversaries: ['Anniversaries', 'Aniversarios'],
  graduations: ['Graduations', 'Graduaciones'],
  reunions: ['Family Reunions', 'Reuniones familiares'],
  dinner_parties: ['Dinner Parties', 'Cenas con amigos'],
  picnics: ['Picnics & Outdoors', 'Pícnics y aire libre'],
  game_nights: ['Game Nights', 'Noches de juegos'],
  trips: ['Trips & Getaways', 'Viajes y escapadas'],
  cottage_stays: ['Cottage & Cabin Stays', 'Estancias en cabañas'],
  guest_stays: ['Guest Stays', 'Estancias de huéspedes'],
  retreats: ['Team Retreats', 'Retiros de equipo'],
  community: ['Community Gatherings', 'Encuentros comunitarios'],
  events: ['Other Events', 'Otros eventos'],
}

export type BlueprintDiscoverySessionContext = {
  version: 1
  sessionId: string
  startedAt: string
  seen: Array<{ catalogKey: string; lastSeenAt: string }>
}

export type BlueprintCatalogPageInput = BlueprintCatalogPageRequest & {
  /** Parsed from X-Gatherory-Discovery-Context at the HTTP boundary. */
  discoverySession?: BlueprintDiscoverySessionContext
}

export const BLUEPRINT_DISCOVERY_CONTEXT_HEADER = 'X-Gatherory-Discovery-Context'
export const BLUEPRINT_DISCOVERY_CONTEXT_MAX_BYTES = 16_384
export const BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
export const BLUEPRINT_DISCOVERY_REPEAT_COOLDOWN_MS = 24 * 60 * 60 * 1000
const BLUEPRINT_UNSEEN_FIRST_ALGORITHM_VERSION = 'blueprint-unseen-first-v1'
const BLUEPRINT_PERSONAL_LIKES_UNSEEN_FIRST_ALGORITHM_VERSION =
  'blueprint-personal-likes-unseen-first-v1'

/** Validate the compact, device-local context before it reaches ranking. */
export function parseBlueprintDiscoverySessionContext(
  raw: string,
  now = new Date()
): BlueprintDiscoverySessionContext | undefined {
  if (Buffer.byteLength(raw, 'utf8') > BLUEPRINT_DISCOVERY_CONTEXT_MAX_BYTES) return undefined
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return undefined
  }
  const parsed = z
    .object({
      version: z.literal(1),
      sessionId: z.uuid(),
      startedAt: z.iso.datetime().min(20).max(40),
      seen: z
        .array(
          z.object({
            catalogKey: z.string().min(1).max(160),
            lastSeenAt: z.iso.datetime().min(20).max(40),
          }).strict()
        )
        .max(200),
    })
    .strict()
    .safeParse(value)
  if (!parsed.success) return undefined
  const startedAt = Date.parse(parsed.data.startedAt)
  const nowMs = now.getTime()
  if (!Number.isFinite(startedAt) || startedAt > nowMs + 60_000) return undefined
  const keys = new Set<string>()
  for (const item of parsed.data.seen) {
    const lastSeenAt = Date.parse(item.lastSeenAt)
    if (
      keys.has(item.catalogKey) ||
      !Number.isFinite(lastSeenAt) ||
      lastSeenAt > startedAt ||
      lastSeenAt > nowMs ||
      startedAt - lastSeenAt > BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS
    ) return undefined
    keys.add(item.catalogKey)
  }
  return parsed.data
}

const BlueprintCatalogCursorSchema = z
  .object({
    version: z.literal(1),
    catalogDigest: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    limit: z.number().int().min(1).max(BLUEPRINT_DISCOVERY_LIMITS.maxPageSize),
    category: z.enum(BLUEPRINT_BROWSE_CATEGORIES).nullable(),
    query: z.string().max(BLUEPRINT_DISCOVERY_LIMITS.queryChars),
    afterCatalogKey: z.string().min(1).max(160),
  })
  .strict()

const RankedBlueprintCatalogCursorSchema = BlueprintCatalogCursorSchema.omit({ version: true })
  .extend({
    version: z.literal(2),
    ranking: z.literal('baseline_v1'),
    mode: z.enum(['baseline_v1', 'catalog']),
    asOf: z.iso.datetime().min(20).max(40),
    configurationDigest: z
      .string()
      .length(64)
      .regex(/^[a-f0-9]{64}$/),
    discoveryContextDigest: z.string().length(64).regex(/^[a-f0-9]{64}$/).optional(),
  })
  .strict()
const RANKING_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000

// Bump when extraction, tokenization or relevance rules change. Dictionary
// contents are also included directly in the snapshot digest below.
const BLUEPRINT_SEARCH_VERSION = 'content-search-v3'
const SEARCH_SCORING_POLICY = {
  exactTitle: 0,
  titlePhrase: 1,
  titleConcepts: 2,
  name: 3,
  nestedTitle: 4,
  summaryOrNotes: 5,
  relatedContent: 6,
  metadata: 7,
  typoMinLength: 5,
  typoMaxEdits: 1,
  typoCorrection: 'unique-authored-token-or-single-canonical-alias',
  typoEvidence: 'inferred',
  metadataFallback: 'whole-query-only',
} as const
const SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  outdoor: ['outdoors'],
  outdoors: ['outdoors'],
  'aire libre': ['outdoors'],
  'al aire libre': ['outdoors'],
  picnic: ['picnic'],
  picnics: ['picnic'],
  camping: ['camping'],
  camp: ['camping'],
  acampada: ['camping'],
  acampar: ['camping'],
  garden: ['garden'],
  gardens: ['garden'],
  jardin: ['garden'],
  jardines: ['garden'],
  bonfire: ['bonfire'],
  bonfires: ['bonfire'],
  fogata: ['bonfire'],
  fogatas: ['bonfire'],
  boda: ['wedding'],
  bodas: ['wedding'],
  wedding: ['wedding'],
  weddings: ['wedding'],
  cumpleaños: ['birthday'],
  cumpleanos: ['birthday'],
  birthday: ['birthday'],
  birthdays: ['birthday'],
}
const RELATED_TERMS: Readonly<Record<string, readonly string[]>> = {
  outdoors: ['picnic', 'camping', 'garden', 'bonfire'],
  bride: ['bridal'],
  brides: ['bridal'],
  wedding: [
    'bridal shower',
    'bridal celebration',
    'bridal bouquet',
    'nuptial celebration',
    'nuptials',
  ],
}

type SearchSource = {
  kind:
    | 'blueprint-name'
    | 'child-title'
    | 'idea-title'
    | 'blueprint-summary'
    | 'idea-notes'
    | 'metadata'
  text: string
  sourceKey?: string
  target?: { kind: 'main' } | { kind: 'child'; key: string }
}
type SearchProjection = { sources: SearchSource[] }

function catalogSearchProjection(
  entry: BuiltBlueprintCatalog['entries'][number]
): SearchProjection {
  const sources: SearchSource[] = [
    {
      kind: 'blueprint-name',
      text: entry.definition.blueprint.name,
      sourceKey: entry.catalogKey,
    },
    {
      kind: 'blueprint-summary',
      text: entry.discovery.summary,
      sourceKey: entry.catalogKey,
    },
  ]
  const tree = entry.definition.modules
    .map((candidate) => BlueprintExperienceTreeModuleSchema.safeParse(candidate))
    .find((result) => result.success)
  const children = new Map(
    tree?.success ? tree.data.config.children.map((child) => [child.key, child.title]) : []
  )
  if (tree?.success) {
    for (const child of tree.data.config.children) {
      sources.push({ kind: 'child-title', text: child.title, sourceKey: child.key })
    }
  }
  const ideas = entry.definition.modules
    .map((candidate) => BlueprintIdeasModuleSchema.safeParse(candidate))
    .find((result) => result.success)
  if (ideas?.success) {
    for (const idea of ideas.data.config.ideas) {
      if (idea.target.kind === 'child' && !children.has(idea.target.key)) continue
      const target =
        idea.target.kind === 'main'
          ? { kind: 'main' as const }
          : { kind: 'child' as const, key: idea.target.key }
      sources.push({
        kind: 'idea-title',
        text: idea.title,
        sourceKey: idea.key,
        target,
      })
      if (idea.notes) {
        sources.push({
          kind: 'idea-notes',
          text: idea.notes,
          sourceKey: idea.key,
          target,
        })
      }
    }
  }
  sources.push(
    { kind: 'metadata', text: entry.catalogKey },
    ...entry.discovery.categories.flatMap((category) => [
      { kind: 'metadata' as const, text: category },
      ...CATEGORY_SEARCH_TERMS[category].map((text) => ({ kind: 'metadata' as const, text })),
    ]),
    ...entry.discovery.tags.map((text) => ({ kind: 'metadata' as const, text }))
  )
  return { sources }
}

function normalizedSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function searchWords(value: string): string[] {
  return normalizedSearchText(value).match(/[\p{L}\p{N}]+/gu) ?? []
}

function queryConcepts(query: string): string[][] {
  const words = searchWords(query)
  const aliases = Object.keys(SEARCH_ALIASES).sort(
    (a, b) => searchWords(b).length - searchWords(a).length
  )
  const concepts: string[][] = []
  for (let index = 0; index < words.length;) {
    const alias = aliases.find((candidate) => {
      const aliasWords = searchWords(candidate)
      return aliasWords.every((word, offset) => words[index + offset] === word)
    })
    if (alias) {
      concepts.push(SEARCH_ALIASES[alias]!.map((term) => term))
      index += searchWords(alias).length
    } else {
      const word = words[index++]!
      concepts.push(SEARCH_ALIASES[word] ? [...SEARCH_ALIASES[word]!] : [word])
    }
  }
  const seen = new Set<string>()
  return concepts.filter((concept) => {
    const identity = [...concept].sort().join('|')
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}

function aliasesForConcept(concepts: string[]): string[] {
  return Object.entries(SEARCH_ALIASES)
    .filter(([, canonical]) => canonical.some((value) => concepts.includes(value)))
    .map(([alias]) => alias)
}

function fuzzyAliasTerms(concept: string[], knownWords: ReadonlySet<string>): string[] {
  const queryWord = concept.length === 1 ? concept[0]! : ''
  if (queryWord.length < SEARCH_SCORING_POLICY.typoMinLength || knownWords.has(queryWord)) return []
  const candidates = new Set<string>()
  const addCandidate = (word: string) => {
    const canonical = SEARCH_ALIASES[word]
    if (canonical) canonical.forEach((term) => candidates.add(term))
    else candidates.add(word)
  }
  const fuzzyWords = [...knownWords].filter((word) => oneEditApart(queryWord, word))
  fuzzyWords.forEach(addCandidate)
  for (const [alias, canonical] of Object.entries(SEARCH_ALIASES)) {
    if (searchWords(alias).length === 1 && oneEditApart(queryWord, searchWords(alias)[0]!)) {
      canonical.forEach((term) => candidates.add(term))
    }
    if (canonical.some((term) => term.length > 0 && oneEditApart(queryWord, term))) {
      canonical.forEach((term) => candidates.add(term))
    }
  }
  if (candidates.size !== 1) return []
  const [canonical] = candidates
  return canonical ? [...new Set([canonical, ...aliasesForConcept([canonical])])] : []
}

function sourceTier(source: SearchSource): number {
  return source.kind === 'blueprint-name'
    ? SEARCH_SCORING_POLICY.name
    : source.kind === 'child-title' || source.kind === 'idea-title'
      ? SEARCH_SCORING_POLICY.nestedTitle
      : source.kind === 'blueprint-summary' || source.kind === 'idea-notes'
        ? SEARCH_SCORING_POLICY.summaryOrNotes
        : SEARCH_SCORING_POLICY.metadata
}

export function oneEditApart(left: string, right: string): boolean {
  const leftCharacters = Array.from(left)
  const rightCharacters = Array.from(right)
  if (left === right || Math.abs(leftCharacters.length - rightCharacters.length) > 1) return false
  let leftIndex = 0
  let rightIndex = 0
  let edits = 0
  while (leftIndex < leftCharacters.length && rightIndex < rightCharacters.length) {
    if (leftCharacters[leftIndex] === rightCharacters[rightIndex]) {
      leftIndex++
      rightIndex++
      continue
    }
    if (++edits > 1) return false
    if (
      leftCharacters.length === rightCharacters.length &&
      leftIndex + 1 < leftCharacters.length &&
      rightIndex + 1 < rightCharacters.length &&
      leftCharacters[leftIndex] === rightCharacters[rightIndex + 1] &&
      leftCharacters[leftIndex + 1] === rightCharacters[rightIndex]
    ) {
      leftIndex += 2
      rightIndex += 2
    } else if (leftCharacters.length === rightCharacters.length) {
      leftIndex++
      rightIndex++
    } else if (leftCharacters.length > rightCharacters.length) leftIndex++
    else rightIndex++
  }
  return (
    edits + Number(leftIndex < leftCharacters.length || rightIndex < rightCharacters.length) <= 1
  )
}

type SearchEvidence = { inference: 0 | 1 | 2; field: number }

type SearchTermMatcher = { direct: string[][]; inferred: string[][] }
type PreparedSearchSource = {
  source: SearchSource
  words: string[]
  concepts: string[][]
}

function buildSearchTermMatchers(
  concepts: string[][],
  knownWords: ReadonlySet<string>
): SearchTermMatcher[] {
  return concepts.map((concept) => {
    const typoTerms = fuzzyAliasTerms(concept, knownWords)
    const relatedConcepts = [...concept, ...typoTerms].flatMap((term) => RELATED_TERMS[term] ?? [])
    const toWordPhrases = (terms: string[]) =>
      [...new Set(terms)].map(searchWords).filter((words) => words.length > 0)
    return {
      direct: toWordPhrases([...concept, ...aliasesForConcept(concept)]),
      inferred: toWordPhrases([
        ...typoTerms,
        ...aliasesForConcept(typoTerms),
        ...relatedConcepts,
        ...aliasesForConcept(relatedConcepts),
      ]),
    }
  })
}

function containsWords(sourceWords: string[], phraseWords: string[]): boolean {
  if (!phraseWords.length || phraseWords.length > sourceWords.length) return false
  return sourceWords.some((_, index) =>
    phraseWords.every((word, offset) => sourceWords[index + offset] === word)
  )
}

function matchesContiguousConcepts(sourceWords: string[], matchers: SearchTermMatcher[]): boolean {
  const matchesFrom = (conceptIndex: number, wordIndex: number): boolean => {
    if (conceptIndex === matchers.length) return true
    return matchers[conceptIndex]!.direct.some(
      (termWords) =>
        termWords.every((word, offset) => sourceWords[wordIndex + offset] === word) &&
        matchesFrom(conceptIndex + 1, wordIndex + termWords.length)
    )
  }
  return sourceWords.some((_, index) => matchesFrom(0, index))
}

function matchingTier(
  { source, words }: PreparedSearchSource,
  matcher: SearchTermMatcher
): SearchEvidence | undefined {
  if (matcher.direct.some((termWords) => containsWords(words, termWords))) {
    return { inference: source.kind === 'metadata' ? 2 : 0, field: sourceTier(source) }
  }
  if (
    source.kind !== 'metadata' &&
    matcher.inferred.some((termWords) => containsWords(words, termWords))
  ) {
    return { inference: 1, field: SEARCH_SCORING_POLICY.relatedContent }
  }
  return undefined
}

function searchRank(
  projection: PreparedSearchSource[],
  concepts: string[][],
  query: string,
  matchers: SearchTermMatcher[]
): number[] | undefined {
  const perConcept = matchers.map((matcher) => {
    const tiers = projection
      .map((source) => matchingTier(source, matcher))
      .filter((tier): tier is SearchEvidence => tier !== undefined)
    return tiers.length
      ? tiers.sort((left, right) => left.inference - right.inference || left.field - right.field)[0]
      : undefined
  })
  // Metadata may support a wholly metadata-only query. It cannot supply a
  // missing concept alongside authored evidence and manufacture a phrase.
  const authoredEvidence = perConcept.map((evidence) => evidence?.inference !== 2)
  if (authoredEvidence.some(Boolean) && authoredEvidence.some((has) => !has)) return undefined
  if (perConcept.some((tier) => tier === undefined)) return undefined
  const queryWords = searchWords(query)
  const titleSources = projection.filter(
    ({ source }) =>
      source.kind === 'blueprint-name' ||
      source.kind === 'child-title' ||
      source.kind === 'idea-title'
  )
  const exactTitle = titleSources.some(
    ({ source, words, concepts: sourceConcepts }) =>
      source.kind === 'blueprint-name' &&
      (() => {
        const rawExact =
          words.length === queryWords.length &&
          words.every((word, index) => word === queryWords[index])
        const semanticExact =
          sourceConcepts.length === matchers.length &&
          sourceConcepts.every((value, index) =>
            value.some((term) => concepts[index]!.includes(term))
          )
        return rawExact || semanticExact
      })()
  )
  const titlePhrase = titleSources.some(
    ({ source, words }) =>
      source.kind === 'blueprint-name' && matchesContiguousConcepts(words, matchers)
  )
  const titleConcepts = titleSources.some(
    ({ source, words }) =>
      source.kind === 'blueprint-name' &&
      matchers.every((matcher) =>
        matcher.direct.some((termWords) => containsWords(words, termWords))
      )
  )
  const evidence = perConcept as SearchEvidence[]
  const ranks = evidence.map(({ field }) => field).sort((left, right) => left - right)
  const inferred = evidence.map(({ inference }) => inference).sort((left, right) => left - right)
  return [
    Math.max(...inferred),
    inferred.reduce<number>((sum, tier) => sum + tier, 0),
    exactTitle
      ? SEARCH_SCORING_POLICY.exactTitle
      : titlePhrase
        ? SEARCH_SCORING_POLICY.titlePhrase
        : titleConcepts
          ? SEARCH_SCORING_POLICY.titleConcepts
          : 3,
    Math.max(...ranks),
    ranks.reduce((sum, tier) => sum + tier, 0),
    ...ranks,
  ]
}

function compareSearchRank(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

function catalogDigest(catalog: BuiltBlueprintCatalog): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        catalog.entries.map((entry) => [
          entry.catalogKey,
          entry.revision,
          entry.contentHash,
          entry.creator?.displayName ?? null,
          entry.discovery.coverImageURL ?? null,
          entry.discovery.coverImages ?? null,
          catalogSearchProjection(entry),
          BLUEPRINT_SEARCH_VERSION,
          SEARCH_ALIASES,
          RELATED_TERMS,
          SEARCH_SCORING_POLICY,
        ])
      )
    )
    .digest('base64url')
}

function decodeCatalogCursor(value: string): CursorDecodeResult {
  try {
    const bytes = Buffer.from(value, 'base64url')
    if (bytes.toString('base64url') !== value) return { ok: false, reason: 'invalid' }
    const parsed = z
      .union([BlueprintCatalogCursorSchema, RankedBlueprintCatalogCursorSchema])
      .safeParse(JSON.parse(bytes.toString('utf8')))
    return parsed.success ? { ok: true, payload: parsed.data } : { ok: false, reason: 'invalid' }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

function encodeCatalogCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

/** Page an already-authorized catalog snapshot without changing its visibility boundary. */
export function pageBlueprintCatalog(
  catalog: BuiltBlueprintCatalog,
  request: BlueprintCatalogPageInput,
  actorScope?: string,
  options: {
    now?: Date
    enabled?: boolean
    configuration?: BlueprintRankingConfig
    personalLikes?: {
      enabled: boolean
      affinity: Pick<BlueprintLikeAffinityResult, 'scores' | 'fingerprint'>
    }
  } = {}
): BlueprintCatalogPageResult {
  const now = options.now ?? new Date()
  const configuration = options.configuration ?? BLUEPRINT_RANKING_CONFIG
  const validConfiguration = isValidBlueprintRankingConfig(configuration)
  let rankingMode: 'baseline_v1' | 'catalog' =
    options.enabled !== false && validConfiguration ? 'baseline_v1' : 'catalog'
  const hasSearchQuery = request.q.trim().length > 0
  // Search relevance remains the hard ordering boundary. Session context only
  // affects explicitly ranked browse pages.
  let discoverySession: BlueprintDiscoverySessionContext | undefined
  if (
    request.ranking &&
    !hasSearchQuery &&
    rankingMode === 'baseline_v1' &&
    request.discoverySession
  ) {
    try {
      discoverySession = parseBlueprintDiscoverySessionContext(
        JSON.stringify(request.discoverySession),
        now
      )
    } catch {
      discoverySession = undefined
    }
  }
  const configurationDigest = validConfiguration
    ? configurationFingerprint(configuration)
    : createHash('sha256').update('invalid-configuration').digest('hex')
  let cursor: CursorPayload | undefined
  if (request.cursor) {
    const decoded = decodeCatalogCursor(request.cursor)
    if (!decoded.ok) return { ok: false, reason: 'invalid_cursor' }
    cursor = decoded.payload
    if (Boolean(request.ranking) !== (cursor.version === 2))
      return { ok: false, reason: 'stale_cursor' }
  }
  const asOf =
    cursor?.version === 2
      ? cursor.asOf
      : (discoverySession?.startedAt ?? now.toISOString())
  const snapshotAge = now.getTime() - Date.parse(asOf)
  if (request.ranking && (snapshotAge < -60_000 || snapshotAge >= RANKING_SNAPSHOT_TTL_MS))
    return { ok: false, reason: 'stale_cursor' }
  const legacyDigest = actorScope
    ? createHash('sha256')
        .update(JSON.stringify([catalogDigest(catalog), actorScope]))
        .digest('base64url')
    : catalogDigest(catalog)
  const concepts = queryConcepts(request.q)
  const searchProjections = catalog.entries.map((entry) => ({
    entry,
    projection: catalogSearchProjection(entry).sources.map((source) => ({
      source,
      words: searchWords(source.text),
      concepts: queryConcepts(source.text),
    })),
  }))
  const knownWords = new Set(
    searchProjections.flatMap(({ projection }) =>
      projection.filter(({ source }) => source.kind !== 'metadata').flatMap(({ words }) => words)
    )
  )
  const matchers = buildSearchTermMatchers(concepts, knownWords)
  const ranked = concepts.length
    ? searchProjections
        .map(({ entry, projection }) => ({
          entry,
          rank: searchRank(projection, concepts, request.q, matchers),
        }))
        .filter(
          (item): item is { entry: BuiltBlueprintCatalog['entries'][number]; rank: number[] } =>
            item.rank !== undefined
        )
        .sort(
          (left, right) =>
            compareSearchRank(left.rank, right.rank) ||
            (left.entry.catalogKey < right.entry.catalogKey
              ? -1
              : left.entry.catalogKey > right.entry.catalogKey
                ? 1
                : 0)
        )
    : hasSearchQuery
      ? []
      : catalog.entries.map((entry) => ({ entry, rank: [] as number[] }))
  const searchFiltered = ranked.map(({ entry }) => entry)
  const availableCategories = BLUEPRINT_BROWSE_CATEGORIES.filter((category) =>
    searchFiltered.some((entry) => entry.discovery.categories.includes(category))
  )
  const selectedCategory = request.category
  let filtered = selectedCategory
    ? searchFiltered.filter((entry) => entry.discovery.categories.includes(selectedCategory))
    : searchFiltered

  // Personal Like ordering is a private, ranked-only adjustment. Its
  // preference fingerprint is used only inside the combined cursor digest.
  const personalLikes =
    request.ranking && rankingMode === 'baseline_v1' && options.personalLikes?.enabled
      ? options.personalLikes
      : undefined
  let personalRankingApplied = Boolean(personalLikes)
  const relevanceByKey = new Map(ranked.map(({ entry, rank }) => [entry.catalogKey, rank]))

  if (request.ranking && rankingMode === 'baseline_v1') {
    try {
      const ranking = rankBlueprintRecommendations(
        filtered.map((entry) => ({
          catalogKey: entry.catalogKey,
          relevance: relevanceByKey.get(entry.catalogKey) ?? [],
          metadata: entry.rankingMetadata,
        })),
        asOf,
        configuration,
        personalLikes?.affinity.scores,
        discoverySession?.sessionId
      )
      const byKey = new Map(filtered.map((entry) => [entry.catalogKey, entry]))
      if (
        ranking.orderedKeys.length !== filtered.length ||
        new Set(ranking.orderedKeys).size !== filtered.length ||
        ranking.orderedKeys.some((key) => !byKey.has(key))
      )
        throw new Error('Invalid ranking output')
      filtered = ranking.orderedKeys.map((key) => byKey.get(key)!)
    } catch {
      if (personalLikes) {
        try {
          const baseline = rankBlueprintRecommendations(
            filtered.map((entry) => ({
              catalogKey: entry.catalogKey,
              relevance: relevanceByKey.get(entry.catalogKey) ?? [],
              metadata: entry.rankingMetadata,
            })),
            asOf,
            configuration,
            undefined,
            discoverySession?.sessionId
          )
          const baselineByKey = new Map(filtered.map((entry) => [entry.catalogKey, entry]))
          if (
            baseline.orderedKeys.length !== filtered.length ||
            new Set(baseline.orderedKeys).size !== filtered.length ||
            baseline.orderedKeys.some((key) => !baselineByKey.has(key))
          )
            throw new Error('Invalid baseline ranking output')
          filtered = baseline.orderedKeys.map((key) => baselineByKey.get(key)!)
          personalRankingApplied = false
        } catch {
          rankingMode = 'catalog'
          personalRankingApplied = false
          discoverySession = undefined
        }
      } else {
        // Keep the existing content-relevance/key ordering if the baseline policy is unavailable.
        rankingMode = 'catalog'
        discoverySession = undefined
      }
    }
  }
  if (discoverySession && filtered.length > 1) {
    const baselinePosition = new Map(filtered.map((entry, index) => [entry.catalogKey, index]))
    const seenByKey = new Map(discoverySession.seen.map((item) => [item.catalogKey, item.lastSeenAt]))
    const asOfMs = Date.parse(discoverySession.startedAt)
    const bucketFor = (catalogKey: string) => {
      const lastSeenAt = seenByKey.get(catalogKey)
      return lastSeenAt === undefined
        ? 0
        : asOfMs - Date.parse(lastSeenAt) >= BLUEPRINT_DISCOVERY_REPEAT_COOLDOWN_MS
          ? 1
          : 2
    }
    const freshnessOrdered = [...filtered].sort((left, right) => {
      const leftSeenAt = seenByKey.get(left.catalogKey)
      const rightSeenAt = seenByKey.get(right.catalogKey)
      const leftBucket = bucketFor(left.catalogKey)
      const rightBucket = bucketFor(right.catalogKey)
      if (leftBucket !== rightBucket) return leftBucket - rightBucket
      if (leftSeenAt && rightSeenAt) {
        const bySeenTime = Date.parse(leftSeenAt) - Date.parse(rightSeenAt)
        if (bySeenTime !== 0) return bySeenTime
      }
      return (baselinePosition.get(left.catalogKey) ?? 0) - (baselinePosition.get(right.catalogKey) ?? 0)
    })
    const maxCreatorRun = validConfiguration
      ? configuration.maxConsecutiveAuthoredPerCreator
      : BLUEPRINT_RANKING_CONFIG.maxConsecutiveAuthoredPerCreator
    const reordered: typeof filtered = []
    // Preserve the baseline creator cap within each freshness tier when a
    // lower-priority candidate from another creator is available. The cap is
    // soft: it can relax when the remaining tier contains one creator only.
    for (const bucket of [0, 1, 2]) {
      const remaining = freshnessOrdered.filter((entry) => bucketFor(entry.catalogKey) === bucket)
      let previousCreator: string | undefined
      let creatorRun = 0
      while (remaining.length > 0) {
        let selectedIndex = 0
        if (previousCreator && creatorRun >= maxCreatorRun) {
          const alternativeIndex = remaining.findIndex(
            (entry) => (entry.rankingMetadata?.creatorKey ?? undefined) !== previousCreator
          )
          if (alternativeIndex >= 0) selectedIndex = alternativeIndex
        }
        const [selected] = remaining.splice(selectedIndex, 1)
        if (!selected) break
        reordered.push(selected)
        const creator = selected.rankingMetadata?.creatorKey ?? undefined
        if (creator && creator === previousCreator) creatorRun++
        else {
          previousCreator = creator
          creatorRun = creator ? 1 : 0
        }
      }
    }
    filtered = reordered
  }
  const effectiveConfigurationDigest = personalRankingApplied
    ? createHash('sha256')
        .update(JSON.stringify([configurationDigest, BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT]))
        .digest('hex')
    : configurationDigest
  const baseConfigurationVersion = personalRankingApplied
    ? BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION
    : validConfiguration
      ? configuration.version
      : 'unavailable'
  const algorithmVersion = discoverySession
    ? personalRankingApplied
      ? BLUEPRINT_PERSONAL_LIKES_UNSEEN_FIRST_ALGORITHM_VERSION
      : BLUEPRINT_UNSEEN_FIRST_ALGORITHM_VERSION
    : personalRankingApplied
      ? BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION
      : BLUEPRINT_RANKING_ALGORITHM_VERSION
  const configurationVersion = discoverySession
    ? `${baseConfigurationVersion}+unseen-first-v1`
    : baseConfigurationVersion
  const digest = request.ranking
    ? createHash('sha256')
        .update(
          JSON.stringify([
            legacyDigest,
            BLUEPRINT_RANKING_ALGORITHM_VERSION,
            effectiveConfigurationDigest,
            rankingMode,
            asOf,
            discoverySession
              ? [
                  'unseen-first-v1',
                  BLUEPRINT_DISCOVERY_REPEAT_COOLDOWN_MS,
                  BLUEPRINT_DISCOVERY_SEEN_MAX_AGE_MS,
                  createHash('sha256').update(JSON.stringify(discoverySession)).digest('hex'),
                ]
              : null,
            ...(personalRankingApplied
              ? ['personal-likes', personalLikes?.affinity.fingerprint ?? null]
              : []),
            catalog.entries.map((entry) => [entry.catalogKey, entry.rankingMetadata ?? null]),
            filtered.map((entry) => entry.catalogKey),
          ])
        )
        .digest('base64url')
    : legacyDigest
  if (
    cursor?.version === 2 &&
    (cursor.mode !== rankingMode || cursor.configurationDigest !== effectiveConfigurationDigest ||
      cursor.discoveryContextDigest !== (discoverySession
        ? createHash('sha256').update(JSON.stringify(discoverySession)).digest('hex')
        : undefined))
  )
    return { ok: false, reason: 'stale_cursor' }

  let afterIndex = -1
  if (cursor) {
    if (
      cursor.catalogDigest !== digest ||
      cursor.limit !== request.limit ||
      cursor.category !== (request.category ?? null) ||
      cursor.query !== request.q
    ) {
      return { ok: false, reason: 'stale_cursor' }
    }
    afterIndex = filtered.findIndex((entry) => entry.catalogKey === cursor.afterCatalogKey)
    if (afterIndex < 0) return { ok: false, reason: 'stale_cursor' }
  }

  const startIndex = afterIndex + 1
  const entries = filtered.slice(startIndex, startIndex + request.limit)
  const hasMore = startIndex + entries.length < filtered.length
  const lastEntry = entries.at(-1)
  const nextCursor =
    hasMore && lastEntry
      ? encodeCatalogCursor({
          ...(request.ranking
            ? {
                version: 2 as const,
                ranking: 'baseline_v1' as const,
                mode: rankingMode,
                asOf,
                configurationDigest: effectiveConfigurationDigest,
                ...(discoverySession
                  ? {
                      discoveryContextDigest: createHash('sha256')
                        .update(JSON.stringify(discoverySession))
                        .digest('hex'),
                    }
                  : {}),
              }
            : { version: 1 as const }),
          catalogDigest: digest,
          limit: request.limit,
          category: request.category ?? null,
          query: request.q,
          afterCatalogKey: lastEntry.catalogKey,
        })
      : undefined

  // Persist a one-way scope digest, never the cursor or its encoded search text.
  const snapshotId = createHash('sha256')
    .update(JSON.stringify([digest, request.q, request.category ?? null, request.limit]))
    .digest('hex')
  return {
    ok: true,
    offset: startIndex,
    snapshotId,
    ...(request.ranking
      ? {
          rankingContext: {
            mode: rankingMode,
            algorithmVersion,
            configurationVersion,
            configurationDigest: effectiveConfigurationDigest,
            asOf,
          },
        }
      : {}),
    page: BlueprintCatalogPageResponseSchema.parse({
      entries,
      availableCategories,
      ...(request.ranking
        ? {
            ranking: {
              mode: rankingMode,
              algorithmVersion,
              configurationVersion,
              asOf,
              snapshotId,
            },
          }
        : {}),
      ...(nextCursor ? { nextCursor } : {}),
    }),
  }
}
