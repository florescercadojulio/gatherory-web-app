import { sql } from 'drizzle-orm'
import {
  boolean,
  bigserial,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

/** Private per-account discovery controls; these never produce public counters. */
export const blueprintPreference = pgTable(
  'blueprint_preference',
  {
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    catalogKey: text('catalog_key').notNull(),
    liked: boolean('liked').default(false).notNull(),
    likeRevision: integer('like_revision'),
    likeContentHash: text('like_content_hash'),
    bookmarked: boolean('bookmarked').default(false).notNull(),
    bookmarkRevision: integer('bookmark_revision'),
    bookmarkContentHash: text('bookmark_content_hash'),
    notInterested: boolean('not_interested').default(false).notNull(),
    notInterestedRevision: integer('not_interested_revision'),
    notInterestedContentHash: text('not_interested_content_hash'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_preference_actor_catalog_uidx').on(table.actorUserId, table.catalogKey),
    index('blueprint_preference_actor_bookmark_idx').on(
      table.actorUserId,
      table.bookmarked,
      table.updatedAt
    ),
    check(
      'blueprint_preference_any_enabled_check',
      sql`${table.liked} or ${table.bookmarked} or ${table.notInterested}`
    ),
    check(
      'blueprint_preference_versions_check',
      sql`(${table.likeRevision} is null or (${table.likeRevision} > 0 and ${table.likeContentHash} ~ '^[0-9a-f]{64}$')) and (${table.bookmarkRevision} is null or (${table.bookmarkRevision} > 0 and ${table.bookmarkContentHash} ~ '^[0-9a-f]{64}$')) and (${table.notInterestedRevision} is null or (${table.notInterestedRevision} > 0 and ${table.notInterestedContentHash} ~ '^[0-9a-f]{64}$'))`
    ),
  ]
)

/** Defaults to false by absence; opt-out also deletes this actor's discovery telemetry. */
export const blueprintMeasurementSetting = pgTable('blueprint_measurement_setting', {
  actorUserId: text('actor_user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

type BlueprintRankingContext = {
  mode: 'baseline_v1' | 'catalog'
  algorithmVersion: string
  configurationVersion: string
  configurationDigest: string
  asOf: string
}

/** An opaque, short-lived proof that an eligible organic catalog item was served. */
export const blueprintDiscoveryExposure = pgTable(
  'blueprint_discovery_exposure',
  {
    exposureId: uuid('exposure_id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    catalogKey: text('catalog_key').notNull(),
    sourceRevision: integer('source_revision').notNull(),
    contentHash: text('content_hash').notNull(),
    surface: text('surface').$type<'browse' | 'category' | 'search'>().notNull(),
    rank: integer('rank').notNull(),
    snapshotId: text('snapshot_id'),
    rankingContext: jsonb('ranking_context').$type<BlueprintRankingContext | null>(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('blueprint_discovery_exposure_actor_expiry_idx').on(table.actorUserId, table.expiresAt),
    index('blueprint_discovery_exposure_issued_idx').on(table.issuedAt),
    index('blueprint_discovery_exposure_actor_issued_idx').on(table.actorUserId, table.issuedAt),
    index('blueprint_discovery_exposure_expiry_idx').on(table.expiresAt),
    check('blueprint_discovery_exposure_revision_positive', sql`${table.sourceRevision} > 0`),
    check('blueprint_discovery_exposure_hash_check', sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`),
    check('blueprint_discovery_exposure_rank_check', sql`${table.rank} > 0`),
    check('blueprint_discovery_exposure_expiry_check', sql`${table.expiresAt} > ${table.issuedAt}`),
  ]
)

/** Private, deduplicated organic impression/open records; never exported to analytics. */
export const blueprintDiscoverySignal = pgTable(
  'blueprint_discovery_signal',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    exposureId: uuid('exposure_id')
      .notNull()
      .references(() => blueprintDiscoveryExposure.exposureId, { onDelete: 'cascade' }),
    matchedImpressionId: uuid('matched_impression_id').references(
      (): AnyPgColumn => blueprintDiscoverySignal.id,
      { onDelete: 'set null' }
    ),
    catalogKey: text('catalog_key').notNull(),
    signalDate: date('signal_date', { mode: 'string' }).notNull(),
    requestId: uuid('request_id').notNull(),
    requestHash: text('request_hash').notNull(),
    kind: text('kind').$type<'impression' | 'open'>().notNull(),
    rankEligible: boolean('rank_eligible').default(true).notNull(),
    /** Explicit server time captured after actor lock and eligibility checks. */
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull(),
    /** Database-generated order for accepted signals; preserve as bigint/string. */
    acceptedSequence: bigserial('accepted_sequence', { mode: 'bigint' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_discovery_signal_actor_request_uidx').on(
      table.actorUserId,
      table.requestId
    ),
    uniqueIndex('blueprint_discovery_signal_actor_exposure_kind_uidx').on(
      table.actorUserId,
      table.exposureId,
      table.kind
    ),
    uniqueIndex('blueprint_discovery_signal_daily_credit_uidx')
      .on(table.actorUserId, table.catalogKey, table.signalDate, table.kind)
      .where(sql`${table.rankEligible}`),
    index('blueprint_discovery_signal_actor_created_idx').on(table.actorUserId, table.createdAt),
    index('blueprint_discovery_signal_created_idx').on(table.createdAt),
    uniqueIndex('blueprint_discovery_signal_accepted_sequence_uidx').on(table.acceptedSequence),
    index('blueprint_discovery_signal_actor_accepted_idx').on(table.actorUserId, table.acceptedAt),
    index('blueprint_discovery_signal_exposure_order_idx').on(
      table.actorUserId,
      table.exposureId,
      table.acceptedSequence
    ),
    index('blueprint_discovery_signal_accepted_idx').on(table.acceptedAt),
    check('blueprint_discovery_signal_hash_check', sql`${table.requestHash} ~ '^[0-9a-f]{64}$'`),
    check(
      'blueprint_discovery_signal_matched_impression_check',
      sql`${table.matchedImpressionId} is null or (${table.kind} = 'open' and ${table.matchedImpressionId} <> ${table.id})`
    ),
  ]
)

/** Opt-in-only bounded page-item attempt counts; contains no source/session data. */
export const blueprintDiscoveryServingDaily = pgTable(
  'blueprint_discovery_serving_daily',
  {
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    signalDate: date('signal_date', { mode: 'string' }).notNull(),
    surface: text('surface').$type<'browse' | 'category' | 'search'>().notNull(),
    policyMode: text('policy_mode').$type<'baseline_v1' | 'catalog'>().notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
    configurationVersion: text('configuration_version').notNull(),
    configurationDigest: text('configuration_digest').notNull(),
    requestedItemAttempts: integer('requested_item_attempts').default(0).notNull(),
    eligibleItems: integer('eligible_items').default(0).notNull(),
    issuedExposures: integer('issued_exposures').default(0).notNull(),
    reusedExposures: integer('reused_exposures').default(0).notNull(),
    quotaDeniedItems: integer('quota_denied_items').default(0).notNull(),
    sourceIneligibleItems: integer('source_ineligible_items').default(0).notNull(),
    lastAcceptedAt: timestamp('last_accepted_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_discovery_serving_daily_identity_uidx').on(
      table.actorUserId,
      table.signalDate,
      table.surface,
      table.policyMode,
      table.algorithmVersion,
      table.configurationVersion,
      table.configurationDigest
    ),
    index('blueprint_discovery_serving_daily_retention_idx').on(table.lastAcceptedAt),
    check(
      'blueprint_discovery_serving_daily_surface_check',
      sql`${table.surface} in ('browse', 'category', 'search')`
    ),
    check(
      'blueprint_discovery_serving_daily_policy_check',
      sql`${table.policyMode} in ('baseline_v1', 'catalog')`
    ),
    check(
      'blueprint_discovery_serving_daily_configuration_digest_check',
      sql`${table.configurationDigest} = 'unknown' or ${table.configurationDigest} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      'blueprint_discovery_serving_daily_counts_check',
      sql`${table.requestedItemAttempts} >= 0 and ${table.eligibleItems} >= 0 and ${table.issuedExposures} >= 0 and ${table.reusedExposures} >= 0 and ${table.quotaDeniedItems} >= 0 and ${table.sourceIneligibleItems} >= 0`
    ),
    check(
      'blueprint_discovery_serving_daily_conservation_check',
      sql`${table.requestedItemAttempts} = ${table.eligibleItems} + ${table.sourceIneligibleItems} and ${table.eligibleItems} = ${table.issuedExposures} + ${table.reusedExposures} + ${table.quotaDeniedItems}`
    ),
  ]
)

/** Request replay ledger for desired-state preferences/settings. */
export const blueprintPreferenceMutation = pgTable(
  'blueprint_preference_mutation',
  {
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id').notNull(),
    requestHash: text('request_hash').notNull(),
    kind: text('kind').$type<'preference' | 'measurementSetting' | 'signal'>().notNull(),
    response: jsonb('response').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_preference_mutation_actor_request_uidx').on(
      table.actorUserId,
      table.requestId
    ),
    index('blueprint_preference_mutation_kind_created_idx').on(table.kind, table.createdAt),
    check('blueprint_preference_mutation_hash_check', sql`${table.requestHash} ~ '^[0-9a-f]{64}$'`),
  ]
)
