import { Effect } from 'effect'
import { ModerationService } from '../services/moderation.service'

export const requireModeratorWorkflow = (userId: string) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.requireModerator(userId)
  })
