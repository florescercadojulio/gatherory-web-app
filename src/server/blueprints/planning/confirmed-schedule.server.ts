import '@tanstack/react-start/server-only'

/** Validate without rewriting the reviewed value or its idempotency hash. */
export function assertConfirmedSchedule(isoDateTime: string, timeZone: string) {
  if (typeof Temporal === 'undefined') {
    throw new Error('Blueprint scheduling requires native Temporal (Node.js 26 or later).')
  }
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
