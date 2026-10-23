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
} from '../tests/fixtures/blueprint-like-affinity-v1'
import {
  BLUEPRINT_RANKING_ALGORITHM_VERSION,
  BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
  rankBlueprintRecommendations,
  type BlueprintRankingCandidate,
} from '../src/server/blueprints/services/blueprint-ranking'

const AS_OF = '2026-10-22T12:00:00.000Z'
const FORMAT_VERSION = 1
const SCENARIO_VERSION = 'personal-like-offline-v1'
const ARTIFACT_PATH = resolve(
  'docs/roadmaps/blueprint-ranking-roadmap/artifacts/personal-like-evaluation.json'
)
const check = process.argv.includes('--check')

function exactLike(source: BlueprintLikeAffinitySource): BlueprintLikeAffinityLike {
  return {
    catalogKey: source.catalogKey,
    liked: true,
    likeRevision: source.revision,
    likeContentHash: source.contentHash,
  }
}

function source(
  catalogKey: string,
  text: string,
  creatorKey?: string,
  relevance: number[] = []
): { source: BlueprintLikeAffinitySource; candidate: BlueprintRankingCandidate } {
  return {
    source: {
      catalogKey,
      revision: 1,
      contentHash: createHash('sha256').update(catalogKey).digest('hex'),
      publicText: [text],
    },
    candidate: {
      catalogKey,
      relevance,
      ...(creatorKey
        ? { metadata: { creatorKey, firstPublishedAt: '2026-07-01T00:00:00.000Z' } }
        : {}),
    },
  }
}

