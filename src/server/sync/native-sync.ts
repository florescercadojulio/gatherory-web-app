import { and, asc, eq, gt, inArray, or } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/auth.schema"
import { event, eventParticipant, workspacePerson } from "@/db/schema/event.schema"
import {
  nativeSyncChange,
  nativeSyncEntity,
  nativeSyncMutationReceipt,
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
} from "@/db/schema/sync.schema"

import {
  materializeNativeMutation,
  NativeMaterializationError,
} from "./native-materializer"
import { type NativeMutation } from "./native-sync-contracts"
import { compareNativeMutationOrder } from "./native-sync-ordering"

export { pushRequestSchema } from "./native-sync-contracts"

function nativeISODate(date: Date) {
  // Foundation's `.iso8601` decoder consistently accepts the seconds form;
  // JavaScript's default `toISOString()` always adds fractional seconds.
  return date.toISOString().replace(/\.\d{3}Z$/, "Z")
}

export type NativePushResult = {
  mutationID: string
  disposition: "applied" | "duplicate" | "conflict" | "rejected"
  serverVersion: number | null
  failureCode: string | null
}

type NativeScopeRole = "owner" | "editor" | "viewer"

async function scopeRole(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: { scopeId: string; userId: string; legacyOwnerUserId?: string },
): Promise<NativeScopeRole | null> {
  const [participant] = await transaction.select({ role: eventParticipant.role, permission: eventParticipant.planningPermission })
    .from(eventParticipant).innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .where(and(eq(eventParticipant.eventId, input.scopeId), eq(workspacePerson.userId, input.userId))).limit(1)
  // A stale/legacy scope grant must never expose private planning to a guest.
  if (!participant || participant.role === "guest") return null
  const [membership] = await transaction
    .select({ role: nativeSyncScopeMember.role })
    .from(nativeSyncScopeMember)
    .where(
      and(
        eq(nativeSyncScopeMember.scopeId, input.scopeId),
        eq(nativeSyncScopeMember.userId, input.userId),
      ),
    )
    .limit(1)

  if (membership) return participant.permission === "view_only" ? "viewer"
    : membership.role === "owner" && participant.role !== "host" ? "editor" : membership.role
  if (input.legacyOwnerUserId !== input.userId) return null

  await transaction
    .insert(nativeSyncScopeMember)
    .values({ scopeId: input.scopeId, userId: input.userId, role: "owner" })
    .onConflictDoNothing({
      target: [nativeSyncScopeMember.scopeId, nativeSyncScopeMember.userId],
    })
  return "owner"
}

export async function applyNativeMutations(input: {
  userId: string
  mutations: NativeMutation[]
}) {
  const resultsByMutationId = new Map<string, NativePushResult>()

  for (const mutation of input.mutations.toSorted(compareNativeMutationOrder)) {
    let result: NativePushResult
    try {
      result = await db.transaction(async (transaction) => {
      const [receipt] = await transaction
        .select()
        .from(nativeSyncMutationReceipt)
        .where(eq(nativeSyncMutationReceipt.mutationId, mutation.id))
        .limit(1)

      if (receipt) {
        if (receipt.ownerUserId !== input.userId) {
          return {
            mutationID: mutation.id,
            disposition: "rejected",
            serverVersion: null,
            failureCode: "MUTATION_ID_OWNERSHIP_MISMATCH",
          } satisfies NativePushResult
        }

        return {
          mutationID: mutation.id,
          disposition: "duplicate",
          serverVersion: receipt.serverVersion,
          failureCode: receipt.failureCode,
        } satisfies NativePushResult
      }

      const [snapshot] = await transaction
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, mutation.scopeID))
        .limit(1)

      if (snapshot) {
        const role = await scopeRole(transaction, {
          scopeId: mutation.scopeID,
          userId: input.userId,
          legacyOwnerUserId: snapshot.ownerUserId,
        })
        if (!role || role === "viewer") {
          return recordRejectedMutation(transaction, {
            userId: input.userId,
            mutation,
            failureCode: "SCOPE_WRITE_FORBIDDEN",
          })
        }
        if (
          role !== "owner" &&
          mutation.entityType === "workspace" &&
          mutation.operation === "delete"
        ) {
          return recordRejectedMutation(transaction, {
            userId: input.userId,
            mutation,
            failureCode: "SCOPE_DELETE_FORBIDDEN",
          })
        }
      }

      const isDeleted = mutation.operation === "delete"
      const payload = isDeleted ? "" : mutation.payload
      let serverVersion: number

      if (mutation.entityType === "workspace") {
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
        await transaction
          .insert(nativeSyncScopeMember)
          .values({
            scopeId: mutation.scopeID,
            userId: input.userId,
            role: "owner",
          })
          .onConflictDoNothing({
            target: [
              nativeSyncScopeMember.scopeId,
              nativeSyncScopeMember.userId,
            ],
          })
      } else {
        if (!snapshot || snapshot.isDeleted) {
          return recordRejectedMutation(transaction, {
            userId: input.userId,
            mutation,
            failureCode: "SYNC_SCOPE_NOT_FOUND",
          })
        }

        const [entity] = await transaction
          .select()
          .from(nativeSyncEntity)
          .where(
            and(
              eq(nativeSyncEntity.scopeId, mutation.scopeID),
              eq(nativeSyncEntity.entityType, mutation.entityType),
              eq(nativeSyncEntity.entityId, mutation.entityID),
            ),
          )
          .limit(1)

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
        disposition: "applied",
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
        disposition: "applied",
        serverVersion,
        failureCode: null,
      } satisfies NativePushResult
      })
    } catch (error) {
      if (!(error instanceof NativeMaterializationError)) throw error
      result = await db.transaction((transaction) =>
        recordRejectedMutation(transaction, {
          userId: input.userId,
          mutation,
          failureCode: error.code,
        }),
      )
    }

    resultsByMutationId.set(mutation.id, result)
  }

  return {
    results: input.mutations.map(
      (mutation) => resultsByMutationId.get(mutation.id)!,
    ),
  }
}

