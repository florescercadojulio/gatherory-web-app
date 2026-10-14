import { Context, Effect } from 'effect'

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from '../contracts/event.contracts'
import type { EventRepoError, EventRepoShape } from '../repos/event.repo.contract'
import type { ConflictError, EntityNotFoundError, ForbiddenError } from '@/server/effect'

export type EventDomainError = ConflictError | EntityNotFoundError | ForbiddenError | EventRepoError

export type EventActor = {
  userId: string
  organizationId: string
}

type InvitationDetails = NonNullable<
  EffectSuccess<ReturnType<EventRepoShape['getInvitationDetails']>>
>

type EventServiceShape = {
  readonly getInvitationDetails: (input: {
    token: string
    email: string
  }) => Effect.Effect<
    Omit<InvitationDetails, 'expiresAt'> & { expiresAt: string },
    EventDomainError
  >
  readonly previewEmailInvitation: (input: { token: string; email: string }) => Effect.Effect<
    {
      eventId: string
      title: string
      role: InvitationPreviewDetails['role']
      expiresAt: string
      startsAt: string | null
      locationName: string | null
    },
    EventDomainError
  >
  readonly getParentEventId: (
    eventId: string
  ) => Effect.Effect<{ parentEventId: string | null } | null, EventDomainError>
  readonly create: (
    actor: EventActor,
    event: CreateEventInput
  ) => Effect.Effect<
    EffectSuccess<ReturnType<EventRepoShape['createEventWithParticipants']>>,
    EventDomainError
  >
  readonly list: (
    actor: EventActor
  ) => Effect.Effect<
    EffectSuccess<ReturnType<EventRepoShape['listVisibleMainEvents']>>,
    EventDomainError
  >
  readonly inviteParticipant: (
    userId: string,
    invitation: InviteEventParticipantInput
  ) => Effect.Effect<
    EffectSuccess<ReturnType<EventRepoShape['createEventInvitation']>>,
    EventDomainError
  >
  readonly acceptInvitation: (input: {
    userId: string
    userEmail: string
    invitation: AcceptEventInvitationInput
  }) => Effect.Effect<
    EffectSuccess<ReturnType<EventRepoShape['acceptEventInvitation']>>,
    EventDomainError
  >
}

type EffectSuccess<T> = T extends Effect.Effect<infer A, unknown, unknown> ? A : never
type InvitationPreviewDetails = NonNullable<
  EffectSuccess<ReturnType<EventRepoShape['getInvitationPreviewDetails']>>
>

export class EventService extends Context.Service<EventService, EventServiceShape>()(
  'EventService'
) {}
