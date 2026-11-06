import { Effect } from 'effect'
import type { BrowserGuestEvent } from '../contracts/browser-guest.contracts'
import { EventGuestService } from '../services/event-guest.service'

/** A signed-in invitation recipient reads only the exact event they participate in. */
export const getAccountInvitedEventWorkflow = (input: {
  userId: string
  name: string
  eventId: string
}) =>
  Effect.gen(function* () {
    const guests = yield* EventGuestService
    const invitations = yield* guests.listInvitations(input.userId)
    const event = invitations.find((item) => item.id === input.eventId)
    if (!event) return { event: null, planningEventId: null }
    const summary: BrowserGuestEvent = {
      id: event.id,
      name: input.name,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      isAllDay: event.isAllDay,
      timeZone: event.timeZone,
      locationName: event.locationName,
      attendance: event.attendance,
      canRespond: event.attendanceOpen,
    }
    return { event: summary, planningEventId: event.role === 'guest' ? null : event.id }
  })
