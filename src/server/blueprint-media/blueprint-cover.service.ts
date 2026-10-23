import { createHash, randomUUID } from 'node:crypto'
import { and, eq, inArray, isNull, lt } from 'drizzle-orm'
import { Effect } from 'effect'
import type { Success } from 'effect/Effect'
import sharp from 'sharp'

import { DB, PgClientLive } from '@/db'
import {
  blueprintCoverAsset,
  type BlueprintCoverVariant,
  type BlueprintCoverVariantKeys,
} from '@/db/schema/blueprint-media.schema'
import {
  blueprintRevision,
  blueprintShareLink,
  blueprintTemplate,
} from '@/db/schema/blueprint.schema'
import { mediaAsset } from '@/db/schema/media.schema'
import {
  InvalidInputError,
  EntityNotFoundError,
  ForbiddenError,
  ConflictError,
  ExternalServiceError,
} from '@/lib/domain-errors'
import { hashBlueprintShareToken } from '@/server/blueprints/planning/blueprint-share-token.server'
import {
  BlueprintCoverStorage,
  BlueprintCoverStorageLive,
} from './blueprint-cover.storage.live'
import type {
  BlueprintCoverReadyReceipt,
  BlueprintCoverUrlReceipt,
  BlueprintCoverUploadReceipt,
  FinalizeBlueprintCoverUploadInput,
  GetBlueprintCoverUrlInput,
  PrepareBlueprintCoverUploadInput,
} from '@/contracts/blueprint-media.contracts'
import {
  curatedExploreCoverAssetId,
  resolveCuratedExploreCover,
} from '@/server/blueprints/catalog/explore-cover-import'
import type { ExploreCoverManifest } from '@/server/blueprints/catalog/explore-cover-manifest'
import { seedImageCoverAssetId } from '@/server/blueprints/catalog/seed-image-registry'

const maxUploadBytes = 20 * 1024 * 1024
const maxPixels = 40_000_000
const curatedCoverByteLimit = 20 * 1024 * 1024
const seedImageImportConcurrency = 3
type BlueprintCoverDbClient = Pick<Success<typeof DB>, 'select' | 'insert' | 'update' | 'delete'>
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

function failImage(cause?: unknown) {
  return new InvalidInputError({
    category: 'validation',
    code: 'BLUEPRINT_COVER_INVALID_IMAGE',
    userMessageKey: 'serverErrors.VALIDATION',
    debugMessage: 'The Blueprint cover must be a decodable JPEG within the configured dimensions.',
    cause,
  })
}

async function normalizeJpeg(bytes: Buffer) {
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: maxPixels, animated: false })
  const metadata = await image.metadata()
  if (
    metadata.format !== 'jpeg' ||
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > maxPixels
  ) {
    throw failImage()
  }
  const oriented = await image
    .rotate()
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })
  const width = oriented.info.width
  const height = oriented.info.height
  const variants: Record<BlueprintCoverVariant, { bytes: Buffer; width: number; height: number }> =
    {} as never
  for (const [variant, targetWidth] of [
    ['thumbnail', 320],
    ['card', 960],
    ['hero', 1600],
  ] as const) {
    const result = await sharp(oriented.data)
      .resize({
        width: targetWidth,
        height: targetWidth,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: variant === 'thumbnail' ? 78 : 84, mozjpeg: true })
      .toBuffer({ resolveWithObject: true })
    variants[variant] = { bytes: result.data, width: result.info.width, height: result.info.height }
  }
  return { original: oriented.data, width, height, variants }
}

