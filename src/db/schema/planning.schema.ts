import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth.schema"
import { event, eventPlanningPermission } from "./event.schema"

export const ideaCategory = pgEnum("idea_category", [
  "event",
  "registry",
  "link",
  "venue",
  "attire",
  "flowers",
  "food",
  "photography",
  "music",
  "decor",
  "invitations",
  "honeymoon",
  "other",
])

export const ideaStatus = pgEnum("idea_status", [
  "new",
  "maybe",
  "shortlisted",
  "approved",
  "passed",
  "archived",
])

export const ideaGuestVisibility = pgEnum("idea_guest_visibility", [
  "planning_only",
  "shown_to_guests",
])

export const ideaDecisionChoice = pgEnum("idea_decision_choice", [
  "pass",
  "maybe",
  "love",
])

export const registryCategory = pgEnum("registry_category", [
  "home",
  "kitchen",
  "travel",
  "experience",
  "cash_fund",
])

export const registryCommitmentStatus = pgEnum("registry_commitment_status", [
  "active",
  "cancelled",
])

export const expenseStatus = pgEnum("expense_status", [
  "estimated",
  "committed",
  "paid",
])

export const expenseCategory = pgEnum("expense_category", [
  "venue",
  "food_and_drink",
  "attire",
  "decor",
  "entertainment",
  "photography",
  "stationery",
  "travel",
  "gifts",
  "other",
])

/**
 * Category-specific values are intentionally stored together with a version.
 * The category remains a relational discriminator, while the JSON payload lets
 * Gatherory add focused editors without a sparse column set or a migration for
 * every new planning prompt.
 */
export type IdeaConfiguration = {
  version: 1
  [key: string]: unknown
}

export const workspacePlanningSettings = pgTable(
  "workspace_planning_settings",
  {
    organizationId: text("organization_id")
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    budgetCap: numeric("budget_cap", { precision: 14, scale: 2 }),
    currencyCode: text("currency_code").default("USD").notNull(),
    registryShared: boolean("registry_shared").default(false).notNull(),
    collaboratorLinkEnabled: boolean("collaborator_link_enabled")
      .default(true)
      .notNull(),
    requiresCollaboratorApproval: boolean("requires_collaborator_approval")
      .default(true)
      .notNull(),
    defaultCollaboratorPermission: eventPlanningPermission(
      "default_collaborator_permission",
    )
      .default("contribute")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      "workspace_planning_budget_cap_check",
      sql`${table.budgetCap} is null or ${table.budgetCap} >= 0`,
    ),
    check(
      "workspace_planning_currency_code_check",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),
  ],
)

export const idea = pgTable(
  "idea",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull(),
    category: ideaCategory("category").notNull(),
    status: ideaStatus("status").default("new").notNull(),
    guestVisibility: ideaGuestVisibility("guest_visibility")
      .default("planning_only")
      .notNull(),
    title: text("title"),
    note: text("note"),
    estimatedCost: numeric("estimated_cost", { precision: 14, scale: 2 }),
    configuration: jsonb("configuration").$type<IdeaConfiguration>().notNull(),
    submittedByUserId: text("submitted_by_user_id")
      .references(() => user.id, { onDelete: "set null" }),
    /** The scheduled child event produced by approving an event idea. */
    materializedEventId: uuid("materialized_event_id").references(
      () => event.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("idea_organization_id_id_uidx").on(
      table.organizationId,
      table.id,
    ),
    uniqueIndex("idea_organization_event_id_uidx").on(
      table.organizationId,
      table.eventId,
      table.id,
    ),
    foreignKey({
      name: "idea_event_same_workspace_fk",
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
    }).onDelete("cascade"),
    index("idea_event_status_created_idx").on(
      table.eventId,
      table.status,
      table.createdAt,
    ),
    index("idea_submitted_by_user_id_idx").on(table.submittedByUserId),
    uniqueIndex("idea_materialized_event_uidx")
      .on(table.materializedEventId)
      .where(sql`${table.materializedEventId} is not null`),
    check(
      "idea_estimated_cost_check",
      sql`${table.estimatedCost} is null or ${table.estimatedCost} >= 0`,
    ),
    check(
      "idea_configuration_version_check",
      sql`jsonb_typeof(${table.configuration}) = 'object' and ${table.configuration} @> '{"version": 1}'::jsonb`,
    ),
  ],
)

