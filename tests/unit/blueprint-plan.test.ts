import { expect, test } from 'vitest'

import {
  BlueprintCatalogDefinitionSchema,
  BlueprintCatalogRevisionSchema,
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstallInputSchema,
  BlueprintIdeaCategorySchema,
} from '@/contracts/blueprint-install.contracts'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import {
  BlueprintPlanningError,
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
  parseBlueprintInstallInput,
} from '@/server/blueprints/planning/plan-blueprint-installation'

test('does not seed undecided music ideas into the native always-active playlist lifecycle', () => {
  expect(BlueprintIdeaCategorySchema.safeParse('music').success).toBe(false)
})

const request = {
  requestId: 'af08d534-8c90-4c89-bacc-0f5820bb4d0c',
  catalogKey: 'wedding',
  revision: 1,
  contentHash: weddingBlueprintV1.contentHash,
  mainEvent: {
    name: 'Jamie and Alex',
    startsAt: '2027-06-15T15:00:00-04:00',
    timeZone: 'America/Detroit',
  },
  selectedChildren: [
    { key: 'reception', startsAt: '2027-06-15T18:00:00-04:00' },
    { key: 'ceremony', startsAt: '2027-06-15T15:00:00-04:00' },
  ],
  selectedIdeaKeys: ['photography', 'venue', 'food'],
  capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
}

test('parses the typed envelope revision and strict install request', () => {
  expect(BlueprintCatalogRevisionSchema.parse(weddingBlueprintV1).catalogKey).toBe('wedding')
  expect(
    BlueprintCatalogRevisionSchema.parse({ ...weddingBlueprintV1, id: 'persisted-revision-id' })
      .contentHash
  ).toBe(weddingBlueprintV1.contentHash)
  expect(parseBlueprintInstallInput(request).contentHash).toBe(weddingBlueprintV1.contentHash)
  expect(BlueprintInstallInputSchema.safeParse({ ...request, ignored: true }).success).toBe(false)
  expect(
    BlueprintInstallInputSchema.safeParse({ ...request, contentHash: undefined }).success
  ).toBe(false)
})

test('expands a deterministic ID-free plan with approved children and new ideas', () => {
  const first = expandBlueprintInstallation(request, weddingBlueprintV1)
  const second = expandBlueprintInstallation(
    {
      ...request,
      selectedChildren: [...request.selectedChildren].reverse(),
      selectedIdeaKeys: ['food', 'venue', 'photography'],
    },
    weddingBlueprintV1
  )

  expect(first).toEqual(second)
  expect(first).toMatchObject({
    plannerVersion: 1,
    experienceType: 'wedding',
    categoryOrder: ['venue', 'attire', 'food', 'flowers', 'photography'],
    main: { sourceKey: 'main', name: 'Jamie and Alex', planningStatus: null },
    children: [
      { sourceKey: 'ceremony', planningStatus: 'approved', parentSourceKey: 'main' },
      { sourceKey: 'reception', planningStatus: 'approved', parentSourceKey: 'main' },
    ],
    ideas: [
      { sourceKey: 'venue', status: 'new' },
      { sourceKey: 'food', status: 'new' },
      { sourceKey: 'photography', status: 'new' },
    ],
  })
  expect(JSON.stringify(first)).not.toMatch(/\bid\b/i)
})

test('omits ideas and instructions whose child target was not selected', () => {
  const plan = expandBlueprintInstallation(
    { ...request, selectedChildren: [], selectedIdeaKeys: ['venue'] },
    weddingBlueprintV1
  )

  expect(plan.instructions.map(({ sourceKey, audience }) => ({ sourceKey, audience }))).toEqual([
    { sourceKey: 'planning_priorities', audience: 'planning_only' },
  ])
  expect(plan.omissions).toEqual(
    expect.arrayContaining([
      { sourceKey: 'ceremony_guidance', reason: 'child_not_selected' },
      { sourceKey: 'reception_guidance', reason: 'child_not_selected' },
    ])
  )
})