function sourceRevisionForActor(input: {
  db?: BlueprintCoverDbClient
  actorUserId: string
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
  shareTokenHash?: string
}) {
  return Effect.gen(function* () {
    const db = input.db ?? (yield* DB)
    const sourcePredicate = input.sourceRevisionId
      ? eq(blueprintRevision.id, input.sourceRevisionId)
      : input.sourceCatalogKey && input.sourceRevision
        ? and(
            eq(blueprintRevision.catalogKey, input.sourceCatalogKey),
            eq(blueprintRevision.revision, input.sourceRevision)
          )
        : null
    if (!sourcePredicate) return yield* Effect.fail(coverForbidden())
    const [revision] = yield* db
      .select({
        id: blueprintRevision.id,
        revision: blueprintRevision.revision,
        revisionRetiredAt: blueprintRevision.retiredAt,
        document: blueprintRevision.document,
        templateId: blueprintRevision.templateId,
        templateCreatorId: blueprintTemplate.createdByUserId,
        listedRevision: blueprintTemplate.listedRevision,
        retiredAt: blueprintTemplate.retiredAt,
      })
      .from(blueprintRevision)
      .leftJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
      .where(sourcePredicate)
      .limit(1)
    if (!revision) return yield* Effect.fail(noCover())
    const publicRevision =
      revision.templateId === null ||
      (revision.listedRevision !== null && revision.listedRevision === revision.revision)
    const ownerRevision = revision.templateCreatorId === input.actorUserId
    let sharedRevision = false
    const tokenHash =
      input.shareTokenHash ?? (input.shareToken ? hashBlueprintShareToken(input.shareToken) : null)
    if (tokenHash) {
      const [link] = yield* db
        .select({ revokedAt: blueprintShareLink.revokedAt })
        .from(blueprintShareLink)
        .where(
          and(
            eq(blueprintShareLink.revisionId, revision.id),
            eq(blueprintShareLink.tokenHash, tokenHash)
          )
        )
        .limit(1)
      sharedRevision = Boolean(link && !link.revokedAt)
    }
    if (
      (!publicRevision && !ownerRevision && !sharedRevision) ||
      revision.retiredAt ||
      revision.revisionRetiredAt
    ) {
      return yield* Effect.fail(coverForbidden())
    }
    return { id: revision.id, document: revision.document }
  })
}

export function validateBlueprintCoverReferences(input: {
  db?: BlueprintCoverDbClient
  actorUserId: string
  assetIds: string[]
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
}) {
  return Effect.gen(function* () {
    const ids = [...new Set(input.assetIds.map((id) => id.toLowerCase()))]
    if (!ids.length) return
    const db = input.db ?? (yield* DB)
    const rows = yield* db
      .select({
        id: blueprintCoverAsset.id,
        ownerUserId: blueprintCoverAsset.ownerUserId,
        status: blueprintCoverAsset.status,
      })
      .from(blueprintCoverAsset)
      .where(and(inArray(blueprintCoverAsset.id, ids), isNull(blueprintCoverAsset.deletedAt)))
    const owned = new Set(
      rows
        .filter((row) => row.ownerUserId === input.actorUserId && row.status === 'ready')
        .map((row) => row.id)
    )
    const pendingForeign = ids.some(
      (id) =>
        !owned.has(id) && rows.some((row) => row.id === id && row.ownerUserId === input.actorUserId)
    )
    if (pendingForeign) return yield* Effect.fail(invalidState())
    const foreignIds = ids.filter((id) => !owned.has(id))
    if (!foreignIds.length) return
    if (!input.sourceRevisionId && !(input.sourceCatalogKey && input.sourceRevision)) {
      return yield* Effect.fail(coverForbidden())
    }
    const source = yield* sourceRevisionForActor({
      db: input.db,
      actorUserId: input.actorUserId,
      sourceRevisionId: input.sourceRevisionId,
      sourceCatalogKey: input.sourceCatalogKey,
      sourceRevision: input.sourceRevision,
      shareToken: input.shareToken,
    })
    const allowed = collectCoverIds(source.document)
    if (foreignIds.some((id) => !allowed.has(id))) return yield* Effect.fail(coverForbidden())
    if (foreignIds.some((id) => !rows.some((row) => row.id === id && row.status === 'ready'))) {
      return yield* Effect.fail(noCover())
    }
  })
}

export function prepareBlueprintCoverUpload(input: {
  actorUserId: string
  cover: PrepareBlueprintCoverUploadInput
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    const storage = yield* BlueprintCoverStorage
    const assetId = input.cover.mediaAssetId
    const key = coverKey(input.actorUserId, assetId, 'original')
    const uploadStorageKey = uploadKey(input.actorUserId, assetId)
    const existing = yield* db
      .select()
      .from(blueprintCoverAsset)
      .where(eq(blueprintCoverAsset.id, assetId))
      .limit(1)
    if (
      existing[0] &&
      (existing[0].ownerUserId !== input.actorUserId ||
        existing[0].originalStorageKey !== key ||
        existing[0].uploadStorageKey !== uploadStorageKey ||
        existing[0].contentType !== input.cover.contentType ||
        existing[0].byteSize !== input.cover.byteSize ||
        !['pending', 'failed'].includes(existing[0].status))
    )
      return yield* Effect.fail(invalidState())
    if (!existing[0]) {
      yield* db
        .insert(blueprintCoverAsset)
        .values({
          id: assetId,
          ownerUserId: input.actorUserId,
          status: 'pending',
          bucket: storage.bucket,
          originalStorageKey: key,
          uploadStorageKey,
          originalFilename: input.cover.originalFilename,
          contentType: 'image/jpeg',
          byteSize: input.cover.byteSize,
        })
        .onConflictDoNothing({ target: blueprintCoverAsset.id })
    } else if (existing[0].status === 'failed') {
      yield* db
        .update(blueprintCoverAsset)
        .set({
          status: 'pending',
          originalFilename: input.cover.originalFilename,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(blueprintCoverAsset.id, assetId),
            eq(blueprintCoverAsset.ownerUserId, input.actorUserId)
          )
        )
    }
    const [reserved] = yield* db
      .select({
        ownerUserId: blueprintCoverAsset.ownerUserId,
        originalStorageKey: blueprintCoverAsset.originalStorageKey,
        uploadStorageKey: blueprintCoverAsset.uploadStorageKey,
        contentType: blueprintCoverAsset.contentType,
        byteSize: blueprintCoverAsset.byteSize,
        status: blueprintCoverAsset.status,
      })
      .from(blueprintCoverAsset)
      .where(eq(blueprintCoverAsset.id, assetId))
      .limit(1)
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
    const signed = yield* storage.createUploadUrl({ key: uploadStorageKey, mediaAssetId: assetId })
    return {
      mediaAssetId: assetId,
      uploadUrl: signed.uploadUrl,
      method: 'PUT' as const,
      requiredHeaders: signed.requiredHeaders,
      expiresAt: new Date(Date.now() + signed.expiresInSeconds * 1000).toISOString(),
    } satisfies BlueprintCoverUploadReceipt
  })
}

