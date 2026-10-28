import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { blueprintCatalogPage } from '@/server/blueprints/workflows/blueprint.workflows.live'
import { createMcpBlueprintSearch } from './blueprints'

export const searchMcpBlueprints = createMcpBlueprintSearch((userId, input) =>
  Effect.runPromise(blueprintCatalogPage(userId, input).pipe(Effect.provide(PgClientLive)))
)
