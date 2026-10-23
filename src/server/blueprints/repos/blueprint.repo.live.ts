import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member, organization, user } from '@/db/schema/auth.schema'
import {
  hasOrganizationOwnerRole,
  ORGANIZATION_OWNER_ROLE,
} from '../../auth/organization-role-membership'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { eventTodo, idea, workspacePlanningSettings } from '@/db/schema/planning.schema'
import { eventMedia, ideaMedia } from '@/db/schema/media.schema'
import {
  blueprintInstallation,
  blueprintRevision,
  blueprintTemplate,
  blueprintShareLink,
  eventExperienceConfiguration,
  eventGuideSection,
} from '@/db/schema/blueprint.schema'
import {
  blueprintAttributionAcquisition,
  blueprintQualifiedAdoption,
} from '@/db/schema/blueprint-attribution.schema'
import {
  blueprintDiscoveryExposure,
  blueprintMeasurementSetting,
} from '@/db/schema/blueprint-discovery.schema'
import {
  nativeWorkspaceSnapshot,
  nativeSyncScopeMember,
  nativeSyncEntity,
  nativeSyncChange,
} from '@/db/schema/sync.schema'
import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExpandedPlanSchema,
} from '@/contracts/blueprint-install.contracts'
import {
  ConflictError,
  ForbiddenError,
  EntityNotFoundError,
  serverOperationError,
} from '@/lib/domain-errors'
import {
  BlueprintRepo,
  BlueprintInstallCheckpoint,
  type InstallationRecord,
  type CatalogRevision,
  type BlueprintInstallResult,
  type BlueprintManifest,
} from '../contracts/blueprint-runtime.contracts'
import { buildBlueprintNativeProjection } from '../services/blueprint-native-projection'
import { isBlueprintDiscoveryAccountEligible } from '../services/blueprint-measurement-eligibility'
import { isBlueprintAttributionWindowActive } from '../services/blueprint-attribution'
import { hashBlueprintShareToken } from '../planning/blueprint-share-token.server'
import {
  cloneBlueprintCoverAssets,
  materializeCuratedSeedImages,
} from '@/server/blueprint-media/blueprint-cover.service'
import {
  BlueprintCoverStorage,
  BlueprintCoverStorageLive,
} from '@/server/blueprint-media/blueprint-cover.storage.live'
import seedImageAssignmentsRaw from '../catalog/seed-image-assignments.json'
import seedImageAssetsRaw from '../catalog/seed-image-assets.json'
import {
  SeedImageAssetsSchema,
  SeedImageAssignmentsSchema,
  resolveSeedImageTargets,
  seedImageTargetAssetKeys,
} from '../catalog/seed-image-registry'

const seedImageAssignments = SeedImageAssignmentsSchema.parse(seedImageAssignmentsRaw)
const seedImageAssets = SeedImageAssetsSchema.parse(seedImageAssetsRaw)

const conflict = (code: string) =>
  new ConflictError({ category: 'conflict', code, userMessageKey: 'serverErrors.CONFLICT' })
const forbidden = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'BLUEPRINT_INSTALLATION_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
const missing = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'BLUEPRINT_NOT_FOUND',
    userMessageKey: 'serverErrors.NOT_FOUND',
  })
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

