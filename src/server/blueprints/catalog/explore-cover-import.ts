import { createHash } from 'node:crypto'
import { blueprintStarters } from './starters'
import exploreCoverImageRegistry from './explore-cover-images.json'
import exploreCoverManifests from './explore-cover-manifests.json'
import { ExploreCoverManifestSchema } from './explore-cover-manifest'

export function resolveCuratedExploreCover(input: {
  catalogKey: string
  revision: number
  contentHash: string
}):
  | { status: 'invalid' }
  | { status: 'available'; manifest: import('./explore-cover-manifest').ExploreCoverManifest }
  | undefined {
  const starter = blueprintStarters.find(
    (item) =>
      item.catalogKey === input.catalogKey &&
      item.revision === input.revision &&
      item.contentHash === input.contentHash
  )
  const registeredUrl = (exploreCoverImageRegistry as Record<string, string>)[input.catalogKey]
  if (!starter || !registeredUrl) return undefined
  const rawManifest = (exploreCoverManifests as Record<string, unknown>)[input.catalogKey]
  const result = ExploreCoverManifestSchema.safeParse(rawManifest)
  if (!result.success) return { status: 'invalid' }
  const manifest = result.data
  const card = manifest.variants.find((variant) => variant.name === 'card')
  if (!card || card.url !== registeredUrl) return { status: 'invalid' }
  return { status: 'available', manifest }
}

export function curatedExploreCoverAssetId(input: {
  actorUserId: string
  requestId: string
  catalogKey: string
  revision: number
  contentHash: string
  heroChecksum: string
}) {
  const hex = createHash('sha256')
    .update(
      [
        'blueprint-curated-cover-v1',
        input.actorUserId,
        input.requestId.toLowerCase(),
        input.catalogKey,
        String(input.revision),
        input.contentHash,
        input.heroChecksum,
      ].join(':')
    )
    .digest('hex')
    .slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16]!, 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`
}
