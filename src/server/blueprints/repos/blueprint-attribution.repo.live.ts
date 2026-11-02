import { lte } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { blueprintAttributionAcquisition } from '@/db/schema/blueprint-attribution.schema'
import { serverOperationError } from '@/lib/domain-errors'
import { BlueprintAttributionRepo } from './blueprint-attribution.repo'

export const BlueprintAttributionRepoLive = Layer.effect(
  BlueprintAttributionRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    return {
      pruneExpired: (now) =>
        db
          .delete(blueprintAttributionAcquisition)
          .where(lte(blueprintAttributionAcquisition.expiresAt, now))
          .returning({ id: blueprintAttributionAcquisition.id })
          .pipe(
            Effect.map((removed) => ({ removed: removed.length })),
            Effect.provideService(PgClient, pg),
            Effect.mapError((cause) =>
              serverOperationError(cause, {
                category: 'system',
                code: 'BLUEPRINT_ATTRIBUTION_PRUNE_FAILED',
                userMessageKey: 'serverErrors.SYSTEM',
              })
            )
          ),
    }
  })
)
