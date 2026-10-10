import { createServerFn } from "@tanstack/react-start"
import { Effect } from "effect"

import { requireSessionMiddleware } from "@/lib/auth.middleware"
import { InvalidInputError, runServerEffect } from "@/server/effect"
import type { ServerResult } from "@/server/result"

import {
  AcceptEventInvitationInputSchema,
  CreateEventInputSchema,
  InviteEventParticipantInputSchema,
  ListEventsInputSchema,
  type EventWorkspaceSummary,
} from "../contracts/event.contracts"
import {
  acceptEventInvitationWorkflow,
  createEventWorkflow,
  inviteEventParticipantWorkflow,
  listEventsWorkflow,
} from "../workflows/event.workflows"
import { EventRepoLive } from "../repos/event.repo.live"
import { EventAuthorizationLive } from "../services/event-authorization.service"
import { EventService } from "../services/event.service"
import { EventServiceLive } from "../services/event.service.live"

const provideEventLayers = <A, E>(program: Effect.Effect<A, E, EventService>) =>
  program.pipe(
    Effect.provide(EventServiceLive),
    Effect.provide(EventRepoLive),
    Effect.provide(EventAuthorizationLive),
  )

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(CreateEventInputSchema)
  .handler(({ data, context }) => {
    const organizationId = context.session.activeOrganizationId
    if (!organizationId) {
      return runServerEffect(
        Effect.fail(
          new InvalidInputError({
            category: "validation",
            code: "ACTIVE_WORKSPACE_REQUIRED",
            userMessage: "Choose a workspace and try again.",
          }),
        ),
      )
    }

    return runServerEffect(
      provideEventLayers(
        createEventWorkflow({
          organizationId,
          userId: context.user.id,
          event: data,
        }),
      ),
    )
  })

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(ListEventsInputSchema)
  .handler(
    ({ data, context }): Promise<ServerResult<EventWorkspaceSummary[]>> =>
      runServerEffect(
        provideEventLayers(
          listEventsWorkflow({
            organizationId: data.organizationId,
            userId: context.user.id,
          }),
        ),
      ),
  )

export const inviteEventParticipant = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(InviteEventParticipantInputSchema)
  .handler(({ data, context }) =>
    runServerEffect(
      provideEventLayers(
        inviteEventParticipantWorkflow({
          userId: context.user.id,
          invitation: data,
        }).pipe(
          Effect.map((invitation) => ({
            ...invitation,
            expiresAt: invitation.expiresAt.toISOString(),
          })),
        ),
      ),
    ),
  )

export const acceptEventInvitation = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(AcceptEventInvitationInputSchema)
  .handler(({ data, context }) =>
    runServerEffect(
      provideEventLayers(
        acceptEventInvitationWorkflow({
          userId: context.user.id,
          userEmail: context.user.email,
          invitation: data,
        }),
      ),
    ),
  )
