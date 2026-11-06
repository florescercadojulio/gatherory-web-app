import { describe, expect, test } from 'vitest'
import { formatInvitationDate } from '@/lib/event-invitation-date'

describe('formatInvitationDate', () => {
  const startsAt = '2026-10-23T04:00:00.000Z'

  test('formats one instant in different event timezones using the selected locale', () => {
    expect(
      formatInvitationDate({
        startsAt,
        timeZone: 'America/Detroit',
        locale: 'en-GB',
      })
    ).toBe('Friday, 23 October 2026 at 00:00')
    expect(
      formatInvitationDate({
        startsAt,
        timeZone: 'America/Los_Angeles',
        locale: 'en-GB',
      })
    ).toBe('Thursday, 22 October 2026 at 21:00')
  })

  test('formats all-day events as a date without a time', () => {
    expect(
      formatInvitationDate({
        startsAt,
        timeZone: 'America/Detroit',
        isAllDay: true,
        locale: 'en-US',
      })
    ).toBe('Friday, October 23, 2026')
    expect(
      formatInvitationDate({
        startsAt,
        timeZone: 'America/Los_Angeles',
        isAllDay: true,
        locale: 'en-US',
      })
    ).toBe('Thursday, October 22, 2026')
  })

  test('falls back to the viewer timezone when timezone metadata is missing or invalid', () => {
    const withoutTimeZone = formatInvitationDate({ startsAt, locale: 'en-US' })

    expect(formatInvitationDate({ startsAt, timeZone: 'Mars/Olympus_Mons', locale: 'en-US' })).toBe(
      withoutTimeZone
    )
  })

  test('omits a date when the timestamp is missing or invalid', () => {
    expect(formatInvitationDate({ startsAt: null, locale: 'en-US' })).toBeNull()
    expect(formatInvitationDate({ startsAt: 'not-a-date', locale: 'en-US' })).toBeNull()
  })
})
