import { expect, test } from 'vitest'

import {
  BlueprintCatalogDefinitionSchema,
  BlueprintCatalogRevisionSchema,
  BlueprintChildDefinitionSchema,
  BlueprintIdeaDefinitionSchema,
  BlueprintInstallInputSchema,
  BlueprintIdeasModuleSchema,
} from '@/contracts/blueprint-install.contracts'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '@/server/blueprints/planning/plan-blueprint-installation'
import { buildBlueprintNativeProjection } from '@/server/blueprints/services/blueprint-native-projection'

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
    { key: 'ceremony', startsAt: '2027-06-15T15:00:00-04:00' },
    { key: 'after_party', startsAt: '2027-06-15T20:00:00-04:00' },
  ],
  selectedIdeaKeys: ['venue', 'after_party_ideas'],
  capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
}

const customizations = {
  version: 1 as const,
  children: [
    {
      key: 'ceremony',
      title: 'Garden ceremony',
      purpose: 'part_of_event' as const,
      category: 'ceremony' as const,
    },
    {
      key: 'after_party',
      title: 'After party',
      purpose: 'part_of_event' as const,
      category: 'other' as const,
    },
  ],
  ideas: [
    {
      key: 'venue',
      title: 'Choose our venue',
      category: 'venue' as const,
      notes: 'Compare our two finalists.',
      target: { kind: 'main' as const },
      configuration: { version: 1 as const },
    },
    {
      key: 'after_party_ideas',
      title: 'After party options',
      category: 'other' as const,
      notes: 'Find a relaxed late night spot.',
      target: { kind: 'child' as const, key: 'after_party' },
      configuration: { version: 1 as const },
    },
  ],
}

test('upserts full child and idea definitions before planning in authored order', () => {
  const source = structuredClone(weddingBlueprintV1.definition)
  const originalHash = weddingBlueprintV1.contentHash
  const plan = expandBlueprintInstallation({ ...request, customizations }, weddingBlueprintV1)

  expect(plan.children.map(({ sourceKey, name }) => [sourceKey, name])).toEqual([
    ['ceremony', 'Garden ceremony'],
    ['after_party', 'After party'],
  ])
  expect(
    plan.ideas.map(({ sourceKey, title, targetSourceKey }) => [sourceKey, title, targetSourceKey])
  ).toEqual([
    ['venue', 'Choose our venue', 'main'],
    ['after_party_ideas', 'After party options', 'after_party'],
  ])
  expect(plan.categoryOrder).toEqual(['venue', 'attire', 'food', 'flowers', 'photography', 'other'])
  expect(weddingBlueprintV1.definition).toEqual(source)
  expect(blueprintHash(weddingBlueprintV1.definition)).toBe(originalHash)
})

test('projects customized records through distinct native manifests without reusing source keys as IDs', () => {
  const plan = expandBlueprintInstallation({ ...request, customizations }, weddingBlueprintV1)
  const manifestFor = (prefix: string) => ({
    events: {
      main: `${prefix}-event-main`,
      ceremony: `${prefix}-event-ceremony`,
      after_party: `${prefix}-event-after-party`,
    },
    ideas: {
      venue: `${prefix}-idea-venue`,
      after_party_ideas: `${prefix}-idea-after-party`,
    },
    guides: {
      planning_priorities: `${prefix}-guide-priorities`,
      ceremony_guidance: `${prefix}-guide-ceremony`,
    },
    personID: `${prefix}-person`,
    participations: {
      main: `${prefix}-participation-main`,
      ceremony: `${prefix}-participation-ceremony`,
      after_party: `${prefix}-participation-after-party`,
    },
  })
  const actor = { id: 'customizer', name: 'Jamie Example', email: 'jamie@example.test' }
  const firstManifest = manifestFor('first')
  const secondManifest = manifestFor('second')
  const project = (manifest: ReturnType<typeof manifestFor>) =>
    buildBlueprintNativeProjection({
      plan,
      manifest,
      actor,
      createdAt: new Date('2026-10-16T12:00:00.000Z'),
    })
  const first = project(firstManifest)
  const second = project(secondManifest)

  for (const [projection, manifest] of [
    [first, firstManifest],
    [second, secondManifest],
  ] as const) {
    const child = projection.archive.timeline.find(
      (event) => event.id === manifest.events.after_party
    )
    expect(child).toMatchObject({ id: manifest.events.after_party, title: 'After party' })
    expect(child?.id).not.toBe('after_party')

    const editedIdea = projection.archive.ideas.find((idea) => idea.id === manifest.ideas.venue)
    expect(editedIdea).toMatchObject({
      id: manifest.ideas.venue,
      title: 'Choose our venue',
      note: 'Compare our two finalists.',
      eventID: manifest.events.main,
    })
    expect(editedIdea?.id).not.toBe('venue')

    const addedIdea = projection.archive.ideas.find(
      (idea) => idea.id === manifest.ideas.after_party_ideas
    )
    expect(addedIdea).toMatchObject({
      id: manifest.ideas.after_party_ideas,
      title: 'After party options',
      note: 'Find a relaxed late night spot.',
      eventID: manifest.events.after_party,
    })
    expect(addedIdea?.id).not.toBe('after_party_ideas')

    expect(
      projection.entities.find(
        ({ entityType, entityId }) =>
          entityType === 'event' && entityId === manifest.events.after_party
      )?.payload
    ).toMatchObject({ id: manifest.events.after_party, title: 'After party' })
    expect(
      projection.entities.find(
        ({ entityType, entityId }) =>
          entityType === 'idea' && entityId === manifest.ideas.after_party_ideas
      )?.payload
    ).toMatchObject({
      id: manifest.ideas.after_party_ideas,
      eventID: manifest.events.after_party,
      title: 'After party options',
      note: 'Find a relaxed late night spot.',
    })
  }

  expect(first.archive.timeline.find((event) => event.title === 'After party')?.id).not.toBe(
    second.archive.timeline.find((event) => event.title === 'After party')?.id
  )
  expect(first.archive.ideas.find((idea) => idea.title === 'After party options')?.id).not.toBe(
    second.archive.ideas.find((idea) => idea.title === 'After party options')?.id
  )
})

