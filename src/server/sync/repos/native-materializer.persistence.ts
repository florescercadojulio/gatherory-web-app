import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { Data } from 'effect'
import type { DomainErrorShape } from '@/lib/domain-errors'

import { db } from '@/db'
import { member, organization, user } from '@/db/schema/auth.schema'
import {
  event,
  eventDeparture,
  eventInvitation,
  eventParticipant,
  workspacePerson,
} from '@/db/schema/event.schema'
import { eventMedia, ideaMedia, mediaAsset, registryItemMedia } from '@/db/schema/media.schema'
import {
  eventExpense,
  eventNote,
  eventTodo,
  idea,
  ideaDecision,
  registryItem,
  workspacePlanningSettings,
} from '@/db/schema/planning.schema'
import { nativeSyncEntity } from '@/db/schema/sync.schema'

import type { NativeMutation } from '../contracts/native-sync.contracts'
import { ideaResponseID } from '../contracts/idea-response'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'
import { enqueueNativeNotification } from '@/server/notifications/repos/notification-outbox.persistence'

type NativeTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type NotificationEventState = {
  id: string
  startsAt: Date | null
  endsAt: Date | null
  schedulingState: string
  isAllDay: boolean
  timeZone: string
  locationName: string | null
  locationAddress: string | null
  locationAddressLine2: string | null
  locationLatitude: number | null
  locationLongitude: number | null
  mapItemIdentifier: string | null
  status: string | null
  planningStatus: string | null
}

/** Canonical scheduling state used to decide whether a root snapshot changed an existing event. */
export async function nativeNotificationEventStates(
  transaction: NativeTransaction,
  input: { organizationId: string; rootEventId: string }
): Promise<NotificationEventState[]> {
  return transaction
    .select({
      id: event.id,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      schedulingState: event.schedulingState,
      isAllDay: event.isAllDay,
      timeZone: event.timeZone,
      locationName: event.locationName,
      locationAddress: event.locationAddress,
      locationAddressLine2: event.locationAddressLine2,
      locationLatitude: event.locationLatitude,
      locationLongitude: event.locationLongitude,
      mapItemIdentifier: event.mapItemIdentifier,
      status: event.status,
      planningStatus: event.planningStatus,
    })
    .from(event)
    .where(
      and(
        eq(event.organizationId, input.organizationId),
        or(eq(event.id, input.rootEventId), eq(event.parentEventId, input.rootEventId))
      )
    )
}

