import { z } from 'zod'

import { ExperienceBlueprintSchema, ExperienceModuleSchema } from './experience.contracts'
import { ConfirmedInstantSchema } from './date-time.contracts'
import { BlueprintShareTokenSchema } from './blueprint-sharing.contracts'
import {
  characterString,
  PermissionKeySchema,
  StableKeySchema,
  TimeZoneNameSchema,
  UUIDSchema,
} from './content-primitives'

export const BLUEPRINT_LIMITS = {
  children: 50,
  ideas: 100,
  instructionSections: 30,
  titleChars: 120,
  descriptionChars: 2_000,
  instructionBodyChars: 5_000,
  serializedBytes: 256 * 1024,
  portableConfigurationDepth: 8,
  portableConfigurationEntries: 100,
} as const

export const BLUEPRINT_PLANNER_VERSION = 1 as const

export const BlueprintStableKeySchema = StableKeySchema

/** Capabilities are namespaced; ordinary catalog/source keys intentionally are not. */
export const BlueprintCapabilityKeySchema = PermissionKeySchema

const titleSchema = characterString(1, BLUEPRINT_LIMITS.titleChars)
const notesSchema = characterString(0, BLUEPRINT_LIMITS.descriptionChars)
const instructionBodySchema = characterString(1, BLUEPRINT_LIMITS.instructionBodyChars)

// Music is an always-active native playlist, not an undecided idea. Keep it
// out of the executable subset until template playlist semantics are explicit.
export const BlueprintIdeaCategorySchema = z.enum([
  'event',
  'registry',
  'link',
  'venue',
  'attire',
  'flowers',
  'food',
  'photography',
  'decor',
  'invitations',
  'honeymoon',
  'other',
])

export const BlueprintChildCategorySchema = z.enum([
  'venue',
  'food_tasting',
  'photography',
  'honeymoon',
  'attire_fitting',
  'wedding_shower',
  'bachelor_bachelorette',
  'rehearsal',
  'ceremony',
  'reception',
  'other',
])

export const BlueprintTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('main') }).strict(),
  z.object({ kind: z.literal('child'), key: BlueprintStableKeySchema }).strict(),
])

