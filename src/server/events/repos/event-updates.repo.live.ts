import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { db } from '@/db'
import { event } from '@/db/schema/event.schema'
import { eventNote, eventTodo } from '@/db/schema/planning.schema'
import { nativeSyncEntity, nativeWorkspaceSnapshot } from '@/db/schema/sync.schema'
import {
  ConflictError,
  EntityNotFoundError,
  ForbiddenError,
  isDomainError,
  PersistenceError,
  type DomainError,
} from '@/lib/domain-errors'
import type {
  NativeMutation,
  NativePushResult,
} from '@/server/sync/contracts/native-sync.contracts'
import {
  applyNativeMutations,
  applyNativeWorkspaceDetailsCommand,
} from '@/server/sync/repos/native-sync-legacy.persistence'
import { EventUpdatesRepo } from './event-updates.repo'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const decode = (payload: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid archive')
  return value as Record<string, unknown>
}
const fingerprint = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
function stableUUID(seed: string) {
  const bytes = createHash('sha256').update(seed).digest().subarray(0, 16)
  bytes[6] = (bytes[6]! & 0x0f) | 0x50
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
const pack = (payload: Record<string, unknown>) => encode(payload)
function canonicalLocation(input: {
  locationName: string | null
  locationAddress: string | null
  locationAddressLine2: string | null
  locationLatitude: number | null
  locationLongitude: number | null
  mapItemIdentifier: string | null
}) {
  return {
    locationName: input.locationName ?? '',
    address: input.locationAddress ?? '',
    addressLine2: input.locationAddressLine2 ?? '',
    shortAddress: '',
    placeName: '',
    latitude: input.locationLatitude,
    longitude: input.locationLongitude,
    mapItemIdentifier: input.mapItemIdentifier,
  }
}
function requiredNativeLocationStrings(location: Record<string, unknown>) {
  const asString = (value: unknown) => (typeof value === 'string' ? value : '')
  return {
    ...location,
    address: asString(location.address),
    shortAddress: asString(location.shortAddress),
    placeName: asString(location.placeName),
    locationName: asString(location.locationName),
    addressLine2: asString(location.addressLine2),
  }
}

function mutation(input: {
  id: string
  scopeID: string
  entityType: NativeMutation['entityType']
  entityID: string
  operation: NativeMutation['operation']
  payload: Record<string, unknown>
  baseVersion: number
}) {
  return {
    id: input.id,
    scopeID: input.scopeID,
    payloadSchemaVersion: 1 as const,
    entityType: input.entityType,
    entityID: input.entityID,
    operation: input.operation,
    payload: pack(input.payload),
    baseVersion: input.baseVersion,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
  } satisfies NativeMutation
}

function rejected(result: NativePushResult): DomainError {
  if (result.disposition === 'conflict' || result.failureCode === 'MCP_IDEMPOTENCY_KEY_REUSED') {
    return new ConflictError({
      category: 'conflict',
      code: result.failureCode ?? 'SERVER_VERSION_CONFLICT',
      userMessageKey: 'serverErrors.CONFLICT',
      messageParams:
        result.serverVersion == null ? undefined : { currentVersion: result.serverVersion },
    })
  }
  if (result.failureCode?.endsWith('_NOT_FOUND')) {
    return new EntityNotFoundError({
      category: 'not_found',
      code: result.failureCode,
      userMessageKey: 'serverErrors.NOT_FOUND',
    })
  }
  if (
    result.failureCode?.includes('FORBIDDEN') ||
    result.failureCode?.includes('PERMISSION') ||
    result.failureCode === 'EVENT_CLOSED' ||
    result.failureCode === 'SCOPE_READ_ONLY'
  ) {
    return new ForbiddenError({
      category: 'authorization',
      code: result.failureCode,
      userMessageKey: 'serverErrors.AUTHORIZATION',
    })
  }
  return new ConflictError({
    category: 'conflict',
    code: result.failureCode ?? 'EVENT_UPDATE_REJECTED',
    userMessageKey: 'serverErrors.CONFLICT',
  })
}

function persist<A>(code: string, operation: () => Promise<A>) {
  return Effect.tryPromise({
    try: operation,
    catch: (cause) =>
      isDomainError(cause)
        ? cause
        : new PersistenceError({
            category: 'system',
            code,
            userMessageKey: 'serverErrors.SYSTEM',
            cause,
          }),
  })
}

function apply(userId: string, write: NativeMutation, requestFingerprint: string) {
  return applyNativeMutations({
    userId,
    mutations: [write],
    requestFingerprints: { [write.id]: requestFingerprint },
    supportsTodos: true,
    supportsBudgetAtomic: true,
    supportsBlueprintGuides: true,
  }).then(({ results }) => {
    const result = results[0]
    if (!result)
      throw new PersistenceError({
        category: 'system',
        code: 'EVENT_UPDATE_RESULT_MISSING',
        userMessageKey: 'serverErrors.SYSTEM',
      })
    if (result.disposition === 'rejected' || result.disposition === 'conflict')
      throw rejected(result)
    return result
  })
}

// Native sync/materialization remains a Promise transaction engine behind its
// Effect repository port. This adapter calls that same engine so browser writes
// preserve native ordering, canonical materialization, and replay receipts.
export const EventUpdatesRepoLive = Layer.succeed(EventUpdatesRepo, {
  completeTodo: (input) => {
    const operationFingerprint = fingerprint({
      kind: 'todo.complete',
      eventId: input.eventId,
      todoId: input.todoId,
      isCompleted: input.isCompleted,
      expectedVersion: input.expectedVersion,
    })
    const mutationId = stableUUID(`browser-event-write:${operationFingerprint}`)
    return persist('EVENT_TODO_WRITE_FAILED', async () => {
      const [targetEvent] = await db
        .select({ parentId: event.parentEventId })
        .from(event)
        .where(eq(event.id, input.eventId))
        .limit(1)
      if (!targetEvent)
        throw new EntityNotFoundError({ category: 'not_found', code: 'EVENT_NOT_FOUND' })
      const scopeId = targetEvent.parentId ?? input.eventId
      const [entity] = await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, scopeId),
            eq(nativeSyncEntity.entityType, 'todo'),
            eq(nativeSyncEntity.entityId, input.todoId),
            eq(nativeSyncEntity.isDeleted, false)
          )
        )
        .limit(1)
      if (!entity || entity.serverVersion !== input.expectedVersion)
        throw new ConflictError({
          category: 'conflict',
          code: 'SERVER_VERSION_CONFLICT',
          userMessageKey: 'serverErrors.CONFLICT',
          messageParams: entity ? { currentVersion: entity.serverVersion } : undefined,
        })
      const payload = decode(entity.payload)
      if (payload.eventID !== input.eventId)
        throw new EntityNotFoundError({ category: 'not_found', code: 'TODO_NOT_FOUND' })
      payload.isCompleted = input.isCompleted
      const nativeResult = await apply(
        input.userId,
        mutation({
          id: mutationId,
          scopeID: input.eventId,
          entityType: 'todo',
          entityID: input.todoId,
          operation: 'update',
          payload,
          baseVersion: input.expectedVersion,
        }),
        operationFingerprint
      )
      const [current] = await db
        .select({ isCompleted: eventTodo.isCompleted })
        .from(eventTodo)
        .where(and(eq(eventTodo.id, input.todoId), eq(eventTodo.eventId, input.eventId)))
        .limit(1)
      const [currentEntity] = await db
        .select({ serverVersion: nativeSyncEntity.serverVersion })
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, scopeId),
            eq(nativeSyncEntity.entityType, 'todo'),
            eq(nativeSyncEntity.entityId, input.todoId)
          )
        )
        .limit(1)
      if (!current || !currentEntity)
        throw new EntityNotFoundError({ category: 'not_found', code: 'TODO_NOT_FOUND' })
      return {
        eventId: input.eventId,
        todoId: input.todoId,
        isCompleted: current.isCompleted,
        version: currentEntity.serverVersion ?? nativeResult.serverVersion ?? input.expectedVersion,
      }
    })
  },

  createNote: (input) => {
    const noteId = input.idempotencyKey
    const operationFingerprint = fingerprint({
      kind: 'note.create',
      eventId: input.eventId,
      noteId,
      body: input.body,
    })
    const mutationId = stableUUID(`browser-event-note:${noteId}`)
    return persist('EVENT_NOTE_WRITE_FAILED', async () => {
      const [targetEvent] = await db
        .select({ parentId: event.parentEventId })
        .from(event)
        .where(eq(event.id, input.eventId))
        .limit(1)
      if (!targetEvent)
        throw new EntityNotFoundError({ category: 'not_found', code: 'EVENT_NOT_FOUND' })
      const scopeId = targetEvent.parentId ?? input.eventId
      const payload = {
        id: noteId,
        eventID: input.eventId,
        body: input.body,
        // Native Foundation archives encode Date as seconds since 2001-01-01.
        sentAt: Date.now() / 1_000 - Date.UTC(2001, 0, 1) / 1_000,
      }
      const nativeResult = await apply(
        input.userId,
        mutation({
          id: mutationId,
          scopeID: input.eventId,
          entityType: 'note',
          entityID: noteId,
          operation: 'create',
          payload,
          baseVersion: 0,
        }),
        operationFingerprint
      )
      const [saved] = await db
        .select({
          eventId: eventNote.eventId,
          authorUserId: eventNote.authorUserId,
        })
        .from(eventNote)
        .where(eq(eventNote.id, noteId))
        .limit(1)
      if (!saved || saved.eventId !== input.eventId || saved.authorUserId !== input.userId)
        throw new ConflictError({
          category: 'conflict',
          code: 'MCP_IDEMPOTENCY_KEY_REUSED',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      const [entity] = await db
        .select({ serverVersion: nativeSyncEntity.serverVersion })
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, scopeId),
            eq(nativeSyncEntity.entityType, 'note'),
            eq(nativeSyncEntity.entityId, noteId)
          )
        )
        .limit(1)
      return {
        eventId: input.eventId,
        noteId,
        version: entity?.serverVersion ?? nativeResult.serverVersion ?? 1,
        duplicate: nativeResult.disposition === 'duplicate',
      }
    })
  },

  updateDetails: (input) => {
    const operationFingerprint = fingerprint({
      kind: 'event.details',
      eventId: input.eventId,
      expectedVersion: input.expectedVersion,
      changes: input.changes,
    })
    const mutationId = stableUUID(`browser-event-write:${operationFingerprint}`)
    return persist('EVENT_DETAILS_WRITE_FAILED', async () => {
      const [targetEvent] = await db
        .select({
          parentId: event.parentEventId,
          organizationId: event.organizationId,
          locationName: event.locationName,
          locationAddress: event.locationAddress,
          locationAddressLine2: event.locationAddressLine2,
          locationLatitude: event.locationLatitude,
          locationLongitude: event.locationLongitude,
          mapItemIdentifier: event.mapItemIdentifier,
        })
        .from(event)
        .where(eq(event.id, input.eventId))
        .limit(1)
      if (!targetEvent)
        throw new EntityNotFoundError({ category: 'not_found', code: 'EVENT_NOT_FOUND' })
      const parentId = targetEvent.parentId
      const rootId = parentId ?? input.eventId
      let entityType: NativeMutation['entityType']
      let payload: Record<string, unknown>
      let currentVersion: number | undefined
      if (parentId) {
        const [entity] = await db
          .select()
          .from(nativeSyncEntity)
          .where(
            and(
              eq(nativeSyncEntity.scopeId, rootId),
              eq(nativeSyncEntity.entityType, 'event'),
              eq(nativeSyncEntity.entityId, input.eventId),
              eq(nativeSyncEntity.isDeleted, false)
            )
          )
          .limit(1)
        if (!entity)
          throw new EntityNotFoundError({ category: 'not_found', code: 'EVENT_NOT_FOUND' })
        currentVersion = entity.serverVersion
        payload = decode(entity.payload)
        entityType = 'event'
        const storedLocation =
          payload.eventLocation && typeof payload.eventLocation === 'object'
            ? (payload.eventLocation as Record<string, unknown>)
            : canonicalLocation(targetEvent)
        payload.eventLocation = requiredNativeLocationStrings(storedLocation)
        if (input.changes.title !== undefined) payload.title = input.changes.title
        if (input.changes.description !== undefined)
          payload.eventDescription = input.changes.description ?? ''
        if (input.changes.locationName !== undefined) {
          const location =
            payload.eventLocation && typeof payload.eventLocation === 'object'
              ? (payload.eventLocation as Record<string, unknown>)
              : {}
          payload.eventLocation = {
            ...location,
            locationName: input.changes.locationName ?? '',
            placeName: input.changes.locationName ?? '',
            shortAddress: input.changes.locationName ?? '',
          }
        }
      } else {
        const [snapshot] = await db
          .select({ serverVersion: nativeWorkspaceSnapshot.serverVersion })
          .from(nativeWorkspaceSnapshot)
          .where(
            and(
              eq(nativeWorkspaceSnapshot.scopeId, rootId),
              eq(nativeWorkspaceSnapshot.isDeleted, false)
            )
          )
          .limit(1)
        if (!snapshot)
          throw new EntityNotFoundError({ category: 'not_found', code: 'EVENT_NOT_FOUND' })
        currentVersion = snapshot.serverVersion
        payload = { mainEventID: input.eventId }
        entityType = 'workspace'
      }
      if (currentVersion !== input.expectedVersion)
        throw new ConflictError({
          category: 'conflict',
          code: 'SERVER_VERSION_CONFLICT',
          userMessageKey: 'serverErrors.CONFLICT',
          messageParams: { currentVersion },
        })
      const nativeResult =
        entityType === 'workspace'
          ? await applyNativeWorkspaceDetailsCommand({
              userId: input.userId,
              eventId: input.eventId,
              mutationId,
              expectedVersion: input.expectedVersion,
              changes: input.changes,
              requestFingerprint: operationFingerprint,
            }).then((result) => {
              if (result.disposition === 'rejected' || result.disposition === 'conflict')
                throw rejected(result)
              return result
            })
          : await apply(
              input.userId,
              mutation({
                id: mutationId,
                scopeID: rootId,
                entityType,
                entityID: input.eventId,
                operation: 'update',
                payload,
                baseVersion: input.expectedVersion,
              }),
              operationFingerprint
            )
      return {
        eventId: input.eventId,
        version: nativeResult.serverVersion ?? input.expectedVersion,
        changes: input.changes,
      }
    })
  },
})
