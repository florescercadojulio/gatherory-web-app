import { Effect, Layer, Result } from 'effect'
import { expect, it } from '@effect/vitest'

import type { FinalizeBlueprintCoverUploadInput } from '@/contracts/blueprint-media.contracts'
import type { BlueprintCoverImageShape } from '@/server/blueprint-media/connectors/blueprint-cover-image.con'
import { BlueprintCoverImage } from '@/server/blueprint-media/connectors/blueprint-cover-image.con'
import { BlueprintCoverSource } from '@/server/blueprint-media/connectors/blueprint-cover-source.con'
import type { BlueprintCoverStorageShape } from '@/server/blueprint-media/connectors/blueprint-cover-storage.con'
import { BlueprintCoverStorage } from '@/server/blueprint-media/connectors/blueprint-cover-storage.con'
import type {
  BlueprintCoverAsset,
  BlueprintCoverRepositoryShape,
} from '@/server/blueprint-media/repos/blueprint-cover.repo'
import { BlueprintCoverRepo } from '@/server/blueprint-media/repos/blueprint-cover.repo'
import { BlueprintCoverService } from '@/server/blueprint-media/services/blueprint-cover.service'
import { BlueprintCoverServiceLive } from '@/server/blueprint-media/services/blueprint-cover.service.live'

const id = '00000000-0000-4000-8000-000000000001'
const bytes = new Uint8Array([1, 2, 3])

function asset(status: string): BlueprintCoverAsset {
  return {
    id,
    ownerUserId: 'owner',
    status,
    processingToken: null,
    bucket: 'test-bucket',
    originalStorageKey: `blueprint-covers/users/owner/${id}/original`,
    uploadStorageKey: `temporary/blueprint-covers/users/owner/${id}/upload.jpg`,
    variantStorageKeys: null,
    originalFilename: 'cover.jpg',
    contentType: 'image/jpeg',
    byteSize: bytes.byteLength,
    width: null,
    height: null,
    checksum: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
  }
}

function serviceLayer(
  overrides: {
    repo?: Partial<BlueprintCoverRepositoryShape>
    storage?: Partial<BlueprintCoverStorageShape>
    image?: Partial<BlueprintCoverImageShape>
  } = {}
) {
  const repository: BlueprintCoverRepositoryShape = {
    findSourceRevision: () =>
      Effect.succeed({
        id: 'source-revision',
        revision: 1,
        revisionRetiredAt: null,
        document: { coverAssetId: '00000000-0000-4000-8000-000000000099' },
        templateId: null,
        templateCreatorId: null,
        listedRevision: null,
        retiredAt: null,
      }),
    findShareLink: () => Effect.succeed(null),
    findRevisionId: () => Effect.succeed(null),
    findCoverAsset: () => Effect.succeed(null),
    findCoverAssets: () => Effect.succeed([]),
    createPendingAsset: () => Effect.void,
    retryPendingAsset: () => Effect.void,
    claimProcessing: () => Effect.succeed(true),
    reclaimProcessing: () => Effect.succeed(false),
    markFailed: () => Effect.succeed(true),
    markReady: () => Effect.succeed(true),
    findMediaAsset: () => Effect.succeed(null),
    createMediaAsset: () => Effect.void,
    createReadyAsset: () => Effect.void,
    ...overrides.repo,
  }
  const storage: BlueprintCoverStorageShape = {
    bucket: 'test-bucket',
    createUploadUrl: () =>
      Effect.succeed({
        uploadUrl: 'https://example.test/upload',
        requiredHeaders: {},
        expiresInSeconds: 60,
      }),
    inspect: () =>
      Effect.succeed({
        byteSize: bytes.byteLength,
        contentType: 'image/jpeg',
        checksum: null,
        mediaAssetId: id,
      }),
    readBytes: () => Effect.succeed(bytes),
    putBytes: () => Effect.void,
    createReadUrl: () => Effect.succeed('https://example.test/cover'),
    delete: () => Effect.void,
    ...overrides.storage,
  }
  const image: BlueprintCoverImageShape = {
    normalizeJpeg: () =>
      Effect.succeed({
        original: bytes,
        width: 3,
        height: 1,
        variants: {
          thumbnail: { bytes, width: 3, height: 1 },
          card: { bytes, width: 3, height: 1 },
          hero: { bytes, width: 3, height: 1 },
        },
      }),
    inspectJpeg: () => Effect.succeed({ format: 'jpeg', width: 3, height: 1 }),
    ...overrides.image,
  }

  return BlueprintCoverServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(BlueprintCoverRepo, repository),
        Layer.succeed(BlueprintCoverStorage, storage),
        Layer.succeed(BlueprintCoverImage, image),
        Layer.succeed(BlueprintCoverSource, {
          download: () => Effect.die('unexpected source download'),
        })
      )
    )
  )
}

const failureCode = (result: Result.Result<unknown, unknown>) =>
  Result.isFailure(result) ? (result.failure as { code?: string }).code : undefined

it.effect('denies cover references absent from an authorized public source revision', () =>
  Effect.gen(function* () {
    const result = yield* Effect.result(
      Effect.gen(function* () {
        const service = yield* BlueprintCoverService
        return yield* service.validateReferences({
          actorUserId: 'reader',
          assetIds: [id],
          sourceRevisionId: 'source-revision',
        })
      }).pipe(Effect.provide(serviceLayer()))
    )

    expect(Result.isFailure(result)).toBe(true)
    expect(failureCode(result)).toBe('BLUEPRINT_COVER_FORBIDDEN')
  })
)

it.effect(
  'rejects finalize of a pending upload when image normalization fails and marks it failed',
  () =>
    Effect.gen(function* () {
      let markedFailed = false
      const layer = serviceLayer({
        repo: {
          findCoverAsset: () => Effect.succeed(asset('pending')),
          markFailed: () => {
            markedFailed = true
            return Effect.succeed(true)
          },
        },
        image: { normalizeJpeg: () => Effect.fail(new Error('decode rejected')) },
      })
      const input: FinalizeBlueprintCoverUploadInput = { mediaAssetId: id }
      const result = yield* Effect.result(
        Effect.gen(function* () {
          const service = yield* BlueprintCoverService
          return yield* service.finalizeUpload({ actorUserId: 'owner', cover: input })
        }).pipe(Effect.provide(layer))
      )

      expect(Result.isFailure(result)).toBe(true)
      expect(failureCode(result)).toBe('BLUEPRINT_COVER_INVALID_IMAGE')
      expect(markedFailed).toBe(true)
    })
)

it.effect('rejects a non-pending upload without claiming or touching storage', () =>
  Effect.gen(function* () {
    let claimed = false
    let inspected = false
    const layer = serviceLayer({
      repo: {
        findCoverAsset: () => Effect.succeed(asset('failed')),
        claimProcessing: () => {
          claimed = true
          return Effect.succeed(true)
        },
      },
      storage: {
        inspect: () => {
          inspected = true
          return Effect.succeed({
            byteSize: bytes.byteLength,
            contentType: 'image/jpeg',
            checksum: null,
            mediaAssetId: id,
          })
        },
      },
    })
    const result = yield* Effect.result(
      Effect.gen(function* () {
        const service = yield* BlueprintCoverService
        return yield* service.finalizeUpload({
          actorUserId: 'owner',
          cover: { mediaAssetId: id },
        })
      }).pipe(Effect.provide(layer))
    )

    expect(Result.isFailure(result)).toBe(true)
    expect(failureCode(result)).toBe('BLUEPRINT_COVER_INVALID_STATE')
    expect(claimed).toBe(false)
    expect(inspected).toBe(false)
  })
)