/** Capture an assignment from canonical todo state, within the caller's mutation transaction. */
export async function captureNativeTodoAssignmentNotification(
  transaction: NativeTransaction,
  input: {
    mutationId: string
    actorUserId: string
    organizationId: string
    todoId: string
    previousAssigneePersonId: string | null
  }
) {
  const [todo] = await transaction
    .select({
      id: eventTodo.id,
      eventId: eventTodo.eventId,
      assigneePersonId: eventTodo.assigneePersonId,
      isCompleted: eventTodo.isCompleted,
    })
    .from(eventTodo)
    .where(and(eq(eventTodo.id, input.todoId), eq(eventTodo.organizationId, input.organizationId)))
    .limit(1)
  if (
    !todo ||
    todo.isCompleted ||
    !todo.assigneePersonId ||
    todo.assigneePersonId === input.previousAssigneePersonId
  )
    return

  const [assignee] = await transaction
    .select({ personId: workspacePerson.id, userId: workspacePerson.userId })
    .from(workspacePerson)
    .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
    .innerJoin(
      event,
      and(
        eq(event.id, eventParticipant.eventId),
        eq(event.organizationId, workspacePerson.organizationId)
      )
    )
    .leftJoin(
      eventDeparture,
      and(
        eq(eventDeparture.eventId, eventParticipant.eventId),
        eq(eventDeparture.userId, workspacePerson.userId)
      )
    )
    .where(
      and(
        eq(workspacePerson.id, todo.assigneePersonId),
        eq(workspacePerson.organizationId, input.organizationId),
        isNotNull(workspacePerson.userId),
        eq(eventParticipant.eventId, todo.eventId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        sql`(${eventParticipant.role} = 'host' or ${eventParticipant.planningPermission} in ('manage', 'contribute'))`,
        isNull(eventDeparture.userId)
      )
    )
    .limit(1)
  if (!assignee?.userId || assignee.userId === input.actorUserId) return

  await enqueueNativeNotification(transaction, {
    eventId: todo.eventId,
    entityId: todo.id,
    recipient: { kind: 'user', id: assignee.userId },
    mutationId: input.mutationId,
    notificationType: 'assignment_changed',
  })
}

export async function nativeTodoAssigneeBefore(
  transaction: NativeTransaction,
  input: { organizationId: string; todoId: string }
) {
  const [todo] = await transaction
    .select({ assigneePersonId: eventTodo.assigneePersonId })
    .from(eventTodo)
    .where(and(eq(eventTodo.id, input.todoId), eq(eventTodo.organizationId, input.organizationId)))
    .limit(1)
  return todo?.assigneePersonId ?? null
}

/** Capture scheduling/location/cancellation changes for existing exact events only. */
export async function captureNativeEventChangeNotifications(
  transaction: NativeTransaction,
  input: {
    mutationId: string
    actorUserId: string
    organizationId: string
    before: NotificationEventState[]
    after: NotificationEventState[]
  }
) {
  const beforeById = new Map(input.before.map((state) => [state.id, state]))
  const changed = input.after.filter((after) => {
    const before = beforeById.get(after.id)
    if (!before) return false
    const changedScheduleOrLocation = [
      'startsAt',
      'endsAt',
      'schedulingState',
      'isAllDay',
      'timeZone',
      'locationName',
      'locationAddress',
      'locationAddressLine2',
      'locationLatitude',
      'locationLongitude',
      'mapItemIdentifier',
    ].some((key) => {
      const previous = before[key as keyof NotificationEventState]
      const current = after[key as keyof NotificationEventState]
      if (previous instanceof Date && current instanceof Date) {
        return previous.getTime() !== current.getTime()
      }
      return !Object.is(previous, current)
    })
    const cancellationChanged =
      (before.status === 'cancelled' || before.planningStatus === 'cancelled') !==
      (after.status === 'cancelled' || after.planningStatus === 'cancelled')
    return changedScheduleOrLocation || cancellationChanged
  })

  for (const state of changed) {
    const participants = await transaction
      .select({ userId: workspacePerson.userId, guestProfileId: workspacePerson.guestProfileId })
      .from(eventParticipant)
      .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
      .leftJoin(
        eventDeparture,
        and(
          eq(eventDeparture.eventId, eventParticipant.eventId),
          eq(eventDeparture.userId, workspacePerson.userId)
        )
      )
      .where(
        and(
          eq(eventParticipant.eventId, state.id),
          eq(workspacePerson.organizationId, input.organizationId),
          isNull(eventDeparture.userId)
        )
      )
    for (const participant of participants) {
      if (participant.userId) {
        if (participant.userId === input.actorUserId) continue
        await enqueueNativeNotification(transaction, {
          eventId: state.id,
          entityId: state.id,
          recipient: { kind: 'user', id: participant.userId },
          mutationId: input.mutationId,
          notificationType: 'event_changed',
        })
      } else if (participant.guestProfileId) {
        await enqueueNativeNotification(transaction, {
          eventId: state.id,
          entityId: state.id,
          recipient: { kind: 'device_guest', id: participant.guestProfileId },
          mutationId: input.mutationId,
          notificationType: 'event_changed',
        })
      }
    }
  }
}

const appleReferenceDateOffsetSeconds = 978_307_200

export class NativeMaterializationError extends Data.TaggedError('NativeMaterializationError')<
  DomainErrorShape & { code: string }
> {}

function nativeMaterializationFailure(code: string) {
  return new NativeMaterializationError({
    category: /SCOPE_MISMATCH|TODO_EVENT_PERMISSION_REQUIRED/.test(code)
      ? 'authorization'
      : code === 'EVENT_DEPTH_EXCEEDED'
        ? 'conflict'
        : 'validation',
    code,
    userMessageKey: 'serverErrors.INVALID_NATIVE_PAYLOAD',
    debugMessage: code,
  })
}

export async function materializeNativeMutation(
  transaction: NativeTransaction,
  input: {
    userId: string
    mutation: NativeMutation
    organizationId?: string
  }
) {
  const { mutation } = input

  if (mutation.entityType === 'workspace') {
    if (mutation.operation === 'delete') {
      const organizationId = input.organizationId ?? mutation.scopeID
      await transaction.delete(event).where(eq(event.organizationId, organizationId))
      await transaction
        .delete(workspacePerson)
        .where(eq(workspacePerson.organizationId, organizationId))
      await transaction
        .delete(workspacePlanningSettings)
        .where(eq(workspacePlanningSettings.organizationId, organizationId))
      return { organizationId }
    }

    return materializeWorkspace(transaction, {
      userId: input.userId,
      scopeId: mutation.scopeID,
      entityId: mutation.entityID,
      payload: decodeNativePayload(mutation.payload),
      organizationId: input.organizationId,
    })
  }

  const organizationId = requiredString(input.organizationId, 'SYNC_SCOPE_ORGANIZATION_MISSING')

  if (mutation.operation === 'delete') {
    // A response is retracted by an authenticated update with a nil choice.
    // Reject bare ID deletes, which do not carry the idea/account ownership key.
    if (mutation.entityType === 'idea_response')
      throw nativeMaterializationFailure('IDEA_RESPONSE_DELETE_FORBIDDEN')
    if (mutation.entityType === 'todo') {
      await deleteTodo(transaction, {
        userId: input.userId,
        organizationId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
      })
      return { organizationId }
    }
    await deleteCanonicalEntity(transaction, {
      organizationId,
      entityType: mutation.entityType,
      entityId: mutation.entityID,
    })
    return { organizationId }
  }

  const payload = asRecord(decodeNativePayload(mutation.payload))
  switch (mutation.entityType) {
    case 'idea_response': {
      assertPayloadId(mutation.entityID, payload.id)
      const ideaId = requiredUUID(payload.ideaID, 'IDEA_RESPONSE_IDEA_MISSING')
      if (
        payload.userID !== input.userId ||
        mutation.entityID !== ideaResponseID(ideaId, input.userId)
      ) {
        throw nativeMaterializationFailure('IDEA_RESPONSE_OWNER_MISMATCH')
      }
      const [target] = await transaction
        .select({ eventId: idea.eventId, status: idea.status })
        .from(idea)
        .where(and(eq(idea.id, ideaId), eq(idea.organizationId, organizationId)))
        .limit(1)
      if (!target) throw nativeMaterializationFailure('IDEA_RESPONSE_SCOPE_MISMATCH')
      const [context] = await transaction
        .select()
        .from(event)
        .where(eq(event.id, target.eventId))
        .limit(1)
      const [root] = await transaction
        .select()
        .from(event)
        .where(eq(event.id, mutation.scopeID))
        .limit(1)
      if (
        !context ||
        (context.id !== mutation.scopeID && context.parentEventId !== mutation.scopeID)
      ) {
        throw nativeMaterializationFailure('IDEA_RESPONSE_SCOPE_MISMATCH')
      }
      if (
        !root ||
        ['finished', 'cancelled'].includes(root.status ?? '') ||
        ['archived', 'cancelled'].includes(context.planningStatus ?? '') ||
        context.completionStatus === 'complete' ||
        ['approved', 'passed', 'archived'].includes(target.status)
      ) {
        throw nativeMaterializationFailure('IDEA_RESPONSE_CLOSED')
      }
      const choice = payload.choice
      if (choice == null) {
        await transaction
          .delete(ideaDecision)
          .where(and(eq(ideaDecision.ideaId, ideaId), eq(ideaDecision.userId, input.userId)))
      } else {
        if (choice !== 'love' && choice !== 'maybe' && choice !== 'pass')
          throw nativeMaterializationFailure('IDEA_RESPONSE_INVALID')
        await transaction
          .insert(ideaDecision)
          .values({ ideaId, userId: input.userId, choice })
          .onConflictDoUpdate({
            target: [ideaDecision.ideaId, ideaDecision.userId],
            set: { choice, updatedAt: new Date() },
          })
      }
      break
    }
    case 'participant':
      await materializePerson(transaction, {
        organizationId,
        actorUserId: input.userId,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'event_participation':
      await materializeParticipation(transaction, {
        organizationId,
        actorUserId: input.userId,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'event':
      await materializeChildEvent(transaction, {
        organizationId,
        actorUserId: input.userId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'idea':
      await materializeIdea(transaction, {
        organizationId,
        actorUserId: input.userId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'expense':
      await materializeExpense(transaction, {
        organizationId,
        actorUserId: input.userId,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'registry_item':
      await materializeRegistryItem(transaction, {
        organizationId,
        actorUserId: input.userId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'note':
      await materializeNote(transaction, {
        organizationId,
        actorUserId: input.userId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'todo':
      await materializeTodo(transaction, {
        userId: input.userId,
        organizationId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
        operation: mutation.operation,
        payload,
      })
      break
    case 'moment':
      await materializeMoment(transaction, {
        organizationId,
        scopeId: mutation.scopeID,
        entityId: mutation.entityID,
        payload,
      })
      break
    case 'attendance':
      // Current clients include attendance in EventParticipation. This type is
      // reserved for a future smaller RSVP mutation and intentionally does not
      // create a second canonical representation.
      break
  }

  return { organizationId }
}

async function materializeWorkspace(
  transaction: NativeTransaction,
  input: {
    userId: string
    scopeId: string
    entityId: string
    payload: unknown
    organizationId?: string
  }
) {
  const payload = asRecord(input.payload)
  const mainEventId = requiredUUID(payload.mainEventID, 'WORKSPACE_ID_MISSING')
  if (mainEventId !== input.scopeId || input.entityId !== input.scopeId) {
    throw nativeMaterializationFailure('WORKSPACE_SCOPE_MISMATCH')
  }

  const title = requiredTrimmed(payload.title, 'WORKSPACE_TITLE_MISSING')
  // Existing workspaces, including seeded review fixtures, can have a Better
  // Auth organization ID distinct from their native root-event scope. New
  // iOS-created workspaces retain the legacy scope-as-organization behavior.
  const organizationId = input.organizationId ?? input.scopeId
  const slug = `${slugify(title)}-${input.scopeId.slice(0, 8)}`
  const now = new Date()
  const [existingEvent] = await transaction
    .select({ id: event.id })
    .from(event)
    .where(eq(event.id, mainEventId))
    .limit(1)

  if (existingEvent) {
    const [settings] = await transaction
      .select()
      .from(workspacePlanningSettings)
      .where(eq(workspacePlanningSettings.organizationId, organizationId))
      .limit(1)
    const changesSharing =
      (settings?.collaboratorLinkEnabled ?? true) !==
        (payload.isCollaboratorLinkEnabled !== false) ||
      (settings?.requiresCollaboratorApproval ?? true) !==
        (payload.requiresCollaboratorApproval !== false) ||
      (settings?.defaultCollaboratorPermission ?? 'contribute') !==
        mapPlanningPermission(payload.defaultCollaboratorPermission)
    if (changesSharing) {
      const [actor] = await transaction
        .select({ role: eventParticipant.role, permission: eventParticipant.planningPermission })
        .from(eventParticipant)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(
          and(eq(eventParticipant.eventId, mainEventId), eq(workspacePerson.userId, input.userId))
        )
        .limit(1)
      if (
        !actor ||
        (actor.role !== 'host' && !(actor.role === 'collaborator' && actor.permission === 'manage'))
      ) {
        throw new NativeMaterializationError({
          category: 'authorization',
          code: 'EVENT_PERMISSION_REQUIRED',
          userMessageKey: 'serverErrors.EVENT_PERMISSION_REQUIRED',
        })
      }
    }
  }

  await transaction
    .insert(organization)
    .values({
      id: organizationId,
      name: title,
      slug,
      createdAt: now,
      workspaceType: 'event',
    })
    .onConflictDoUpdate({
      target: organization.id,
      set: { name: title },
    })

  if (!existingEvent)
    await transaction
      .insert(member)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        userId: input.userId,
        role: 'owner',
        createdAt: now,
      })
      .onConflictDoNothing({ target: [member.organizationId, member.userId] })

  const location = optionalRecord(payload.mainEventLocation)
  const start = nativeDate(payload.mainEventStartsAt, 'WORKSPACE_START_MISSING')
  const end = optionalNativeDate(payload.mainEventEndsAt)
  const timeZone = optionalTrimmed(payload.mainEventTimeZoneIdentifier) ?? 'UTC'
  const planningMode = mapValue(
    payload.planningMode,
    {
      openToIdeas: 'open_to_ideas',
      helpMeDecide: 'help_me_decide',
      quietPlanning: 'quiet_planning',
      decisionMade: 'decision_made',
    } as const,
    'open_to_ideas'
  )
  const status = mapValue(
    payload.mainEventStatus,
    {
      draft: 'draft',
      ongoing: 'ongoing',
      finished: 'finished',
      cancelled: 'cancelled',
    } as const,
    'draft'
  )

  await transaction
    .insert(event)
    .values({
      id: mainEventId,
      organizationId,
      parentEventId: null,
      title,
      description: optionalTrimmed(payload.eventMessage),
      dressCode: optionalTrimmed(payload.dressCode),
      status,
      planningStatus: null,
      completionStatus: status === 'finished' ? 'complete' : 'upcoming',
      schedulingState: 'scheduled',
      category: null,
      purpose: null,
      planningMode,
      startsAt: start,
      endsAt: end,
      isAllDay: payload.mainEventIsAllDay === true,
      timeZone,
      ...locationColumns(location),
      budgetCap: optionalDecimal(payload.mainEventBudgetCap),
      createdByUserId: input.userId,
    })
    .onConflictDoUpdate({
      target: event.id,
      set: {
        title,
        description: optionalTrimmed(payload.eventMessage),
        dressCode: optionalTrimmed(payload.dressCode),
        status,
        completionStatus: status === 'finished' ? 'complete' : 'upcoming',
        planningMode,
        startsAt: start,
        endsAt: end,
        isAllDay: payload.mainEventIsAllDay === true,
        timeZone,
        ...locationColumns(location),
        budgetCap: optionalDecimal(payload.mainEventBudgetCap),
        updatedAt: now,
      },
    })

  await transaction
    .insert(workspacePlanningSettings)
    .values({
      organizationId,
      budgetCap: optionalDecimal(payload.workspaceBudgetCap),
      currencyCode: optionalTrimmed(payload.currencyCode)?.toUpperCase() ?? 'USD',
      registryShared: payload.isRegistryShared === true,
      collaboratorLinkEnabled: payload.isCollaboratorLinkEnabled !== false,
      requiresCollaboratorApproval: payload.requiresCollaboratorApproval !== false,
      defaultCollaboratorPermission: mapPlanningPermission(payload.defaultCollaboratorPermission),
    })

    .onConflictDoUpdate({
      target: workspacePlanningSettings.organizationId,
      set: {
        budgetCap: optionalDecimal(payload.workspaceBudgetCap),
        currencyCode: optionalTrimmed(payload.currencyCode)?.toUpperCase() ?? 'USD',
        registryShared: payload.isRegistryShared === true,
        collaboratorLinkEnabled: payload.isCollaboratorLinkEnabled !== false,
        requiresCollaboratorApproval: payload.requiresCollaboratorApproval !== false,
        defaultCollaboratorPermission: mapPlanningPermission(payload.defaultCollaboratorPermission),
        updatedAt: now,
      },
    })

  await materializeEventCover(transaction, {
    organizationId,
    eventId: mainEventId,
    mediaAssetId: optionalUUID(payload.mainEventMediaAssetID),
  })

  // A workspace edit changes event details, never the editor's identity or
  // access. Participants/RSVPs have their own independently versioned records.
  if (existingEvent) return { organizationId }

  const people = Array.isArray(payload.members) ? payload.members.map(asRecord) : []
  const ownerPayload =
    people.find((person) => person.userID === input.userId) ??
    people.find((person) => person.participantRole === 'host') ??
    people[0]

  if (ownerPayload) {
    const personId = requiredUUID(ownerPayload.id, 'OWNER_PERSON_ID_MISSING')
    const [account] = await transaction
      .select({ name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1)
    if (!account) throw nativeMaterializationFailure('OWNER_ACCOUNT_MISSING')

    await transaction
      .insert(workspacePerson)
      .values({
        id: personId,
        organizationId,
        userId: input.userId,
        displayName: optionalTrimmed(ownerPayload.name) ?? account.name ?? 'Host',
        email: optionalTrimmed(ownerPayload.email)?.toLowerCase() ?? account.email,
        avatarUrl: account.image,
      })
      .onConflictDoUpdate({
        target: workspacePerson.id,
        set: {
          userId: input.userId,
          displayName: optionalTrimmed(ownerPayload.name) ?? account.name ?? 'Host',
          email: optionalTrimmed(ownerPayload.email)?.toLowerCase() ?? account.email,
          avatarUrl: account.image,
          updatedAt: now,
        },
      })

    const participations = Array.isArray(payload.eventParticipations)
      ? payload.eventParticipations.map(asRecord)
      : []
    const ownerParticipation = participations.find(
      (participation) =>
        optionalUUID(participation.eventID) === mainEventId &&
        optionalUUID(participation.memberID) === personId
    )
    const participationId = ownerParticipation
      ? requiredUUID(ownerParticipation.id, 'OWNER_PARTICIPATION_ID_MISSING')
      : personId

    await transaction
      .insert(eventParticipant)
      .values({
        id: participationId,
        eventId: mainEventId,
        personId,
        role: 'host',
        planningPermission: 'manage',
        attendanceStatus: mapAttendance(
          ownerParticipation?.attendance ?? payload.mainEventResponse
        ),
      })
      .onConflictDoUpdate({
        target: [eventParticipant.eventId, eventParticipant.personId],
        set: {
          role: 'host',
          planningPermission: 'manage',
          attendanceStatus: mapAttendance(
            ownerParticipation?.attendance ?? payload.mainEventResponse
          ),
          updatedAt: now,
        },
      })
  }

  return { organizationId }
}

async function materializePerson(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  await assertScopedPerson(transaction, input.organizationId, input.entityId)

  const requestedUserId = optionalTrimmed(input.payload.userID)
  const userId = requestedUserId === input.actorUserId ? requestedUserId : null
  const displayName =
    optionalTrimmed(input.payload.name) ?? optionalTrimmed(input.payload.initials) ?? 'Guest'

  await transaction
    .insert(workspacePerson)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      userId,
      displayName,
      email: optionalTrimmed(input.payload.email)?.toLowerCase(),
    })
    .onConflictDoUpdate({
      target: workspacePerson.id,
      set: {
        // Never unlink a person merely because an older iOS payload predates
        // account linking.
        userId: sql`coalesce(${workspacePerson.userId}, ${userId})`,
        displayName,
        email: optionalTrimmed(input.payload.email)?.toLowerCase(),
        updatedAt: new Date(),
      },
    })
}

async function materializeParticipation(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  const eventId = requiredUUID(input.payload.eventID, 'PARTICIPATION_EVENT_MISSING')
  const personId = requiredUUID(input.payload.memberID, 'PARTICIPATION_PERSON_MISSING')
  await assertScopedEvent(transaction, input.organizationId, eventId)
  await requireScopedPerson(transaction, input.organizationId, personId)

  const [departed] = await transaction
    .select({ id: eventDeparture.eventId })
    .from(eventDeparture)
    .innerJoin(workspacePerson, eq(workspacePerson.userId, eventDeparture.userId))
    .where(and(eq(eventDeparture.eventId, eventId), eq(workspacePerson.id, personId)))
    .limit(1)
  if (departed) return // A stale phone must not undo a guest's personal departure.

  const role = mapRole(input.payload.role)
  const planningPermission = mapPlanningPermission(input.payload.planningPermission, role)
  await transaction
    .insert(eventParticipant)
    .values({
      id: input.entityId,
      eventId,
      personId,
      role,
      planningPermission,
      attendanceStatus: mapAttendance(input.payload.attendance),
      createdAt: optionalNativeDate(input.payload.createdAt) ?? new Date(),
      updatedAt: optionalNativeDate(input.payload.updatedAt) ?? new Date(),
    })
    .onConflictDoUpdate({
      target: [eventParticipant.eventId, eventParticipant.personId],
      set: {
        id: input.entityId,
        role,
        planningPermission,
        attendanceStatus: mapAttendance(input.payload.attendance),
        updatedAt: optionalNativeDate(input.payload.updatedAt) ?? new Date(),
      },
    })

  if (input.payload.invitationStatus === 'invited') {
    const [person] = await transaction
      .select({ email: workspacePerson.email })
      .from(workspacePerson)
      .where(eq(workspacePerson.id, personId))
      .limit(1)
    if (person?.email) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14)
      await transaction
        .insert(eventInvitation)
        .values({
          eventId,
          personId,
          email: person.email,
          role,
          planningPermission,
          invitedByUserId: input.actorUserId,
          expiresAt,
        })
        .onConflictDoNothing()
    }
  }
}

async function materializeChildEvent(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    scopeId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  await assertScopedEvent(transaction, input.organizationId, input.entityId)

  const parentEventId = optionalUUID(input.payload.parentEventID) ?? input.scopeId
  if (parentEventId !== input.scopeId) {
    throw nativeMaterializationFailure('EVENT_DEPTH_EXCEEDED')
  }
  await requireScopedEvent(transaction, input.organizationId, parentEventId)

  const schedulingState =
    input.payload.schedulingState === 'unscheduled' ? 'unscheduled' : 'scheduled'
  const startsAt =
    schedulingState === 'scheduled'
      ? nativeDate(input.payload.scheduledAt, 'EVENT_START_MISSING')
      : null
  const location = optionalRecord(input.payload.eventLocation)
  const category = mapEventCategory(input.payload.category)
  const planningStatus = mapEventPlanningStatus(input.payload.status)

  await transaction
    .insert(event)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      parentEventId,
      title: requiredTrimmed(input.payload.title, 'EVENT_TITLE_MISSING'),
      description: optionalTrimmed(input.payload.eventDescription),
      dressCode: optionalTrimmed(input.payload.dressCode),
      status: null,
      planningStatus,
      completionStatus: input.payload.completionStatus === 'complete' ? 'complete' : 'upcoming',
      schedulingState,
      category,
      purpose: input.payload.purpose === 'eventExperience' ? 'part_of_event' : 'planning_scouting',
      startsAt,
      endsAt: schedulingState === 'scheduled' ? optionalNativeDate(input.payload.endsAt) : null,
      isAllDay: input.payload.isAllDay === true,
      timeZone: optionalTrimmed(input.payload.timeZoneIdentifier) ?? 'UTC',
      ...locationColumns(location),
      budgetCap: optionalDecimal(input.payload.budgetCap),
      createdByUserId: input.actorUserId,
    })
    .onConflictDoUpdate({
      target: event.id,
      set: {
        title: requiredTrimmed(input.payload.title, 'EVENT_TITLE_MISSING'),
        description: optionalTrimmed(input.payload.eventDescription),
        dressCode: optionalTrimmed(input.payload.dressCode),
        planningStatus,
        completionStatus: input.payload.completionStatus === 'complete' ? 'complete' : 'upcoming',
        schedulingState,
        category,
        purpose:
          input.payload.purpose === 'eventExperience' ? 'part_of_event' : 'planning_scouting',
        startsAt,
        endsAt: schedulingState === 'scheduled' ? optionalNativeDate(input.payload.endsAt) : null,
        isAllDay: input.payload.isAllDay === true,
        timeZone: optionalTrimmed(input.payload.timeZoneIdentifier) ?? 'UTC',
        ...locationColumns(location),
        budgetCap: optionalDecimal(input.payload.budgetCap),
        updatedAt: new Date(),
      },
    })

  const sourceIdeaId = optionalUUID(input.payload.linkedIdeaID)
  if (sourceIdeaId) {
    await transaction
      .update(idea)
      .set({ materializedEventId: input.entityId, updatedAt: new Date() })
      .where(and(eq(idea.id, sourceIdeaId), eq(idea.organizationId, input.organizationId)))
  }

  await materializeEventCover(transaction, {
    organizationId: input.organizationId,
    eventId: input.entityId,
    mediaAssetId: optionalUUID(input.payload.mediaAssetID),
  })
}

async function materializeIdea(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    scopeId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  const eventId = optionalUUID(input.payload.eventID) ?? input.scopeId
  await requireScopedEvent(transaction, input.organizationId, eventId)
  const category = mapIdeaCategory(input.payload.category)
  await assertScopedIdea(transaction, input.organizationId, input.entityId)
  const nativeConfiguration = input.payload.configuration ?? { standard: {} }
  const guestVisibility =
    input.payload.invitationVisibility === 'shownToGuests' ||
    (input.payload.invitationVisibility == null && category === 'attire')
      ? 'shown_to_guests'
      : 'planning_only'

  await transaction
    .insert(idea)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      eventId,
      category,
      status: mapIdeaStatus(input.payload.status),
      guestVisibility,
      title: optionalTrimmed(input.payload.title),
      note: optionalTrimmed(input.payload.note),
      estimatedCost: optionalDecimal(input.payload.estimatedCost),
      configuration: { version: 1, native: nativeConfiguration },
      submittedByUserId:
        input.payload.submittedByUserID === input.actorUserId
          ? input.actorUserId
          : input.actorUserId,
      createdAt: optionalNativeDate(input.payload.submittedAt) ?? new Date(),
    })
    .onConflictDoUpdate({
      target: idea.id,
      set: {
        eventId,
        category,
        status: mapIdeaStatus(input.payload.status),
        guestVisibility,
        title: optionalTrimmed(input.payload.title),
        note: optionalTrimmed(input.payload.note),
        estimatedCost: optionalDecimal(input.payload.estimatedCost),
        configuration: { version: 1, native: nativeConfiguration },
        updatedAt: new Date(),
      },
    })

  const eventEntities = await transaction
    .select({ entityId: nativeSyncEntity.entityId, payload: nativeSyncEntity.payload })
    .from(nativeSyncEntity)
    .where(
      and(
        eq(nativeSyncEntity.scopeId, input.scopeId),
        eq(nativeSyncEntity.entityType, 'event'),
        eq(nativeSyncEntity.isDeleted, false)
      )
    )
  for (const entity of eventEntities) {
    const eventPayload = asRecord(decodeNativePayload(entity.payload))
    if (optionalUUID(eventPayload.linkedIdeaID) !== input.entityId) continue
    await transaction
      .update(idea)
      .set({ materializedEventId: entity.entityId, updatedAt: new Date() })
      .where(eq(idea.id, input.entityId))
    break
  }
  await materializeIdeaCover(transaction, {
    organizationId: input.organizationId,
    ideaId: input.entityId,
    mediaAssetId: optionalUUID(input.payload.mediaAssetID),
  })
}

async function materializeExpense(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  await assertScopedExpense(transaction, input.organizationId, input.entityId)
  const eventId = requiredUUID(input.payload.eventID, 'EXPENSE_EVENT_MISSING')
  await requireScopedEvent(transaction, input.organizationId, eventId)

  await transaction
    .insert(eventExpense)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      eventId,
      sourceIdeaId: optionalUUID(input.payload.sourceIdeaID),
      title: requiredTrimmed(input.payload.title, 'EXPENSE_TITLE_MISSING'),
      amount: requiredDecimal(input.payload.amount, 'EXPENSE_AMOUNT_MISSING'),
      category: mapExpenseCategory(input.payload.category),
      status:
        input.payload.status === 'committed' || input.payload.status === 'paid'
          ? input.payload.status
          : 'estimated',
      createdByUserId: input.actorUserId,
      createdAt: optionalNativeDate(input.payload.createdAt) ?? new Date(),
      updatedAt: optionalNativeDate(input.payload.updatedAt) ?? new Date(),
    })
    .onConflictDoUpdate({
      target: eventExpense.id,
      set: {
        eventId,
        sourceIdeaId: optionalUUID(input.payload.sourceIdeaID),
        title: requiredTrimmed(input.payload.title, 'EXPENSE_TITLE_MISSING'),
        amount: requiredDecimal(input.payload.amount, 'EXPENSE_AMOUNT_MISSING'),
        category: mapExpenseCategory(input.payload.category),
        status:
          input.payload.status === 'committed' || input.payload.status === 'paid'
            ? input.payload.status
            : 'estimated',
        updatedAt: optionalNativeDate(input.payload.updatedAt) ?? new Date(),
      },
    })
}

async function materializeRegistryItem(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    scopeId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  await assertScopedRegistryItem(transaction, input.organizationId, input.entityId)
  const eventId = optionalUUID(input.payload.eventID) ?? input.scopeId
  await requireScopedEvent(transaction, input.organizationId, eventId)

  await transaction
    .insert(registryItem)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      eventId,
      sourceIdeaId: optionalUUID(input.payload.sourceIdeaID),
      title: requiredTrimmed(input.payload.title, 'REGISTRY_TITLE_MISSING'),
      note: optionalTrimmed(input.payload.note),
      category: mapRegistryCategory(input.payload.category),
      price: optionalDecimal(input.payload.price),
      quantity: Math.max(1, integer(input.payload.quantity, 1)),
      createdByUserId: input.actorUserId,
    })
    .onConflictDoUpdate({
      target: registryItem.id,
      set: {
        eventId,
        sourceIdeaId: optionalUUID(input.payload.sourceIdeaID),
        title: requiredTrimmed(input.payload.title, 'REGISTRY_TITLE_MISSING'),
        note: optionalTrimmed(input.payload.note),
        category: mapRegistryCategory(input.payload.category),
        price: optionalDecimal(input.payload.price),
        quantity: Math.max(1, integer(input.payload.quantity, 1)),
        updatedAt: new Date(),
      },
    })

  await materializeRegistryCover(transaction, {
    organizationId: input.organizationId,
    registryItemId: input.entityId,
    mediaAssetId: optionalUUID(input.payload.mediaAssetID),
  })
}

async function materializeNote(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    actorUserId: string
    scopeId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  await assertScopedNote(transaction, input.organizationId, input.entityId)
  const eventId = optionalUUID(input.payload.eventID) ?? input.scopeId
  await requireScopedEvent(transaction, input.organizationId, eventId)
  const body = requiredTrimmed(input.payload.body, 'NOTE_BODY_MISSING')
  if (body.length > 750) throw nativeMaterializationFailure('NOTE_TOO_LONG')

  await transaction
    .insert(eventNote)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      eventId,
      authorUserId: input.actorUserId,
      body,
      sentAt: optionalNativeDate(input.payload.sentAt) ?? new Date(),
    })
    .onConflictDoUpdate({
      target: eventNote.id,
      set: { body, eventId, authorUserId: input.actorUserId },
    })
}

