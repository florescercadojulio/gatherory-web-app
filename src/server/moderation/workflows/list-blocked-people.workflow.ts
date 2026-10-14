import { Effect } from 'effect'
import { ModerationService } from '../services/moderation.service'

export const listBlockedPeopleWorkflow = (userId: string) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.listBlockedPeople(userId)
  })