export const ideaDecision = pgTable(
  "idea_decision",
  {
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    choice: ideaDecisionChoice("choice").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ideaId, table.userId] }),
    index("idea_decision_user_id_idx").on(table.userId),
  ],
)

export const musicTrack = pgTable(
  "music_track",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    providerTrackId: text("provider_track_id").notNull(),
    title: text("title").notNull(),
    artistName: text("artist_name").notNull(),
    albumTitle: text("album_title"),
    artworkUrl: text("artwork_url"),
    providerUrl: text("provider_url"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("music_track_provider_id_uidx").on(
      table.provider,
      table.providerTrackId,
    ),
    check(
      "music_track_duration_check",
      sql`${table.durationMs} is null or ${table.durationMs} >= 0`,
    ),
  ],
)

export const ideaMusicTrack = pgTable(
  "idea_music_track",
  {
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => idea.id, { onDelete: "cascade" }),
    musicTrackId: uuid("music_track_id")
      .notNull()
      .references(() => musicTrack.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ideaId, table.musicTrackId] }),
    index("idea_music_track_sort_idx").on(table.ideaId, table.sortOrder),
  ],
)

export const eventExpense = pgTable(
  "event_expense",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").notNull(),
    eventId: uuid("event_id").notNull(),
    sourceIdeaId: uuid("source_idea_id"),
    title: text("title").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    category: expenseCategory("category").default("other").notNull(),
    status: expenseStatus("status").default("estimated").notNull(),
    createdByUserId: text("created_by_user_id")
      .references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "event_expense_event_same_workspace_fk",
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "event_expense_idea_same_event_fk",
      columns: [table.organizationId, table.eventId, table.sourceIdeaId],
      foreignColumns: [idea.organizationId, idea.eventId, idea.id],
    }).onDelete("cascade"),
    index("event_expense_event_status_idx").on(table.eventId, table.status),
    uniqueIndex("event_expense_source_idea_uidx")
      .on(table.sourceIdeaId)
      .where(sql`${table.sourceIdeaId} is not null`),
    check("event_expense_amount_check", sql`${table.amount} >= 0`),
  ],
)

export const eventNote = pgTable(
  "event_note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").notNull(),
    eventId: uuid("event_id").notNull(),
    authorUserId: text("author_user_id")
      .references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "event_note_event_same_workspace_fk",
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
    }).onDelete("cascade"),
    index("event_note_event_sent_at_idx").on(table.eventId, table.sentAt),
    check(
      "event_note_body_length_check",
      sql`char_length(${table.body}) between 1 and 750`,
    ),
  ],
)

export const registryItem = pgTable(
  "registry_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").notNull(),
    eventId: uuid("event_id").notNull(),
    sourceIdeaId: uuid("source_idea_id"),
    title: text("title").notNull(),
    note: text("note"),
    category: registryCategory("category").notNull(),
    price: numeric("price", { precision: 14, scale: 2 }),
    quantity: integer("quantity").default(1).notNull(),
    createdByUserId: text("created_by_user_id")
      .references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("registry_item_organization_id_id_uidx").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "registry_item_event_same_workspace_fk",
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "registry_item_idea_same_event_fk",
      columns: [table.organizationId, table.eventId, table.sourceIdeaId],
      foreignColumns: [idea.organizationId, idea.eventId, idea.id],
    }).onDelete("cascade"),
    index("registry_item_event_category_idx").on(table.eventId, table.category),
    uniqueIndex("registry_item_source_idea_uidx")
      .on(table.sourceIdeaId)
      .where(sql`${table.sourceIdeaId} is not null`),
    check(
      "registry_item_price_check",
      sql`${table.price} is null or ${table.price} >= 0`,
    ),
    check("registry_item_quantity_check", sql`${table.quantity} > 0`),
  ],
)

export const registryCommitment = pgTable(
  "registry_commitment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registryItemId: uuid("registry_item_id")
      .notNull()
      .references(() => registryItem.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(1).notNull(),
    status: registryCommitmentStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("registry_commitment_item_user_uidx").on(
      table.registryItemId,
      table.userId,
    ),
    index("registry_commitment_user_id_idx").on(table.userId),
    check("registry_commitment_quantity_check", sql`${table.quantity} > 0`),
  ],
)
