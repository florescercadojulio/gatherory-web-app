import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import type { BlueprintExpandedPlan } from '@/contracts/blueprint-install.contracts'
import {
  buildBlueprintNativeProjection,
  type BlueprintManifest,
} from '@/server/blueprints/services/blueprint-native-projection'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { buildBlueprintCatalog } from '@/server/blueprints/services/blueprint-discovery'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '@/server/blueprints/planning/plan-blueprint-installation'

const actor = {
  id: 'user_123',
  name: 'Riley Example',
  email: 'riley@example.test',
}

const manifest: BlueprintManifest = {
  events: {
    main: '10000000-0000-4000-8000-000000000001',
    venue: '10000000-0000-4000-8000-000000000002',
    ceremony: '10000000-0000-4000-8000-000000000003',
  },
  ideas: { flowers: '20000000-0000-4000-8000-000000000001' },
  guides: { ceremony_guide: '30000000-0000-4000-8000-000000000001' },
  personID: '70000000-0000-4000-8000-000000000001',
  participations: {
    main: '80000000-0000-4000-8000-000000000001',
    venue: '80000000-0000-4000-8000-000000000002',
    ceremony: '80000000-0000-4000-8000-000000000003',
  },
}

const plan = {
  plannerVersion: 1,
  experienceType: 'wedding',
  categoryOrder: ['venue', 'food', 'photography', 'flowers'],
  main: {
    sourceKey: 'main',
    name: 'Riley and Jordan',
    eventType: 'wedding',
    startsAt: '2027-06-12T16:00:00.000Z',
    timeZone: 'America/Detroit',
    parentSourceKey: null,
    purpose: null,
    category: null,
    planningStatus: null,
  },
  children: [
    {
      sourceKey: 'venue',
      name: 'Venue visit',
      eventType: 'wedding',
      startsAt: '2027-02-10T15:00:00.000Z',
      timeZone: 'America/Detroit',
      parentSourceKey: 'main',
      purpose: 'planning_scouting',
      category: 'venue',
      planningStatus: 'approved',
    },
    {
      sourceKey: 'ceremony',
      name: 'Ceremony',
      eventType: 'wedding',
      startsAt: '2027-06-12T16:00:00.000Z',
      timeZone: 'America/Detroit',
      parentSourceKey: 'main',
      purpose: 'part_of_event',
      category: 'ceremony',
      planningStatus: 'approved',
    },
  ],
  ideas: [
    {
      sourceKey: 'flowers',
      targetSourceKey: 'ceremony',
      title: 'Ceremony flowers',
      category: 'flowers',
      notes: null,
      configuration: { version: 1 },
      status: 'new',
    },
  ],
  instructions: [
    {
      sourceKey: 'ceremony_guide',
      targetSourceKey: 'ceremony',
      title: 'Ceremony notes',
      body: 'Keep the aisle clear.',
      audience: 'event_participants',
    },
  ],
  omissions: [{ sourceKey: 'unselected_child_item', reason: 'child_not_selected' }],
} satisfies BlueprintExpandedPlan

const actualWeddingPlan = expandBlueprintInstallation(
  {
    requestId: 'af08d534-8c90-4c89-bacc-0f5820bb4d0c',
    catalogKey: weddingBlueprintV1.catalogKey,
    revision: weddingBlueprintV1.revision,
    contentHash: weddingBlueprintV1.contentHash,
    mainEvent: {
      name: 'Riley and Jordan',
      startsAt: '2027-06-15T19:00:00Z',
      timeZone: 'America/Detroit',
    },
    selectedChildren: [
      { key: 'venue_visit', startsAt: '2027-06-14T16:00:00-04:00' },
      { key: 'ceremony', startsAt: '2027-06-15T19:00:00Z' },
    ],
    selectedIdeaKeys: ['venue', 'food', 'photography'],
    capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
  },
  weddingBlueprintV1
)

const actualWeddingManifest: BlueprintManifest = {
  events: {
    main: '10000000-0000-4000-8000-000000000001',
    venue_visit: '10000000-0000-4000-8000-000000000002',
    ceremony: '10000000-0000-4000-8000-000000000003',
  },
  ideas: {
    venue: '20000000-0000-4000-8000-000000000001',
    food: '20000000-0000-4000-8000-000000000002',
    photography: '20000000-0000-4000-8000-000000000003',
  },
  guides: {
    planning_priorities: '30000000-0000-4000-8000-000000000001',
    ceremony_guidance: '30000000-0000-4000-8000-000000000002',
  },
  personID: '70000000-0000-4000-8000-000000000001',
  participations: {
    main: '80000000-0000-4000-8000-000000000001',
    venue_visit: '80000000-0000-4000-8000-000000000002',
    ceremony: '80000000-0000-4000-8000-000000000003',
  },
}

