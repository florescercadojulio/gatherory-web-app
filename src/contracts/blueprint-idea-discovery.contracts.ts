import { z } from 'zod'
import {
  BlueprintIdeaCategorySchema,
  BlueprintTargetSchema,
  PortableIdeaConfigurationSchema,
} from './blueprint-install.contracts'
import {
  BlueprintCreatorSchema,
  BlueprintStableKeySchema,
  BLUEPRINT_LIMITS,
} from './blueprint-install.contracts'
import { characterString, UUIDSchema } from './content-primitives'
import { BlueprintPublicCoverURLSchema } from './blueprint-discovery.contracts'

export const BLUEPRINT_IDEA_DISCOVERY_LIMITS = {
  queryChars: 128,
  cursorChars: 512,
  defaultPageSize: 30,
  maxPageSize: 60,
} as const

/** Public idea projection. Only the source-bound public cover reference is returned; storage locations are omitted. */
export const BlueprintCatalogIdeaSchema = z
  .object({
    key: BlueprintStableKeySchema,
    title: characterString(1, BLUEPRINT_LIMITS.titleChars),
    category: BlueprintIdeaCategorySchema,
    notes: characterString(0, BLUEPRINT_LIMITS.descriptionChars).optional(),
    target: BlueprintTargetSchema,
    configuration: PortableIdeaConfigurationSchema,
  })
  .strict()

export const BlueprintIdeaDiscoveryRequestSchema = z
  .object({
    q: characterString(0, BLUEPRINT_IDEA_DISCOVERY_LIMITS.queryChars)
      .optional()
      .transform((q) => q?.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim() ?? ''),
    cursor: z
      .string()
      .min(1)
      .max(BLUEPRINT_IDEA_DISCOVERY_LIMITS.cursorChars)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(BLUEPRINT_IDEA_DISCOVERY_LIMITS.maxPageSize)
      .default(BLUEPRINT_IDEA_DISCOVERY_LIMITS.defaultPageSize),
  })
  .strict()

export const BlueprintIdeaDiscoveryItemSchema = z
  .object({
    id: z.string().min(1).max(512),
    sourceBlueprintId: BlueprintStableKeySchema,
    sourceVersion: z.number().int().positive(),
    sourceTitle: characterString(1, BLUEPRINT_LIMITS.titleChars),
    creator: BlueprintCreatorSchema.optional(),
    idea: BlueprintCatalogIdeaSchema,
    coverAssetId: UUIDSchema.optional(),
    coverImageURL: BlueprintPublicCoverURLSchema.optional(),
  })
  .strict()

export const BlueprintIdeaDiscoveryResponseSchema = z
  .object({
    ideas: z.array(BlueprintIdeaDiscoveryItemSchema),
    nextCursor: z.string().min(1).max(BLUEPRINT_IDEA_DISCOVERY_LIMITS.cursorChars).optional(),
  })
  .strict()

export type BlueprintIdeaDiscoveryRequest = z.infer<typeof BlueprintIdeaDiscoveryRequestSchema>
export type BlueprintIdeaDiscoveryResponse = z.infer<typeof BlueprintIdeaDiscoveryResponseSchema>
