import { Effect } from 'effect'
import { ModerationService } from '../services/moderation.service'

export const hiddenImageIDsWorkflow = (userId: string) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.hiddenImageIDs(userId)
  })
