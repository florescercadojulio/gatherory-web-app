import { Effect } from 'effect'
import type { PrepareBlueprintCoverUploadInput } from '@/contracts/blueprint-media.contracts'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export const prepareBlueprintCoverUploadWorkflow = (input: {
  actorUserId: string
  cover: PrepareBlueprintCoverUploadInput
}) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCoverService).prepareUpload(input)
  })
