import { z } from 'zod'
import { BlueprintDraftContentSchema } from './blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from './blueprint-install.contracts'
import { characterString, StableKeySchema, UUIDSchema } from './content-primitives'

export const BlueprintCopyRequestSchema = z
  .object({ requestId: UUIDSchema, content: BlueprintDraftContentSchema })
  .strict()

export const BlueprintCopyResponseSchema = z
  .object({
    id: UUIDSchema,
    draftVersion: z.number().int().positive(),
    publishedRevision: z.number().int().positive().nullable(),
    listedRevision: z.null(),
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
