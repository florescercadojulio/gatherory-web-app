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
