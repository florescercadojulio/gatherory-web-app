import { randomUUID } from "node:crypto"

import {
  hasEventPermission,
  planningPermissionFromDatabase,
  type EventPermissions,
} from "@/lib/permissions"

import type {
  FinalizeEventMediaUploadInput,
  PrepareEventMediaUploadInput,
} from "../contracts/media.contracts"
import {
  createMediaReadUrl,
  createMediaUploadUrl,
  deleteMediaObject,
  inspectMediaObject,
} from "../connectors/media-storage.con"
import { MediaKeys } from "../media.keys"
import {
  createPendingEventMedia,
  getEventMediaAccessContext,
  getEventMediaActorContext,
  markEventMediaFailed,
  markEventMediaReady,
} from "../repos/media.repo"

function requireCapabilities(input: {
  role: "host" | "collaborator" | "guest"
  planningPermission: "manage" | "contribute" | "view_only"
  required: EventPermissions
}) {
  if (
    !hasEventPermission(
      {
        role: input.role,
        planningPermission: planningPermissionFromDatabase(
          input.planningPermission,
        ),
      },
      input.required,
    )
  ) {
    throw new Error("MEDIA_FORBIDDEN")
  }
}

export async function prepareEventMediaUploadWorkflow(input: {
  userId: string
  media: PrepareEventMediaUploadInput
}) {
  const actor = await getEventMediaActorContext({
    eventId: input.media.eventId,
    userId: input.userId,
  })
  if (!actor) throw new Error("MEDIA_FORBIDDEN")

  requireCapabilities({
    role: actor.role,
    planningPermission: actor.planningPermission,
    required: {
      media: input.media.role === "gallery" ? ["upload"] : ["manage"],
    },
  })

  const mediaAssetId = randomUUID()
  const storageKey = MediaKeys.original({
    workspaceId: actor.organizationId,
    mediaAssetId,
    contentType: input.media.contentType,
  })
  const signedUpload = await createMediaUploadUrl({
    key: storageKey,
    contentType: input.media.contentType,
    mediaAssetId,
    visibility: "private",
  })

  await createPendingEventMedia({
    id: mediaAssetId,
    organizationId: actor.organizationId,
    uploadedByUserId: input.userId,
    bucket: signedUpload.bucket,
    storageKey,
    media: input.media,
  })

  return {
    mediaAssetId,
    uploadUrl: signedUpload.uploadUrl,
    method: "PUT" as const,
    requiredHeaders: { "Content-Type": input.media.contentType },
    expiresAt: new Date(
      Date.now() + signedUpload.expiresInSeconds * 1_000,
    ).toISOString(),
  }
}

export async function finalizeEventMediaUploadWorkflow(input: {
  userId: string
  media: FinalizeEventMediaUploadInput
}) {
  const context = await getEventMediaAccessContext({
    mediaAssetId: input.media.mediaAssetId,
    userId: input.userId,
  })
  if (!context) throw new Error("MEDIA_FORBIDDEN")

  requireCapabilities({
    role: context.participantRole,
    planningPermission: context.planningPermission,
    required: {
      media: context.role === "gallery" ? ["upload"] : ["manage"],
    },
  })

  if (context.status === "ready") {
    return {
      mediaAssetId: context.mediaAssetId,
      url: await createMediaReadUrl({
        bucket: context.bucket,
        key: context.storageKey,
      }),
    }
  }
  if (context.status !== "pending") throw new Error("MEDIA_INVALID_STATE")

  const storedObject = await inspectMediaObject({
    bucket: context.bucket,
    key: context.storageKey,
  })
  const matchesPendingAsset =
    storedObject.mediaAssetId === context.mediaAssetId &&
    storedObject.contentType === context.contentType &&
    storedObject.byteSize === context.byteSize

  if (!matchesPendingAsset) {
    await markEventMediaFailed(context.mediaAssetId)
    await deleteMediaObject({
      bucket: context.bucket,
      key: context.storageKey,
    }).catch(() => undefined)
    throw new Error("MEDIA_UPLOAD_MISMATCH")
  }

  await markEventMediaReady({
    mediaAssetId: context.mediaAssetId,
    eventMediaId: context.eventMediaId,
    eventId: context.eventId,
    role: context.role,
    checksum: storedObject.checksum,
  })

  return {
    mediaAssetId: context.mediaAssetId,
    url: await createMediaReadUrl({
      bucket: context.bucket,
      key: context.storageKey,
    }),
  }
}

export async function getEventMediaUrlWorkflow(input: {
  userId: string
  mediaAssetId: string
}) {
  const context = await getEventMediaAccessContext({
    mediaAssetId: input.mediaAssetId,
    userId: input.userId,
  })
  if (!context || context.status !== "ready") {
    throw new Error("MEDIA_NOT_FOUND")
  }

  requireCapabilities({
    role: context.participantRole,
    planningPermission: context.planningPermission,
    required: { media: ["read"] },
  })

  return {
    mediaAssetId: context.mediaAssetId,
    url: await createMediaReadUrl({
      bucket: context.bucket,
      key: context.storageKey,
    }),
  }
}
