import { Effect } from 'effect'
import { EventSharingService } from '../services/event-sharing.service'

export const acceptEventShareLinkWorkflow = (userId: string, token: string) =>
  Effect.gen(function* () {
    const sharing = yield* EventSharingService
    return yield* sharing.accept(userId, token)
  })
