import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { ForbiddenError, serverOperationError } from '@/lib/domain-errors'
import type { BlueprintManagedTemplate } from '@/contracts/blueprint-link-management.contracts'
import { BlueprintSharingRepo } from './blueprint-sharing.repo'
import { BlueprintSharingRepoLive } from './blueprint-sharing.repo.live'
import { BlueprintLinkManagementRepo } from './blueprint-link-management.repo'

const forbidden = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'BLUEPRINT_SHARING_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })

/** Source management and destination ownership are independent requirements.
 * The existing sharing repository remains the sole creator/revoker of links.
 */
export const BlueprintLinkManagementRepoLive = Layer.effect(
  BlueprintLinkManagementRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const sharing = yield* BlueprintSharingRepo
    return {
      execute: (actorId, input) =>
        pg
          .withTransaction(
            Effect.gen(function* () {
              // Hold source grants through the operation; child-only grants cannot
              // resolve a parent's or sibling's captured templates.
              const access = yield* pg`
          SELECT e.id FROM event e
          JOIN event_participant ep ON ep.event_id = e.id
          JOIN workspace_person p ON p.id = ep.person_id AND p.organization_id = e.organization_id
          WHERE e.id = ${input.eventId} AND p.user_id = ${actorId}
            AND (ep.role = 'host' OR (ep.role = 'collaborator' AND ep.planning_permission = 'manage'))
            AND NOT EXISTS (SELECT 1 FROM event_departure d WHERE d.event_id = e.id AND d.user_id = ${actorId})
          FOR SHARE OF e, ep, p`
              if (!access.length) return yield* Effect.fail(forbidden())

              if (input.action === 'templates') {
                const templates = yield* pg<BlueprintManagedTemplate>`
            SELECT t.id, COALESCE(r.document #>> '{blueprint,name}', t.content->>'name') AS title,
              r.revision AS "publishedRevision",
              CASE WHEN t.retired_at IS NULL AND EXISTS (
                SELECT 1 FROM blueprint_revision lr
                WHERE lr.template_id = t.id AND lr.revision = t.listed_revision AND lr.retired_at IS NULL
              ) THEN t.listed_revision ELSE NULL END AS "listedRevision",
              t.creator_name AS "creatorName",
              CASE WHEN t.retired_at IS NOT NULL THEN 0 ELSE (
                SELECT count(*)::int FROM blueprint_share_link l
                JOIN blueprint_revision lr ON lr.id = l.revision_id
                WHERE lr.template_id = t.id AND l.revoked_at IS NULL AND lr.retired_at IS NULL
              ) END AS "activeShareLinkCount",
              (t.retired_at IS NOT NULL) AS retired
            FROM blueprint_template t JOIN member m ON m.organization_id = t.organization_id
            LEFT JOIN blueprint_revision r ON r.template_id = t.id AND r.revision = t.published_revision AND r.retired_at IS NULL
            WHERE m.user_id = ${actorId} AND m.role = 'owner'
              AND t.source->>'kind' = 'event' AND lower(t.source->>'eventId') = ${input.eventId.toLowerCase()}
            ORDER BY t.updated_at DESC, t.id`
                return { templates: [...templates] }
              }

              if (input.action === 'listing') {
                const owned = yield* pg`
          SELECT t.id, t.retired_at AS "retiredAt", t.listed_revision AS "listedRevision"
          FROM blueprint_template t JOIN member m ON m.organization_id = t.organization_id
          WHERE t.id = ${input.templateId} AND m.user_id = ${actorId} AND m.role = 'owner'
            AND t.source->>'kind' = 'event' AND lower(t.source->>'eventId') = ${input.eventId.toLowerCase()}
          FOR UPDATE OF t FOR SHARE OF m`
                if (!owned.length) return yield* Effect.fail(forbidden())
                if (input.revision !== null) {
                  if (owned[0]!.retiredAt) return yield* Effect.fail(forbidden())
                  const published = yield* pg`
              SELECT id FROM blueprint_revision
              WHERE template_id = ${input.templateId} AND revision = ${input.revision}
                AND draft_version IS NOT NULL AND retired_at IS NULL
              LIMIT 1`
                  if (!published.length)
                    return yield* Effect.fail(
                      new ForbiddenError({
                        category: 'authorization',
                        code: 'BLUEPRINT_LISTING_REVISION_UNAVAILABLE',
                        userMessageKey: 'serverErrors.AUTHORIZATION',
                      })
                    )
                }
                const [updated] = yield* pg<{
                  listedRevision: number | null
                  creatorName: string | null
                }>`
            UPDATE blueprint_template SET listed_revision = ${input.revision},
              creator_name = COALESCE(${input.creatorName ?? null}, creator_name)
            WHERE id = ${input.templateId}
            RETURNING listed_revision AS "listedRevision", creator_name AS "creatorName"`
                return {
                  listedRevision: updated!.listedRevision,
                  creatorName: updated!.creatorName,
                }
              }

              const owned = yield* pg`
          SELECT t.id FROM blueprint_template t JOIN member m ON m.organization_id = t.organization_id
          WHERE t.id = ${input.templateId} AND m.user_id = ${actorId} AND m.role = 'owner'
            AND t.source->>'kind' = 'event' AND lower(t.source->>'eventId') = ${input.eventId.toLowerCase()}
          FOR SHARE OF t, m`
              if (!owned.length) return yield* Effect.fail(forbidden())
              switch (input.action) {
                case 'list':
                  return { links: yield* sharing.list(actorId, input.templateId) }
                case 'create': {
                  const { token, ...link } = yield* sharing.create(actorId, input)
                  return { link, token }
                }
                case 'revoke':
                  yield* sharing.revoke(actorId, input)
                  return { revoked: true as const }
              }
            })
          )
          .pipe(
            Effect.provideService(PgClient, pg),
            Effect.mapError((cause) =>
              serverOperationError(cause, {
                category: 'system',
                code: 'BLUEPRINT_SHARING_FAILED',
                userMessageKey: 'serverErrors.SYSTEM',
              })
            )
          ),
    }
  })
).pipe(Layer.provide(BlueprintSharingRepoLive))
