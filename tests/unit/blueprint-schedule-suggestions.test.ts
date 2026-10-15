import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExperienceTreeModuleSchema,
  BlueprintInstructionsModuleSchema,
  type BlueprintCatalogDefinition,
} from '@/contracts/blueprint-install.contracts'
import {
  BlueprintScheduleInputSchema,
  BlueprintScheduleResponseSchema,
} from '@/contracts/blueprint-schedule.contracts'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'
import { z } from 'zod'

type ScheduleChild = z.infer<
  typeof BlueprintExperienceTreeModuleSchema
>['config']['children'][number]

const baseInput = {
  catalogKey: weddingBlueprintV1.catalogKey,
  revision: weddingBlueprintV1.revision,
  contentHash: weddingBlueprintV1.contentHash,
  mainEvent: {
    startsAt: '2027-06-15T15:00:00-04:00',
    timeZone: 'America/Detroit',
  },
}

test('the shared Wedding schedule fixture matches the server response', () => {
  const bytes = readFileSync('contracts/examples/wedding-schedule.v1.json', 'utf8')
  const fixture = BlueprintScheduleResponseSchema.parse(JSON.parse(bytes))
  const { suggestions: _suggestions, ...input } = fixture
  expect(suggestBlueprintSchedule(input, weddingBlueprintV1.definition)).toEqual(fixture)
})

function definitionWith(children: ScheduleChild[]): BlueprintCatalogDefinition {
  const definition = structuredClone(weddingBlueprintV1.definition)
  const tree = definition.modules.find(
    (module) => module.type === 'experience_tree' && module.version === 2
  )
  if (!tree || tree.type !== 'experience_tree')
    throw new Error('Wedding fixture is missing experience_tree v2.')
  tree.config.children = children
  const childKeys = new Set(children.map(({ key }) => key))
  const firstChildKey = children[0]?.key
  if (firstChildKey) {
    for (const module of definition.modules) {
      if (module.type !== 'instructions' || module.version !== 1) continue
      const parsed = BlueprintInstructionsModuleSchema.parse(module)
      module.config = parsed.config
      for (const section of parsed.config.sections) {
        if (section.target.kind === 'child' && !childKeys.has(section.target.key)) {
          section.target.key = firstChildKey
        }
      }
    }
  }
  return BlueprintCatalogDefinitionSchema.parse(definition)
}

function child(
  key: string,
  localTime: string,
  dayOffset = 0,
  category: ScheduleChild['category'] = 'ceremony'
) {
  return {
    key,
    title: key,
    purpose: 'part_of_event' as const,
    category,
    scheduleProposal: { anchor: 'main_start' as const, dayOffset, localTime },
  }
}

function suggest(
  children: Parameters<typeof definitionWith>[0],
  mainEvent: typeof baseInput.mainEvent = baseInput.mainEvent
) {
  return suggestBlueprintSchedule(
    BlueprintScheduleInputSchema.parse({ ...baseInput, mainEvent }),
    definitionWith(children)
  )
}

test('resolves a normal local time into one UTC candidate and validates the response', () => {
  const response = suggest([child('rehearsal', '17:30')])

  expect(response.suggestions).toEqual([
    {
      key: 'rehearsal',
      status: 'suggested',
      localDateTime: '2027-06-15T17:30:00',
      candidates: ['2027-06-15T21:30:00Z'],
    },
  ])
  expect(BlueprintScheduleResponseSchema.parse(response)).toEqual(response)
})

test('keeps spring-forward gaps nonexistent instead of normalizing them', () => {
  const response = suggest([child('gap', '02:30', 1)], {
    startsAt: '2027-03-13T12:00:00Z',
    timeZone: 'America/New_York',
  })

  expect(response.suggestions[0]).toEqual({
    key: 'gap',
    status: 'nonexistent',
    localDateTime: '2027-03-14T02:30:00',
    candidates: [],
  })
})

test('returns fall-back fold candidates in earlier-then-later order', () => {
  const response = suggest([child('fold', '01:30', 1)], {
    startsAt: '2027-11-06T12:00:00Z',
    timeZone: 'America/New_York',
  })

  expect(response.suggestions[0]).toEqual({
    key: 'fold',
    status: 'ambiguous',
    localDateTime: '2027-11-07T01:30:00',
    candidates: ['2027-11-07T05:30:00Z', '2027-11-07T06:30:00Z'],
  })
})

