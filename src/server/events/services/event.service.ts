import { Context, Effect } from "effect"

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from "../contracts/event.contracts"
import type {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  EventRepoError,
  listVisibleMainEvents,
} from "../repos/event.repo"
import type {
  ConflictError,
  EntityNotFoundError,
  ForbiddenError,
} from "@/server/effect"

export type EventDomainError =
  | ConflictError
  | EntityNotFoundError
  | ForbiddenError
  | EventRepoError

export type EventActor = {
  userId: string
  organizationId: string
}

type EventServiceShape = {
  readonly create: (
    actor: EventActor,
    event: CreateEventInput,
  ) => Effect.Effect<
    Awaited<ReturnType<typeof createEventWithParticipants>>,
    EventDomainError
  >
  readonly list: (
    actor: EventActor,
  ) => Effect.Effect<
    Awaited<ReturnType<typeof listVisibleMainEvents>>,
    EventDomainError
  >
  readonly inviteParticipant: (
    userId: string,
    invitation: InviteEventParticipantInput,
  ) => Effect.Effect<
    Awaited<ReturnType<typeof createEventInvitation>>,
    EventDomainError
  >
  readonly acceptInvitation: (input: {
    userId: string
    userEmail: string
    invitation: AcceptEventInvitationInput
  }) => Effect.Effect<
    Awaited<ReturnType<typeof acceptEventInvitation>>,
    EventDomainError
  >
}

export class EventService extends Context.Service<
  EventService,
  EventServiceShape
>()("EventService") {}
