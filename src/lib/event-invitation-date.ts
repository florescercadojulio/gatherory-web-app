type InvitationDateInput = {
  startsAt: string | null | undefined
  timeZone?: string | null
  isAllDay?: boolean
  locale?: string
}

/** Formats the event's local date while keeping older preview payloads usable. */
export function formatInvitationDate({
  startsAt,
  timeZone,
  isAllDay = false,
  locale,
}: InvitationDateInput): string | null {
  if (!startsAt) return null

  const date = new Date(startsAt)
  if (!Number.isFinite(date.getTime())) return null

  const options: Intl.DateTimeFormatOptions = isAllDay
    ? { year: 'numeric', month: 'numeric', day: 'numeric' }
    : {}
  const requestedTimeZone = timeZone?.trim()

  if (requestedTimeZone) {
    try {
      return date.toLocaleString(locale, { ...options, timeZone: requestedTimeZone })
    } catch {
      // Old or malformed timezone metadata falls back to the viewer's local zone.
    }
  }

  return date.toLocaleString(locale, options)
}
