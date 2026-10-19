import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { blueprintInstallation } from '@/db/schema/blueprint.schema'
import { serverOperationError } from '@/lib/domain-errors'
import { BlueprintLibraryResponseSchema } from '@/contracts/blueprint-library.contracts'
import { BlueprintLibraryRepo } from './blueprint-library.repo'

export const BlueprintLibraryRepoLive = Layer.effect(
  BlueprintLibraryRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    const bind = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_LIBRARY_PERSISTENCE_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )

    return {
      listUsed: (actorId) =>
        bind(
          Effect.gen(function* () {
            const rows = yield* db
              .select({
                id: blueprintInstallation.id,
                scopeID: blueprintInstallation.mainEventId,
                catalogKey: sql<
                  string | null
                >`${blueprintInstallation.sourceSnapshot}->'blueprint'->>'id'`,
                revision: sql<
                  string | null
                >`${blueprintInstallation.sourceSnapshot}->'blueprint'->>'revision'`,
                templateName: sql<
                  string | null
                >`${blueprintInstallation.sourceSnapshot}->'blueprint'->>'name'`,
                eventName: sql<string | null>`${blueprintInstallation.plan}->'main'->>'name'`,
                updatedAt: blueprintInstallation.updatedAt,
              })
              .from(blueprintInstallation)
              .where(
                and(
                  eq(blueprintInstallation.actorUserId, actorId),
                  eq(blueprintInstallation.state, 'completed'),
                  sql`${blueprintInstallation.result} is not null`,
                  isNotNull(blueprintInstallation.mainEventId),
                  sql`exists (
                    select 1
                    from ${eventParticipant}
                    inner join ${workspacePerson}
                      on ${workspacePerson.id} = ${eventParticipant.personId}
                    where ${eventParticipant.eventId} = ${blueprintInstallation.mainEventId}
                      and ${workspacePerson.userId} = ${actorId}
                      and ${eventParticipant.role} = 'host'
                  )`
                )
              )
              .orderBy(desc(blueprintInstallation.updatedAt), desc(blueprintInstallation.id))
              .limit(200)

            const installations = rows.map((row) => {
              return {
                installationID: row.id,
                scopeID: row.scopeID,
                catalogKey: row.catalogKey,
                revision: Number(row.revision),
                templateName: row.templateName,
                eventName: row.eventName,
                installedAt: row.updatedAt.toISOString(),
              }
            })

            return BlueprintLibraryResponseSchema.parse({ installations }).installations
          })
        ),
    }
  })
)