export function finalizeBlueprintCoverUpload(input: {
  actorUserId: string
  cover: FinalizeBlueprintCoverUploadInput
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    const storage = yield* BlueprintCoverStorage
    const [asset] = yield* db
      .select()
      .from(blueprintCoverAsset)
      .where(
        and(
          eq(blueprintCoverAsset.id, input.cover.mediaAssetId),
          eq(blueprintCoverAsset.ownerUserId, input.actorUserId),
          isNull(blueprintCoverAsset.deletedAt)
        )
      )
      .limit(1)
    if (!asset) return yield* Effect.fail(noCover())
    if (asset.status === 'ready' && asset.variantStorageKeys) {
      const url = yield* storage.createReadUrl({ key: asset.variantStorageKeys.hero.storageKey })
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
        status: 'ready',
        url,
        width: asset.width!,
        height: asset.height!,
        variants,
      } satisfies BlueprintCoverReadyReceipt
    }
    if (asset.status !== 'pending' && asset.status !== 'processing')
      return yield* Effect.fail(invalidState())
    const processingToken = randomUUID()
    const claimed = yield* db
      .update(blueprintCoverAsset)
      .set({ status: 'processing', processingToken, updatedAt: new Date() })
      .where(
        and(
          eq(blueprintCoverAsset.id, asset.id),
          eq(blueprintCoverAsset.ownerUserId, input.actorUserId),
          eq(blueprintCoverAsset.status, 'pending')
        )
      )
      .returning({ id: blueprintCoverAsset.id })
    let ownsProcessingLease = Boolean(claimed[0])
    if (!ownsProcessingLease && asset.status === 'processing') {
      const expiredBefore = new Date(Date.now() - 10 * 60 * 1000)
      const reclaimed = yield* db
        .update(blueprintCoverAsset)
        .set({ processingToken, updatedAt: new Date() })
        .where(
          and(
            eq(blueprintCoverAsset.id, asset.id),
            eq(blueprintCoverAsset.ownerUserId, input.actorUserId),
            eq(blueprintCoverAsset.status, 'processing'),
            lt(blueprintCoverAsset.updatedAt, expiredBefore)
          )
        )
        .returning({ id: blueprintCoverAsset.id })
      ownsProcessingLease = Boolean(reclaimed[0])
    }
    if (!ownsProcessingLease) return yield* Effect.fail(invalidState())
    const inspected = yield* storage.inspect({ key: asset.uploadStorageKey })
    if (
      inspected.mediaAssetId !== asset.id ||
      inspected.contentType !== 'image/jpeg' ||
      inspected.byteSize !== asset.byteSize ||
      inspected.byteSize > maxUploadBytes
    ) {
      const failed = yield* db
        .update(blueprintCoverAsset)
        .set({ status: 'failed', processingToken: null, updatedAt: new Date() })
        .where(
          and(
            eq(blueprintCoverAsset.id, asset.id),
            eq(blueprintCoverAsset.processingToken, processingToken)
          )
        )
        .returning({ id: blueprintCoverAsset.id })
      if (!failed[0]) return yield* Effect.fail(invalidState())
      yield* storage.delete({ key: asset.uploadStorageKey }).pipe(Effect.catch(() => Effect.void))
      return yield* Effect.fail(failImage())
    }
    const source = yield* storage.readBytes({ key: asset.uploadStorageKey })
    if (source.byteLength !== asset.byteSize || source.byteLength > maxUploadBytes) {
      const failed = yield* db
        .update(blueprintCoverAsset)
        .set({ status: 'failed', processingToken: null, updatedAt: new Date() })
        .where(
          and(
            eq(blueprintCoverAsset.id, asset.id),
            eq(blueprintCoverAsset.processingToken, processingToken)
          )
        )
        .returning({ id: blueprintCoverAsset.id })
      if (!failed[0]) return yield* Effect.fail(invalidState())
      yield* storage.delete({ key: asset.uploadStorageKey }).pipe(Effect.catch(() => Effect.void))
      return yield* Effect.fail(failImage())
    }
    const processed = yield* Effect.tryPromise({
      try: () => normalizeJpeg(source),
      catch: (cause) => failImage(cause),
    }).pipe(
      Effect.tapError(() =>
        db
          .update(blueprintCoverAsset)
          .set({ status: 'failed', processingToken: null, updatedAt: new Date() })
          .where(
            and(
              eq(blueprintCoverAsset.id, asset.id),
              eq(blueprintCoverAsset.processingToken, processingToken)
            )
          )
      )
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
        [BlueprintCoverVariant, { bytes: Buffer; width: number; height: number }]
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
    const ready = yield* db
      .update(blueprintCoverAsset)
      .set({
        status: 'ready',
        processingToken: null,
        originalStorageKey: immutableOriginalKey,
        byteSize: processed.original.byteLength,
        width: processed.width,
        height: processed.height,
        checksum,
        variantStorageKeys: keys,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(blueprintCoverAsset.id, asset.id),
          eq(blueprintCoverAsset.ownerUserId, input.actorUserId),
          eq(blueprintCoverAsset.status, 'processing'),
          eq(blueprintCoverAsset.processingToken, processingToken)
        )
      )
      .returning({ id: blueprintCoverAsset.id })
    if (!ready[0]) {
      yield* Effect.forEach(
        [immutableOriginalKey, ...Object.values(keys).map((variant) => variant.storageKey)],
        (key) => storage.delete({ key }).pipe(Effect.catch(() => Effect.void)),
        { concurrency: 4 }
      )
      return yield* Effect.fail(invalidState())
    }
    yield* storage.delete({ key: asset.uploadStorageKey }).pipe(Effect.catch(() => Effect.void))
    const url = yield* storage.createReadUrl({ key: keys.hero.storageKey })
    const variants: BlueprintCoverReadyReceipt['variants'] = {
      thumbnail: { width: keys.thumbnail.width, height: keys.thumbnail.height },
      card: { width: keys.card.width, height: keys.card.height },
      hero: { width: keys.hero.width, height: keys.hero.height },
    }
    return {
      mediaAssetId: asset.id,
      status: 'ready',
      url,
      width: processed.width,
      height: processed.height,
      variants,
    } satisfies BlueprintCoverReadyReceipt
  })
}

