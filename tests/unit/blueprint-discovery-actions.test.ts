import { expect, test } from 'vitest'
import {
  BlueprintMeasurementSignalSchema,
  BlueprintMeasurementSettingsMutationSchema,
} from '@/contracts/blueprint-measurement.contracts'
import {
  BlueprintPreferenceListItemSchema,
  BlueprintPreferenceMutationSchema,
} from '@/contracts/blueprint-preferences.contracts'
import { applyBlueprintViewerPreferences } from '@/server/blueprints/services/blueprint-discovery'
import { isBlueprintDiscoveryAccountEligible } from '@/server/blueprints/services/blueprint-measurement-eligibility'

test('Not interested suppresses browse results but explicit search keeps the result and state', () => {
  const entries = [{ catalogKey: 'host_plan' }, { catalogKey: 'starter_plan' }]
  const states = {
    host_plan: { liked: false, bookmarked: false, notInterested: true },
  }

  expect(applyBlueprintViewerPreferences(entries, states, true)).toEqual([
    {
      catalogKey: 'starter_plan',
      viewerState: { liked: false, bookmarked: false, notInterested: false },
    },
  ])
  expect(applyBlueprintViewerPreferences(entries, states, false)[0]).toEqual({
    catalogKey: 'host_plan',
    viewerState: { liked: false, bookmarked: false, notInterested: true },
  })
})

test('preference and measurement mutations require stable desired-state inputs', () => {
  expect(
    BlueprintPreferenceMutationSchema.safeParse({
      requestId: 'e691885e-6e4f-44d5-a641-78f0bd8065c1',
      catalogKey: 'host_plan',
      revision: 2,
      contentHash: 'a'.repeat(64),
      kind: 'notInterested',
      enabled: true,
    }).success
  ).toBe(true)
  expect(
    BlueprintPreferenceMutationSchema.safeParse({
      requestId: 'e691885e-6e4f-44d5-a641-78f0bd8065c1',
      catalogKey: 'host_plan',
      revision: 2,
      contentHash: 'a'.repeat(63),
      kind: 'like',
      enabled: true,
    }).success
  ).toBe(false)
  expect(
    BlueprintMeasurementSettingsMutationSchema.safeParse({
      requestId: 'e691885e-6e4f-44d5-a641-78f0bd8065c1',
      enabled: false,
    }).success
  ).toBe(true)
})

test('preference rows preserve independent action bindings and allow unavailable public references', () => {
  const row = {
    catalogKey: 'host_plan',
    revision: 3,
    contentHash: 'c'.repeat(64),
    liked: true,
    bookmarked: true,
    notInterested: false,
    likeRevision: 2,
    likeContentHash: 'a'.repeat(64),
    bookmarkRevision: 3,
    bookmarkContentHash: 'c'.repeat(64),
    notInterestedRevision: null,
    notInterestedContentHash: null,
    likeAvailability: 'unavailable',
    bookmarkAvailability: 'unavailable',
    notInterestedAvailability: 'unavailable',
  }
  expect(BlueprintPreferenceListItemSchema.parse(row)).toMatchObject({
    likeRevision: 2,
    bookmarkRevision: 3,
    likeAvailability: 'unavailable',
  })
  expect(BlueprintPreferenceListItemSchema.parse(row)).not.toHaveProperty('entry')
})

test('measurement signals accept only server-issued exposure references', () => {
  const valid = {
    requestId: 'e691885e-6e4f-44d5-a641-78f0bd8065c1',
    exposureId: '77a1f917-4a4e-42c7-9b26-5be2bc128aaa',
    kind: 'open',
  }
  expect(BlueprintMeasurementSignalSchema.safeParse(valid).success).toBe(true)
  expect(
    BlueprintMeasurementSignalSchema.safeParse({ ...valid, catalogKey: 'forged', rank: 1 }).success
  ).toBe(false)
})

test('only explicitly configured account IDs are excluded from discovery measurement', () => {
  const previous = process.env.BLUEPRINT_DISCOVERY_EXCLUDED_ACCOUNT_IDS
  process.env.BLUEPRINT_DISCOVERY_EXCLUDED_ACCOUNT_IDS = 'test-account, internal-reviewer '
  try {
    expect(isBlueprintDiscoveryAccountEligible('test-account')).toBe(false)
    expect(isBlueprintDiscoveryAccountEligible('internal-reviewer')).toBe(false)
    expect(isBlueprintDiscoveryAccountEligible('user@test.invalid')).toBe(true)
  } finally {
    if (previous === undefined) delete process.env.BLUEPRINT_DISCOVERY_EXCLUDED_ACCOUNT_IDS
    else process.env.BLUEPRINT_DISCOVERY_EXCLUDED_ACCOUNT_IDS = previous
  }
})
