import {
  capabilitiesForParticipant,
  hasCapabilities,
  type PlanningPermission,
} from "@/lib/permissions"

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from "../contracts/event.contracts"
import {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  getEventParticipant,
  hasWorkspaceMembership,
  listVisibleMainEvents,
} from "../repos/event.repo"

function fromDatabasePlanningPermission(
  value: "manage" | "contribute" | "view_only",
): PlanningPermission {
  return value === "view_only" ? "viewOnly" : value
}

export async function acceptEventInvitationWorkflow(input: {
  userId: string
  userEmail: string
  invitation: AcceptEventInvitationInput
}) {
  return acceptEventInvitation(input)
}

export async function createEventWorkflow(input: {
  organizationId: string
  userId: string
  event: CreateEventInput
}) {
  if (
    !(await hasWorkspaceMembership({
      organizationId: input.organizationId,
      userId: input.userId,
    }))
  ) {
    throw new Error("WORKSPACE_FORBIDDEN")
  }

  return createEventWithParticipants(input)
}

export async function listEventsWorkflow(input: {
  organizationId: string
  userId: string
}) {
  const events = await listVisibleMainEvents(input)
  return events.map((item) => ({
    ...item,
    startsAt: item.startsAt?.toISOString() ?? null,
    endsAt: item.endsAt?.toISOString() ?? null,
    childEvents: item.childEvents.map((child) => ({
      ...child,
      startsAt: child.startsAt?.toISOString() ?? null,
      endsAt: child.endsAt?.toISOString() ?? null,
    })),
  }))
}

export async function inviteEventParticipantWorkflow(input: {
  userId: string
  invitation: InviteEventParticipantInput
}) {
  const actor = await getEventParticipant({
    eventId: input.invitation.eventId,
    userId: input.userId,
  })

  if (!actor) throw new Error("EVENT_FORBIDDEN")

  const capabilities = capabilitiesForParticipant({
    role: actor.role,
    planningPermission: fromDatabasePlanningPermission(
      actor.planningPermission,
    ),
  })
  if (!hasCapabilities(capabilities, ["event.manageParticipants"])) {
    throw new Error("EVENT_FORBIDDEN")
  }

  return createEventInvitation({
    actorUserId: input.userId,
    invitation: input.invitation,
  })
}