async function recordConflictingMutation(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    userId: string
    mutation: NativeMutation
    serverVersion: number
  },
) {
  await transaction.insert(nativeSyncMutationReceipt).values({
    mutationId: input.mutation.id,
    ownerUserId: input.userId,
    scopeId: input.mutation.scopeID,
    disposition: "conflict",
    serverVersion: input.serverVersion,
    failureCode: "SERVER_VERSION_CONFLICT",
  })
  return {
    mutationID: input.mutation.id,
    disposition: "conflict",
    serverVersion: input.serverVersion,
    failureCode: "SERVER_VERSION_CONFLICT",
  } satisfies NativePushResult
}

async function recordRejectedMutation(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    userId: string
    mutation: NativeMutation
    failureCode: string
  },
) {
  await transaction.insert(nativeSyncMutationReceipt).values({
    mutationId: input.mutation.id,
    ownerUserId: input.userId,
    scopeId: input.mutation.scopeID,
    disposition: "rejected",
    failureCode: input.failureCode,
  })

  return {
    mutationID: input.mutation.id,
    disposition: "rejected",
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
      and(
        eq(nativeSyncChange.scopeId, input.scopeId),
        gt(nativeSyncChange.cursor, input.after),
      ),
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
      payloadSchemaVersion: 1,
      entityType: change.entityType,
      entityID: change.entityId,
      operation: change.operation,
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
  const accessibleScope = memberScopeIds.length
    ? or(
        eq(nativeWorkspaceSnapshot.ownerUserId, userId),
        inArray(nativeWorkspaceSnapshot.scopeId, memberScopeIds),
      )
    : eq(nativeWorkspaceSnapshot.ownerUserId, userId)
  const candidateRows = await db
    .select()
    .from(nativeWorkspaceSnapshot)
    .where(
      and(accessibleScope, eq(nativeWorkspaceSnapshot.isDeleted, false)),
    )
    .orderBy(asc(nativeWorkspaceSnapshot.createdAt))
  const planningScopes = await db.select({ id: event.id }).from(event)
    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .where(and(eq(workspacePerson.userId, userId), inArray(eventParticipant.role, ["host", "collaborator"])))
  const allowedScopes = new Set(planningScopes.map((item) => item.id))
  const rows = candidateRows.filter((snapshot) => allowedScopes.has(snapshot.scopeId))

  // Backfill pre-membership snapshots without requiring a destructive migration.
  const legacyOwnedScopes = rows
    .filter(
      (snapshot) =>
        snapshot.ownerUserId === userId &&
        !memberScopeIds.includes(snapshot.scopeId),
    )
    .map((snapshot) => ({
      scopeId: snapshot.scopeId,
      userId,
      role: "owner" as const,
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
          and(
            inArray(nativeSyncEntity.scopeId, scopeIds),
            eq(nativeSyncEntity.isDeleted, false),
          ),
        )
        .orderBy(asc(nativeSyncEntity.createdAt))
    : []

  // Native snapshots predate the explicit account flag. Treat their presence
  // as proof that onboarding completed and repair the account record once.
  const hasCompletedOnboarding =
    account?.hasCompletedOnboarding === true || rows.length > 0
  if (hasCompletedOnboarding && !account?.hasCompletedOnboarding) {
    await db
      .update(user)
      .set({ hasCompletedOnboarding: true })
      .where(eq(user.id, userId))
  }

  return {
    account: { hasCompletedOnboarding },
    snapshots: rows.map((snapshot) => ({
      scopeID: snapshot.scopeId,
      payloadSchemaVersion: 1,
      payload: snapshot.payload,
      serverVersion: snapshot.serverVersion,
      updatedAt: nativeISODate(snapshot.updatedAt),
    })),
    entities: entities.map((entity) => ({
      scopeID: entity.scopeId,
      payloadSchemaVersion: 1,
      entityType: entity.entityType,
      entityID: entity.entityId,
      payload: entity.payload,
      serverVersion: entity.serverVersion,
      updatedAt: nativeISODate(entity.updatedAt),
    })),
  }
}
