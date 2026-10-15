import { z } from 'zod'
import { BlueprintCatalogRevisionSchema } from './blueprint-install.contracts'
import { characterString } from './content-primitives'

export const BLUEPRINT_DISCOVERY_LIMITS = { tagChars: 100, summaryChars: 500 } as const

export const BlueprintDiscoverySchema = z.object({
  categories: z.array(z.enum(['weddings', 'birthdays', 'holidays', 'events'])).min(1),
  tags: z.array(characterString(1, BLUEPRINT_DISCOVERY_LIMITS.tagChars)).max(30),
  summary: characterString(0, BLUEPRINT_DISCOVERY_LIMITS.summaryChars, false),
})

export const BlueprintCatalogResponseSchema = z.object({
  entries: z.array(
    BlueprintCatalogRevisionSchema.safeExtend({ discovery: BlueprintDiscoverySchema })
  ),
})

export type BlueprintDiscovery = z.infer<typeof BlueprintDiscoverySchema>