test('rejects invalid effective targets, duplicate upserts, and merged totals over limits', () => {
  expect(() =>
    expandBlueprintInstallation(
      {
        ...request,
        customizations: {
          ...customizations,
          ideas: [
            {
              ...customizations.ideas[0],
              key: 'bad_target',
              target: { kind: 'child', key: 'missing' },
            },
          ],
        },
      },
      weddingBlueprintV1
    )
  ).toThrowError(expect.objectContaining({ code: 'invalid_customization' }))

  expect(() =>
    expandBlueprintInstallation(
      {
        ...request,
        customizations: {
          ...customizations,
          children: [customizations.children[1], customizations.children[1]],
        },
      },
      weddingBlueprintV1
    )
  ).toThrowError(expect.objectContaining({ code: 'invalid_input' }))

  const tooMany = Array.from({ length: 47 }, (_, index) => ({
    key: `extra_child_${index}`,
    title: `Extra child ${index}`,
    purpose: 'part_of_event' as const,
    category: 'other' as const,
  }))
  expect(() =>
    expandBlueprintInstallation(
      { ...request, customizations: { version: 1, children: tooMany, ideas: [] } },
      weddingBlueprintV1
    )
  ).toThrowError(expect.objectContaining({ code: 'invalid_customization' }))
})

test('rejects customizations that cannot be applied and never skips them for unsupported modules', () => {
  const noIdeasDefinition = BlueprintCatalogDefinitionSchema.parse({
    ...weddingBlueprintV1.definition,
    modules: weddingBlueprintV1.definition.modules.filter(
      (module) => !BlueprintIdeasModuleSchema.safeParse(module).success
    ),
  })
  const noIdeasRevision = BlueprintCatalogRevisionSchema.parse({
    ...weddingBlueprintV1,
    definition: noIdeasDefinition,
    contentHash: blueprintHash(noIdeasDefinition),
  })
  expect(() =>
    expandBlueprintInstallation(
      { ...request, contentHash: noIdeasRevision.contentHash, customizations },
      noIdeasRevision
    )
  ).toThrowError(expect.objectContaining({ code: 'invalid_customization' }))

  const optionalIdeasDefinition = BlueprintCatalogDefinitionSchema.parse({
    ...weddingBlueprintV1.definition,
    modules: weddingBlueprintV1.definition.modules.map((module) => {
      const ideas = BlueprintIdeasModuleSchema.safeParse(module)
      return ideas.success ? { ...ideas.data, required: false } : module
    }),
  })
  const optionalIdeasRevision = BlueprintCatalogRevisionSchema.parse({
    ...weddingBlueprintV1,
    definition: optionalIdeasDefinition,
    contentHash: blueprintHash(optionalIdeasDefinition),
  })
  expect(() =>
    expandBlueprintInstallation(
      { ...request, contentHash: optionalIdeasRevision.contentHash, customizations },
      optionalIdeasRevision,
      { supportedCapabilities: ['event.children_v1', 'planning.instructions_v1'] }
    )
  ).toThrowError(expect.objectContaining({ code: 'unsupported_customization' }))
})

