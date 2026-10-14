import { and, asc, eq, gt, inArray, isNull, isNotNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { user } from '@/db/schema/auth.schema'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import {
  nativeSyncChange,
  nativeSyncEntity,
  nativeSyncMutationReceipt,
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'

import {
  materializeNativeMutation,
  NativeMaterializationError,
} from './native-materializer.persistence'
import {
  nativePullOperation,
  type NativeMutation,
  type NativePushResult,
} from '../contracts/native-sync.contracts'
import { compareNativeMutationOrder } from '../workflows/native-sync-ordering'
import { deletedAccountTombstone } from '../contracts/native-tombstones'
import { nativeIdentityWriteAllowed } from '../services/native-identity-access'
import {
  applyScopedEventMutation,
  pullScopedEventChanges,
  scopedEventSnapshot,
} from './scoped-event-sync.persistence'

export { pushRequestSchema } from '../contracts/native-sync.contracts'

function nativeISODate(date: Date) {
  // Foundation's `.iso8601` decoder consistently accepts the seconds form;
  // JavaScript's default `toISOString()` always adds fractional seconds.
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

type NativeScopeRole = 'owner' | 'editor' | 'viewer'

async function scopeRole(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: { scopeId: string; userId: string; legacyOwnerUserId?: string }
): Promise<NativeScopeRole | null> {
  const [participant] = await transaction
    .select({ role: eventParticipant.role, permission: eventParticipant.planningPermission })
    .from(eventParticipant)
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .innerJoin(event, eq(event.id, eventParticipant.eventId))
    .where(
      and(
        eq(eventParticipant.eventId, input.scopeId),
        eq(workspacePerson.userId, input.userId),
        eq(event.organizationId, workspacePerson.organizationId),
        isNull(event.parentEventId)
      )
    )
    .limit(1)
  // A stale/legacy scope grant must never expose private planning to a guest.
  if (!participant || participant.role === 'guest') return null
  const [membership] = await transaction
    .select({ role: nativeSyncScopeMember.role })
    .from(nativeSyncScopeMember)
    .where(
      and(
        eq(nativeSyncScopeMember.scopeId, input.scopeId),
        eq(nativeSyncScopeMember.userId, input.userId)
      )
    )
    .limit(1)

  // The replication grant is a projection, not a second independent permission
  // system. Role changes must not strand an authorized collaborator.
  const role: NativeScopeRole =
    participant.permission === 'view_only'
      ? 'viewer'
      : participant.role === 'host' && input.legacyOwnerUserId === input.userId
        ? 'owner'
        : 'editor'
  if (membership?.role === role) return role

  await transaction
    .insert(nativeSyncScopeMember)
    .values({ scopeId: input.scopeId, userId: input.userId, role })
    .onConflictDoUpdate({
      target: [nativeSyncScopeMember.scopeId, nativeSyncScopeMember.userId],
      set: { role, updatedAt: new Date() },
    })
  return role
}

export async function applyNativeMutations(input: { userId: string; mutations: NativeMutation[] }) {
  const resultsByMutationId = new Map<string, NativePushResult>()

  for (const mutation of input.mutations.toSorted(compareNativeMutationOrder)) {
    const [targetEvent] = await db
      .select({ parentId: event.parentEventId })
      .from(event)
      .where(eq(event.id, mutation.scopeID))
      .limit(1)
    const rootId = targetEvent?.parentId ?? mutation.scopeID
    const result = await db.transaction(async (locked) => {
      // Transaction locks also cover first writes, where no row exists to lock.
      // Lock receipt IDs globally before scopes so cross-account/retried IDs
      // cannot race the receipt insert. Each transaction handles one mutation.
      await locked.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`native-mutation:${mutation.id}`}, 0))`
      )
      await locked.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`native-scope:${rootId}`}, 0))`
      )
      // Match canonical RSVP/lifecycle lock order: event before snapshot.
      await locked.select({ id: event.id }).from(event).where(eq(event.id, rootId)).for('update')
      if (targetEvent?.parentId) {
        await locked
          .select({ id: event.id })
          .from(event)
          .where(eq(event.id, mutation.scopeID))
          .for('update')
        return applyScopedEventMutation(locked, { userId: input.userId, mutation, rootId })
      }
      try {
        return await locked.transaction(async (transaction) => {
          const [receipt] = await transaction
            .select()
            .from(nativeSyncMutationReceipt)
            .where(eq(nativeSyncMutationReceipt.mutationId, mutation.id))
            .limit(1)

          if (receipt) {
            if (receipt.ownerUserId !== input.userId || receipt.scopeId !== mutation.scopeID) {
              return {
                mutationID: mutation.id,
                disposition: 'rejected',
                serverVersion: null,
                failureCode: 'MUTATION_ID_OWNERSHIP_MISMATCH',
              } satisfies NativePushResult
            }

            return {
              mutationID: mutation.id,
              // A repeated conflict/rejection is not an acknowledgement. Otherwise
              // a retry would cause iOS to delete an edit the server never applied.
              disposition:
                receipt.disposition === 'applied'
                  ? 'duplicate'
                  : receipt.disposition === 'conflict'
                    ? 'conflict'
                    : 'rejected',
              serverVersion: receipt.serverVersion,
              failureCode: receipt.failureCode,
            } satisfies NativePushResult
          }

          const [snapshot] = await transaction
            .select()
            .from(nativeWorkspaceSnapshot)
            .where(eq(nativeWorkspaceSnapshot.scopeId, mutation.scopeID))
            .limit(1)
            .for('update')

          if (snapshot) {
            const role = await scopeRole(transaction, {
              scopeId: mutation.scopeID,
              userId: input.userId,
              legacyOwnerUserId: snapshot.ownerUserId,
            })
            if (!role || role === 'viewer') {
              return recordRejectedMutation(transaction, {
                userId: input.userId,
                mutation,
                failureCode: 'SCOPE_WRITE_FORBIDDEN',
              })
            }
            if (['participant', 'event_participation'].includes(mutation.entityType)) {
              const [actor] = await transaction
                .select({
                  personId: eventParticipant.personId,
                  role: eventParticipant.role,
                  planningPermission: eventParticipant.planningPermission,
                })
                .from(eventParticipant)
                .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
                .where(
                  and(
                    eq(eventParticipant.eventId, mutation.scopeID),
                    eq(workspacePerson.userId, input.userId)
                  )
                )
                .limit(1)
              const [participation] =
                mutation.entityType === 'event_participation'
                  ? await transaction
                      .select()
                      .from(eventParticipant)
                      .where(eq(eventParticipant.id, mutation.entityID))
                      .limit(1)
                  : []
              if (!actor || !nativeIdentityWriteAllowed({ mutation, actor, participation })) {
                return recordRejectedMutation(transaction, {
                  userId: input.userId,
                  mutation,
                  failureCode: 'EVENT_PERMISSION_REQUIRED',
                })
              }
            }
            if (
              role !== 'owner' &&
              mutation.entityType === 'workspace' &&
              mutation.operation === 'delete'
            ) {
              return recordRejectedMutation(transaction, {
                userId: input.userId,
                mutation,
                failureCode: 'SCOPE_DELETE_FORBIDDEN',
              })
            }
          }

          const isDeleted = mutation.operation === 'delete'
          let payload = isDeleted ? '' : mutation.payload
          let serverVersion: number

          if (mutation.entityType === 'workspace') {
            if (
              snapshot &&
              mutation.baseVersion != null &&
              mutation.baseVersion !== snapshot.serverVersion
            ) {
              return recordConflictingMutation(transaction, {
                userId: input.userId,
                mutation,
                serverVersion: snapshot.serverVersion,
              })
            }

            serverVersion = (snapshot?.serverVersion ?? 0) + 1
            const materialized = await materializeNativeMutation(transaction, {
              userId: input.userId,
              mutation,
              organizationId: snapshot?.organizationId,
            })
            await transaction
              .insert(nativeWorkspaceSnapshot)
              .values({
                scopeId: mutation.scopeID,
                ownerUserId: input.userId,
                organizationId: materialized.organizationId,
                payload,
                serverVersion,
                isDeleted,
              })
              .onConflictDoUpdate({
                target: nativeWorkspaceSnapshot.scopeId,
                set: {
                  organizationId: materialized.organizationId,
                  payload,
                  serverVersion,
                  isDeleted,
                  updatedAt: new Date(),
                },
              })
            if (!snapshot)
              await transaction
                .insert(nativeSyncScopeMember)
                .values({
                  scopeId: mutation.scopeID,
                  userId: input.userId,
                  role: 'owner',
                })
                .onConflictDoNothing({
                  target: [nativeSyncScopeMember.scopeId, nativeSyncScopeMember.userId],
                })
          } else {
            if (!snapshot || snapshot.isDeleted) {
              return recordRejectedMutation(transaction, {
                userId: input.userId,
                mutation,
                failureCode: 'SYNC_SCOPE_NOT_FOUND',
              })
            }

            const [entity] = await transaction
              .select()
              .from(nativeSyncEntity)
              .where(
                and(
                  eq(nativeSyncEntity.scopeId, mutation.scopeID),
                  eq(nativeSyncEntity.entityType, mutation.entityType),
                  eq(nativeSyncEntity.entityId, mutation.entityID)
                )
              )
              .limit(1)

            // Reject even another delete: replacing this marker with an ordinary
            // empty tombstone would allow a later unversioned create to resurrect it.
            if (entity?.isDeleted && entity.payload === deletedAccountTombstone) {
              return recordRejectedMutation(transaction, {
                userId: input.userId,
                mutation,
                failureCode: 'PARTICIPANT_ACCOUNT_DELETED',
              })
            }
            if (
              entity &&
              mutation.baseVersion != null &&
              mutation.baseVersion !== entity.serverVersion
            ) {
              return recordConflictingMutation(transaction, {
                userId: input.userId,
                mutation,
                serverVersion: entity.serverVersion,
              })
            }

            serverVersion = (entity?.serverVersion ?? 0) + 1
            await materializeNativeMutation(transaction, {
              userId: input.userId,
              mutation,
              organizationId: snapshot.organizationId,
            })
            // Notes are displayed with an author on native clients. Mirror the
            // canonical table: never trust a client-supplied author's identity.
            // Materialization above has already validated this JSON payload.
            if (!isDeleted && mutation.entityType === 'note') {
              const note = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
              payload = Buffer.from(
                JSON.stringify({ ...note, authorUserID: input.userId })
              ).toString('base64')
            }
            await transaction
              .insert(nativeSyncEntity)
              .values({
                scopeId: mutation.scopeID,
                entityType: mutation.entityType,
                entityId: mutation.entityID,
                ownerUserId: input.userId,
                payload,
                serverVersion,
                isDeleted,
              })
              .onConflictDoUpdate({
                target: [
                  nativeSyncEntity.scopeId,
                  nativeSyncEntity.entityType,
                  nativeSyncEntity.entityId,
                ],
                set: {
                  payload,
                  serverVersion,
                  isDeleted,
                  updatedAt: new Date(),
                },
              })
          }

          await transaction.insert(nativeSyncChange).values({
            ownerUserId: input.userId,
            scopeId: mutation.scopeID,
            entityType: mutation.entityType,
            entityId: mutation.entityID,
            operation: mutation.operation,
            payload,
            serverVersion,
          })

          await transaction.insert(nativeSyncMutationReceipt).values({
            mutationId: mutation.id,
            ownerUserId: input.userId,
            scopeId: mutation.scopeID,
            disposition: 'applied',
            serverVersion,
          })

          if (!isDeleted) {
            await transaction
              .update(user)
              .set({ hasCompletedOnboarding: true })
              .where(eq(user.id, input.userId))
          }

          return {
            mutationID: mutation.id,
            disposition: 'applied',
            serverVersion,
            failureCode: null,
          } satisfies NativePushResult
        })
      } catch (error) {
        if (!(error instanceof NativeMaterializationError)) throw error
        // The savepoint rolls back partial materialization, while the outer
        // transaction retains its locks through recording the failed receipt.
        return recordRejectedMutation(locked, {
          userId: input.userId,
          mutation,
          failureCode: error.code,
        })
      }
    })

    resultsByMutationId.set(mutation.id, result)
  }

  return {
    results: input.mutations.map((mutation) => resultsByMutationId.get(mutation.id)!),
  }
}

