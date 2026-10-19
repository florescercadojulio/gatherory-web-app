import { describe, expect, test } from 'vitest'
import {
  developmentBlueprintContents,
  developmentBlueprints,
} from '@/db/seeds/development-blueprints'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import {
  BlueprintCatalogResponseSchema,
  BLUEPRINT_BROWSE_CATEGORIES,
} from '@/contracts/blueprint-discovery.contracts'
import { blueprintStarters, coreBlueprintStarters } from '@/server/blueprints/catalog/starters'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import { buildBlueprintCatalog } from '@/server/blueprints/services/blueprint-discovery'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '@/server/blueprints/planning/plan-blueprint-installation'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'

describe('development blueprint catalog', () => {
  test('adds distinct development entries without changing the production catalog', () => {
    expect(coreBlueprintStarters.map((entry) => entry.catalogKey)).toEqual([
      'wedding',
      'birthday',
      'thanksgiving',
    ])
    expect(developmentBlueprints).toHaveLength(8)
    expect(new Set(developmentBlueprints.map((entry) => entry.catalogKey)).size).toBe(8)
    expect(developmentBlueprints.every((entry) => entry.catalogKey.startsWith('dev_'))).toBe(true)
    const catalog = buildBlueprintCatalog([...blueprintStarters, ...developmentBlueprints])
    expect(BlueprintCatalogResponseSchema.parse(catalog)).toEqual(catalog)
    expect(catalog.entries).toHaveLength(blueprintStarters.length + developmentBlueprints.length)
    expect(new Set(catalog.entries.flatMap((entry) => entry.discovery.categories))).toEqual(
      new Set(BLUEPRINT_BROWSE_CATEGORIES)
    )
  })

  for (const { catalogKey, content } of developmentBlueprintContents) {
    test(`${catalogKey} validates and installs only explicitly selected content`, () => {
      expect(BlueprintDraftContentSchema.parse(content)).toEqual(content)
      expect(content.children).toHaveLength(6)
      expect(content.ideas).toHaveLength(12)
      expect(content.instructions).toHaveLength(7)
      const entry = developmentBlueprints.find((entry) => entry.catalogKey === catalogKey)!
      expect(entry.contentHash).toBe(blueprintHash(entry.definition))
      const mainEvent = {
        name: content.name,
        startsAt: '2027-07-08T16:00:00.000Z',
        timeZone: 'America/Detroit',
      }
      const input = {
        requestId: 'e0000000-0000-4000-8000-000000000001',
        catalogKey,
        revision: entry.revision,
        contentHash: entry.contentHash,
        mainEvent,
        selectedChildren: [],
        selectedIdeaKeys: content.ideas.map((idea) => idea.key),
        capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
      }
      const plan = expandBlueprintInstallation(input, entry)
      expect(plan.children).toEqual([])
      expect(plan.ideas.map((idea) => idea.sourceKey)).toEqual(
        content.ideas.filter((idea) => idea.target.kind === 'main').map((idea) => idea.key)
      )
      expect(plan.instructions).toHaveLength(1)
      const suggestions = suggestBlueprintSchedule(
        {
          catalogKey,
          revision: entry.revision,
          contentHash: entry.contentHash,
          mainEvent: { startsAt: mainEvent.startsAt, timeZone: mainEvent.timeZone },
        },
        entry.definition
      )
      expect(suggestions.suggestions).toHaveLength(6)
      const selectedChildren = suggestions.suggestions.map((suggestion) => ({
        key: suggestion.key,
        startsAt: suggestion.candidates[0]!,
      }))
      const full = expandBlueprintInstallation({ ...input, selectedChildren }, entry)
      expect(full.children).toHaveLength(6)
      expect(full.ideas).toHaveLength(12)
      expect(full.instructions).toHaveLength(7)
    })
  }
})
