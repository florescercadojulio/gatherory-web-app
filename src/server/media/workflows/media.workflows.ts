import { randomUUID } from "node:crypto"
import { Effect } from "effect"

import {
  hasEventPermission,
  planningPermissionFromDatabase,
  type EventPermissions,
} from "@/lib/permissions"

import type {
  FinalizeEventMediaUploadInput,
  NativeMediaAssetInput,
  PrepareEventMediaUploadInput,
  PrepareNativeMediaUploadInput,
} from "../contracts/media.contracts"
import {
  createMediaReadUrl,
  createMediaUploadUrl,
  deleteMediaObject,
  inspectMediaObject,
} from "../connectors/media-storage.con"
import { MediaKeys } from "../media.keys"
import { canReadMedia } from "@/server/moderation/media-visibility"
import { EntityNotFoundError } from "@/server/effect"

const unavailableMedia = () => new EntityNotFoundError({ category: "not_found", code: "MEDIA_NOT_FOUND", userMessage: "This image is no longer available." })
import {
  createPendingEventMedia,
  getEventMediaAccessContext,
  getEventMediaActorContext,
  getNativeMediaAccessContext,
  getNativeMediaActorContext,
  markEventMediaFailed,
  markEventMediaReady,
  markNativeMediaReady,
  upsertPendingNativeMedia,
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

function logUploadMismatch(
  expected: { mediaAssetId: string; contentType: string; byteSize: number },
  stored: Awaited<ReturnType<typeof inspectMediaObject>>,
) {
  // Keep the correlation annotations, but never log credentials or signed URLs.
  return Effect.logWarning("Media upload verification mismatch").pipe(
    Effect.annotateLogs({
      mediaAssetId: expected.mediaAssetId,
      assetMetadataMatches: stored.mediaAssetId === expected.mediaAssetId,
      expectedContentType: expected.contentType,
      storedContentType: stored.contentType,
      expectedByteSize: expected.byteSize,
      storedByteSize: stored.byteSize,
    }),
  )
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
      requiredHeaders: signedUpload.requiredHeaders,
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
      if (!(yield* canReadMedia(input.userId, context.mediaAssetId))) return yield* Effect.fail(unavailableMedia())
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
      yield* logUploadMismatch(context, storedObject)
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
    if (!context || context.status !== "ready" || !(yield* canReadMedia(input.userId, input.mediaAssetId)))
      return yield* Effect.fail(unavailableMedia())

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

export function prepareNativeMediaUploadWorkflow(input: {
  userId: string
  media: PrepareNativeMediaUploadInput
}) {
  return Effect.gen(function* () {
    const actor = yield* getNativeMediaActorContext({
      scopeId: input.media.scopeId,
      userId: input.userId,
    })
    if (!actor) return yield* Effect.fail(new Error("MEDIA_FORBIDDEN"))

    const storageKey = MediaKeys.original({
      workspaceId: actor.organizationId,
      mediaAssetId: input.media.mediaAssetId,
      contentType: input.media.contentType,
    })
    const signedUpload = yield* externalOperation(() =>
      createMediaUploadUrl({
        key: storageKey,
        contentType: input.media.contentType,
        mediaAssetId: input.media.mediaAssetId,
        visibility: "private",
      }),
    )

    yield* upsertPendingNativeMedia({
      organizationId: actor.organizationId,
      uploadedByUserId: input.userId,
      bucket: signedUpload.bucket,
      storageKey,
      media: input.media,
    })

    return {
      mediaAssetId: input.media.mediaAssetId,
      uploadUrl: signedUpload.uploadUrl,
      method: "PUT" as const,
      requiredHeaders: signedUpload.requiredHeaders,
      expiresAt: new Date(
        Date.now() + signedUpload.expiresInSeconds * 1_000,
      ).toISOString(),
    }
  })
}

export function finalizeNativeMediaUploadWorkflow(input: {
  userId: string
  media: NativeMediaAssetInput
}) {
  return Effect.gen(function* () {
    const context = yield* getNativeMediaAccessContext({
      mediaAssetId: input.media.mediaAssetId,
      userId: input.userId,
    })
    if (!context || context.uploadedByUserId !== input.userId) {
      return yield* Effect.fail(new Error("MEDIA_FORBIDDEN"))
    }

    if (context.status === "ready") {
      if (!(yield* canReadMedia(input.userId, context.mediaAssetId))) return yield* Effect.fail(unavailableMedia())
      const url = yield* externalOperation(() =>
        createMediaReadUrl({ bucket: context.bucket, key: context.storageKey }),
      )
      return { mediaAssetId: context.mediaAssetId, url }
    }
    if (context.status !== "pending") {
      return yield* Effect.fail(new Error("MEDIA_INVALID_STATE"))
    }

    const storedObject = yield* externalOperation(() =>
      inspectMediaObject({ bucket: context.bucket, key: context.storageKey }),
    )
    const matchesPendingAsset =
      storedObject.mediaAssetId === context.mediaAssetId &&
      storedObject.contentType === context.contentType &&
      storedObject.byteSize === context.byteSize

    if (!matchesPendingAsset) {
      yield* logUploadMismatch(context, storedObject)
      yield* markEventMediaFailed(context.mediaAssetId)
      yield* externalOperation(() =>
        deleteMediaObject({ bucket: context.bucket, key: context.storageKey }).catch(
          () => undefined,
        ),
      )
      return yield* Effect.fail(new Error("MEDIA_UPLOAD_MISMATCH"))
    }

    yield* markNativeMediaReady({
      mediaAssetId: context.mediaAssetId,
      checksum: storedObject.checksum,
    })
    const url = yield* externalOperation(() =>
      createMediaReadUrl({ bucket: context.bucket, key: context.storageKey }),
    )
    return { mediaAssetId: context.mediaAssetId, url }
  })
}

export function getNativeMediaUrlWorkflow(input: {
  userId: string
  mediaAssetId: string
}) {
  return Effect.gen(function* () {
    const context = yield* getNativeMediaAccessContext(input)
    if (!context || context.status !== "ready" || !(yield* canReadMedia(input.userId, input.mediaAssetId))) {
      return yield* Effect.fail(unavailableMedia())
    }
    const url = yield* externalOperation(() =>
      createMediaReadUrl({ bucket: context.bucket, key: context.storageKey }),
    )
    return { mediaAssetId: context.mediaAssetId, url }
  })
}