async function recordConflictingMutation(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    userId: string
    mutation: NativeMutation
    serverVersion: number
  }
) {
  await transaction.insert(nativeSyncMutationReceipt).values({
    mutationId: input.mutation.id,
    ownerUserId: input.userId,
    scopeId: input.mutation.scopeID,
    disposition: 'conflict',
    serverVersion: input.serverVersion,
    failureCode: 'SERVER_VERSION_CONFLICT',
  })
  return {
    mutationID: input.mutation.id,
    disposition: 'conflict',
    serverVersion: input.serverVersion,
    failureCode: 'SERVER_VERSION_CONFLICT',
  } satisfies NativePushResult
}

async function recordRejectedMutation(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    userId: string
    mutation: NativeMutation
    failureCode: string
  }
) {
  await transaction.insert(nativeSyncMutationReceipt).values({
    mutationId: input.mutation.id,
    ownerUserId: input.userId,
    scopeId: input.mutation.scopeID,
    disposition: 'rejected',
    failureCode: input.failureCode,
  })

  return {
    mutationID: input.mutation.id,
    disposition: 'rejected',
    serverVersion: null,
    failureCode: input.failureCode,
  } satisfies NativePushResult
}

export async function pullNativeChanges(input: {
  userId: string
  scopeId: string
  after: number
  limit?: number
}) {
  const [targetEvent] = await db
    .select({ parentId: event.parentEventId })
    .from(event)
    .where(eq(event.id, input.scopeId))
    .limit(1)
  if (targetEvent?.parentId)
    return pullScopedEventChanges({ ...input, rootId: targetEvent.parentId })
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 250)
  const access = await db.transaction(async (transaction) => {
    const [scope] = await transaction
      .select({ ownerUserId: nativeWorkspaceSnapshot.ownerUserId })
      .from(nativeWorkspaceSnapshot)
      .where(eq(nativeWorkspaceSnapshot.scopeId, input.scopeId))
      .limit(1)
    if (!scope) return null
    return scopeRole(transaction, {
      scopeId: input.scopeId,
      userId: input.userId,
      legacyOwnerUserId: scope.ownerUserId,
    })
  })

  if (!access) return null

  const rows = await db
    .select()
    .from(nativeSyncChange)
    .where(
      and(eq(nativeSyncChange.scopeId, input.scopeId), gt(nativeSyncChange.cursor, input.after))
    )
    .orderBy(asc(nativeSyncChange.cursor))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = rows.slice(0, limit)
  const nextCursor = page.at(-1)?.cursor ?? input.after

  return {
    changes: page.map((change) => ({
      id: change.id,
      scopeID: change.scopeId,
      payloadSchemaVersion: 1 as const,
      entityType: change.entityType,
      entityID: change.entityId,
      // Repair already-written development changes at the boundary without
      // resetting accounts or advancing clients past unapplied records.
      operation: nativePullOperation(change.operation),
      payload: change.payload,
      serverVersion: change.serverVersion,
      occurredAt: nativeISODate(change.occurredAt),
    })),
    nextCursor: String(nextCursor),
    hasMore,
  }
}