test('handles the thirty-minute Lord Howe gap without guessing', () => {
  const response = suggest([child('lord_howe_gap', '02:15', 1)], {
    startsAt: '2027-10-02T01:00:00Z',
    timeZone: 'Australia/Lord_Howe',
  })

  expect(response.suggestions[0]).toMatchObject({
    status: 'nonexistent',
    localDateTime: '2027-10-03T02:15:00',
    candidates: [],
  })
})

test('treats the Apia skipped calendar day as a nonexistent wall time', () => {
  const response = suggest([child('skipped_day', '12:00', 1)], {
    startsAt: '2011-12-29T22:00:00Z',
    timeZone: 'Pacific/Apia',
  })

  expect(response.suggestions[0]).toMatchObject({
    status: 'nonexistent',
    localDateTime: '2011-12-30T12:00:00',
    candidates: [],
  })
})

test('preserves quarter-hour offsets in the UTC candidate', () => {
  const response = suggest([child('quarter_hour', '12:00')], {
    startsAt: '2027-06-15T02:15:00Z',
    timeZone: 'Asia/Kathmandu',
  })

  expect(response.suggestions[0]).toMatchObject({
    localDateTime: '2027-06-15T12:00:00',
    candidates: ['2027-06-15T06:15:00Z'],
  })
})

test('adds calendar days in the event zone rather than adding 24-hour durations', () => {
  const response = suggest([child('next_day', '09:00', 1)], {
    startsAt: '2027-03-13T12:00:00Z',
    timeZone: 'America/New_York',
  })

  expect(response.suggestions[0]).toMatchObject({
    localDateTime: '2027-03-14T09:00:00',
    candidates: ['2027-03-14T13:00:00Z'],
  })
})

test('anchors the date in the event zone even when it differs from the UTC date', () => {
  const response = suggest([child('same_local_day', '09:00')], {
    startsAt: '2027-06-16T01:00:00Z',
    timeZone: 'America/Los_Angeles',
  })

  expect(response.suggestions[0]).toMatchObject({
    localDateTime: '2027-06-15T09:00:00',
    candidates: ['2027-06-15T16:00:00Z'],
  })
})

test.each([
  ['leap day', '2028-02-28T12:00:00Z', 'UTC', 1, '2028-02-29T09:00:00'],
  ['year rollover', '2027-12-31T12:00:00Z', 'UTC', 1, '2028-01-01T09:00:00'],
])(
  'handles %s using calendar arithmetic',
  (_label, startsAt, timeZone, dayOffset, localDateTime) => {
    const response = suggest([child('rollover', '09:00', dayOffset)], { startsAt, timeZone })

    expect(response.suggestions[0]?.localDateTime).toBe(localDateTime)
  }
)

test('marks children without a schedule proposal for manual planning', () => {
  const response = suggest([
    {
      key: 'manual',
      title: 'Manual',
      purpose: 'planning_scouting',
      category: 'venue',
    },
  ])

  expect(response.suggestions).toEqual([
    { key: 'manual', status: 'manual', localDateTime: null, candidates: [] },
  ])
})

test('is deterministic and leaves the source definition unchanged', () => {
  const definition = structuredClone(weddingBlueprintV1.definition)
  const original = structuredClone(definition)
  const proposals = [child('first', '10:00', 1), child('second', '14:00', 2)]
  const customized = definitionWith(proposals)
  const customizedOriginal = structuredClone(customized)
  const input = BlueprintScheduleInputSchema.parse(baseInput)

  const first = suggestBlueprintSchedule(input, customized)
  const second = suggestBlueprintSchedule(input, customized)

  expect(first).toEqual(second)
  expect(customized).toEqual(customizedOriginal)
  expect(definition).toEqual(original)
})

test('provides useful errors for an invalid confirmed anchor and an out-of-range date', () => {
  expect(() =>
    suggest([child('valid', '09:00')], {
      startsAt: '2027-06-15T15:00:00Z',
      timeZone: 'Not/A_Zone',
    })
  ).toThrow(/confirmed main event start is invalid for time zone Not\/A_Zone/i)

  expect(() =>
    suggest([child('outside_range', '09:00', 1)], {
      startsAt: '9999-12-31T12:00:00Z',
      timeZone: 'UTC',
    })
  ).toThrow(/Cannot calculate the proposed local date and time for child outside_range/)
})

test('is protected by the server-only boundary', () => {
  expect(
    readFileSync('src/server/blueprints/planning/suggest-blueprint-schedule.server.ts', 'utf8')
  ).toContain("import '@tanstack/react-start/server-only'")
})
