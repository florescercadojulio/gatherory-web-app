import { expect, test } from 'vitest'

import {
  BlueprintCapturePreviewInputSchema,
  BlueprintCaptureSaveInputSchema,
  BlueprintCaptureSelectionSchema,
  BlueprintCaptureSourceInputSchema,
  BlueprintEventCaptureSourceSchema,
  type BlueprintEventCaptureSource,
} from '@/contracts/blueprint-capture.contracts'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import {
  captureEventBlueprint,
  mergeCapturedBlueprint,
} from '@/server/blueprints/planning/capture-event-blueprint.server'

const ids = {
  event: '10000000-0000-4000-8000-000000000001',
  child: '20000000-0000-4000-8000-000000000002',
  idea: '30000000-0000-4000-8000-000000000003',
  guide: '40000000-0000-4000-8000-000000000004',
  extraIdea: '50000000-0000-4000-8000-000000000005',
}

const source = (
  overrides: Partial<BlueprintEventCaptureSource> = {}
): BlueprintEventCaptureSource => ({
  event: {
    id: ids.event,
    title: 'Autumn wedding',
    startsAt: '2027-03-13T17:00:00Z',
    timeZone: 'America/New_York',
    experienceType: 'wedding',
  },
  children: [
    {
      id: ids.child,
      title: 'Ceremony',
      purpose: 'part_of_event',
      category: 'ceremony',
      startsAt: '2027-03-14T07:29:40Z',
    },
  ],
  ideas: [
    {
      id: ids.idea,
      eventId: ids.child,
      title: 'Garden arch',
      category: 'decor',
      notes: 'Use seasonal flowers',
    },
    {
      id: ids.extraIdea,
      eventId: ids.event,
      title: 'Welcome sign',
      category: 'other',
      notes: null,
    },
  ],
  instructions: [
    {
      id: ids.guide,
      eventId: ids.child,
      title: 'Arrival guidance',
      body: 'Please arrive 15 minutes early.',
      audience: 'event_participants',
    },
  ],
  ...overrides,
})

const selection = {
  childIds: [ids.child],
  ideaIds: [ids.idea],
  instructionIds: [ids.guide],
}

function captured(
  input: BlueprintEventCaptureSource = source(),
  selected: {
    childIds: string[]
    ideaIds: string[]
    instructionIds: string[]
    includeIdeaNotes?: boolean
  } = selection
) {
  return captureEventBlueprint(input, selected)
}

test('capture input contracts are strict, bounded, unique, and default notes to off', () => {
  expect(
    BlueprintCaptureSelectionSchema.parse({
      childIds: [],
      ideaIds: [],
      instructionIds: [],
    })
  ).toEqual({ childIds: [], ideaIds: [], instructionIds: [], includeIdeaNotes: false })
  expect(
    BlueprintCaptureSelectionSchema.safeParse({
      childIds: [ids.child, ids.child],
      ideaIds: [],
      instructionIds: [],
    }).success
  ).toBe(false)
  expect(
    BlueprintEventCaptureSourceSchema.safeParse({ ...source(), unexpected: true }).success
  ).toBe(false)
  expect(BlueprintCaptureSourceInputSchema.parse({ eventId: ids.event })).toEqual({
    eventId: ids.event,
  })

  const preview = {
    eventId: ids.event,
    selection: { childIds: [], ideaIds: [], instructionIds: [] },
    expectedSourceHash: 'a'.repeat(64),
  }
  expect(BlueprintCapturePreviewInputSchema.parse(preview).selection.includeIdeaNotes).toBe(false)
  expect(
    BlueprintCaptureSaveInputSchema.parse({
      ...preview,
      requestId: ids.guide,
      organizationId: 'org_123',
    }).expectedVersion
  ).toBeUndefined()
  expect(
    BlueprintCaptureSaveInputSchema.safeParse({
      ...preview,
      templateId: ids.event,
      requestId: ids.guide,
      organizationId: 'org_123',
    }).success
  ).toBe(false)
  expect(
    BlueprintCaptureSaveInputSchema.safeParse({
      ...preview,
      expectedVersion: 1,
      requestId: ids.guide,
      organizationId: 'org_123',
    }).success
  ).toBe(false)
  expect(
    BlueprintCaptureSaveInputSchema.parse({
      ...preview,
      templateId: ids.event,
      expectedVersion: 1,
      requestId: ids.guide,
      organizationId: 'org_123',
    }).expectedVersion
  ).toBe(1)
})

test('date proposals use root-zone civil dates across DST and truncate to a minute', () => {
  const result = captured()

  expect(result.children[0]?.scheduleProposal).toEqual({
    anchor: 'main_start',
    dayOffset: 1,
    localTime: '03:29',
  })
})

test('minute truncation does not roll a late civil time into the next date', () => {
  const result = captured(
    source({
      children: [{ ...source().children[0]!, startsAt: '2027-03-14T04:59:45Z' }],
    })
  )

  expect(result.children[0]?.scheduleProposal).toEqual({
    anchor: 'main_start',
    dayOffset: 0,
    localTime: '23:59',
  })
})

test('capture includes only selected records and opts into idea notes explicitly', () => {
  const withoutNotes = captured()
  expect(withoutNotes.children).toHaveLength(1)
  expect(withoutNotes.ideas).toEqual([
    expect.objectContaining({ key: 'idea_30000000000040008000000000000003' }),
  ])
  expect(withoutNotes.ideas[0]).not.toHaveProperty('notes')
  expect(withoutNotes.instructions).toHaveLength(1)

  const withNotes = captured(source(), { ...selection, includeIdeaNotes: true })
  expect(withNotes.ideas[0]?.notes).toBe('Use seasonal flowers')
  expect(withNotes.description).toBe('')
  expect(withNotes.experienceType).toBe('wedding')

  const withMainTarget = captured(source(), {
    ...selection,
    ideaIds: [ids.idea, ids.extraIdea],
  })
  expect(withMainTarget.ideas[1]?.target).toEqual({ kind: 'main' })
})

