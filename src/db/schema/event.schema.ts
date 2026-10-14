import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth.schema";

/** A personal departure cannot be undone by a stale planning snapshot.
 * Clear only while accepting a fresh, valid invitation. */
export const eventDeparture = pgTable(
  "event_departure",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.userId] })],
);

/** One revocable bearer invitation per event, never an organization invite. */
export const eventShareLink = pgTable(
  "event_share_link",
  {
    eventId: uuid("event_id")
      .primaryKey()
      .references(() => event.id, { onDelete: "cascade" }),
    token: uuid("token").defaultRandom().notNull().unique(),
    role: text("role").notNull().default("guest"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "event_share_link_role_check",
      sql`${table.role} in ('guest', 'collaborator')`,
    ),
  ],
);

export const eventStatus = pgEnum("event_status", [
  "draft",
  "ongoing",
  "finished",
  "cancelled",
]);

export const eventPurpose = pgEnum("event_purpose", [
  "planning_scouting",
  "part_of_event",
]);

export const eventPlanningStatus = pgEnum("event_planning_status", [
  "draft",
  "approved",
  "not_sure",
  "rejected",
  "archived",
  "cancelled",
]);

export const eventCompletionStatus = pgEnum("event_completion_status", [
  "upcoming",
  "complete",
]);

export const eventSchedulingState = pgEnum("event_scheduling_state", [
  "scheduled",
  "unscheduled",
]);

export const eventCategory = pgEnum("event_category", [
  "venue",
  "food_tasting",
  "photography",
  "honeymoon",
  "attire_fitting",
  "wedding_shower",
  "bachelor_bachelorette",
  "rehearsal",
  "ceremony",
  "reception",
  "other",
]);

export const eventPlanningMode = pgEnum("event_planning_mode", [
  "open_to_ideas",
  "help_me_decide",
  "quiet_planning",
  "decision_made",
]);

export const eventParticipantRole = pgEnum("event_participant_role", [
  "host",
  "collaborator",
  "guest",
]);

export const eventPlanningPermission = pgEnum("event_planning_permission", [
  "manage",
  "contribute",
  "view_only",
]);

/** A request is not a participant and grants no event or sync access. */
export const eventJoinRequest = pgTable(
  "event_join_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    shareLinkToken: uuid("share_link_token").notNull(),
    status: text("status").notNull().default("pending"),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("event_join_request_event_user_unique").on(
      table.eventId,
      table.userId,
    ),
    check(
      "event_join_request_status_check",
      sql`${table.status} in ('pending', 'approved', 'declined')`,
    ),
  ],
);

export const eventAttendanceStatus = pgEnum("event_attendance_status", [
  "pending",
  "going",
  "not_sure",
  "not_going",
]);

