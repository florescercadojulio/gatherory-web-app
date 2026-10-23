import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member, organization } from '@/db/schema/auth.schema'
import { hasOrganizationOwnerRole } from '../../auth/organization-role-membership'
import {
  blueprintRevision,
  blueprintShareLink,
  blueprintTemplate,
} from '@/db/schema/blueprint.schema'
import { blueprintAttributionAcquisition } from '@/db/schema/blueprint-attribution.schema'
import {
  blueprintDiscoveryExposure,
  blueprintDiscoverySignal,
  blueprintMeasurementSetting,
} from '@/db/schema/blueprint-discovery.schema'
import {
  BlueprintDraftContentSchema,
  draftDefinition,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'
import { blueprintDraftContentHash, blueprintHash } from '../planning/blueprint-hash'
import { isBlueprintDiscoveryAccountEligible } from '../services/blueprint-measurement-eligibility'
import { canRecordBlueprintAttribution } from '../services/blueprint-attribution'
import { ConflictError, EntityNotFoundError, serverOperationError } from '@/lib/domain-errors'
import { BlueprintPersonalRepo, type PersonalBlueprint } from './blueprint-personal.repo'
import {
  curatedExploreCoverAssetId,
  resolveCuratedExploreCover,
} from '../catalog/explore-cover-import'
import seedImageAssignmentsRaw from '../catalog/seed-image-assignments.json'
import seedImageAssetsRaw from '../catalog/seed-image-assets.json'
import {
  SeedImageAssetsSchema,
  SeedImageAssignmentsSchema,
  resolveSeedImageTargets,
  seedImageCoverAssetId,
  seedImageTargetAssetKeys,
} from '../catalog/seed-image-registry'
import {
  cloneBlueprintCoverAssets,
  materializeCuratedExploreCover,
  materializeCuratedSeedImages,
  validateBlueprintCoverReferences,
} from '@/server/blueprint-media/blueprint-cover.service'
import {
  BlueprintCoverStorage,
  BlueprintCoverStorageLive,
} from '@/server/blueprint-media/blueprint-cover.storage.live'

const seedImageAssignments = SeedImageAssignmentsSchema.parse(seedImageAssignmentsRaw)
const seedImageAssets = SeedImageAssetsSchema.parse(seedImageAssetsRaw)

const missing = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'BLUEPRINT_NOT_FOUND',
    userMessageKey: 'serverErrors.NOT_FOUND',
  })
const conflict = (code = 'BLUEPRINT_DRAFT_VERSION_CONFLICT') =>
  new ConflictError({
    category: 'conflict',
    code,
    userMessageKey: 'serverErrors.CONFLICT',
  })