const childDefinitionSchema = z
  .object({
    key: BlueprintStableKeySchema.refine(
      (key) => key !== 'main',
      'The main event key is reserved.'
    ).meta({ not: { const: 'main' } }),
    title: titleSchema,
    purpose: z.enum(['planning_scouting', 'part_of_event']),
    category: BlueprintChildCategorySchema,
    scheduleProposal: z
      .object({
        anchor: z.literal('main_start'),
        dayOffset: z.number().int().min(-365).max(3_650),
        localTime: z
          .string()
          .length(5)
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
      .strict()
      .optional(),
  })
  .strict()

// The only portable idea configuration currently understood by the installer.
// Expanding this object requires adding an explicit consumer for each new field.
export const PortableIdeaConfigurationSchema = z
  .object({ version: z.literal(1) })
  .strict()
  .default({ version: 1 })

const ideaDefinitionSchema = z
  .object({
    key: BlueprintStableKeySchema,
    title: titleSchema,
    category: BlueprintIdeaCategorySchema,
    notes: notesSchema.optional(),
    target: BlueprintTargetSchema,
    configuration: PortableIdeaConfigurationSchema,
  })
  .strict()

const instructionDefinitionSchema = z
  .object({
    key: BlueprintStableKeySchema,
    title: titleSchema,
    body: instructionBodySchema,
    audience: z.enum(['planning_only', 'event_participants']),
    target: BlueprintTargetSchema,
  })
  .strict()

const experienceTreeConfigSchema = z
  .object({
    mainEventType: BlueprintStableKeySchema,
    children: z.array(childDefinitionSchema).max(BLUEPRINT_LIMITS.children).default([]),
  })
  .strict()

const ideasConfigSchema = z
  .object({
    categoryOrder: z.array(BlueprintIdeaCategorySchema).max(20).default([]),
    ideas: z.array(ideaDefinitionSchema).max(BLUEPRINT_LIMITS.ideas).default([]),
  })
  .strict()

const instructionsConfigSchema = z
  .object({
    sections: z
      .array(instructionDefinitionSchema)
      .max(BLUEPRINT_LIMITS.instructionSections)
      .default([]),
  })
  .strict()

export const BlueprintExperienceTreeModuleSchema = z
  .object({
    key: BlueprintStableKeySchema,
    type: z.literal('experience_tree'),
    version: z.literal(2),
    required: z.boolean().default(false),
    config: experienceTreeConfigSchema,
  })
  .strict()

export const BlueprintIdeasModuleSchema = z
  .object({
    key: BlueprintStableKeySchema,
    type: z.literal('ideas'),
    version: z.literal(2),
    required: z.boolean().default(false),
    config: ideasConfigSchema,
  })
  .strict()

export const BlueprintInstructionsModuleSchema = z
  .object({
    key: BlueprintStableKeySchema,
    type: z.literal('instructions'),
    version: z.literal(1),
    required: z.boolean().default(false),
    config: instructionsConfigSchema,
  })
  .strict()

const executableModuleIdentities = [
  { type: 'experience_tree', version: 2 },
  { type: 'ideas', version: 2 },
  { type: 'instructions', version: 1 },
] as const

// A known module must satisfy its typed limits, not fall through to opaque JSON.
// Export the same exclusion so API/MCP JSON Schema validators agree with Zod.
const opaqueModuleSchema = ExperienceModuleSchema.refine(
  (module) =>
    !executableModuleIdentities.some(
      ({ type, version }) => module.type === type && module.version === version
    ),
  'Known executable modules require their typed configuration.'
).meta({
  not: {
    anyOf: executableModuleIdentities.map(({ type, version }) => ({
      properties: { type: { const: type }, version: { const: version } },
      required: ['type', 'version'],
    })),
  },
})

export const BlueprintExecutableModuleSchema = z.union([
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
  opaqueModuleSchema,
])

export const BlueprintCatalogDefinitionSchema = ExperienceBlueprintSchema.safeExtend({
  modules: z.array(BlueprintExecutableModuleSchema).max(100),
}).superRefine((document, context) => {
  const childKeys = new Set<string>()
  const ideaKeys = new Set<string>()
  const sectionKeys = new Set<string>()
  const executableTypes = new Set<string>()
  let experienceTreeFound = false
  for (const [moduleIndex, module] of document.modules.entries()) {
    const tree = BlueprintExperienceTreeModuleSchema.safeParse(module)
    const ideas = BlueprintIdeasModuleSchema.safeParse(module)
    const instructions = BlueprintInstructionsModuleSchema.safeParse(module)
    const moduleIdentity = `${module.type}@${module.version}`
    if (
      (module.type === 'experience_tree' && module.version === 2) ||
      (module.type === 'ideas' && module.version === 2) ||
      (module.type === 'instructions' && module.version === 1)
    ) {
      if (executableTypes.has(moduleIdentity)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate executable module type: ${moduleIdentity}`,
          path: ['modules', moduleIndex, 'type'],
        })
      }
      executableTypes.add(moduleIdentity)
      if (!tree.success && module.type === 'experience_tree') {
        context.addIssue({
          code: 'custom',
          message: 'Invalid experience_tree v2 configuration.',
          path: ['modules', moduleIndex, 'config'],
        })
      }
      if (!ideas.success && module.type === 'ideas') {
        context.addIssue({
          code: 'custom',
          message: 'Invalid ideas v2 configuration.',
          path: ['modules', moduleIndex, 'config'],
        })
      }
      if (!instructions.success && module.type === 'instructions') {
        context.addIssue({
          code: 'custom',
          message: 'Invalid instructions v1 configuration.',
          path: ['modules', moduleIndex, 'config'],
        })
      }
    }
    if (tree.success) {
      experienceTreeFound = true
      if (tree.data.config.mainEventType !== document.experienceDefaults.type) {
        context.addIssue({
          code: 'custom',
          message: 'experience_tree mainEventType must match experienceDefaults.type.',
          path: ['modules', moduleIndex, 'config', 'mainEventType'],
        })
      }
      tree.data.config.children.forEach((child, childIndex) => {
        if (childKeys.has(child.key)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate child source key: ${child.key}`,
            path: ['modules', moduleIndex, 'config', 'children', childIndex, 'key'],
          })
        }
        childKeys.add(child.key)
      })
    }
    if (ideas.success) {
      const orderedCategories = new Set<string>()
      ideas.data.config.categoryOrder.forEach((category, categoryIndex) => {
        if (orderedCategories.has(category)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate category order entry: ${category}`,
            path: ['modules', moduleIndex, 'config', 'categoryOrder', categoryIndex],
          })
        }
        orderedCategories.add(category)
      })
      ideas.data.config.ideas.forEach((idea, ideaIndex) => {
        if (ideaKeys.has(idea.key)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate idea source key: ${idea.key}`,
            path: ['modules', moduleIndex, 'config', 'ideas', ideaIndex, 'key'],
          })
        }
        ideaKeys.add(idea.key)
      })
    }
    if (instructions.success) {
      instructions.data.config.sections.forEach((section, sectionIndex) => {
        if (sectionKeys.has(section.key)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate instruction source key: ${section.key}`,
            path: ['modules', moduleIndex, 'config', 'sections', sectionIndex, 'key'],
          })
        }
        sectionKeys.add(section.key)
      })
    }
  }

  if (!experienceTreeFound) {
    context.addIssue({
      code: 'custom',
      message: 'An executable blueprint requires an experience_tree v2 module.',
      path: ['modules'],
    })
  }

  for (const [moduleIndex, module] of document.modules.entries()) {
    const parsedIdeas = BlueprintIdeasModuleSchema.safeParse(module)
    const parsedInstructions = BlueprintInstructionsModuleSchema.safeParse(module)
    const typedEntries = parsedIdeas.success
      ? { name: 'ideas' as const, entries: parsedIdeas.data.config.ideas }
      : parsedInstructions.success
        ? { name: 'sections' as const, entries: parsedInstructions.data.config.sections }
        : null
    if (!typedEntries) continue
    for (const [entryIndex, entry] of typedEntries.entries.entries()) {
      if (entry.target.kind === 'child' && !childKeys.has(entry.target.key)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown child target: ${entry.target.key}`,
          path: ['modules', moduleIndex, 'config', typedEntries.name, entryIndex, 'target', 'key'],
        })
      }
    }
  }

  if (serializedByteLength(document) > BLUEPRINT_LIMITS.serializedBytes) {
    context.addIssue({
      code: 'custom',
      message: `Blueprint definition exceeds ${BLUEPRINT_LIMITS.serializedBytes} serialized bytes.`,
      path: [],
    })
  }
})