function creatorMetrics(candidates: readonly BlueprintRankingCandidate[], keys: string[]) {
  const creatorByKey = new Map(
    candidates.map((candidate) => [candidate.catalogKey, candidate.metadata?.creatorKey])
  )
  const counts = new Map<string, number>()
  for (const key of keys) {
    const creator = creatorByKey.get(key)
    if (creator) counts.set(creator, (counts.get(creator) ?? 0) + 1)
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
  return {
    authoredCount: total,
    distinctCreatorCount: counts.size,
    topCreatorShare: total === 0 ? 0 : Math.max(0, ...counts.values()) / total,
    creatorHhi:
      total === 0 ? 0 : [...counts.values()].reduce((sum, count) => sum + (count / total) ** 2, 0),
  }
}

function maxCreatorRun(candidates: readonly BlueprintRankingCandidate[], keys: readonly string[]) {
  const creators = new Map(
    candidates.map((candidate) => [candidate.catalogKey, candidate.metadata?.creatorKey])
  )
  let maximum = 0
  let previous: string | undefined
  let run = 0
  for (const key of keys) {
    const creator = creators.get(key) ?? undefined
    if (!creator || creator !== previous) {
      previous = creator
      run = creator ? 1 : 0
    } else {
      run++
    }
    maximum = Math.max(maximum, run)
  }
  return maximum
}

function recentShare(candidates: readonly BlueprintRankingCandidate[], keys: readonly string[]) {
  const cutoff = Date.parse(AS_OF) - 30 * 24 * 60 * 60 * 1000
  const byKey = new Map(candidates.map((candidate) => [candidate.catalogKey, candidate]))
  const recent = keys.filter((key) => {
    const publishedAt = byKey.get(key)?.metadata?.firstPublishedAt
    const timestamp = publishedAt ? Date.parse(publishedAt) : Number.NaN
    return Number.isFinite(timestamp) && timestamp > cutoff && timestamp <= Date.parse(AS_OF)
  }).length
  return recent / Math.max(1, keys.length)
}

function relevanceViolationCount(
  candidates: readonly BlueprintRankingCandidate[],
  keys: readonly string[]
) {
  const relevanceByKey = new Map(
    candidates.map((candidate) => [candidate.catalogKey, candidate.relevance])
  )
  let violations = 0
  for (let index = 1; index < keys.length; index++) {
    const previous = relevanceByKey.get(keys[index - 1]!) ?? []
    const current = relevanceByKey.get(keys[index]!) ?? []
    const width = Math.max(previous.length, current.length)
    let comparison = 0
    for (let component = 0; component < width; component++) {
      const left = previous[component] ?? 0
      const right = current[component] ?? 0
      if (left !== right) {
        comparison = left < right ? -1 : 1
        break
      }
    }
    if (comparison > 0) violations++
  }
  return violations
}

function compareOrders(
  baselineKeys: string[],
  personalKeys: string[],
  candidates: readonly BlueprintRankingCandidate[],
  scoreDiagnostics: ReturnType<typeof buildBlueprintLikeAffinity>['diagnostics'],
  scores: Readonly<Record<string, number>>
) {
  const baselineIndex = new Map(baselineKeys.map((key, index) => [key, index]))
  const personalIndex = new Map(personalKeys.map((key, index) => [key, index]))
  const compareTop = (limit: number) => ({
    baselineKeys: baselineKeys.slice(0, limit),
    personalKeys: personalKeys.slice(0, limit),
    baselineAuthoredShare:
      creatorMetrics(candidates, baselineKeys.slice(0, limit)).authoredCount /
      Math.max(1, Math.min(limit, baselineKeys.length)),
    personalAuthoredShare:
      creatorMetrics(candidates, personalKeys.slice(0, limit)).authoredCount /
      Math.max(1, Math.min(limit, personalKeys.length)),
    baselineCreatorConcentration: creatorMetrics(candidates, baselineKeys.slice(0, limit)),
    personalCreatorConcentration: creatorMetrics(candidates, personalKeys.slice(0, limit)),
  })
  return {
    itemCount: baselineKeys.length,
    orderChangedCount: baselineKeys.filter((key, index) => personalKeys[index] !== key).length,
    top10ChangedCount: baselineKeys.slice(0, 10).filter((key, index) => personalKeys[index] !== key)
      .length,
    positionChanges: [...baselineIndex].reduce(
      (count, [key, position]) => count + Number(personalIndex.get(key) !== position),
      0
    ),
    top10MembershipOverlapCount: baselineKeys
      .slice(0, 10)
      .filter((key) => new Set(personalKeys.slice(0, 10)).has(key)).length,
    maxCreatorRun: {
      baseline: maxCreatorRun(candidates, baselineKeys),
      personal: maxCreatorRun(candidates, personalKeys),
    },
    relevanceViolations: {
      baseline: relevanceViolationCount(candidates, baselineKeys),
      personal: relevanceViolationCount(candidates, personalKeys),
    },
    top10: compareTop(10),
    top20: compareTop(20),
    recentItemShare: {
      baselineTop10: recentShare(candidates, baselineKeys.slice(0, 10)),
      personalTop10: recentShare(candidates, personalKeys.slice(0, 10)),
      baselineTop20: recentShare(candidates, baselineKeys.slice(0, 20)),
      personalTop20: recentShare(candidates, personalKeys.slice(0, 20)),
    },
    affinity: {
      ...scoreDiagnostics,
      scoreDistribution: [0, 1, 2, 3].map((score) => ({
        score,
        candidateCount: candidates.filter(
          (candidate) => (scores[candidate.catalogKey] ?? 0) === score
        ).length,
      })),
    },
  }
}

function exactSourceLikes(sources: readonly BlueprintLikeAffinitySource[], keys: string[]) {
  const byKey = new Map(sources.map((item) => [item.catalogKey, item]))
  return keys.flatMap((key) => {
    const item = byKey.get(key)
    if (!item) throw new Error(`Evaluation profile references unknown current source: ${key}`)
    return [exactLike(item)]
  })
}

function traverseActual(
  catalog: ReturnType<typeof buildBlueprintCatalog>,
  affinity: ReturnType<typeof buildBlueprintLikeAffinity>,
  pageSize: number,
  personalized: boolean
) {
  const orderedKeys: string[] = []
  let cursor: string | undefined
  let pages = 0
  do {
    const page = pageBlueprintCatalog(
      catalog,
      { limit: pageSize, q: '', ranking: 'baseline_v1', ...(cursor ? { cursor } : {}) },
      'offline-likes-evaluation-actor',
      {
        now: new Date(AS_OF),
        ...(personalized ? { personalLikes: { enabled: true, affinity } } : {}),
      }
    )
    if (!page.ok) throw new Error(`Curated page failed: ${page.reason}`)
    if (page.page.ranking?.mode !== 'baseline_v1') throw new Error('Expected baseline_v1 traversal')
    orderedKeys.push(...page.page.entries.map(({ catalogKey }) => catalogKey))
    cursor = page.page.nextCursor
    pages++
    if (pages > catalog.entries.length + 1) throw new Error('Curated traversal did not terminate')
  } while (cursor)
  return {
    pageSize,
    pages,
    itemCount: orderedKeys.length,
    duplicateCount: orderedKeys.length - new Set(orderedKeys).size,
    complete:
      orderedKeys.length === catalog.entries.length &&
      new Set(orderedKeys).size === catalog.entries.length,
    orderedKeys,
  }
}

function profileEvaluation(
  description: string,
  sources: readonly BlueprintLikeAffinitySource[],
  candidates: readonly BlueprintRankingCandidate[],
  likes: readonly BlueprintLikeAffinityLike[]
) {
  const affinity = buildBlueprintLikeAffinity(sources, likes)
  const baseline = rankBlueprintRecommendations(candidates, AS_OF)
  const personal = rankBlueprintRecommendations(candidates, AS_OF, undefined, affinity.scores)
  const result = compareOrders(
    baseline.orderedKeys,
    personal.orderedKeys,
    candidates,
    affinity.diagnostics,
    affinity.scores
  )
  return { description, ...result }
}

function buildArtifact() {
  const catalog = buildBlueprintCatalog(blueprintStarters)
  const curatedSources = blueprintLikeAffinitySources(catalog)
  const curatedCandidates: BlueprintRankingCandidate[] = catalog.entries.map((entry) => ({
    catalogKey: entry.catalogKey,
    relevance: [],
    metadata: entry.rankingMetadata,
  }))
  const exact = (keys: string[]) => exactSourceLikes(curatedSources, keys)
  const mismatched = (keys: string[]) =>
    exact(keys).map((like) => ({ ...like, likeRevision: like.likeRevision! + 1 }))
  const profiles = {
    noHistory: profileEvaluation(
      'No Like rows; exact baseline ordering must remain unchanged.',
      curatedSources,
      curatedCandidates,
      []
    ),
    sparseOneLike: profileEvaluation(
      'One exact current curated Like.',
      curatedSources,
      curatedCandidates,
      exact(['wedding'])
    ),
    denseThreeLikes: profileEvaluation(
      'Three independent exact current Likes, scoped to one synthetic account.',
      curatedSources,
      curatedCandidates,
      exact(['wedding', 'birthday', 'park_picnic'])
    ),
    unliked: profileEvaluation(
      'A previously stored unliked state contributes no seed or boost.',
      curatedSources,
      curatedCandidates,
      exact(['wedding']).map((like) => ({ ...like, liked: false }))
    ),
    revisedLike: profileEvaluation(
      'A Like bound to an older source revision is rejected.',
      curatedSources,
      curatedCandidates,
      mismatched(['wedding'])
    ),
    withdrawnSource: profileEvaluation(
      'A Like whose source is absent from the current public catalog is rejected.',
      curatedSources,
      curatedCandidates,
      [
        {
          catalogKey: 'withdrawn-fixture',
          liked: true,
          likeRevision: 1,
          likeContentHash: 'a'.repeat(64),
        },
      ]
    ),
    otherAccount: profileEvaluation(
      'A separate account profile with a distinct Like set; profiles never combine.',
      curatedSources,
      curatedCandidates,
      exact(['thanksgiving', 'park_picnic'])
    ),
  }

  const syntheticRows = [
    source('synthetic-seed', 'wedding ceremony outdoor picnic family celebration music'),
    source('synthetic-outdoor', 'wedding outdoor picnic ceremony music flowers', 'creator-a'),
    source('synthetic-birthday', 'birthday outdoor picnic cake music games', 'creator-a'),
    source('synthetic-wedding', 'wedding ceremony venue reception flowers music', 'creator-a'),
    source(
      'synthetic-stuffing',
      `wedding outdoor picnic ${Array.from({ length: 90 }, (_, index) => `rare${index}`).join(' ')}`,
      'creator-b'
    ),
    source('synthetic-unrelated', 'tax preparation invoice accounting audit', 'creator-b'),
    source('synthetic-relevance-lower', 'wedding outdoor picnic ceremony music', 'creator-c', [1]),
  ]
  const syntheticSources = syntheticRows.map(({ source: item }) => item)
  const syntheticCandidates = syntheticRows.map(({ candidate }) => candidate)
  const syntheticProfiles = {
    oneSeed: profileEvaluation(
      'One seed matches a repeated-creator inventory; affinity cannot cross a lower-relevance barrier.',
      syntheticSources,
      syntheticCandidates,
      exactSourceLikes(syntheticSources, ['synthetic-seed'])
    ),
    keywordStuffing: profileEvaluation(
      'A source with more than 64 distinct meaningful tokens is capped after deterministic alphabetical token ordering.',
      syntheticSources,
      syntheticCandidates,
      exactSourceLikes(syntheticSources, ['synthetic-seed'])
    ),
    separateProfile: profileEvaluation(
      'A different profile with no seed remains at baseline order.',
      syntheticSources,
      syntheticCandidates,
      []
    ),
  }

  const mixedRecentRows = [
    source('recent-seed', 'wedding ceremony outdoor picnic celebration music'),
    ...Array.from({ length: 20 }, (_, index) =>
      source(
        `old-authored-${index.toString().padStart(2, '0')}`,
        'accounting workshop spreadsheet budget review',
        `old-creator-${index % 4}`
      )
    ),
    ...Array.from({ length: 8 }, (_, index) =>
      source(
        `recent-authored-${index.toString().padStart(2, '0')}`,
        'wedding ceremony outdoor picnic celebration music flowers',
        `recent-creator-${index % 2}`
      )
    ),
  ]
  const mixedRecentCandidates = mixedRecentRows.map(({ candidate }) =>
    candidate.catalogKey.startsWith('recent-authored-')
      ? {
          ...candidate,
          metadata: {
            ...candidate.metadata!,
            firstPublishedAt: '2026-10-20T12:00:00.000Z',
          },
        }
      : candidate
  )
  const mixedRecentSources = mixedRecentRows.map(({ source: item }) => item)
  const mixedRecentProfile = profileEvaluation(
    'Twenty old and eight recent synthetic authored items from repeated creators; affinity ordering and the baseline recent-item pass operate together.',
    mixedRecentSources,
    mixedRecentCandidates,
    exactSourceLikes(mixedRecentSources, ['recent-seed'])
  )

  const traversalProfiles = ['wedding', 'birthday', 'park_picnic'].map((key) => {
    const affinity = buildBlueprintLikeAffinity(curatedSources, exact([key]))
    const rows = [1, 2, 3, 7, 20].map((size) => ({
      baseline: traverseActual(catalog, affinity, size, false),
      personal: traverseActual(catalog, affinity, size, true),
    }))
    return {
      seedKey: key,
      traversals: rows.map(({ baseline, personal }) => ({
        pageSize: baseline.pageSize,
        baselineComplete: baseline.complete,
        personalComplete: personal.complete,
        baselineDuplicates: baseline.duplicateCount,
        personalDuplicates: personal.duplicateCount,
        orderMatchesAcrossPageSizes:
          personal.orderedKeys.join('\u0000') === rows[0]!.personal.orderedKeys.join('\u0000'),
        top10ChangedCount: baseline.orderedKeys
          .slice(0, 10)
          .filter((item, index) => personal.orderedKeys[index] !== item).length,
      })),
    }
  })

  const artifact = {
    formatVersion: FORMAT_VERSION,
    purpose:
      'Offline deterministic policy evaluation using repository curated fixtures and authored synthetic scenarios. It is not traffic, production inventory, an engagement measure, or a quality/uplift estimate.',
    asOf: AS_OF,
    scenarioVersion: SCENARIO_VERSION,
    activePolicies: {
      baselineAlgorithmVersion: BLUEPRINT_RANKING_ALGORITHM_VERSION,
      baselineConfigurationFingerprint: BLUEPRINT_RANKING_CONFIG_FINGERPRINT,
      personalLikePolicyVersion: BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION,
      personalLikePolicyFingerprint: BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
    },
    measuredBehavior: {
      content:
        'Only public name/summary and event/idea titles and notes; no category, tag, creator, or bookmark features.',
      scoring:
        'Distinct normalized token overlap; at least two shared meaningful tokens; each matching seed contributes sharedCount minus one; total score capped at three.',
      limits:
        'At most 64 meaningful distinct tokens per source, selected in alphabetical order; at most 50 exact current Likes, selected by catalog key. No title weighting or semantic matching.',
      position:
        'Affinity is a tie-break after editorial priority, within identical relevance vectors and before catalog key; creator diversity and recent-item promotion follow.',
      recentInteraction:
        'The baseline recent-item opportunity is not a personalized top-K share cap: a recent item that earns an ordinary position through Like affinity keeps it there.',
    },
    repositoryCuratedFixture: {
      label: 'Actual repository curated starter fixtures; not production inventory.',
      itemCount: curatedCandidates.length,
      profileEvaluations: profiles,
      deterministicPaging: traversalProfiles,
    },
    syntheticAuthoredScenarios: {
      definition:
        'Seven hand-authored catalog-like text examples with a repeated creator, one lower-relevance candidate, and an intentionally stuffed keyword source, plus a 28-item mixed old/recent creator scenario.',
      baseTextScenarioItemCount: syntheticCandidates.length,
      evaluations: syntheticProfiles,
      mixedRecentCreatorScenario: {
        itemCount: mixedRecentCandidates.length,
        evaluation: mixedRecentProfile,
      },
    },
    caveats: [
      'Like profile rows are fixture inputs, not observed account behavior.',
      'Token overlap is a transparent lexical heuristic and can miss relevant items or match coincidental terms.',
      'No preference text or raw content is written to this report; keys shown are curated fixture or synthetic evaluation keys.',
      'This evaluation does not establish user preference quality, engagement improvement, or production readiness.',
    ],
    verification: {
      noHistoryMatchesBaseline: profiles.noHistory!.orderChangedCount === 0,
      curatedPagingCompleteWithoutDuplicates: traversalProfiles.every((profile) =>
        profile.traversals.every(
          (traversal) =>
            traversal.baselineComplete &&
            traversal.personalComplete &&
            traversal.baselineDuplicates === 0 &&
            traversal.personalDuplicates === 0
        )
      ),
      personalPagingStableAcrossPageSizes: traversalProfiles.every((profile) =>
        profile.traversals.every((traversal) => traversal.orderMatchesAcrossPageSizes)
      ),
      noRelevanceViolations: [
        ...Object.values(profiles),
        ...Object.values(syntheticProfiles),
        mixedRecentProfile,
      ].every(
        (profile) =>
          profile.relevanceViolations.baseline === 0 && profile.relevanceViolations.personal === 0
      ),
      scoresCappedAtThree: [
        ...Object.values(profiles),
        ...Object.values(syntheticProfiles),
        mixedRecentProfile,
      ].every((profile) => profile.affinity.maxScore <= 3),
    },
  }
  if (!artifact.verification.noHistoryMatchesBaseline) {
    throw new Error('No-history affinity must preserve the baseline order exactly.')
  }
  if (!artifact.verification.curatedPagingCompleteWithoutDuplicates) {
    throw new Error('Curated paging must complete without duplicate catalog keys.')
  }
  if (!artifact.verification.personalPagingStableAcrossPageSizes) {
    throw new Error('Personalized traversal must be stable across page sizes.')
  }
  if (!artifact.verification.noRelevanceViolations) {
    throw new Error('Evaluation found a relevance barrier violation.')
  }
  if (!artifact.verification.scoresCappedAtThree) {
    throw new Error('Evaluation found an affinity score above the policy cap.')
  }
  return artifact
}

async function main() {
  const artifact = `${JSON.stringify(buildArtifact(), null, 2)}\n`
  if (check) {
    const current = await readFile(ARTIFACT_PATH, 'utf8').catch(() => '')
    if (current !== artifact)
      throw new Error('Personal Like evaluation artifact is stale; rerun without --check.')
    process.stdout.write('Personal Like evaluation artifact is current.\n')
    return
  }
  await mkdir(dirname(ARTIFACT_PATH), { recursive: true })
  await writeFile(ARTIFACT_PATH, artifact)
  process.stdout.write(
    `${JSON.stringify({ artifact: ARTIFACT_PATH, bytes: Buffer.byteLength(artifact), generated: true })}\n`
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
