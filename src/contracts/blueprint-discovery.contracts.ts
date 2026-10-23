import { z } from 'zod'
import {
  BLUEPRINT_LIMITS,
  BlueprintCatalogRevisionSchema,
  BlueprintCreatorSchema,
} from './blueprint-install.contracts'
import { characterString, StableKeySchema } from './content-primitives'
import { BlueprintDiscoveryContextSchema } from './blueprint-measurement.contracts'

export const BLUEPRINT_DISCOVERY_LIMITS = {
  tagChars: 100,
  summaryChars: 500,
  queryChars: 128,
  cursorChars: 2_048,
  defaultPageSize: 20,
  maxPageSize: 40,
} as const
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

/** Stable public derivative URLs are limited to immutable curated card objects. */
export const BlueprintPublicCoverURLSchema = z
  .string()
  .min(1)
  .max(2_048)
  .url()
  .regex(
    /^https:\/\/cdn\.gatherory\.com\/explore\/covers\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-f0-9]{64}\/card\.jpg$/,
    'Expected an immutable Gatherory Explore card URL.'
  )

export const BlueprintDiscoverySchema = z.object({
  categories: z.array(z.enum(BLUEPRINT_BROWSE_CATEGORIES)).min(1),
  tags: z.array(characterString(1, BLUEPRINT_DISCOVERY_LIMITS.tagChars)).max(30),
  summary: characterString(0, BLUEPRINT_DISCOVERY_LIMITS.summaryChars, false),
  coverImageURL: BlueprintPublicCoverURLSchema.optional(),
  /** Per-target curated art. Keys are immutable source stable keys, never DB IDs. */
  coverImages: z
    .object({
      children: z
        .record(StableKeySchema, BlueprintPublicCoverURLSchema)
        .meta({ maxProperties: BLUEPRINT_LIMITS.children })
        .refine((images) => Object.keys(images).length <= BLUEPRINT_LIMITS.children)
        .default({}),
      ideas: z
        .record(StableKeySchema, BlueprintPublicCoverURLSchema)
        .meta({ maxProperties: BLUEPRINT_LIMITS.ideas })
        .refine((images) => Object.keys(images).length <= BLUEPRINT_LIMITS.ideas)
        .default({}),
    })
    .strict()
    .optional(),
})

export const BlueprintCatalogResponseEntrySchema = BlueprintCatalogRevisionSchema.safeExtend({
  // Keep the public author metadata explicit at the discovery response boundary.
  creator: BlueprintCreatorSchema.optional(),
  discovery: BlueprintDiscoverySchema,
  viewerState: z
    .object({ liked: z.boolean(), bookmarked: z.boolean(), notInterested: z.boolean() })
    .optional(),
  discoveryContext: BlueprintDiscoveryContextSchema.optional(),
})

export const BlueprintCatalogResponseSchema = z.object({
  entries: z.array(BlueprintCatalogResponseEntrySchema),
  nextCursor: z.string().min(1).max(BLUEPRINT_DISCOVERY_LIMITS.cursorChars).optional(),
  availableCategories: z.array(z.enum(BLUEPRINT_BROWSE_CATEGORIES)).optional(),
  ranking: z
    .object({
      mode: z.enum(['baseline_v1', 'catalog']),
      algorithmVersion: z.enum([
        'blueprint-baseline-v2',
        'blueprint-personal-likes-v2',
        'blueprint-unseen-first-v1',
        'blueprint-personal-likes-unseen-first-v1',
      ]),
      configurationVersion: characterString(1, 80),
      asOf: z.iso.datetime().min(20).max(40),
      snapshotId: z
        .string()
        .length(64)
        .regex(/^[a-f0-9]{64}$/),
    })
    .optional(),
})

export const BlueprintCatalogPageRequestSchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(BLUEPRINT_DISCOVERY_LIMITS.maxPageSize)
      .default(BLUEPRINT_DISCOVERY_LIMITS.defaultPageSize),
    cursor: z
      .string()
      .min(1)
      .max(BLUEPRINT_DISCOVERY_LIMITS.cursorChars)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    category: z.enum(BLUEPRINT_BROWSE_CATEGORIES).optional(),
    ranking: z.literal('baseline_v1').optional(),
    q: characterString(0, BLUEPRINT_DISCOVERY_LIMITS.queryChars)
      .optional()
      .transform((query) => query?.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() ?? ''),
  })
  .strict()

export const BlueprintCatalogPageResponseSchema = BlueprintCatalogResponseSchema.extend({
  availableCategories: z.array(z.enum(BLUEPRINT_BROWSE_CATEGORIES)),
})

export type BlueprintDiscovery = z.infer<typeof BlueprintDiscoverySchema>
export type BlueprintCatalogPageRequest = z.infer<typeof BlueprintCatalogPageRequestSchema>