test('omits opaque future module versions without blocking customization of executable v2 modules', () => {
  const definition = BlueprintCatalogDefinitionSchema.parse({
    ...weddingBlueprintV1.definition,
    modules: [
      ...weddingBlueprintV1.definition.modules,
      {
        key: 'legacy_ideas',
        type: 'ideas',
        version: 1,
        required: false,
        config: { legacyFormat: true },
      },
      {
        key: 'future_tree',
        type: 'experience_tree',
        version: 3,
        required: false,
        config: { futureFormat: true },
      },
    ],
  })
  const revision = BlueprintCatalogRevisionSchema.parse({
    ...weddingBlueprintV1,
    definition,
    contentHash: blueprintHash(definition),
  })
  const plan = expandBlueprintInstallation(
    { ...request, contentHash: revision.contentHash, customizations },
    revision
  )

  expect(plan.children.map(({ sourceKey, name }) => [sourceKey, name])).toEqual([
    ['ceremony', 'Garden ceremony'],
    ['after_party', 'After party'],
  ])
  expect(plan.ideas.map(({ sourceKey, title }) => [sourceKey, title])).toEqual([
    ['venue', 'Choose our venue'],
    ['after_party_ideas', 'After party options'],
  ])
  expect(plan.omissions).toEqual(
    expect.arrayContaining([
      { sourceKey: 'legacy_ideas', reason: 'unsupported_optional_module' },
      { sourceKey: 'future_tree', reason: 'unsupported_optional_module' },
    ])
  )
})

test('keeps legacy parsed input unchanged and includes customizations in request hashes', async () => {
  const { parseBlueprintInstallInput } =
    await import('@/server/blueprints/planning/plan-blueprint-installation')
  const legacyInput = parseBlueprintInstallInput(request)
  const customizedInput = parseBlueprintInstallInput({ ...request, customizations })
  expect('customizations' in legacyInput).toBe(false)
  expect(blueprintHash(legacyInput)).not.toBe(blueprintHash(customizedInput))
  expect(
    expandBlueprintInstallation(
      {
        ...request,
        selectedChildren: [{ key: 'ceremony', startsAt: '2027-06-15T15:00:00-04:00' }],
        selectedIdeaKeys: ['venue'],
      },
      weddingBlueprintV1
    ).ideas[0]?.title
  ).toBe('Venue')
})

test('checks the published pin and source hash before applying caller customizations', () => {
  const mismatchedRevision = {
    ...weddingBlueprintV1,
    contentHash: '0'.repeat(64),
  }
  expect(() =>
    expandBlueprintInstallation({ ...request, customizations }, mismatchedRevision)
  ).toThrowError(expect.objectContaining({ code: 'content_hash_mismatch' }))
})

test('validates customization version, Unicode limits, reserved keys, music, and payload size', () => {
  const validIdea = {
    key: 'unicode_idea',
    title: '😀'.repeat(120),
    notes: '😀'.repeat(2_000),
    category: 'other',
    target: { kind: 'main' },
    configuration: { version: 1 },
  }
  expect(BlueprintIdeaDefinitionSchema.safeParse(validIdea).success).toBe(true)
  expect(
    BlueprintIdeaDefinitionSchema.safeParse({ ...validIdea, title: `${validIdea.title}😀` }).success
  ).toBe(false)
  expect(
    BlueprintIdeaDefinitionSchema.safeParse({ ...validIdea, notes: `${validIdea.notes}😀` }).success
  ).toBe(false)
  expect(
    BlueprintChildDefinitionSchema.safeParse({
      key: 'main',
      title: 'Reserved',
      purpose: 'part_of_event',
      category: 'other',
    }).success
  ).toBe(false)
  expect(BlueprintIdeaDefinitionSchema.safeParse({ ...validIdea, category: 'music' }).success).toBe(
    false
  )
  expect(
    BlueprintInstallInputSchema.safeParse({
      ...request,
      customizations: { ...customizations, version: 2 },
    }).success
  ).toBe(false)

  const largeIdeas = Array.from({ length: 100 }, (_, index) => ({
    key: `large_idea_${index}`,
    title: 'Large idea',
    notes: '😀'.repeat(1_000),
    category: 'other',
    target: { kind: 'main' },
    configuration: { version: 1 },
  }))
  expect(
    BlueprintInstallInputSchema.safeParse({
      ...request,
      customizations: { version: 1, children: [], ideas: largeIdeas },
    }).success
  ).toBe(false)
})
