import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { blueprintCatalogPage } from '@/server/blueprints/workflows/blueprint.workflows.live'
import { createMcpBlueprintSearchPromiseAdapter } from './blueprints.promise.adapter'

export const searchMcpBlueprints = createMcpBlueprintSearchPromiseAdapter((userId, input) =>
  blueprintCatalogPage(userId, input).pipe(Effect.provide(PgClientLive))
)
