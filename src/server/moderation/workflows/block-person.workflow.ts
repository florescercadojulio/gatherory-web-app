import { Effect } from 'effect'
import { ModerationService } from '../services/moderation.service'

export const blockPersonWorkflow = (userId: string, blockedUserId: string) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.blockPerson(userId, blockedUserId)
  })
