import { and, eq, isNull, sql } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member, organization } from '@/db/schema/auth.schema'
import {
  blueprintRevision,
  blueprintShareLink,
  blueprintTemplate,
} from '@/db/schema/blueprint.schema'
import {
  BlueprintDraftContentSchema,
  draftDefinition,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '../planning/blueprint-hash'
import { ConflictError, EntityNotFoundError, serverOperationError } from '@/lib/domain-errors'
import { BlueprintPersonalRepo, type PersonalBlueprint } from './blueprint-personal.repo'

const missing = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'BLUEPRINT_NOT_FOUND',
    userMessageKey: 'serverErrors.NOT_FOUND',
  })
const conflict = () =>
  new ConflictError({
    category: 'conflict',
    code: 'BLUEPRINT_DRAFT_VERSION_CONFLICT',
    userMessageKey: 'serverErrors.CONFLICT',
  })

export const BlueprintPersonalRepoLive = Layer.effect(
  BlueprintPersonalRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
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
    const personalOrganizationId = (actorId: string) =>
      Effect.gen(function* () {
        const slug = `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
        const [row] = yield* db
          .select({ id: organization.id })
          .from(organization)
          .innerJoin(member, eq(member.organizationId, organization.id))
          .where(
            and(eq(organization.slug, slug), eq(member.userId, actorId), eq(member.role, 'owner'))
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
      }
    }
    const shape = (row: typeof blueprintTemplate.$inferSelect): PersonalBlueprint => ({
      id: row.id,
      draftVersion: row.draftVersion,
      publishedRevision: row.publishedRevision,
      listedRevision: row.listedRevision,
      catalogEntry: entry(row, row.publishedRevision ?? 1),
    })
    return {
      copy: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const organizationId = yield* personalOrganizationId(actorId)
              if (!organizationId) return yield* Effect.fail(missing())
              const requestHash = blueprintHash(input.content)
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
                  savedContent.success && blueprintHash(savedContent.data) === requestHash
                const source = existing.source as { kind?: string } | null
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
                  existing.retiredAt !== null ||
                  existing.publishedRevision !== 1 ||
                  existing.publishedDraftVersion !== existing.draftVersion ||
                  existing.listedRevision !== null ||
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
                return shape(existing)
              }
              const id = crypto.randomUUID()
              const catalogKey = `private_${id.replaceAll('-', '')}`
              const definition = BlueprintCatalogDefinitionSchema.parse(
                draftDefinition(input.content, catalogKey, 1)
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
                  content: input.content,
                  draftVersion: 1,
                  publishedRevision: 1,
                  publishedDraftVersion: 1,
                  listedRevision: null,
                  source: { kind: 'setup_copy' },
                })
                .returning()
              yield* db.insert(blueprintRevision).values({
                templateId: id,
                draftVersion: 1,
                catalogKey,
                revision: 1,
                document: definition,
                contentHash,
                description: input.content.description,
              })
              return shape(row!)
            })
          )
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
            return { templates: rows.map(shape) }
          })
        ),
      save: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* owned(actorId, input.id)
              if (current.draftVersion !== input.expectedVersion)
                return yield* Effect.fail(conflict())
              if (blueprintHash(current.content) === blueprintHash(input.content))
                return shape(current)
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
              return shape(row!)
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
              if (
                current.publishedRevision !== null &&
                current.publishedDraftVersion === current.draftVersion &&
                current.listedRevision === current.publishedRevision
              )
                return shape(current)

              let revision = current.publishedRevision
              if (revision === null || current.publishedDraftVersion !== current.draftVersion) {
                revision = (revision ?? 0) + 1
                const content = BlueprintDraftContentSchema.parse(current.content)
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
                  updatedAt: new Date(),
                })
                .where(eq(blueprintTemplate.id, current.id))
                .returning()
              return shape(row!)
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
)
