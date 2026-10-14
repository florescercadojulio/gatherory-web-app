import { and, asc, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { member, organization } from '@/db/schema/auth.schema'
import { mediaAsset } from '@/db/schema/media.schema'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { idea } from '@/db/schema/planning.schema'
import {
  nativeSyncChange,
  nativeSyncEntity,
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'
import { PersistenceError } from '@/lib/domain-errors'
import { deleteMediaObject } from '@/server/media/connectors/media-storage.con'
import { redactAccountPayload, type DeletionPayloadContext } from './account-deletion-payload'
import { deletedAccountTombstone } from '@/server/sync/native-tombstones'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Only an already admitted planner can inherit ownership, never a guest or a
 * stale organization member whose event access has been removed. */
async function successor(
  transaction: Transaction | typeof db,
  organizationId: string,
  userId: string
) {
  const [candidate] = await transaction
    .select({ memberId: member.id, userId: member.userId, personId: workspacePerson.id })
    .from(member)
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.organizationId, member.organizationId),
        eq(workspacePerson.userId, member.userId)
      )
    )
    .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
    .innerJoin(event, and(eq(event.id, eventParticipant.eventId), isNull(event.parentEventId)))
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(event.organizationId, organizationId),
        ne(member.userId, userId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        ne(eventParticipant.planningPermission, 'view_only')
      )
    )
    .orderBy(sql`case when ${member.role} = 'owner' then 0 else 1 end`, asc(member.createdAt))
    .limit(1)
  return candidate
}

type WorkspaceDisposition =
  | { organizationId: string; kind: 'delete' }
  | { memberId: string; organizationId: string; kind: 'transfer' }

/**
 * Prepare Gatherory-owned data for Better Auth's hard user deletion.
 *
 * Legacy persistence boundary: this deliberately remains Promise/Drizzle based
 * because its row locks, ownership transfer, tombstones, and payload scrubbing
 * form one critical transaction algorithm. Keep it intact until that complete
 * transaction has an Effect-native persistence design and equivalent coverage.
 *
 * A private workspace is deleted with its final owner. A collaborative
 * workspace remains available: ownership moves to an existing planner,
 * native storage ownership is reassigned before the user cascade, and media the
 * departing user uploaded is removed from both R2 and PostgreSQL.
 */
