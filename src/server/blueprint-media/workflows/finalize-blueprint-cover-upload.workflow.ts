import { Effect } from 'effect'
import type { FinalizeBlueprintCoverUploadInput } from '@/contracts/blueprint-media.contracts'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export const finalizeBlueprintCoverUploadWorkflow = (input: {
  actorUserId: string
  cover: FinalizeBlueprintCoverUploadInput
}) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCoverService).finalizeUpload(input)
  })
