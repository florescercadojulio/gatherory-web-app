import { and, asc, eq, ne, isNull, isNotNull, inArray, or, sql } from 'drizzle-orm'
import { Effect } from 'effect'

import { DB } from '@/db'
import { mediaFailure } from '../errors'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { eventMedia, ideaMedia, mediaAsset, registryItemMedia } from '@/db/schema/media.schema'
import { idea, registryItem } from '@/db/schema/planning.schema'

import type { PrepareEventMediaUploadInput } from '../contracts/media.contracts'
import type { PrepareNativeMediaUploadInput } from '../contracts/media.contracts'
import { visibleMediaPredicate } from '@/server/moderation/repos/media-visibility'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'

/** Native scope IDs identify events, never Better Auth organizations.
 * Resolve storage ownership from the event after checking its participant. */
export function getNativeMediaActorContext(input: { scopeId: string; userId: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [context] = yield* db
      .select({ organizationId: event.organizationId, parentEventId: event.parentEventId })
      .from(workspacePerson)
      .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
      .innerJoin(event, eq(event.id, eventParticipant.eventId))
      .where(
        and(
          eq(event.id, input.scopeId),
          eq(workspacePerson.userId, input.userId),
          eq(event.organizationId, workspacePerson.organizationId),
          inArray(eventParticipant.role, ['host', 'collaborator']),
          ne(eventParticipant.planningPermission, 'view_only'),
          retainedEventAccess(input.userId, event.id)
        )
      )
      .limit(1)

    return context ?? null
  })
}

export function upsertPendingNativeMedia(input: {
  organizationId: string
  uploadedByUserId: string
  bucket: string
  storageKey: string
  media: PrepareNativeMediaUploadInput
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [inserted] = yield* db
      .insert(mediaAsset)
      .values({
        id: input.media.mediaAssetId,
        organizationId: input.organizationId,
        uploadedByUserId: input.uploadedByUserId,
        kind: 'image',
        status: 'pending',
        visibility: 'private',
        storageProvider: 'r2',
        bucket: input.bucket,
        storageKey: input.storageKey,
        originalFilename: input.media.originalFilename,
        contentType: input.media.contentType,
        byteSize: input.media.byteSize,
      })
      .onConflictDoNothing({ target: mediaAsset.id })
      .returning({
        id: mediaAsset.id,
        organizationId: mediaAsset.organizationId,
        uploadedByUserId: mediaAsset.uploadedByUserId,
        status: mediaAsset.status,
      })

    if (inserted) return inserted

    const [existing] = yield* db
      .select({
        id: mediaAsset.id,
        organizationId: mediaAsset.organizationId,
        uploadedByUserId: mediaAsset.uploadedByUserId,
        status: mediaAsset.status,
        bucket: mediaAsset.bucket,
        storageKey: mediaAsset.storageKey,
      })
      .from(mediaAsset)
      .where(eq(mediaAsset.id, input.media.mediaAssetId))
      .limit(1)
    if (
      !existing ||
      existing.organizationId !== input.organizationId ||
      existing.uploadedByUserId !== input.uploadedByUserId ||
      existing.bucket !== input.bucket ||
      existing.storageKey !== input.storageKey ||
      (existing.status !== 'pending' && existing.status !== 'failed')
    ) {
      return yield* Effect.fail(mediaFailure('MEDIA_INVALID_STATE'))
    }

    // Reuse the durable native transfer ID after a failed PUT/finalize. Never
    // reopen ready/deleted assets or move ownership or storage on a retry.
    const [retried] = yield* db
      .update(mediaAsset)
      .set({
        status: 'pending',
        checksum: null,
        originalFilename: input.media.originalFilename,
        contentType: input.media.contentType,
        byteSize: input.media.byteSize,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mediaAsset.id, input.media.mediaAssetId),
          eq(mediaAsset.organizationId, input.organizationId),
          eq(mediaAsset.uploadedByUserId, input.uploadedByUserId),
          eq(mediaAsset.bucket, input.bucket),
          eq(mediaAsset.storageKey, input.storageKey),
          inArray(mediaAsset.status, ['pending', 'failed'])
        )
      )
      .returning({
        id: mediaAsset.id,
        organizationId: mediaAsset.organizationId,
        uploadedByUserId: mediaAsset.uploadedByUserId,
        status: mediaAsset.status,
      })
    if (!retried) return yield* Effect.fail(mediaFailure('MEDIA_INVALID_STATE'))
    return retried
  })
}

