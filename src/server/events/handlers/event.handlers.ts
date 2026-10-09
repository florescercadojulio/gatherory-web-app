import { randomUUID } from "node:crypto"
import { createServerFn } from "@tanstack/react-start"

import { requireSessionMiddleware } from "@/lib/auth.middleware"
import type { ClientError, ServerResult } from "@/server/result"

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

function failure(userMessage: string): { ok: false; error: ClientError } {
  return {
    ok: false,
    error: {
      userMessage,
      errorId: randomUUID(),
    },
  }
}

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(CreateEventInputSchema)
  .handler(async ({ data, context }) => {
    const organizationId = context.session.activeOrganizationId
    if (!organizationId) return failure("Choose a workspace and try again.")

    try {
      const created = await createEventWorkflow({
        organizationId,
        userId: context.user.id,
        event: data,
      })
      return { ok: true, data: created } as const
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_DEPTH_EXCEEDED") {
        return failure("Events can only be nested one level deep.")
      }
      if (
        error instanceof Error &&
        ["EVENT_FORBIDDEN", "WORKSPACE_FORBIDDEN"].includes(error.message)
      ) {
        return failure("You do not have permission to create this event.")
      }
      return failure("The event could not be created. Try again.")
    }
  })

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(ListEventsInputSchema)
  .handler(
    async ({ data, context }): Promise<ServerResult<EventWorkspaceSummary[]>> => {
    try {
      return {
        ok: true,
        data: await listEventsWorkflow({
          organizationId: data.organizationId,
          userId: context.user.id,
        }),
      }
    } catch {
      return failure("Events could not be loaded. Try again.")
    }
    },
  )

export const inviteEventParticipant = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(InviteEventParticipantInputSchema)
  .handler(async ({ data, context }) => {
    try {
      const invitation = await inviteEventParticipantWorkflow({
        userId: context.user.id,
        invitation: data,
      })
      return {
        ok: true,
        data: {
          ...invitation,
          expiresAt: invitation.expiresAt.toISOString(),
        },
      } as const
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_FORBIDDEN") {
        return failure("You do not have permission to invite participants.")
      }
      return failure("The invitation could not be created. Try again.")
    }
  })

export const acceptEventInvitation = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(AcceptEventInvitationInputSchema)
  .handler(async ({ data, context }) => {
    try {
      const participant = await acceptEventInvitationWorkflow({
        userId: context.user.id,
        userEmail: context.user.email,
        invitation: data,
      })
      return { ok: true, data: participant } as const
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "EVENT_INVITATION_EMAIL_MISMATCH"
      ) {
        return failure("Sign in with the email address that was invited.")
      }
      if (
        error instanceof Error &&
        error.message === "EVENT_INVITATION_EXPIRED"
      ) {
        return failure("This invitation has expired. Ask the host for a new one.")
      }
      return failure("This invitation is invalid or has already been used.")
    }
  })
