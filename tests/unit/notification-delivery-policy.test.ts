import { describe, expect, test } from 'vitest'
import {
  NOTIFICATION_MAX_AGE_MS,
  NOTIFICATION_MAX_ATTEMPTS,
  notificationIntentExpired,
  notificationRetryAt,
  notificationRetryDelayMs,
  sanitizeNotificationFailure,
  validNotificationClaimLimit,
} from '@/server/notifications/services/notification-delivery-policy'

describe('notification delivery bounds', () => {
  test('claims accept only whole limits from one to one hundred', () => {
    for (const limit of [1, 20, 100]) expect(validNotificationClaimLimit(limit)).toBe(true)
    for (const limit of [0, -1, 101, 1.5, NaN, Infinity]) {
      expect(validNotificationClaimLimit(limit)).toBe(false)
    }
  })

  test('retry grows exponentially with bounded positive jitter and an hour cap', () => {
    expect(notificationRetryDelayMs(1, () => 0)).toBe(60_000)
    expect(notificationRetryDelayMs(1, () => 1)).toBe(72_000)
    expect(notificationRetryDelayMs(2, () => 0)).toBe(120_000)
    expect(notificationRetryDelayMs(6, () => 1)).toBe(2_304_000)
    expect(notificationRetryDelayMs(100, () => 1)).toBe(3_600_000)
    expect(notificationRetryDelayMs(1, () => NaN)).toBe(60_000)
  })

  test('attempt eight and age twenty-four hours are terminal boundaries', () => {
    const created = new Date('2030-01-01T00:00:00Z')
    const before = new Date(created.getTime() + NOTIFICATION_MAX_AGE_MS - 1)
    const expired = new Date(before.getTime() + 1)
    expect(notificationIntentExpired(created, NOTIFICATION_MAX_ATTEMPTS - 1, before)).toBe(false)
    expect(notificationIntentExpired(created, NOTIFICATION_MAX_ATTEMPTS, before)).toBe(true)
    expect(notificationIntentExpired(created, 1, expired)).toBe(true)
    expect(notificationRetryAt(created, 1, before, 0, () => 0)).toEqual(expired)
  })

  test('provider backoff respects the retry floor and intent expiry', () => {
    const now = new Date('2030-01-01T00:00:00Z')
    expect(notificationRetryAt(now, 1, now, 180_000, () => 0).getTime() - now.getTime()).toBe(
      180_000
    )
    expect(notificationRetryAt(now, 1, now, 10_000, () => 0).getTime() - now.getTime()).toBe(60_000)
    expect(notificationRetryAt(now, 1, now, 2 * 3_600_000, () => 0).getTime() - now.getTime()).toBe(
      2 * 3_600_000
    )
    expect(
      notificationRetryAt(now, 1, now, 48 * 3_600_000, () => 0).getTime() - now.getTime()
    ).toBe(NOTIFICATION_MAX_AGE_MS)
    expect(notificationRetryAt(now, 1, now, Infinity, () => 0).getTime() - now.getTime()).toBe(
      60_000
    )
  })

  test('only short diagnostic codes can be persisted', () => {
    expect(sanitizeNotificationFailure('provider_failure')).toBe('provider_failure')
    for (const raw of ['token: secret', 'a'.repeat(65), 'provider\nresponse', '']) {
      expect(sanitizeNotificationFailure(raw)).toBe('delivery_failed')
    }
  })
})
