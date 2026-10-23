import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/** Launch-update opt-ins are separate from accounts, event guests, and invitations. */
export const waitlistSignup = pgTable(
  'waitlist_signup',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    locale: text('locale').notNull(),
    source: text('source').notNull(),
    campaign: text('campaign'),
    consentVersion: text('consent_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (table) => [
    index('waitlist_signup_created_idx').on(table.createdAt, table.id),
    check(
      'waitlist_email_normalized',
      sql`${table.email} = lower(trim(${table.email})) and length(${table.email}) between 3 and 254`
    ),
    check('waitlist_locale_check', sql`${table.locale} in ('en', 'es')`),
    check('waitlist_source_check', sql`${table.source} in ('landing_home', 'landing_iphone')`),
    check('waitlist_consent_check', sql`${table.consentVersion} = 'launch-updates-v1'`),
  ]
)

/** Short-lived HMAC keys only: no raw IP or email in the abuse counters. */
export const waitlistRateBucket = pgTable(
  'waitlist_rate_bucket',
  {
    key: text('key').primaryKey(),
    attempts: integer('attempts').default(1).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('waitlist_rate_expiry_idx').on(table.expiresAt)]
)
