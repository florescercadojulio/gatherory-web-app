import {
  BLUEPRINT_PLANNER_VERSION,
  BlueprintCatalogDefinitionSchema,
  BlueprintCatalogRevisionSchema,
  BlueprintExpandedPlanSchema,
  BlueprintInstallInputSchema,
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
  BlueprintTodosModuleSchema,
  normalizeBlueprintTodoWebsiteURL,
  type BlueprintCatalogDefinition,
  type BlueprintExpandedPlan,
  type BlueprintInstallInput,
} from '@/contracts/blueprint-install.contracts'
import { z } from 'zod'
import { blueprintHash } from './blueprint-hash'
import { assertConfirmedSchedule } from './confirmed-schedule.server'

export const BLUEPRINT_SERVER_CAPABILITIES = [
  'event.children_v1',
  'planning.ideas_v2',
  'planning.instructions_v1',
  'planning.portable_idea_config_v1',
  'planning.todos_v1',
] as const

export type BlueprintPlanningErrorCode =
  | 'invalid_input'
  | 'invalid_catalog'
  | 'catalog_mismatch'
  | 'content_hash_mismatch'
  | 'unknown_child'
  | 'unknown_idea'
  | 'unsupported_required_capability'
  | 'unsupported_required_module'
  | 'invalid_customization'
  | 'unsupported_customization'
  | 'invalid_schedule'

export class BlueprintPlanningError extends Error {
  readonly name = 'BlueprintPlanningError'

  constructor(
    readonly code: BlueprintPlanningErrorCode,
    message: string
  ) {
    super(message)
  }
}

export type ExpandBlueprintInstallationOptions = {
  supportedCapabilities?: readonly string[]
}

export function parseBlueprintInstallInput(input: unknown): BlueprintInstallInput {
  const result = BlueprintInstallInputSchema.safeParse(input)
  if (!result.success) {
    throw new BlueprintPlanningError('invalid_input', result.error.message)
  }
  return result.data
}

/**
 * Expands one immutable catalog revision to an ID-free DTO. All output ordering
 * follows the authored module/item order, independent of selection order.
 */