export const eventInvitationStatus = pgEnum("event_invitation_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);

/**
 * A person can participate in an event before they create a Gatherory account.
 * `userId` is linked when an invitation is accepted; planning access remains
 * owned by Better Auth organization membership rather than this contact row.
 */
export const workspacePerson = pgTable(
  "workspace_person",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name").notNull(),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspace_person_organization_id_id_uidx").on(
      table.organizationId,
      table.id,
    ),
    uniqueIndex("workspace_person_organization_user_uidx")
      .on(table.organizationId, table.userId)
      .where(sql`${table.userId} is not null`),
    index("workspace_person_organization_email_idx").on(
      table.organizationId,
      table.email,
    ),
    check(
      "workspace_person_display_name_not_blank_check",
      sql`length(trim(${table.displayName})) > 0`,
    ),
  ],
);

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
    dressCode: text("dress_code"),
    imageUrl: text("image_url"),
    status: eventStatus("status"),
    planningStatus: eventPlanningStatus("planning_status"),
    completionStatus: eventCompletionStatus("completion_status")
      .default("upcoming")
      .notNull(),
    schedulingState: eventSchedulingState("scheduling_state")
      .default("scheduled")
      .notNull(),
    category: eventCategory("category"),
    purpose: eventPurpose("purpose"),
    planningMode: eventPlanningMode("planning_mode")
      .default("open_to_ideas")
      .notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isAllDay: boolean("is_all_day").default(false).notNull(),
    timeZone: text("time_zone").notNull(),
    locationName: text("location_name"),
    locationAddress: text("location_address"),
    locationAddressLine2: text("location_address_line_2"),
    locationLatitude: doublePrecision("location_latitude"),
    locationLongitude: doublePrecision("location_longitude"),
    mapItemIdentifier: text("map_item_identifier"),
    budgetCap: numeric("budget_cap", { precision: 14, scale: 2 }),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
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
    uniqueIndex("event_one_main_per_workspace_uidx")
      .on(table.organizationId)
      .where(sql`${table.parentEventId} is null`),
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
      "event_schedule_state_check",
      sql`(${table.schedulingState} = 'scheduled' and ${table.startsAt} is not null) or (${table.schedulingState} = 'unscheduled' and ${table.startsAt} is null and ${table.endsAt} is null)`,
    ),
    check(
      "event_purpose_matches_hierarchy_check",
      sql`(${table.parentEventId} is null and ${table.purpose} is null) or (${table.parentEventId} is not null and ${table.purpose} is not null)`,
    ),
    check(
      "event_child_metadata_matches_hierarchy_check",
      sql`(${table.parentEventId} is null and ${table.category} is null and ${table.planningStatus} is null) or (${table.parentEventId} is not null and ${table.category} is not null and ${table.planningStatus} is not null)`,
    ),
    check(
      "event_lifecycle_matches_hierarchy_check",
      sql`(${table.parentEventId} is null and ${table.status} is not null) or (${table.parentEventId} is not null and ${table.status} is null)`,
    ),
    check(
      "event_location_coordinate_pair_check",
      sql`(${table.locationLatitude} is null and ${table.locationLongitude} is null) or (${table.locationLatitude} is not null and ${table.locationLongitude} is not null and ${table.locationLatitude} between -90 and 90 and ${table.locationLongitude} between -180 and 180)`,
    ),
    check(
      "event_budget_cap_check",
      sql`${table.budgetCap} is null or ${table.budgetCap} >= 0`,
    ),
    check("event_title_not_blank_check", sql`length(trim(${table.title})) > 0`),
    check(
      "event_time_zone_not_blank_check",
      sql`length(trim(${table.timeZone})) > 0`,
    ),
  ],
);

export const eventParticipant = pgTable(
  "event_participant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => workspacePerson.id, { onDelete: "cascade" }),
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
    uniqueIndex("event_participant_event_person_uidx").on(
      table.eventId,
      table.personId,
    ),
    index("event_participant_person_id_idx").on(table.personId),
    check(
      "event_participant_role_permission_check",
      sql`(${table.role} = 'host' and ${table.planningPermission} = 'manage') or (${table.role} = 'collaborator' and ${table.planningPermission} in ('manage', 'contribute', 'view_only')) or (${table.role} = 'guest' and ${table.planningPermission} = 'view_only')`,
    ),
  ],
);

export const eventInvitation = pgTable(
  "event_invitation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => workspacePerson.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: uuid("token").defaultRandom().notNull().unique(),
    role: eventParticipantRole("role").notNull(),
    planningPermission: eventPlanningPermission("planning_permission")
      .default("view_only")
      .notNull(),
    status: eventInvitationStatus("status").default("pending").notNull(),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
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
    check(
      "event_invitation_role_permission_check",
      sql`(${table.role} = 'host' and ${table.planningPermission} = 'manage') or (${table.role} = 'collaborator' and ${table.planningPermission} in ('manage', 'contribute', 'view_only')) or (${table.role} = 'guest' and ${table.planningPermission} = 'view_only')`,
    ),
  ],
);
