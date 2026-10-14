import { Effect } from 'effect'
import type { NativeMediaAssetInput } from '../contracts/media.contracts'
import { MediaService } from '../services/media.service'

export function finalizeNativeMediaUploadWorkflow(input: {
  userId: string
  media: NativeMediaAssetInput
}) {
  return Effect.gen(function* () {
    const service = yield* MediaService
    return yield* service.finalizeNativeUpload(input)
  })
}
