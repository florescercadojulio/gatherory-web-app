import { z } from 'zod'
import { BlueprintCatalogRevisionSchema } from './blueprint-install.contracts'
import { characterString } from './content-primitives'

export const BLUEPRINT_DISCOVERY_LIMITS = { tagChars: 100, summaryChars: 500 } as const
export const BLUEPRINT_BROWSE_CATEGORIES = [
  'weddings',
  'birthdays',
  'holidays',
  'engagements',
  'showers',
  'bachelor_parties',
  'anniversaries',
  'graduations',
  'reunions',
  'dinner_parties',
  'picnics',
  'game_nights',
  'trips',
  'cottage_stays',
  'guest_stays',
  'retreats',
  'community',
  'events',
] as const

export const BlueprintDiscoverySchema = z.object({
  categories: z.array(z.enum(BLUEPRINT_BROWSE_CATEGORIES)).min(1),
  tags: z.array(characterString(1, BLUEPRINT_DISCOVERY_LIMITS.tagChars)).max(30),
  summary: characterString(0, BLUEPRINT_DISCOVERY_LIMITS.summaryChars, false),
})

export const BlueprintCatalogResponseSchema = z.object({
  entries: z.array(
    BlueprintCatalogRevisionSchema.safeExtend({ discovery: BlueprintDiscoverySchema })
  ),
})

export type BlueprintDiscovery = z.infer<typeof BlueprintDiscoverySchema>
