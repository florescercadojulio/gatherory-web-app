import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { seedBlueprintCatalog } from '@/server/blueprints/repos/seed-blueprint-catalog'

/** Repopulates immutable public starter revisions after the development reset. */
export function seedCuratedBlueprints() {
  return Effect.runPromise(seedBlueprintCatalog.pipe(Effect.provide(PgClientLive)))
}
