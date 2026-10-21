import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { event } from './event.schema'

export const announcementAudience = pgEnum('announcement_audience', ['all', 'planning', 'guests'])

/** Explicit audience-scoped sends, separate from planner notes and native archives. */
export const eventAnnouncement = pgTable(
  'event_announcement',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    authorUserId: text('author_user_id').references(() => user.id, { onDelete: 'set null' }),
    requestId: uuid('request_id').notNull(),
    message: text('message').notNull(),
    audience: announcementAudience('audience').default('all').notNull(),
    authorLabel: text('author_label').default('Host').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('event_announcement_request_uidx').on(
      table.eventId,
      table.authorUserId,
      table.requestId
    ),
    index('event_announcement_history_idx').on(table.eventId, table.createdAt, table.id),
    check(
      'event_announcement_author_label_check',
      sql`${table.authorLabel} in ('Host', 'Planning Team')`
    ),
    check(
      'event_announcement_message_check',
      sql`char_length(${table.message}) between 1 and 750 and ${table.message} = btrim(${table.message})`
    ),
  ]
)
