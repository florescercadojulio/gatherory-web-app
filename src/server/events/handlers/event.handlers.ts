import { transportInput } from "@/lib/input-validation"
import { validateInput } from "@/server/validation"
import { createServerFn } from "@tanstack/react-start"
import type { PgClient } from "@effect/sql-pg/PgClient"
import { Effect } from "effect"
import { and, eq } from "drizzle-orm"

import { requireSessionMiddleware } from "@/lib/auth.middleware"
import { DB, PgClientLive } from "@/db"
import { event, eventInvitation } from "@/db/schema/event.schema"
import { EntityNotFoundError, ForbiddenError, InvalidInputError, runServerEffect } from "@/server/effect"
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
import { acceptEventShareLink, previewEventShareLink } from "../repos/event-share-link.repo"

export const getSharedEventInvitation = createServerFn({ method: "GET" })
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data }) => runServerEffect(validateInput(AcceptEventInvitationInputSchema, data).pipe(Effect.flatMap((data) =>previewEventShareLink(data.token).pipe(Effect.provide(PgClientLive))))))

export const getJoinedSharedInvitation = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) => runServerEffect(validateInput(AcceptEventInvitationInputSchema, data).pipe(Effect.flatMap((data) =>previewEventShareLink(data.token, context.user.id).pipe(Effect.provide(PgClientLive))))))

export const acceptSharedEventInvitation = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) => runServerEffect(validateInput(AcceptEventInvitationInputSchema, data).pipe(Effect.flatMap((data) =>
    acceptEventShareLink(context.user.id, data.token).pipe(Effect.provide(PgClientLive)),
  ))))

const provideEventLayers = <A, E>(
  program: Effect.Effect<A, E, EventService | PgClient>,
) =>
  program.pipe(
    Effect.provide(EventServiceLive),
    Effect.provide(EventRepoLive),
    Effect.provide(EventAuthorizationLive),
    Effect.provide(PgClientLive),
  )

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(CreateEventInputSchema))
  .handler(({ data, context }) => {
    const organizationId = context.session.activeOrganizationId
    if (!organizationId) {
      return runServerEffect(validateInput(CreateEventInputSchema, data).pipe(Effect.flatMap(() =>
        Effect.fail(
          new InvalidInputError({
            category: "validation",
            code: "ACTIVE_WORKSPACE_REQUIRED",
            userMessageKey: "serverErrors.ACTIVE_WORKSPACE_REQUIRED",
          }),
        ),
      )))
    }

    return runServerEffect(validateInput(CreateEventInputSchema, data).pipe(Effect.flatMap((data) =>
      provideEventLayers(
        createEventWorkflow({
          organizationId,
          userId: context.user.id,
          event: data,
        }),
      ),
    )))
  })

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(ListEventsInputSchema))
  .handler(
    ({ data, context }): Promise<ServerResult<EventWorkspaceSummary[]>> =>
      runServerEffect(validateInput(ListEventsInputSchema, data).pipe(Effect.flatMap((data) =>
        provideEventLayers(
          listEventsWorkflow({
            organizationId: data.organizationId,
            userId: context.user.id,
          }),
        ),
      ))),
  )

export const inviteEventParticipant = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(InviteEventParticipantInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(validateInput(InviteEventParticipantInputSchema, data).pipe(Effect.flatMap((data) =>
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
    ))),
  )

export const acceptEventInvitation = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(validateInput(AcceptEventInvitationInputSchema, data).pipe(Effect.flatMap((data) =>
      !context.user.emailVerified
        ? Effect.fail(new ForbiddenError({
            category: "authorization", code: "INVITATION_EMAIL_UNVERIFIED",
            userMessageKey: "serverErrors.INVITATION_EMAIL_UNVERIFIED",
          }))
        :
      provideEventLayers(
        acceptEventInvitationWorkflow({
          userId: context.user.id,
          userEmail: context.user.email,
          invitation: data,
        }),
      ),
    ))),
  )

/** Invitation details are private to the addressed account, even with a token. */
export const getEventInvitation = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) => runServerEffect(validateInput(AcceptEventInvitationInputSchema, data).pipe(Effect.flatMap((data) =>
    Effect.gen(function* () {
      const db = yield* DB
      const [invitation] = yield* db.select({
        title: event.title, role: eventInvitation.role,
        status: eventInvitation.status, expiresAt: eventInvitation.expiresAt,
      }).from(eventInvitation)
        .innerJoin(event, eq(event.id, eventInvitation.eventId))
        .where(and(eq(eventInvitation.token, data.token),
          eq(eventInvitation.email, context.user.email.trim().toLowerCase())))
        .limit(1)
      if (!invitation || !["pending", "accepted"].includes(invitation.status)) {
        return yield* Effect.fail(new EntityNotFoundError({
          category: "not_found", code: "INVITATION_UNAVAILABLE",
          userMessageKey: "serverErrors.INVITATION_UNAVAILABLE",
        }))
      }
      return { ...invitation, expiresAt: invitation.expiresAt.toISOString() }
    }).pipe(Effect.provide(PgClientLive)),
  ))))
