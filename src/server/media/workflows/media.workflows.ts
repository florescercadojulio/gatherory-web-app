import { randomUUID } from "node:crypto"
import { Effect } from "effect"

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
    return Effect.fail(new Error("MEDIA_FORBIDDEN"))
  }

  return Effect.void
}

function externalOperation<A>(operation: () => Promise<A>) {
  return Effect.tryPromise({ try: operation, catch: (error) => error })
}

export function prepareEventMediaUploadWorkflow(input: {
  userId: string
  media: PrepareEventMediaUploadInput
}) {
  return Effect.gen(function* () {
    const actor = yield* getEventMediaActorContext({
      eventId: input.media.eventId,
      userId: input.userId,
    })
    if (!actor) return yield* Effect.fail(new Error("MEDIA_FORBIDDEN"))

    yield* requireCapabilities({
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
    const signedUpload = yield* externalOperation(() =>
      createMediaUploadUrl({
        key: storageKey,
        contentType: input.media.contentType,
        mediaAssetId,
        visibility: "private",
      }),
    )

    yield* createPendingEventMedia({
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
  })
}

export function finalizeEventMediaUploadWorkflow(input: {
  userId: string
  media: FinalizeEventMediaUploadInput
}) {
  return Effect.gen(function* () {
    const context = yield* getEventMediaAccessContext({
      mediaAssetId: input.media.mediaAssetId,
      userId: input.userId,
    })
    if (!context) return yield* Effect.fail(new Error("MEDIA_FORBIDDEN"))

    yield* requireCapabilities({
      role: context.participantRole,
      planningPermission: context.planningPermission,
      required: {
        media: context.role === "gallery" ? ["upload"] : ["manage"],
      },
    })

    if (context.status === "ready") {
      const url = yield* externalOperation(() =>
        createMediaReadUrl({
          bucket: context.bucket,
          key: context.storageKey,
        }),
      )
      return { mediaAssetId: context.mediaAssetId, url }
    }
    if (context.status !== "pending")
      return yield* Effect.fail(new Error("MEDIA_INVALID_STATE"))

    const storedObject = yield* externalOperation(() =>
      inspectMediaObject({
        bucket: context.bucket,
        key: context.storageKey,
      }),
    )
    const matchesPendingAsset =
      storedObject.mediaAssetId === context.mediaAssetId &&
      storedObject.contentType === context.contentType &&
      storedObject.byteSize === context.byteSize

    if (!matchesPendingAsset) {
      yield* markEventMediaFailed(context.mediaAssetId)
      yield* externalOperation(() =>
        deleteMediaObject({
          bucket: context.bucket,
          key: context.storageKey,
        }).catch(() => undefined),
      )
      return yield* Effect.fail(new Error("MEDIA_UPLOAD_MISMATCH"))
    }

    yield* markEventMediaReady({
      mediaAssetId: context.mediaAssetId,
      eventMediaId: context.eventMediaId,
      eventId: context.eventId,
      role: context.role,
      checksum: storedObject.checksum,
    })

    const url = yield* externalOperation(() =>
      createMediaReadUrl({
        bucket: context.bucket,
        key: context.storageKey,
      }),
    )
    return { mediaAssetId: context.mediaAssetId, url }
  })
}

export function getEventMediaUrlWorkflow(input: {
  userId: string
  mediaAssetId: string
}) {
  return Effect.gen(function* () {
    const context = yield* getEventMediaAccessContext({
      mediaAssetId: input.mediaAssetId,
      userId: input.userId,
    })
    if (!context || context.status !== "ready")
      return yield* Effect.fail(new Error("MEDIA_NOT_FOUND"))

    yield* requireCapabilities({
      role: context.participantRole,
      planningPermission: context.planningPermission,
      required: { media: ["read"] },
    })

    const url = yield* externalOperation(() =>
      createMediaReadUrl({
        bucket: context.bucket,
        key: context.storageKey,
      }),
    )
    return { mediaAssetId: context.mediaAssetId, url }
  })
}
