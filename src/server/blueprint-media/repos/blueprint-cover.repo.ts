import { Context, Effect } from 'effect'

import type { BlueprintCoverVariant } from '@/contracts/blueprint-media.contracts'

export type BlueprintCoverVariantKeys = Record<
  BlueprintCoverVariant,
  { storageKey: string; width: number; height: number }
>

export type BlueprintCoverAsset = {
  id: string
  ownerUserId: string
  status: string
  processingToken: string | null
  bucket: string
  originalStorageKey: string
  uploadStorageKey: string
  variantStorageKeys: BlueprintCoverVariantKeys | null
  originalFilename: string
  contentType: string
  byteSize: number
  width: number | null
  height: number | null
  checksum: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type BlueprintCoverSourceRevision = {
  id: string
  revision: number
  revisionRetiredAt: Date | null
  document: unknown
  templateId: string | null
  templateCreatorId: string | null
  listedRevision: number | null
  retiredAt: Date | null
}

export type BlueprintCoverMediaAsset = {
  id: string
  organizationId: string
  storageKey: string
  uploadedByUserId: string | null
  status: string
  checksum: string | null
}

export type BlueprintCoverRepositoryShape = {
  readonly findSourceRevision: (input: {
    sourceRevisionId?: string
    sourceCatalogKey?: string
    sourceRevision?: number
    database?: unknown
  }) => Effect.Effect<BlueprintCoverSourceRevision | null, unknown>
  readonly findShareLink: (input: {
    revisionId?: string
    tokenHash: string
    database?: unknown
  }) => Effect.Effect<{ revisionId: string; revokedAt: Date | null } | null, unknown>
  readonly findRevisionId: (input: {
    catalogKey: string
    revision: number
    database?: unknown
  }) => Effect.Effect<string | null, unknown>
  readonly findCoverAsset: (input: {
    id: string
    ownerUserId?: string
    status?: string
    excludeDeleted?: boolean
    database?: unknown
  }) => Effect.Effect<BlueprintCoverAsset | null, unknown>
  readonly findCoverAssets: (input: {
    ids: string[]
    status?: string
    excludeDeleted?: boolean
    database?: unknown
  }) => Effect.Effect<BlueprintCoverAsset[], unknown>
  readonly createPendingAsset: (input: {
    id: string
    ownerUserId: string
    bucket: string
    originalStorageKey: string
    uploadStorageKey: string
    originalFilename: string
    byteSize: number
    database?: unknown
  }) => Effect.Effect<void, unknown>
  readonly retryPendingAsset: (input: {
    id: string
    ownerUserId: string
    originalFilename: string
    database?: unknown
  }) => Effect.Effect<void, unknown>
  readonly claimProcessing: (input: {
    id: string
    ownerUserId: string
    processingToken: string
    database?: unknown
  }) => Effect.Effect<boolean, unknown>
  readonly reclaimProcessing: (input: {
    id: string
    ownerUserId: string
    processingToken: string
    expiredBefore: Date
    database?: unknown
  }) => Effect.Effect<boolean, unknown>
  readonly markFailed: (input: {
    id: string
    processingToken: string
    database?: unknown
  }) => Effect.Effect<boolean, unknown>
  readonly markReady: (input: {
    id: string
    ownerUserId: string
    processingToken: string
    originalStorageKey: string
    byteSize: number
    width: number
    height: number
    checksum: string
    variantStorageKeys: BlueprintCoverVariantKeys
    database?: unknown
  }) => Effect.Effect<boolean, unknown>
  readonly findMediaAsset: (input: {
    id: string
    database?: unknown
  }) => Effect.Effect<BlueprintCoverMediaAsset | null, unknown>
  readonly createMediaAsset: (input: {
    id: string
    organizationId: string
    uploadedByUserId: string
    bucket: string
    storageKey: string
    originalFilename: string
    byteSize: number
    width: number
    height: number
    checksum: string
    database?: unknown
  }) => Effect.Effect<void, unknown>
  readonly createReadyAsset: (input: {
    id: string
    ownerUserId: string
    bucket: string
    originalStorageKey: string
    uploadStorageKey: string
    variantStorageKeys: BlueprintCoverVariantKeys
    originalFilename: string
    byteSize: number
    width: number
    height: number
    checksum: string
    database?: unknown
  }) => Effect.Effect<void, unknown>
}

export class BlueprintCoverRepo extends Context.Service<
  BlueprintCoverRepo,
  BlueprintCoverRepositoryShape
>()('BlueprintCoverRepo') {}