async function materializeTodo(
  transaction: NativeTransaction,
  input: {
    userId: string
    organizationId: string
    scopeId: string
    entityId: string
    operation: 'create' | 'update'
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  const eventId = requiredUUID(input.payload.eventID, 'TODO_EVENT_ID_MISSING')
  const [target] = await transaction
    .select({
      id: event.id,
      parentEventId: event.parentEventId,
      planningStatus: event.planningStatus,
      completionStatus: event.completionStatus,
    })
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.organizationId, input.organizationId)))
    .limit(1)
  if (
    !target ||
    (target.id !== input.scopeId && target.parentEventId !== input.scopeId) ||
    ['archived', 'cancelled'].includes(target.planningStatus ?? '') ||
    target.completionStatus === 'complete'
  ) {
    throw nativeMaterializationFailure('TODO_EVENT_SCOPE_MISMATCH')
  }
  await requireTodoPlanner(transaction, {
    userId: input.userId,
    organizationId: input.organizationId,
    eventId,
  })

  const [existing] = await transaction
    .select({
      eventId: eventTodo.eventId,
      createdAt: eventTodo.createdAt,
      websiteUrl: eventTodo.websiteUrl,
      assigneePersonId: eventTodo.assigneePersonId,
    })
    .from(eventTodo)
    .where(
      and(eq(eventTodo.id, input.entityId), eq(eventTodo.organizationId, input.organizationId))
    )
    .limit(1)
  if ((input.operation === 'create' && existing) || (input.operation === 'update' && !existing)) {
    throw nativeMaterializationFailure(
      input.operation === 'create' ? 'TODO_ALREADY_EXISTS' : 'TODO_NOT_FOUND'
    )
  }
  if (existing && existing.eventId !== eventId) {
    throw nativeMaterializationFailure('TODO_EVENT_SCOPE_MISMATCH')
  }

  const websiteUrl =
    input.payload.websiteURL === undefined
      ? (existing?.websiteUrl ?? null)
      : normalizeTodoWebsiteURL(input.payload.websiteURL)
  const assigneePersonId =
    input.payload.assigneePersonID === undefined
      ? (existing?.assigneePersonId ?? null)
      : input.payload.assigneePersonID === null
        ? null
        : requiredUUID(input.payload.assigneePersonID, 'TODO_ASSIGNEE_INVALID')
  if (
    assigneePersonId &&
    assigneePersonId !== (existing?.assigneePersonId ?? null) &&
    !(await isEligibleTodoAssignee(transaction, {
      organizationId: input.organizationId,
      eventId,
      personId: assigneePersonId,
    }))
  ) {
    throw nativeMaterializationFailure('TODO_ASSIGNEE_INELIGIBLE')
  }

  const rawTitle = input.payload.title
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : ''
  if (!title || Array.from(title).length > 200 || title !== rawTitle) {
    throw nativeMaterializationFailure('TODO_TITLE_INVALID')
  }
  const rawDueDate = input.payload.dueDate ?? null
  let dueDate: string | null = null
  if (rawDueDate !== null) {
    if (typeof rawDueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rawDueDate)) {
      throw nativeMaterializationFailure('TODO_DUE_DATE_INVALID')
    }
    if (Number(rawDueDate.slice(0, 4)) < 1) {
      throw nativeMaterializationFailure('TODO_DUE_DATE_INVALID')
    }
    const parsedDueDate = new Date(`${rawDueDate}T00:00:00.000Z`)
    if (
      Number.isNaN(parsedDueDate.valueOf()) ||
      parsedDueDate.toISOString().slice(0, 10) !== rawDueDate
    ) {
      throw nativeMaterializationFailure('TODO_DUE_DATE_INVALID')
    }
    dueDate = rawDueDate
  }
  if (typeof input.payload.isCompleted !== 'boolean') {
    throw nativeMaterializationFailure('TODO_COMPLETION_INVALID')
  }
  if (typeof input.payload.createdAt !== 'number' || !Number.isFinite(input.payload.createdAt)) {
    throw nativeMaterializationFailure('TODO_CREATED_AT_INVALID')
  }
  const createdAt = nativeDate(input.payload.createdAt, 'TODO_CREATED_AT_INVALID')
  if (!Number.isFinite(createdAt.valueOf())) {
    throw nativeMaterializationFailure('TODO_CREATED_AT_INVALID')
  }

  // createdAt defines stable ordering and is immutable after creation. Reject
  // altered payloads so the sync log cannot disagree with canonical storage.
  if (existing && existing.createdAt.getTime() !== createdAt.getTime()) {
    throw nativeMaterializationFailure('TODO_CREATED_AT_IMMUTABLE')
  }

  await transaction
    .insert(eventTodo)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      eventId,
      title,
      dueDate,
      websiteUrl,
      assigneePersonId,
      isCompleted: input.payload.isCompleted,
      createdAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: eventTodo.id,
      set: {
        title,
        dueDate,
        websiteUrl,
        assigneePersonId,
        isCompleted: input.payload.isCompleted,
        updatedAt: new Date(),
      },
    })
}

