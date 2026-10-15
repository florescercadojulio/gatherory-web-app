import { z } from 'zod'
import {
  characterString,
  OpaqueIdentifierSchema,
  StableKeySchema,
  UUIDSchema,
} from './content-primitives'
import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
} from './blueprint-install.contracts'

/** The editor deliberately exposes only executable, portable content—not permissions. */
export const BlueprintDraftContentSchema = z
  .object({
    name: characterString(1, 120),
    description: characterString(0, 2_000),
    experienceType: z.enum(['wedding', 'birthday', 'holiday', 'custom']),
    children: BlueprintExperienceTreeModuleSchema.shape.config.shape.children,
    ideas: BlueprintIdeasModuleSchema.shape.config.shape.ideas,
    instructions: BlueprintInstructionsModuleSchema.shape.config.shape.sections,
  })
  .strict()
  .superRefine((content, context) => {
    const result = BlueprintCatalogDefinitionSchema.safeParse(draftDefinition(content, 'draft', 1))
    if (!result.success)
      for (const issue of result.error.issues)
        context.addIssue({ code: 'custom', message: issue.message, path: issue.path })
  })

export type BlueprintDraftContent = z.infer<typeof BlueprintDraftContentSchema>
export function draftDefinition(
  content: BlueprintDraftContent,
  catalogKey: string,
  revision: number
) {
  return {
    $schema: 'https://gatherory.com/schemas/experience-blueprint-v1.json',
    kind: 'experience_blueprint' as const,
    schemaVersion: 1 as const,
    blueprint: { id: catalogKey, revision, name: content.name },
    experienceDefaults: { type: content.experienceType },
    roles: [],
    modules: [
      {
        key: 'event_tree',
        type: 'experience_tree',
        version: 2,
        required: true,
        config: { mainEventType: content.experienceType, children: content.children },
      },
      {
        key: 'starter_ideas',
        type: 'ideas',
        version: 2,
        required: true,
        config: {
          categoryOrder: [...new Set(content.ideas.map((idea) => idea.category))],
          ideas: content.ideas,
        },
      },
      {
        key: 'guest_guidance',
        type: 'instructions',
        version: 1,
        required: true,
        config: { sections: content.instructions },
      },
    ],
  }
}

export const BlueprintAuthoringPageInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
    query: characterString(0, 120).default(''),
    source: z.enum(['all', 'curated', 'private']).default('all'),
    status: z.enum(['all', 'draft', 'published', 'retired']).default('all'),
  })
  .strict()
export const BlueprintDraftIdSchema = z.object({ id: UUIDSchema }).strict()
export const BlueprintStarterInputSchema = z
  .object({ catalogKey: StableKeySchema, revision: z.number().int().positive() })
  .strict()
export const BlueprintCreateDraftSchema = z
  .object({
    requestId: UUIDSchema,
    organizationId: OpaqueIdentifierSchema,
    content: BlueprintDraftContentSchema,
    source: BlueprintStarterInputSchema.optional(),
  })
  .strict()
export const BlueprintSaveDraftSchema = z
  .object({
    id: UUIDSchema,
    expectedVersion: z.number().int().positive(),
    content: BlueprintDraftContentSchema,
  })
  .strict()
export const BlueprintPublishDraftSchema = z
  .object({
    id: UUIDSchema,
    expectedVersion: z.number().int().positive(),
  })
  .strict()
export const BlueprintPreviewDraftSchema = z
  .object({
    id: UUIDSchema,
    expectedVersion: z.number().int().positive(),
  })
  .strict()
export type BlueprintDraft = {
  id: string
  organizationId: string
  catalogKey: string
  draftVersion: number
  content: BlueprintDraftContent
  publishedRevision: number | null
  publishedDraftVersion: number | null
  retired: boolean
  source: { catalogKey: string; revision: number } | null
}
export type BlueprintAuthoringRow = {
  id: string
  catalogKey: string
  name: string
  description: string
  source: 'curated' | 'private'
  status: 'draft' | 'published' | 'retired'
  revision: number | null
  draftVersion: number | null
}
/** Replay identifies the requested publication without misreporting the latest draft pointer. */
export type BlueprintPublishResult = BlueprintDraft & {
  publication: { revision: number; draftVersion: number; contentHash: string }
}
export type BlueprintAuthoringContext = {
  workspaces: { id: string; name: string; personal: boolean }[]
}
