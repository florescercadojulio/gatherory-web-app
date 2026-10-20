import { asc, eq } from 'drizzle-orm'

import { db, pool } from '@/db'
import { nativeSyncEntity, nativeWorkspaceSnapshot } from '@/db/schema/sync.schema'
import { materializeNativeMutation } from '@/server/sync/native-materializer'

import type { NativeMutation } from '@/server/sync/native-sync-contracts'

const supportedTypes = new Set<NativeMutation['entityType']>([
  'workspace',
  'participant',
  'event',
  'idea',
  'event_participation',
  'attendance',
  'expense',
  'registry_item',
  'note',
  'moment',
])

// Todos are maintained transactionally with their canonical rows and have
// strict create/update/delete semantics. This legacy repair command replays
// historical sync entities, including tombstones, so it must not reinterpret
// todo history as a backfill operation.

const dependencyOrder: Record<NativeMutation['entityType'], number> = {
  workspace: 0,
  participant: 1,
  event: 2,
  idea: 3,
  idea_response: 4,
  event_participation: 4,
  attendance: 5,
  expense: 6,
  registry_item: 7,
  note: 8,
  todo: 8,
  moment: 9,
}

async function main() {
  const snapshots = await db
    .select()
    .from(nativeWorkspaceSnapshot)
    .orderBy(asc(nativeWorkspaceSnapshot.createdAt))

  for (const snapshot of snapshots) {
    const entities = (
      await db.select().from(nativeSyncEntity).where(eq(nativeSyncEntity.scopeId, snapshot.scopeId))
    )
      .filter(
        (
          entity
        ): entity is typeof entity & {
          entityType: NativeMutation['entityType']
        } => supportedTypes.has(entity.entityType as NativeMutation['entityType'])
      )
      .toSorted((left, right) => {
        if (left.isDeleted && !right.isDeleted) return 1
        if (!left.isDeleted && right.isDeleted) return -1
        if (left.isDeleted) {
          return dependencyOrder[right.entityType] - dependencyOrder[left.entityType]
        }
        return dependencyOrder[left.entityType] - dependencyOrder[right.entityType]
      })

    await db.transaction(async (transaction) => {
      const workspaceMutation: NativeMutation = {
        id: crypto.randomUUID(),
        scopeID: snapshot.scopeId,
        payloadSchemaVersion: 1,
        entityType: 'workspace',
        entityID: snapshot.scopeId,
        operation: snapshot.isDeleted ? 'delete' : 'update',
        payload: snapshot.isDeleted ? '' : snapshot.payload,
        baseVersion: snapshot.serverVersion,
        createdAt: snapshot.updatedAt.toISOString(),
        attemptCount: 0,
      }
      await materializeNativeMutation(transaction, {
        userId: snapshot.ownerUserId,
        mutation: workspaceMutation,
        organizationId: snapshot.organizationId,
      })

      for (const entity of entities) {
        await materializeNativeMutation(transaction, {
          userId: entity.ownerUserId,
          organizationId: snapshot.organizationId,
          mutation: {
            id: crypto.randomUUID(),
            scopeID: entity.scopeId,
            payloadSchemaVersion: 1,
            entityType: entity.entityType,
            entityID: entity.entityId,
            operation: entity.isDeleted ? 'delete' : 'update',
            payload: entity.isDeleted ? '' : entity.payload,
            baseVersion: entity.serverVersion,
            createdAt: entity.updatedAt.toISOString(),
            attemptCount: 0,
          },
        })
      }
    })

    console.log(`Materialized ${snapshot.scopeId} (${entities.length} native entities).`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
