import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'
import { expandBlueprintInstallation } from '@/server/blueprints/planning/plan-blueprint-installation'
import { BlueprintCatalogResponseSchema } from '@/contracts/blueprint-discovery.contracts'
import {
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
} from '@/contracts/blueprint-install.contracts'
import { buildCuratedStarterFixtures } from '../helpers/blueprint-starter-fixtures'

test('all three starters are categorized, searchable, and independently pinned', () => {
  const { catalog } = buildCuratedStarterFixtures()
  expect(BlueprintCatalogResponseSchema.parse(catalog)).toEqual(catalog)
  expect(catalog.entries.map((entry) => [entry.catalogKey, entry.discovery.categories])).toEqual([
    ['birthday', ['birthdays']],
    ['thanksgiving', ['holidays']],
    ['wedding', ['weddings']],
  ])
  expect(
    catalog.entries.find((entry) => entry.catalogKey === 'thanksgiving')?.discovery.tags
  ).toContain('friendsgiving')
  for (const starter of blueprintStarters)
    expect(starter.contentHash).toBe(blueprintHash(starter.definition))
  expect(blueprintStarters[0].contentHash).toBe(
    '24518a2d4795d62a7d0ed5d349cd0bb7ed7a2883a7dec7bf9c522a8e5119878a'
  )
})

test('curated catalog, suggestions, preview, and native archives match the shared Swift fixture', () => {
  expect(buildCuratedStarterFixtures()).toEqual(
    JSON.parse(readFileSync('contracts/examples/curated-starters.v1.json', 'utf8'))
  )
})

test('Thanksgiving uses an arbitrary host-chosen date rather than a national holiday calendar', () => {
  const starter = blueprintStarters.find((entry) => entry.catalogKey === 'thanksgiving')!
  const result = suggestBlueprintSchedule(
    {
      catalogKey: starter.catalogKey,
      revision: starter.revision,
      contentHash: starter.contentHash,
      mainEvent: { startsAt: '2027-02-03T08:00:00Z', timeZone: 'Asia/Tokyo' },
    },
    starter.definition
  )
  expect(result.mainEvent.startsAt).toBe('2027-02-03T08:00:00Z')
  expect(result.suggestions.find((item) => item.key === 'shared_meal')?.localDateTime).toBe(
    '2027-02-03T16:00:00'
  )
  expect(
    result.suggestions.find((item) => item.key === 'gathering_preparation')?.localDateTime
  ).toBe('2027-02-02T16:00:00')
})

for (const sample of buildCuratedStarterFixtures().samples) {
  test(`${sample.catalogKey} preserves confirmed dates without inventing participation or decisions`, () => {
    const { plan } = sample.preview
    expect(plan.main.startsAt).toBe(sample.input.mainEvent.startsAt)
    expect(plan.children.map((child) => child.startsAt)).toEqual(
      sample.input.selectedChildren.map((child) => child.startsAt)
    )
    expect(plan.children[0]?.startsAt).not.toBe(sample.schedule.suggestions[0]?.candidates[0])
    expect(sample.archive.experienceConfiguration.experienceType).toBe(
      sample.catalogKey === 'birthday' ? 'birthday' : 'holiday'
    )
    expect(sample.archive.members).toHaveLength(1)
    expect(
      sample.archive.eventParticipations.every(
        (p) => p.role === 'host' && p.attendance === 'invited'
      )
    ).toBe(true)
    expect(sample.archive.ideaResponses).toEqual([])
    expect(sample.archive.eventExpenses).toEqual([])
    expect(sample.archive.ideas.every((idea) => idea.status === 'new')).toBe(true)
    expect(
      sample.archive.timeline.every((event) => event.parentEventID === sample.archive.mainEventID)
    ).toBe(true)
  })

  test(`${sample.catalogKey} omits child-owned content when children are not selected`, () => {
    const starter = blueprintStarters.find((entry) => entry.catalogKey === sample.catalogKey)!
    const plan = expandBlueprintInstallation({ ...sample.input, selectedChildren: [] }, starter)
    const ideas = BlueprintIdeasModuleSchema.parse(
      starter.definition.modules.find((module) => module.type === 'ideas')
    )
    const guides = BlueprintInstructionsModuleSchema.parse(
      starter.definition.modules.find((module) => module.type === 'instructions')
    )
    const excluded = [...ideas.config.ideas, ...guides.config.sections].filter(
      (item) => item.target.kind === 'child'
    )
    expect(excluded.length).toBeGreaterThan(0)
    expect(plan.children).toEqual([])
    expect(plan.ideas.every((idea) => idea.targetSourceKey === 'main')).toBe(true)
    expect(plan.instructions.every((guide) => guide.targetSourceKey === 'main')).toBe(true)
    for (const item of excluded)
      expect(plan.omissions).toContainEqual({ sourceKey: item.key, reason: 'child_not_selected' })
  })
}