function normalizeTodoWebsiteURL(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw nativeMaterializationFailure('TODO_WEBSITE_URL_INVALID')
  const trimmed = value.trim()
  if (!trimmed) return null
  if (Array.from(trimmed).length > 2048 || /[\\\s\p{Cc}\p{Cf}]/u.test(trimmed)) {
    throw nativeMaterializationFailure('TODO_WEBSITE_URL_INVALID')
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw nativeMaterializationFailure('TODO_WEBSITE_URL_INVALID')
  }
  const authority = trimmed.match(/^[a-z][a-z\d+.-]*:\/\/([^/?#]*)/i)?.[1]
  if (
    !['http:', 'https:'].includes(parsed.protocol.toLowerCase()) ||
    !authority ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    authority?.includes('@') ||
    Array.from(parsed.toString()).length > 2048
  ) {
    throw nativeMaterializationFailure('TODO_WEBSITE_URL_INVALID')
  }
  return parsed.toString()
}

async function isEligibleTodoAssignee(
  transaction: NativeTransaction,
  input: { organizationId: string; eventId: string; personId: string }
) {
  const [person] = await transaction
    .select({ id: workspacePerson.id })
    .from(workspacePerson)
    .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
    .innerJoin(
      event,
      and(
        eq(event.id, eventParticipant.eventId),
        eq(event.organizationId, workspacePerson.organizationId)
      )
    )
    .leftJoin(
      eventDeparture,
      and(
        eq(eventDeparture.eventId, eventParticipant.eventId),
        eq(eventDeparture.userId, workspacePerson.userId)
      )
    )
    .where(
      and(
        eq(workspacePerson.id, input.personId),
        eq(workspacePerson.organizationId, input.organizationId),
        isNotNull(workspacePerson.userId),
        eq(eventParticipant.eventId, input.eventId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        sql`(${eventParticipant.role} = 'host' or ${eventParticipant.planningPermission} in ('manage', 'contribute'))`,
        isNull(eventDeparture.userId)
      )
    )
    .limit(1)
  return Boolean(person)
}

async function deleteTodo(
  transaction: NativeTransaction,
  input: { userId: string; organizationId: string; scopeId: string; entityId: string }
) {
  const [todo] = await transaction
    .select({ eventId: eventTodo.eventId })
    .from(eventTodo)
    .where(
      and(eq(eventTodo.id, input.entityId), eq(eventTodo.organizationId, input.organizationId))
    )
    .limit(1)
  if (!todo) throw nativeMaterializationFailure('TODO_NOT_FOUND')
  const [target] = await transaction
    .select({
      id: event.id,
      parentEventId: event.parentEventId,
      planningStatus: event.planningStatus,
      completionStatus: event.completionStatus,
    })
    .from(event)
    .where(and(eq(event.id, todo.eventId), eq(event.organizationId, input.organizationId)))
    .limit(1)
  if (
    !target ||
    (target.id !== input.scopeId && target.parentEventId !== input.scopeId) ||
    ['archived', 'cancelled'].includes(target.planningStatus ?? '') ||
    target.completionStatus === 'complete'
  ) {
    throw nativeMaterializationFailure('TODO_EVENT_SCOPE_MISMATCH')
  }
  await requireTodoPlanner(transaction, {
    userId: input.userId,
    organizationId: input.organizationId,
    eventId: todo.eventId,
  })
  await transaction
    .delete(eventTodo)
    .where(
      and(eq(eventTodo.id, input.entityId), eq(eventTodo.organizationId, input.organizationId))
    )
}

async function requireTodoPlanner(
  transaction: NativeTransaction,
  input: { userId: string; organizationId: string; eventId: string }
) {
  const [actor] = await transaction
    .select({
      role: eventParticipant.role,
      planningPermission: eventParticipant.planningPermission,
    })
    .from(eventParticipant)
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .innerJoin(event, eq(event.id, eventParticipant.eventId))
    .where(
      and(
        eq(eventParticipant.eventId, input.eventId),
        eq(workspacePerson.userId, input.userId),
        eq(workspacePerson.organizationId, input.organizationId),
        eq(event.organizationId, input.organizationId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        retainedEventAccess(input.userId, event.id),
        sql`(${eventParticipant.role} = 'host' or ${eventParticipant.planningPermission} in ('manage', 'contribute'))`
      )
    )
    .limit(1)
  if (!actor) throw nativeMaterializationFailure('TODO_EVENT_PERMISSION_REQUIRED')
}

async function materializeMoment(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    scopeId: string
    entityId: string
    payload: Record<string, unknown>
  }
) {
  assertPayloadId(input.entityId, input.payload.id)
  await assertScopedEventMedia(transaction, input.organizationId, input.entityId)
  const mediaAssetId = optionalUUID(input.payload.mediaAssetID)
  if (!mediaAssetId) return
  const eventId = optionalUUID(input.payload.eventID) ?? input.scopeId
  await requireScopedEvent(transaction, input.organizationId, eventId)

  // The R2 upload and its metadata registration can finish after the native
  // moment reaches sync. Leave the placement deferred instead of rejecting the
  // entire workspace mutation; a later moment update will materialize it.
  const [storedAsset] = await transaction
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(
      and(eq(mediaAsset.id, mediaAssetId), eq(mediaAsset.organizationId, input.organizationId))
    )
    .limit(1)
  if (!storedAsset) return

  await transaction
    .insert(eventMedia)
    .values({
      id: input.entityId,
      organizationId: input.organizationId,
      eventId,
      mediaAssetId,
      role: 'gallery',
    })
    .onConflictDoUpdate({
      target: eventMedia.id,
      set: { eventId, mediaAssetId },
    })
}

async function readyMediaAsset(
  transaction: NativeTransaction,
  organizationId: string,
  mediaAssetId: string | null
) {
  if (!mediaAssetId) return null
  const [asset] = await transaction
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(
      and(
        eq(mediaAsset.id, mediaAssetId),
        eq(mediaAsset.organizationId, organizationId),
        eq(mediaAsset.status, 'ready')
      )
    )
    .limit(1)
  return asset?.id ?? null
}

async function materializeEventCover(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    eventId: string
    mediaAssetId: string | null
  }
) {
  const assetId = await readyMediaAsset(transaction, input.organizationId, input.mediaAssetId)
  await transaction
    .delete(eventMedia)
    .where(and(eq(eventMedia.eventId, input.eventId), eq(eventMedia.role, 'cover')))
  if (!assetId) return
  await transaction.insert(eventMedia).values({
    organizationId: input.organizationId,
    eventId: input.eventId,
    mediaAssetId: assetId,
    role: 'cover',
  })
}

async function materializeIdeaCover(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    ideaId: string
    mediaAssetId: string | null
  }
) {
  const assetId = await readyMediaAsset(transaction, input.organizationId, input.mediaAssetId)
  await transaction
    .delete(ideaMedia)
    .where(and(eq(ideaMedia.ideaId, input.ideaId), eq(ideaMedia.role, 'cover')))
  if (!assetId) return
  await transaction.insert(ideaMedia).values({
    organizationId: input.organizationId,
    ideaId: input.ideaId,
    mediaAssetId: assetId,
    role: 'cover',
  })
}

async function materializeRegistryCover(
  transaction: NativeTransaction,
  input: {
    organizationId: string
    registryItemId: string
    mediaAssetId: string | null
  }
) {
  const assetId = await readyMediaAsset(transaction, input.organizationId, input.mediaAssetId)
  await transaction
    .delete(registryItemMedia)
    .where(
      and(
        eq(registryItemMedia.registryItemId, input.registryItemId),
        eq(registryItemMedia.role, 'cover')
      )
    )
  if (!assetId) return
  await transaction.insert(registryItemMedia).values({
    organizationId: input.organizationId,
    registryItemId: input.registryItemId,
    mediaAssetId: assetId,
    role: 'cover',
  })
}

async function deleteCanonicalEntity(
  transaction: NativeTransaction,
  input: { organizationId: string; entityType: string; entityId: string }
) {
  switch (input.entityType) {
    case 'participant':
      await transaction
        .delete(workspacePerson)
        .where(
          and(
            eq(workspacePerson.id, input.entityId),
            eq(workspacePerson.organizationId, input.organizationId)
          )
        )
      break
    case 'event_participation':
      await assertScopedParticipation(transaction, input.organizationId, input.entityId)
      await transaction.delete(eventParticipant).where(eq(eventParticipant.id, input.entityId))
      break
    case 'event':
      await transaction
        .delete(event)
        .where(and(eq(event.id, input.entityId), eq(event.organizationId, input.organizationId)))
      break
    case 'idea':
      await transaction
        .delete(idea)
        .where(and(eq(idea.id, input.entityId), eq(idea.organizationId, input.organizationId)))
      break
    case 'expense':
      await transaction
        .delete(eventExpense)
        .where(
          and(
            eq(eventExpense.id, input.entityId),
            eq(eventExpense.organizationId, input.organizationId)
          )
        )
      break
    case 'registry_item':
      await transaction
        .delete(registryItem)
        .where(
          and(
            eq(registryItem.id, input.entityId),
            eq(registryItem.organizationId, input.organizationId)
          )
        )
      break
    case 'note':
      await transaction
        .delete(eventNote)
        .where(
          and(eq(eventNote.id, input.entityId), eq(eventNote.organizationId, input.organizationId))
        )
      break
    case 'todo':
      await transaction
        .delete(eventTodo)
        .where(
          and(eq(eventTodo.id, input.entityId), eq(eventTodo.organizationId, input.organizationId))
        )
      break
    case 'moment':
      await transaction
        .delete(eventMedia)
        .where(
          and(
            eq(eventMedia.id, input.entityId),
            eq(eventMedia.organizationId, input.organizationId)
          )
        )
      break
  }
}

async function assertScopedEvent(
  transaction: NativeTransaction,
  organizationId: string,
  eventId: string
) {
  const [existing] = await transaction
    .select({ organizationId: event.organizationId })
    .from(event)
    .where(eq(event.id, eventId))
    .limit(1)
  if (existing && existing.organizationId !== organizationId) {
    throw nativeMaterializationFailure('ENTITY_SCOPE_MISMATCH')
  }
}

async function requireScopedEvent(
  transaction: NativeTransaction,
  organizationId: string,
  eventId: string
) {
  const [existing] = await transaction
    .select({ id: event.id })
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
    .limit(1)
  if (!existing) throw nativeMaterializationFailure('EVENT_NOT_MATERIALIZED')
}

async function assertScopedPerson(
  transaction: NativeTransaction,
  organizationId: string,
  personId: string
) {
  const [existing] = await transaction
    .select({ organizationId: workspacePerson.organizationId })
    .from(workspacePerson)
    .where(eq(workspacePerson.id, personId))
    .limit(1)
  if (existing && existing.organizationId !== organizationId) {
    throw nativeMaterializationFailure('ENTITY_SCOPE_MISMATCH')
  }
}

async function requireScopedPerson(
  transaction: NativeTransaction,
  organizationId: string,
  personId: string
) {
  const [existing] = await transaction
    .select({ id: workspacePerson.id })
    .from(workspacePerson)
    .where(
      and(eq(workspacePerson.id, personId), eq(workspacePerson.organizationId, organizationId))
    )
    .limit(1)
  if (!existing) throw nativeMaterializationFailure('PERSON_NOT_MATERIALIZED')
}

async function assertScopedIdea(
  transaction: NativeTransaction,
  organizationId: string,
  id: string
) {
  const [existing] = await transaction
    .select({ organizationId: idea.organizationId })
    .from(idea)
    .where(eq(idea.id, id))
    .limit(1)
  assertOrganization(existing?.organizationId, organizationId)
}

async function assertScopedExpense(
  transaction: NativeTransaction,
  organizationId: string,
  id: string
) {
  const [existing] = await transaction
    .select({ organizationId: eventExpense.organizationId })
    .from(eventExpense)
    .where(eq(eventExpense.id, id))
    .limit(1)
  assertOrganization(existing?.organizationId, organizationId)
}

async function assertScopedRegistryItem(
  transaction: NativeTransaction,
  organizationId: string,
  id: string
) {
  const [existing] = await transaction
    .select({ organizationId: registryItem.organizationId })
    .from(registryItem)
    .where(eq(registryItem.id, id))
    .limit(1)
  assertOrganization(existing?.organizationId, organizationId)
}

async function assertScopedNote(
  transaction: NativeTransaction,
  organizationId: string,
  id: string
) {
  const [existing] = await transaction
    .select({ organizationId: eventNote.organizationId })
    .from(eventNote)
    .where(eq(eventNote.id, id))
    .limit(1)
  assertOrganization(existing?.organizationId, organizationId)
}

async function assertScopedEventMedia(
  transaction: NativeTransaction,
  organizationId: string,
  id: string
) {
  const [existing] = await transaction
    .select({ organizationId: eventMedia.organizationId })
    .from(eventMedia)
    .where(eq(eventMedia.id, id))
    .limit(1)
  assertOrganization(existing?.organizationId, organizationId)
}

async function assertScopedParticipation(
  transaction: NativeTransaction,
  organizationId: string,
  id: string
) {
  const [existing] = await transaction
    .select({ organizationId: event.organizationId })
    .from(eventParticipant)
    .innerJoin(event, eq(event.id, eventParticipant.eventId))
    .where(eq(eventParticipant.id, id))
    .limit(1)
  if (existing && existing.organizationId !== organizationId) {
    throw nativeMaterializationFailure('ENTITY_SCOPE_MISMATCH')
  }
}

function assertOrganization(
  existingOrganizationId: string | undefined,
  expectedOrganizationId: string
) {
  if (existingOrganizationId && existingOrganizationId !== expectedOrganizationId) {
    throw nativeMaterializationFailure('ENTITY_SCOPE_MISMATCH')
  }
}

function decodeNativePayload(payload: string): unknown {
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  } catch {
    throw nativeMaterializationFailure('INVALID_ENTITY_PAYLOAD')
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw nativeMaterializationFailure('INVALID_ENTITY_PAYLOAD')
  }
  return value as Record<string, unknown>
}

function optionalRecord(value: unknown) {
  if (value == null) return null
  return asRecord(value)
}

function requiredString(value: unknown, code: string) {
  if (typeof value !== 'string' || !value) {
    throw nativeMaterializationFailure(code)
  }
  return value
}

function optionalTrimmed(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function requiredTrimmed(value: unknown, code: string) {
  const result = optionalTrimmed(value)
  if (!result) throw nativeMaterializationFailure(code)
  return result
}

function requiredUUID(value: unknown, code: string) {
  const result = optionalUUID(value)
  if (!result) throw nativeMaterializationFailure(code)
  return result
}

function optionalUUID(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    return null
  }
  return value.toLowerCase()
}

function assertPayloadId(entityId: string, payloadId: unknown) {
  if (requiredUUID(payloadId, 'ENTITY_ID_MISSING') !== entityId) {
    throw nativeMaterializationFailure('ENTITY_ID_MISMATCH')
  }
}

function nativeDate(value: unknown, code: string) {
  const date = optionalNativeDate(value)
  if (!date) throw nativeMaterializationFailure(code)
  return date
}

function optionalNativeDate(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date((value + appleReferenceDateOffsetSeconds) * 1_000)
  }
  if (typeof value === 'string') {
    const date = new Date(value)
    return Number.isNaN(date.valueOf()) ? null : date
  }
  return null
}

