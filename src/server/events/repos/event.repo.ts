import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"
import { Context, Effect } from "effect"

import { db } from "@/db"
import { member, organization, user } from "@/db/schema/auth.schema"
import {
  event,
  eventInvitation,
  eventParticipant,
  workspacePerson,
} from "@/db/schema/event.schema"
import {
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
} from "@/db/schema/sync.schema"

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from "../contracts/event.contracts"
import type { PersistenceError } from "@/server/effect"

const planningPermissionToDatabase = {
  manage: "manage",
  contribute: "contribute",
  viewOnly: "view_only",
} as const

type InheritedParticipant = Pick<
  typeof eventParticipant.$inferSelect,
  "personId" | "role" | "planningPermission" | "attendanceStatus"
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
    .innerJoin(
      workspacePerson,
      eq(workspacePerson.id, eventParticipant.personId),
    )
    .where(
      and(
        eq(eventParticipant.eventId, input.eventId),
        eq(workspacePerson.userId, input.userId),
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

      inheritedParticipants = await transaction
        .select({
          personId: eventParticipant.personId,
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
        status: input.event.parentEventId ? null : "draft",
        purpose: input.event.purpose ?? null,
        category: "category" in input.event ? input.event.category : null,
        planningStatus:
          "planningStatus" in input.event ? input.event.planningStatus : null,
        startsAt: input.event.startsAt
          ? new Date(input.event.startsAt)
          : undefined,
        endsAt: input.event.endsAt ? new Date(input.event.endsAt) : undefined,
        schedulingState: input.event.startsAt ? "scheduled" : "unscheduled",
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
      const [account] = await transaction
        .select({ name: user.name, email: user.email, image: user.image })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1)
      if (!account) throw new Error("EVENT_ACTOR_NOT_FOUND")

      const [person] = await transaction
        .insert(workspacePerson)
        .values({
          organizationId: input.organizationId,
          userId: input.userId,
          displayName: account.name,
          email: account.email.trim().toLowerCase(),
          avatarUrl: account.image,
        })
        .onConflictDoUpdate({
          target: [workspacePerson.organizationId, workspacePerson.userId],
          targetWhere: sql`${workspacePerson.userId} is not null`,
          set: {
            displayName: account.name,
            email: account.email.trim().toLowerCase(),
            avatarUrl: account.image,
            updatedAt: new Date(),
          },
        })
        .returning({ id: workspacePerson.id })
      if (!person) throw new Error("EVENT_PERSON_CREATE_FAILED")

      await transaction.insert(eventParticipant).values({
        eventId: createdEvent.id,
        personId: person.id,
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
      workspacePerson,
      eq(workspacePerson.organizationId, organization.id),
    )
    .innerJoin(
      eventParticipant,
      and(
        eq(eventParticipant.eventId, event.id),
        eq(eventParticipant.personId, workspacePerson.id),
        eq(workspacePerson.userId, input.userId),
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
      status: event.planningStatus,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timeZone: event.timeZone,
      locationName: event.locationName,
    })
    .from(event)
    .where(inArray(event.parentEventId, mainEventIds))
    .orderBy(asc(event.startsAt), asc(event.createdAt))

  const allEventIds = [...mainEventIds, ...childEvents.map((item) => item.id)]
  const [participants, invitations] = await Promise.all([
    db
      .select({
        eventId: eventParticipant.eventId,
        id: workspacePerson.id,
        userId: workspacePerson.userId,
        name: workspacePerson.displayName,
        image: sql<string | null>`coalesce(${user.image}, ${workspacePerson.avatarUrl})`,
        role: eventParticipant.role,
        planningPermission: eventParticipant.planningPermission,
        attendanceStatus: eventParticipant.attendanceStatus,
      })
      .from(eventParticipant)
      .innerJoin(
        workspacePerson,
        eq(workspacePerson.id, eventParticipant.personId),
      )
      .leftJoin(user, eq(user.id, workspacePerson.userId))
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
    if (!mainEvent.status) throw new Error("MAIN_EVENT_STATUS_MISSING")
    const status = mainEvent.status
    const eventParticipants = (participantsByEvent.get(mainEvent.id) ?? []).map(
      ({ eventId: _eventId, ...participant }) => participant,
    )
    const currentParticipant = eventParticipants.find(
      (participant) => participant.userId === input.userId,
    )
    if (!currentParticipant) throw new Error("EVENT_PARTICIPANT_NOT_FOUND")

    return {
      ...mainEvent,
      status,
      pendingInvitationCount: invitationsByEvent.get(mainEvent.id)?.length ?? 0,
      currentParticipant,
      participants: eventParticipants,
      childEvents: (childrenByParent.get(mainEvent.id) ?? []).flatMap(
        (child) => {
          if (!child.purpose || !child.status) return []
          const status = child.status
          const { parentEventId: _parentEventId, ...childEvent } = child
          return [
            {
              ...childEvent,
              status,
              purpose: child.purpose,
              participantCount: participantsByEvent.get(child.id)?.length ?? 0,
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

  const invitation = await db.transaction(async (transaction) => {
    const [targetEvent] = await transaction
      .select({ organizationId: event.organizationId })
      .from(event)
      .where(eq(event.id, input.invitation.eventId))
      .limit(1)
    if (!targetEvent) throw new Error("EVENT_NOT_FOUND")

    const email = input.invitation.email.trim().toLowerCase()
    const [existingPerson] = await transaction
      .select({ id: workspacePerson.id })
      .from(workspacePerson)
      .where(
        and(
          eq(workspacePerson.organizationId, targetEvent.organizationId),
          eq(workspacePerson.email, email),
        ),
      )
      .limit(1)

    const person =
      existingPerson ??
      (
        await transaction
          .insert(workspacePerson)
          .values({
            organizationId: targetEvent.organizationId,
            displayName: input.invitation.name || email.split("@")[0] || email,
            email,
          })
          .returning({ id: workspacePerson.id })
      )[0]
    if (!person) throw new Error("EVENT_INVITEE_CREATE_FAILED")

    const [createdInvitation] = await transaction
      .insert(eventInvitation)
      .values({
        eventId: input.invitation.eventId,
        personId: person.id,
        email,
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
          personId: person.id,
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
    return createdInvitation
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
        personId: eventInvitation.personId,
        role: eventInvitation.role,
        planningPermission: eventInvitation.planningPermission,
        expiresAt: eventInvitation.expiresAt,
        organizationId: event.organizationId,
      })
      .from(eventInvitation)
      .innerJoin(event, eq(event.id, eventInvitation.eventId))
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

    const [account] = await transaction
      .select({ name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1)
    if (!account) throw new Error("EVENT_INVITEE_ACCOUNT_NOT_FOUND")

    const [linkedPerson] = await transaction
      .select({ id: workspacePerson.id })
      .from(workspacePerson)
      .where(
        and(
          eq(workspacePerson.organizationId, pendingInvitation.organizationId),
          eq(workspacePerson.userId, input.userId),
        ),
      )
      .limit(1)

    let acceptedPersonId = linkedPerson?.id ?? pendingInvitation.personId
    if (!linkedPerson) {
      const [updatedPerson] = await transaction
        .update(workspacePerson)
        .set({
          userId: input.userId,
          displayName: account.name,
          email: account.email.trim().toLowerCase(),
          avatarUrl: account.image,
          updatedAt: new Date(),
        })
        .where(eq(workspacePerson.id, pendingInvitation.personId))
        .returning({ id: workspacePerson.id })
      if (!updatedPerson) throw new Error("EVENT_INVITEE_LINK_FAILED")
      acceptedPersonId = updatedPerson.id
    } else if (linkedPerson.id !== pendingInvitation.personId) {
      const oldParticipations = await transaction
        .select()
        .from(eventParticipant)
        .where(eq(eventParticipant.personId, pendingInvitation.personId))
      for (const oldParticipation of oldParticipations) {
        const [existingParticipation] = await transaction
          .select({ id: eventParticipant.id })
          .from(eventParticipant)
          .where(
            and(
              eq(eventParticipant.eventId, oldParticipation.eventId),
              eq(eventParticipant.personId, linkedPerson.id),
            ),
          )
          .limit(1)
        if (existingParticipation) {
          await transaction
            .update(eventParticipant)
            .set({
              role: oldParticipation.role,
              planningPermission: oldParticipation.planningPermission,
              attendanceStatus: oldParticipation.attendanceStatus,
              updatedAt: new Date(),
            })
            .where(eq(eventParticipant.id, existingParticipation.id))
          await transaction
            .delete(eventParticipant)
            .where(eq(eventParticipant.id, oldParticipation.id))
        } else {
          await transaction
            .update(eventParticipant)
            .set({ personId: linkedPerson.id, updatedAt: new Date() })
            .where(eq(eventParticipant.id, oldParticipation.id))
        }
      }
      await transaction
        .update(eventInvitation)
        .set({ personId: linkedPerson.id, updatedAt: new Date() })
        .where(eq(eventInvitation.personId, pendingInvitation.personId))
      await transaction
        .delete(workspacePerson)
        .where(eq(workspacePerson.id, pendingInvitation.personId))
    }

    const accepted = await transaction
      .update(eventInvitation)
      .set({
        status: "accepted",
        personId: acceptedPersonId,
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
        personId: acceptedPersonId,
        role: pendingInvitation.role,
        planningPermission: pendingInvitation.planningPermission,
      })
      .onConflictDoNothing({
        target: [eventParticipant.eventId, eventParticipant.personId],
      })

    // Native workspaces use the root event UUID as their sync scope today.
    // Only a planning role on the main event implies workspace-wide access.
    // Guests and child-event participants must stay event-scoped; promoting
    // either would expose unrelated planning entities and budget information.
    const [acceptedEvent] = await transaction
      .select({ id: event.id, parentEventId: event.parentEventId })
      .from(event)
      .where(eq(event.id, pendingInvitation.eventId))
      .limit(1)
    const nativeScopeId =
      acceptedEvent &&
      acceptedEvent.parentEventId === null &&
      pendingInvitation.role !== "guest"
        ? acceptedEvent.id
        : null
    if (nativeScopeId) {
      const [nativeScope] = await transaction
        .select({ id: nativeWorkspaceSnapshot.scopeId })
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, nativeScopeId))
        .limit(1)
      if (nativeScope) {
        await transaction
          .insert(nativeSyncScopeMember)
          .values({
            scopeId: nativeScope.id,
            userId: input.userId,
            role:
              pendingInvitation.planningPermission === "view_only"
                ? "viewer"
                : "editor",
          })
          .onConflictDoUpdate({
            target: [
              nativeSyncScopeMember.scopeId,
              nativeSyncScopeMember.userId,
            ],
            set: {
              role:
                pendingInvitation.planningPermission === "view_only"
                  ? "viewer"
                  : "editor",
              updatedAt: new Date(),
            },
          })
      }
    }

    return {
      eventId: pendingInvitation.eventId,
      role: pendingInvitation.role,
      planningPermission: pendingInvitation.planningPermission,
    }
  })
}

export type EventRepoShape = {
  readonly hasWorkspaceMembership: (
    input: Parameters<typeof hasWorkspaceMembership>[0],
  ) => Effect.Effect<boolean, PersistenceError>
  readonly getEventParticipant: (
    input: Parameters<typeof getEventParticipant>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<typeof getEventParticipant>>,
    PersistenceError
  >
  readonly createEventWithParticipants: (
    input: Parameters<typeof createEventWithParticipants>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<typeof createEventWithParticipants>>,
    PersistenceError
  >
  readonly listVisibleMainEvents: (
    input: Parameters<typeof listVisibleMainEvents>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<typeof listVisibleMainEvents>>,
    PersistenceError
  >
  readonly createEventInvitation: (
    input: Parameters<typeof createEventInvitation>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<typeof createEventInvitation>>,
    PersistenceError
  >
  readonly acceptEventInvitation: (
    input: Parameters<typeof acceptEventInvitation>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<typeof acceptEventInvitation>>,
    PersistenceError
  >
}

/** Persistence contract consumed by the Event service. */
export class EventRepo extends Context.Service<EventRepo, EventRepoShape>()(
  "EventRepo",
) {}

export type EventRepoError = PersistenceError