function stableInstallCoverId(installationId: string, sourceAssetId: string) {
  const hex = createHash('sha256')
    .update(
      `blueprint-install-cover:${installationId.toLowerCase()}:${sourceAssetId.toLowerCase()}`
    )
    .digest('hex')
    .slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16]!, 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`
}

export const BlueprintRepoLive = Layer.effect(
  BlueprintRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    const checkpoint = yield* BlueprintInstallCheckpoint
    const coverStorage = yield* BlueprintCoverStorage
    const bind = <A, E>(effect: Effect.Effect<A, E, PgClient | BlueprintCoverStorage>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.provideService(BlueprintCoverStorage, coverStorage),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_PERSISTENCE_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )
    const catalogRow = (
      row: typeof blueprintRevision.$inferSelect,
      creatorName: string | null,
      rankingMetadata?: NonNullable<CatalogRevision['rankingMetadata']>
    ): CatalogRevision => ({
      id: row.id,
      catalogKey: row.catalogKey,
      revision: row.revision,
      contentHash: row.contentHash,
      definition: BlueprintCatalogDefinitionSchema.parse(row.document),
      description: row.description,
      ...(row.templateId === null
        ? { creator: { displayName: 'Gatherory' } }
        : creatorName
          ? { creator: { displayName: creatorName } }
          : {}),
      ...(rankingMetadata ? { rankingMetadata } : {}),
    })
    const record = (row: typeof blueprintInstallation.$inferSelect): InstallationRecord => ({
      id: row.id,
      requestHash: row.requestHash,
      state: row.state,
      plan: BlueprintExpandedPlanSchema.parse(row.plan),
      provisioningSlug: row.provisioningSlug,
      organizationId: row.organizationId,
      result: row.result as BlueprintInstallResult | null,
    })
    const authorizeResult = (actorId: string, result: BlueprintInstallResult | null) =>
      Effect.gen(function* () {
        if (!result) return
        const [access] = yield* db
          .select({ id: eventParticipant.id })
          .from(eventParticipant)
          .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
          .where(
            and(
              eq(eventParticipant.eventId, result.scopeID),
              eq(workspacePerson.userId, actorId),
              eq(eventParticipant.role, 'host')
            )
          )
          .limit(1)
        if (!access) return yield* Effect.fail(forbidden())
      })
    const owner = (actorId: string, organizationId: string) =>
      Effect.gen(function* () {
        const [access] = yield* db
          .select({ id: member.id })
          .from(member)
          .where(
            and(
              eq(member.organizationId, organizationId),
              eq(member.userId, actorId),
              hasOrganizationOwnerRole(member.role)
            )
          )
          .limit(1)
        if (!access) return yield* Effect.fail(forbidden())
      })
    const visible = (actorId: string) => sql`(${blueprintRevision.templateId} is null or exists (
      select 1 from blueprint_template t
      where t.id = ${blueprintRevision.templateId} and t.retired_at is null
        and (t.listed_revision = ${blueprintRevision.revision} or exists (
          select 1 from member m where m.organization_id = t.organization_id
            and m.user_id = ${actorId} and ${ORGANIZATION_OWNER_ROLE} = ANY(string_to_array(m.role, ','))
        ))
    ))`
    // Search is the public catalog even for an owner. Private author access
    // belongs to exact revision lookup and the personal library, not discovery.
    const listedInCatalog = sql`(${blueprintRevision.templateId} is null or exists (
      select 1 from blueprint_template t
      where t.id = ${blueprintRevision.templateId} and t.retired_at is null
        and t.listed_revision = ${blueprintRevision.revision}
    ))`
    // Keep this as one grouped lookup for the whole catalog. Revision creation
    // time is an immutable conservative proxy for first publication; older
    // private revisions that become listed later do not receive a fresh slot.
    const firstRevisionByTemplate = db
      .select({
        templateId: blueprintRevision.templateId,
        firstPublishedAt: sql<Date>`min(${blueprintRevision.createdAt})`.as('first_published_at'),
      })
      .from(blueprintRevision)
      .where(isNotNull(blueprintRevision.templateId))
      .groupBy(blueprintRevision.templateId)
      .as('first_revision_by_template')
    // A completed install pins an immutable source document. This authority is
    // deliberately used only by exact revision lookup, never catalog discovery.
    const installedCopy = (actorId: string) => sql`exists (
      select 1 from ${blueprintInstallation} i
      where i.actor_user_id = ${actorId}
        and i.state = 'completed'
        and i.revision_id = ${blueprintRevision.id}
        and i.source_snapshot = ${blueprintRevision.document}
        and i.source_snapshot->'blueprint'->>'id' = ${blueprintRevision.catalogKey}
        and (i.source_snapshot->'blueprint'->>'revision')::integer = ${blueprintRevision.revision}
    )`
    const sourceVisible = (actorId: string, shareTokenHash?: string | null) =>
      shareTokenHash
        ? sql`exists (
          select 1 from blueprint_share_link l join blueprint_template t on t.id = ${blueprintRevision.templateId}
          where l.revision_id = ${blueprintRevision.id} and l.token_hash = ${shareTokenHash}
            and l.revoked_at is null and t.retired_at is null
        )`
        : sql`(${visible(actorId)} or ${installedCopy(actorId)})`
    const sourceAuthority = (
      actorId: string,
      source: typeof blueprintRevision.$inferSelect,
      shareTokenHash?: string | null
    ) =>
      Effect.gen(function* () {
        if (!source.templateId) {
          if (shareTokenHash) return yield* Effect.fail(missing())
          return
        }
        const [template] = yield* db
          .select()
          .from(blueprintTemplate)
          .where(eq(blueprintTemplate.id, source.templateId))
          .for('share')
        if (!template) return yield* Effect.fail(missing())
        if (shareTokenHash) {
          if (template.retiredAt) return yield* Effect.fail(missing())
          // Held until commit: revocation and completion serialize on this row.
          const [link] = yield* db
            .select({ id: blueprintShareLink.id })
            .from(blueprintShareLink)
            .where(
              and(
                eq(blueprintShareLink.revisionId, source.id),
                eq(blueprintShareLink.tokenHash, shareTokenHash),
                isNull(blueprintShareLink.revokedAt)
              )
            )
            .for('share')
          if (!link) return yield* Effect.fail(missing())
          return
        }
        const [installedCopy] = yield* db
          .select({ id: blueprintInstallation.id })
          .from(blueprintInstallation)
          .where(
            and(
              eq(blueprintInstallation.actorUserId, actorId),
              eq(blueprintInstallation.state, 'completed'),
              eq(blueprintInstallation.revisionId, source.id),
              sql`${blueprintInstallation.sourceSnapshot} = ${JSON.stringify(source.document)}::jsonb`,
              sql`${blueprintInstallation.sourceSnapshot}->'blueprint'->>'id' = ${source.catalogKey}`,
              sql`(${blueprintInstallation.sourceSnapshot}->'blueprint'->>'revision')::integer = ${source.revision}`
            )
          )
          .limit(1)
        if (installedCopy) return
        if (template.retiredAt) return yield* Effect.fail(missing())
        if (template.listedRevision === source.revision) return
        const [access] = yield* db
          .select({ id: member.id })
          .from(member)
          .where(
            and(
              eq(member.organizationId, template.organizationId),
              eq(member.userId, actorId),
              hasOrganizationOwnerRole(member.role)
            )
          )
          .for('share')
        if (!access) return yield* Effect.fail(missing())
      })
    const tryRecordQualifiedAdoption = (
      actorId: string,
      installationId: string,
      installedRevision: typeof blueprintRevision.$inferSelect
    ) =>
      pg
        .withTransaction(
          Effect.gen(function* () {
            yield* db.execute(
              sql`select pg_advisory_xact_lock(hashtext(${`blueprint-measurement:${actorId}`}))`
            )
            if (!installedRevision.templateId || !isBlueprintDiscoveryAccountEligible(actorId))
              return
            const now = new Date()
            const [acquisition] = yield* db
              .select()
              .from(blueprintAttributionAcquisition)
              .where(
                and(
                  eq(blueprintAttributionAcquisition.actorUserId, actorId),
                  eq(blueprintAttributionAcquisition.copyTemplateId, installedRevision.templateId),
                  eq(blueprintAttributionAcquisition.copyRevisionId, installedRevision.id),
                  eq(blueprintAttributionAcquisition.copyContentHash, installedRevision.contentHash)
                )
              )
              .limit(1)
            if (!acquisition || !isBlueprintAttributionWindowActive(acquisition.expiresAt, now))
              return
            const [setting] = yield* db
              .select({ enabled: blueprintMeasurementSetting.enabled })
              .from(blueprintMeasurementSetting)
              .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
              .limit(1)
            if (!setting?.enabled) return
            const [exposure] = yield* db
              .select({ exposureId: blueprintDiscoveryExposure.exposureId })
              .from(blueprintDiscoveryExposure)
              .where(
                and(
                  eq(blueprintDiscoveryExposure.exposureId, acquisition.exposureId),
                  eq(blueprintDiscoveryExposure.actorUserId, actorId),
                  eq(blueprintDiscoveryExposure.catalogKey, acquisition.sourceCatalogKey),
                  eq(blueprintDiscoveryExposure.sourceRevision, acquisition.sourceRevision),
                  eq(blueprintDiscoveryExposure.contentHash, acquisition.sourceContentHash)
                )
              )
              .limit(1)
            if (!exposure) return
            const [privateCopy] = yield* db
              .select()
              .from(blueprintTemplate)
              .where(eq(blueprintTemplate.id, installedRevision.templateId))
              .limit(1)
            if (
              !privateCopy ||
              privateCopy.retiredAt ||
              privateCopy.listedRevision !== null ||
              privateCopy.publishedRevision !== installedRevision.revision ||
              privateCopy.publishedDraftVersion !== privateCopy.draftVersion
            )
              return
            const [publicSource] = yield* db
              .select({
                id: blueprintRevision.id,
                contentHash: blueprintRevision.contentHash,
                retiredAt: blueprintRevision.retiredAt,
                templateId: blueprintRevision.templateId,
                listedRevision: blueprintTemplate.listedRevision,
                templateRetiredAt: blueprintTemplate.retiredAt,
                creatorUserId: blueprintTemplate.createdByUserId,
              })
              .from(blueprintRevision)
              .leftJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
              .where(
                and(
                  eq(blueprintRevision.catalogKey, acquisition.sourceCatalogKey),
                  eq(blueprintRevision.revision, acquisition.sourceRevision)
                )
              )
              .limit(1)
            if (
              !publicSource ||
              publicSource.retiredAt ||
              publicSource.contentHash !== acquisition.sourceContentHash ||
              (publicSource.templateId !== null &&
                (publicSource.templateRetiredAt !== null ||
                  publicSource.listedRevision !== acquisition.sourceRevision ||
                  publicSource.creatorUserId === actorId))
            )
              return
            yield* db
              .insert(blueprintQualifiedAdoption)
              .values({
                actorUserId: actorId,
                acquisitionId: acquisition.id,
                installationId,
                sourceCatalogKey: acquisition.sourceCatalogKey,
                sourceRevision: acquisition.sourceRevision,
                sourceContentHash: acquisition.sourceContentHash,
              })
              .onConflictDoNothing({
                target: [
                  blueprintQualifiedAdoption.actorUserId,
                  blueprintQualifiedAdoption.sourceCatalogKey,
                ],
              })
          })
        )
        .pipe(Effect.catchCause(() => Effect.void))
    const acquire = (actorId: string, requestId: string, hash: string, token: string) =>
      Effect.gen(function* () {
        const [row] = yield* db
          .select()
          .from(blueprintInstallation)
          .where(
            and(
              eq(blueprintInstallation.actorUserId, actorId),
              eq(blueprintInstallation.requestId, requestId)
            )
          )
          .for('update')
        if (!row) return yield* Effect.fail(missing())
        if (row.requestHash !== hash)
          return yield* Effect.fail(conflict('BLUEPRINT_REQUEST_CONFLICT'))
        const result = row.result as BlueprintInstallResult | null
        yield* authorizeResult(actorId, result)
        if (result) return record(row)
        // Pending retries must recheck private source access before provisioning.
        const [source] = row.revisionId
          ? yield* db
              .select()
              .from(blueprintRevision)
              .where(
                and(
                  eq(blueprintRevision.id, row.revisionId),
                  isNull(blueprintRevision.retiredAt),
                  sourceVisible(actorId, row.shareTokenHash)
                )
              )
          : []
        if (!source) return yield* Effect.fail(missing())
        yield* sourceAuthority(actorId, source, row.shareTokenHash)
        if (
          row.leaseToken &&
          row.leaseToken !== token &&
          row.leaseUntil &&
          row.leaseUntil > new Date()
        )
          return yield* Effect.fail(conflict('BLUEPRINT_INSTALLATION_IN_PROGRESS'))
        yield* db
          .update(blueprintInstallation)
          .set({
            leaseToken: token,
            leaseUntil: new Date(Date.now() + 60_000),
            updatedAt: new Date(),
          })
          .where(eq(blueprintInstallation.id, row.id))
        return record(row)
      })
    return {
      catalog: (_actorId) =>
        bind(
          db
            .select({
              revision: blueprintRevision,
              creatorName: blueprintTemplate.creatorName,
              creatorKey: blueprintTemplate.createdByUserId,
              firstPublishedAt: firstRevisionByTemplate.firstPublishedAt,
            })
            .from(blueprintRevision)
            .leftJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
            .leftJoin(
              firstRevisionByTemplate,
              eq(firstRevisionByTemplate.templateId, blueprintRevision.templateId)
            )
            .where(and(isNull(blueprintRevision.retiredAt), listedInCatalog))
            .pipe(
              Effect.map((rows) =>
                rows.map(({ revision, creatorName, creatorKey, firstPublishedAt }) =>
                  catalogRow(revision, creatorName, {
                    creatorKey: revision.templateId === null ? null : creatorKey,
                    firstPublishedAt:
                      revision.templateId === null
                        ? null
                        : (firstPublishedAt?.toISOString() ?? null),
                  })
                )
              )
            )
        ),
      revision: (catalogKey, revision, actorId, shareToken) =>
        bind(
          Effect.gen(function* () {
            const [row] = yield* db
              .select({ revision: blueprintRevision, creatorName: blueprintTemplate.creatorName })
              .from(blueprintRevision)
              .leftJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
              .where(
                and(
                  eq(blueprintRevision.catalogKey, catalogKey),
                  eq(blueprintRevision.revision, revision),
                  sourceVisible(actorId, shareToken ? hashBlueprintShareToken(shareToken) : null),
                  isNull(blueprintRevision.retiredAt)
                )
              )
              .limit(1)
            if (!row) return yield* Effect.fail(missing())
            return catalogRow(row.revision, row.creatorName)
          })
        ),
      status: (actorId, requestId) =>
        bind(
          Effect.gen(function* () {
            const [row] = yield* db
              .select()
              .from(blueprintInstallation)
              .where(
                and(
                  eq(blueprintInstallation.actorUserId, actorId),
                  eq(blueprintInstallation.requestId, requestId)
                )
              )
              .limit(1)
            if (!row) return null
            const item = record(row)
            yield* authorizeResult(actorId, item.result)
            return item
          })
        ),
      acquire: (actorId, requestId, hash, token) =>
        bind(pg.withTransaction(acquire(actorId, requestId, hash, token))),
      claim: (input) =>
        bind(
          Effect.gen(function* () {
            // Public immutable catalog rows carry artwork through the separate,
            // exact-revision seed registry. Materialize it before claiming the
            // receipt so every later retry uses only persisted private IDs.
            let plan = input.plan
            const [sourceIdentity] = yield* db
              .select({ templateId: blueprintRevision.templateId })
              .from(blueprintRevision)
              .where(eq(blueprintRevision.id, input.revision.id))
              .limit(1)
            if (sourceIdentity?.templateId === null) {
              const seedTargets = resolveSeedImageTargets({
                entry: input.revision,
                assignments: seedImageAssignments,
                assets: seedImageAssets,
              })
              if (seedTargets) {
                const childOverrides = new Map(
                  (input.request.customizations?.children ?? []).map((item) => [item.key, item])
                )
                const ideaOverrides = new Map(
                  (input.request.customizations?.ideas ?? []).map((item) => [item.key, item])
                )
                const needed = new Set<string>()
                if (
                  plan.main.coverAssetId === null &&
                  !Object.hasOwn(input.request.customizations ?? {}, 'coverAssetId') &&
                  seedTargets.root
                )
                  needed.add(seedTargets.root.assetKey)
                for (const child of plan.children) {
                  const target = seedTargets.children[child.sourceKey]
                  const customization = childOverrides.get(child.sourceKey)
                  if (
                    child.coverAssetId === null &&
                    !(customization && Object.hasOwn(customization, 'coverAssetId')) &&
                    target
                  )
                    needed.add(target.assetKey)
                }
                for (const item of plan.ideas) {
                  const target = seedTargets.ideas[item.sourceKey]
                  const customization = ideaOverrides.get(item.sourceKey)
                  if (
                    item.coverAssetId === null &&
                    !(customization && Object.hasOwn(customization, 'coverAssetId')) &&
                    target
                  )
                    needed.add(target.assetKey)
                }
                if (needed.size) {
                  const imageIds = yield* materializeCuratedSeedImages({
                    actorUserId: input.actor.id,
                    requestId: input.request.requestId,
                    catalogKey: input.revision.catalogKey,
                    revision: input.revision.revision,
                    contentHash: input.revision.contentHash,
                    images: seedImageTargetAssetKeys(seedTargets)
                      .filter((assetKey) => needed.has(assetKey))
                      .map((assetKey) => ({
                        assetKey,
                        manifest: seedImageAssets[assetKey]!.manifest,
                      })),
                  }).pipe(
                    Effect.provideService(PgClient, pg),
                    Effect.provideService(BlueprintCoverStorage, coverStorage)
                  )
                  plan = {
                    ...plan,
                    main: {
                      ...plan.main,
                      ...(plan.main.coverAssetId === null &&
                      !Object.hasOwn(input.request.customizations ?? {}, 'coverAssetId') &&
                      seedTargets.root &&
                      imageIds[seedTargets.root.assetKey]
                        ? { coverAssetId: imageIds[seedTargets.root.assetKey] }
                        : {}),
                    },
                    children: plan.children.map((child) => {
                      const target = seedTargets.children[child.sourceKey]
                      const customization = childOverrides.get(child.sourceKey)
                      const id = target ? imageIds[target.assetKey] : undefined
                      return child.coverAssetId === null &&
                        id &&
                        !(customization && Object.hasOwn(customization, 'coverAssetId'))
                        ? { ...child, coverAssetId: id }
                        : child
                    }),
                    ideas: plan.ideas.map((item) => {
                      const target = seedTargets.ideas[item.sourceKey]
                      const customization = ideaOverrides.get(item.sourceKey)
                      const id = target ? imageIds[target.assetKey] : undefined
                      return item.coverAssetId === null &&
                        id &&
                        !(customization && Object.hasOwn(customization, 'coverAssetId'))
                        ? { ...item, coverAssetId: id }
                        : item
                    }),
                  }
                }
              }
            }
            return yield* pg.withTransaction(
              Effect.gen(function* () {
                const id = crypto.randomUUID()
                yield* db
                  .insert(blueprintInstallation)
                  .values({
                    id,
                    actorUserId: input.actor.id,
                    requestId: input.request.requestId,
                    requestHash: input.hash,
                    shareTokenHash: input.request.shareToken
                      ? hashBlueprintShareToken(input.request.shareToken)
                      : null,
                    revisionId: input.revision.id,
                    plan,
                    sourceSnapshot: input.revision.definition,
                    provisioningSlug: `blueprint-${id}`,
                  })
                  .onConflictDoNothing({
                    target: [blueprintInstallation.actorUserId, blueprintInstallation.requestId],
                  })
                return yield* acquire(
                  input.actor.id,
                  input.request.requestId,
                  input.hash,
                  input.token
                )
              })
            )
          })
        ),
      recoverWorkspace: (actorId, installationId) =>
        bind(
          Effect.gen(function* () {
            const [receipt] = yield* db
              .select()
              .from(blueprintInstallation)
              .where(
                and(
                  eq(blueprintInstallation.id, installationId),
                  eq(blueprintInstallation.actorUserId, actorId)
                )
              )
            if (!receipt) return yield* Effect.fail(missing())
            const [workspace] = yield* db
              .select({ id: organization.id })
              .from(organization)
              .where(eq(organization.slug, receipt.provisioningSlug))
              .limit(1)
            if (!workspace) return null
            yield* owner(actorId, workspace.id)
            return workspace.id
          })
        ),
      provisioned: (actorId, installationId, token, organizationId) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const [receipt] = yield* db
                .select()
                .from(blueprintInstallation)
                .where(
                  and(
                    eq(blueprintInstallation.id, installationId),
                    eq(blueprintInstallation.actorUserId, actorId)
                  )
                )
                .for('update')
              if (!receipt || receipt.leaseToken !== token)
                return yield* Effect.fail(conflict('BLUEPRINT_INSTALLATION_IN_PROGRESS'))
              const [workspace] = yield* db
                .select({ id: organization.id })
                .from(organization)
                .where(
                  and(
                    eq(organization.id, organizationId),
                    eq(organization.slug, receipt.provisioningSlug)
                  )
                )
              if (!workspace) return yield* Effect.fail(forbidden())
              yield* owner(actorId, organizationId)
              yield* db
                .update(blueprintInstallation)
                .set({ organizationId, state: 'provisioned', updatedAt: new Date() })
                .where(eq(blueprintInstallation.id, installationId))
            })
          )
        ),
      complete: (actor, installationId, token) =>
        bind(
          Effect.gen(function* () {
            const result = yield* pg.withTransaction(
              Effect.gen(function* () {
                const [receipt] = yield* db
                  .select()
                  .from(blueprintInstallation)
                  .where(
                    and(
                      eq(blueprintInstallation.id, installationId),
                      eq(blueprintInstallation.actorUserId, actor.id)
                    )
                  )
                  .for('update')
                if (!receipt) return yield* Effect.fail(missing())
                if (receipt.result) {
                  const result = receipt.result as BlueprintInstallResult
                  yield* authorizeResult(actor.id, result)
                  return result
                }
                if (receipt.leaseToken !== token || !receipt.organizationId)
                  return yield* Effect.fail(conflict('BLUEPRINT_INSTALLATION_IN_PROGRESS'))
                const organizationId = receipt.organizationId
                // Lock authority and source through completion. No external auth call is
                // inside this transaction, and legacy Promise sync writers are not used.
                yield* db
                  .select()
                  .from(organization)
                  .where(eq(organization.id, organizationId))
                  .for('update')
                const [authority] = yield* db
                  .select()
                  .from(member)
                  .where(
                    and(
                      eq(member.organizationId, organizationId),
                      eq(member.userId, actor.id),
                      hasOrganizationOwnerRole(member.role)
                    )
                  )
                  .for('share')
                if (!authority) return yield* Effect.fail(forbidden())
                const [source] = receipt.revisionId
                  ? yield* db
                      .select()
                      .from(blueprintRevision)
                      .where(eq(blueprintRevision.id, receipt.revisionId))
                      .for('share')
                  : []
                if (!source || source.retiredAt) return yield* Effect.fail(missing())
                yield* sourceAuthority(actor.id, source, receipt.shareTokenHash)
                const [existingRoot] = yield* db
                  .select({ id: event.id })
                  .from(event)
                  .where(and(eq(event.organizationId, organizationId), isNull(event.parentEventId)))
                  .limit(1)
                if (existingRoot)
                  return yield* Effect.fail(conflict('BLUEPRINT_DESTINATION_NOT_EMPTY'))
                const plan = BlueprintExpandedPlanSchema.parse(receipt.plan)
                const sourceCoverIds = [
                  ...new Set(
                    [
                      plan.main.coverAssetId,
                      ...plan.children.map((item) => item.coverAssetId),
                      ...plan.ideas.map((item) => item.coverAssetId),
                    ].filter((id): id is string => typeof id === 'string')
                  ),
                ]
                const clonedCovers = sourceCoverIds.length
                  ? yield* cloneBlueprintCoverAssets({
                      actorUserId: actor.id,
                      sourceRevisionId: source.id,
                      shareTokenHash: receipt.shareTokenHash ?? undefined,
                      destinationOrganizationId: organizationId,
                      copies: sourceCoverIds.map((sourceAssetId) => ({
                        sourceAssetId,
                        destinationAssetId: stableInstallCoverId(receipt.id, sourceAssetId),
                      })),
                    })
                  : []
                const coverAssetIds = Object.fromEntries(
                  clonedCovers.map(({ sourceAssetId, destinationAssetId }) => [
                    sourceAssetId.toLowerCase(),
                    destinationAssetId,
                  ])
                )
                const eventPlans = [plan.main, ...plan.children]
                const ids = (items: { sourceKey: string }[]) =>
                  Object.fromEntries(items.map((item) => [item.sourceKey, crypto.randomUUID()]))
                const manifest: BlueprintManifest = {
                  events: ids(eventPlans),
                  ideas: ids(plan.ideas),
                  guides: ids(plan.instructions),
                  todos: ids(plan.todos),
                  personID: crypto.randomUUID(),
                  participations: ids(eventPlans),
                }
                const scopeID = manifest.events.main
                const now = new Date()
                const projection = buildBlueprintNativeProjection({
                  plan,
                  manifest,
                  actor,
                  createdAt: now,
                  coverAssetIds,
                })
                yield* db.insert(event).values(
                  eventPlans.map((item) => ({
                    id: manifest.events[item.sourceKey],
                    organizationId,
                    parentEventId: item.parentSourceKey ? scopeID : null,
                    title: item.name,
                    status: item.parentSourceKey ? null : ('draft' as const),
                    purpose: item.purpose,
                    category: item.category,
                    planningStatus: item.planningStatus,
                    startsAt: new Date(item.startsAt),
                    timeZone: item.timeZone,
                    createdByUserId: actor.id,
                  }))
                )
                const eventCoverPlacements = eventPlans
                  .filter((item) => item.coverAssetId)
                  .map((item) => ({
                    organizationId,
                    eventId: manifest.events[item.sourceKey],
                    mediaAssetId: coverAssetIds[item.coverAssetId!.toLowerCase()]!,
                    role: 'cover' as const,
                    sortOrder: 0,
                  }))
                if (eventCoverPlacements.length)
                  yield* db.insert(eventMedia).values(eventCoverPlacements)
                yield* db.insert(workspacePerson).values({
                  id: manifest.personID,
                  organizationId,
                  userId: actor.id,
                  displayName: actor.name,
                  email: actor.email,
                })
                yield* db.insert(eventParticipant).values(
                  eventPlans.map((item) => ({
                    id: manifest.participations[item.sourceKey],
                    eventId: manifest.events[item.sourceKey],
                    personId: manifest.personID,
                    role: 'host' as const,
                    planningPermission: 'manage' as const,
                    attendanceStatus: 'pending' as const,
                  }))
                )
                yield* db
                  .insert(workspacePlanningSettings)
                  .values({ organizationId, collaboratorLinkEnabled: false })
                  .onConflictDoNothing()
                if (plan.ideas.length)
                  yield* db.insert(idea).values(
                    plan.ideas.map((item) => {
                      const native = projection.archive.ideas.find(
                        (value) => value.id === manifest.ideas[item.sourceKey]
                      )!
                      return {
                        id: native.id,
                        organizationId,
                        eventId: manifest.events[item.targetSourceKey],
                        category: item.category,
                        title: item.title,
                        note: item.notes,
                        configuration: { version: 1 as const, native: native.configuration },
                        guestVisibility:
                          native.invitationVisibility === 'shownToGuests'
                            ? ('shown_to_guests' as const)
                            : ('planning_only' as const),
                        submittedByUserId: actor.id,
                      }
                    })
                  )
                const ideaCoverPlacements = plan.ideas
                  .filter((item) => item.coverAssetId)
                  .map((item) => ({
                    organizationId,
                    ideaId: manifest.ideas[item.sourceKey],
                    mediaAssetId: coverAssetIds[item.coverAssetId!.toLowerCase()]!,
                    role: 'cover' as const,
                    sortOrder: 0,
                  }))
                if (ideaCoverPlacements.length)
                  yield* db.insert(ideaMedia).values(ideaCoverPlacements)
                yield* db.insert(eventExperienceConfiguration).values({
                  eventId: scopeID,
                  organizationId,
                  experienceType: plan.experienceType,
                  categoryOrder: plan.categoryOrder,
                })
                if (plan.instructions.length)
                  yield* db.insert(eventGuideSection).values(
                    plan.instructions.map((item, sortOrder) => ({
                      id: manifest.guides[item.sourceKey],
                      organizationId,
                      eventId: manifest.events[item.targetSourceKey],
                      key: item.sourceKey,
                      title: item.title,
                      body: item.body,
                      visibility: item.audience,
                      sortOrder,
                    }))
                  )
                if (plan.todos.length)
                  yield* db.insert(eventTodo).values(
                    plan.todos.map((item) => ({
                      id: manifest.todos![item.sourceKey],
                      organizationId,
                      eventId: manifest.events[item.targetSourceKey],
                      title: item.title,
                      websiteUrl: item.websiteURL,
                      assigneePersonId: null,
                      dueDate: null,
                      isCompleted: false,
                      createdAt: now,
                      updatedAt: now,
                    }))
                  )
                const payload = encode(projection.archive)
                yield* db
                  .insert(nativeWorkspaceSnapshot)
                  .values({ scopeId: scopeID, organizationId, ownerUserId: actor.id, payload })
                yield* db
                  .insert(nativeSyncScopeMember)
                  .values({ scopeId: scopeID, userId: actor.id, role: 'owner' })
                const entities = projection.entities.map((item) => ({
                  scopeId: scopeID,
                  ownerUserId: actor.id,
                  entityType: item.entityType,
                  entityId: item.entityId,
                  payload: encode(item.payload),
                  serverVersion: 1,
                }))
                if (entities.length) yield* db.insert(nativeSyncEntity).values(entities)
                yield* db
                  .insert(nativeSyncChange)
                  .values(entities.map((item) => ({ ...item, operation: 'create' })))
                yield* checkpoint.afterProjection()
                const result: BlueprintInstallResult = {
                  installationID: receipt.id,
                  organizationID: organizationId,
                  scopeID,
                  manifest,
                }
                // Attribution is best-effort and runs in a savepoint: a measurement
                // failure must never undo an authorized installation.
                yield* tryRecordQualifiedAdoption(actor.id, receipt.id, source)
                yield* db
                  .update(blueprintInstallation)
                  .set({
                    mainEventId: scopeID,
                    state: 'completed',
                    result,
                    leaseToken: null,
                    leaseUntil: null,
                    updatedAt: now,
                  })
                  .where(eq(blueprintInstallation.id, receipt.id))
                yield* db
                  .update(user)
                  .set({ hasCompletedOnboarding: true })
                  .where(eq(user.id, actor.id))
                return result
              })
            )
            return result
          })
        ),
      release: (actorId, installationId, token) =>
        bind(
          db
            .update(blueprintInstallation)
            .set({ state: 'failed', leaseToken: null, leaseUntil: null, updatedAt: new Date() })
            .where(
              and(
                eq(blueprintInstallation.id, installationId),
                eq(blueprintInstallation.actorUserId, actorId),
                eq(blueprintInstallation.leaseToken, token)
              )
            )
            .pipe(Effect.asVoid)
        ),
    }
  })
).pipe(Layer.provide(BlueprintCoverStorageLive))