function optionalDecimal(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const normalized = String(value).replaceAll(',', '')
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null
  return normalized
}

function requiredDecimal(value: unknown, code: string) {
  const result = optionalDecimal(value)
  if (result == null) throw nativeMaterializationFailure(code)
  return result
}

function integer(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback
}

function locationColumns(location: Record<string, unknown> | null) {
  if (!location) {
    return {
      locationName: null,
      locationAddress: null,
      locationAddressLine2: null,
      locationLatitude: null,
      locationLongitude: null,
      mapItemIdentifier: null,
    }
  }
  const latitude = typeof location.latitude === 'number' ? location.latitude : null
  const longitude = typeof location.longitude === 'number' ? location.longitude : null
  return {
    locationName:
      optionalTrimmed(location.locationName) ??
      optionalTrimmed(location.placeName) ??
      optionalTrimmed(location.shortAddress),
    locationAddress: optionalTrimmed(location.address),
    locationAddressLine2: optionalTrimmed(location.addressLine2),
    locationLatitude: latitude != null && longitude != null ? latitude : null,
    locationLongitude: latitude != null && longitude != null ? longitude : null,
    mapItemIdentifier: optionalTrimmed(location.mapItemIdentifier),
  }
}

function mapValue<Output extends string>(
  value: unknown,
  mapping: Record<string, Output>,
  fallback: Output
) {
  return typeof value === 'string' && value in mapping ? mapping[value]! : fallback
}

