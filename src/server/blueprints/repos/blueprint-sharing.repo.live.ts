import { and, eq, isNull, desc } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member } from '@/db/schema/auth.schema'
import { hasOrganizationOwnerRole } from '../../auth/organization-role-membership'
import {
  blueprintRevision,
  blueprintShareLink,
  blueprintTemplate,
} from '@/db/schema/blueprint.schema'
import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'
import { EntityNotFoundError, ForbiddenError, serverOperationError } from '@/lib/domain-errors'
import {
  hashBlueprintShareToken,
  newBlueprintShareToken,
} from '../planning/blueprint-share-token.server'
import { BlueprintSharingRepo } from './blueprint-sharing.repo'

const missing = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'BLUEPRINT_LINK_UNAVAILABLE',
    userMessageKey: 'serverErrors.NOT_FOUND',
  })

export const BlueprintSharingRepoLive = Layer.effect(
  BlueprintSharingRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    const bind = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_SHARING_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )
    const owner = (actorId: string, templateId: string) =>
      Effect.gen(function* () {
        const [template] = yield* db
          .select()
          .from(blueprintTemplate)
          .where(eq(blueprintTemplate.id, templateId))
          .for('share')
        if (!template) return yield* Effect.fail(missing())
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
        if (!access)
          return yield* Effect.fail(
            new ForbiddenError({
              category: 'authorization',
              code: 'BLUEPRINT_SHARING_FORBIDDEN',
              userMessageKey: 'serverErrors.AUTHORIZATION',
            })
          )
        return template
      })
    return {
      list: (actorId, templateId) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              yield* owner(actorId, templateId)
              const rows = yield* db
                .select({ link: blueprintShareLink, revision: blueprintRevision.revision })
                .from(blueprintShareLink)
                .innerJoin(
                  blueprintRevision,
                  eq(blueprintRevision.id, blueprintShareLink.revisionId)
                )
                .where(eq(blueprintRevision.templateId, templateId))
                .orderBy(desc(blueprintShareLink.createdAt))
              return rows.map(({ link, revision }) => ({
                id: link.id,
                revision,
                createdAt: link.createdAt.toISOString(),
                revokedAt: link.revokedAt?.toISOString() ?? null,
              }))
            })
          )
        ),
      create: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              const template = yield* owner(actorId, input.templateId)
              if (template.retiredAt) return yield* Effect.fail(missing())
              const [revision] = yield* db
                .select()
                .from(blueprintRevision)
                .where(
                  and(
                    eq(blueprintRevision.templateId, input.templateId),
                    eq(blueprintRevision.revision, input.revision),
                    isNull(blueprintRevision.retiredAt)
                  )
                )
                .for('share')
              if (!revision) return yield* Effect.fail(missing())
              const token = newBlueprintShareToken()
              const [link] = yield* db
                .insert(blueprintShareLink)
                .values({
                  revisionId: revision.id,
                  tokenHash: hashBlueprintShareToken(token),
                  createdByUserId: actorId,
                })
                .returning()
              return {
                id: link.id,
                revision: revision.revision,
                createdAt: link.createdAt.toISOString(),
                revokedAt: null,
                token,
              }
            })
          )
        ),
      revoke: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              yield* owner(actorId, input.templateId)
              const [link] = yield* db
                .select({ id: blueprintShareLink.id })
                .from(blueprintShareLink)
                .innerJoin(
                  blueprintRevision,
                  eq(blueprintRevision.id, blueprintShareLink.revisionId)
                )
                .where(
                  and(
                    eq(blueprintShareLink.id, input.linkId),
                    eq(blueprintRevision.templateId, input.templateId)
                  )
                )
              if (!link) return yield* Effect.fail(missing())
              yield* db
                .update(blueprintShareLink)
                .set({ revokedAt: new Date() })
                .where(
                  and(eq(blueprintShareLink.id, link.id), isNull(blueprintShareLink.revokedAt))
                )
            })
          )
        ),
      resolve: (token) =>
        bind(
          Effect.gen(function* () {
            const [row] = yield* db
              .select({ revision: blueprintRevision, creatorName: blueprintTemplate.creatorName })
              .from(blueprintShareLink)
              .innerJoin(blueprintRevision, eq(blueprintRevision.id, blueprintShareLink.revisionId))
              .innerJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
              .where(
                and(
                  eq(blueprintShareLink.tokenHash, hashBlueprintShareToken(token)),
                  isNull(blueprintShareLink.revokedAt),
                  isNull(blueprintRevision.retiredAt),
                  isNull(blueprintTemplate.retiredAt)
                )
              )
              .limit(1)
            if (!row) return yield* Effect.fail(missing())
            const revision = row.revision
            return {
              id: revision.id,
              catalogKey: revision.catalogKey,
              revision: revision.revision,
              contentHash: revision.contentHash,
              definition: BlueprintCatalogDefinitionSchema.parse(revision.document),
              description: revision.description,
              ...(row.creatorName ? { creator: { displayName: row.creatorName } } : {}),
            }
          })
        ),
    }
  })
)