test('rejects unknown selections, mismatched revisions, and mismatched content hashes', () => {
  expect(() =>
    expandBlueprintInstallation(
      {
        ...request,
        selectedChildren: [{ key: 'not_a_child', startsAt: '2027-06-15T18:00:00-04:00' }],
      },
      weddingBlueprintV1
    )
  ).toThrowError(expect.objectContaining({ code: 'unknown_child' }))
  expect(() =>
    expandBlueprintInstallation(
      { ...request, selectedIdeaKeys: ['unknown_idea'] },
      weddingBlueprintV1
    )
  ).toThrowError(expect.objectContaining({ code: 'unknown_idea' }))
  expect(() =>
    expandBlueprintInstallation({ ...request, revision: 2 }, weddingBlueprintV1)
  ).toThrowError(expect.objectContaining({ code: 'catalog_mismatch' }))
  expect(() =>
    expandBlueprintInstallation({ ...request, contentHash: '0'.repeat(64) }, weddingBlueprintV1)
  ).toThrowError(expect.objectContaining({ code: 'content_hash_mismatch' }))
})

test('rejects required capabilities that the client or server cannot support', () => {
  const noInstructionCapability = {
    ...request,
    capabilities: request.capabilities.filter((key) => key !== 'planning.instructions_v1'),
  }
  expect(() =>
    expandBlueprintInstallation(noInstructionCapability, weddingBlueprintV1)
  ).toThrowError(expect.objectContaining({ code: 'unsupported_required_capability' }))

  expect(() =>
    expandBlueprintInstallation(request, weddingBlueprintV1, {
      supportedCapabilities: ['event.children_v1'],
    })
  ).toThrowError(expect.objectContaining({ code: 'unsupported_required_capability' }))
})

test('omits optional unsupported modules and cascades omitted children to dependents', () => {
  const sourceDocument = weddingBlueprintV1.definition
  const definition = BlueprintCatalogDefinitionSchema.parse({
    ...sourceDocument,
    modules: sourceDocument.modules.map((module) => {
      const tree = BlueprintExperienceTreeModuleSchema.safeParse(module)
      if (tree.success) {
        return { ...tree.data, required: false }
      }
      const ideas = BlueprintIdeasModuleSchema.safeParse(module)
      if (ideas.success) {
        return {
          ...ideas.data,
          config: {
            ...ideas.data.config,
            ideas: [
              ...ideas.data.config.ideas,
              {
                key: 'ceremony_music',
                title: 'Ceremony music',
                category: 'other',
                target: { kind: 'child', key: 'ceremony' },
                configuration: { version: 1 },
              },
            ],
          },
        }
      }
      return module
    }),
  })
  const revision = BlueprintCatalogRevisionSchema.parse({
    catalogKey: 'wedding',
    revision: 1,
    definition,
    contentHash: blueprintHash(definition),
  })
  const plan = expandBlueprintInstallation(
    {
      ...request,
      contentHash: revision.contentHash,
      selectedIdeaKeys: ['venue', 'ceremony_music'],
      capabilities: request.capabilities.filter((key) => key !== 'event.children_v1'),
    },
    revision
  )

  expect(plan.children).toEqual([])
  expect(plan.ideas.map(({ sourceKey }) => sourceKey)).toEqual(['venue'])
  expect(plan.omissions).toEqual(
    expect.arrayContaining([
      { sourceKey: 'event_tree', reason: 'unsupported_optional_capability' },
      { sourceKey: 'ceremony_music', reason: 'unsupported_optional_capability' },
      { sourceKey: 'ceremony_guidance', reason: 'unsupported_optional_capability' },
    ])
  )
})

