import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'
import { movieNightBlueprintV1 } from '@/server/blueprints/catalog/movie-night.v1'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import {
  expandBlueprintInstallation,
  BLUEPRINT_SERVER_CAPABILITIES,
} from '@/server/blueprints/planning/plan-blueprint-installation'
import { blueprintDiscovery } from '@/server/blueprints/services/blueprint-discovery'
import { buildBlueprintNativeProjection } from '@/server/blueprints/services/blueprint-native-projection'

describe('curated Movie Night blueprint', () => {
  test('is schema-valid and appears in the actual curated discovery catalog', () => {
    expect(BlueprintCatalogDefinitionSchema.parse(movieNightBlueprintV1.definition)).toEqual(
      movieNightBlueprintV1.definition
    )
    expect(blueprintStarters).toContainEqual(movieNightBlueprintV1)
    expect(blueprintDiscovery(movieNightBlueprintV1)).toMatchObject({
      categories: ['events'],
      tags: expect.arrayContaining(['movie night']),
    })
    expect(
      JSON.parse(readFileSync('contracts/examples/movie-night-blueprint.v1.json', 'utf8'))
    ).toEqual(movieNightBlueprintV1)
  })

  test('keeps definition text and proposed child offsets within portable contract limits', () => {
    const invalidText = structuredClone(movieNightBlueprintV1.definition) as unknown as {
      modules: Array<{ type: string; config: Record<string, any> }>
    }
    const ideas = invalidText.modules.find((module) => module.type === 'ideas')
    if (ideas?.type !== 'ideas') throw new Error('Movie Night ideas module missing')
    ideas.config.ideas[0]!.title = 'x'.repeat(121)
    expect(BlueprintCatalogDefinitionSchema.safeParse(invalidText).success).toBe(false)

    const invalidDateOffset = structuredClone(movieNightBlueprintV1.definition) as unknown as {
      modules: Array<{ type: string; config: Record<string, any> }>
    }
    const tree = invalidDateOffset.modules.find((module) => module.type === 'experience_tree')
    if (tree?.type !== 'experience_tree') throw new Error('Movie Night event tree missing')
    tree.config.children[0]!.scheduleProposal = {
      anchor: 'main_start',
      dayOffset: 3_651,
      localTime: '18:00',
    }
    expect(BlueprintCatalogDefinitionSchema.safeParse(invalidDateOffset).success).toBe(false)
  })

  test('expands as a private host copy with one selected child and pending ideas', () => {
    const plan = expandBlueprintInstallation(
      {
        requestId: 'af08d534-8c90-4c89-bacc-0f5820bb4d0c',
        catalogKey: movieNightBlueprintV1.catalogKey,
        revision: 1,
        contentHash: movieNightBlueprintV1.contentHash,
        mainEvent: {
          name: 'Movie Night',
          startsAt: '2027-05-22T18:00:00-04:00',
          timeZone: 'America/Detroit',
        },
        selectedChildren: [{ key: 'snacks_catch_up', startsAt: '2027-05-22T18:00:00-04:00' }],
        selectedIdeaKeys: ['watch_movie', 'popcorn_bar', 'pizza', 'blanket_corner'],
        capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
      },
      movieNightBlueprintV1
    )

    expect(plan.children).toHaveLength(1)
    expect(plan.children[0]).toMatchObject({
      sourceKey: 'snacks_catch_up',
      name: 'Snacks & catch-up',
    })
    expect(plan.ideas).toHaveLength(4)
    expect(
      plan.ideas.map(({ title, targetSourceKey, status }) => [title, targetSourceKey, status])
    ).toEqual([
      ['Watch the movie', 'main', 'new'],
      ['Popcorn bar', 'main', 'new'],
      ['Pizza', 'main', 'new'],
      ['Blanket corner', 'main', 'new'],
    ])
    expect(plan.ideas.every(({ status }) => status === 'new')).toBe(true)

    const project = (prefix: string) =>
      buildBlueprintNativeProjection({
        plan,
        manifest: {
          events: { main: `${prefix}-main`, snacks_catch_up: `${prefix}-snacks` },
          ideas: {
            watch_movie: `${prefix}-movie`,
            popcorn_bar: `${prefix}-popcorn`,
            pizza: `${prefix}-pizza`,
            blanket_corner: `${prefix}-blankets`,
          },
          guides: {},
          personID: `${prefix}-person`,
          participations: {
            main: `${prefix}-main-host`,
            snacks_catch_up: `${prefix}-snacks-host`,
          },
        },
        actor: { id: `${prefix}-actor`, name: 'Movie Night Host', email: 'host@example.test' },
        createdAt: new Date('2026-11-02T12:00:00.000Z'),
      })
    const first = project('host-copy-one')
    const second = project('host-copy-two')

    expect(first.archive.timeline).toHaveLength(1)
    expect(first.archive.ideas).toHaveLength(4)
    expect(first.archive.ideas.find((idea) => idea.title === 'Watch the movie')).toMatchObject({
      id: 'host-copy-one-movie',
      eventID: 'host-copy-one-main',
      status: 'new',
      configuration: {
        event: {
          _0: {
            category: 'other',
            purpose: 'planning',
            proposedDate: null,
            proposedEndDate: null,
            isAllDay: false,
            timeZoneIdentifier: 'America/Detroit',
            location: null,
          },
        },
      },
    })
    expect(second.archive.ideas.find((idea) => idea.title === 'Watch the movie')?.id).toBe(
      'host-copy-two-movie'
    )
    expect(first.archive.ideas.map(({ id }) => id)).not.toEqual(
      second.archive.ideas.map(({ id }) => id)
    )
  })
})
