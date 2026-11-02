import { createHash } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import type { db } from '@/db'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { idea, eventNote, eventTodo } from '@/db/schema/planning.schema'
import { nativeSyncChange, nativeSyncEntity } from '@/db/schema/sync.schema'
import {
  hasEventPermission,
  planningPermissionFromDatabase,
  type EventPermissions,
} from '@/lib/permissions'
import { retainedEventAccess } from '@/server/events/repos/event-departure.persistence'
import type { NativeMutation } from '../contracts/native-sync.contracts'
import { NativeMaterializationError } from './native-materializer.persistence'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
function denied(code = 'EVENT_PERMISSION_REQUIRED'): never {
  throw new NativeMaterializationError({
    category: 'authorization',
    code,
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
}
function payloadOf(mutation: NativeMutation): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(Buffer.from(mutation.payload, 'base64').toString())
    if (value && typeof value === 'object' && !Array.isArray(value))
      return value as Record<string, unknown>
  } catch {
    /* The stable failure below avoids exposing input. */
  }
  return denied('INVALID_NATIVE_PAYLOAD')
}
const uuid = (value: unknown) =>
  typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value) ? value.toLowerCase() : null

async function participant(tx: Transaction, userId: string, eventId: string) {
  const [row] = await tx
    .select({
      personId: workspacePerson.id,
      role: eventParticipant.role,
      permission: eventParticipant.planningPermission,
      status: event.status,
      planningStatus: event.planningStatus,
      completionStatus: event.completionStatus,
    })
    .from(event)
    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.id, eventParticipant.personId),
        eq(workspacePerson.organizationId, event.organizationId)
      )
    )
    .where(
      and(
        eq(event.id, eventId),
        eq(workspacePerson.userId, userId),
        retainedEventAccess(userId, event.id)
      )
    )
    .limit(1)
  return row ?? null
}

function authorize(actor: Awaited<ReturnType<typeof participant>>, permissions: EventPermissions) {
  if (!actor) denied()
  if (
    ['finished', 'cancelled'].includes(actor.status ?? '') ||
    ['archived', 'cancelled'].includes(actor.planningStatus ?? '') ||
    actor.completionStatus === 'complete'
  )
    denied('EVENT_CLOSED')
  if (
    !hasEventPermission(
      { role: actor.role, planningPermission: planningPermissionFromDatabase(actor.permission) },
      permissions
    )
  )
    denied()
}