export async function prepareGatheroryAccountDeletion(userId: string) {
  const ownedMemberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.role, 'owner')))

  const dispositions: WorkspaceDisposition[] = []

  for (const { organizationId } of ownedMemberships) {
    const candidate = await successor(db, organizationId, userId)
    if (!candidate) {
      dispositions.push({ kind: 'delete', organizationId })
      continue
    }
    dispositions.push({ kind: 'transfer', organizationId, memberId: candidate.memberId })
  }

  const organizationsToDelete = dispositions
    .filter(
      (disposition): disposition is Extract<WorkspaceDisposition, { kind: 'delete' }> =>
        disposition.kind === 'delete'
    )
    .map((disposition) => disposition.organizationId)

  const mediaPredicate = organizationsToDelete.length
    ? or(
        eq(mediaAsset.uploadedByUserId, userId),
        inArray(mediaAsset.organizationId, organizationsToDelete)
      )
    : eq(mediaAsset.uploadedByUserId, userId)

  const mediaToDelete = await db
    .select({
      id: mediaAsset.id,
      organizationId: mediaAsset.organizationId,
      bucket: mediaAsset.bucket,
      storageKey: mediaAsset.storageKey,
    })
    .from(mediaAsset)
    .where(mediaPredicate)

  // R2 deletes are idempotent. Finish them before the database transaction so
  // a storage failure leaves retryable metadata instead of orphaned objects.
  await Promise.all(
    mediaToDelete.map(({ bucket, storageKey }) => deleteMediaObject({ bucket, key: storageKey }))
  )

  await db.transaction(async (transaction) => {
    const people = await transaction
      .select()
      .from(workspacePerson)
      .where(eq(workspacePerson.userId, userId))
    const ownedSnapshots = await transaction
      .select({ organizationId: nativeWorkspaceSnapshot.organizationId })
      .from(nativeWorkspaceSnapshot)
      .where(eq(nativeWorkspaceSnapshot.ownerUserId, userId))
    // A non-owner collaborator may have written entities/change rows too.
    const authoredScopes = await transaction
      .select({ organizationId: nativeWorkspaceSnapshot.organizationId })
      .from(nativeSyncEntity)
      .innerJoin(
        nativeWorkspaceSnapshot,
        eq(nativeWorkspaceSnapshot.scopeId, nativeSyncEntity.scopeId)
      )
      .where(eq(nativeSyncEntity.ownerUserId, userId))
    const authoredChanges = await transaction
      .select({ organizationId: nativeWorkspaceSnapshot.organizationId })
      .from(nativeSyncChange)
      .innerJoin(
        nativeWorkspaceSnapshot,
        eq(nativeWorkspaceSnapshot.scopeId, nativeSyncChange.scopeId)
      )
      .where(eq(nativeSyncChange.ownerUserId, userId))
    const organizationIds = [
      ...new Set(
        [...people, ...ownedSnapshots, ...authoredScopes, ...authoredChanges, ...mediaToDelete].map(
          (item) => item.organizationId
        )
      ),
    ].filter((id) => !organizationsToDelete.includes(id))

    for (const disposition of dispositions) {
      if (disposition.kind === 'transfer') {
        await transaction
          .update(member)
          .set({ role: 'owner' })
          .where(eq(member.id, disposition.memberId))
        const candidate = await successor(transaction, disposition.organizationId, userId)
        if (candidate) {
          const roots = await transaction
            .select({ id: event.id })
            .from(event)
            .where(
              and(eq(event.organizationId, disposition.organizationId), isNull(event.parentEventId))
            )
          if (roots.length)
            await transaction
              .update(eventParticipant)
              .set({ role: 'host', planningPermission: 'manage', updatedAt: new Date() })
              .where(
                and(
                  inArray(
                    eventParticipant.eventId,
                    roots.map((root) => root.id)
                  ),
                  eq(eventParticipant.personId, candidate.personId)
                )
              )
        }
      }
    }

    if (organizationIds.length) {
      const snapshots = await transaction
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(inArray(nativeWorkspaceSnapshot.organizationId, organizationIds))
        .for('update')
      for (const snapshot of snapshots) {
        const inheriting = snapshot.ownerUserId === userId
        const transferring = dispositions.some(
          (item) => item.kind === 'transfer' && item.organizationId === snapshot.organizationId
        )
        const candidate =
          inheriting || transferring
            ? await successor(transaction, snapshot.organizationId, userId)
            : undefined
        if (inheriting && !candidate) {
          // Do not report successful deletion while cascading somebody else's data.
          throw new PersistenceError({
            category: 'system',
            code: 'ACCOUNT_DELETION_SUCCESSOR_MISSING',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        }
        const ownerUserId = inheriting ? candidate!.userId : snapshot.ownerUserId
        const context: DeletionPayloadContext = {
          userId,
          scopeId: snapshot.scopeId,
          personIds: new Set(
            people
              .filter((person) => person.organizationId === snapshot.organizationId)
              .map((person) => person.id)
          ),
          mediaIds: new Set(mediaToDelete.map((asset) => asset.id)),
          successorPersonId: candidate?.personId,
        }
        const participations = context.personIds.size
          ? await transaction
              .select()
              .from(eventParticipant)
              .where(inArray(eventParticipant.personId, [...context.personIds]))
          : []
        const participationIds = new Set(participations.map((item) => item.id))

        if (candidate) {
          await transaction
            .update(eventParticipant)
            .set({ role: 'host', planningPermission: 'manage', updatedAt: new Date() })
            .where(
              and(
                eq(eventParticipant.eventId, snapshot.scopeId),
                eq(eventParticipant.personId, candidate.personId)
              )
            )
          await transaction
            .insert(nativeSyncScopeMember)
            .values({ scopeId: snapshot.scopeId, userId: candidate.userId, role: 'owner' })
            .onConflictDoUpdate({
              target: [nativeSyncScopeMember.scopeId, nativeSyncScopeMember.userId],
              set: { role: 'owner', updatedAt: new Date() },
            })
        }
        // The FK describes storage responsibility, not authorship. Preserve all
        // shared records, including records originally written by a collaborator.
        await transaction
          .update(nativeSyncEntity)
          .set({ ownerUserId })
          .where(
            and(
              eq(nativeSyncEntity.scopeId, snapshot.scopeId),
              eq(nativeSyncEntity.ownerUserId, userId)
            )
          )
        await transaction
          .update(nativeSyncChange)
          .set({ ownerUserId })
          .where(
            and(
              eq(nativeSyncChange.scopeId, snapshot.scopeId),
              eq(nativeSyncChange.ownerUserId, userId)
            )
          )

        const isIdentity = (type: string, id: string) =>
          (type === 'participant' && context.personIds.has(id)) ||
          (type === 'event_participation' && participationIds.has(id))
        // Scrub historical payloads too: a new device can pull from cursor zero.
        const history = await transaction
          .select()
          .from(nativeSyncChange)
          .where(eq(nativeSyncChange.scopeId, snapshot.scopeId))
        for (const change of history) {
          const payload = isIdentity(change.entityType, change.entityId)
            ? ''
            : redactAccountPayload(change.payload, context)
          if (payload !== change.payload)
            await transaction
              .update(nativeSyncChange)
              .set({
                payload,
                ...(isIdentity(change.entityType, change.entityId) ? { operation: 'delete' } : {}),
              })
              .where(eq(nativeSyncChange.id, change.id))
        }
        const entities = await transaction
          .select()
          .from(nativeSyncEntity)
          .where(eq(nativeSyncEntity.scopeId, snapshot.scopeId))
        const tombstones = new Map(
          [...context.personIds].map((id) => [`participant:${id}`, { type: 'participant', id }])
        )
        for (const id of participationIds)
          tombstones.set(`event_participation:${id}`, { type: 'event_participation', id })
        for (const entity of entities) {
          const deleted = isIdentity(entity.entityType, entity.entityId)
          const payload = deleted ? '' : redactAccountPayload(entity.payload, context)
          if (deleted) continue // upsert all tombstones below, including archive-only people
          if (payload !== entity.payload) {
            const version = entity.serverVersion + 1
            await transaction
              .update(nativeSyncEntity)
              .set({ payload, serverVersion: version, updatedAt: new Date() })
              .where(
                and(
                  eq(nativeSyncEntity.scopeId, snapshot.scopeId),
                  eq(nativeSyncEntity.entityType, entity.entityType),
                  eq(nativeSyncEntity.entityId, entity.entityId)
                )
              )
            await transaction.insert(nativeSyncChange).values({
              scopeId: snapshot.scopeId,
              ownerUserId,
              entityType: entity.entityType,
              entityId: entity.entityId,
              operation: entity.isDeleted ? 'delete' : 'upsert',
              payload,
              serverVersion: version,
            })
          }
        }
        for (const { type, id } of tombstones.values()) {
          const [entity] = await transaction
            .insert(nativeSyncEntity)
            .values({
              scopeId: snapshot.scopeId,
              ownerUserId,
              entityType: type,
              entityId: id,
              payload: deletedAccountTombstone,
              isDeleted: true,
            })
            .onConflictDoUpdate({
              target: [
                nativeSyncEntity.scopeId,
                nativeSyncEntity.entityType,
                nativeSyncEntity.entityId,
              ],
              set: {
                ownerUserId,
                payload: deletedAccountTombstone,
                isDeleted: true,
                serverVersion: sql`${nativeSyncEntity.serverVersion} + 1`,
                updatedAt: new Date(),
              },
            })
            .returning({ version: nativeSyncEntity.serverVersion })
          await transaction.insert(nativeSyncChange).values({
            scopeId: snapshot.scopeId,
            ownerUserId,
            entityType: type,
            entityId: id,
            operation: 'delete',
            payload: deletedAccountTombstone,
            serverVersion: entity.version,
          })
        }
        const payload = redactAccountPayload(snapshot.payload, context)
        // Native clients deliberately preserve collaborative arrays when a
        // workspace update arrives. Publish role changes as individual records
        // too, including old archives that have no standalone entities yet.
        if (candidate) {
          const archive = JSON.parse(Buffer.from(payload, 'base64').toString())
          const [person] = await transaction
            .select()
            .from(workspacePerson)
            .where(eq(workspacePerson.id, candidate.personId))
          const [participation] = await transaction
            .select()
            .from(eventParticipant)
            .where(
              and(
                eq(eventParticipant.eventId, snapshot.scopeId),
                eq(eventParticipant.personId, candidate.personId)
              )
            )
          const foundationDate = (date: Date) => (date.getTime() - Date.UTC(2001, 0, 1)) / 1000
          const personValue = archive.members?.find(
            (item: { id: string }) => item.id.toLowerCase() === candidate.personId
          ) ?? {
            id: person.id,
            userID: person.userId,
            name: person.displayName,
            email: person.email,
            profileImageURL: person.avatarUrl,
            initials: person.displayName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase(),
            participantRole: 'host',
            planningPermission: 'manage',
            attendance: 'going',
            invitationStatus: 'active',
          }
          const participationValue = archive.eventParticipations?.find(
            (item: { id: string }) => item.id.toLowerCase() === participation.id
          ) ?? {
            id: participation.id,
            eventID: snapshot.scopeId,
            memberID: person.id,
            role: 'host',
            planningPermission: 'manage',
            attendance: (
              {
                pending: 'invited',
                going: 'going',
                not_sure: 'maybe',
                not_going: 'declined',
              } as const
            )[participation.attendanceStatus],
            invitationStatus: 'active',
            createdAt: foundationDate(participation.createdAt),
            updatedAt: foundationDate(new Date()),
          }
          for (const record of [
            { type: 'participant', id: person.id, value: personValue },
            { type: 'event_participation', id: participation.id, value: participationValue },
          ]) {
            const recordPayload = Buffer.from(JSON.stringify(record.value)).toString('base64')
            const [existing] = await transaction
              .select()
              .from(nativeSyncEntity)
              .where(
                and(
                  eq(nativeSyncEntity.scopeId, snapshot.scopeId),
                  eq(nativeSyncEntity.entityType, record.type),
                  eq(nativeSyncEntity.entityId, record.id)
                )
              )
            if (existing?.payload === recordPayload && !existing.isDeleted) continue
            const [updated] = await transaction
              .insert(nativeSyncEntity)
              .values({
                scopeId: snapshot.scopeId,
                ownerUserId,
                entityType: record.type,
                entityId: record.id,
                payload: recordPayload,
              })
              .onConflictDoUpdate({
                target: [
                  nativeSyncEntity.scopeId,
                  nativeSyncEntity.entityType,
                  nativeSyncEntity.entityId,
                ],
                set: {
                  ownerUserId,
                  payload: recordPayload,
                  isDeleted: false,
                  serverVersion: sql`${nativeSyncEntity.serverVersion} + 1`,
                  updatedAt: new Date(),
                },
              })
              .returning({ version: nativeSyncEntity.serverVersion })
            await transaction.insert(nativeSyncChange).values({
              scopeId: snapshot.scopeId,
              ownerUserId,
              entityType: record.type,
              entityId: record.id,
              operation: 'update',
              payload: recordPayload,
              serverVersion: updated.version,
            })
          }
        }
        const version = snapshot.serverVersion + 1
        await transaction
          .update(nativeWorkspaceSnapshot)
          .set({ ownerUserId, payload, serverVersion: version, updatedAt: new Date() })
          .where(eq(nativeWorkspaceSnapshot.scopeId, snapshot.scopeId))
        await transaction.insert(nativeSyncChange).values({
          scopeId: snapshot.scopeId,
          ownerUserId,
          entityType: 'workspace',
          entityId: snapshot.scopeId,
          operation: 'update',
          payload,
          serverVersion: version,
        })
      }
      // Category configuration can embed the same native identity/media fields.
      const configuredIdeas = await transaction
        .select({
          id: idea.id,
          organizationId: idea.organizationId,
          configuration: idea.configuration,
        })
        .from(idea)
        .where(inArray(idea.organizationId, organizationIds))
      for (const item of configuredIdeas) {
        const payload = Buffer.from(JSON.stringify(item.configuration)).toString('base64')
        const redacted = redactAccountPayload(payload, {
          userId,
          scopeId: '',
          mediaIds: new Set(mediaToDelete.map((asset) => asset.id)),
          personIds: new Set(
            people
              .filter((person) => person.organizationId === item.organizationId)
              .map((person) => person.id)
          ),
        })
        if (redacted !== payload)
          await transaction
            .update(idea)
            .set({ configuration: JSON.parse(Buffer.from(redacted, 'base64').toString()) })
            .where(eq(idea.id, item.id))
      }
    }
    // Remove linked contact rows rather than leaving name/email/avatar behind
    // as an apparently new, unlinked invitation after ON DELETE SET NULL.
    await transaction.delete(workspacePerson).where(eq(workspacePerson.userId, userId))

    await transaction.delete(mediaAsset).where(eq(mediaAsset.uploadedByUserId, userId))

    if (organizationsToDelete.length) {
      await transaction.delete(organization).where(inArray(organization.id, organizationsToDelete))
    }
  })
}
