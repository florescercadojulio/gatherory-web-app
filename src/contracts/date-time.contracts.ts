import { z } from 'zod'

// Browser-safe wire validation. Named-zone/offset agreement is checked only
// by the server. Date/SwiftData boundaries currently preserve milliseconds.
export const ConfirmedInstantSchema = z.iso
  .datetime({ offset: true })
  .min(20)
  .max(29)
  .regex(/^(?!.*-00:00$)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/)
  .describe(
    'Confirmed RFC 3339 instant with seconds and Z or an explicit offset. At most three fractional digits; no floating local times. Send the event IANA time zone separately.'
  )
