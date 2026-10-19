import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import {
  BLUEPRINT_BROWSE_CATEGORIES,
  BlueprintCatalogResponseSchema,
} from '@/contracts/blueprint-discovery.contracts'
import { BlueprintIdeasModuleSchema } from '@/contracts/blueprint-install.contracts'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { exploreBlueprintStarters } from '@/server/blueprints/catalog/explore.v1'
import { exploreCollections } from '@/server/blueprints/catalog/explore-collections'
import { buildBlueprintCatalog } from '@/server/blueprints/services/blueprint-discovery'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '@/server/blueprints/planning/plan-blueprint-installation'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'

test('all 18 browse categories have real content in the deployable catalog and match the shared native fixture', () => {
  const catalog = buildBlueprintCatalog(blueprintStarters)
  expect(BlueprintCatalogResponseSchema.parse(catalog)).toEqual(catalog)
  expect(catalog.entries).toHaveLength(17)
  expect(BLUEPRINT_BROWSE_CATEGORIES).toHaveLength(18)
  expect(new Set(catalog.entries.flatMap((entry) => entry.discovery.categories))).toEqual(
    new Set(BLUEPRINT_BROWSE_CATEGORIES)
  )
  expect(new Set(catalog.entries.map((entry) => entry.catalogKey)).size).toBe(17)
  expect(catalog).toEqual(
    JSON.parse(readFileSync('contracts/examples/explore-catalog.v1.json', 'utf8'))
  )
  for (const collection of exploreCollections) {
    expect(collection.ideas).toHaveLength(6)
    expect(collection.activities).toHaveLength(4)
    expect(collection.discovery.tags.length).toBeGreaterThan(2)
    expect(collection.discovery.summary.length).toBeGreaterThan(40)
  }
})

for (const entry of exploreBlueprintStarters) {
  test(`${entry.catalogKey} installs selected content with confirmed dates and omits child-owned content when excluded`, () => {
    expect(entry.contentHash).toBe(blueprintHash(entry.definition))
    expect(entry.definition.roles).toEqual([])
    const mainEvent = {
      name: 'My independent plan',
      startsAt: '2027-07-08T16:00:00.000Z',
      timeZone: 'America/Detroit',
    }
    const schedule = suggestBlueprintSchedule(
      {
        catalogKey: entry.catalogKey,
        revision: entry.revision,
        contentHash: entry.contentHash,
        mainEvent: { startsAt: mainEvent.startsAt, timeZone: mainEvent.timeZone },
      },
      entry.definition
    )
    const input = {
      requestId: 'a0000000-0000-4000-8000-000000000001',
      catalogKey: entry.catalogKey,
      revision: entry.revision,
      contentHash: entry.contentHash,
      mainEvent,
      selectedChildren: schedule.suggestions.map((suggestion) => ({
        key: suggestion.key,
        startsAt: suggestion.candidates[0]!,
      })),
      selectedIdeaKeys: BlueprintIdeasModuleSchema.parse(
        entry.definition.modules.find((module) => module.type === 'ideas')
      ).config.ideas.map((idea) => idea.key),
      capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
    }
    const plan = expandBlueprintInstallation(input, entry)
    expect(plan.children).toHaveLength(4)
    expect(plan.ideas).toHaveLength(6)
    expect(plan.instructions).toHaveLength(5)
    expect(plan.children.map((child) => child.startsAt)).toEqual(
      input.selectedChildren.map((child) => child.startsAt)
    )
    const rootOnly = expandBlueprintInstallation({ ...input, selectedChildren: [] }, entry)
    expect(rootOnly.children).toEqual([])
    expect(rootOnly.ideas.every((idea) => idea.targetSourceKey === rootOnly.main.sourceKey)).toBe(
      true
    )
    expect(rootOnly.instructions).toHaveLength(1)
  })
}
