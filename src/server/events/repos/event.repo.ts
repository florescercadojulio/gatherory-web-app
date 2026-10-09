import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"

import { db } from "@/db"
import { member, organization, user } from "@/db/schema/auth.schema"
import {
  event,
  eventInvitation,
  eventParticipant,
} from "@/db/schema/event.schema"

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from "../contracts/event.contracts"

const planningPermissionToDatabase = {
  manage: "manage",
  contribute: "contribute",
  viewOnly: "view_only",
} as const

type InheritedParticipant = Pick<
  typeof eventParticipant.$inferSelect,
  "userId" | "role" | "planningPermission" | "attendanceStatus"
>

export async function hasWorkspaceMembership(input: {
  organizationId: string
  userId: string
}) {
  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.organizationId, input.organizationId),
        eq(member.userId, input.userId),
      ),
    )
    .limit(1)

  return Boolean(membership)
}

export async function getEventParticipant(input: {
  eventId: string
  userId: string
}) {
  const [participant] = await db
    .select({
      role: eventParticipant.role,
      planningPermission: eventParticipant.planningPermission,
    })
    .from(eventParticipant)
    .where(
      and(
        eq(eventParticipant.eventId, input.eventId),
        eq(eventParticipant.userId, input.userId),
      ),
    )
    .limit(1)

  return participant
}

export async function createEventWithParticipants(input: {
  organizationId: string
  userId: string
  event: CreateEventInput
}) {
  return db.transaction(async (transaction) => {
    let inheritedParticipants: InheritedParticipant[] = []

    if (input.event.parentEventId) {
      const [parent] = await transaction
        .select({
          id: event.id,
          parentEventId: event.parentEventId,
          organizationId: event.organizationId,
        })
        .from(event)
        .where(
          and(
            eq(event.id, input.event.parentEventId),
            eq(event.organizationId, input.organizationId),
          ),
        )
        .limit(1)

      if (!parent) throw new Error("EVENT_PARENT_NOT_FOUND")
      if (parent.parentEventId) throw new Error("EVENT_DEPTH_EXCEEDED")

      const actor = await transaction
        .select({
          role: eventParticipant.role,
          planningPermission: eventParticipant.planningPermission,
        })
        .from(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, parent.id),
            eq(eventParticipant.userId, input.userId),
          ),
        )
        .limit(1)

      if (
        !actor[0] ||
        (actor[0].role !== "host" &&
          actor[0].planningPermission !== "manage")
      ) {
        throw new Error("EVENT_FORBIDDEN")
      }

      inheritedParticipants = await transaction
        .select({
          userId: eventParticipant.userId,
          role: eventParticipant.role,
          planningPermission: eventParticipant.planningPermission,
          attendanceStatus: eventParticipant.attendanceStatus,
        })
        .from(eventParticipant)
        .where(eq(eventParticipant.eventId, parent.id))
    }

    const [createdEvent] = await transaction
      .insert(event)
      .values({
        organizationId: input.organizationId,
        parentEventId: input.event.parentEventId ?? null,
        title: input.event.title,
        description: input.event.description,
        imageUrl: input.event.imageUrl,
        purpose: input.event.purpose ?? null,
        startsAt: input.event.startsAt
          ? new Date(input.event.startsAt)
          : undefined,
        endsAt: input.event.endsAt ? new Date(input.event.endsAt) : undefined,
        timeZone: input.event.timeZone,
        locationName: input.event.locationName,
        locationAddress: input.event.locationAddress,
        createdByUserId: input.userId,
      })
      .returning({
        id: event.id,
        title: event.title,
        status: event.status,
        parentEventId: event.parentEventId,
      })

    if (!createdEvent) throw new Error("EVENT_CREATE_FAILED")

    if (inheritedParticipants.length) {
      await transaction.insert(eventParticipant).values(
        inheritedParticipants.map((participant) => ({
          ...participant,
          eventId: createdEvent.id,
        })),
      )
    } else {
      await transaction.insert(eventParticipant).values({
        eventId: createdEvent.id,
        userId: input.userId,
        role: "host",
        planningPermission: "manage",
        attendanceStatus: "going",
      })
    }

    return createdEvent
  })
}

