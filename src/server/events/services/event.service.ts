import { Context, Effect } from 'effect'
import type { PgClient } from '@effect/sql-pg/PgClient'

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from '../contracts/event.contracts'
import type {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  EventRepoError,
  listVisibleMainEvents,
} from '../repos/event.repo'
import type { ConflictError, EntityNotFoundError, ForbiddenError } from '@/server/effect'

export type EventDomainError = ConflictError | EntityNotFoundError | ForbiddenError | EventRepoError

export type EventActor = {
  userId: string
  organizationId: string
}

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never

type EventServiceShape = {
  readonly create: (
    actor: EventActor,
    event: CreateEventInput
  ) => Effect.Effect<
    EffectSuccess<ReturnType<typeof createEventWithParticipants>>,
    EventDomainError,
    PgClient
  >
  readonly list: (
    actor: EventActor
  ) => Effect.Effect<
    EffectSuccess<ReturnType<typeof listVisibleMainEvents>>,
    EventDomainError,
    PgClient
  >
  readonly inviteParticipant: (
    userId: string,
    invitation: InviteEventParticipantInput
  ) => Effect.Effect<
    EffectSuccess<ReturnType<typeof createEventInvitation>>,
    EventDomainError,
    PgClient
  >
  readonly acceptInvitation: (input: {
    userId: string
    userEmail: string
    invitation: AcceptEventInvitationInput
  }) => Effect.Effect<
    EffectSuccess<ReturnType<typeof acceptEventInvitation>>,
    EventDomainError,
    PgClient
  >
}

export class EventService extends Context.Service<EventService, EventServiceShape>()(
  'EventService'
) {}