export async function listNativeWorkspaceSnapshots(userId: string) {
  const [memberships, [account]] = await Promise.all([
    db
      .select({ scopeId: nativeSyncScopeMember.scopeId })
      .from(nativeSyncScopeMember)
      .where(eq(nativeSyncScopeMember.userId, userId)),
    db
      .select({ hasCompletedOnboarding: user.hasCompletedOnboarding })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
  ])
  const memberScopeIds = memberships.map((membership) => membership.scopeId)
  const planningScopes = await db
    .select({ id: event.id })
    .from(event)
    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .where(
      and(
        eq(workspacePerson.userId, userId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        eq(event.organizationId, workspacePerson.organizationId),
        isNull(event.parentEventId)
      )
    )
  const rows = planningScopes.length
    ? await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(
          and(
            inArray(
              nativeWorkspaceSnapshot.scopeId,
              planningScopes.map((item) => item.id)
            ),
            eq(nativeWorkspaceSnapshot.isDeleted, false)
          )
        )
        .orderBy(asc(nativeWorkspaceSnapshot.createdAt))
    : []

  // Backfill pre-membership snapshots without requiring a destructive migration.
  const legacyOwnedScopes = rows
    .filter(
      (snapshot) => snapshot.ownerUserId === userId && !memberScopeIds.includes(snapshot.scopeId)
    )
    .map((snapshot) => ({
      scopeId: snapshot.scopeId,
      userId,
      role: 'owner' as const,
    }))
  if (legacyOwnedScopes.length) {
    await db
      .insert(nativeSyncScopeMember)
      .values(legacyOwnedScopes)
      .onConflictDoNothing({
        target: [nativeSyncScopeMember.scopeId, nativeSyncScopeMember.userId],
      })
  }

  const scopeIds = rows.map((snapshot) => snapshot.scopeId)
  const entities = scopeIds.length
    ? await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(inArray(nativeSyncEntity.scopeId, scopeIds), eq(nativeSyncEntity.isDeleted, false))
        )
        .orderBy(asc(nativeSyncEntity.createdAt))
    : []

  const childEvents = await db
    .select({ id: event.id, parentId: event.parentEventId })
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
        eq(workspacePerson.userId, userId),
        isNotNull(event.parentEventId),
        inArray(eventParticipant.role, ['host', 'collaborator'])
      )
    )
  const rootScopes = new Set(rows.map((row) => row.scopeId))
  const childSnapshots = []
  for (const child of childEvents) {
    if (rootScopes.has(child.parentId!)) continue
    const snapshot = await db.transaction(async (tx) => {
      await tx
        .select({ id: event.id })
        .from(event)
        .where(eq(event.id, child.parentId!))
        .for('share')
      await tx.select({ id: event.id }).from(event).where(eq(event.id, child.id)).for('share')
      return scopedEventSnapshot(tx, child.id, userId)
    })
    if (snapshot) childSnapshots.push(snapshot)
  }

  // Both a root workspace and an admitted child planning scope are usable
  // planning experiences; neither should send an invitee through onboarding.
  const hasCompletedOnboarding =
    account?.hasCompletedOnboarding === true || rows.length > 0 || childSnapshots.length > 0
  if (hasCompletedOnboarding && !account?.hasCompletedOnboarding) {
    await db.update(user).set({ hasCompletedOnboarding: true }).where(eq(user.id, userId))
  }

  return {
    account: { hasCompletedOnboarding },
    snapshots: [
      ...rows.map((snapshot) => ({
        scopeID: snapshot.scopeId,
        payloadSchemaVersion: 1 as const,
        payload: snapshot.payload,
        serverVersion: snapshot.serverVersion,
        updatedAt: nativeISODate(snapshot.updatedAt),
      })),
      ...childSnapshots.map(({ cursor: _cursor, ...snapshot }) => snapshot),
    ],
    entities: entities.map((entity) => ({
      scopeID: entity.scopeId,
      payloadSchemaVersion: 1 as const,
      entityType: entity.entityType,
      entityID: entity.entityId,
      payload: entity.payload,
      serverVersion: entity.serverVersion,
      updatedAt: nativeISODate(entity.updatedAt),
    })),
  }
}