test('requires confirmed instants and matching explicit offsets for the named zone', () => {
  const zuluInput = {
    ...request,
    mainEvent: { ...request.mainEvent, startsAt: '2027-06-15T19:00:00Z' },
    selectedChildren: [],
  }
  expect(expandBlueprintInstallation(zuluInput, weddingBlueprintV1).main.startsAt).toBe(
    '2027-06-15T19:00:00Z'
  )

  for (const startsAt of [
    '2027-06-15T15:00:00-05:00', // Detroit is observing -04:00.
    '2027-03-14T02:30:00-05:00', // This wall time falls in Detroit's spring-forward gap.
  ]) {
    expect(() =>
      expandBlueprintInstallation(
        { ...request, mainEvent: { ...request.mainEvent, startsAt } },
        weddingBlueprintV1
      )
    ).toThrowError(expect.objectContaining({ code: 'invalid_schedule' }))
  }

  expect(() =>
    expandBlueprintInstallation(
      { ...request, mainEvent: { ...request.mainEvent, timeZone: 'Not/A_Time_Zone' } },
      weddingBlueprintV1
    )
  ).toThrowError(BlueprintPlanningError)
})

test('rejects duplicate keys, dangling targets, version mismatches, and contract limits', () => {
  const sourceDocument = weddingBlueprintV1.definition
  const unhandledConfiguration = {
    ...sourceDocument,
    modules: sourceDocument.modules.map((module) => {
      const ideas = BlueprintIdeasModuleSchema.safeParse(module)
      if (!ideas.success) return module
      return {
        ...ideas.data,
        config: {
          ...ideas.data.config,
          ideas: ideas.data.config.ideas.map((idea, index) =>
            index === 0
              ? { ...idea, configuration: { version: 1, unhandled: { nativePayload: true } } }
              : idea
          ),
        },
      }
    }),
  }
  expect(BlueprintCatalogDefinitionSchema.safeParse(unhandledConfiguration).success).toBe(false)

  const duplicateTree = {
    ...sourceDocument,
    modules: sourceDocument.modules.map((module) => {
      const tree = BlueprintExperienceTreeModuleSchema.safeParse(module)
      if (!tree.success) return module
      return {
        ...tree.data,
        config: {
          ...tree.data.config,
          children: [...tree.data.config.children, tree.data.config.children[0]],
        },
      }
    }),
  }
  expect(BlueprintCatalogDefinitionSchema.safeParse(duplicateTree).success).toBe(false)

  const danglingTarget = {
    ...sourceDocument,
    modules: sourceDocument.modules.map((module) => {
      const ideas = BlueprintIdeasModuleSchema.safeParse(module)
      if (!ideas.success) return module
      return {
        ...ideas.data,
        config: {
          ...ideas.data.config,
          ideas: ideas.data.config.ideas.map((idea, index) =>
            index === 0 ? { ...idea, target: { kind: 'child', key: 'missing_child' } } : idea
          ),
        },
      }
    }),
  }
  expect(BlueprintCatalogDefinitionSchema.safeParse(danglingTarget).success).toBe(false)

  const unsupportedRequired = {
    ...sourceDocument,
    modules: [
      ...sourceDocument.modules,
      {
        key: 'unknown_required_module',
        type: 'unknown_feature',
        version: 1,
        required: true,
        config: {},
      },
    ],
  }
  expect(() =>
    expandBlueprintInstallation(
      { ...request, contentHash: blueprintHash(unsupportedRequired) },
      {
        ...weddingBlueprintV1,
        definition: unsupportedRequired as typeof sourceDocument,
        contentHash: blueprintHash(unsupportedRequired),
      }
    )
  ).toThrowError(expect.objectContaining({ code: 'unsupported_required_module' }))

  const tooManyChildren = {
    ...sourceDocument,
    modules: sourceDocument.modules.map((module) => {
      const tree = BlueprintExperienceTreeModuleSchema.safeParse(module)
      if (!tree.success) return module
      return {
        ...tree.data,
        config: {
          ...tree.data.config,
          children: Array.from({ length: 51 }, (_, index) => ({
            key: `child_${index}`,
            title: `Child ${index}`,
            purpose: 'part_of_event',
            category: 'other',
          })),
        },
      }
    }),
  }
  expect(BlueprintCatalogDefinitionSchema.safeParse(tooManyChildren).success).toBe(false)
})
