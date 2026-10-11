import { and, asc, eq, ne } from "drizzle-orm"

import { db } from "@/db"
import {
  event,
  eventParticipant,
  workspacePerson,
} from "@/db/schema/event.schema"
import { eventMedia, mediaAsset } from "@/db/schema/media.schema"

import type { PrepareEventMediaUploadInput } from "../contracts/media.contracts"

export async function getEventMediaActorContext(input: {
  eventId: string
  userId: string
}) {
  const [context] = await db
    .select({
      organizationId: event.organizationId,
      role: eventParticipant.role,
      planningPermission: eventParticipant.planningPermission,
    })
    .from(event)
    .innerJoin(
      eventParticipant,
      eq(eventParticipant.eventId, event.id),
    )
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.id, eventParticipant.personId),
        eq(workspacePerson.organizationId, event.organizationId),
        eq(workspacePerson.userId, input.userId),
      ),
    )
    .where(eq(event.id, input.eventId))
    .limit(1)

  return context ?? null
}

export async function createPendingEventMedia(input: {
  id: string
  organizationId: string
  uploadedByUserId: string
  bucket: string
  storageKey: string
  media: PrepareEventMediaUploadInput
}) {
  return db.transaction(async (transaction) => {
    const [asset] = await transaction
      .insert(mediaAsset)
      .values({
        id: input.id,
        organizationId: input.organizationId,
        uploadedByUserId: input.uploadedByUserId,
        kind: "image",
        status: "pending",
        visibility: "private",
        storageProvider: "r2",
        bucket: input.bucket,
        storageKey: input.storageKey,
        originalFilename: input.media.originalFilename,
        displayName: input.media.displayName,
        contentType: input.media.contentType,
        byteSize: input.media.byteSize,
      })
      .returning({ id: mediaAsset.id })

    if (!asset) throw new Error("MEDIA_CREATE_FAILED")

    await transaction.insert(eventMedia).values({
      organizationId: input.organizationId,
      eventId: input.media.eventId,
      mediaAssetId: asset.id,
      role: input.media.role,
    })

    return asset
  })
}

export async function getEventMediaAccessContext(input: {
  mediaAssetId: string
  userId: string
}) {
  const [context] = await db
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
        eq(event.organizationId, mediaAsset.organizationId),
      ),
    )
    .innerJoin(
      eventParticipant,
      eq(eventParticipant.eventId, event.id),
    )
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.id, eventParticipant.personId),
        eq(workspacePerson.organizationId, event.organizationId),
        eq(workspacePerson.userId, input.userId),
      ),
    )
    .where(eq(mediaAsset.id, input.mediaAssetId))
    .limit(1)

  return context ?? null
}

export async function markEventMediaReady(input: {
  mediaAssetId: string
  eventMediaId: string
  eventId: string
  role: "cover" | "background" | "gallery"
  checksum: string | null
}) {
  await db.transaction(async (transaction) => {
    if (input.role !== "gallery") {
      await transaction
        .delete(eventMedia)
        .where(
          and(
            eq(eventMedia.eventId, input.eventId),
            eq(eventMedia.role, input.role),
            ne(eventMedia.id, input.eventMediaId),
          ),
        )
    }

    await transaction
      .update(mediaAsset)
      .set({
        status: "ready",
        checksum: input.checksum,
        updatedAt: new Date(),
      })
      .where(eq(mediaAsset.id, input.mediaAssetId))
  })
}

export async function markEventMediaFailed(mediaAssetId: string) {
  await db
    .update(mediaAsset)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(mediaAsset.id, mediaAssetId))
}

export async function listReadyEventMedia(eventId: string) {
  return db
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
    .where(
      and(
        eq(eventMedia.eventId, eventId),
        eq(mediaAsset.status, "ready"),
      ),
    )
    .orderBy(asc(eventMedia.sortOrder), asc(eventMedia.createdAt))
}
