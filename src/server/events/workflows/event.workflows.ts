import { Effect } from 'effect'

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from '../contracts/event.contracts'
import { EventService } from '../services/event.service'

export const acceptEventInvitationWorkflow = (input: {
  userId: string
  userEmail: string
  invitation: AcceptEventInvitationInput
}) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.acceptInvitation(input)
  })

export const createEventWorkflow = (input: {
  organizationId: string
  userId: string
  event: CreateEventInput
}) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.create(
      { organizationId: input.organizationId, userId: input.userId },
      input.event
    )
  })

export const listEventsWorkflow = (input: { organizationId: string; userId: string }) =>
  Effect.gen(function* () {
    const events = yield* EventService
    const items = yield* events.list(input)
    return items.map((item) => ({
      ...item,
      startsAt: item.startsAt?.toISOString() ?? null,
      endsAt: item.endsAt?.toISOString() ?? null,
      childEvents: item.childEvents.map((child) => ({
        ...child,
        startsAt: child.startsAt?.toISOString() ?? null,
        endsAt: child.endsAt?.toISOString() ?? null,
      })),
    }))
  })

export const inviteEventParticipantWorkflow = (input: {
  userId: string
  invitation: InviteEventParticipantInput
}) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.inviteParticipant(input.userId, input.invitation)
  })
