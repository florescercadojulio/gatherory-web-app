import { and, eq, isNull, sql } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member, organization, user } from '@/db/schema/auth.schema'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { idea, workspacePlanningSettings } from '@/db/schema/planning.schema'
import {
  blueprintInstallation,
  blueprintRevision,
  blueprintTemplate,
  eventExperienceConfiguration,
  eventGuideSection,
} from '@/db/schema/blueprint.schema'
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

export const BlueprintRepoLive = Layer.effect(
  BlueprintRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    const checkpoint = yield* BlueprintInstallCheckpoint
    const bind = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_PERSISTENCE_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )
    const catalogRow = (row: typeof blueprintRevision.$inferSelect): CatalogRevision => ({
      id: row.id,
      catalogKey: row.catalogKey,
      revision: row.revision,
      contentHash: row.contentHash,
      definition: BlueprintCatalogDefinitionSchema.parse(row.document),
      description: row.description,
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
              eq(member.role, 'owner')
            )
          )
          .limit(1)
        if (!access) return yield* Effect.fail(forbidden())
      })
    const visible = (actorId: string) => sql`(${blueprintRevision.templateId} is null or exists (
      select 1 from blueprint_template t join member m on m.organization_id = t.organization_id
      where t.id = ${blueprintRevision.templateId} and t.retired_at is null
        and m.user_id = ${actorId} and m.role = 'owner'
    ))`
    const sourceAuthority = (actorId: string, source: typeof blueprintRevision.$inferSelect) =>
      Effect.gen(function* () {
        if (!source.templateId) return
        const [template] = yield* db
          .select()
          .from(blueprintTemplate)
          .where(eq(blueprintTemplate.id, source.templateId))
          .for('share')
        if (!template || template.retiredAt) return yield* Effect.fail(missing())
        const [access] = yield* db
          .select({ id: member.id })
          .from(member)
          .where(
            and(
              eq(member.organizationId, template.organizationId),
              eq(member.userId, actorId),
              eq(member.role, 'owner')
            )
          )
          .for('share')
        if (!access) return yield* Effect.fail(missing())
      })
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
                  visible(actorId)
                )
              )
          : []
        if (!source) return yield* Effect.fail(missing())
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
      catalog: (actorId) =>
        bind(
          db
            .select()
            .from(blueprintRevision)
            .where(and(isNull(blueprintRevision.retiredAt), visible(actorId)))
            .pipe(Effect.map((rows) => rows.map(catalogRow)))
        ),
      revision: (catalogKey, revision, actorId) =>
        bind(
          Effect.gen(function* () {
            const [row] = yield* db
              .select()
              .from(blueprintRevision)
              .where(
                and(
                  eq(blueprintRevision.catalogKey, catalogKey),
                  eq(blueprintRevision.revision, revision),
                  visible(actorId),
                  isNull(blueprintRevision.retiredAt)
                )
              )
              .limit(1)
            if (!row) return yield* Effect.fail(missing())
            return catalogRow(row)
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
          pg.withTransaction(
            Effect.gen(function* () {
              const id = crypto.randomUUID()
              yield* db
                .insert(blueprintInstallation)
                .values({
                  id,
                  actorUserId: input.actor.id,
                  requestId: input.request.requestId,
                  requestHash: input.hash,
                  revisionId: input.revision.id,
                  plan: input.plan,
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
          pg.withTransaction(
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
                    eq(member.role, 'owner')
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
              yield* sourceAuthority(actor.id, source)
              const [existingRoot] = yield* db
                .select({ id: event.id })
                .from(event)
                .where(and(eq(event.organizationId, organizationId), isNull(event.parentEventId)))
                .limit(1)
              if (existingRoot)
                return yield* Effect.fail(conflict('BLUEPRINT_DESTINATION_NOT_EMPTY'))
              const plan = BlueprintExpandedPlanSchema.parse(receipt.plan)
              const eventPlans = [plan.main, ...plan.children]
              const ids = (items: { sourceKey: string }[]) =>
                Object.fromEntries(items.map((item) => [item.sourceKey, crypto.randomUUID()]))
              const manifest: BlueprintManifest = {
                events: ids(eventPlans),
                ideas: ids(plan.ideas),
                guides: ids(plan.instructions),
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
)
