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
