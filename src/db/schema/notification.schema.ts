import { sql } from 'drizzle-orm'
import {
  check,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const notificationRecipientKind = pgEnum('notification_recipient_kind', [
  'user',
  'device_guest',
])
export const notificationPlatform = pgEnum('notification_platform', ['ios', 'android'])
export const nativeNotificationType = pgEnum('native_notification_type', [
  'assignment_changed',
  'event_changed',
  'event_announcement',
])
export const nativeNotificationState = pgEnum('native_notification_state', [
  'pending',
  'leased',
  'delivered',
  'discarded',
])

/** Native FCM token registry. Secrets are hashed and provider tokens encrypted at rest. */
export const notificationInstallation = pgTable(
  'notification_installation',
  {
    id: uuid('id').primaryKey(),
    installationSecretHash: text('installation_secret_hash').notNull(),
    recipientKind: notificationRecipientKind('recipient_kind'),
    recipientId: text('recipient_id'),
    platform: notificationPlatform('platform'),
    locale: text('locale').default('en').notNull(),
    tokenHash: text('token_hash'),
    tokenCiphertext: text('token_ciphertext'),
    enabled: boolean('enabled').default(true).notNull(),
    bindingGeneration: integer('binding_generation').default(1).notNull(),
    revision: integer('revision').default(0).notNull(),
    detachedAt: timestamp('detached_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('notification_installation_token_hash_uidx')
      .on(table.tokenHash)
      .where(sql`${table.tokenHash} is not null`),
    index('notification_installation_recipient_idx').on(
      table.recipientKind,
      table.recipientId,
      table.enabled,
      table.detachedAt
    ),
    check(
      'notification_installation_secret_hash_check',
      sql`char_length(${table.installationSecretHash}) = 64`
    ),
    check(
      'notification_installation_token_hash_check',
      sql`${table.tokenHash} is null or char_length(${table.tokenHash}) = 64`
    ),
    check('notification_installation_generation_check', sql`${table.bindingGeneration} > 0`),
    check('notification_installation_revision_check', sql`${table.revision} >= 0`),
  ]
)

/** Transactional outbox: only opaque event/entity identifiers are stored. */
export const nativeNotificationOutbox = pgTable(
  'native_notification_outbox',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dedupeKey: text('dedupe_key').notNull(),
    mutationId: text('mutation_id').notNull(),
    eventId: uuid('event_id').notNull(),
    entityId: text('entity_id').notNull(),
    sourceRevision: text('source_revision'),
    recipientKind: notificationRecipientKind('recipient_kind').notNull(),
    recipientId: text('recipient_id').notNull(),
    type: nativeNotificationType('type').notNull(),
    state: nativeNotificationState('state').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
    leaseUntil: timestamp('lease_until', { withTimezone: true }),
    leaseKey: uuid('lease_key'),
    acceptedInstallationIds: text('accepted_installation_ids')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    lastFailure: text('last_failure'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('native_notification_outbox_dedupe_uidx').on(table.dedupeKey),
    index('native_notification_outbox_pending_idx').on(table.state, table.nextAttemptAt),
    index('native_notification_outbox_recipient_idx').on(
      table.recipientKind,
      table.recipientId,
      table.eventId
    ),
    check('native_notification_outbox_attempts_check', sql`${table.attempts} >= 0`),
  ]
)
