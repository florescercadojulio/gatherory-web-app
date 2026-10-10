import { sql } from "drizzle-orm"
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth.schema"
import { event } from "./event.schema"
import { idea, registryItem } from "./planning.schema"

export const mediaKind = pgEnum("media_kind", ["image", "video", "audio"])

export const mediaStatus = pgEnum("media_status", [
  "pending",
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleted",
])

export const mediaVisibility = pgEnum("media_visibility", ["private", "public"])

export const eventMediaRole = pgEnum("event_media_role", [
  "cover",
  "background",
  "gallery",
])

export const planningMediaRole = pgEnum("planning_media_role", [
  "cover",
  "gallery",
])

/**
 * Storage metadata is intentionally independent from where media is displayed.
 * The immutable object key can therefore be reused as a cover, background, or
 * gallery item without copying or renaming the underlying object.
 */
export const mediaAsset = pgTable(
  "media_asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    kind: mediaKind("kind").notNull(),
    status: mediaStatus("status").default("pending").notNull(),
    visibility: mediaVisibility("visibility").default("private").notNull(),
    storageProvider: text("storage_provider").default("r2").notNull(),
    bucket: text("bucket").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    displayName: text("display_name"),
    altText: text("alt_text"),
    contentType: text("content_type").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    checksum: text("checksum"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("media_asset_storage_key_uidx").on(table.storageKey),
    uniqueIndex("media_asset_organization_id_id_uidx").on(
      table.organizationId,
      table.id,
    ),
    index("media_asset_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("media_asset_uploaded_by_user_id_idx").on(table.uploadedByUserId),
    check("media_asset_byte_size_check", sql`${table.byteSize} > 0`),
    check(
      "media_asset_dimensions_check",
      sql`(${table.width} is null or ${table.width} > 0) and (${table.height} is null or ${table.height} > 0)`,
    ),
    check(
      "media_asset_duration_check",
      sql`${table.durationMs} is null or ${table.durationMs} >= 0`,
    ),
  ],
)

/** Event-specific presentation data. Other domains receive their own typed
 * association tables as their schemas land, preserving foreign-key integrity.
 */
export const eventMedia = pgTable(
  "event_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    role: eventMediaRole("role").default("gallery").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "event_media_event_same_workspace_fk",
      columns: [table.organizationId, table.eventId],
      foreignColumns: [event.organizationId, event.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "event_media_asset_same_workspace_fk",
      columns: [table.organizationId, table.mediaAssetId],
      foreignColumns: [mediaAsset.organizationId, mediaAsset.id],
    }).onDelete("cascade"),
    uniqueIndex("event_media_event_asset_role_uidx").on(
      table.eventId,
      table.mediaAssetId,
      table.role,
    ),
    index("event_media_event_sort_idx").on(
      table.eventId,
      table.role,
      table.sortOrder,
    ),
    index("event_media_asset_id_idx").on(table.mediaAssetId),
  ],
)

export const ideaMedia = pgTable(
  "idea_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").notNull(),
    ideaId: uuid("idea_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    role: planningMediaRole("role").default("gallery").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "idea_media_idea_same_workspace_fk",
      columns: [table.organizationId, table.ideaId],
      foreignColumns: [idea.organizationId, idea.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "idea_media_asset_same_workspace_fk",
      columns: [table.organizationId, table.mediaAssetId],
      foreignColumns: [mediaAsset.organizationId, mediaAsset.id],
    }).onDelete("cascade"),
    uniqueIndex("idea_media_idea_asset_role_uidx").on(
      table.ideaId,
      table.mediaAssetId,
      table.role,
    ),
    index("idea_media_idea_sort_idx").on(
      table.ideaId,
      table.role,
      table.sortOrder,
    ),
  ],
)

export const registryItemMedia = pgTable(
  "registry_item_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id").notNull(),
    registryItemId: uuid("registry_item_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    role: planningMediaRole("role").default("gallery").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "registry_media_item_same_workspace_fk",
      columns: [table.organizationId, table.registryItemId],
      foreignColumns: [registryItem.organizationId, registryItem.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "registry_media_asset_same_workspace_fk",
      columns: [table.organizationId, table.mediaAssetId],
      foreignColumns: [mediaAsset.organizationId, mediaAsset.id],
    }).onDelete("cascade"),
    uniqueIndex("registry_media_item_asset_role_uidx").on(
      table.registryItemId,
      table.mediaAssetId,
      table.role,
    ),
    index("registry_media_item_sort_idx").on(
      table.registryItemId,
      table.role,
      table.sortOrder,
    ),
  ],
)