/** Runs under the native root lock, before either replaying a receipt or writing. */
export async function assertMcpRootMutationAccess(
  tx: Transaction,
  input: { userId: string; mutation: NativeMutation; fingerprint: string | null }
) {
  if (!input.fingerprint) return
  const { mutation, userId } = input
  if (mutation.entityType === 'workspace' && mutation.operation === 'create') return
  if (
    !['create', 'update'].includes(mutation.operation) ||
    !['workspace', 'event', 'idea', 'note', 'todo'].includes(mutation.entityType)
  )
    denied()
  const payload = payloadOf(mutation)
  if (mutation.entityType !== 'workspace' && uuid(payload.id) !== mutation.entityID)
    denied('INVALID_NATIVE_PAYLOAD')
  const rootActor = await participant(tx, userId, mutation.scopeID)
  const [root] = await tx
    .select()
    .from(event)
    .where(and(eq(event.id, mutation.scopeID), isNull(event.parentEventId)))
    .limit(1)
  if (!root) denied()
  if (mutation.entityType === 'workspace') {
    if (mutation.operation !== 'update') denied()
    authorize(rootActor, { event: ['update'] })
    return
  }
  if (mutation.entityType === 'event') {
    if (
      uuid(payload.parentEventID) !== root.id ||
      mutation.entityID === root.id ||
      payload.linkedIdeaID != null
    )
      denied('EVENT_SCOPE_FORBIDDEN')
    authorize(rootActor, { event: [mutation.operation === 'create' ? 'create_child' : 'update'] })
    const [child] = await tx.select().from(event).where(eq(event.id, mutation.entityID)).limit(1)
    if (child && (child.organizationId !== root.organizationId || child.parentEventId !== root.id))
      denied('EVENT_SCOPE_FORBIDDEN')
    if (!child && mutation.operation === 'update') denied('EVENT_NOT_FOUND')
    if (
      child &&
      (['archived', 'cancelled'].includes(child.planningStatus ?? '') ||
        child.completionStatus === 'complete')
    )
      denied('EVENT_CLOSED')
    return
  }
  const targetId = uuid(payload.eventID) ?? root.id
  const [target] = await tx.select().from(event).where(eq(event.id, targetId)).limit(1)
  if (
    !target ||
    target.organizationId !== root.organizationId ||
    (target.id !== root.id && target.parentEventId !== root.id)
  )
    denied('EVENT_SCOPE_FORBIDDEN')
  const permissions: EventPermissions =
    mutation.entityType === 'idea'
      ? { idea: [mutation.operation === 'create' ? 'create' : 'update'] }
      : mutation.entityType === 'note'
        ? { note: ['send'] }
        : { todo: [mutation.operation === 'create' ? 'create' : 'update'] }
  authorize(
    target.id === root.id ? rootActor : await participant(tx, userId, target.id),
    permissions
  )
  const table =
    mutation.entityType === 'idea' ? idea : mutation.entityType === 'note' ? eventNote : eventTodo
  const [existing] = await tx
    .select({ eventId: table.eventId })
    .from(table)
    .where(eq(table.id, mutation.entityID))
    .limit(1)
  if (existing && existing.eventId !== target.id) denied('EVENT_SCOPE_FORBIDDEN')
  if (!existing && mutation.operation === 'update') denied('ENTITY_NOT_FOUND')
  if (mutation.entityType === 'note' && existing) {
    const [note] = await tx
      .select({ author: eventNote.authorUserId })
      .from(eventNote)
      .where(eq(eventNote.id, mutation.entityID))
      .limit(1)
    if (note?.author !== userId) denied()
  }
}

/** A newly created child includes its creator only; other parent attendees are never copied. */
export async function completeMcpChildCreation(
  tx: Transaction,
  input: { userId: string; mutation: NativeMutation; organizationId: string }
) {
  const actor = await participant(tx, input.userId, input.mutation.scopeID)
  if (!actor) denied()
  const bytes = createHash('sha256')
    .update(`mcp-child-host:${input.mutation.entityID}:${input.userId}`)
    .digest('hex')
    .slice(0, 32)
  const id = `${bytes.slice(0, 8)}-${bytes.slice(8, 12)}-5${bytes.slice(13, 16)}-a${bytes.slice(17, 20)}-${bytes.slice(20)}`
  await tx
    .insert(eventParticipant)
    .values({
      id,
      eventId: input.mutation.entityID,
      personId: actor.personId,
      role: 'host',
      planningPermission: 'manage',
      attendanceStatus: 'going',
    })
    .onConflictDoNothing({ target: [eventParticipant.eventId, eventParticipant.personId] })
  const nativeNow = Date.now() / 1000 - Date.UTC(2001, 0, 1) / 1000
  const participation = Buffer.from(
    JSON.stringify({
      id,
      eventID: input.mutation.entityID,
      memberID: actor.personId,
      role: 'host',
      planningPermission: 'manage',
      attendance: 'going',
      invitationStatus: 'active',
      createdAt: nativeNow,
      updatedAt: nativeNow,
    })
  ).toString('base64')
  await tx.insert(nativeSyncEntity).values({
    scopeId: input.mutation.scopeID,
    entityType: 'event_participation',
    entityId: id,
    ownerUserId: input.userId,
    payload: participation,
    serverVersion: 1,
    isDeleted: false,
  })
  await tx.insert(nativeSyncChange).values({
    scopeId: input.mutation.scopeID,
    entityType: 'event_participation',
    entityId: id,
    ownerUserId: input.userId,
    operation: 'create',
    payload: participation,
    serverVersion: 1,
  })
  return Buffer.from(
    JSON.stringify({ ...payloadOf(input.mutation), participantIDs: [actor.personId] })
  ).toString('base64')
}
