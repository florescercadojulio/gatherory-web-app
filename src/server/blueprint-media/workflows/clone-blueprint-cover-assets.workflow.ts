import { Effect } from 'effect'
import type { BlueprintCoverCopyInput } from '../services/blueprint-cover.service'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export const cloneBlueprintCoverAssetsWorkflow = (input: BlueprintCoverCopyInput) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCoverService).cloneAssets(input)
  })
