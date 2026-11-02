import { Context, Effect } from 'effect'

import type {
  FinalizeBlueprintCoverUploadInput,
  GetBlueprintCoverUrlInput,
  PrepareBlueprintCoverUploadInput,
  BlueprintCoverReadyReceipt,
  BlueprintCoverUploadReceipt,
  BlueprintCoverUrlReceipt,
} from '@/contracts/blueprint-media.contracts'
import type { ExploreCoverManifest } from '@/server/blueprints/catalog/explore-cover-manifest'

export type BlueprintCoverCopyInput = {
  database?: unknown
  actorUserId: string
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
  shareTokenHash?: string
  destinationOrganizationId?: string
  copies: Array<{ sourceAssetId: string; destinationAssetId: string }>
}

export type BlueprintCoverServiceShape = {
  readonly validateReferences: (input: {
    database?: unknown
    actorUserId: string
    assetIds: string[]
    sourceRevisionId?: string
    sourceCatalogKey?: string
    sourceRevision?: number
    shareToken?: string
  }) => Effect.Effect<void, unknown>
  readonly prepareUpload: (input: {
    actorUserId: string
    cover: PrepareBlueprintCoverUploadInput
  }) => Effect.Effect<BlueprintCoverUploadReceipt, unknown>
  readonly finalizeUpload: (input: {
    actorUserId: string
    cover: FinalizeBlueprintCoverUploadInput
  }) => Effect.Effect<BlueprintCoverReadyReceipt, unknown>
  readonly getUrl: (input: {
    actorUserId: string | null
    cover: GetBlueprintCoverUrlInput
  }) => Effect.Effect<BlueprintCoverUrlReceipt, unknown>
  readonly cloneAssets: (
    input: BlueprintCoverCopyInput
  ) => Effect.Effect<
    Array<{ sourceAssetId: string; destinationAssetId: string; created: boolean }>,
    unknown
  >
  readonly materializeCuratedExploreCover: (input: {
    actorUserId: string
    requestId: string
    catalogKey: string
    revision: number
    contentHash: string
  }) => Effect.Effect<string | undefined, unknown>
  readonly materializeCuratedSeedImages: (input: {
    actorUserId: string
    requestId: string
    catalogKey: string
    revision: number
    contentHash: string
    images: Array<{ assetKey: string; manifest: ExploreCoverManifest }>
  }) => Effect.Effect<Record<string, string>, unknown>
}

/** Pure domain contract for Blueprint cover rules and use cases. */
export class BlueprintCoverService extends Context.Service<
  BlueprintCoverService,
  BlueprintCoverServiceShape
>()('BlueprintCoverService') {}
