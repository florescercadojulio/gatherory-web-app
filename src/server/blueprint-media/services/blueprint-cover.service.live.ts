import { createHash, randomUUID } from 'node:crypto'
import { Effect, Layer } from 'effect'

import type {
  BlueprintCoverVariant,
  BlueprintCoverReadyReceipt,
} from '@/contracts/blueprint-media.contracts'
import { hashBlueprintShareToken } from '@/server/blueprints/planning/blueprint-share-token.server'
import {
  curatedExploreCoverAssetId,
  resolveCuratedExploreCover,
} from '@/server/blueprints/catalog/explore-cover-import'
import type { ExploreCoverManifest } from '@/server/blueprints/catalog/explore-cover-manifest'
import { seedImageCoverAssetId } from '@/server/blueprints/catalog/seed-image-registry'
import {
  ConflictError,
  EntityNotFoundError,
  ExternalServiceError,
  ForbiddenError,
  InvalidInputError,
} from '@/lib/domain-errors'
import { BlueprintCoverImage } from '../connectors/blueprint-cover-image.con'
import { BlueprintCoverSource } from '../connectors/blueprint-cover-source.con'
import { BlueprintCoverStorage } from '../connectors/blueprint-cover-storage.con'
import type { BlueprintCoverAsset, BlueprintCoverVariantKeys } from '../repos/blueprint-cover.repo'
import { BlueprintCoverRepo } from '../repos/blueprint-cover.repo'
import { BlueprintCoverService } from './blueprint-cover.service'

const maxUploadBytes = 20 * 1024 * 1024
const maxPixels = 40_000_000
const curatedCoverByteLimit = 20 * 1024 * 1024
const seedImageImportConcurrency = 3

const noCover = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'BLUEPRINT_COVER_UNAVAILABLE',
    userMessageKey: 'serverErrors.MEDIA_NOT_FOUND',
  })
const coverForbidden = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'BLUEPRINT_COVER_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
const invalidState = () =>
  new ConflictError({
    category: 'conflict',
    code: 'BLUEPRINT_COVER_INVALID_STATE',
    userMessageKey: 'serverErrors.MEDIA_INVALID_STATE',
  })
const failImage = (cause?: unknown) =>
  new InvalidInputError({
    category: 'validation',
    code: 'BLUEPRINT_COVER_INVALID_IMAGE',
    userMessageKey: 'serverErrors.VALIDATION',
    debugMessage: 'The Blueprint cover must be a decodable JPEG within the configured dimensions.',
    cause,
  })

function coverKey(ownerUserId: string, assetId: string, variant: string) {
  return `blueprint-covers/users/${ownerUserId}/${assetId}/${variant}.jpg`
}

function uploadKey(ownerUserId: string, assetId: string) {
  return `temporary/blueprint-covers/users/${ownerUserId}/${assetId}/upload.jpg`
}

function collectCoverIds(value: unknown, output = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return output
  if (Array.isArray(value)) {
    for (const item of value) collectCoverIds(item, output)
    return output
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'coverAssetId' && typeof child === 'string') output.add(child.toLowerCase())
    collectCoverIds(child, output)
  }
  return output
}

