import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { mediaAsset } from './media.schema'

export const abuseReportStatus = pgEnum('abuse_report_status', [
  'open',
  'in_review',
  'resolved',
  'dismissed',
])

export const userBlock = pgTable(
  'user_block',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    blockedUserId: text('blocked_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.blockedUserId] }),
    check('user_block_no_self_check', sql`${table.userId} <> ${table.blockedUserId}`),
  ]
)

/** Platform permission, deliberately unrelated to organization/event roles.
 * Provision explicitly outside the client. No seeded or self-service grants. */
export const moderationStaff = pgTable('moderation_staff', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
})

export const hiddenMedia = pgTable(
  'hidden_media',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mediaAssetId] })]
)

export const abuseReport = pgTable(
  'abuse_report',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterUserId: text('reporter_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    mediaAssetId: uuid('media_asset_id').references(() => mediaAsset.id, {
      onDelete: 'set null',
    }),
    reportedUserId: text('reported_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    reason: text('reason').notNull(),
    detail: text('detail').default('').notNull(),
    status: abuseReportStatus('status').default('open').notNull(),
    resolution: text('resolution'),
    reviewedByUserId: text('reviewed_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // A retry cannot flood the queue or silently reopen a moderator decision.
    uniqueIndex('abuse_report_reporter_media_uidx').on(table.reporterUserId, table.mediaAssetId),
    index('abuse_report_status_created_idx').on(table.status, table.createdAt),
    check(
      'abuse_report_reason_check',
      sql`${table.reason} in ('inappropriate', 'harassment', 'privacy', 'other')`
    ),
    check(
      'abuse_report_resolution_check',
      sql`(${table.status} in ('open', 'in_review') and ${table.resolution} is null) or (${table.status} = 'resolved' and ${table.resolution} is not null and ${table.resolution} = 'hidden') or (${table.status} = 'dismissed' and ${table.resolution} is not null and ${table.resolution} = 'kept')`
    ),
  ]
)

/** Append-only review history; avoid putting reporter identity in public feeds. */
export const abuseReportReview = pgTable(
  'abuse_report_review',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => abuseReport.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    previousStatus: abuseReportStatus('previous_status').notNull(),
    status: abuseReportStatus('status').notNull(),
    action: text('action').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('abuse_report_review_report_idx').on(table.reportId, table.createdAt),
    check(
      'abuse_report_review_action_check',
      sql`${table.action} in ('start_review', 'hide_image', 'dismiss')`
    ),
    check('abuse_report_review_note_check', sql`length(trim(${table.note})) between 5 and 2000`),
  ]
)
