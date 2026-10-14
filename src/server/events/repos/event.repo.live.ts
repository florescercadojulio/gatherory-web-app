import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'

import {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  getEventParticipant,
  getInvitationDetails,
  getInvitationPreviewDetails,
  getEventParentId,
  hasWorkspaceMembership,
  listVisibleMainEvents,
} from './event.repo.persistence'
import { EventRepo, type EventRepoShape } from './event.repo.contract'

export const EventRepoLive = Layer.effect(
  EventRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(PgClient, pg))
    return {
      hasWorkspaceMembership: (input) => bindPg(hasWorkspaceMembership(input)),
      getEventParticipant: (input) => bindPg(getEventParticipant(input)),
      getInvitationDetails: (input) => bindPg(getInvitationDetails(input)),
      getInvitationPreviewDetails: (input) => bindPg(getInvitationPreviewDetails(input)),
      getEventParentId: (eventId) => bindPg(getEventParentId(eventId)),
      createEventWithParticipants: (input) => bindPg(createEventWithParticipants(input)),
      listVisibleMainEvents: (input) => bindPg(listVisibleMainEvents(input)),
      createEventInvitation: (input) => bindPg(createEventInvitation(input)),
      acceptEventInvitation: (input) => bindPg(acceptEventInvitation(input)),
    } satisfies EventRepoShape
  })
)
