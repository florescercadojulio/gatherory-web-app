import type { WaitlistEntry } from './waitlist.contracts'

/** Quote every field and neutralize spreadsheet formulas in untrusted email/campaign cells. */
export function waitlistCsv(entries: WaitlistEntry[]) {
  const cell = (value: string | null) => {
    const text = value ?? ''
    return `"${(/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`
  }
  const rows = entries.map((e) => [
    e.email,
    e.locale,
    e.source,
    e.campaign,
    e.createdAt,
    e.consentVersion,
    e.unsubscribedAt ? 'unsubscribed' : 'active',
  ])
  return (
    [['email', 'language', 'source', 'campaign', 'joined_at', 'consent_version', 'status'], ...rows]
      .map((row) => row.map(cell).join(','))
      .join('\r\n') + '\r\n'
  )
}
