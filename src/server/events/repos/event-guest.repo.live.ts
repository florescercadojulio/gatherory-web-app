import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { leaveGuestEvent } from './event-departure.repo'
import {
  getInvitationCoverAsset,
  listGuestEventInvitationProjections,
  respondToEvent,
} from './guest-invitation.repo.persistence'
import { EventGuestRepo } from './event-guest.repo'

export const EventGuestRepoLive = Layer.effect(
  EventGuestRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(PgClient, pg))
    return {
      listInvitationProjections: (userId) => bindPg(listGuestEventInvitationProjections(userId)),
      getInvitationCoverAsset: (eventId, userId) =>
        bindPg(getInvitationCoverAsset(eventId, userId)),
      respondToEvent: (userId, eventId, attendance) =>
        bindPg(respondToEvent(userId, eventId, attendance)),
      leaveGuestEvent: (userId, eventId) => bindPg(leaveGuestEvent(userId, eventId)),
    }
  })
)
