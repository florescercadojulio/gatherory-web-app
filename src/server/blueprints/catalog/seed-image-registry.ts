import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  type BlueprintCatalogRevision,
} from '@/contracts/blueprint-install.contracts'
import { StableKeySchema } from '@/contracts/content-primitives'
import { BlueprintPublicCoverURLSchema } from '@/contracts/blueprint-discovery.contracts'
import { ExploreCoverManifestSchema, type ExploreCoverManifest } from './explore-cover-manifest'

const assignmentTargets = z.record(StableKeySchema, z.string().min(1).max(120))
const checksum = z.string().regex(/^[a-f0-9]{64}$/)

export const SeedImageAssignmentsSchema = z.record(
  StableKeySchema,
  z.object({
    revision: z.number().int().positive(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    root: z.string().min(1).max(120).optional(),
    children: assignmentTargets.default({}),
    ideas: assignmentTargets.default({}),
  }).strict()
)

export const SeedImageAssetsSchema = z.record(
  z.string().min(1).max(120),
  z.object({
    manifest: ExploreCoverManifestSchema,
    fileChecksum: checksum,
    license: z.object({
      name: z.string().min(1).max(200),
      url: z.string().url(),
      sourceURL: z.string().url(),
      photographer: z.string().min(1).max(200),
      photoID: z.string().min(1).max(100),
      checkedAt: z.string().datetime({ offset: true }),
    }).strict(),
    file: z.string().min(1).max(1000),
  }).strict()
)

export type SeedImageAssignments = z.infer<typeof SeedImageAssignmentsSchema>
export type SeedImageAssets = z.infer<typeof SeedImageAssetsSchema>
export type ResolvedSeedImageTargets = {
  root?: { assetKey: string; manifest: ExploreCoverManifest }
  children: Record<string, { assetKey: string; manifest: ExploreCoverManifest }>
  ideas: Record<string, { assetKey: string; manifest: ExploreCoverManifest }>
}

export type SeedCoverageEntry = {
  catalogKey: string
  revision: number
  contentHash: string
  definition: unknown
}
export type SeedRevisionIdentity = Pick<BlueprintCatalogRevision, 'catalogKey' | 'revision' | 'contentHash'>

function targetKeys(entry: SeedCoverageEntry) {
  const definition = BlueprintCatalogDefinitionSchema.parse(entry.definition)
  return definition.modules.reduce(
    (targets, module) => {
      const tree = BlueprintExperienceTreeModuleSchema.safeParse(module)
      const ideas = BlueprintIdeasModuleSchema.safeParse(module)
      if (tree.success) targets.children.push(...tree.data.config.children.map((child) => child.key))
      if (ideas.success) targets.ideas.push(...ideas.data.config.ideas.map((idea) => idea.key))
      return targets
    },
    { children: [] as string[], ideas: [] as string[] }
  )
}

/** Fail before a seed starts writing if any executable image target is unmapped. */
export function assertSeedImageCoverage(
  entries: readonly SeedCoverageEntry[],
  assignmentsInput: unknown,
  assetsInput?: unknown,
  options: { allowUnmatchedAssignments?: boolean } = {}
): void {
  const assignments = SeedImageAssignmentsSchema.parse(assignmentsInput)
  const assets = assetsInput === undefined ? undefined : SeedImageAssetsSchema.parse(assetsInput)
  const issues: string[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    seen.add(entry.catalogKey)
    const assignment = assignments[entry.catalogKey]
    if (!assignment) {
      issues.push(`${entry.catalogKey}: missing revision assignment`)
      continue
    }
    if (assignment.revision !== entry.revision || assignment.contentHash !== entry.contentHash) {
      issues.push(`${entry.catalogKey}: assignment does not match revision ${entry.revision} content hash`)
      continue
    }
    const targets = targetKeys(entry)
    if (!assignment.root) issues.push(`${entry.catalogKey}: missing root image`)
    for (const key of targets.children) {
      if (!assignment.children[key]) issues.push(`${entry.catalogKey}: missing child ${key}`)
    }
    for (const key of targets.ideas) {
      if (!assignment.ideas[key]) issues.push(`${entry.catalogKey}: missing idea ${key}`)
    }
    for (const key of Object.keys(assignment.children)) {
      if (!targets.children.includes(key)) issues.push(`${entry.catalogKey}: unknown child ${key}`)
    }
    for (const key of Object.keys(assignment.ideas)) {
      if (!targets.ideas.includes(key)) issues.push(`${entry.catalogKey}: unknown idea ${key}`)
    }
    if (assets) {
      for (const assetKey of [assignment.root, ...Object.values(assignment.children), ...Object.values(assignment.ideas)]) {
        if (assetKey && !assets[assetKey]) issues.push(`${entry.catalogKey}: unknown image asset ${assetKey}`)
      }
    }
  }
  for (const key of Object.keys(assignments)) {
    if (!seen.has(key) && !options.allowUnmatchedAssignments) {
      issues.push(`${key}: assignment has no matching seeded revision`)
    }
  }
  if (issues.length) throw new Error(`Seed image coverage is incomplete: ${issues.join('; ')}`)
}

export function resolveSeedImageTargets(input: {
  entry: SeedRevisionIdentity
  assignments: SeedImageAssignments
  assets: SeedImageAssets
}): ResolvedSeedImageTargets | undefined {
  const assignment = input.assignments[input.entry.catalogKey]
  if (
    !assignment ||
    assignment.revision !== input.entry.revision ||
    assignment.contentHash !== input.entry.contentHash
  ) return undefined
  const resolve = (assetKey: string | undefined) => {
    if (!assetKey) return undefined
    const asset = input.assets[assetKey]
    if (!asset) return undefined
    const result = ExploreCoverManifestSchema.safeParse(asset.manifest)
    if (!result.success) return undefined
    return { assetKey, manifest: result.data }
  }
  const root = resolve(assignment.root)
  const children: ResolvedSeedImageTargets['children'] = {}
  const ideas: ResolvedSeedImageTargets['ideas'] = {}
  for (const [key, assetKey] of Object.entries(assignment.children)) {
    const found = resolve(assetKey)
    if (!found) return undefined
    children[key] = found
  }
  for (const [key, assetKey] of Object.entries(assignment.ideas)) {
    const found = resolve(assetKey)
    if (!found) return undefined
    ideas[key] = found
  }
  if (assignment.root && !root) return undefined
  return { ...(root ? { root } : {}), children, ideas }
}

export function seedImageCoverAssetId(input: {
  actorUserId: string
  requestId: string
  catalogKey: string
  revision: number
  contentHash: string
  heroChecksum: string
}): string {
  const hex = createHash('sha256')
    .update([
      'blueprint-seed-cover-v1',
      input.actorUserId,
      input.requestId.toLowerCase(),
      input.catalogKey,
      String(input.revision),
      input.contentHash,
      input.heroChecksum,
    ].join(':'))
    .digest('hex')
    .slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16]!, 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`
}

export function seedImageCardURL(manifest: ExploreCoverManifest): string {
  const card = manifest.variants.find((variant) => variant.name === 'card')
  return BlueprintPublicCoverURLSchema.parse(card?.url)
}

export function seedImageTargetAssetKeys(input: ResolvedSeedImageTargets): string[] {
  return [...new Set([
    ...(input.root ? [input.root.assetKey] : []),
    ...Object.values(input.children).map((image) => image.assetKey),
    ...Object.values(input.ideas).map((image) => image.assetKey),
  ])]
}
