import { randomUUID } from 'node:crypto'
import { Effect, Layer } from 'effect'

import {
  hasEventPermission,
  planningPermissionFromDatabase,
  type EventPermissions,
} from '@/lib/permissions'

import type {
  FinalizeEventMediaUploadInput,
  NativeMediaAssetInput,
  PrepareEventMediaUploadInput,
  PrepareNativeMediaUploadInput,
} from '../contracts/media.contracts'
import { MediaStorage } from '../connectors/media-storage.con.contract'
import { MediaRepo } from '../repos/media.repo.contract'
import { MediaService } from './media.service'
import { MediaKeys } from '../media.keys'
import { EntityNotFoundError } from '@/lib/domain-errors'
import { mediaFailure } from '../errors'

const unavailableMedia = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'MEDIA_NOT_FOUND',
    userMessageKey: 'serverErrors.MEDIA_NOT_FOUND',
  })

function requireCapabilities(input: {
  role: 'host' | 'collaborator' | 'guest'
  planningPermission: 'manage' | 'contribute' | 'view_only'
  required: EventPermissions
}) {
  if (
    !hasEventPermission(
      {
        role: input.role,
        planningPermission: planningPermissionFromDatabase(input.planningPermission),
      },
      input.required
    )
  ) {
    return Effect.fail(mediaFailure('MEDIA_FORBIDDEN'))
  }

  return Effect.void
}

function logUploadMismatch(
  expected: { mediaAssetId: string; contentType: string; byteSize: number },
  stored: { mediaAssetId: string | null; contentType: string | null; byteSize: number | null }
) {
  // Keep the correlation annotations, but never log credentials or signed URLs.
  return Effect.logWarning('Media upload verification mismatch').pipe(
    Effect.annotateLogs({
      mediaAssetId: expected.mediaAssetId,
      assetMetadataMatches: stored.mediaAssetId === expected.mediaAssetId,
      expectedContentType: expected.contentType,
      storedContentType: stored.contentType,
      expectedByteSize: expected.byteSize,
      storedByteSize: stored.byteSize,
    })
  )
}