export function expandBlueprintInstallation(
  inputValue: unknown,
  revisionValue: unknown,
  options: ExpandBlueprintInstallationOptions = {}
): BlueprintExpandedPlan {
  const input = parseBlueprintInstallInput(inputValue)
  const revisionResult = BlueprintCatalogRevisionSchema.safeParse(revisionValue)
  if (!revisionResult.success) {
    throw new BlueprintPlanningError('invalid_catalog', revisionResult.error.message)
  }
  const revision = revisionResult.data
  const definitionResult = BlueprintCatalogDefinitionSchema.safeParse(revision.definition)
  if (!definitionResult.success) {
    throw new BlueprintPlanningError('invalid_catalog', definitionResult.error.message)
  }
  const sourceDefinition = definitionResult.data

  if (input.catalogKey !== revision.catalogKey || input.revision !== revision.revision) {
    throw new BlueprintPlanningError(
      'catalog_mismatch',
      `Install request ${input.catalogKey}@${input.revision} does not match ${revision.catalogKey}@${revision.revision}.`
    )
  }
  if (
    input.contentHash !== revision.contentHash ||
    blueprintHash(sourceDefinition) !== revision.contentHash
  ) {
    throw new BlueprintPlanningError(
      'content_hash_mismatch',
      'The reviewed content hash does not match the immutable catalog revision.'
    )
  }

  const definition = applyCustomizations(sourceDefinition, input)

  const experienceTree = findModule(definition, BlueprintExperienceTreeModuleSchema)
  const ideasModule = findModule(definition, BlueprintIdeasModuleSchema)
  const instructionsModule = findModule(definition, BlueprintInstructionsModuleSchema)
  const todosModule = findModule(definition, BlueprintTodosModuleSchema)
  const inputChildren = new Map(input.selectedChildren.map((child) => [child.key, child]))
  const declaredChildren = new Map(
    (experienceTree?.config.children ?? []).map((child) => [child.key, child])
  )
  const allIdeas = ideasModule?.config.ideas ?? []
  const selectedIdeaKeys = new Set(input.selectedIdeaKeys)
  const allIdeaKeys = new Set(allIdeas.map((idea) => idea.key))

  validateConfirmedSchedule(input.mainEvent.startsAt, input.mainEvent.timeZone, 'main event')
  for (const [key, child] of inputChildren) {
    if (!declaredChildren.has(key)) {
      throw new BlueprintPlanningError('unknown_child', `Unknown selected child: ${key}`)
    }
    validateConfirmedSchedule(child.startsAt, input.mainEvent.timeZone, `child ${key}`)
  }
  for (const ideaKey of selectedIdeaKeys) {
    if (!allIdeaKeys.has(ideaKey)) {
      throw new BlueprintPlanningError('unknown_idea', `Unknown selected idea: ${ideaKey}`)
    }
  }

  const clientCapabilities = new Set(input.capabilities)
  const serverCapabilities = new Set(options.supportedCapabilities ?? BLUEPRINT_SERVER_CAPABILITIES)
  const availableCapabilities = new Set(
    [...clientCapabilities].filter((capability) => serverCapabilities.has(capability))
  )
  const supportedModules = new Map<string, boolean>()
  const omissions: BlueprintExpandedPlan['omissions'] = []
  for (const module of definition.modules) {
    const requiredCapabilities = capabilitiesForModule(module.type, module.version)
    const isSupported =
      requiredCapabilities !== null &&
      requiredCapabilities.every((capability) => availableCapabilities.has(capability))
    supportedModules.set(module.key, isSupported)
    if (isSupported) continue
    const hasCustomization =
      (module.type === 'experience_tree' &&
        module.version === 2 &&
        Boolean(input.customizations?.children.length)) ||
      (module.type === 'ideas' &&
        module.version === 2 &&
        Boolean(input.customizations?.ideas.length))
    if (hasCustomization) {
      throw new BlueprintPlanningError(
        'unsupported_customization',
        `Customized ${module.type} records cannot be installed without the required client and server capabilities.`
      )
    }
    if (module.required) {
      const isKnownType = requiredCapabilities !== null
      const missing =
        requiredCapabilities?.filter((capability) => !availableCapabilities.has(capability)) ?? []
      throw new BlueprintPlanningError(
        isKnownType ? 'unsupported_required_capability' : 'unsupported_required_module',
        isKnownType
          ? `Required capabilities are not supported by both installer and client: ${missing.join(', ')}`
          : `Required module is not supported: ${module.type} v${module.version}`
      )
    }
    omissions.push({
      sourceKey: module.key,
      reason:
        requiredCapabilities === null
          ? 'unsupported_optional_module'
          : 'unsupported_optional_capability',
    })
  }

  const treeIncluded = Boolean(experienceTree && supportedModules.get(experienceTree.key))
  const ideasIncluded = Boolean(ideasModule && supportedModules.get(ideasModule.key))
  const instructionsIncluded = Boolean(
    instructionsModule && supportedModules.get(instructionsModule.key)
  )
  const todosIncluded = Boolean(todosModule && supportedModules.get(todosModule.key))
  const omittedChildKeys = new Set<string>()
  const children: BlueprintExpandedPlan['children'] = []
  if (experienceTree && treeIncluded) {
    for (const child of experienceTree.config.children) {
      const confirmed = inputChildren.get(child.key)
      if (!confirmed) continue
      children.push({
        sourceKey: child.key,
        name: child.title,
        eventType: experienceTree.config.mainEventType,
        startsAt: confirmed.startsAt,
        timeZone: input.mainEvent.timeZone,
        parentSourceKey: 'main',
        purpose: child.purpose,
        category: child.category,
        planningStatus: 'approved',
      })
    }
  } else {
    for (const key of inputChildren.keys()) omittedChildKeys.add(key)
  }

  const includedChildKeys = new Set(children.map((child) => child.sourceKey))
  const ideas: BlueprintExpandedPlan['ideas'] = []
  if (ideasModule && ideasIncluded) {
    for (const idea of allIdeas) {
      if (!selectedIdeaKeys.has(idea.key)) continue
      if (!supportedModules.get(ideasModule.key)) {
        omissions.push({ sourceKey: idea.key, reason: 'unsupported_optional_capability' })
        continue
      }
      const targetSourceKey = idea.target.kind === 'main' ? 'main' : idea.target.key
      if (idea.target.kind === 'child' && !includedChildKeys.has(idea.target.key)) {
        omissions.push({
          sourceKey: idea.key,
          reason: omittedChildKeys.has(idea.target.key)
            ? 'unsupported_optional_capability'
            : 'child_not_selected',
        })
        continue
      }
      ideas.push({
        sourceKey: idea.key,
        title: idea.title,
        category: idea.category,
        notes: idea.notes ?? null,
        targetSourceKey,
        configuration: idea.configuration,
        status: 'new',
      })
    }
  } else {
    for (const key of selectedIdeaKeys) {
      omissions.push({ sourceKey: key, reason: 'unsupported_optional_capability' })
    }
  }

  const instructions: BlueprintExpandedPlan['instructions'] = []
  if (instructionsModule && instructionsIncluded) {
    for (const section of instructionsModule.config.sections) {
      const targetSourceKey = section.target.kind === 'main' ? 'main' : section.target.key
      if (section.target.kind === 'child' && !includedChildKeys.has(section.target.key)) {
        omissions.push({
          sourceKey: section.key,
          reason: omittedChildKeys.has(section.target.key)
            ? 'unsupported_optional_capability'
            : 'child_not_selected',
        })
        continue
      }
      instructions.push({
        sourceKey: section.key,
        title: section.title,
        body: section.body,
        audience: section.audience,
        targetSourceKey,
      })
    }
  }

  const todos: BlueprintExpandedPlan['todos'] = []
  if (todosModule && todosIncluded) {
    for (const todo of todosModule.config.todos) {
      const targetSourceKey = todo.target.kind === 'main' ? 'main' : todo.target.key
      if (todo.target.kind === 'child' && !includedChildKeys.has(todo.target.key)) {
        omissions.push({
          sourceKey: todo.key,
          reason: omittedChildKeys.has(todo.target.key)
            ? 'unsupported_optional_capability'
            : 'child_not_selected',
        })
        continue
      }
      todos.push({
        sourceKey: todo.key,
        title: todo.title,
        websiteURL: todo.websiteURL ? normalizeBlueprintTodoWebsiteURL(todo.websiteURL) : null,
        targetSourceKey,
      })
    }
  } else {
    for (const todo of todosModule?.config.todos ?? []) {
      omissions.push({ sourceKey: todo.key, reason: 'unsupported_optional_capability' })
    }
  }

  const plan = {
    plannerVersion: BLUEPRINT_PLANNER_VERSION,
    experienceType: definition.experienceDefaults.type,
    categoryOrder: ideasModule && ideasIncluded ? ideasModule.config.categoryOrder : [],
    main: {
      sourceKey: 'main',
      name: input.mainEvent.name,
      eventType: definition.experienceDefaults.type,
      startsAt: input.mainEvent.startsAt,
      timeZone: input.mainEvent.timeZone,
      parentSourceKey: null,
      purpose: null,
      category: null,
      planningStatus: null,
    },
    children,
    ideas,
    instructions,
    todos,
    omissions: deduplicateOmissions(omissions),
  }

  const planResult = BlueprintExpandedPlanSchema.safeParse(plan)
  if (!planResult.success) {
    throw new BlueprintPlanningError('invalid_catalog', planResult.error.message)
  }
  return planResult.data
}

