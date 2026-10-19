import { and, eq, sql } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect } from 'effect'
import { DB } from '@/db'
import { blueprintRevision } from '@/db/schema/blueprint.schema'
import { blueprintStarters } from '../catalog/starters'
import { ConflictError } from '@/lib/domain-errors'
import type { BlueprintCatalogRevisionSchema } from '@/contracts/blueprint-install.contracts'
import type { z } from 'zod'

type SeedRevision = z.infer<typeof BlueprintCatalogRevisionSchema> & { description?: string }

/** Explicit deployment tooling only. Repeated/concurrent identical runs are no-ops. */
export const seedBlueprintCatalogEntries = (entries: readonly SeedRevision[]) =>
  Effect.gen(function* () {
    const pg = yield* PgClient
    const db = yield* DB
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        yield* db.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('gatherory-blueprint-catalog', 0))`
        )
        let inserted = 0
        for (const starter of entries) {
          const [existing] = yield* db
            .select()
            .from(blueprintRevision)
            .where(
              and(
                eq(blueprintRevision.catalogKey, starter.catalogKey),
                eq(blueprintRevision.revision, starter.revision)
              )
            )
          if (existing) {
            if (existing.contentHash !== starter.contentHash)
              return yield* Effect.fail(
                new ConflictError({
                  category: 'conflict',
                  code: 'BLUEPRINT_REVISION_IMMUTABLE',
                  userMessageKey: 'serverErrors.CONFLICT',
                  debugMessage: 'Publish changed catalog content with a new explicit revision.',
                })
              )
            continue
          }
          yield* db.insert(blueprintRevision).values({
            catalogKey: starter.catalogKey,
            revision: starter.revision,
            contentHash: starter.contentHash,
            document: starter.definition,
            description: starter.description ?? '',
          })
          inserted += 1
        }
        return { inserted }
      })
    )
  })

/** Production deployment catalog deliberately excludes development-only fixtures. */
export const seedBlueprintCatalog = seedBlueprintCatalogEntries(blueprintStarters)