function variantDimensions(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / width, maxEdge / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function variantKeyMap(
  ownerUserId: string,
  assetId: string,
  width: number,
  height: number,
  version?: string
): BlueprintCoverVariantKeys {
  const specs: Array<[BlueprintCoverVariant, number]> = [
    ['thumbnail', 320],
    ['card', 960],
    ['hero', 1600],
  ]
  return Object.fromEntries(
    specs.map(([variant, targetWidth]) => [
      variant,
      {
        storageKey: coverKey(ownerUserId, assetId, version ? `${variant}-${version}` : variant),
        ...variantDimensions(width, height, targetWidth),
      },
    ])
  ) as BlueprintCoverVariantKeys
}

function curatedVariantKeyMap(
  ownerUserId: string,
  assetId: string,
  variants: Array<{ name: BlueprintCoverVariant; width: number; height: number }>
): BlueprintCoverVariantKeys {
  return Object.fromEntries(
    variants.map((variant) => [
      variant.name,
      {
        storageKey: coverKey(ownerUserId, assetId, variant.name),
        width: variant.width,
        height: variant.height,
      },
    ])
  ) as BlueprintCoverVariantKeys
}

function hasMatchingVariantKeys(
  actual: BlueprintCoverVariantKeys | null | undefined,
  expected: BlueprintCoverVariantKeys
) {
  return (
    actual != null &&
    (['thumbnail', 'card', 'hero'] as const).every(
      (variant) =>
        actual[variant]?.storageKey === expected[variant].storageKey &&
        actual[variant]?.width === expected[variant].width &&
        actual[variant]?.height === expected[variant].height
    )
  )
}

const isRetainedReadyCover = (asset: BlueprintCoverAsset | null): asset is BlueprintCoverAsset =>
  asset !== null && asset.status === 'ready' && asset.deletedAt === null

function curatedImportError(cause: unknown) {
  return new ExternalServiceError({
    category: 'external',
    code: 'BLUEPRINT_CURATED_COVER_IMPORT_FAILED',
    userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
    cause,
  })
}

export const BlueprintCoverServiceLive = Layer.effect(
  BlueprintCoverService,
  Effect.gen(function* () {
    const repo = yield* BlueprintCoverRepo
    const storage = yield* BlueprintCoverStorage
    const image = yield* BlueprintCoverImage
    const sourcePort = yield* BlueprintCoverSource

    const sourceRevisionForActor = (input: {
      database?: unknown
      actorUserId: string
      sourceRevisionId?: string
      sourceCatalogKey?: string
      sourceRevision?: number
      shareToken?: string
      shareTokenHash?: string
    }) =>
      Effect.gen(function* () {
        const source = yield* repo.findSourceRevision({
          database: input.database,
          sourceRevisionId: input.sourceRevisionId,
          sourceCatalogKey: input.sourceCatalogKey,
          sourceRevision: input.sourceRevision,
        })
        if (!input.sourceRevisionId && !(input.sourceCatalogKey && input.sourceRevision))
          return yield* Effect.fail(coverForbidden())
        if (!source) return yield* Effect.fail(noCover())
        const publicRevision =
          source.templateId === null ||
          (source.listedRevision !== null && source.listedRevision === source.revision)
        const ownerRevision = source.templateCreatorId === input.actorUserId
        let sharedRevision = false
        const tokenHash =
          input.shareTokenHash ??
          (input.shareToken ? hashBlueprintShareToken(input.shareToken) : null)
        if (tokenHash) {
          const link = yield* repo.findShareLink({
            database: input.database,
            revisionId: source.id,
            tokenHash,
          })
          sharedRevision = Boolean(link && !link.revokedAt)
        }
        if (
          (!publicRevision && !ownerRevision && !sharedRevision) ||
          source.retiredAt ||
          source.revisionRetiredAt
        )
          return yield* Effect.fail(coverForbidden())
        return source
      })

    const validateReferences: typeof BlueprintCoverService.Service.validateReferences = (input) =>
      Effect.gen(function* () {
        const ids = [...new Set(input.assetIds.map((id) => id.toLowerCase()))]
        if (!ids.length) return
        const rows = yield* repo.findCoverAssets({
          database: input.database,
          ids,
          excludeDeleted: true,
        })
        const owned = new Set(
          rows
            .filter((row) => row.ownerUserId === input.actorUserId && row.status === 'ready')
            .map((row) => row.id)
        )
        const pendingForeign = ids.some(
          (id) =>
            !owned.has(id) &&
            rows.some((row) => row.id === id && row.ownerUserId === input.actorUserId)
        )
        if (pendingForeign) return yield* Effect.fail(invalidState())
        const foreignIds = ids.filter((id) => !owned.has(id))
        if (!foreignIds.length) return
        if (!input.sourceRevisionId && !(input.sourceCatalogKey && input.sourceRevision))
          return yield* Effect.fail(coverForbidden())
        const source = yield* sourceRevisionForActor({ ...input, actorUserId: input.actorUserId })
        const allowed = collectCoverIds(source.document)
        if (foreignIds.some((id) => !allowed.has(id))) return yield* Effect.fail(coverForbidden())
        if (foreignIds.some((id) => !rows.some((row) => row.id === id && row.status === 'ready')))
          return yield* Effect.fail(noCover())
      })

    const prepareUpload: typeof BlueprintCoverService.Service.prepareUpload = (input) =>
      Effect.gen(function* () {
        const assetId = input.cover.mediaAssetId
        const key = coverKey(input.actorUserId, assetId, 'original')
        const uploadStorageKey = uploadKey(input.actorUserId, assetId)
        const existing = yield* repo.findCoverAsset({ id: assetId })
        if (
          existing &&
          (existing.ownerUserId !== input.actorUserId ||
            existing.originalStorageKey !== key ||
            existing.uploadStorageKey !== uploadStorageKey ||
            existing.contentType !== input.cover.contentType ||
            existing.byteSize !== input.cover.byteSize ||
            !['pending', 'failed'].includes(existing.status))
        )
          return yield* Effect.fail(invalidState())
        if (!existing) {
          yield* repo.createPendingAsset({
            id: assetId,
            ownerUserId: input.actorUserId,
            bucket: storage.bucket,
            originalStorageKey: key,
            uploadStorageKey,
            originalFilename: input.cover.originalFilename,
            byteSize: input.cover.byteSize,
          })
        } else if (existing.status === 'failed') {
          yield* repo.retryPendingAsset({
            id: assetId,
            ownerUserId: input.actorUserId,
            originalFilename: input.cover.originalFilename,
          })
        }
        const reserved = yield* repo.findCoverAsset({ id: assetId })
        if (
          !reserved ||
          reserved.ownerUserId !== input.actorUserId ||
          reserved.originalStorageKey !== key ||
          reserved.uploadStorageKey !== uploadStorageKey ||
          reserved.contentType !== input.cover.contentType ||
          reserved.byteSize !== input.cover.byteSize ||
          !['pending', 'processing'].includes(reserved.status)
        )
          return yield* Effect.fail(invalidState())
        const signed = yield* storage.createUploadUrl({
          key: uploadStorageKey,
          mediaAssetId: assetId,
        })
        return {
          mediaAssetId: assetId,
          uploadUrl: signed.uploadUrl,
          method: 'PUT' as const,
          requiredHeaders: signed.requiredHeaders,
          expiresAt: new Date(Date.now() + signed.expiresInSeconds * 1000).toISOString(),
        }
      })

    const finalizeUpload: typeof BlueprintCoverService.Service.finalizeUpload = (input) =>
      Effect.gen(function* () {
        const asset = yield* repo.findCoverAsset({
          id: input.cover.mediaAssetId,
          ownerUserId: input.actorUserId,
          excludeDeleted: true,
        })
        if (!asset) return yield* Effect.fail(noCover())
        if (asset.status === 'ready' && asset.variantStorageKeys) {
          const url = yield* storage.createReadUrl({
            key: asset.variantStorageKeys.hero.storageKey,
          })
          const variants: BlueprintCoverReadyReceipt['variants'] = {
            thumbnail: {
              width: asset.variantStorageKeys.thumbnail.width,
              height: asset.variantStorageKeys.thumbnail.height,
            },
            card: {
              width: asset.variantStorageKeys.card.width,
              height: asset.variantStorageKeys.card.height,
            },
            hero: {
              width: asset.variantStorageKeys.hero.width,
              height: asset.variantStorageKeys.hero.height,
            },
          }
          return {
            mediaAssetId: asset.id,
            status: 'ready' as const,
            url,
            width: asset.width!,
            height: asset.height!,
            variants,
          }
        }
        if (asset.status !== 'pending' && asset.status !== 'processing')
          return yield* Effect.fail(invalidState())
        const processingToken = randomUUID()
        let ownsProcessingLease = yield* repo.claimProcessing({
          id: asset.id,
          ownerUserId: input.actorUserId,
          processingToken,
        })
        if (!ownsProcessingLease && asset.status === 'processing') {
          ownsProcessingLease = yield* repo.reclaimProcessing({
            id: asset.id,
            ownerUserId: input.actorUserId,
            processingToken,
            expiredBefore: new Date(Date.now() - 10 * 60 * 1000),
          })
        }
        if (!ownsProcessingLease) return yield* Effect.fail(invalidState())

        const failOwnedAsset = () => repo.markFailed({ id: asset.id, processingToken })
        const failAndCleanUpload = () =>
          Effect.gen(function* () {
            const failed = yield* failOwnedAsset()
            if (!failed) return yield* Effect.fail(invalidState())
            yield* storage
              .delete({ key: asset.uploadStorageKey })
              .pipe(Effect.catch(() => Effect.void))
            return yield* Effect.fail(failImage())
          })
        const inspected = yield* storage.inspect({ key: asset.uploadStorageKey })
        if (
          inspected.mediaAssetId !== asset.id ||
          inspected.contentType !== 'image/jpeg' ||
          inspected.byteSize !== asset.byteSize ||
          inspected.byteSize > maxUploadBytes
        )
          return yield* failAndCleanUpload()
        const sourceBytes = yield* storage.readBytes({ key: asset.uploadStorageKey })
        if (sourceBytes.byteLength !== asset.byteSize || sourceBytes.byteLength > maxUploadBytes)
          return yield* failAndCleanUpload()
        const processed = yield* image.normalizeJpeg(sourceBytes, { maxPixels }).pipe(
          Effect.mapError((cause) => failImage(cause)),
          Effect.tapError(() => failOwnedAsset().pipe(Effect.asVoid))
        )
        const immutableOriginalKey = coverKey(
          input.actorUserId,
          asset.id,
          `normalized-${processingToken}`
        )
        const keys = variantKeyMap(
          input.actorUserId,
          asset.id,
          processed.width,
          processed.height,
          processingToken
        )
        yield* storage.putBytes({
          key: immutableOriginalKey,
          mediaAssetId: asset.id,
          bytes: processed.original,
        })
        yield* Effect.forEach(
          Object.entries(processed.variants) as Array<
            [BlueprintCoverVariant, { bytes: Uint8Array; width: number; height: number }]
          >,
          ([variant, value]) =>
            storage.putBytes({
              key: keys[variant].storageKey,
              mediaAssetId: asset.id,
              bytes: value.bytes,
            }),
          { concurrency: 1 }
        )
        const checksum = createHash('sha256').update(processed.original).digest('hex')
        const ready = yield* repo.markReady({
          id: asset.id,
          ownerUserId: input.actorUserId,
          processingToken,
          originalStorageKey: immutableOriginalKey,
          byteSize: processed.original.byteLength,
          width: processed.width,
          height: processed.height,
          checksum,
          variantStorageKeys: keys,
        })
        if (!ready) {
          yield* Effect.forEach(
            [immutableOriginalKey, ...Object.values(keys).map((variant) => variant.storageKey)],
            (key) => storage.delete({ key }).pipe(Effect.catch(() => Effect.void)),
            { concurrency: 4 }
          )
          return yield* Effect.fail(invalidState())
        }
        yield* storage.delete({ key: asset.uploadStorageKey }).pipe(Effect.catch(() => Effect.void))
        const url = yield* storage.createReadUrl({ key: keys.hero.storageKey })
        return {
          mediaAssetId: asset.id,
          status: 'ready' as const,
          url,
          width: processed.width,
          height: processed.height,
          variants: {
            thumbnail: { width: keys.thumbnail.width, height: keys.thumbnail.height },
            card: { width: keys.card.width, height: keys.card.height },
            hero: { width: keys.hero.width, height: keys.hero.height },
          },
        }
      })

    const getUrl: typeof BlueprintCoverService.Service.getUrl = (input) =>
      Effect.gen(function* () {
        const asset = yield* repo.findCoverAsset({
          id: input.cover.mediaAssetId,
          status: 'ready',
          excludeDeleted: true,
        })
        if (!asset?.variantStorageKeys) return yield* Effect.fail(noCover())
        let authorized = Boolean(input.actorUserId && asset.ownerUserId === input.actorUserId)
        if (!authorized && input.cover.catalogKey && input.cover.revision) {
          const revisionId = yield* repo.findRevisionId({
            catalogKey: input.cover.catalogKey,
            revision: input.cover.revision,
          })
          if (revisionId) {
            const source = yield* sourceRevisionForActor({
              actorUserId: input.actorUserId ?? '',
              sourceRevisionId: revisionId,
              shareToken: input.cover.shareToken,
            }).pipe(Effect.catch(() => Effect.succeed(null)))
            authorized = Boolean(source && collectCoverIds(source.document).has(asset.id))
          }
        } else if (!authorized && input.cover.shareToken) {
          const link = yield* repo.findShareLink({
            tokenHash: hashBlueprintShareToken(input.cover.shareToken),
          })
          if (link && !link.revokedAt) {
            const source = yield* sourceRevisionForActor({
              actorUserId: input.actorUserId ?? '',
              sourceRevisionId: link.revisionId,
              shareToken: input.cover.shareToken,
            }).pipe(Effect.catch(() => Effect.succeed(null)))
            authorized = Boolean(source && collectCoverIds(source.document).has(asset.id))
          }
        }
        if (!authorized) return yield* Effect.fail(coverForbidden())
        const variant = input.cover.variant
        const key = asset.variantStorageKeys[variant]?.storageKey
        if (!key) return yield* Effect.fail(noCover())
        const url = yield* storage.createReadUrl({ key })
        return {
          mediaAssetId: asset.id,
          url,
          variant,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }
      })

    const cloneAssets: typeof BlueprintCoverService.Service.cloneAssets = (input) =>
      Effect.gen(function* () {
        const source = yield* sourceRevisionForActor({ ...input, actorUserId: input.actorUserId })
        const referenced = collectCoverIds(source.document)
        const copyPairs = input.copies.map((copy) => ({
          ...copy,
          sourceAssetId: copy.sourceAssetId.toLowerCase(),
          destinationAssetId: copy.destinationAssetId.toLowerCase(),
        }))
        if (copyPairs.some((pair) => pair.sourceAssetId === pair.destinationAssetId))
          return yield* Effect.fail(invalidState())
        const sourceAssets = yield* repo.findCoverAssets({
          database: input.database,
          ids: [...new Set(copyPairs.map((pair) => pair.sourceAssetId))],
          status: 'ready',
          excludeDeleted: true,
        })
        if (
          copyPairs.some((pair) => {
            const sourceAsset = sourceAssets.find((asset) => asset.id === pair.sourceAssetId)
            return (
              !sourceAsset ||
              (sourceAsset.ownerUserId !== input.actorUserId && !referenced.has(pair.sourceAssetId))
            )
          })
        )
          return yield* Effect.fail(coverForbidden())
        const output: Array<{
          sourceAssetId: string
          destinationAssetId: string
          created: boolean
        }> = []
        for (const pair of copyPairs) {
          const asset = sourceAssets.find((sourceAsset) => sourceAsset.id === pair.sourceAssetId)
          if (!asset?.variantStorageKeys) return yield* Effect.fail(noCover())
          const hero = yield* storage.readBytes({ key: asset.variantStorageKeys.hero.storageKey })
          let created = false
          if (input.destinationOrganizationId) {
            const key = `workspaces/${input.destinationOrganizationId}/media/${pair.destinationAssetId}/original.jpg`
            const checksum = createHash('sha256').update(hero).digest('hex')
            const existing = yield* repo.findMediaAsset({
              id: pair.destinationAssetId,
              database: input.database,
            })
            if (
              existing &&
              (existing.organizationId !== input.destinationOrganizationId ||
                existing.storageKey !== key ||
                existing.uploadedByUserId !== input.actorUserId ||
                existing.status !== 'ready' ||
                existing.checksum !== checksum)
            )
              return yield* Effect.fail(invalidState())
            if (!existing) {
              yield* storage.putBytes({ key, mediaAssetId: pair.destinationAssetId, bytes: hero })
              yield* repo.createMediaAsset({
                id: pair.destinationAssetId,
                organizationId: input.destinationOrganizationId,
                uploadedByUserId: input.actorUserId,
                bucket: asset.bucket,
                storageKey: key,
                originalFilename: asset.originalFilename,
                byteSize: hero.byteLength,
                width: asset.variantStorageKeys.hero.width,
                height: asset.variantStorageKeys.hero.height,
                checksum,
                database: input.database,
              })
              created = true
            }
          } else {
            const destinationKey = coverKey(input.actorUserId, pair.destinationAssetId, 'original')
            const destinationVariants = variantKeyMap(
              input.actorUserId,
              pair.destinationAssetId,
              asset.width!,
              asset.height!
            )
            const existing = yield* repo.findCoverAsset({
              id: pair.destinationAssetId,
              database: input.database,
            })
            if (
              existing &&
              (existing.ownerUserId !== input.actorUserId ||
                existing.originalStorageKey !== destinationKey ||
                existing.status !== 'ready' ||
                existing.checksum !== asset.checksum)
            )
              return yield* Effect.fail(invalidState())
            if (!existing) {
              const original = yield* storage.readBytes({ key: asset.originalStorageKey })
              yield* storage.putBytes({
                key: destinationKey,
                mediaAssetId: pair.destinationAssetId,
                bytes: original,
              })
              for (const variant of ['thumbnail', 'card', 'hero'] as const) {
                const bytes = yield* storage.readBytes({
                  key: asset.variantStorageKeys[variant].storageKey,
                })
                yield* storage.putBytes({
                  key: destinationVariants[variant].storageKey,
                  mediaAssetId: pair.destinationAssetId,
                  bytes,
                })
              }
              yield* repo.createReadyAsset({
                id: pair.destinationAssetId,
                ownerUserId: input.actorUserId,
                bucket: asset.bucket,
                originalStorageKey: destinationKey,
                uploadStorageKey: uploadKey(input.actorUserId, pair.destinationAssetId),
                variantStorageKeys: destinationVariants,
                originalFilename: asset.originalFilename,
                byteSize: asset.byteSize,
                width: asset.width!,
                height: asset.height!,
                checksum: asset.checksum!,
                database: input.database,
              })
              created = true
            }
          }
          output.push({
            sourceAssetId: pair.sourceAssetId,
            destinationAssetId: pair.destinationAssetId,
            created,
          })
        }
        return output
      })

    const importVariants = (manifest: ExploreCoverManifest, totalRead: { value: number }) =>
      Effect.gen(function* () {
        const variants = {} as Record<BlueprintCoverVariant, Uint8Array>
        for (const variantName of ['thumbnail', 'card', 'hero'] as const) {
          const variant = manifest.variants.find((item) => item.name === variantName)
          if (!variant) return yield* Effect.fail(noCover())
          const url = new URL(variant.url)
          if (
            url.origin !== 'https://cdn.gatherory.com' ||
            url.pathname !== `/${variant.key}` ||
            !url.pathname.startsWith('/explore/covers/')
          )
            return yield* Effect.fail(
              curatedImportError(new Error('Cover URL is outside the public registry.'))
            )
          const downloaded = yield* sourcePort.download({
            url: url.toString(),
            maxBytes: curatedCoverByteLimit,
          })
          totalRead.value += downloaded.bytes.byteLength
          if (
            downloaded.contentType?.split(';')[0] !== 'image/jpeg' ||
            downloaded.bytes.byteLength > curatedCoverByteLimit ||
            totalRead.value > curatedCoverByteLimit ||
            createHash('sha256').update(downloaded.bytes).digest('hex') !== variant.checksum
          )
            return yield* Effect.fail(
              curatedImportError(new Error('Cover source metadata or checksum mismatch.'))
            )
          const metadata = yield* image
            .inspectJpeg(downloaded.bytes, { maxPixels })
            .pipe(Effect.mapError(curatedImportError))
          if (
            metadata.format !== 'jpeg' ||
            metadata.width !== variant.width ||
            metadata.height !== variant.height ||
            !metadata.width ||
            !metadata.height ||
            metadata.width * metadata.height > maxPixels
          )
            return yield* Effect.fail(
              curatedImportError(new Error('Cover image dimensions did not match its manifest.'))
            )
          variants[variantName] = downloaded.bytes
        }
        return variants
      })

    const materializeCuratedExploreCover: typeof BlueprintCoverService.Service.materializeCuratedExploreCover =
      (input) =>
        Effect.gen(function* () {
          const curated = resolveCuratedExploreCover(input)
          if (!curated) return undefined
          if (curated.status === 'invalid') return yield* Effect.fail(invalidState())
          const { manifest } = curated
          const hero = manifest.variants.find((variant) => variant.name === 'hero')
          if (!hero) return yield* Effect.fail(invalidState())
          const assetId = curatedExploreCoverAssetId({ ...input, heroChecksum: hero.checksum })
          const originalKey = coverKey(input.actorUserId, assetId, 'original')
          const variantKeys = curatedVariantKeyMap(input.actorUserId, assetId, manifest.variants)
          const existing = yield* repo.findCoverAsset({ id: assetId })
          if (existing) {
            if (
              existing.ownerUserId !== input.actorUserId ||
              existing.deletedAt !== null ||
              existing.status !== 'ready' ||
              !existing.variantStorageKeys ||
              existing.bucket !== storage.bucket ||
              existing.originalStorageKey !== originalKey ||
              existing.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
              existing.contentType !== 'image/jpeg' ||
              existing.width !== hero.width ||
              existing.height !== hero.height ||
              existing.originalFilename !== 'curated-explore-cover.jpg' ||
              existing.checksum !== hero.checksum ||
              !hasMatchingVariantKeys(existing.variantStorageKeys, variantKeys)
            )
              return yield* Effect.fail(invalidState())
            return assetId
          }
          const variants = yield* importVariants(manifest, { value: 0 })
          yield* storage.putBytes({ key: originalKey, mediaAssetId: assetId, bytes: variants.hero })
          for (const variant of ['thumbnail', 'card', 'hero'] as const) {
            yield* storage.putBytes({
              key: variantKeys[variant].storageKey,
              mediaAssetId: assetId,
              bytes: variants[variant],
            })
          }
          const checksum = createHash('sha256').update(variants.hero).digest('hex')
          yield* repo.createReadyAsset({
            id: assetId,
            ownerUserId: input.actorUserId,
            bucket: storage.bucket,
            originalStorageKey: originalKey,
            uploadStorageKey: uploadKey(input.actorUserId, assetId),
            variantStorageKeys: variantKeys,
            originalFilename: 'curated-explore-cover.jpg',
            byteSize: variants.hero.byteLength,
            width: hero.width,
            height: hero.height,
            checksum,
          })
          const persisted = yield* repo.findCoverAsset({ id: assetId })
          if (
            !isRetainedReadyCover(persisted) ||
            persisted.ownerUserId !== input.actorUserId ||
            persisted.bucket !== storage.bucket ||
            persisted.originalStorageKey !== originalKey ||
            persisted.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
            persisted.contentType !== 'image/jpeg' ||
            persisted.width !== hero.width ||
            persisted.height !== hero.height ||
            persisted.checksum !== hero.checksum ||
            !hasMatchingVariantKeys(persisted.variantStorageKeys, variantKeys)
          )
            return yield* Effect.fail(invalidState())
          return assetId
        })

    const materializeCuratedSeedImages: typeof BlueprintCoverService.Service.materializeCuratedSeedImages =
      (input) =>
        Effect.gen(function* () {
          const uniqueByChecksum = new Map<
            string,
            { assetKey: string; manifest: ExploreCoverManifest }
          >()
          const assetKeysByChecksum = new Map<string, string[]>()
          for (const item of input.images) {
            const hero = item.manifest.variants.find((variant) => variant.name === 'hero')
            if (!hero) return yield* Effect.fail(invalidState())
            const keys = assetKeysByChecksum.get(hero.checksum) ?? []
            keys.push(item.assetKey)
            assetKeysByChecksum.set(hero.checksum, keys)
            if (!uniqueByChecksum.has(hero.checksum)) uniqueByChecksum.set(hero.checksum, item)
          }
          if (uniqueByChecksum.size > 151) return yield* Effect.fail(invalidState())
          const imported = yield* Effect.all(
            [...uniqueByChecksum.entries()].map(([heroChecksum, item]) =>
              Effect.gen(function* () {
                const manifest = item.manifest
                const hero = manifest.variants.find((variant) => variant.name === 'hero')!
                const assetId = seedImageCoverAssetId({
                  actorUserId: input.actorUserId,
                  requestId: input.requestId,
                  catalogKey: input.catalogKey,
                  revision: input.revision,
                  contentHash: input.contentHash,
                  heroChecksum,
                })
                const originalKey = coverKey(input.actorUserId, assetId, 'original')
                const expectedKeys = curatedVariantKeyMap(
                  input.actorUserId,
                  assetId,
                  manifest.variants
                )
                const existing = yield* repo.findCoverAsset({ id: assetId })
                if (existing) {
                  if (
                    existing.ownerUserId !== input.actorUserId ||
                    existing.deletedAt !== null ||
                    existing.status !== 'ready' ||
                    !existing.variantStorageKeys ||
                    existing.bucket !== storage.bucket ||
                    existing.originalStorageKey !== originalKey ||
                    existing.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
                    existing.contentType !== 'image/jpeg' ||
                    existing.width !== hero.width ||
                    existing.height !== hero.height ||
                    existing.originalFilename !== 'curated-seed-cover.jpg' ||
                    existing.checksum !== hero.checksum ||
                    !hasMatchingVariantKeys(existing.variantStorageKeys, expectedKeys)
                  )
                    return yield* Effect.fail(invalidState())
                  return [heroChecksum, assetId] as const
                }
                const variants = yield* importVariants(manifest, { value: 0 })
                yield* storage.putBytes({
                  key: originalKey,
                  mediaAssetId: assetId,
                  bytes: variants.hero,
                })
                for (const variant of ['thumbnail', 'card', 'hero'] as const) {
                  yield* storage.putBytes({
                    key: expectedKeys[variant].storageKey,
                    mediaAssetId: assetId,
                    bytes: variants[variant],
                  })
                }
                yield* repo.createReadyAsset({
                  id: assetId,
                  ownerUserId: input.actorUserId,
                  bucket: storage.bucket,
                  originalStorageKey: originalKey,
                  uploadStorageKey: uploadKey(input.actorUserId, assetId),
                  variantStorageKeys: expectedKeys,
                  originalFilename: 'curated-seed-cover.jpg',
                  byteSize: variants.hero.byteLength,
                  width: hero.width,
                  height: hero.height,
                  checksum: hero.checksum,
                })
                const persisted = yield* repo.findCoverAsset({ id: assetId })
                if (
                  !isRetainedReadyCover(persisted) ||
                  persisted.ownerUserId !== input.actorUserId ||
                  persisted.bucket !== storage.bucket ||
                  persisted.originalStorageKey !== originalKey ||
                  persisted.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
                  persisted.contentType !== 'image/jpeg' ||
                  persisted.width !== hero.width ||
                  persisted.height !== hero.height ||
                  persisted.checksum !== hero.checksum ||
                  !hasMatchingVariantKeys(persisted.variantStorageKeys, expectedKeys)
                )
                  return yield* Effect.fail(invalidState())
                return [heroChecksum, assetId] as const
              })
            ),
            { concurrency: seedImageImportConcurrency }
          )
          const idsByChecksum = Object.fromEntries(imported)
          return Object.fromEntries(
            [...assetKeysByChecksum.entries()].flatMap(([checksum, assetKeys]) =>
              assetKeys.map((assetKey) => [assetKey, idsByChecksum[checksum]!])
            )
          )
        })

    return {
      validateReferences,
      prepareUpload,
      finalizeUpload,
      getUrl,
      cloneAssets,
      materializeCuratedExploreCover,
      materializeCuratedSeedImages,
    }
  })
)