function applyCustomizations(
  source: BlueprintCatalogDefinition,
  input: BlueprintInstallInput
): BlueprintCatalogDefinition {
  const customizations = input.customizations
  if (!customizations) return source

  const hasIdeaModule = source.modules.some(
    (module) => BlueprintIdeasModuleSchema.safeParse(module).success
  )
  if (customizations.ideas.length > 0 && !hasIdeaModule) {
    throw new BlueprintPlanningError(
      'invalid_customization',
      'Idea customizations cannot be applied to a blueprint without an ideas module.'
    )
  }

  const modules = source.modules.map((module) => {
    const tree = BlueprintExperienceTreeModuleSchema.safeParse(module)
    if (tree.success && customizations.children.length > 0) {
      return {
        ...tree.data,
        config: {
          ...tree.data.config,
          children: upsertByKey(tree.data.config.children, customizations.children),
        },
      }
    }

    const ideas = BlueprintIdeasModuleSchema.safeParse(module)
    if (ideas.success && customizations.ideas.length > 0) {
      return {
        ...ideas.data,
        config: {
          ...ideas.data.config,
          categoryOrder: appendMissingCategories(
            ideas.data.config.categoryOrder,
            customizations.ideas.map(({ category }) => category)
          ),
          ideas: upsertByKey(ideas.data.config.ideas, customizations.ideas),
        },
      }
    }
    return module
  })

  const effective = BlueprintCatalogDefinitionSchema.safeParse({ ...source, modules })
  if (!effective.success) {
    throw new BlueprintPlanningError('invalid_customization', effective.error.message)
  }
  return effective.data
}

