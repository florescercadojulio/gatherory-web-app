import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { seedBlueprintCatalogEntries } from '@/server/blueprints/repos/seed-blueprint-catalog'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { developmentBlueprints } from './development-blueprints'

/** Repopulates immutable public starter revisions after the development reset. */
export function seedCuratedBlueprints() {
  return Effect.runPromise(
    seedBlueprintCatalogEntries([...blueprintStarters, ...developmentBlueprints]).pipe(
      Effect.provide(PgClientLive)
    )
  )
}
