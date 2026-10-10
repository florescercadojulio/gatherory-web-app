import { Effect, Layer } from "effect"

import { planningPermissionFromDatabase } from "@/lib/permissions"
import {
  ConflictError,
  EntityNotFoundError,
  ForbiddenError,
  type PersistenceError,
} from "@/server/effect"

import { EventRepo } from "../repos/event.repo"
import { EventAuthorization } from "./event-authorization.service"
import { EventService, type EventDomainError } from "./event.service"

function persistenceCode(error: PersistenceError) {
  return error.cause instanceof Error ? error.cause.message : undefined
}

function translateCreateFailure(
  error: PersistenceError,
): Effect.Effect<never, EventDomainError> {
  switch (persistenceCode(error)) {
    case "EVENT_DEPTH_EXCEEDED":
      return Effect.fail(
        new ConflictError({
          category: "conflict",
          code: "EVENT_DEPTH_EXCEEDED",
          userMessage: "Events can only be nested one level deep.",
        }),
      )
    case "EVENT_PARENT_NOT_FOUND":
      return Effect.fail(
        new EntityNotFoundError({
          category: "not_found",
          code: "EVENT_PARENT_NOT_FOUND",
          userMessage: "The parent event could not be found.",
        }),
      )
    case "EVENT_FORBIDDEN":
      return Effect.fail(
        new ForbiddenError({
          category: "authorization",
          code: "EVENT_CREATE_FORBIDDEN",
          userMessage: "You do not have permission to create this event.",
        }),
      )
    default:
      return Effect.fail(error)
  }
}

function translateInvitationFailure(
  error: PersistenceError,
): Effect.Effect<never, EventDomainError> {
  switch (persistenceCode(error)) {
    case "EVENT_INVITATION_EMAIL_MISMATCH":
      return Effect.fail(
        new ForbiddenError({
          category: "authorization",
          code: "EVENT_INVITATION_EMAIL_MISMATCH",
          userMessage: "Sign in with the email address that was invited.",
        }),
      )
    case "EVENT_INVITATION_EXPIRED":
      return Effect.fail(
        new ConflictError({
          category: "conflict",
          code: "EVENT_INVITATION_EXPIRED",
          userMessage: "This invitation has expired. Ask the host for a new one.",
        }),
      )
    case "EVENT_INVITATION_NOT_FOUND":
    case "EVENT_INVITATION_ALREADY_USED":
      return Effect.fail(
        new EntityNotFoundError({
          category: "not_found",
          code: "EVENT_INVITATION_INVALID",
          userMessage: "This invitation is invalid or has already been used.",
        }),
      )
    default:
      return Effect.fail(error)
  }
}

export const EventServiceLive = Layer.effect(
  EventService,
  Effect.gen(function* () {
    const repo = yield* EventRepo
    const authorization = yield* EventAuthorization

    return {
      create: (actor, event) =>
        Effect.gen(function* () {
          if (event.parentEventId) {
            const participant = yield* repo.getEventParticipant({
              eventId: event.parentEventId,
              userId: actor.userId,
            })
            if (!participant) {
              return yield* Effect.fail(
                new ForbiddenError({
                  category: "authorization",
                  code: "PARENT_EVENT_PARTICIPANT_REQUIRED",
                  userMessage: "You do not have access to the parent event.",
                }),
              )
            }

            yield* authorization.require(
              {
                role: participant.role,
                planningPermission: planningPermissionFromDatabase(
                  participant.planningPermission,
                ),
              },
              { event: ["create_child"] },
            )
          } else {
            const isMember = yield* repo.hasWorkspaceMembership(actor)
            if (!isMember) {
              return yield* Effect.fail(
                new ForbiddenError({
                  category: "authorization",
                  code: "WORKSPACE_MEMBERSHIP_REQUIRED",
                  userMessage: "You do not have access to this workspace.",
                }),
              )
            }
          }

          return yield* repo
            .createEventWithParticipants({ ...actor, event })
            .pipe(Effect.catchTag("PersistenceError", translateCreateFailure))
        }),

      list: (actor) => repo.listVisibleMainEvents(actor),

      inviteParticipant: (userId, invitation) =>
        Effect.gen(function* () {
          const participant = yield* repo.getEventParticipant({
            eventId: invitation.eventId,
            userId,
          })
          if (!participant) {
            return yield* Effect.fail(
              new ForbiddenError({
                category: "authorization",
                code: "EVENT_PARTICIPANT_REQUIRED",
                userMessage: "You do not have access to this event.",
              }),
            )
          }

          yield* authorization.require(
            {
              role: participant.role,
              planningPermission: planningPermissionFromDatabase(
                participant.planningPermission,
              ),
            },
            { event: ["manage_participants"] },
          )

          return yield* repo.createEventInvitation({
            actorUserId: userId,
            invitation,
          })
        }),

      acceptInvitation: (input) =>
        repo
          .acceptEventInvitation(input)
          .pipe(Effect.catchTag("PersistenceError", translateInvitationFailure)),
    }
  }),
)
