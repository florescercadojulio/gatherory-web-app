import { and, eq, inArray, isNull, lt } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import type { Success } from 'effect/Effect'

import { DB } from '@/db'
import { blueprintCoverAsset } from '@/db/schema/blueprint-media.schema'
import {
  blueprintRevision,
  blueprintShareLink,
  blueprintTemplate,
} from '@/db/schema/blueprint.schema'
import { mediaAsset } from '@/db/schema/media.schema'
import { BlueprintCoverRepo } from './blueprint-cover.repo'

type Database = Success<typeof DB>

export const BlueprintCoverRepoLive = Layer.effect(
  BlueprintCoverRepo,
  Effect.gen(function* () {
    const baseDatabase = yield* DB
    const useDatabase = (database?: unknown): Database =>
      database === undefined ? baseDatabase : (database as Database)

    return {
      findSourceRevision: (input) => {
        const db = useDatabase(input.database)
        const sourcePredicate = input.sourceRevisionId
          ? eq(blueprintRevision.id, input.sourceRevisionId)
          : input.sourceCatalogKey && input.sourceRevision
            ? and(
                eq(blueprintRevision.catalogKey, input.sourceCatalogKey),
                eq(blueprintRevision.revision, input.sourceRevision)
              )
            : null
        if (!sourcePredicate) return Effect.succeed(null)
        return db
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
          .pipe(Effect.map((rows) => rows[0] ?? null))
      },
      findShareLink: (input) => {
        const db = useDatabase(input.database)
        const predicate = input.revisionId
          ? and(
              eq(blueprintShareLink.revisionId, input.revisionId),
              eq(blueprintShareLink.tokenHash, input.tokenHash)
            )
          : eq(blueprintShareLink.tokenHash, input.tokenHash)
        return db
          .select({
            revisionId: blueprintShareLink.revisionId,
            revokedAt: blueprintShareLink.revokedAt,
          })
          .from(blueprintShareLink)
          .where(predicate)
          .limit(1)
          .pipe(Effect.map((rows) => rows[0] ?? null))
      },
      findRevisionId: (input) => {
        const db = useDatabase(input.database)
        return db
          .select({ id: blueprintRevision.id })
          .from(blueprintRevision)
          .where(
            and(
              eq(blueprintRevision.catalogKey, input.catalogKey),
              eq(blueprintRevision.revision, input.revision)
            )
          )
          .limit(1)
          .pipe(Effect.map((rows) => rows[0]?.id ?? null))
      },
      findCoverAsset: (input) => {
        const db = useDatabase(input.database)
        const predicates = [eq(blueprintCoverAsset.id, input.id)]
        if (input.ownerUserId)
          predicates.push(eq(blueprintCoverAsset.ownerUserId, input.ownerUserId))
        if (input.status) predicates.push(eq(blueprintCoverAsset.status, input.status))
        if (input.excludeDeleted) predicates.push(isNull(blueprintCoverAsset.deletedAt))
        return db
          .select()
          .from(blueprintCoverAsset)
          .where(and(...predicates))
          .limit(1)
          .pipe(Effect.map((rows) => rows[0] ?? null))
      },
      findCoverAssets: (input) => {
        if (!input.ids.length) return Effect.succeed([])
        const db = useDatabase(input.database)
        const predicates = [inArray(blueprintCoverAsset.id, input.ids)]
        if (input.status) predicates.push(eq(blueprintCoverAsset.status, input.status))
        if (input.excludeDeleted) predicates.push(isNull(blueprintCoverAsset.deletedAt))
        return db
          .select()
          .from(blueprintCoverAsset)
          .where(and(...predicates))
      },
      createPendingAsset: (input) => {
        const db = useDatabase(input.database)
        return db
          .insert(blueprintCoverAsset)
          .values({
            id: input.id,
            ownerUserId: input.ownerUserId,
            status: 'pending',
            bucket: input.bucket,
            originalStorageKey: input.originalStorageKey,
            uploadStorageKey: input.uploadStorageKey,
            originalFilename: input.originalFilename,
            contentType: 'image/jpeg',
            byteSize: input.byteSize,
          })
          .onConflictDoNothing({ target: blueprintCoverAsset.id })
          .pipe(Effect.asVoid)
      },
      retryPendingAsset: (input) => {
        const db = useDatabase(input.database)
        return db
          .update(blueprintCoverAsset)
          .set({
            status: 'pending',
            originalFilename: input.originalFilename,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(blueprintCoverAsset.id, input.id),
              eq(blueprintCoverAsset.ownerUserId, input.ownerUserId)
            )
          )
          .pipe(Effect.asVoid)
      },
      claimProcessing: (input) => {
        const db = useDatabase(input.database)
        return db
          .update(blueprintCoverAsset)
          .set({
            status: 'processing',
            processingToken: input.processingToken,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(blueprintCoverAsset.id, input.id),
              eq(blueprintCoverAsset.ownerUserId, input.ownerUserId),
              eq(blueprintCoverAsset.status, 'pending')
            )
          )
          .returning({ id: blueprintCoverAsset.id })
          .pipe(Effect.map((rows) => Boolean(rows[0])))
      },
      reclaimProcessing: (input) => {
        const db = useDatabase(input.database)
        return db
          .update(blueprintCoverAsset)
          .set({ processingToken: input.processingToken, updatedAt: new Date() })
          .where(
            and(
              eq(blueprintCoverAsset.id, input.id),
              eq(blueprintCoverAsset.ownerUserId, input.ownerUserId),
              eq(blueprintCoverAsset.status, 'processing'),
              lt(blueprintCoverAsset.updatedAt, input.expiredBefore)
            )
          )
          .returning({ id: blueprintCoverAsset.id })
          .pipe(Effect.map((rows) => Boolean(rows[0])))
      },
      markFailed: (input) => {
        const db = useDatabase(input.database)
        return db
          .update(blueprintCoverAsset)
          .set({ status: 'failed', processingToken: null, updatedAt: new Date() })
          .where(
            and(
              eq(blueprintCoverAsset.id, input.id),
              eq(blueprintCoverAsset.processingToken, input.processingToken)
            )
          )
          .returning({ id: blueprintCoverAsset.id })
          .pipe(Effect.map((rows) => Boolean(rows[0])))
      },
      markReady: (input) => {
        const db = useDatabase(input.database)
        return db
          .update(blueprintCoverAsset)
          .set({
            status: 'ready',
            processingToken: null,
            originalStorageKey: input.originalStorageKey,
            byteSize: input.byteSize,
            width: input.width,
            height: input.height,
            checksum: input.checksum,
            variantStorageKeys: input.variantStorageKeys,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(blueprintCoverAsset.id, input.id),
              eq(blueprintCoverAsset.ownerUserId, input.ownerUserId),
              eq(blueprintCoverAsset.status, 'processing'),
              eq(blueprintCoverAsset.processingToken, input.processingToken)
            )
          )
          .returning({ id: blueprintCoverAsset.id })
          .pipe(Effect.map((rows) => Boolean(rows[0])))
      },
      findMediaAsset: (input) => {
        const db = useDatabase(input.database)
        return db
          .select({
            id: mediaAsset.id,
            organizationId: mediaAsset.organizationId,
            storageKey: mediaAsset.storageKey,
            uploadedByUserId: mediaAsset.uploadedByUserId,
            status: mediaAsset.status,
            checksum: mediaAsset.checksum,
          })
          .from(mediaAsset)
          .where(eq(mediaAsset.id, input.id))
          .limit(1)
          .pipe(Effect.map((rows) => rows[0] ?? null))
      },
      createMediaAsset: (input) => {
        const db = useDatabase(input.database)
        return db
          .insert(mediaAsset)
          .values({
            id: input.id,
            organizationId: input.organizationId,
            uploadedByUserId: input.uploadedByUserId,
            kind: 'image',
            status: 'ready',
            visibility: 'private',
            bucket: input.bucket,
            storageKey: input.storageKey,
            originalFilename: input.originalFilename,
            contentType: 'image/jpeg',
            byteSize: input.byteSize,
            width: input.width,
            height: input.height,
            checksum: input.checksum,
          })
          .pipe(Effect.asVoid)
      },
      createReadyAsset: (input) => {
        const db = useDatabase(input.database)
        return db
          .insert(blueprintCoverAsset)
          .values({
            id: input.id,
            ownerUserId: input.ownerUserId,
            status: 'ready',
            bucket: input.bucket,
            originalStorageKey: input.originalStorageKey,
            uploadStorageKey: input.uploadStorageKey,
            variantStorageKeys: input.variantStorageKeys,
            originalFilename: input.originalFilename,
            contentType: 'image/jpeg',
            byteSize: input.byteSize,
            width: input.width,
            height: input.height,
            checksum: input.checksum,
          })
          .onConflictDoNothing({ target: blueprintCoverAsset.id })
          .pipe(Effect.asVoid)
      },
    }
  })
)