function appendMissingCategories(existing: string[], customized: string[]) {
  const result = [...existing]
  const included = new Set(existing)
  for (const category of customized) {
    if (included.has(category)) continue
    included.add(category)
    result.push(category)
  }
  return result
}

function upsertByKey<T extends { key: string }>(existing: T[], updates: T[]): T[] {
  const merged = [...existing]
  const indexes = new Map(merged.map((entry, index) => [entry.key, index]))
  for (const update of updates) {
    const index = indexes.get(update.key)
    if (index === undefined) {
      indexes.set(update.key, merged.length)
      merged.push(update)
    } else {
      merged[index] = update
    }
  }
  return merged
}

function findModule<
  S extends
    | typeof BlueprintExperienceTreeModuleSchema
    | typeof BlueprintIdeasModuleSchema
    | typeof BlueprintInstructionsModuleSchema
    | typeof BlueprintTodosModuleSchema,
>(definition: BlueprintCatalogDefinition, schema: S): z.infer<S> | undefined {
  const matches = definition.modules
    .map((module) => schema.safeParse(module))
    .filter((result) => result.success)
    .map((result) => result.data)
  if (matches.length > 1) {
    throw new BlueprintPlanningError(
      'invalid_catalog',
      'Only one module of each executable type is allowed.'
    )
  }
  return matches[0] as z.infer<S> | undefined
}

function capabilitiesForModule(type: string, version: number): string[] | null {
  if (type === 'experience_tree' && version === 2) return ['event.children_v1']
  if (type === 'ideas' && version === 2) {
    return ['planning.ideas_v2', 'planning.portable_idea_config_v1']
  }
  if (type === 'instructions' && version === 1) return ['planning.instructions_v1']
  if (type === 'todos' && version === 1) return ['planning.todos_v1']
  return null
}

function validateConfirmedSchedule(isoDateTime: string, timeZone: string, label: string) {
  try {
    assertConfirmedSchedule(isoDateTime, timeZone)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'invalid time zone'
    throw new BlueprintPlanningError(
      'invalid_schedule',
      `The confirmed ${label} start is invalid for time zone ${timeZone}: ${detail}. Supply a confirmed ISO date-time; local times are never guessed.`
    )
  }
}

function deduplicateOmissions(omissions: BlueprintExpandedPlan['omissions']) {
  const seen = new Set<string>()
  return omissions.filter((omission) => {
    const identity = `${omission.sourceKey}:${omission.reason}`
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}