export async function listVisibleMainEvents(input: {
  organizationId: string
  userId: string
}) {
  const mainEvents = await db
    .select({
      id: event.id,
      workspaceName: organization.name,
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timeZone: event.timeZone,
      locationName: event.locationName,
    })
    .from(event)
    .innerJoin(
      eventParticipant,
      and(
        eq(eventParticipant.eventId, event.id),
        eq(eventParticipant.userId, input.userId),
      ),
    )
    .innerJoin(organization, eq(organization.id, event.organizationId))
    .where(
      and(
        eq(event.organizationId, input.organizationId),
        isNull(event.parentEventId),
      ),
    )
    .orderBy(asc(event.startsAt), asc(event.createdAt))

  if (!mainEvents.length) return []

  const mainEventIds = mainEvents.map((item) => item.id)
  const childEvents = await db
    .select({
      id: event.id,
      parentEventId: event.parentEventId,
      title: event.title,
      purpose: event.purpose,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timeZone: event.timeZone,
      locationName: event.locationName,
    })
    .from(event)
    .where(inArray(event.parentEventId, mainEventIds))
    .orderBy(asc(event.startsAt), asc(event.createdAt))

  const allEventIds = [
    ...mainEventIds,
    ...childEvents.map((item) => item.id),
  ]
  const [participants, invitations] = await Promise.all([
    db
      .select({
        eventId: eventParticipant.eventId,
        id: user.id,
        name: user.name,
        image: user.image,
        role: eventParticipant.role,
        planningPermission: eventParticipant.planningPermission,
        attendanceStatus: eventParticipant.attendanceStatus,
      })
      .from(eventParticipant)
      .innerJoin(user, eq(user.id, eventParticipant.userId))
      .where(inArray(eventParticipant.eventId, allEventIds)),
    db
      .select({ eventId: eventInvitation.eventId })
      .from(eventInvitation)
      .where(
        and(
          inArray(eventInvitation.eventId, allEventIds),
          eq(eventInvitation.status, "pending"),
        ),
      ),
  ])

  const participantsByEvent = Map.groupBy(
    participants,
    (participant) => participant.eventId,
  )
  const invitationsByEvent = Map.groupBy(
    invitations,
    (invitation) => invitation.eventId,
  )
  const childrenByParent = Map.groupBy(
    childEvents,
    (child) => child.parentEventId,
  )

  return mainEvents.map((mainEvent) => {
    const eventParticipants = (participantsByEvent.get(mainEvent.id) ?? []).map(
      ({ eventId: _eventId, ...participant }) => participant,
    )
    const currentParticipant = eventParticipants.find(
      (participant) => participant.id === input.userId,
    )
    if (!currentParticipant) throw new Error("EVENT_PARTICIPANT_NOT_FOUND")

    return {
      ...mainEvent,
      pendingInvitationCount:
        invitationsByEvent.get(mainEvent.id)?.length ?? 0,
      currentParticipant,
      participants: eventParticipants,
      childEvents: (childrenByParent.get(mainEvent.id) ?? []).flatMap(
        (child) => {
          if (!child.purpose) return []
          const { parentEventId: _parentEventId, ...childEvent } = child
          return [
            {
              ...childEvent,
              purpose: child.purpose,
              participantCount:
                participantsByEvent.get(child.id)?.length ?? 0,
            },
          ]
        },
      ),
    }
  })
}

export async function createEventInvitation(input: {
  actorUserId: string
  invitation: InviteEventParticipantInput
}) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14)

  const [invitation] = await db
    .insert(eventInvitation)
    .values({
      eventId: input.invitation.eventId,
      email: input.invitation.email,
      role: input.invitation.role,
      planningPermission:
        planningPermissionToDatabase[input.invitation.planningPermission],
      invitedByUserId: input.actorUserId,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [eventInvitation.eventId, eventInvitation.email],
      targetWhere: sql`${eventInvitation.status} = 'pending'`,
      set: {
        role: input.invitation.role,
        planningPermission:
          planningPermissionToDatabase[input.invitation.planningPermission],
        invitedByUserId: input.actorUserId,
        expiresAt,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: eventInvitation.id,
      token: eventInvitation.token,
      email: eventInvitation.email,
      expiresAt: eventInvitation.expiresAt,
    })

  if (!invitation) throw new Error("EVENT_INVITATION_CREATE_FAILED")
  return invitation
}

export async function acceptEventInvitation(input: {
  userId: string
  userEmail: string
  invitation: AcceptEventInvitationInput
}) {
  return db.transaction(async (transaction) => {
    const [pendingInvitation] = await transaction
      .select({
        id: eventInvitation.id,
        eventId: eventInvitation.eventId,
        email: eventInvitation.email,
        role: eventInvitation.role,
        planningPermission: eventInvitation.planningPermission,
        expiresAt: eventInvitation.expiresAt,
      })
      .from(eventInvitation)
      .where(
        and(
          eq(eventInvitation.token, input.invitation.token),
          eq(eventInvitation.status, "pending"),
        ),
      )
      .limit(1)

    if (!pendingInvitation) throw new Error("EVENT_INVITATION_NOT_FOUND")
    if (pendingInvitation.expiresAt <= new Date()) {
      throw new Error("EVENT_INVITATION_EXPIRED")
    }
    if (pendingInvitation.email !== input.userEmail.trim().toLowerCase()) {
      throw new Error("EVENT_INVITATION_EMAIL_MISMATCH")
    }

    const accepted = await transaction
      .update(eventInvitation)
      .set({
        status: "accepted",
        acceptedByUserId: input.userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(eventInvitation.id, pendingInvitation.id),
          eq(eventInvitation.status, "pending"),
        ),
      )
      .returning({ id: eventInvitation.id })

    if (!accepted[0]) throw new Error("EVENT_INVITATION_ALREADY_USED")

    await transaction
      .insert(eventParticipant)
      .values({
        eventId: pendingInvitation.eventId,
        userId: input.userId,
        role: pendingInvitation.role,
        planningPermission: pendingInvitation.planningPermission,
      })
      .onConflictDoNothing({
        target: [eventParticipant.eventId, eventParticipant.userId],
      })

    return {
      eventId: pendingInvitation.eventId,
      role: pendingInvitation.role,
      planningPermission: pendingInvitation.planningPermission,
    }
  })
}