export function getNativeMediaAccessContext(input: { mediaAssetId: string; userId: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [context] = yield* db
      .select({
        mediaAssetId: mediaAsset.id,
        eventId: event.id,
        parentEventId: event.parentEventId,
        planningPermission: eventParticipant.planningPermission,
        organizationId: mediaAsset.organizationId,
        uploadedByUserId: mediaAsset.uploadedByUserId,
        status: mediaAsset.status,
        bucket: mediaAsset.bucket,
        storageKey: mediaAsset.storageKey,
        contentType: mediaAsset.contentType,
        byteSize: mediaAsset.byteSize,
      })
      .from(mediaAsset)
      .innerJoin(
        workspacePerson,
        and(
          eq(workspacePerson.organizationId, mediaAsset.organizationId),
          eq(workspacePerson.userId, input.userId)
        )
      )
      .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
      .innerJoin(event, eq(event.id, eventParticipant.eventId))
      .where(
        and(
          eq(mediaAsset.id, input.mediaAssetId),
          eq(event.organizationId, workspacePerson.organizationId),
          eq(event.organizationId, mediaAsset.organizationId),
          retainedEventAccess(input.userId, event.id),
          inArray(eventParticipant.role, ['host', 'collaborator']),
          or(
            // Root native workspaces retain their existing organization-wide media access.
            isNull(event.parentEventId),
            and(
              isNotNull(event.parentEventId),
              or(
                and(
                  eq(mediaAsset.uploadedByUserId, input.userId),
                  sql`starts_with(${mediaAsset.storageKey}, concat('workspaces/', ${event.organizationId}, '/media/events/', ${event.id}, '/', ${mediaAsset.id}, '/original.'))`
                ),
                sql`exists (select 1 from ${eventMedia}
                  where ${eventMedia.mediaAssetId} = ${mediaAsset.id}
                    and ${eventMedia.eventId} = ${event.id}
                    and ${eventMedia.organizationId} = ${event.organizationId})`,
                sql`exists (select 1 from ${ideaMedia}
                  inner join ${idea} on ${idea.id} = ${ideaMedia.ideaId}
                    and ${idea.organizationId} = ${ideaMedia.organizationId}
                  where ${ideaMedia.mediaAssetId} = ${mediaAsset.id}
                    and ${idea.eventId} = ${event.id}
                    and ${ideaMedia.organizationId} = ${event.organizationId})`,
                sql`exists (select 1 from ${registryItemMedia}
                  inner join ${registryItem} on ${registryItem.id} = ${registryItemMedia.registryItemId}
                    and ${registryItem.organizationId} = ${registryItemMedia.organizationId}
                  where ${registryItemMedia.mediaAssetId} = ${mediaAsset.id}
                    and ${registryItem.eventId} = ${event.id}
                    and ${registryItemMedia.organizationId} = ${event.organizationId})`
              )
            )
          )
        )
      )
      .limit(1)

    return context ?? null
  })
}

export function markNativeMediaReady(input: { mediaAssetId: string; checksum: string | null }) {
  return Effect.gen(function* () {
    const db = yield* DB
    yield* db
      .update(mediaAsset)
      .set({ status: 'ready', checksum: input.checksum, updatedAt: new Date() })
      .where(eq(mediaAsset.id, input.mediaAssetId))
  })
}

export function getEventMediaActorContext(input: { eventId: string; userId: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [context] = yield* db
      .select({
        organizationId: event.organizationId,
        role: eventParticipant.role,
        planningPermission: eventParticipant.planningPermission,
      })
      .from(event)
      .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
      .innerJoin(
        workspacePerson,
        and(
          eq(workspacePerson.id, eventParticipant.personId),
          eq(workspacePerson.organizationId, event.organizationId),
          eq(workspacePerson.userId, input.userId)
        )
      )
      .where(eq(event.id, input.eventId))
      .limit(1)

    return context ?? null
  })
}

