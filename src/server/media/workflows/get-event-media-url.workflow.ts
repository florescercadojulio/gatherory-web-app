import { Effect } from 'effect'
import { MediaService } from '../services/media.service'

export function getEventMediaUrlWorkflow(input: { userId: string; mediaAssetId: string }) {
  return Effect.gen(function* () {
    const service = yield* MediaService
    return yield* service.getEventReadUrl(input)
  })
}
