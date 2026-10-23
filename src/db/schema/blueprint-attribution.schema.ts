import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { blueprintDiscoveryExposure } from './blueprint-discovery.schema'
import { blueprintInstallation, blueprintRevision, blueprintTemplate } from './blueprint.schema'
import { user } from './auth.schema'

/** Private proof that an unchanged public Blueprint was copied from an opened organic exposure. */
export const blueprintAttributionAcquisition = pgTable(
  'blueprint_attribution_acquisition',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    exposureId: uuid('exposure_id')
      .notNull()
      .references(() => blueprintDiscoveryExposure.exposureId, { onDelete: 'cascade' }),
    copyTemplateId: uuid('copy_template_id')
      .notNull()
      .references(() => blueprintTemplate.id, { onDelete: 'cascade' }),
    copyRevisionId: uuid('copy_revision_id')
      .notNull()
      .references(() => blueprintRevision.id, { onDelete: 'cascade' }),
    copyContentHash: text('copy_content_hash').notNull(),
    sourceCatalogKey: text('source_catalog_key').notNull(),
    sourceRevision: integer('source_revision').notNull(),
    sourceContentHash: text('source_content_hash').notNull(),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_attribution_acquisition_copy_uidx').on(table.copyTemplateId),
    index('blueprint_attribution_acquisition_actor_source_idx').on(
      table.actorUserId,
      table.sourceCatalogKey,
      table.expiresAt
    ),
    check(
      'blueprint_attribution_acquisition_hash_check',
      sql`${table.copyContentHash} ~ '^[0-9a-f]{64}$' and ${table.sourceContentHash} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      'blueprint_attribution_acquisition_expiry_check',
      sql`${table.expiresAt} > ${table.acquiredAt}`
    ),
  ]
)

/** One private qualifying adoption per account and original public Blueprint. */
export const blueprintQualifiedAdoption = pgTable(
  'blueprint_qualified_adoption',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    acquisitionId: uuid('acquisition_id')
      .notNull()
      .references(() => blueprintAttributionAcquisition.id, { onDelete: 'cascade' }),
    installationId: uuid('installation_id')
      .notNull()
      .references(() => blueprintInstallation.id, { onDelete: 'cascade' }),
    sourceCatalogKey: text('source_catalog_key').notNull(),
    sourceRevision: integer('source_revision').notNull(),
    sourceContentHash: text('source_content_hash').notNull(),
    qualifiedAt: timestamp('qualified_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_qualified_adoption_actor_source_uidx').on(
      table.actorUserId,
      table.sourceCatalogKey
    ),
    uniqueIndex('blueprint_qualified_adoption_installation_uidx').on(table.installationId),
    index('blueprint_qualified_adoption_source_time_idx').on(
      table.sourceCatalogKey,
      table.qualifiedAt
    ),
    check(
      'blueprint_qualified_adoption_hash_check',
      sql`${table.sourceContentHash} ~ '^[0-9a-f]{64}$'`
    ),
  ]
)
