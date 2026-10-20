import { expect, test } from 'vitest'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import {
  blueprintDiscovery,
  buildBlueprintCatalog,
} from '@/server/blueprints/services/blueprint-discovery'

test('Wedding is searchable and categorized without changing its pinned installation source', () => {
  const entry = buildBlueprintCatalog([weddingBlueprintV1]).entries[0]!
  expect(entry.discovery.categories).toEqual(['weddings'])
  expect(entry.discovery.tags).toContain('ceremony')
  expect(entry.definition).toBe(weddingBlueprintV1.definition)
  expect(entry.contentHash).toBe(weddingBlueprintV1.contentHash)
  expect(entry.revision).toBe(1)
})

test('listing exposes one newest available revision per key in stable order', () => {
  const newer = { ...weddingBlueprintV1, revision: 2 }
  expect(buildBlueprintCatalog([newer, weddingBlueprintV1, newer]).entries).toHaveLength(1)
  expect(buildBlueprintCatalog([newer, weddingBlueprintV1]).entries[0]?.revision).toBe(2)
  expect(buildBlueprintCatalog([])).toEqual({ entries: [] })
})

test('public catalog keeps same-title blueprints distinct and preserves only their chosen creator name', () => {
  const first = {
    ...weddingBlueprintV1,
    catalogKey: 'host_wedding_a',
    contentHash: 'a'.repeat(64),
    definition: {
      ...structuredClone(weddingBlueprintV1.definition),
      blueprint: {
        ...weddingBlueprintV1.definition.blueprint,
        id: 'host_wedding_a',
        name: 'A Celebration',
      },
    },
    creator: { displayName: 'Rae Host' },
  }
  const secondOlder = {
    ...weddingBlueprintV1,
    catalogKey: 'host_wedding_b',
    contentHash: 'b'.repeat(64),
    definition: {
      ...structuredClone(weddingBlueprintV1.definition),
      blueprint: {
        ...weddingBlueprintV1.definition.blueprint,
        id: 'host_wedding_b',
        name: 'A Celebration',
      },
    },
    creator: { displayName: 'Sam Host' },
  }
  const secondLatest = {
    ...secondOlder,
    revision: 2,
    contentHash: 'c'.repeat(64),
    definition: {
      ...structuredClone(secondOlder.definition),
      blueprint: { ...secondOlder.definition.blueprint, revision: 2 },
    },
  }

  const result = buildBlueprintCatalog([first, secondOlder, secondLatest])

  expect(result.entries).toHaveLength(2)
  expect(result.entries.map(({ catalogKey }) => catalogKey)).toEqual([
    'host_wedding_a',
    'host_wedding_b',
  ])
  expect(result.entries).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        catalogKey: 'host_wedding_a',
        revision: 1,
        creator: { displayName: 'Rae Host' },
      }),
      expect.objectContaining({
        catalogKey: 'host_wedding_b',
        revision: 2,
        creator: { displayName: 'Sam Host' },
      }),
    ])
  )
  expect(JSON.stringify(result)).not.toContain('email')
  expect(JSON.stringify(result)).not.toContain('userId')
})

test('future starters still have a browse category', () => {
  expect(
    blueprintDiscovery({
      ...weddingBlueprintV1,
      catalogKey: 'future',
      definition: {
        ...weddingBlueprintV1.definition,
        experienceDefaults: { type: 'custom' },
      },
    }).categories
  ).toEqual(['events'])
})
