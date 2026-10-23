import { z } from 'zod'
import { BlueprintDraftContentSchema } from './blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from './blueprint-install.contracts'
import { characterString, StableKeySchema, UUIDSchema } from './content-primitives'

export const BlueprintCopyRequestSchema = z
  .object({
    requestId: UUIDSchema,
    content: BlueprintDraftContentSchema,
    source: z
      .object({
        catalogKey: StableKeySchema,
        revision: z.number().int().positive(),
        shareToken: z.string().min(20).max(200).optional(),
        /** Server-issued organic discovery reference; never an authority by itself. */
        discoveryExposureId: UUIDSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

export const BlueprintCopyResponseSchema = z
  .object({
    id: UUIDSchema,
    draftVersion: z.number().int().positive(),
    publishedRevision: z.number().int().positive().nullable(),
    listedRevision: z.null(),
    creatorName: z.null(),
    activeShareLinkCount: z.number().int().nonnegative(),
    catalogEntry: z
      .object({
        catalogKey: StableKeySchema,
        revision: z.number().int().positive(),
        contentHash: z.string().regex(/^[0-9a-f]{64}$/),
        definition: BlueprintCatalogDefinitionSchema,
        description: characterString(0, 2_000),
      })
      .strict(),
  })
  .strict()
