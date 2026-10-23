import { z } from 'zod'

export const WAITLIST_CONSENT_VERSION = 'launch-updates-v1'
export const WaitlistSignupInput = z
  .object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    locale: z.enum(['en', 'es']),
    source: z.enum(['landing_home', 'landing_iphone']),
    campaign: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._-]{1,80}$/)
      .optional(),
    consent: z.literal(true),
    website: z.string().max(200).default(''),
  })
  .strict()
export type WaitlistSignupInput = z.infer<typeof WaitlistSignupInput>

export const WaitlistPageInput = z
  .object({
    status: z.enum(['all', 'active', 'unsubscribed']).default('all'),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .strict()
export type WaitlistPageInput = z.infer<typeof WaitlistPageInput>
export const WaitlistUnsubscribeInput = z.object({ id: z.uuid() }).strict()
export type WaitlistActor = { id: string; email: string; emailVerified: boolean } | null
export type WaitlistEntry = {
  id: string
  email: string
  locale: 'en' | 'es'
  source: 'landing_home' | 'landing_iphone'
  campaign: string | null
  consentVersion: string
  createdAt: string
  unsubscribedAt: string | null
}
export type WaitlistPage = {
  entries: WaitlistEntry[]
  hasNextPage: boolean
  totals: { all: number; active: number; unsubscribed: number; lastSevenDays: number }
}