export function getBlueprintCoverUrl(input: {
  actorUserId: string | null
  cover: GetBlueprintCoverUrlInput
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    const storage = yield* BlueprintCoverStorage
    const [asset] = yield* db
      .select()
      .from(blueprintCoverAsset)
      .where(
        and(
          eq(blueprintCoverAsset.id, input.cover.mediaAssetId),
          eq(blueprintCoverAsset.status, 'ready'),
          isNull(blueprintCoverAsset.deletedAt)
        )
      )
      .limit(1)
    if (!asset || !asset.variantStorageKeys) return yield* Effect.fail(noCover())
    let authorized = Boolean(input.actorUserId && asset.ownerUserId === input.actorUserId)
    if (!authorized && input.cover.catalogKey && input.cover.revision) {
      const dbRevision = yield* db
        .select({ id: blueprintRevision.id })
        .from(blueprintRevision)
        .where(
          and(
            eq(blueprintRevision.catalogKey, input.cover.catalogKey),
            eq(blueprintRevision.revision, input.cover.revision)
          )
        )
        .limit(1)
      if (dbRevision[0]) {
        const source = yield* sourceRevisionForActor({
          actorUserId: input.actorUserId ?? '',
          sourceRevisionId: dbRevision[0].id,
          shareToken: input.cover.shareToken,
        }).pipe(Effect.catch(() => Effect.succeed(null)))
        authorized = Boolean(source && collectCoverIds(source.document).has(asset.id))
      }
    } else if (!authorized && input.cover.shareToken) {
      const tokenHash = hashBlueprintShareToken(input.cover.shareToken)
      const [link] = yield* db
        .select({ revisionId: blueprintShareLink.revisionId })
        .from(blueprintShareLink)
        .where(
          and(eq(blueprintShareLink.tokenHash, tokenHash), isNull(blueprintShareLink.revokedAt))
        )
        .limit(1)
      if (link) {
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
    } satisfies BlueprintCoverUrlReceipt
  })
}