function prepareEventUpload(
  input: {
    userId: string
    media: PrepareEventMediaUploadInput
  },
  repo: MediaRepo['Service'],
  storage: MediaStorage['Service']
) {
  return Effect.gen(function* () {
    const actor = yield* repo.getEventMediaActorContext({
      eventId: input.media.eventId,
      userId: input.userId,
    })
    if (!actor)
      return yield* Effect.fail(
        mediaFailure(
          'MEDIA_FORBIDDEN',
          `Event prepare requires participation; event=${input.media.eventId}`
        )
      )

    yield* requireCapabilities({
      role: actor.role,
      planningPermission: actor.planningPermission,
      required: {
        media: input.media.role === 'gallery' ? ['upload'] : ['manage'],
      },
    })

    const mediaAssetId = randomUUID()
    const storageKey = MediaKeys.original({
      workspaceId: actor.organizationId,
      mediaAssetId,
      contentType: input.media.contentType,
    })
    const signedUpload = yield* storage.createUploadUrl({
      key: storageKey,
      contentType: input.media.contentType,
      mediaAssetId,
      visibility: 'private',
    })

    yield* repo.createPendingEventMedia({
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
      method: 'PUT' as const,
      requiredHeaders: signedUpload.requiredHeaders,
      expiresAt: new Date(Date.now() + signedUpload.expiresInSeconds * 1_000).toISOString(),
    }
  })
}

function finalizeEventUpload(
  input: {
    userId: string
    media: FinalizeEventMediaUploadInput
  },
  repo: MediaRepo['Service'],
  storage: MediaStorage['Service']
) {
  return Effect.gen(function* () {
    const context = yield* repo.getEventMediaAccessContext({
      mediaAssetId: input.media.mediaAssetId,
      userId: input.userId,
    })
    if (!context) return yield* Effect.fail(mediaFailure('MEDIA_FORBIDDEN'))

    yield* requireCapabilities({
      role: context.participantRole,
      planningPermission: context.planningPermission,
      required: {
        media: context.role === 'gallery' ? ['upload'] : ['manage'],
      },
    })

    if (context.status === 'ready') {
      if (!(yield* repo.canReadMedia({ userId: input.userId, mediaAssetId: context.mediaAssetId })))
        return yield* Effect.fail(unavailableMedia())
      const url = yield* storage.createReadUrl({
        bucket: context.bucket,
        key: context.storageKey,
      })
      return { mediaAssetId: context.mediaAssetId, url }
    }
    if (context.status !== 'pending') return yield* Effect.fail(mediaFailure('MEDIA_INVALID_STATE'))

    const storedObject = yield* storage.inspectObject({
      bucket: context.bucket,
      key: context.storageKey,
    })
    const matchesPendingAsset =
      storedObject.mediaAssetId === context.mediaAssetId &&
      storedObject.contentType === context.contentType &&
      storedObject.byteSize === context.byteSize

    if (!matchesPendingAsset) {
      yield* logUploadMismatch(context, storedObject)
      yield* repo.markEventMediaFailed(context.mediaAssetId)
      yield* storage
        .deleteObject({
          bucket: context.bucket,
          key: context.storageKey,
        })
        .pipe(Effect.catch(() => Effect.void))
      return yield* Effect.fail(mediaFailure('MEDIA_UPLOAD_MISMATCH'))
    }

    yield* repo.markEventMediaReady({
      mediaAssetId: context.mediaAssetId,
      eventMediaId: context.eventMediaId,
      eventId: context.eventId,
      role: context.role,
      checksum: storedObject.checksum,
    })

    const url = yield* storage.createReadUrl({
      bucket: context.bucket,
      key: context.storageKey,
    })
    return { mediaAssetId: context.mediaAssetId, url }
  })
}

function getEventReadUrl(
  input: { userId: string; mediaAssetId: string },
  repo: MediaRepo['Service'],
  storage: MediaStorage['Service']
) {
  return Effect.gen(function* () {
    const context = yield* repo.getEventMediaAccessContext({
      mediaAssetId: input.mediaAssetId,
      userId: input.userId,
    })
    if (
      !context ||
      context.status !== 'ready' ||
      !(yield* repo.canReadMedia({ userId: input.userId, mediaAssetId: input.mediaAssetId }))
    )
      return yield* Effect.fail(unavailableMedia())

    yield* requireCapabilities({
      role: context.participantRole,
      planningPermission: context.planningPermission,
      required: { media: ['read'] },
    })

    const url = yield* storage.createReadUrl({
      bucket: context.bucket,
      key: context.storageKey,
    })
    return { mediaAssetId: context.mediaAssetId, url }
  })
}

function prepareNativeUpload(
  input: {
    userId: string
    media: PrepareNativeMediaUploadInput
  },
  repo: MediaRepo['Service'],
  storage: MediaStorage['Service']
) {
  return Effect.gen(function* () {
    const actor = yield* repo.getNativeMediaActorContext({
      scopeId: input.media.scopeId,
      userId: input.userId,
    })
    if (!actor)
      return yield* Effect.fail(
        mediaFailure(
          'MEDIA_FORBIDDEN',
          `Native prepare requires writable root-event participation; scope=${input.media.scopeId}`
        )
      )

    const storageKey = MediaKeys.original({
      workspaceId: actor.organizationId,
      mediaAssetId: input.media.mediaAssetId,
      contentType: input.media.contentType,
    })
    const signedUpload = yield* storage.createUploadUrl({
      key: storageKey,
      contentType: input.media.contentType,
      mediaAssetId: input.media.mediaAssetId,
      visibility: 'private',
    })

    yield* repo.upsertPendingNativeMedia({
      organizationId: actor.organizationId,
      uploadedByUserId: input.userId,
      bucket: signedUpload.bucket,
      storageKey,
      media: input.media,
    })

    return {
      mediaAssetId: input.media.mediaAssetId,
      uploadUrl: signedUpload.uploadUrl,
      method: 'PUT' as const,
      requiredHeaders: signedUpload.requiredHeaders,
      expiresAt: new Date(Date.now() + signedUpload.expiresInSeconds * 1_000).toISOString(),
    }
  })
}

function finalizeNativeUpload(
  input: {
    userId: string
    media: NativeMediaAssetInput
  },
  repo: MediaRepo['Service'],
  storage: MediaStorage['Service']
) {
  return Effect.gen(function* () {
    const context = yield* repo.getNativeMediaAccessContext({
      mediaAssetId: input.media.mediaAssetId,
      userId: input.userId,
    })
    if (!context || context.uploadedByUserId !== input.userId) {
      return yield* Effect.fail(
        mediaFailure(
          'MEDIA_FORBIDDEN',
          `Native finalize denied; asset=${input.media.mediaAssetId}; reason=${context ? 'uploader_mismatch' : 'no_media_access'}`
        )
      )
    }

    if (context.status === 'ready') {
      if (!(yield* repo.canReadMedia({ userId: input.userId, mediaAssetId: context.mediaAssetId })))
        return yield* Effect.fail(unavailableMedia())
      const url = yield* storage.createReadUrl({ bucket: context.bucket, key: context.storageKey })
      return { mediaAssetId: context.mediaAssetId, url }
    }
    if (context.status !== 'pending') {
      return yield* Effect.fail(mediaFailure('MEDIA_INVALID_STATE'))
    }

    const storedObject = yield* storage.inspectObject({
      bucket: context.bucket,
      key: context.storageKey,
    })
    const matchesPendingAsset =
      storedObject.mediaAssetId === context.mediaAssetId &&
      storedObject.contentType === context.contentType &&
      storedObject.byteSize === context.byteSize

    if (!matchesPendingAsset) {
      yield* logUploadMismatch(context, storedObject)
      yield* repo.markEventMediaFailed(context.mediaAssetId)
      yield* storage
        .deleteObject({ bucket: context.bucket, key: context.storageKey })
        .pipe(Effect.catch(() => Effect.void))
      return yield* Effect.fail(mediaFailure('MEDIA_UPLOAD_MISMATCH'))
    }

    yield* repo.markNativeMediaReady({
      mediaAssetId: context.mediaAssetId,
      checksum: storedObject.checksum,
    })
    const url = yield* storage.createReadUrl({ bucket: context.bucket, key: context.storageKey })
    return { mediaAssetId: context.mediaAssetId, url }
  })
}

function getNativeReadUrl(
  input: { userId: string; mediaAssetId: string },
  repo: MediaRepo['Service'],
  storage: MediaStorage['Service']
) {
  return Effect.gen(function* () {
    const context = yield* repo.getNativeMediaAccessContext(input)
    if (
      !context ||
      context.status !== 'ready' ||
      !(yield* repo.canReadMedia({ userId: input.userId, mediaAssetId: input.mediaAssetId }))
    ) {
      return yield* Effect.fail(unavailableMedia())
    }
    const url = yield* storage.createReadUrl({ bucket: context.bucket, key: context.storageKey })
    return { mediaAssetId: context.mediaAssetId, url }
  })
}

export const MediaServiceLive = Layer.effect(
  MediaService,
  Effect.gen(function* () {
    const repo = yield* MediaRepo
    const storage = yield* MediaStorage
    return {
      prepareEventUpload: (input) => prepareEventUpload(input, repo, storage),
      finalizeEventUpload: (input) => finalizeEventUpload(input, repo, storage),
      getEventReadUrl: (input) => getEventReadUrl(input, repo, storage),
      prepareNativeUpload: (input) => prepareNativeUpload(input, repo, storage),
      finalizeNativeUpload: (input) => finalizeNativeUpload(input, repo, storage),
      getNativeReadUrl: (input) => getNativeReadUrl(input, repo, storage),
    }
  })
)
