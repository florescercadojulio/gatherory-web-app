import { lte } from 'drizzle-orm'
import { Effect } from 'effect'
import { DB } from '@/db'
import { blueprintAttributionAcquisition } from '@/db/schema/blueprint-attribution.schema'

/** Remove expired private bindings; dependent qualified records expire with them. */
export const pruneExpiredBlueprintAttribution = (now = new Date()) =>
  Effect.gen(function* () {
    const db = yield* DB
    const removed = yield* db
      .delete(blueprintAttributionAcquisition)
      .where(lte(blueprintAttributionAcquisition.expiresAt, now))
      .returning({ id: blueprintAttributionAcquisition.id })
    return { removed: removed.length }
  })
