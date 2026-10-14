import { Effect } from 'effect'
import { EventGuestService } from '../services/event-guest.service'

export const getInvitationCoverWorkflow = (eventId: string, userId?: string) =>
  Effect.gen(function* () {
    const guests = yield* EventGuestService
    return yield* guests.invitationCoverURL(eventId, userId)
  })
