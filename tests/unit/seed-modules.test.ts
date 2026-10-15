import { describe, expect, test } from 'vitest'

import { developmentUsers } from '../../scripts/seed/development-users'
import { cottageBlueprintDefinition, cottageDraftContent } from '@/db/seeds/cottage-template'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import {
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
} from '@/contracts/blueprint-install.contracts'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'

describe('reusable seed modules', () => {
  test('keeps the existing local seed account identities stable', () => {
    expect(developmentUsers.map(({ email }) => email)).toEqual([
      'planner@gatherory.test',
      'jordan@gatherory.test',
      'coordinator@gatherory.test',
      'guest@gatherory.test',
      'appreview@gatherory.test',
      'reception-planner@gatherory.test',
      'pending-collaborator@gatherory.test',
      'latest-collaborator@gatherory.test',
    ])
  })

  test('provides valid private draft content and a catalog definition outside curated starters', () => {
    expect(BlueprintDraftContentSchema.parse(cottageDraftContent)).toEqual(cottageDraftContent)
    expect(cottageBlueprintDefinition.blueprint).toEqual({
      id: 'cottage',
      revision: 1,
      name: cottageDraftContent.name,
    })
    expect(cottageBlueprintDefinition.experienceDefaults.type).toBe('custom')
    expect(blueprintStarters.some(({ catalogKey }) => catalogKey === 'cottage')).toBe(false)
  })

  test('uses the supported modules with one main and direct child targets', () => {
    expect(cottageBlueprintDefinition.modules.map(({ type, version }) => [type, version])).toEqual([
      ['experience_tree', 2],
      ['ideas', 2],
      ['instructions', 1],
    ])
    const tree = BlueprintExperienceTreeModuleSchema.parse(
      cottageBlueprintDefinition.modules.find(({ type }) => type === 'experience_tree')
    )
    const ideas = BlueprintIdeasModuleSchema.parse(
      cottageBlueprintDefinition.modules.find(({ type }) => type === 'ideas')
    )
    const instructions = BlueprintInstructionsModuleSchema.parse(
      cottageBlueprintDefinition.modules.find(({ type }) => type === 'instructions')
    )
    expect(tree.config.mainEventType).toBe('custom')
    expect(tree.config.children.map(({ key }) => key)).toEqual([
      'arrival',
      'shared_day',
      'departure',
    ])

    const childKeys = new Set(tree.config.children.map(({ key }) => key))
    expect(ideas.config.ideas.some((idea) => idea.target.kind === 'main')).toBe(true)
    expect(
      ideas.config.ideas
        .filter((idea) => idea.target.kind === 'child')
        .every((idea) => idea.target.kind === 'child' && childKeys.has(idea.target.key))
    ).toBe(true)

    expect(
      instructions.config.sections.some((section) => section.audience === 'planning_only')
    ).toBe(true)
    expect(
      instructions.config.sections
        .filter((section) => section.target.kind === 'child')
        .every((section) => section.target.kind === 'child' && childKeys.has(section.target.key))
    ).toBe(true)
  })
})