export function createPendingEventMedia(input: {
  id: string
  organizationId: string
  uploadedByUserId: string
  bucket: string
  storageKey: string
  media: PrepareEventMediaUploadInput
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    return yield* db.transaction((transaction) =>
      Effect.gen(function* () {
        const [asset] = yield* transaction
          .insert(mediaAsset)
          .values({
            id: input.id,
            organizationId: input.organizationId,
            uploadedByUserId: input.uploadedByUserId,
            kind: 'image',
            status: 'pending',
            visibility: 'private',
            storageProvider: 'r2',
            bucket: input.bucket,
            storageKey: input.storageKey,
            originalFilename: input.media.originalFilename,
            displayName: input.media.displayName,
            contentType: input.media.contentType,
            byteSize: input.media.byteSize,
          })
          .returning({ id: mediaAsset.id })

        if (!asset) return yield* Effect.fail(mediaFailure('MEDIA_CREATE_FAILED'))

        yield* transaction.insert(eventMedia).values({
          organizationId: input.organizationId,
          eventId: input.media.eventId,
          mediaAssetId: asset.id,
          role: input.media.role,
        })

        return asset
      })
    )
  })
}

export function getEventMediaAccessContext(input: { mediaAssetId: string; userId: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [context] = yield* db
      .select({
        mediaAssetId: mediaAsset.id,
        eventId: eventMedia.eventId,
        eventMediaId: eventMedia.id,
        organizationId: mediaAsset.organizationId,
        uploadedByUserId: mediaAsset.uploadedByUserId,
        role: eventMedia.role,
        status: mediaAsset.status,
        bucket: mediaAsset.bucket,
        storageKey: mediaAsset.storageKey,
        contentType: mediaAsset.contentType,
        byteSize: mediaAsset.byteSize,
        participantRole: eventParticipant.role,
        planningPermission: eventParticipant.planningPermission,
      })
      .from(mediaAsset)
      .innerJoin(eventMedia, eq(eventMedia.mediaAssetId, mediaAsset.id))
      .innerJoin(
        event,
        and(
          eq(event.id, eventMedia.eventId),
          eq(event.organizationId, eventMedia.organizationId),
          eq(event.organizationId, mediaAsset.organizationId)
        )
      )
      .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
      .innerJoin(
        workspacePerson,
        and(
          eq(workspacePerson.id, eventParticipant.personId),
          eq(workspacePerson.organizationId, event.organizationId),
          eq(workspacePerson.userId, input.userId)
        )
      )
      .where(
        and(eq(mediaAsset.id, input.mediaAssetId), retainedEventAccess(input.userId, event.id))
      )
      .limit(1)

    return context ?? null
  })
}

export function markEventMediaReady(input: {
  mediaAssetId: string
  eventMediaId: string
  eventId: string
  role: 'cover' | 'background' | 'gallery'
  checksum: string | null
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    yield* db.transaction((transaction) =>
      Effect.gen(function* () {
        if (input.role !== 'gallery') {
          yield* transaction
            .delete(eventMedia)
            .where(
              and(
                eq(eventMedia.eventId, input.eventId),
                eq(eventMedia.role, input.role),
                ne(eventMedia.id, input.eventMediaId)
              )
            )
        }

        yield* transaction
          .update(mediaAsset)
          .set({
            status: 'ready',
            checksum: input.checksum,
            updatedAt: new Date(),
          })
          .where(eq(mediaAsset.id, input.mediaAssetId))
      })
    )
  })
}

export function markEventMediaFailed(mediaAssetId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    yield* db
      .update(mediaAsset)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(mediaAsset.id, mediaAssetId))
  })
}

export function listReadyEventMedia(eventId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    return yield* db
      .select({
        id: mediaAsset.id,
        role: eventMedia.role,
        displayName: mediaAsset.displayName,
        altText: mediaAsset.altText,
        contentType: mediaAsset.contentType,
        byteSize: mediaAsset.byteSize,
        width: mediaAsset.width,
        height: mediaAsset.height,
      })
      .from(eventMedia)
      .innerJoin(mediaAsset, eq(mediaAsset.id, eventMedia.mediaAssetId))
      .where(and(eq(eventMedia.eventId, eventId), visibleMediaPredicate()))
      .orderBy(asc(eventMedia.sortOrder), asc(eventMedia.createdAt))
  })
}

export function canReadMedia(input: { userId: string; mediaAssetId: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [asset] = yield* db
      .select({ id: mediaAsset.id })
      .from(mediaAsset)
      .where(and(eq(mediaAsset.id, input.mediaAssetId), visibleMediaPredicate(input.userId)))
      .limit(1)
    return Boolean(asset)
  })
}
