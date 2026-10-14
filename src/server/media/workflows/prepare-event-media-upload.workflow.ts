import { Effect } from 'effect'
import type { PrepareEventMediaUploadInput } from '../contracts/media.contracts'
import { MediaService } from '../services/media.service'

export function prepareEventMediaUploadWorkflow(input: {
  userId: string
  media: PrepareEventMediaUploadInput
}) {
  return Effect.gen(function* () {
    const service = yield* MediaService
    return yield* service.prepareEventUpload(input)
  })
}
