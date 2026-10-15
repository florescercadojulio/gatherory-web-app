import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { organization, user } from './auth.schema'
import { event } from './event.schema'

/** Workspace-owned drafts. Published snapshots never share mutable content. */
export const blueprintTemplate = pgTable(
  'blueprint_template',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    catalogKey: text('catalog_key').notNull().unique(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createRequestId: uuid('create_request_id').notNull(),
    createRequestHash: text('create_request_hash').notNull(),
    content: jsonb('content').notNull(),
    draftVersion: integer('draft_version').default(1).notNull(),
    publishedRevision: integer('published_revision'),
    publishedDraftVersion: integer('published_draft_version'),
    source: jsonb('source').$type<{ catalogKey: string; revision: number }>(),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_template_creator_request_uidx').on(
      table.createdByUserId,
      table.createRequestId
    ),
    check('blueprint_template_version_positive', sql`${table.draftVersion} > 0`),
  ]
)

/** Deployment-managed starters or immutable private publications. */
export const blueprintRevision = pgTable(
  'blueprint_revision',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id').references(() => blueprintTemplate.id, { onDelete: 'cascade' }),
    draftVersion: integer('draft_version'),
    description: text('description').default('').notNull(),
    authoredLocale: text('authored_locale').default('en').notNull(),
    catalogKey: text('catalog_key').notNull(),
    revision: integer('revision').notNull(),
    contentHash: text('content_hash').notNull(),
    document: jsonb('document').notNull(),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_revision_catalog_revision_uidx').on(table.catalogKey, table.revision),
    uniqueIndex('blueprint_revision_template_draft_uidx').on(table.templateId, table.draftVersion),
    check('blueprint_revision_positive', sql`${table.revision} > 0`),
  ]
)

/** Claimed before auth provisioning; completion commits with canonical and native records. */
export const blueprintInstallation = pgTable(
  'blueprint_installation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id').notNull(),
    requestHash: text('request_hash').notNull(),
    revisionId: uuid('revision_id').references(() => blueprintRevision.id, {
      onDelete: 'set null',
    }),
    plan: jsonb('plan').notNull(),
    sourceSnapshot: jsonb('source_snapshot').notNull(),
    provisioningSlug: text('provisioning_slug').notNull().unique(),
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
    mainEventId: uuid('main_event_id').references(() => event.id, { onDelete: 'cascade' }),
    state: text('state').default('pending').notNull(),
    leaseToken: uuid('lease_token'),
    leaseUntil: timestamp('lease_until', { withTimezone: true }),
    result: jsonb('result'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('blueprint_installation_actor_request_uidx').on(table.actorUserId, table.requestId),
    check(
      'blueprint_installation_state_check',
      sql`${table.state} in ('pending','provisioned','completed','failed')`
    ),
  ]
)

export const eventExperienceConfiguration = pgTable(
  'event_experience_configuration',
  {
    eventId: uuid('event_id').primaryKey(),
    organizationId: text('organization_id').notNull(),
    experienceType: text('experience_type').notNull(),
    categoryOrder: jsonb('category_order').$type<string[]>().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
      name: 'experience_configuration_event_fk',
    }).onDelete('cascade'),
  ]
)

export const eventGuideSection = pgTable(
  'event_guide_section',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id').notNull(),
    eventId: uuid('event_id').notNull(),
    key: text('key').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    sortOrder: integer('sort_order').notNull(),
    visibility: text('visibility').$type<'planning_only' | 'event_participants'>().notNull(),
    version: integer('version').default(1).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
      name: 'event_guide_event_fk',
    }).onDelete('cascade'),
    uniqueIndex('event_guide_event_key_uidx').on(table.eventId, table.key),
    check(
      'event_guide_visibility_check',
      sql`${table.visibility} in ('planning_only','event_participants')`
    ),
    check(
      'event_guide_content_check',
      sql`length(${table.title}) between 1 and 120 and length(${table.body}) between 1 and 5000`
    ),
  ]
)