function mapRole(value: unknown) {
  return value === 'host' || value === 'collaborator' || value === 'guest' ? value : 'guest'
}

function mapPlanningPermission(value: unknown, role?: string) {
  if (role === 'host') return 'manage' as const
  if (role === 'guest') return 'view_only' as const
  return mapValue(
    value,
    {
      manage: 'manage',
      contribute: 'contribute',
      viewOnly: 'view_only',
      view_only: 'view_only',
    } as const,
    'contribute'
  )
}

function mapAttendance(value: unknown) {
  return mapValue(
    value,
    {
      invited: 'pending',
      pending: 'pending',
      going: 'going',
      maybe: 'not_sure',
      notSure: 'not_sure',
      not_sure: 'not_sure',
      declined: 'not_going',
      notGoing: 'not_going',
      not_going: 'not_going',
    } as const,
    'pending'
  )
}

function mapEventCategory(value: unknown) {
  return mapValue(
    value,
    {
      venue: 'venue',
      foodTasting: 'food_tasting',
      food_tasting: 'food_tasting',
      photography: 'photography',
      honeymoon: 'honeymoon',
      attireFitting: 'attire_fitting',
      attire_fitting: 'attire_fitting',
      weddingShower: 'wedding_shower',
      wedding_shower: 'wedding_shower',
      bachelorBachelorette: 'bachelor_bachelorette',
      bachelor_bachelorette: 'bachelor_bachelorette',
      rehearsal: 'rehearsal',
      ceremony: 'ceremony',
      reception: 'reception',
      other: 'other',
    } as const,
    'other'
  )
}