export const BlueprintPersonalRepoLive = Layer.effect(
  BlueprintPersonalRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    const coverStorage = yield* BlueprintCoverStorage
    const bind = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_PERSONAL_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )
    const seedImagesForSource = (source?: { catalogKey: string; revision: number }) =>
      Effect.gen(function* () {
        if (!source) return undefined
        const [revision] = yield* db
          .select({
            contentHash: blueprintRevision.contentHash,
            templateId: blueprintRevision.templateId,
            retiredAt: blueprintRevision.retiredAt,
          })
          .from(blueprintRevision)
          .where(
            and(
              eq(blueprintRevision.catalogKey, source.catalogKey),
              eq(blueprintRevision.revision, source.revision)
            )
          )
          .limit(1)
        if (!revision || revision.templateId !== null || revision.retiredAt !== null)
          return undefined
        return resolveSeedImageTargets({
          entry: { ...source, contentHash: revision.contentHash },
          assignments: seedImageAssignments,
          assets: seedImageAssets,
        })
      })
    const expectedSeedCoverIds = (
      actorUserId: string,
      requestId: string,
      source: { catalogKey: string; revision: number; contentHash: string },
      targets: ReturnType<typeof resolveSeedImageTargets>
    ) => {
      if (!targets) return {}
      const idsByChecksum = new Map<string, string>()
      if (targets.root) {
        const curated = resolveCuratedExploreCover(source)
        const heroChecksum = targets.root.manifest.variants.find(
          (variant) => variant.name === 'hero'
        )?.checksum
        const legacy =
          curated?.status === 'available'
            ? curated.manifest.variants.find((variant) => variant.name === 'hero')?.checksum
            : undefined
        if (heroChecksum && heroChecksum === legacy) {
          idsByChecksum.set(
            heroChecksum,
            curatedExploreCoverAssetId({
              actorUserId,
              requestId,
              catalogKey: source.catalogKey,
              revision: source.revision,
              contentHash: source.contentHash,
              heroChecksum,
            })
          )
        }
      }
      const ids: Record<string, string> = {}
      for (const assetKey of seedImageTargetAssetKeys(targets)) {
        const asset = seedImageAssets[assetKey]
        const heroChecksum = asset?.manifest.variants.find(
          (variant) => variant.name === 'hero'
        )?.checksum
        if (!heroChecksum) continue
        const id =
          idsByChecksum.get(heroChecksum) ??
          seedImageCoverAssetId({
            actorUserId,
            requestId,
            catalogKey: source.catalogKey,
            revision: source.revision,
            contentHash: source.contentHash,
            heroChecksum,
          })
        idsByChecksum.set(heroChecksum, id)
        ids[assetKey] = id
      }
      return ids
    }
    const applySeedCoverDefaults = (
      content: import('@/contracts/blueprint-authoring.contracts').BlueprintDraftContent,
      targets: ReturnType<typeof resolveSeedImageTargets>,
      ids: Record<string, string>
    ) => {
      if (!targets) return content
      const rootID = targets.root ? ids[targets.root.assetKey] : undefined
      return {
        ...content,
        ...(content.coverAssetId === undefined && rootID ? { coverAssetId: rootID } : {}),
        children: content.children.map((item) => {
          const image = targets.children[item.key]
          const id = image ? ids[image.assetKey] : undefined
          return item.coverAssetId === undefined && id ? { ...item, coverAssetId: id } : item
        }),
        ideas: content.ideas.map((item) => {
          const image = targets.ideas[item.key]
          const id = image ? ids[image.assetKey] : undefined
          return item.coverAssetId === undefined && id ? { ...item, coverAssetId: id } : item
        }),
      }
    }
    const stripCoverDefaults = (
      content: import('@/contracts/blueprint-authoring.contracts').BlueprintDraftContent,
      ids: Set<string>
    ) => {
      const strip = (value: { coverAssetId?: string | null }) =>
        typeof value.coverAssetId === 'string' && ids.has(value.coverAssetId.toLowerCase())
          ? (({ coverAssetId: _cover, ...rest }) => rest)(value)
          : value
      const root = strip(content)
      return {
        ...root,
        children: content.children.map(strip),
        ideas: content.ideas.map(strip),
      } as import('@/contracts/blueprint-authoring.contracts').BlueprintDraftContent
    }
    const personalOrganizationId = (actorId: string) =>
      Effect.gen(function* () {
        const slug = `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
        const [row] = yield* db
          .select({ id: organization.id })
          .from(organization)
          .innerJoin(member, eq(member.organizationId, organization.id))
          .where(
            and(
              eq(organization.slug, slug),
              eq(member.userId, actorId),
              hasOrganizationOwnerRole(member.role)
            )
          )
        return row?.id ?? null
      })
    const owned = (actorId: string, id: string) =>
      Effect.gen(function* () {
        const organizationId = yield* personalOrganizationId(actorId)
        if (!organizationId) return yield* Effect.fail(missing())
        const [row] = yield* db
          .select()
          .from(blueprintTemplate)
          .where(
            and(
              eq(blueprintTemplate.id, id),
              eq(blueprintTemplate.organizationId, organizationId),
              eq(blueprintTemplate.createdByUserId, actorId),
              isNull(blueprintTemplate.retiredAt)
            )
          )
          .for('update')
        if (!row) return yield* Effect.fail(missing())
        return row
      })
    const entry = (
      row: typeof blueprintTemplate.$inferSelect,
      revision: number
    ): PersonalBlueprint['catalogEntry'] => {
      const content = BlueprintDraftContentSchema.parse(row.content)
      const definition = BlueprintCatalogDefinitionSchema.parse(
        draftDefinition(content, row.catalogKey, revision)
      )
      return {
        catalogKey: row.catalogKey,
        revision,
        contentHash: blueprintHash(definition),
        definition,
        description: content.description,
        ...(row.creatorName ? { creator: { displayName: row.creatorName } } : {}),
      }
    }
    const activeLinkCounts = (templateIds: string[]) =>
      Effect.gen(function* () {
        if (!templateIds.length) return new Map<string, number>()
        const rows = yield* db
          .select({
            templateId: blueprintRevision.templateId,
            count: sql<number>`count(*)::int`,
          })
          .from(blueprintShareLink)
          .innerJoin(blueprintRevision, eq(blueprintRevision.id, blueprintShareLink.revisionId))
          .innerJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
          .where(
            and(
              inArray(blueprintRevision.templateId, templateIds),
              isNull(blueprintShareLink.revokedAt),
              isNull(blueprintRevision.retiredAt),
              isNull(blueprintTemplate.retiredAt)
            )
          )
          .groupBy(blueprintRevision.templateId)
        return new Map(rows.map(({ templateId, count }) => [templateId!, count]))
      })
    const shape = (
      row: typeof blueprintTemplate.$inferSelect,
      activeShareLinkCount = 0
    ): PersonalBlueprint => ({
      id: row.id,
      draftVersion: row.draftVersion,
      publishedRevision: row.publishedRevision,
      listedRevision: row.listedRevision,
      creatorName: row.creatorName,
      activeShareLinkCount,
      catalogEntry: entry(row, row.publishedRevision ?? 1),
    })
    const stableCopyCoverId = (requestId: string, sourceAssetId: string) => {
      const hex = createHash('sha256')
        .update(`blueprint-copy-cover:${requestId.toLowerCase()}:${sourceAssetId.toLowerCase()}`)
        .digest('hex')
        .slice(0, 32)
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16]!, 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`
    }
    const remapCovers = (
      content: import('@/contracts/blueprint-authoring.contracts').BlueprintDraftContent,
      mapping: Record<string, string>
    ) => {
      const remap = (id: string | null | undefined) =>
        typeof id === 'string' ? (mapping[id.toLowerCase()] ?? id) : id
      return {
        ...content,
        ...(content.coverAssetId !== undefined
          ? { coverAssetId: remap(content.coverAssetId) }
          : {}),
        children: content.children.map((item) => ({
          ...item,
          ...(item.coverAssetId !== undefined ? { coverAssetId: remap(item.coverAssetId) } : {}),
        })),
        ideas: content.ideas.map((item) => ({
          ...item,
          ...(item.coverAssetId !== undefined ? { coverAssetId: remap(item.coverAssetId) } : {}),
        })),
      }
    }
    const validateCovers = (
      actorUserId: string,
      assetIds: string[],
      source?: {
        catalogKey: string
        revision: number
        shareToken?: string
        discoveryExposureId?: string
      }
    ) =>
      validateBlueprintCoverReferences({
        actorUserId,
        assetIds,
        ...(source
          ? {
              sourceCatalogKey: source.catalogKey,
              sourceRevision: source.revision,
              ...(source.shareToken ? { shareToken: source.shareToken } : {}),
            }
          : {}),
      }).pipe(Effect.provideService(PgClient, pg))
    const tryRecordCopyAttribution = (
      actorId: string,
      input: {
        content: import('@/contracts/blueprint-authoring.contracts').BlueprintDraftContent
        source?: {
          catalogKey: string
          revision: number
          shareToken?: string
          discoveryExposureId?: string
        }
      },
      copyTemplateId: string,
      copyRevisionId: string,
      copyContentHash: string
    ) =>
      pg
        .withTransaction(
          Effect.gen(function* () {
            yield* db.execute(
              sql`select pg_advisory_xact_lock(hashtext(${`blueprint-measurement:${actorId}`}))`
            )
            const source = input.source
            if (
              !source?.discoveryExposureId ||
              source.shareToken ||
              !isBlueprintDiscoveryAccountEligible(actorId)
            )
              return
            const [original] = yield* db
              .select({
                id: blueprintRevision.id,
                templateId: blueprintRevision.templateId,
                contentHash: blueprintRevision.contentHash,
                retiredAt: blueprintRevision.retiredAt,
                listedRevision: blueprintTemplate.listedRevision,
                templateRetiredAt: blueprintTemplate.retiredAt,
                creatorUserId: blueprintTemplate.createdByUserId,
              })
              .from(blueprintRevision)
              .leftJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
              .where(
                and(
                  eq(blueprintRevision.catalogKey, source.catalogKey),
                  eq(blueprintRevision.revision, source.revision)
                )
              )
              .limit(1)
            if (!original) return
            // The draft projection must reproduce the immutable publication exactly.
            // A client source marker with edited content is not adoption evidence.
            const sourceContentMatches =
              blueprintHash(draftDefinition(input.content, source.catalogKey, source.revision)) ===
              original.contentHash
            const sourceListed =
              original.retiredAt === null &&
              (original.templateId === null ||
                (original.templateRetiredAt === null &&
                  original.listedRevision === source.revision))
            const sourceNotSelfAuthored =
              original.templateId === null || original.creatorUserId !== actorId
            const now = new Date()
            const [exposure] = source.discoveryExposureId
              ? yield* db
                  .select()
                  .from(blueprintDiscoveryExposure)
                  .where(eq(blueprintDiscoveryExposure.exposureId, source.discoveryExposureId))
                  .limit(1)
              : []
            const [setting] = yield* db
              .select({ enabled: blueprintMeasurementSetting.enabled })
              .from(blueprintMeasurementSetting)
              .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
              .limit(1)
            const [opened] = source.discoveryExposureId
              ? yield* db
                  .select({ id: blueprintDiscoverySignal.id })
                  .from(blueprintDiscoverySignal)
                  .where(
                    and(
                      eq(blueprintDiscoverySignal.actorUserId, actorId),
                      eq(blueprintDiscoverySignal.exposureId, source.discoveryExposureId),
                      eq(blueprintDiscoverySignal.kind, 'open')
                    )
                  )
                  .limit(1)
              : []
            const eligible = canRecordBlueprintAttribution({
              actorEligible: isBlueprintDiscoveryAccountEligible(actorId),
              measurementEnabled: setting?.enabled === true,
              hasExposureReference: Boolean(source.discoveryExposureId),
              usedBearerLink: Boolean(source.shareToken),
              sourceListed,
              sourceNotSelfAuthored,
              sourceContentMatches,
              exposureBoundToActorAndSource: Boolean(
                exposure &&
                exposure.actorUserId === actorId &&
                exposure.catalogKey === source.catalogKey &&
                exposure.sourceRevision === source.revision &&
                exposure.contentHash === original.contentHash
              ),
              hasRecordedOpen: Boolean(opened),
              exposureActive: Boolean(
                exposure && exposure.issuedAt <= now && exposure.expiresAt > now
              ),
            })
            if (!eligible || !exposure) return
            const acquiredAt = new Date()
            // Retention is anchored to issuance so a late copy cannot extend the
            // exposure/acquisition/adoption chain beyond 30 days from discovery.
            const expiresAt = new Date(exposure.issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
            yield* db.insert(blueprintAttributionAcquisition).values({
              actorUserId: actorId,
              exposureId: exposure.exposureId,
              copyTemplateId,
              copyRevisionId,
              copyContentHash,
              sourceCatalogKey: source.catalogKey,
              sourceRevision: source.revision,
              sourceContentHash: original.contentHash,
              acquiredAt,
              expiresAt,
            })
          })
        )
        .pipe(Effect.catchCause(() => Effect.void))
    const existingCopy = (
      actorId: string,
      input: {
        requestId: string
        content: import('@/contracts/blueprint-authoring.contracts').BlueprintDraftContent
        source?: {
          catalogKey: string
          revision: number
          shareToken?: string
          discoveryExposureId?: string
        }
      }
    ) =>
      pg.withTransaction(
        Effect.gen(function* () {
          const organizationId = yield* personalOrganizationId(actorId)
          if (!organizationId) return yield* Effect.fail(missing())
          yield* db.execute(
            sql`select pg_advisory_xact_lock(hashtextextended(${`blueprint-create:${actorId}:${input.requestId.toLowerCase()}`}, 0))`
          )
          const [existing] = yield* db
            .select()
            .from(blueprintTemplate)
            .where(
              and(
                eq(blueprintTemplate.createdByUserId, actorId),
                eq(blueprintTemplate.createRequestId, input.requestId)
              )
            )
          if (!existing) return undefined
          const savedContent = BlueprintDraftContentSchema.safeParse(existing.content)
          const existingSource = existing.source as {
            kind?: string
            curatedCoverAssetId?: string
            curatedCoverAssetIds?: string[]
            source?: { catalogKey: string; revision: number }
          } | null
          let comparableContent = savedContent.success ? savedContent.data : null
          const normalizedInput = input.source
            ? remapCovers(
                input.content,
                Object.fromEntries(
                  coverAssetIds(input.content).map((sourceAssetId) => [
                    sourceAssetId.toLowerCase(),
                    stableCopyCoverId(input.requestId, sourceAssetId),
                  ])
                )
              )
            : input.content
          const seedTargets = yield* seedImagesForSource(input.source)
          const assignment = input.source
            ? seedImageAssignments[input.source.catalogKey]
            : undefined
          const defaultSeedIDs =
            seedTargets && input.source && assignment
              ? expectedSeedCoverIds(
                  actorId,
                  input.requestId,
                  {
                    ...input.source,
                    contentHash: assignment.contentHash,
                  },
                  seedTargets
                )
              : {}
          const strippedIDs = new Set([
            ...Object.values(defaultSeedIDs).map((id) => id.toLowerCase()),
            ...(existingSource?.curatedCoverAssetId
              ? [existingSource.curatedCoverAssetId.toLowerCase()]
              : []),
            ...(existingSource?.curatedCoverAssetIds ?? []).map((id) => id.toLowerCase()),
          ])
          if (comparableContent && strippedIDs.size) {
            comparableContent = stripCoverDefaults(comparableContent, strippedIDs)
          }
          const sameContent = Boolean(
            comparableContent &&
            blueprintDraftContentHash(comparableContent) ===
              blueprintDraftContentHash(normalizedInput)
          )
          const [published] = yield* db
            .select()
            .from(blueprintRevision)
            .where(
              and(
                eq(blueprintRevision.templateId, existing.id),
                eq(blueprintRevision.revision, 1),
                eq(blueprintRevision.draftVersion, 1)
              )
            )
          const expectedDefinition = savedContent.success
            ? BlueprintCatalogDefinitionSchema.safeParse(
                draftDefinition(savedContent.data, existing.catalogKey, 1)
              )
            : null
          const samePublication = Boolean(
            published &&
            expectedDefinition?.success &&
            published.contentHash === blueprintHash(expectedDefinition.data)
          )
          if (
            existing.organizationId !== organizationId ||
            !savedContent.success ||
            existing.createRequestHash !== blueprintDraftContentHash(savedContent.data) ||
            existingSource?.kind !== 'setup_copy' ||
            existingSource.source?.catalogKey !== input.source?.catalogKey ||
            existingSource.source?.revision !== input.source?.revision ||
            existing.retiredAt !== null ||
            existing.publishedRevision !== 1 ||
            existing.publishedDraftVersion !== existing.draftVersion ||
            existing.listedRevision !== null ||
            existing.creatorName !== null ||
            !sameContent ||
            !samePublication
          )
            return yield* Effect.fail(
              new ConflictError({
                category: 'conflict',
                code: 'BLUEPRINT_COPY_REQUEST_CONFLICT',
                userMessageKey: 'serverErrors.CONFLICT',
              })
            )
          return shape(existing, (yield* activeLinkCounts([existing.id])).get(existing.id) ?? 0)
        })
      )
    return {
      copy: (actorId, input) =>
        bind(
          Effect.gen(function* () {
            const previous = yield* existingCopy(actorId, input)
            if (previous) return previous
            const sourceAssetIds = coverAssetIds(input.content)
            let content = input.content
            let curatedDefaultCoverAssetId: string | undefined
            let curatedDefaultCoverAssetIds: string[] = []
            let cloned: Array<{
              sourceAssetId: string
              destinationAssetId: string
              created: boolean
            }> = []
            if (sourceAssetIds.length) {
              yield* validateCovers(actorId, sourceAssetIds, input.source)
              if (input.source) {
                cloned = yield* cloneBlueprintCoverAssets({
                  actorUserId: actorId,
                  sourceCatalogKey: input.source.catalogKey,
                  sourceRevision: input.source.revision,
                  ...(input.source.shareToken ? { shareToken: input.source.shareToken } : {}),
                  copies: sourceAssetIds.map((sourceAssetId) => ({
                    sourceAssetId,
                    destinationAssetId: stableCopyCoverId(input.requestId, sourceAssetId),
                  })),
                }).pipe(
                  Effect.provideService(PgClient, pg),
                  Effect.provideService(BlueprintCoverStorage, coverStorage)
                )
                content = remapCovers(
                  content,
                  Object.fromEntries(
                    cloned.map((item) => [
                      item.sourceAssetId.toLowerCase(),
                      item.destinationAssetId,
                    ])
                  )
                )
              }
            }
            // Public seed covers become ordinary private Blueprint assets.
            // Explicit nulls and user-supplied asset IDs always take priority.
            const sourceSeedTargets = yield* seedImagesForSource(input.source)
            const sourceAssignment = input.source
              ? seedImageAssignments[input.source.catalogKey]
              : undefined
            if (sourceSeedTargets && input.source && sourceAssignment) {
              const defaultIDs = expectedSeedCoverIds(
                actorId,
                input.requestId,
                {
                  ...input.source,
                  contentHash: sourceAssignment.contentHash,
                },
                sourceSeedTargets
              )
              const neededAssetKeys = new Set<string>()
              if (input.content.coverAssetId === undefined && sourceSeedTargets.root)
                neededAssetKeys.add(sourceSeedTargets.root.assetKey)
              for (const item of input.content.children) {
                const image = sourceSeedTargets.children[item.key]
                if (item.coverAssetId === undefined && image) neededAssetKeys.add(image.assetKey)
              }
              for (const item of input.content.ideas) {
                const image = sourceSeedTargets.ideas[item.key]
                if (item.coverAssetId === undefined && image) neededAssetKeys.add(image.assetKey)
              }
              let legacyRootID: string | undefined
              let legacyRootChecksum: string | undefined
              const root = sourceSeedTargets.root
              if (root && neededAssetKeys.has(root.assetKey)) {
                const curated = resolveCuratedExploreCover({
                  ...input.source,
                  contentHash: sourceAssignment.contentHash,
                })
                const curatedChecksum =
                  curated?.status === 'available'
                    ? curated.manifest.variants.find((variant) => variant.name === 'hero')?.checksum
                    : undefined
                const seedChecksum = root.manifest.variants.find(
                  (variant) => variant.name === 'hero'
                )?.checksum
                if (curatedChecksum && curatedChecksum === seedChecksum) {
                  legacyRootChecksum = curatedChecksum
                  legacyRootID = yield* materializeCuratedExploreCover({
                    actorUserId: actorId,
                    requestId: input.requestId,
                    catalogKey: input.source.catalogKey,
                    revision: input.source.revision,
                    contentHash: sourceAssignment.contentHash,
                  }).pipe(
                    Effect.provideService(PgClient, pg),
                    Effect.provideService(BlueprintCoverStorage, coverStorage)
                  )
                }
              }
              const imagesToImport = seedImageTargetAssetKeys(sourceSeedTargets)
                .filter((assetKey) => neededAssetKeys.has(assetKey))
                .filter((assetKey) => {
                  const checksum = seedImageAssets[assetKey]?.manifest.variants.find(
                    (variant) => variant.name === 'hero'
                  )?.checksum
                  return !legacyRootChecksum || checksum !== legacyRootChecksum
                })
                .map((assetKey) => ({
                  assetKey,
                  manifest: seedImageAssets[assetKey]!.manifest,
                }))
              const importedIDs = imagesToImport.length
                ? yield* materializeCuratedSeedImages({
                    actorUserId: actorId,
                    requestId: input.requestId,
                    catalogKey: input.source.catalogKey,
                    revision: input.source.revision,
                    contentHash: sourceAssignment.contentHash,
                    images: imagesToImport,
                  }).pipe(
                    Effect.provideService(PgClient, pg),
                    Effect.provideService(BlueprintCoverStorage, coverStorage)
                  )
                : {}
              const allIDs = { ...defaultIDs, ...importedIDs }
              if (legacyRootID && root) allIDs[root.assetKey] = legacyRootID
              content = applySeedCoverDefaults(content, sourceSeedTargets, allIDs)
              const defaulted = [
                content.coverAssetId !== input.content.coverAssetId
                  ? content.coverAssetId
                  : undefined,
                ...content.children.flatMap((item, index) =>
                  input.content.children[index]?.coverAssetId === undefined &&
                  item.coverAssetId !== undefined
                    ? [item.coverAssetId]
                    : []
                ),
                ...content.ideas.flatMap((item, index) =>
                  input.content.ideas[index]?.coverAssetId === undefined &&
                  item.coverAssetId !== undefined
                    ? [item.coverAssetId]
                    : []
                ),
              ].filter((id): id is string => typeof id === 'string')
              curatedDefaultCoverAssetIds = [...new Set(defaulted)]
              if (root && input.content.coverAssetId === undefined)
                curatedDefaultCoverAssetId = content.coverAssetId ?? undefined
            }
            const result = yield* pg.withTransaction(
              Effect.gen(function* () {
                const organizationId = yield* personalOrganizationId(actorId)
                if (!organizationId) return yield* Effect.fail(missing())
                const requestHash = blueprintDraftContentHash(content)
                yield* db.execute(
                  sql`select pg_advisory_xact_lock(hashtextextended(${`blueprint-create:${actorId}:${input.requestId.toLowerCase()}`}, 0))`
                )
                const [existing] = yield* db
                  .select()
                  .from(blueprintTemplate)
                  .where(
                    and(
                      eq(blueprintTemplate.createdByUserId, actorId),
                      eq(blueprintTemplate.createRequestId, input.requestId)
                    )
                  )
                if (existing) {
                  const savedContent = BlueprintDraftContentSchema.safeParse(existing.content)
                  const sameContent =
                    savedContent.success &&
                    blueprintDraftContentHash(savedContent.data) === requestHash
                  const source = existing.source as { kind?: string } | null
                  const sourceRevision =
                    source?.kind === 'setup_copy'
                      ? (source as { source?: { catalogKey: string; revision: number } }).source
                      : undefined
                  const [published] = yield* db
                    .select()
                    .from(blueprintRevision)
                    .where(
                      and(
                        eq(blueprintRevision.templateId, existing.id),
                        eq(blueprintRevision.revision, 1),
                        eq(blueprintRevision.draftVersion, 1)
                      )
                    )
                  const expectedDefinition = savedContent.success
                    ? BlueprintCatalogDefinitionSchema.safeParse(
                        draftDefinition(savedContent.data, existing.catalogKey, 1)
                      )
                    : null
                  const samePublication = Boolean(
                    published &&
                    expectedDefinition?.success &&
                    published.contentHash === blueprintHash(expectedDefinition.data)
                  )
                  if (
                    existing.createRequestHash !== requestHash ||
                    existing.organizationId !== organizationId ||
                    source?.kind !== 'setup_copy' ||
                    sourceRevision?.catalogKey !== input.source?.catalogKey ||
                    sourceRevision?.revision !== input.source?.revision ||
                    existing.retiredAt !== null ||
                    existing.publishedRevision !== 1 ||
                    existing.publishedDraftVersion !== existing.draftVersion ||
                    existing.listedRevision !== null ||
                    existing.creatorName !== null ||
                    !sameContent ||
                    !samePublication
                  )
                    return yield* Effect.fail(
                      new ConflictError({
                        category: 'conflict',
                        code: 'BLUEPRINT_COPY_REQUEST_CONFLICT',
                        userMessageKey: 'serverErrors.CONFLICT',
                      })
                    )
                  return shape(
                    existing,
                    (yield* activeLinkCounts([existing.id])).get(existing.id) ?? 0
                  )
                }
                const id = crypto.randomUUID()
                const catalogKey = `private_${id.replaceAll('-', '')}`
                const definition = BlueprintCatalogDefinitionSchema.parse(
                  draftDefinition(content, catalogKey, 1)
                )
                const contentHash = blueprintHash(definition)
                const [row] = yield* db
                  .insert(blueprintTemplate)
                  .values({
                    id,
                    catalogKey,
                    organizationId,
                    createdByUserId: actorId,
                    createRequestId: input.requestId,
                    createRequestHash: requestHash,
                    content,
                    creatorName: null,
                    draftVersion: 1,
                    publishedRevision: 1,
                    publishedDraftVersion: 1,
                    listedRevision: null,
                    source: {
                      kind: 'setup_copy',
                      ...(curatedDefaultCoverAssetId
                        ? { curatedCoverAssetId: curatedDefaultCoverAssetId }
                        : {}),
                      ...(curatedDefaultCoverAssetIds.length
                        ? { curatedCoverAssetIds: curatedDefaultCoverAssetIds }
                        : {}),
                      ...(input.source
                        ? {
                            source: {
                              catalogKey: input.source.catalogKey,
                              revision: input.source.revision,
                            },
                          }
                        : {}),
                    },
                  })
                  .returning()
                const [privateRevision] = yield* db
                  .insert(blueprintRevision)
                  .values({
                    templateId: id,
                    draftVersion: 1,
                    catalogKey,
                    revision: 1,
                    document: definition,
                    contentHash,
                    description: input.content.description,
                  })
                  .returning({ id: blueprintRevision.id })
                yield* tryRecordCopyAttribution(
                  actorId,
                  input,
                  id,
                  privateRevision!.id,
                  contentHash
                )
                return shape(row!)
              })
            )
            return result
          })
        ),
      list: (actorId) =>
        bind(
          Effect.gen(function* () {
            const organizationId = yield* personalOrganizationId(actorId)
            if (!organizationId) return { templates: [] }
            const rows = yield* db
              .select()
              .from(blueprintTemplate)
              .where(
                and(
                  eq(blueprintTemplate.organizationId, organizationId),
                  eq(blueprintTemplate.createdByUserId, actorId),
                  sql`(${blueprintTemplate.source}->>'kind' is distinct from 'setup_copy')`,
                  isNull(blueprintTemplate.retiredAt)
                )
              )
              .orderBy(blueprintTemplate.updatedAt, blueprintTemplate.id)
            const counts = yield* activeLinkCounts(rows.map((row) => row.id))
            return { templates: rows.map((row) => shape(row, counts.get(row.id) ?? 0)) }
          })
        ),
      save: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* owned(actorId, input.id)
              if (current.draftVersion !== input.expectedVersion)
                return yield* Effect.fail(conflict())
              yield* validateCovers(actorId, coverAssetIds(input.content))
              if (blueprintHash(current.content) === blueprintHash(input.content))
                return shape(current, (yield* activeLinkCounts([current.id])).get(current.id) ?? 0)
              const nextVersion = current.draftVersion + 1
              let publishedRevision = current.publishedRevision
              let listedRevision = current.listedRevision
              let publishedDraftVersion = current.publishedDraftVersion
              if (current.publishedRevision !== null) {
                publishedRevision = (current.publishedRevision ?? 0) + 1
                publishedDraftVersion = nextVersion
                const candidate = BlueprintCatalogDefinitionSchema.parse(
                  draftDefinition(input.content, current.catalogKey, publishedRevision)
                )
                const contentHash = blueprintHash(candidate)
                yield* db.insert(blueprintRevision).values({
                  templateId: current.id,
                  draftVersion: nextVersion,
                  catalogKey: current.catalogKey,
                  revision: publishedRevision,
                  document: candidate,
                  contentHash,
                  description: input.content.description,
                })
                if (current.listedRevision !== null) listedRevision = publishedRevision
              }
              const [row] = yield* db
                .update(blueprintTemplate)
                .set({
                  content: input.content,
                  draftVersion: nextVersion,
                  publishedRevision,
                  listedRevision,
                  publishedDraftVersion,
                  updatedAt: new Date(),
                })
                .where(eq(blueprintTemplate.id, input.id))
                .returning()
              return shape(row!, (yield* activeLinkCounts([row!.id])).get(row!.id) ?? 0)
            })
          )
        ),
      publish: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* owned(actorId, input.id)
              if (current.draftVersion !== input.expectedVersion)
                return yield* Effect.fail(conflict())
              const content = BlueprintDraftContentSchema.parse(current.content)
              yield* validateCovers(actorId, coverAssetIds(content))
              const samePublication =
                current.publishedRevision !== null &&
                current.publishedDraftVersion === current.draftVersion &&
                current.listedRevision === current.publishedRevision
              if (
                samePublication &&
                (input.creatorName === undefined || input.creatorName === current.creatorName)
              )
                return shape(current, (yield* activeLinkCounts([current.id])).get(current.id) ?? 0)

              let revision = current.publishedRevision
              if (revision === null || current.publishedDraftVersion !== current.draftVersion) {
                revision = (revision ?? 0) + 1
                const definition = BlueprintCatalogDefinitionSchema.parse(
                  draftDefinition(content, current.catalogKey, revision)
                )
                yield* db.insert(blueprintRevision).values({
                  templateId: current.id,
                  draftVersion: current.draftVersion,
                  catalogKey: current.catalogKey,
                  revision,
                  document: definition,
                  contentHash: blueprintHash(definition),
                  description: content.description,
                })
              }

              const [row] = yield* db
                .update(blueprintTemplate)
                .set({
                  publishedRevision: revision,
                  publishedDraftVersion: current.draftVersion,
                  listedRevision: revision,
                  ...(input.creatorName !== undefined ? { creatorName: input.creatorName } : {}),
                  updatedAt: new Date(),
                })
                .where(eq(blueprintTemplate.id, current.id))
                .returning()
              return shape(row!, (yield* activeLinkCounts([row!.id])).get(row!.id) ?? 0)
            })
          )
        ),
      unlist: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* owned(actorId, input.id)
              if (current.draftVersion !== input.expectedVersion)
                return yield* Effect.fail(conflict())
              if (current.listedRevision === null)
                return shape(current, (yield* activeLinkCounts([current.id])).get(current.id) ?? 0)
              if (current.listedRevision !== input.expectedListedRevision)
                return yield* Effect.fail(conflict('BLUEPRINT_LISTED_REVISION_CONFLICT'))

              const [row] = yield* db
                .update(blueprintTemplate)
                .set({ listedRevision: null, updatedAt: new Date() })
                .where(eq(blueprintTemplate.id, current.id))
                .returning()
              return shape(row!, (yield* activeLinkCounts([row!.id])).get(row!.id) ?? 0)
            })
          )
        ),
      delete: (actorId, id) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* owned(actorId, id)
              const now = new Date()
              yield* db
                .update(blueprintTemplate)
                .set({ retiredAt: now, listedRevision: null, updatedAt: now })
                .where(eq(blueprintTemplate.id, id))
              yield* db
                .update(blueprintShareLink)
                .set({ revokedAt: now })
                .where(
                  and(
                    isNull(blueprintShareLink.revokedAt),
                    sql`${blueprintShareLink.revisionId} in (select id from blueprint_revision where template_id = ${current.id})`
                  )
                )
              return { deleted: true as const }
            })
          )
        ),
    }
  })
).pipe(Layer.provide(BlueprintCoverStorageLive))

function coverAssetIds(content: ReturnType<typeof BlueprintDraftContentSchema.parse>) {
  return [
    content.coverAssetId,
    ...content.children.map((child) => child.coverAssetId),
    ...content.ideas.map((idea) => idea.coverAssetId),
  ].filter((id): id is string => typeof id === 'string')
}