test('empty selections create an empty portable draft and selections must exist', () => {
  const empty = captured(source(), { childIds: [], ideaIds: [], instructionIds: [] })
  expect(empty.children).toEqual([])
  expect(empty.ideas).toEqual([])
  expect(empty.instructions).toEqual([])

  expect(() =>
    captured(source(), {
      ...selection,
      childIds: [],
    })
  ).toThrow(/unselected child/)
  expect(() =>
    captured(source(), {
      ...selection,
      childIds: ['60000000-0000-4000-8000-000000000006'],
    })
  ).toThrow(/does not exist/)
})

test('generated content uses opaque keys and resets runtime state through a content whitelist', () => {
  const content = captured()
  const serialized = JSON.stringify(content)
  for (const id of Object.values(ids)) expect(serialized).not.toContain(id)
  expect(content.children[0]).not.toHaveProperty('participants')
  expect(content.ideas[0]).not.toHaveProperty('votes')
  expect(content).not.toHaveProperty('budget')
  expect(content).not.toHaveProperty('media')
  expect(content).not.toHaveProperty('status')
  expect(BlueprintDraftContentSchema.parse(content)).toEqual(content)
})

test('an unset root date omits child date proposals', () => {
  const result = captured(
    source({
      event: { ...source().event, startsAt: null },
    })
  )
  expect(result.children[0]).not.toHaveProperty('scheduleProposal')
})

test('merge updates unchanged captured fields while retaining manual root and item edits', () => {
  const previous = captured()
  const next = captured(
    source({
      event: { ...source().event, title: 'Updated wedding' },
      children: [{ ...source().children[0]!, title: 'Updated ceremony' }],
      ideas: [{ ...source().ideas[0]!, title: 'Updated garden arch' }],
    })
  )
  const current = structuredClone(previous)
  current.description = 'My description'
  current.children[0]!.title = 'My ceremony edit'

  const merged = mergeCapturedBlueprint(previous, next, current)
  expect(merged.content.name).toBe('Updated wedding')
  expect(merged.content.description).toBe('My description')
  expect(merged.content.children[0]?.title).toBe('My ceremony edit')
  expect(merged.content.ideas[0]?.title).toBe('Updated garden arch')
  expect(merged.conflicts).toContain(current.children[0]!.key)
})

test('manual deletions are not resurrected and source conflicts are returned by key', () => {
  const previous = captured()
  const next = captured(
    source({
      ideas: [{ ...source().ideas[0]!, title: 'Changed at source' }],
    })
  )
  const current = structuredClone(previous)
  current.ideas = []

  const merged = mergeCapturedBlueprint(previous, next, current)
  expect(merged.content.ideas).toEqual([])
  expect(merged.conflicts).toContain(previous.ideas[0]!.key)
})

test('a manually deleted child is not restored for a newly captured dependent idea', () => {
  const previous = captured()
  const next = captured(
    source({
      ideas: [{ ...source().ideas[1]!, eventId: ids.child }],
    }),
    { childIds: [ids.child], ideaIds: [ids.extraIdea], instructionIds: [] }
  )
  const current = structuredClone(previous)
  current.children = []
  current.ideas = []
  current.instructions = []

  const merged = mergeCapturedBlueprint(previous, next, current)
  expect(merged.content.children).toEqual([])
  expect(merged.content.ideas).toEqual([])
  expect(merged.conflicts).toContain(previous.children[0]!.key)
  expect(merged.conflicts).toContain(next.ideas[0]!.key)
})

test('source removal preserves manually added child references and reports the child conflict', () => {
  const previous = captured()
  const next = captured(source(), { childIds: [], ideaIds: [], instructionIds: [] })
  const current = structuredClone(previous)
  current.instructions.push({
    key: 'guide_manual',
    title: 'Manual child note',
    body: 'Keep this child available.',
    audience: 'planning_only',
    target: { kind: 'child', key: previous.children[0]!.key },
  })

  const merged = mergeCapturedBlueprint(previous, next, current)
  expect(merged.content.children.map(({ key }) => key)).toContain(previous.children[0]!.key)
  expect(merged.content.instructions.map(({ key }) => key)).toContain('guide_manual')
  expect(merged.conflicts).toContain(previous.children[0]!.key)
})

test('root field conflicts are explicit and current edits win', () => {
  const previous = captured()
  const next = captured(source({ event: { ...source().event, title: 'Source title' } }))
  const current = structuredClone(previous)
  current.name = 'Manual title'

  const merged = mergeCapturedBlueprint(previous, next, current)
  expect(merged.content.name).toBe('Manual title')
  expect(merged.conflicts).toContain('name')
})

test('merge treats object property order changes as semantically unchanged', () => {
  const previous = captured()
  const next = captured(
    source({
      children: [{ ...source().children[0]!, title: 'Source updated ceremony' }],
    })
  )
  const current = structuredClone(previous)
  const child = current.children[0]!
  current.children[0] = Object.fromEntries(Object.entries(child).reverse()) as typeof child

  const merged = mergeCapturedBlueprint(previous, next, current)
  expect(merged.content.children[0]?.title).toBe('Source updated ceremony')
  expect(merged.conflicts).not.toContain(child.key)
})
