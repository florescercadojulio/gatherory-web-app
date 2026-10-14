import { Effect } from 'effect'
import { EventGuestService } from '../services/event-guest.service'

export const respondToEventWorkflow = (
  userId: string,
  eventId: string,
  attendance: 'going' | 'not_sure' | 'not_going'
) =>
  Effect.gen(function* () {
    const guests = yield* EventGuestService
    return yield* guests.respondToEvent(userId, eventId, attendance)
  })