export const BlueprintContentHashSchema = z
  .string()
  .length(64)
  .regex(/^[a-f0-9]{64}$/)

export const BlueprintCatalogRevisionSchema = z
  .object({
    catalogKey: BlueprintStableKeySchema,
    revision: z.number().int().positive(),
    contentHash: BlueprintContentHashSchema,
    definition: BlueprintCatalogDefinitionSchema,
  })
  .superRefine((revision, context) => {
    if (revision.catalogKey !== revision.definition.blueprint.id) {
      context.addIssue({
        code: 'custom',
        message: 'Catalog key must match the blueprint document ID.',
        path: ['catalogKey'],
      })
    }
    if (revision.revision !== revision.definition.blueprint.revision) {
      context.addIssue({
        code: 'custom',
        message: 'Revision metadata must match the blueprint document revision.',
        path: ['revision'],
      })
    }
  })

export const BlueprintInstallInputSchema = z
  .object({
    requestId: UUIDSchema,
    shareToken: BlueprintShareTokenSchema.optional(),
    catalogKey: BlueprintStableKeySchema,
    revision: z.number().int().positive(),
    contentHash: BlueprintContentHashSchema,
    mainEvent: z
      .object({
        name: titleSchema,
        startsAt: ConfirmedInstantSchema,
        timeZone: TimeZoneNameSchema,
      })
      .strict(),
    selectedChildren: z
      .array(
        z
          .object({
            key: BlueprintStableKeySchema,
            startsAt: ConfirmedInstantSchema,
          })
          .strict()
      )
      .max(BLUEPRINT_LIMITS.children),
    selectedIdeaKeys: z.array(BlueprintStableKeySchema).max(BLUEPRINT_LIMITS.ideas),
    capabilities: z.array(BlueprintCapabilityKeySchema).max(100),
  })
  .strict()
  .superRefine((input, context) => {
    addDuplicateIssues(
      input.selectedChildren.map(({ key }) => key),
      ['selectedChildren'],
      context
    )
    addDuplicateIssues(input.selectedIdeaKeys, ['selectedIdeaKeys'], context)
    addDuplicateIssues(input.capabilities, ['capabilities'], context)
  })

