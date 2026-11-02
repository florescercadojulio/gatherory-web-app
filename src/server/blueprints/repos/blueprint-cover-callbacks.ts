import { ConfigurationError } from '@/lib/domain-errors'
import type { ExploreCoverManifest } from '../catalog/explore-cover-manifest'
import type { Effect } from 'effect'

/** Trusted, workflow-supplied cover operations kept inside existing persistence engines. */
export type BlueprintCoverCallbacks = {
  validateReferences: (input: {
    database?: unknown
    actorUserId: string
    assetIds: string[]
    sourceRevisionId?: string
    sourceCatalogKey?: string
    sourceRevision?: number
    shareToken?: string
  }) => Effect.Effect<void, unknown>
  cloneAssets: (input: {
    database?: unknown
    actorUserId: string
    sourceRevisionId?: string
    sourceCatalogKey?: string
    sourceRevision?: number
    shareToken?: string
    shareTokenHash?: string
    destinationOrganizationId?: string
    copies: Array<{ sourceAssetId: string; destinationAssetId: string }>
  }) => import('effect').Effect.Effect<
    Array<{ sourceAssetId: string; destinationAssetId: string; created: boolean }>,
    unknown
  >
  materializeCuratedExploreCover: (input: {
    actorUserId: string
    requestId: string
    catalogKey: string
    revision: number
    contentHash: string
  }) => Effect.Effect<string | undefined, unknown>
  materializeCuratedSeedImages: (input: {
    actorUserId: string
    requestId: string
    catalogKey: string
    revision: number
    contentHash: string
    images: Array<{ assetKey: string; manifest: ExploreCoverManifest }>
  }) => Effect.Effect<Record<string, string>, unknown>
}

/** A persistence call that needs covers must never silently skip their rules. */
export const blueprintCoverCallbacksRequired = () =>
  new ConfigurationError({
    category: 'system',
    code: 'BLUEPRINT_COVER_CALLBACKS_REQUIRED',
    userMessageKey: 'serverErrors.SYSTEM',
  })