describe('buildBlueprintNativeProjection', () => {
  test('matches the catalog and preview wire fixtures decoded by Swift', () => {
    expect(buildBlueprintCatalog([weddingBlueprintV1])).toEqual(
      JSON.parse(readFileSync('contracts/examples/wedding-catalog.v1.json', 'utf8'))
    )
    expect({ plan: actualWeddingPlan, contentHash: weddingBlueprintV1.contentHash }).toEqual(
      JSON.parse(readFileSync('contracts/examples/wedding-preview.v1.json', 'utf8'))
    )
  })

  test('matches the Foundation Codable fixture shared with Swift tests', () => {
    const { archive } = buildBlueprintNativeProjection({
      plan: actualWeddingPlan,
      manifest: actualWeddingManifest,
      actor,
      createdAt: new Date('2026-10-15T12:00:00.000Z'),
    })
    const fixture = JSON.parse(
      readFileSync('contracts/examples/wedding-install-native.v1.json', 'utf8')
    )

    expect(archive).toEqual(fixture)
  })

  test('keeps the expanded Wedding plan aligned with its server ID manifest', () => {
    const { archive, entities } = buildBlueprintNativeProjection({
      plan: actualWeddingPlan,
      manifest: actualWeddingManifest,
      actor,
      createdAt: new Date('2026-10-15T12:00:00.000Z'),
    })

    expect(archive.ideas.map((idea) => idea.id)).toEqual([
      actualWeddingManifest.ideas.venue,
      actualWeddingManifest.ideas.food,
      actualWeddingManifest.ideas.photography,
    ])
    expect(archive.timeline.map((event) => event.id)).toEqual([
      actualWeddingManifest.events.venue_visit,
      actualWeddingManifest.events.ceremony,
    ])
    expect(archive.members.map((member) => member.id)).toEqual([actualWeddingManifest.personID])
    expect(archive.eventParticipations.map((participation) => participation.id)).toEqual([
      actualWeddingManifest.participations.main,
      actualWeddingManifest.participations.venue_visit,
      actualWeddingManifest.participations.ceremony,
    ])
    expect(archive.eventParticipations.map((participation) => participation.eventID)).toEqual([
      actualWeddingManifest.events.main,
      actualWeddingManifest.events.venue_visit,
      actualWeddingManifest.events.ceremony,
    ])
    expect(archive.guides.map((guide) => guide.id)).toEqual([
      actualWeddingManifest.guides.planning_priorities,
      actualWeddingManifest.guides.ceremony_guidance,
    ])
    expect(entities.map(({ entityType, entityId }) => [entityType, entityId])).toContainEqual([
      'idea',
      actualWeddingManifest.ideas.photography,
    ])
    expect(archive.guides.find((guide) => guide.key === 'ceremony_guidance')?.eventID).toBe(
      actualWeddingManifest.events.ceremony
    )
  })

  test('projects child-targeted ideas and guides using canonical IDs', () => {
    const { archive, entities } = buildBlueprintNativeProjection({
      plan,
      manifest,
      actor,
      createdAt: new Date('2026-10-15T12:00:00.000Z'),
    })

    expect(archive.mainEventID).toBe(manifest.events.main)
    expect(archive.experienceConfiguration).toEqual({
      experienceType: 'wedding',
      categoryOrder: plan.categoryOrder,
    })
    expect(archive.guides).toEqual([
      {
        id: manifest.guides.ceremony_guide,
        eventID: manifest.events.ceremony,
        key: 'ceremony_guide',
        title: 'Ceremony notes',
        body: 'Keep the aisle clear.',
        sortOrder: 0,
        visibility: 'event_participants',
      },
    ])

    const ideas = archive.ideas as Array<Record<string, unknown>>
    expect(ideas).toHaveLength(1)
    expect(ideas[0]).toMatchObject({
      id: manifest.ideas.flowers,
      eventID: manifest.events.ceremony,
      category: 'flowers',
      status: 'new',
      configuration: { flowers: { _0: { focus: 'bouquet', palette: '' } } },
      invitationVisibility: 'planningOnly',
    })

    expect(entities.map(({ entityType, entityId }) => [entityType, entityId])).toContainEqual([
      'idea',
      manifest.ideas.flowers,
    ])
    expect(entities.some(({ entityType }) => entityType === 'guide')).toBe(false)
    expect(entities.some(({ entityType }) => entityType === 'workspace')).toBe(true)
    expect(
      entities.find(
        ({ entityType, entityId }) => entityType === 'idea' && entityId === manifest.ideas.flowers
      )?.payload
    ).toMatchObject({ eventID: manifest.events.ceremony, id: manifest.ideas.flowers })
  })

  test('keeps new-workspace lifecycle and participants explicit without invented activity', () => {
    const { archive } = buildBlueprintNativeProjection({
      plan,
      manifest,
      actor,
      createdAt: new Date('2026-10-15T12:00:00.000Z'),
    })

    expect(archive.mainEventStatus).toBe('draft')
    expect(archive.mainEventResponse).toBeNull()
    expect(archive.members).toEqual([
      expect.objectContaining({
        id: manifest.personID,
        userID: actor.id,
        participantRole: 'host',
        attendance: 'invited',
        invitationStatus: 'active',
        planningPermission: 'manage',
      }),
    ])
    expect(archive.eventParticipations).toHaveLength(3)
    expect(
      new Set((archive.eventParticipations as Array<{ id: string }>).map(({ id }) => id)).size
    ).toBe(3)
    expect(
      (archive.eventParticipations as Array<{ attendance: string }>).every(
        ({ attendance }) => attendance === 'invited'
      )
    ).toBe(true)
    expect(archive.ideaResponses).toEqual([])
    expect(archive.notes).toEqual([])
    expect(archive.members).toHaveLength(1)
    expect(archive.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: manifest.events.ceremony,
          category: 'ceremony',
          purpose: 'eventExperience',
          status: 'approved',
          parentEventID: manifest.events.main,
        }),
      ])
    )
    expect(archive.ideas).toHaveLength(1)
    expect(archive.guides).toHaveLength(1)
  })

  test('uses Foundation deferred-to-Date seconds and does not require omitted source keys', () => {
    const { archive } = buildBlueprintNativeProjection({
      plan,
      manifest,
      actor,
      createdAt: new Date('2001-01-01T00:00:00.000Z'),
    })

    expect(archive.mainEventStartsAt).toBe(834_508_800)
    expect(() =>
      buildBlueprintNativeProjection({
        plan,
        manifest: {
          ...manifest,
          ideas: {},
        },
        actor,
        createdAt: new Date(),
      })
    ).toThrow('missing an ID for "flowers"')
  })
})
