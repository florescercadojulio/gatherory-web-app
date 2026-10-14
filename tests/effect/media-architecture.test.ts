import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'

import { MediaStorage } from '@/server/media/connectors/media-storage.con.contract'
import { MediaRepo } from '@/server/media/repos/media.repo.contract'
import { MediaService } from '@/server/media/services/media.service'
import { MediaServiceLive } from '@/server/media/services/media.service.live'
import { MediaError } from '@/server/media/errors'

const uploadInput = {
  userId: 'user-1',
  media: {
    eventId: '00000000-0000-4000-8000-000000000001',
    originalFilename: 'cover.png',
    contentType: 'image/png' as const,
    byteSize: 128,
    role: 'cover' as const,
  },
}

it.effect('MediaServiceLive authorizes and coordinates an event upload', () => {
  const repo = Layer.mock(MediaRepo, {
    getEventMediaActorContext: () =>
      Effect.succeed({
        organizationId: 'workspace-1',
        role: 'host' as const,
        planningPermission: 'manage' as const,
      }),
    createPendingEventMedia: () => Effect.succeed({ id: 'asset-created' }),
  })
  const storage = Layer.mock(MediaStorage, {
    createUploadUrl: () =>
      Effect.succeed({
        bucket: 'private-test',
        uploadUrl: 'https://storage.invalid/upload',
        expiresInSeconds: 900,
        requiredHeaders: { 'Content-Type': 'image/png' },
      }),
  })
  const serviceLayer = MediaServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, storage)))
  return Effect.gen(function* () {
    const service = yield* MediaService
    const result = yield* service.prepareEventUpload(uploadInput)
    expect(result.mediaAssetId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(result.uploadUrl).toBe('https://storage.invalid/upload')
    expect(result.method).toBe('PUT')
    expect(result.requiredHeaders).toEqual({ 'Content-Type': 'image/png' })
  }).pipe(Effect.provide(serviceLayer))
})

it.effect('MediaServiceLive rejects a guest cover upload before reaching storage', () => {
  let storageCalls = 0
  const repo = Layer.mock(MediaRepo, {
    getEventMediaActorContext: () =>
      Effect.succeed({
        organizationId: 'workspace-1',
        role: 'guest' as const,
        planningPermission: 'view_only' as const,
      }),
  })
  const storage = Layer.mock(MediaStorage, {
    createUploadUrl: () => {
      storageCalls += 1
      return Effect.succeed({
        bucket: 'private-test',
        uploadUrl: 'https://storage.invalid/upload',
        expiresInSeconds: 900,
        requiredHeaders: {},
      })
    },
  })
  const serviceLayer = MediaServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, storage)))

  return Effect.gen(function* () {
    const service = yield* MediaService
    const outcome = yield* Effect.match(service.prepareEventUpload(uploadInput), {
      onFailure: (error) => ({ ok: false as const, error }),
      onSuccess: () => ({ ok: true as const }),
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      if (!(outcome.error instanceof MediaError)) throw outcome.error
      expect(outcome.error.code).toBe('MEDIA_FORBIDDEN')
    }
    expect(storageCalls).toBe(0)
  }).pipe(Effect.provide(serviceLayer))
})

it.effect('MediaServiceLive creates a child-scoped native upload for its explicit planner', () => {
  const scopeId = '00000000-0000-4000-8000-000000000010'
  const mediaAssetId = '00000000-0000-4000-8000-000000000011'
  let signedKey: string | undefined
  let persistedKey: string | undefined
  const repo = Layer.mock(MediaRepo, {
    getNativeMediaActorContext: () =>
      Effect.succeed({
        organizationId: 'workspace-1',
        parentEventId: '00000000-0000-4000-8000-000000000001',
      }),
    upsertPendingNativeMedia: (input) => {
      persistedKey = input.storageKey
      return Effect.succeed({
        id: input.media.mediaAssetId,
        organizationId: input.organizationId,
        uploadedByUserId: input.uploadedByUserId,
        status: 'pending' as const,
      })
    },
  })
  const storage = Layer.mock(MediaStorage, {
    createUploadUrl: (input) => {
      signedKey = input.key
      return Effect.succeed({
        bucket: 'private-test',
        uploadUrl: 'https://storage.invalid/child-upload',
        expiresInSeconds: 900,
        requiredHeaders: { 'Content-Type': 'image/png' },
      })
    },
  })
  const serviceLayer = MediaServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, storage)))

  return Effect.gen(function* () {
    const service = yield* MediaService
    const result = yield* service.prepareNativeUpload({
      userId: 'child-planner',
      media: {
        scopeId,
        mediaAssetId,
        originalFilename: 'child.png',
        contentType: 'image/png',
        byteSize: 128,
      },
    })
    const expectedKey = `workspaces/workspace-1/media/events/${scopeId}/${mediaAssetId}/original.png`
    expect(result.mediaAssetId).toBe(mediaAssetId)
    expect(signedKey).toBe(expectedKey)
    expect(persistedKey).toBe(expectedKey)
  }).pipe(Effect.provide(serviceLayer))
})

