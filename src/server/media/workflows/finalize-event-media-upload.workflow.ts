import { Effect } from 'effect'
import type { FinalizeEventMediaUploadInput } from '../contracts/media.contracts'
import { MediaService } from '../services/media.service'

export function finalizeEventMediaUploadWorkflow(input: {
  userId: string
  media: FinalizeEventMediaUploadInput
}) {
  return Effect.gen(function* () {
    const service = yield* MediaService
    return yield* service.finalizeEventUpload(input)
  })
}
