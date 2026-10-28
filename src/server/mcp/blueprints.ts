import { z } from 'zod'
import {
  BlueprintCatalogPageRequestSchema,
  type BlueprintCatalogPageResponseSchema,
} from '@/contracts/blueprint-discovery.contracts'

export const MCP_BLUEPRINT_SEARCH = {
  name: 'search_blueprints',
  description:
    'Search published Blueprints by relevant event and idea content. Does not install or modify a Blueprint.',
  inputSchema: z
    .object({
      query: z.string().trim().min(1).max(128),
      limit: z.number().int().min(1).max(40).default(20),
      cursor: z.string().min(1).max(2048).optional(),
    })
    .strict(),
  readOnly: true,
} as const

export function createMcpBlueprintSearch(
  catalog: (
    userId: string,
    input: z.output<typeof BlueprintCatalogPageRequestSchema>
  ) => Promise<z.output<typeof BlueprintCatalogPageResponseSchema>>
) {
  return async (raw: unknown, actor: { userId: string }) => {
    const input = MCP_BLUEPRINT_SEARCH.inputSchema.parse(raw)
    const page = await catalog(
      actor.userId,
      BlueprintCatalogPageRequestSchema.parse({
        q: input.query,
        limit: input.limit,
        cursor: input.cursor,
      })
    )
    return {
      items: page.entries.map((entry) => ({
        catalogKey: entry.catalogKey,
        revision: entry.revision,
        name: entry.definition.blueprint.name,
        summary: entry.discovery.summary,
      })),
      nextCursor: page.nextCursor ?? null,
    }
  }
}
