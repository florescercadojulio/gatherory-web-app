import { Effect } from 'effect'
import { ModerationService } from '../services/moderation.service'

export const hideImageWorkflow = (userId: string, mediaAssetId: string) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.hideImage(userId, mediaAssetId)
  })