it.effect('MediaServiceLive blocks pending child finalization after a view-only downgrade', () => {
  let storageCalls = 0
  const mediaAssetId = '00000000-0000-4000-8000-000000000021'
  const repo = Layer.mock(MediaRepo, {
    getNativeMediaAccessContext: () =>
      Effect.succeed({
        mediaAssetId,
        eventId: '00000000-0000-4000-8000-000000000010',
        parentEventId: '00000000-0000-4000-8000-000000000001',
        planningPermission: 'view_only' as const,
        organizationId: 'workspace-1',
        uploadedByUserId: 'child-planner',
        status: 'pending' as const,
        bucket: 'private-test',
        storageKey: 'workspaces/workspace-1/media/events/child/asset/original.png',
        contentType: 'image/png',
        byteSize: 128,
      }),
  })
  const storage = Layer.mock(MediaStorage, {
    inspectObject: () => {
      storageCalls += 1
      return Effect.succeed({
        byteSize: 128,
        contentType: 'image/png',
        checksum: 'checksum',
        mediaAssetId,
      })
    },
  })
  const serviceLayer = MediaServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, storage)))

  return Effect.gen(function* () {
    const service = yield* MediaService
    const outcome = yield* Effect.match(
      service.finalizeNativeUpload({ userId: 'child-planner', media: { mediaAssetId } }),
      {
        onFailure: (error) => ({ ok: false as const, error }),
        onSuccess: () => ({ ok: true as const }),
      }
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      if (!(outcome.error instanceof MediaError)) throw outcome.error
      expect(outcome.error.code).toBe('MEDIA_FORBIDDEN')
    }
    expect(storageCalls).toBe(0)
  }).pipe(Effect.provide(serviceLayer))
})

it.effect('MediaServiceLive rejects finalization for an asset outside the pending state', () => {
  let storageCalls = 0
  const repo = Layer.mock(MediaRepo, {
    getEventMediaAccessContext: () =>
      Effect.succeed({
        mediaAssetId: '00000000-0000-4000-8000-000000000002',
        eventId: uploadInput.media.eventId,
        eventMediaId: 'placement-1',
        organizationId: 'workspace-1',
        uploadedByUserId: 'user-1',
        role: 'gallery' as const,
        status: 'failed' as const,
        bucket: 'private-test',
        storageKey: 'workspaces/workspace-1/media/asset/original.png',
        contentType: 'image/png',
        byteSize: 128,
        participantRole: 'host' as const,
        planningPermission: 'manage' as const,
      }),
  })
  const storage = Layer.mock(MediaStorage, {
    inspectObject: () => {
      storageCalls += 1
      return Effect.succeed({
        byteSize: 128,
        contentType: 'image/png',
        checksum: 'checksum',
        mediaAssetId: '00000000-0000-4000-8000-000000000002',
      })
    },
  })
  const serviceLayer = MediaServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, storage)))

  return Effect.gen(function* () {
    const service = yield* MediaService
    const outcome = yield* Effect.match(
      service.finalizeEventUpload({
        userId: 'user-1',
        media: { mediaAssetId: '00000000-0000-4000-8000-000000000002' },
      }),
      {
        onFailure: (error) => ({ ok: false as const, error }),
        onSuccess: () => ({ ok: true as const }),
      }
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      if (!(outcome.error instanceof MediaError)) throw outcome.error
      expect(outcome.error.code).toBe('MEDIA_INVALID_STATE')
    }
    expect(storageCalls).toBe(0)
  }).pipe(Effect.provide(serviceLayer))
})
