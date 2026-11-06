import { expect, test } from 'vitest'

import {
  adoptRefreshedEventDetailsDraft,
  captureEventDetailsDraft,
  isEventDetailsDraftStale,
  eventDetailsRecoveryView,
  isDetailsVersionReviewed,
} from '@/components/events/event-details-draft-state'

test('a background event version change keeps a details draft stale until explicit rebase', () => {
  const draft = captureEventDetailsDraft(8, {
    title: 'My unsaved title',
    description: 'My unsaved description',
    locationName: 'My unsaved location',
  })

  expect(isEventDetailsDraftStale(draft, 9)).toBe(true)
  expect(draft.baseline.version).toBe(8)

  const reviewedDraft = adoptRefreshedEventDetailsDraft(draft, 9)
  expect(isEventDetailsDraftStale(reviewedDraft, 9)).toBe(false)
  expect(reviewedDraft.baseline.version).toBe(9)
  expect(reviewedDraft.values).toEqual(draft.values)
  expect(isDetailsVersionReviewed(8, 9)).toBe(false)
  expect(isDetailsVersionReviewed(9, 9)).toBe(true)
})

test('a conflict requires refreshing the current version before showing comparison values', () => {
  expect(
    eventDetailsRecoveryView({
      open: true,
      baselineVersion: 8,
      currentVersion: 8,
      conflict: true,
      reviewedVersion: null,
    })
  ).toBe('reload-required')

  expect(
    eventDetailsRecoveryView({
      open: true,
      baselineVersion: 8,
      currentVersion: 9,
      conflict: true,
      reviewedVersion: 9,
    })
  ).toBe('comparison')

  expect(
    eventDetailsRecoveryView({
      open: true,
      baselineVersion: 9,
      currentVersion: 10,
      conflict: false,
      reviewedVersion: 9,
    })
  ).toBe('reload-required')

  expect(
    eventDetailsRecoveryView({
      open: false,
      baselineVersion: 9,
      currentVersion: 10,
      conflict: true,
      reviewedVersion: 9,
    })
  ).toBe('hidden')
})
