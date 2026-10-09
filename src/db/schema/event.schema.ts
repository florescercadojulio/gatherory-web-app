import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth.schema"

export const eventStatus = pgEnum("event_status", [
  "draft",
  "ongoing",
  "finished",
])

export const eventPurpose = pgEnum("event_purpose", [
  "planning_scouting",
  "part_of_event",
])

export const eventParticipantRole = pgEnum("event_participant_role", [
  "host",
  "collaborator",
  "guest",
])

export const eventPlanningPermission = pgEnum("event_planning_permission", [
  "manage",
  "contribute",
  "view_only",
])

export const eventAttendanceStatus = pgEnum("event_attendance_status", [
  "pending",
  "going",
  "not_sure",
  "not_going",
])

export const eventInvitationStatus = pgEnum("event_invitation_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
])

export const event = pgTable(
  "event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    parentEventId: uuid("parent_event_id"),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    status: eventStatus("status").default("draft").notNull(),
    purpose: eventPurpose("purpose"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timeZone: text("time_zone").notNull(),
    locationName: text("location_name"),
    locationAddress: text("location_address"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("event_organization_id_id_uidx").on(
      table.organizationId,
      table.id,
    ),
    index("event_organization_id_idx").on(table.organizationId),
    index("event_parent_event_id_idx").on(table.parentEventId),
    index("event_organization_starts_at_idx").on(
      table.organizationId,
      table.startsAt,
    ),
    foreignKey({
      name: "event_parent_same_workspace_fk",
      columns: [table.organizationId, table.parentEventId],
      foreignColumns: [table.organizationId, table.id],
    }).onDelete("cascade"),
    check(
      "event_end_after_start_check",
      sql`${table.endsAt} is null or ${table.startsAt} is null or ${table.endsAt} >= ${table.startsAt}`,
    ),
    check(
      "event_purpose_matches_hierarchy_check",
      sql`(${table.parentEventId} is null and ${table.purpose} is null) or (${table.parentEventId} is not null and ${table.purpose} is not null)`,
    ),
  ],
)

export const eventParticipant = pgTable(
  "event_participant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: eventParticipantRole("role").notNull(),
    planningPermission: eventPlanningPermission("planning_permission")
      .default("view_only")
      .notNull(),
    attendanceStatus: eventAttendanceStatus("attendance_status")
      .default("pending")
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
    uniqueIndex("event_participant_event_user_uidx").on(
      table.eventId,
      table.userId,
    ),
    index("event_participant_user_id_idx").on(table.userId),
  ],
)

export const eventInvitation = pgTable(
  "event_invitation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: uuid("token").defaultRandom().notNull().unique(),
    role: eventParticipantRole("role").notNull(),
    planningPermission: eventPlanningPermission("planning_permission")
      .default("view_only")
      .notNull(),
    status: eventInvitationStatus("status").default("pending").notNull(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    acceptedByUserId: text("accepted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_invitation_event_id_idx").on(table.eventId),
    index("event_invitation_email_idx").on(table.email),
    uniqueIndex("event_invitation_pending_email_uidx")
      .on(table.eventId, table.email)
      .where(sql`${table.status} = 'pending'`),
  ],
)
