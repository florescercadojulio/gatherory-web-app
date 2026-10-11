import {
  bigserial,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth.schema"
import { organization } from "./auth.schema"

/**
 * Compatibility/materialized workspace archive used for bootstrap and older
 * clients. Independently versioned records live in `native_sync_entity`.
 */
export const nativeWorkspaceSnapshot = pgTable(
  "native_workspace_snapshot",
  {
    scopeId: uuid("scope_id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    payload: text("payload").notNull(),
    serverVersion: integer("server_version").default(1).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("native_workspace_snapshot_owner_updated_idx").on(
      table.ownerUserId,
      table.updatedAt,
    ),
    uniqueIndex("native_workspace_snapshot_organization_uidx").on(
      table.organizationId,
    ),
  ],
)

export const nativeSyncScopeRole = pgEnum("native_sync_scope_role", [
  "owner",
  "editor",
  "viewer",
])

/** Access belongs to a workspace scope, not to whichever account last wrote
 * its snapshot. This is the authorization seam used by collaboration. */
export const nativeSyncScopeMember = pgTable(
  "native_sync_scope_member",
  {
    scopeId: uuid("scope_id")
      .notNull()
      .references(() => nativeWorkspaceSnapshot.scopeId, {
        onDelete: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: nativeSyncScopeRole("role").default("editor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scopeId, table.userId] }),
    index("native_sync_scope_member_user_idx").on(table.userId, table.scopeId),
  ],
)

/** One durable receipt per client mutation makes at-least-once delivery safe. */
export const nativeSyncMutationReceipt = pgTable(
  "native_sync_mutation_receipt",
  {
    mutationId: uuid("mutation_id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scopeId: uuid("scope_id").notNull(),
    disposition: text("disposition").notNull(),
    serverVersion: integer("server_version"),
    failureCode: text("failure_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("native_sync_receipt_owner_scope_idx").on(
      table.ownerUserId,
      table.scopeId,
    ),
  ],
)

/** Ordered change log used by another device to pull changes after a cursor. */
export const nativeSyncChange = pgTable(
  "native_sync_change",
  {
    cursor: bigserial("cursor", { mode: "number" }).primaryKey(),
    id: uuid("id").defaultRandom().notNull().unique(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scopeId: uuid("scope_id")
      .notNull()
      .references(() => nativeWorkspaceSnapshot.scopeId, {
        onDelete: "cascade",
      }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    operation: text("operation").notNull(),
    payload: text("payload").notNull(),
    serverVersion: integer("server_version").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("native_sync_change_owner_scope_cursor_idx").on(
      table.ownerUserId,
      table.scopeId,
      table.cursor,
    ),
    index("native_sync_change_scope_cursor_idx").on(
      table.scopeId,
      table.cursor,
    ),
  ],
)

/**
 * Independently versioned records inside a native workspace.
 *
 * The workspace snapshot remains a compatibility/materialized view for older
 * clients and the read-only web companion. Collaborative clients use these
 * smaller records so unrelated edits do not replace the entire workspace.
 */
export const nativeSyncEntity = pgTable(
  "native_sync_entity",
  {
    scopeId: uuid("scope_id")
      .notNull()
      .references(() => nativeWorkspaceSnapshot.scopeId, {
        onDelete: "cascade",
      }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    payload: text("payload").notNull(),
    serverVersion: integer("server_version").default(1).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scopeId, table.entityType, table.entityId] }),
    index("native_sync_entity_owner_scope_idx").on(
      table.ownerUserId,
      table.scopeId,
    ),
  ],
)
