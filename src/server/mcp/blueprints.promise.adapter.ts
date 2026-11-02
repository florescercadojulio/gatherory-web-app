import { Effect } from 'effect'
import type { z } from 'zod'
import type {
  BlueprintCatalogPageRequestSchema,
  BlueprintCatalogPageResponseSchema,
} from '@/contracts/blueprint-discovery.contracts'
import { createMcpBlueprintSearch } from './blueprints'

type CatalogInput = z.output<typeof BlueprintCatalogPageRequestSchema>
type CatalogPage = z.output<typeof BlueprintCatalogPageResponseSchema>

/** Adapt the Promise MCP protocol callback to the Effect-backed catalog workflow. */
export function createMcpBlueprintSearchPromiseAdapter<E>(
  catalog: (userId: string, input: CatalogInput) => Effect.Effect<CatalogPage, E>
) {
  return createMcpBlueprintSearch((userId, input) => Effect.runPromise(catalog(userId, input)))
}
