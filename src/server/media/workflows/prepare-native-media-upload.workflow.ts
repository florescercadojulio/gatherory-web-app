import { Effect } from 'effect'
import type { PrepareNativeMediaUploadInput } from '../contracts/media.contracts'
import { MediaService } from '../services/media.service'

export function prepareNativeMediaUploadWorkflow(input: {
  userId: string
  media: PrepareNativeMediaUploadInput
}) {
  return Effect.gen(function* () {
    const service = yield* MediaService
    return yield* service.prepareNativeUpload(input)
  })
}
