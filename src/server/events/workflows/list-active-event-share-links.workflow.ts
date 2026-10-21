import { Effect } from 'effect'
import { EventSharingService } from '../services/event-sharing.service'

export const listActiveEventShareLinksWorkflow = (userId: string, eventId: string) =>
  Effect.gen(function* () {
    const sharing = yield* EventSharingService
    return yield* sharing.listActiveLinks(userId, eventId)
  })
