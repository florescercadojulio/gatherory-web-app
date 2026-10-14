import { Effect } from 'effect'
import { EventGuestService } from '../services/event-guest.service'

export const leaveGuestEventWorkflow = (userId: string, eventId: string) =>
  Effect.gen(function* () {
    const guests = yield* EventGuestService
    return yield* guests.leaveGuestEvent(userId, eventId)
  })
