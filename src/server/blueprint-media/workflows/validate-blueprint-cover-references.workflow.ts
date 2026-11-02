import { Effect } from 'effect'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export const validateBlueprintCoverReferencesWorkflow = (input: {
  database?: unknown
  actorUserId: string
  assetIds: string[]
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
}) =>
  Effect.gen(function* () {
    const service = yield* BlueprintCoverService
    return yield* service.validateReferences(input)
  })