export const BlueprintPlannedEventSchema = z
  .object({
    sourceKey: BlueprintStableKeySchema,
    name: titleSchema,
    eventType: BlueprintStableKeySchema,
    startsAt: ConfirmedInstantSchema,
    timeZone: TimeZoneNameSchema,
    parentSourceKey: BlueprintStableKeySchema.nullable(),
    purpose: z.enum(['planning_scouting', 'part_of_event']).nullable(),
    category: BlueprintChildCategorySchema.nullable(),
    planningStatus: z.literal('approved').nullable(),
  })
  .strict()

export const BlueprintPlannedIdeaSchema = z
  .object({
    sourceKey: BlueprintStableKeySchema,
    title: titleSchema,
    category: BlueprintIdeaCategorySchema,
    notes: notesSchema.nullable(),
    targetSourceKey: BlueprintStableKeySchema,
    configuration: PortableIdeaConfigurationSchema,
    status: z.literal('new'),
  })
  .strict()

export const BlueprintPlannedInstructionSchema = z
  .object({
    sourceKey: BlueprintStableKeySchema,
    title: titleSchema,
    body: instructionBodySchema,
    audience: z.enum(['planning_only', 'event_participants']),
    targetSourceKey: BlueprintStableKeySchema,
  })
  .strict()

export const BlueprintPlanOmissionSchema = z
  .object({
    sourceKey: BlueprintStableKeySchema,
    reason: z.enum([
      'child_not_selected',
      'unsupported_optional_capability',
      'unsupported_optional_module',
    ]),
  })
  .strict()

export const BlueprintExpandedPlanSchema = z
  .object({
    plannerVersion: z.literal(BLUEPRINT_PLANNER_VERSION),
    experienceType: BlueprintStableKeySchema,
    categoryOrder: z.array(BlueprintIdeaCategorySchema).max(20),
    main: BlueprintPlannedEventSchema,
    children: z.array(BlueprintPlannedEventSchema).max(BLUEPRINT_LIMITS.children),
    ideas: z.array(BlueprintPlannedIdeaSchema).max(BLUEPRINT_LIMITS.ideas),
    instructions: z
      .array(BlueprintPlannedInstructionSchema)
      .max(BLUEPRINT_LIMITS.instructionSections),
    omissions: z.array(BlueprintPlanOmissionSchema).max(200),
  })
  .strict()

export type BlueprintCatalogDefinition = z.infer<typeof BlueprintCatalogDefinitionSchema>
export type BlueprintCatalogRevision = z.infer<typeof BlueprintCatalogRevisionSchema>
export type BlueprintInstallInput = z.infer<typeof BlueprintInstallInputSchema>
export type BlueprintExpandedPlan = z.infer<typeof BlueprintExpandedPlanSchema>
export type BlueprintInstallPlan = BlueprintExpandedPlan
export type BlueprintIdeaConfiguration = z.infer<typeof PortableIdeaConfigurationSchema>

function addDuplicateIssues(keys: string[], path: (string | number)[], context: z.RefinementCtx) {
  const seen = new Set<string>()
  keys.forEach((key, index) => {
    if (seen.has(key)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate key: ${key}`,
        path: [...path, index, 'key'],
      })
      return
    }
    seen.add(key)
  })
}

function serializedByteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}
