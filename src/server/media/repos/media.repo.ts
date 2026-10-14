import { and, asc, eq, ne, isNull, inArray } from 'drizzle-orm'
import { Effect } from 'effect'

import { DB } from '@/db'
import { mediaFailure } from '../errors'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { eventMedia, mediaAsset } from '@/db/schema/media.schema'

import type { PrepareEventMediaUploadInput } from '../contracts/media.contracts'
import type { PrepareNativeMediaUploadInput } from '../contracts/media.contracts'
import { visibleMediaPredicate } from '@/server/moderation/media-visibility'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'

/** Native scope IDs identify main events, never Better Auth organizations.
 * Resolve storage ownership from the event after checking its participant. */
export function getNativeMediaActorContext(input: { scopeId: string; userId: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [context] = yield* db
      .select({ organizationId: event.organizationId })
      .from(workspacePerson)
      .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
      .innerJoin(event, eq(event.id, eventParticipant.eventId))
      .where(
        and(
          eq(event.id, input.scopeId),
          eq(workspacePerson.userId, input.userId),
          isNull(event.parentEventId),
          eq(event.organizationId, workspacePerson.organizationId),
          inArray(eventParticipant.role, ['host', 'collaborator']),
          ne(eventParticipant.planningPermission, 'view_only')
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
          isNull(event.parentEventId),
          eq(event.organizationId, workspacePerson.organizationId),
          retainedEventAccess(input.userId, event.id),
          inArray(eventParticipant.role, ['host', 'collaborator'])
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