function mapEventPlanningStatus(value: unknown) {
  return mapValue(
    value,
    {
      draft: 'draft',
      approved: 'approved',
      notSure: 'not_sure',
      not_sure: 'not_sure',
      rejected: 'rejected',
      archived: 'archived',
      cancelled: 'cancelled',
    } as const,
    'draft'
  )
}

function mapIdeaCategory(value: unknown) {
  return mapValue(
    value,
    {
      event: 'event',
      registry: 'registry',
      link: 'link',
      venue: 'venue',
      attire: 'attire',
      flowers: 'flowers',
      food: 'food',
      photography: 'photography',
      music: 'music',
      decor: 'decor',
      invitations: 'invitations',
      honeymoon: 'honeymoon',
      other: 'other',
    } as const,
    'other'
  )
}

function mapIdeaStatus(value: unknown) {
  return mapValue(
    value,
    {
      new: 'new',
      maybe: 'maybe',
      shortlisted: 'shortlisted',
      chosen: 'approved',
      approved: 'approved',
      passed: 'passed',
      archived: 'archived',
    } as const,
    'new'
  )
}

function mapExpenseCategory(value: unknown) {
  return mapValue(
    value,
    {
      venue: 'venue',
      foodAndDrink: 'food_and_drink',
      food_and_drink: 'food_and_drink',
      attire: 'attire',
      decor: 'decor',
      entertainment: 'entertainment',
      photography: 'photography',
      stationery: 'stationery',
      travel: 'travel',
      gifts: 'gifts',
      other: 'other',
    } as const,
    'other'
  )
}

function mapRegistryCategory(value: unknown) {
  return mapValue(
    value,
    {
      home: 'home',
      kitchen: 'kitchen',
      travel: 'travel',
      experience: 'experience',
      cashFund: 'cash_fund',
      cash_fund: 'cash_fund',
    } as const,
    'home'
  )
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-|-$/g, '')
      .slice(0, 64) || 'workspace'
  )
}
