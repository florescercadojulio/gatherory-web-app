import { and, eq, sql } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member, organization } from '@/db/schema/auth.schema'
import { blueprintRevision, blueprintTemplate } from '@/db/schema/blueprint.schema'
import {
  BlueprintDraftContentSchema,
  draftDefinition,
  type BlueprintDraft,
  type BlueprintAuthoringRow,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'
import {
  ConflictError,
  EntityNotFoundError,
  ForbiddenError,
  serverOperationError,
} from '@/lib/domain-errors'
import { blueprintDraftContentForHash, blueprintHash } from '../planning/blueprint-hash'
import { BlueprintAuthoringRepo } from './blueprint-authoring.repo'

const conflict = (code: string) =>
  new ConflictError({ category: 'conflict', code, userMessageKey: 'serverErrors.CONFLICT' })
const missing = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'BLUEPRINT_DRAFT_NOT_FOUND',
    userMessageKey: 'serverErrors.NOT_FOUND',
  })
const forbidden = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'BLUEPRINT_AUTHORING_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })

export const BlueprintAuthoringRepoLive = Layer.effect(
  BlueprintAuthoringRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    const bind = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_AUTHORING_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )
    const dto = (row: typeof blueprintTemplate.$inferSelect): BlueprintDraft => ({
      id: row.id,
      organizationId: row.organizationId,
      catalogKey: row.catalogKey,
      draftVersion: row.draftVersion,
      content: BlueprintDraftContentSchema.parse(row.content),
      publishedRevision: row.publishedRevision,
      publishedDraftVersion: row.publishedDraftVersion,
      retired: row.retiredAt !== null,
      source: row.source,
    })
    // Ownership is checked against the explicitly selected workspace, never session.activeOrganizationId.
    const authorize = (actorId: string, organizationId: string) =>
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
          .for('share')
        if (!access) return yield* Effect.fail(forbidden())
      })
    const read = (actorId: string, id: string) =>
      Effect.gen(function* () {
        const [row] = yield* db
          .select()
          .from(blueprintTemplate)
          .where(eq(blueprintTemplate.id, id))
          .for('update')
        if (!row) return yield* Effect.fail(missing())
        yield* authorize(actorId, row.organizationId)
        return row
      })
    return {
      context: (actorId) =>
        bind(
          Effect.gen(function* () {
            const rows = yield* db
              .select({ id: organization.id, name: organization.name, slug: organization.slug })
              .from(organization)
              .innerJoin(member, eq(member.organizationId, organization.id))
              .where(and(eq(member.userId, actorId), eq(member.role, 'owner')))
              .orderBy(organization.name, organization.id)
            const slug = `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
            return {
              workspaces: rows.map(({ slug: value, ...row }) => ({
                ...row,
                personal: value === slug,
              })),
            }
          })
        ),
      list: (actorId, input) =>
        bind(
          Effect.gen(function* () {
            // Apply visibility and filters before pagination; no private rows leak into counts/pages.
            const rows = yield* pg<BlueprintAuthoringRow>`
        WITH entries AS (
          SELECT t.id::text AS id, t.catalog_key AS "catalogKey", t.content->>'name' AS name,
            t.content->>'description' AS description, 'private'::text AS source,
            CASE WHEN t.retired_at IS NOT NULL THEN 'retired'
              WHEN t.published_draft_version = t.draft_version THEN 'published' ELSE 'draft' END AS status,
            t.published_revision AS revision, t.draft_version AS "draftVersion"
          FROM blueprint_template t
          WHERE EXISTS (SELECT 1 FROM member m WHERE m.organization_id = t.organization_id AND m.user_id = ${actorId} AND m.role = 'owner')
          UNION ALL
          SELECT r.catalog_key AS id, r.catalog_key AS "catalogKey", r.document->'blueprint'->>'name' AS name,
            r.description AS description, 'curated'::text AS source, 'published'::text AS status,
            r.revision, NULL::integer AS "draftVersion"
          FROM blueprint_revision r
          WHERE r.template_id IS NULL AND r.retired_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM blueprint_revision newer WHERE newer.catalog_key = r.catalog_key AND newer.revision > r.revision AND newer.retired_at IS NULL)
        ) SELECT * FROM entries WHERE (${input.source} = 'all' OR source = ${input.source})
          AND (${input.status} = 'all' OR status = ${input.status})
          AND strpos(lower(name || ' ' || description), lower(${input.query})) > 0
        ORDER BY lower(name), id LIMIT ${input.limit + 1} OFFSET ${input.offset}`
            return { data: [...rows.slice(0, input.limit)], hasNextPage: rows.length > input.limit }
          })
        ),
      get: (actorId, id) => bind(pg.withTransaction(read(actorId, id).pipe(Effect.map(dto)))),
      create: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              yield* authorize(actorId, input.organizationId)
              const requestHash = blueprintHash({
                ...input,
                requestId: input.requestId.toLowerCase(),
                content: blueprintDraftContentForHash(input.content),
              })
              // Serialize the actor/request pair, including concurrent first attempts.
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
                if (existing.createRequestHash !== requestHash)
                  return yield* Effect.fail(conflict('BLUEPRINT_CREATE_REQUEST_CONFLICT'))
                yield* authorize(actorId, existing.organizationId)
                return dto(existing)
              }
              const id = crypto.randomUUID()
              const [row] = yield* db
                .insert(blueprintTemplate)
                .values({
                  id,
                  catalogKey: `private_${id.replaceAll('-', '')}`,
                  organizationId: input.organizationId,
                  createdByUserId: actorId,
                  createRequestId: input.requestId,
                  createRequestHash: requestHash,
                  content: input.content,
                  source: input.source ?? null,
                })
                .returning()
              return dto(row!)
            })
          )
        ),
      save: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* read(actorId, input.id)
              if (current.retiredAt) return yield* Effect.fail(conflict('BLUEPRINT_RETIRED'))
              if (current.draftVersion !== input.expectedVersion)
                return yield* Effect.fail(conflict('BLUEPRINT_DRAFT_VERSION_CONFLICT'))
              const [row] = yield* db
                .update(blueprintTemplate)
                .set({
                  content: input.content,
                  draftVersion: current.draftVersion + 1,
                  updatedAt: new Date(),
                })
                .where(eq(blueprintTemplate.id, input.id))
                .returning()
              return dto(row!)
            })
          )
        ),
      publish: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* read(actorId, input.id)
              // An exact saved draft version is the durable publication idempotency key.
              const [published] = yield* db
                .select()
                .from(blueprintRevision)
                .where(
                  and(
                    eq(blueprintRevision.templateId, input.id),
                    eq(blueprintRevision.draftVersion, input.expectedVersion)
                  )
                )
              if (published)
                return {
                  ...dto(current),
                  publication: {
                    revision: published.revision,
                    draftVersion: input.expectedVersion,
                    contentHash: published.contentHash,
                  },
                }
              if (current.retiredAt) return yield* Effect.fail(conflict('BLUEPRINT_RETIRED'))
              if (current.draftVersion !== input.expectedVersion)
                return yield* Effect.fail(conflict('BLUEPRINT_DRAFT_VERSION_CONFLICT'))
              const content = BlueprintDraftContentSchema.parse(current.content)
              const revision = (current.publishedRevision ?? 0) + 1
              const definition = BlueprintCatalogDefinitionSchema.parse(
                draftDefinition(content, current.catalogKey, revision)
              )
              const contentHash = blueprintHash(definition)
              yield* db.insert(blueprintRevision).values({
                templateId: current.id,
                draftVersion: current.draftVersion,
                catalogKey: current.catalogKey,
                revision,
                document: definition,
                contentHash,
                description: content.description,
              })
              const [row] = yield* db
                .update(blueprintTemplate)
                .set({
                  publishedRevision: revision,
                  publishedDraftVersion: current.draftVersion,
                  updatedAt: new Date(),
                })
                .where(eq(blueprintTemplate.id, input.id))
                .returning()
              return {
                ...dto(row!),
                publication: { revision, draftVersion: current.draftVersion, contentHash },
              }
            })
          )
        ),
      retire: (actorId, id) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* read(actorId, id)
              if (current.retiredAt) return dto(current)
              const [row] = yield* db
                .update(blueprintTemplate)
                .set({ retiredAt: new Date(), updatedAt: new Date() })
                .where(eq(blueprintTemplate.id, id))
                .returning()
              return dto(row!)
            })
          )
        ),
      delete: (actorId, id) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const current = yield* read(actorId, id)
              if (current.publishedRevision !== null)
                return yield* Effect.fail(conflict('BLUEPRINT_ALREADY_PUBLISHED'))
              yield* db.delete(blueprintTemplate).where(eq(blueprintTemplate.id, id))
              return { deleted: true as const }
            })
          )
        ),
    }
  })
)
