import { afterEach, expect, test, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { ConfirmedInstantSchema } from '@/contracts/date-time.contracts'
import { BlueprintInstallInputSchema } from '@/contracts/blueprint-install.contracts'
import { assertConfirmedSchedule } from '@/server/blueprints/planning/confirmed-schedule.server'
import { expandBlueprintInstallation } from '@/server/blueprints/planning/plan-blueprint-installation'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'

afterEach(() => vi.unstubAllGlobals())

test.each([
  ['2027-03-14T01:59:59-05:00', 'America/Detroit'],
  ['2027-03-14T03:00:00-04:00', 'America/Detroit'],
  ['2027-11-07T01:30:00-04:00', 'America/Detroit'],
  ['2027-11-07T01:30:00-05:00', 'America/Detroit'],
  ['2027-07-01T12:00:00+05:45', 'Asia/Kathmandu'],
  ['2027-10-03T02:30:00+11:00', 'Australia/Lord_Howe'],
  ['2028-02-29T00:00:00Z', 'UTC'],
  ['2027-06-15T19:00:00.123Z', 'Pacific/Kiritimati'],
])('accepts confirmed instant %s in %s without guessing a local time', (instant, zone) => {
  expect(ConfirmedInstantSchema.safeParse(instant).success).toBe(true)
  expect(() => assertConfirmedSchedule(instant, zone)).not.toThrow()
})

test.each([
  ['2027-03-14T02:30:00-05:00', 'America/Detroit'],
  ['2027-03-14T02:30:00-04:00', 'America/Detroit'],
  ['2027-11-07T01:30:00-06:00', 'America/Detroit'],
  ['2027-06-15T15:00:00-05:00', 'America/Detroit'],
  ['2027-10-03T02:15:00+10:30', 'Australia/Lord_Howe'],
  ['2011-12-30T12:00:00-10:00', 'Pacific/Apia'],
  ['2027-06-15T19:00:00Z', 'Not/A_Zone'],
  ['2027-06-15T19:00:00Z', '+05:00'],
  ['2027-06-15T19:00:00Z', 'UTC][u-ca=iso8601'],
])('rejects mismatches, skipped wall times, or invalid zones: %s / %s', (instant, zone) => {
  expect(() => assertConfirmedSchedule(instant, zone)).toThrow()
})

test.each([
  '2027-02-29T00:00:00Z',
  '2027-06-15',
  '2027-06-15T15:00:00',
  '2027-06-15T15:00:00-00:00',
  '2027-06-15T15:00:00.1234Z',
  '2027-06-15T15:00:60Z',
  '2027-06-15T24:00:00Z',
])('wire schema rejects unconfirmed dates or lossy precision: %s', (value) => {
  expect(ConfirmedInstantSchema.safeParse(value).success).toBe(false)
})

test('shared contracts work without Temporal, while server scheduling fails explicitly', () => {
  vi.stubGlobal('Temporal', undefined)
  expect(ConfirmedInstantSchema.parse('2027-06-15T19:00:00Z')).toBe('2027-06-15T19:00:00Z')
  expect(BlueprintInstallInputSchema.safeParse(input()).success).toBe(true)
  expect(() => assertConfirmedSchedule('2027-06-15T19:00:00Z', 'UTC')).toThrow(
    'requires native Temporal'
  )
  expect(
    readFileSync('src/server/blueprints/planning/confirmed-schedule.server.ts', 'utf8')
  ).toContain("import '@tanstack/react-start/server-only'")
})

test('planning retains reviewed strings and validates child schedules with the event zone', () => {
  const request = input()
  const plan = expandBlueprintInstallation(request, weddingBlueprintV1)
  expect(plan.main.startsAt).toBe(request.mainEvent.startsAt)
  expect(plan.main.timeZone).toBe('America/Detroit')
  expect(() =>
    expandBlueprintInstallation(
      {
        ...request,
        selectedChildren: [{ key: 'ceremony', startsAt: '2027-03-14T02:30:00-05:00' }],
      },
      weddingBlueprintV1
    )
  ).toThrow(expect.objectContaining({ code: 'invalid_schedule' }))
})

function input() {
  return {
    requestId: 'af08d534-8c90-4c89-bacc-0f5820bb4d0c',
    catalogKey: weddingBlueprintV1.catalogKey,
    revision: weddingBlueprintV1.revision,
    contentHash: weddingBlueprintV1.contentHash,
    mainEvent: {
      name: 'Wedding',
      startsAt: '2027-06-15T15:00:00.123-04:00',
      timeZone: 'America/Detroit',
    },
    selectedChildren: [],
    selectedIdeaKeys: [],
    capabilities: [
      'event.children_v1',
      'planning.ideas_v2',
      'planning.portable_idea_config_v1',
      'planning.instructions_v1',
    ],
  }
}
