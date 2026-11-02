import {
  cloneBlueprintCoverAssets as cloneProgram,
  validateBlueprintCoverReferences as validateProgram,
} from '../blueprint-media.workflows.live'

/** Adapts the legacy `db` argument to the workflow's neutral `database` input. */
export function validateBlueprintCoverReferences(input: {
  db?: unknown
  actorUserId: string
  assetIds: string[]
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
}) {
  return validateProgram({ database: input.db, ...input })
}

/** Adapts the legacy `db` argument to the workflow's neutral `database` input. */
export function cloneBlueprintCoverAssets(input: {
  db?: unknown
  actorUserId: string
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
  shareTokenHash?: string
  destinationOrganizationId?: string
  copies: Array<{ sourceAssetId: string; destinationAssetId: string }>
}) {
  return cloneProgram({ database: input.db, ...input })
}
