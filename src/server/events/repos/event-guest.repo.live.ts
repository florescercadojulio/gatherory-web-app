import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { leaveGuestEvent } from './event-departure.repo'
import { guestEventInvitations, invitationCoverURL, respondToEvent } from './guest-invitation.repo'
import { EventGuestRepo } from './event-guest.repo'

export const EventGuestRepoLive = Layer.effect(
  EventGuestRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(PgClient, pg))
    return {
      listInvitations: (userId) => bindPg(guestEventInvitations(userId)),
      invitationCoverURL: (eventId, userId) => bindPg(invitationCoverURL(eventId, userId)),
      respondToEvent: (userId, eventId, attendance) =>
        bindPg(respondToEvent(userId, eventId, attendance)),
      leaveGuestEvent: (userId, eventId) => bindPg(leaveGuestEvent(userId, eventId)),
    }
  })
)