/** Verifies the exact source revision, then copies each referenced asset to a
 * recipient-owned cover (authoring copy) or workspace media asset (install).
 */
export function cloneBlueprintCoverAssets(input: {
  db?: BlueprintCoverDbClient
  actorUserId: string
  sourceRevisionId?: string
  sourceCatalogKey?: string
  sourceRevision?: number
  shareToken?: string
  shareTokenHash?: string
  destinationOrganizationId?: string
  copies: Array<{ sourceAssetId: string; destinationAssetId: string }>
}) {
  return Effect.gen(function* () {
    const storage = yield* BlueprintCoverStorage
    const source = yield* sourceRevisionForActor(input)
    const referenced = collectCoverIds(source.document)
    const copyPairs = input.copies.map((copy) => ({
      ...copy,
      sourceAssetId: copy.sourceAssetId.toLowerCase(),
      destinationAssetId: copy.destinationAssetId.toLowerCase(),
    }))
    if (copyPairs.some((pair) => pair.sourceAssetId === pair.destinationAssetId))
      return yield* Effect.fail(invalidState())
    const db = input.db ?? (yield* DB)
    const sourceAssets = yield* db
      .select()
      .from(blueprintCoverAsset)
      .where(
        and(
          inArray(blueprintCoverAsset.id, [
            ...new Set(copyPairs.map((pair) => pair.sourceAssetId)),
          ]),
          eq(blueprintCoverAsset.status, 'ready'),
          isNull(blueprintCoverAsset.deletedAt)
        )
      )
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
    const output: Array<{ sourceAssetId: string; destinationAssetId: string; created: boolean }> =
      []
    for (const pair of copyPairs) {
      const asset = sourceAssets.find((sourceAsset) => sourceAsset.id === pair.sourceAssetId)
      if (!asset || !asset.variantStorageKeys) return yield* Effect.fail(noCover())
      const hero = yield* storage.readBytes({ key: asset.variantStorageKeys.hero.storageKey })
      let created = false
      if (input.destinationOrganizationId) {
        const key = `workspaces/${input.destinationOrganizationId}/media/${pair.destinationAssetId}/original.jpg`
        const checksum = createHash('sha256').update(hero).digest('hex')
        const existing = yield* db
          .select({
            id: mediaAsset.id,
            organizationId: mediaAsset.organizationId,
            storageKey: mediaAsset.storageKey,
            uploadedByUserId: mediaAsset.uploadedByUserId,
            status: mediaAsset.status,
            checksum: mediaAsset.checksum,
          })
          .from(mediaAsset)
          .where(eq(mediaAsset.id, pair.destinationAssetId))
          .limit(1)
        if (
          existing[0] &&
          (existing[0].organizationId !== input.destinationOrganizationId ||
            existing[0].storageKey !== key ||
            existing[0].uploadedByUserId !== input.actorUserId ||
            existing[0].status !== 'ready' ||
            existing[0].checksum !== checksum)
        )
          return yield* Effect.fail(invalidState())
        if (!existing[0]) {
          yield* storage.putBytes({ key, mediaAssetId: pair.destinationAssetId, bytes: hero })
          yield* db.insert(mediaAsset).values({
            id: pair.destinationAssetId,
            organizationId: input.destinationOrganizationId,
            uploadedByUserId: input.actorUserId,
            kind: 'image',
            status: 'ready',
            visibility: 'private',
            bucket: asset.bucket,
            storageKey: key,
            originalFilename: asset.originalFilename,
            contentType: 'image/jpeg',
            byteSize: hero.byteLength,
            width: asset.variantStorageKeys.hero.width,
            height: asset.variantStorageKeys.hero.height,
            checksum,
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
        const existing = yield* db
          .select({
            id: blueprintCoverAsset.id,
            ownerUserId: blueprintCoverAsset.ownerUserId,
            originalStorageKey: blueprintCoverAsset.originalStorageKey,
            status: blueprintCoverAsset.status,
            checksum: blueprintCoverAsset.checksum,
          })
          .from(blueprintCoverAsset)
          .where(eq(blueprintCoverAsset.id, pair.destinationAssetId))
          .limit(1)
        if (
          existing[0] &&
          (existing[0].ownerUserId !== input.actorUserId ||
            existing[0].originalStorageKey !== destinationKey ||
            existing[0].status !== 'ready' ||
            existing[0].checksum !== asset.checksum)
        )
          return yield* Effect.fail(invalidState())
        if (!existing[0]) {
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
          yield* db.insert(blueprintCoverAsset).values({
            id: pair.destinationAssetId,
            ownerUserId: input.actorUserId,
            status: 'ready',
            bucket: asset.bucket,
            originalStorageKey: destinationKey,
            uploadStorageKey: uploadKey(input.actorUserId, pair.destinationAssetId),
            variantStorageKeys: destinationVariants,
            originalFilename: asset.originalFilename,
            contentType: 'image/jpeg',
            byteSize: asset.byteSize,
            width: asset.width,
            height: asset.height,
            checksum: asset.checksum,
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
}

/**
 * Turn a checked-in public Explore default into an ordinary private Blueprint
 * cover. The catalog tuple, URL, and per-variant checksums all come from the
 * server's immutable source tree; callers cannot supply a URL or digest.
 */
export function materializeCuratedExploreCover(input: {
  actorUserId: string
  requestId: string
  catalogKey: string
  revision: number
  contentHash: string
}) {
  return Effect.gen(function* () {
    const curated = resolveCuratedExploreCover(input)
    if (!curated) return undefined
    if (curated.status === 'invalid') return yield* Effect.fail(invalidState())
    const { manifest } = curated
    const hero = manifest.variants.find((variant) => variant.name === 'hero')
    if (!hero) return yield* Effect.fail(invalidState())
    const assetId = curatedExploreCoverAssetId({
      ...input,
      heroChecksum: hero.checksum,
    })
    const db = yield* DB
    const storage = yield* BlueprintCoverStorage
    const [existing] = yield* db
      .select()
      .from(blueprintCoverAsset)
      .where(eq(blueprintCoverAsset.id, assetId))
      .limit(1)
    if (existing) {
      if (
        existing.ownerUserId !== input.actorUserId ||
        existing.deletedAt !== null ||
        existing.status !== 'ready' ||
        !existing.variantStorageKeys ||
        existing.bucket !== storage.bucket ||
        existing.originalStorageKey !== coverKey(input.actorUserId, assetId, 'original') ||
        existing.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
        existing.contentType !== 'image/jpeg' ||
        existing.width !== hero.width ||
        existing.height !== hero.height ||
        existing.originalFilename !== 'curated-explore-cover.jpg' ||
        existing.checksum !== hero.checksum ||
        !hasMatchingVariantKeys(
          existing.variantStorageKeys,
          curatedVariantKeyMap(input.actorUserId, assetId, manifest.variants)
        )
      )
        return yield* Effect.fail(invalidState())
      return assetId
    }

    const variants = {} as Record<BlueprintCoverVariant, Buffer>
    let totalRead = 0
    for (const variantName of ['thumbnail', 'card', 'hero'] as const) {
      const variant = manifest.variants.find((item) => item.name === variantName)
      if (!variant) return yield* Effect.fail(noCover())
      const bytes = yield* Effect.tryPromise({
        try: async () => {
          const url = new URL(variant.url)
          if (
            url.origin !== 'https://cdn.gatherory.com' ||
            url.pathname !== `/${variant.key}` ||
            !url.pathname.startsWith('/explore/covers/')
          )
            throw new Error('Curated cover URL is outside the public Explore registry.')
          const response = await fetch(url, {
            redirect: 'error',
            signal: AbortSignal.timeout(30_000),
          })
          if (
            !response.ok ||
            response.headers.get('content-type')?.split(';')[0] !== 'image/jpeg' ||
            !response.body
          )
            throw new Error('Curated cover is not available as JPEG.')
          const reader = response.body.getReader()
          const chunks: Buffer[] = []
          const hash = createHash('sha256')
          let size = 0
          try {
            while (true) {
              const part = await reader.read()
              if (part.done) break
              size += part.value.byteLength
              totalRead += part.value.byteLength
              if (size > curatedCoverByteLimit || totalRead > curatedCoverByteLimit)
                throw new Error('Curated cover is too large.')
              const chunk = Buffer.from(part.value)
              chunks.push(chunk)
              hash.update(chunk)
            }
          } finally {
            await reader.cancel().catch(() => undefined)
          }
          if (!size || hash.digest('hex') !== variant.checksum)
            throw new Error('Curated cover checksum did not match its manifest.')
          const bytes = Buffer.concat(chunks, size)
          const metadata = await sharp(bytes, {
            failOn: 'error',
            limitInputPixels: maxPixels,
            animated: false,
          }).metadata()
          if (
            metadata.format !== 'jpeg' ||
            !metadata.width ||
            !metadata.height ||
            metadata.width !== variant.width ||
            metadata.height !== variant.height ||
            metadata.width * metadata.height > maxPixels
          )
            throw new Error('Curated cover dimensions or JPEG format did not match its manifest.')
          return bytes
        },
        catch: (cause) =>
          new ExternalServiceError({
            category: 'external',
            code: 'BLUEPRINT_CURATED_COVER_IMPORT_FAILED',
            userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
            cause,
          }),
      })
      variants[variantName] = bytes
    }

    const assetVariantKeys = curatedVariantKeyMap(input.actorUserId, assetId, manifest.variants)
    const originalKey = coverKey(input.actorUserId, assetId, 'original')
    // The curated source publishes bounded display variants only. The hero is
    // a suitable private normalized original and has its own verified digest.
    yield* storage.putBytes({ key: originalKey, mediaAssetId: assetId, bytes: variants.hero })
    for (const variant of ['thumbnail', 'card', 'hero'] as const) {
      yield* storage.putBytes({
        key: assetVariantKeys[variant].storageKey,
        mediaAssetId: assetId,
        bytes: variants[variant],
      })
    }
    yield* db
      .insert(blueprintCoverAsset)
      .values({
        id: assetId,
        ownerUserId: input.actorUserId,
        status: 'ready',
        bucket: storage.bucket,
        originalStorageKey: originalKey,
        uploadStorageKey: uploadKey(input.actorUserId, assetId),
        variantStorageKeys: assetVariantKeys,
        originalFilename: 'curated-explore-cover.jpg',
        contentType: 'image/jpeg',
        byteSize: variants.hero.byteLength,
        width: hero.width,
        height: hero.height,
        checksum: createHash('sha256').update(variants.hero).digest('hex'),
      })
      .onConflictDoNothing({ target: blueprintCoverAsset.id })
    const [persisted] = yield* db
      .select()
      .from(blueprintCoverAsset)
      .where(eq(blueprintCoverAsset.id, assetId))
      .limit(1)
    if (
      !persisted ||
      persisted.ownerUserId !== input.actorUserId ||
      persisted.deletedAt !== null ||
      persisted.status !== 'ready' ||
      persisted.bucket !== storage.bucket ||
      persisted.originalStorageKey !== originalKey ||
      persisted.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
      persisted.contentType !== 'image/jpeg' ||
      persisted.width !== hero.width ||
      persisted.height !== hero.height ||
      persisted.checksum !== hero.checksum ||
      !hasMatchingVariantKeys(persisted.variantStorageKeys, assetVariantKeys)
    )
      return yield* Effect.fail(invalidState())
    return assetId
  })
}

/**
 * Import unique, checked-in seed image manifests as private covers. Duplicate
 * target assignments share one deterministic private asset, and independent
 * CDN imports run with a small concurrency bound.
 */
export function materializeCuratedSeedImages(input: {
  actorUserId: string
  requestId: string
  catalogKey: string
  revision: number
  contentHash: string
  images: Array<{ assetKey: string; manifest: ExploreCoverManifest }>
}) {
  return Effect.gen(function* () {
    const db = yield* DB
    const storage = yield* BlueprintCoverStorage
    const uniqueByChecksum = new Map<string, { assetKey: string; manifest: ExploreCoverManifest }>()
    const assetKeysByChecksum = new Map<string, string[]>()
    for (const image of input.images) {
      const hero = image.manifest.variants.find((variant) => variant.name === 'hero')
      if (!hero) return yield* Effect.fail(invalidState())
      const keys = assetKeysByChecksum.get(hero.checksum) ?? []
      keys.push(image.assetKey)
      assetKeysByChecksum.set(hero.checksum, keys)
      if (!uniqueByChecksum.has(hero.checksum)) uniqueByChecksum.set(hero.checksum, image)
    }
    if (uniqueByChecksum.size > 151) return yield* Effect.fail(invalidState())

    const imported = yield* Effect.all(
      [...uniqueByChecksum.entries()].map(([heroChecksum, image]) =>
        Effect.gen(function* () {
          const manifest = image.manifest
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
          const expectedVariantKeys = curatedVariantKeyMap(input.actorUserId, assetId, manifest.variants)
          const [existing] = yield* db
            .select()
            .from(blueprintCoverAsset)
            .where(eq(blueprintCoverAsset.id, assetId))
            .limit(1)
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
              !hasMatchingVariantKeys(existing.variantStorageKeys, expectedVariantKeys)
            ) return yield* Effect.fail(invalidState())
            return [heroChecksum, assetId] as const
          }

          const variants = {} as Record<BlueprintCoverVariant, Buffer>
          let totalRead = 0
          for (const variantName of ['thumbnail', 'card', 'hero'] as const) {
            const variant = manifest.variants.find((item) => item.name === variantName)
            if (!variant) return yield* Effect.fail(noCover())
            const bytes = yield* Effect.tryPromise({
              try: async () => {
                const url = new URL(variant.url)
                if (
                  url.origin !== 'https://cdn.gatherory.com' ||
                  url.pathname !== `/${variant.key}` ||
                  !url.pathname.startsWith('/explore/covers/')
                ) throw new Error('Seed cover URL is outside the checked-in public registry.')
                const response = await fetch(url, {
                  redirect: 'error',
                  signal: AbortSignal.timeout(30_000),
                })
                if (
                  !response.ok ||
                  response.headers.get('content-type')?.split(';')[0] !== 'image/jpeg' ||
                  !response.body
                ) throw new Error('Seed cover is not available as JPEG.')
                const reader = response.body.getReader()
                const chunks: Buffer[] = []
                const hash = createHash('sha256')
                let size = 0
                try {
                  while (true) {
                    const part = await reader.read()
                    if (part.done) break
                    size += part.value.byteLength
                    totalRead += part.value.byteLength
                    if (size > curatedCoverByteLimit || totalRead > curatedCoverByteLimit)
                      throw new Error('Seed cover is too large.')
                    const chunk = Buffer.from(part.value)
                    chunks.push(chunk)
                    hash.update(chunk)
                  }
                } finally {
                  await reader.cancel().catch(() => undefined)
                }
                if (!size || hash.digest('hex') !== variant.checksum)
                  throw new Error('Seed cover checksum did not match its manifest.')
                const data = Buffer.concat(chunks, size)
                const metadata = await sharp(data, {
                  failOn: 'error',
                  limitInputPixels: maxPixels,
                  animated: false,
                }).metadata()
                if (
                  metadata.format !== 'jpeg' ||
                  metadata.width !== variant.width ||
                  metadata.height !== variant.height ||
                  !metadata.width ||
                  !metadata.height ||
                  metadata.width * metadata.height > maxPixels
                ) throw new Error('Seed cover dimensions did not match its manifest.')
                return data
              },
              catch: (cause) => new ExternalServiceError({
                category: 'external',
                code: 'BLUEPRINT_CURATED_COVER_IMPORT_FAILED',
                userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
                cause,
              }),
            })
            variants[variantName] = bytes
          }

          yield* storage.putBytes({ key: originalKey, mediaAssetId: assetId, bytes: variants.hero })
          for (const variant of ['thumbnail', 'card', 'hero'] as const) {
            yield* storage.putBytes({
              key: expectedVariantKeys[variant].storageKey,
              mediaAssetId: assetId,
              bytes: variants[variant],
            })
          }
          yield* db.insert(blueprintCoverAsset).values({
            id: assetId,
            ownerUserId: input.actorUserId,
            status: 'ready',
            bucket: storage.bucket,
            originalStorageKey: originalKey,
            uploadStorageKey: uploadKey(input.actorUserId, assetId),
            variantStorageKeys: expectedVariantKeys,
            originalFilename: 'curated-seed-cover.jpg',
            contentType: 'image/jpeg',
            byteSize: variants.hero.byteLength,
            width: hero.width,
            height: hero.height,
            checksum: hero.checksum,
          }).onConflictDoNothing({ target: blueprintCoverAsset.id })
          const [persisted] = yield* db
            .select()
            .from(blueprintCoverAsset)
            .where(eq(blueprintCoverAsset.id, assetId))
            .limit(1)
          if (
            !persisted ||
            persisted.ownerUserId !== input.actorUserId ||
            persisted.deletedAt !== null ||
            persisted.status !== 'ready' ||
            persisted.bucket !== storage.bucket ||
            persisted.originalStorageKey !== originalKey ||
            persisted.uploadStorageKey !== uploadKey(input.actorUserId, assetId) ||
            persisted.contentType !== 'image/jpeg' ||
            persisted.width !== hero.width ||
            persisted.height !== hero.height ||
            persisted.checksum !== hero.checksum ||
            !hasMatchingVariantKeys(persisted.variantStorageKeys, expectedVariantKeys)
          ) return yield* Effect.fail(invalidState())
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
    ) as Record<string, string>
  })
}

/** Trusted development-seed entry point; creates private covers for the supplied owner. */
export function materializeTrustedSeedImagesLive(input: Parameters<typeof materializeCuratedSeedImages>[0]) {
  return materializeCuratedSeedImages(input).pipe(
    Effect.provide(BlueprintCoverStorageLive),
    Effect.provide(PgClientLive)
  )
}
