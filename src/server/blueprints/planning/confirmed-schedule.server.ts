import '@tanstack/react-start/server-only'

import { Temporal } from '@/server/temporal.server'

/** Validate without rewriting the reviewed value or its idempotency hash. */
export function assertConfirmedSchedule(isoDateTime: string, timeZone: string) {
  const instant = Temporal.Instant.from(isoDateTime)
  const zoned = instant.toZonedDateTimeISO(timeZone)
  if (/^[+-]/.test(zoned.timeZoneId)) {
    throw new RangeError('Use a named IANA time zone, not a fixed UTC offset.')
  }
  // Z is an already-confirmed UTC instant, not an assertion of the event's
  // wall-clock offset. Other offsets must agree with this zone on this date.
  if (isoDateTime.endsWith('Z')) return
  Temporal.ZonedDateTime.from(`${isoDateTime}[${timeZone}]`, {
    offset: 'reject',
    disambiguation: 'reject',
    overflow: 'reject',
  })
}
