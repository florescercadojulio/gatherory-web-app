CREATE TYPE "organization_type" AS ENUM('event', 'business');--> statement-breakpoint
CREATE TYPE "event_attendance_status" AS ENUM('pending', 'going', 'not_sure', 'not_going');--> statement-breakpoint
CREATE TYPE "event_category" AS ENUM('venue', 'food_tasting', 'photography', 'honeymoon', 'attire_fitting', 'wedding_shower', 'bachelor_bachelorette', 'rehearsal', 'ceremony', 'reception', 'other');--> statement-breakpoint
CREATE TYPE "event_completion_status" AS ENUM('upcoming', 'complete');--> statement-breakpoint
CREATE TYPE "event_invitation_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "event_participant_role" AS ENUM('host', 'collaborator', 'guest');--> statement-breakpoint
CREATE TYPE "event_planning_mode" AS ENUM('open_to_ideas', 'help_me_decide', 'quiet_planning', 'decision_made');--> statement-breakpoint
CREATE TYPE "event_planning_permission" AS ENUM('manage', 'contribute', 'view_only');--> statement-breakpoint
CREATE TYPE "event_planning_status" AS ENUM('draft', 'approved', 'not_sure', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "event_purpose" AS ENUM('planning_scouting', 'part_of_event');--> statement-breakpoint
CREATE TYPE "event_scheduling_state" AS ENUM('scheduled', 'unscheduled');--> statement-breakpoint
CREATE TYPE "event_status" AS ENUM('draft', 'ongoing', 'finished');--> statement-breakpoint
CREATE TYPE "event_media_role" AS ENUM('cover', 'background', 'gallery');--> statement-breakpoint
CREATE TYPE "media_kind" AS ENUM('image', 'video', 'audio');--> statement-breakpoint
CREATE TYPE "media_status" AS ENUM('pending', 'uploaded', 'processing', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "media_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "planning_media_role" AS ENUM('cover', 'gallery');--> statement-breakpoint
CREATE TYPE "expense_category" AS ENUM('venue', 'food_and_drink', 'attire', 'decor', 'entertainment', 'photography', 'stationery', 'travel', 'gifts', 'other');--> statement-breakpoint
CREATE TYPE "expense_status" AS ENUM('estimated', 'committed', 'paid');--> statement-breakpoint
CREATE TYPE "idea_category" AS ENUM('event', 'registry', 'venue', 'attire', 'flowers', 'food', 'photography', 'music', 'decor', 'invitations', 'honeymoon', 'other');--> statement-breakpoint
CREATE TYPE "idea_decision_choice" AS ENUM('pass', 'maybe', 'love');--> statement-breakpoint
CREATE TYPE "idea_guest_visibility" AS ENUM('planning_only', 'shown_to_guests');--> statement-breakpoint
CREATE TYPE "idea_status" AS ENUM('new', 'maybe', 'shortlisted', 'approved', 'passed', 'archived');--> statement-breakpoint
CREATE TYPE "registry_category" AS ENUM('home', 'kitchen', 'travel', 'experience', 'cash_fund');--> statement-breakpoint
CREATE TYPE "registry_commitment_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "native_sync_scope_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"workspace_type" "organization_type" DEFAULT 'event'::"organization_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"active_team_id" text
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"membership_key" text UNIQUE,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"parent_event_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"dress_code" text,
	"image_url" text,
	"status" "event_status",
	"planning_status" "event_planning_status",
	"completion_status" "event_completion_status" DEFAULT 'upcoming'::"event_completion_status" NOT NULL,
	"scheduling_state" "event_scheduling_state" DEFAULT 'scheduled'::"event_scheduling_state" NOT NULL,
	"category" "event_category",
	"purpose" "event_purpose",
	"planning_mode" "event_planning_mode" DEFAULT 'open_to_ideas'::"event_planning_mode" NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"time_zone" text NOT NULL,
	"location_name" text,
	"location_address" text,
	"location_address_line_2" text,
	"location_latitude" double precision,
	"location_longitude" double precision,
	"map_item_identifier" text,
	"budget_cap" numeric(14,2),
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_end_after_start_check" CHECK ("ends_at" is null or "starts_at" is null or "ends_at" >= "starts_at"),
	CONSTRAINT "event_schedule_state_check" CHECK (("scheduling_state" = 'scheduled' and "starts_at" is not null) or ("scheduling_state" = 'unscheduled' and "starts_at" is null and "ends_at" is null)),
	CONSTRAINT "event_purpose_matches_hierarchy_check" CHECK (("parent_event_id" is null and "purpose" is null) or ("parent_event_id" is not null and "purpose" is not null)),
	CONSTRAINT "event_child_metadata_matches_hierarchy_check" CHECK (("parent_event_id" is null and "category" is null and "planning_status" is null) or ("parent_event_id" is not null and "category" is not null and "planning_status" is not null)),
	CONSTRAINT "event_lifecycle_matches_hierarchy_check" CHECK (("parent_event_id" is null and "status" is not null) or ("parent_event_id" is not null and "status" is null)),
	CONSTRAINT "event_location_coordinate_pair_check" CHECK (("location_latitude" is null and "location_longitude" is null) or ("location_latitude" is not null and "location_longitude" is not null and "location_latitude" between -90 and 90 and "location_longitude" between -180 and 180)),
	CONSTRAINT "event_budget_cap_check" CHECK ("budget_cap" is null or "budget_cap" >= 0),
	CONSTRAINT "event_title_not_blank_check" CHECK (length(trim("title")) > 0),
	CONSTRAINT "event_time_zone_not_blank_check" CHECK (length(trim("time_zone")) > 0)
);
--> statement-breakpoint
CREATE TABLE "event_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"role" "event_participant_role" NOT NULL,
	"planning_permission" "event_planning_permission" DEFAULT 'view_only'::"event_planning_permission" NOT NULL,
	"status" "event_invitation_status" DEFAULT 'pending'::"event_invitation_status" NOT NULL,
	"invited_by_user_id" text,
	"accepted_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_invitation_role_permission_check" CHECK (("role" = 'host' and "planning_permission" = 'manage') or ("role" = 'collaborator' and "planning_permission" in ('manage', 'contribute', 'view_only')) or ("role" = 'guest' and "planning_permission" = 'view_only'))
);
--> statement-breakpoint
CREATE TABLE "event_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" "event_participant_role" NOT NULL,
	"planning_permission" "event_planning_permission" DEFAULT 'view_only'::"event_planning_permission" NOT NULL,
	"attendance_status" "event_attendance_status" DEFAULT 'pending'::"event_attendance_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_participant_role_permission_check" CHECK (("role" = 'host' and "planning_permission" = 'manage') or ("role" = 'collaborator' and "planning_permission" in ('manage', 'contribute', 'view_only')) or ("role" = 'guest' and "planning_permission" = 'view_only'))
);
--> statement-breakpoint
CREATE TABLE "workspace_person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"user_id" text,
	"display_name" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_person_display_name_not_blank_check" CHECK (length(trim("display_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "event_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" "event_media_role" DEFAULT 'gallery'::"event_media_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_media_sort_order_check" CHECK ("sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "idea_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"idea_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" "planning_media_role" DEFAULT 'gallery'::"planning_media_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idea_media_sort_order_check" CHECK ("sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"uploaded_by_user_id" text,
	"kind" "media_kind" NOT NULL,
	"status" "media_status" DEFAULT 'pending'::"media_status" NOT NULL,
	"visibility" "media_visibility" DEFAULT 'private'::"media_visibility" NOT NULL,
	"storage_provider" text DEFAULT 'r2' NOT NULL,
	"bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"display_name" text,
	"alt_text" text,
	"content_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "media_asset_byte_size_check" CHECK ("byte_size" > 0),
	CONSTRAINT "media_asset_dimensions_check" CHECK (("width" is null or "width" > 0) and ("height" is null or "height" > 0)),
	CONSTRAINT "media_asset_duration_check" CHECK ("duration_ms" is null or "duration_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "registry_item_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"registry_item_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" "planning_media_role" DEFAULT 'gallery'::"planning_media_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_media_sort_order_check" CHECK ("sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"source_idea_id" uuid,
	"title" text NOT NULL,
	"amount" numeric(14,2) NOT NULL,
	"category" "expense_category" DEFAULT 'other'::"expense_category" NOT NULL,
	"status" "expense_status" DEFAULT 'estimated'::"expense_status" NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_expense_amount_check" CHECK ("amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"author_user_id" text,
	"body" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_note_body_length_check" CHECK (char_length("body") between 1 and 750)
);
--> statement-breakpoint
CREATE TABLE "idea" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"category" "idea_category" NOT NULL,
	"status" "idea_status" DEFAULT 'new'::"idea_status" NOT NULL,
	"guest_visibility" "idea_guest_visibility" DEFAULT 'planning_only'::"idea_guest_visibility" NOT NULL,
	"title" text,
	"note" text,
	"estimated_cost" numeric(14,2),
	"configuration" jsonb NOT NULL,
	"submitted_by_user_id" text,
	"materialized_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idea_estimated_cost_check" CHECK ("estimated_cost" is null or "estimated_cost" >= 0),
	CONSTRAINT "idea_configuration_version_check" CHECK (jsonb_typeof("configuration") = 'object' and "configuration" @> '{"version": 1}'::jsonb)
);
--> statement-breakpoint
CREATE TABLE "idea_decision" (
	"idea_id" uuid,
	"user_id" text,
	"choice" "idea_decision_choice" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idea_decision_pkey" PRIMARY KEY("idea_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "idea_music_track" (
	"idea_id" uuid,
	"music_track_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "idea_music_track_pkey" PRIMARY KEY("idea_id","music_track_id")
);
--> statement-breakpoint
CREATE TABLE "music_track" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" text NOT NULL,
	"provider_track_id" text NOT NULL,
	"title" text NOT NULL,
	"artist_name" text NOT NULL,
	"album_title" text,
	"artwork_url" text,
	"provider_url" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "music_track_duration_check" CHECK ("duration_ms" is null or "duration_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "registry_commitment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"registry_item_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" "registry_commitment_status" DEFAULT 'active'::"registry_commitment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_commitment_quantity_check" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "registry_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"source_idea_id" uuid,
	"title" text NOT NULL,
	"note" text,
	"category" "registry_category" NOT NULL,
	"price" numeric(14,2),
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_item_price_check" CHECK ("price" is null or "price" >= 0),
	CONSTRAINT "registry_item_quantity_check" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "workspace_planning_settings" (
	"organization_id" text PRIMARY KEY,
	"budget_cap" numeric(14,2),
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"registry_shared" boolean DEFAULT false NOT NULL,
	"collaborator_link_enabled" boolean DEFAULT true NOT NULL,
	"requires_collaborator_approval" boolean DEFAULT true NOT NULL,
	"default_collaborator_permission" "event_planning_permission" DEFAULT 'contribute'::"event_planning_permission" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_planning_budget_cap_check" CHECK ("budget_cap" is null or "budget_cap" >= 0),
	CONSTRAINT "workspace_planning_currency_code_check" CHECK ("currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "native_sync_change" (
	"cursor" bigserial PRIMARY KEY,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"owner_user_id" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"payload" text NOT NULL,
	"server_version" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "native_sync_entity" (
	"scope_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"owner_user_id" text NOT NULL,
	"payload" text NOT NULL,
	"server_version" integer DEFAULT 1 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "native_sync_entity_pkey" PRIMARY KEY("scope_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "native_sync_mutation_receipt" (
	"mutation_id" uuid PRIMARY KEY,
	"owner_user_id" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"disposition" text NOT NULL,
	"server_version" integer,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "native_sync_scope_member" (
	"scope_id" uuid,
	"user_id" text,
	"role" "native_sync_scope_role" DEFAULT 'editor'::"native_sync_scope_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "native_sync_scope_member_pkey" PRIMARY KEY("scope_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "native_workspace_snapshot" (
	"scope_id" uuid PRIMARY KEY,
	"owner_user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"payload" text NOT NULL,
	"server_version" integer DEFAULT 1 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uidx" ON "account" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_uidx" ON "member" ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "team_organizationId_idx" ON "team" ("organization_id");--> statement-breakpoint
CREATE INDEX "teamMember_teamId_idx" ON "team_member" ("team_id");--> statement-breakpoint
CREATE INDEX "teamMember_userId_idx" ON "team_member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_team_user_uidx" ON "team_member" ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "event_organization_id_id_uidx" ON "event" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "event_organization_id_idx" ON "event" ("organization_id");--> statement-breakpoint
CREATE INDEX "event_parent_event_id_idx" ON "event" ("parent_event_id");--> statement-breakpoint
CREATE INDEX "event_organization_starts_at_idx" ON "event" ("organization_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_one_main_per_workspace_uidx" ON "event" ("organization_id") WHERE "parent_event_id" is null;--> statement-breakpoint
CREATE INDEX "event_invitation_event_id_idx" ON "event_invitation" ("event_id");--> statement-breakpoint
CREATE INDEX "event_invitation_email_idx" ON "event_invitation" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "event_invitation_pending_email_uidx" ON "event_invitation" ("event_id","email") WHERE "status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "event_participant_event_person_uidx" ON "event_participant" ("event_id","person_id");--> statement-breakpoint
CREATE INDEX "event_participant_person_id_idx" ON "event_participant" ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_person_organization_id_id_uidx" ON "workspace_person" ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_person_organization_user_uidx" ON "workspace_person" ("organization_id","user_id") WHERE "user_id" is not null;--> statement-breakpoint
CREATE INDEX "workspace_person_organization_email_idx" ON "workspace_person" ("organization_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "event_media_event_asset_role_uidx" ON "event_media" ("event_id","media_asset_id","role");--> statement-breakpoint
CREATE INDEX "event_media_event_sort_idx" ON "event_media" ("event_id","role","sort_order");--> statement-breakpoint
CREATE INDEX "event_media_asset_id_idx" ON "event_media" ("media_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_media_idea_asset_role_uidx" ON "idea_media" ("idea_id","media_asset_id","role");--> statement-breakpoint
CREATE INDEX "idea_media_idea_sort_idx" ON "idea_media" ("idea_id","role","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_storage_key_uidx" ON "media_asset" ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_organization_id_id_uidx" ON "media_asset" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "media_asset_organization_status_idx" ON "media_asset" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "media_asset_uploaded_by_user_id_idx" ON "media_asset" ("uploaded_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_media_item_asset_role_uidx" ON "registry_item_media" ("registry_item_id","media_asset_id","role");--> statement-breakpoint
CREATE INDEX "registry_media_item_sort_idx" ON "registry_item_media" ("registry_item_id","role","sort_order");--> statement-breakpoint
CREATE INDEX "event_expense_event_status_idx" ON "event_expense" ("event_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_expense_source_idea_uidx" ON "event_expense" ("source_idea_id") WHERE "source_idea_id" is not null;--> statement-breakpoint
CREATE INDEX "event_note_event_sent_at_idx" ON "event_note" ("event_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_organization_id_id_uidx" ON "idea" ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_organization_event_id_uidx" ON "idea" ("organization_id","event_id","id");--> statement-breakpoint
CREATE INDEX "idea_event_status_created_idx" ON "idea" ("event_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idea_submitted_by_user_id_idx" ON "idea" ("submitted_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_materialized_event_uidx" ON "idea" ("materialized_event_id") WHERE "materialized_event_id" is not null;--> statement-breakpoint
CREATE INDEX "idea_decision_user_id_idx" ON "idea_decision" ("user_id");--> statement-breakpoint
CREATE INDEX "idea_music_track_sort_idx" ON "idea_music_track" ("idea_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "music_track_provider_id_uidx" ON "music_track" ("provider","provider_track_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_commitment_item_user_uidx" ON "registry_commitment" ("registry_item_id","user_id");--> statement-breakpoint
CREATE INDEX "registry_commitment_user_id_idx" ON "registry_commitment" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_item_organization_id_id_uidx" ON "registry_item" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "registry_item_event_category_idx" ON "registry_item" ("event_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_item_source_idea_uidx" ON "registry_item" ("source_idea_id") WHERE "source_idea_id" is not null;--> statement-breakpoint
CREATE INDEX "native_sync_change_owner_scope_cursor_idx" ON "native_sync_change" ("owner_user_id","scope_id","cursor");--> statement-breakpoint
CREATE INDEX "native_sync_change_scope_cursor_idx" ON "native_sync_change" ("scope_id","cursor");--> statement-breakpoint
CREATE INDEX "native_sync_entity_owner_scope_idx" ON "native_sync_entity" ("owner_user_id","scope_id");--> statement-breakpoint
CREATE INDEX "native_sync_receipt_owner_scope_idx" ON "native_sync_mutation_receipt" ("owner_user_id","scope_id");--> statement-breakpoint
CREATE INDEX "native_sync_scope_member_user_idx" ON "native_sync_scope_member" ("user_id","scope_id");--> statement-breakpoint
CREATE INDEX "native_workspace_snapshot_owner_updated_idx" ON "native_workspace_snapshot" ("owner_user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "native_workspace_snapshot_organization_uidx" ON "native_workspace_snapshot" ("organization_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_parent_same_workspace_fk" FOREIGN KEY ("organization_id","parent_event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_person_id_workspace_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "workspace_person"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_invited_by_user_id_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_accepted_by_user_id_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_person_id_workspace_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "workspace_person"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_person" ADD CONSTRAINT "workspace_person_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_person" ADD CONSTRAINT "workspace_person_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_asset_same_workspace_fk" FOREIGN KEY ("organization_id","media_asset_id") REFERENCES "media_asset"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_media" ADD CONSTRAINT "idea_media_idea_same_workspace_fk" FOREIGN KEY ("organization_id","idea_id") REFERENCES "idea"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_media" ADD CONSTRAINT "idea_media_asset_same_workspace_fk" FOREIGN KEY ("organization_id","media_asset_id") REFERENCES "media_asset"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploaded_by_user_id_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "registry_item_media" ADD CONSTRAINT "registry_media_item_same_workspace_fk" FOREIGN KEY ("organization_id","registry_item_id") REFERENCES "registry_item"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item_media" ADD CONSTRAINT "registry_media_asset_same_workspace_fk" FOREIGN KEY ("organization_id","media_asset_id") REFERENCES "media_asset"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_idea_same_event_fk" FOREIGN KEY ("organization_id","event_id","source_idea_id") REFERENCES "idea"("organization_id","event_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_submitted_by_user_id_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_materialized_event_id_event_id_fkey" FOREIGN KEY ("materialized_event_id") REFERENCES "event"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_decision" ADD CONSTRAINT "idea_decision_idea_id_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_decision" ADD CONSTRAINT "idea_decision_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_music_track" ADD CONSTRAINT "idea_music_track_idea_id_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_music_track" ADD CONSTRAINT "idea_music_track_music_track_id_music_track_id_fkey" FOREIGN KEY ("music_track_id") REFERENCES "music_track"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD CONSTRAINT "registry_commitment_registry_item_id_registry_item_id_fkey" FOREIGN KEY ("registry_item_id") REFERENCES "registry_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD CONSTRAINT "registry_commitment_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_idea_same_event_fk" FOREIGN KEY ("organization_id","event_id","source_idea_id") REFERENCES "idea"("organization_id","event_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_planning_settings" ADD CONSTRAINT "workspace_planning_settings_DhJFXmP4w9T5_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_change" ADD CONSTRAINT "native_sync_change_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_change" ADD CONSTRAINT "native_sync_change_yyDdaGGek66v_fkey" FOREIGN KEY ("scope_id") REFERENCES "native_workspace_snapshot"("scope_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_entity" ADD CONSTRAINT "native_sync_entity_y0TytjqNhSKO_fkey" FOREIGN KEY ("scope_id") REFERENCES "native_workspace_snapshot"("scope_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_entity" ADD CONSTRAINT "native_sync_entity_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_mutation_receipt" ADD CONSTRAINT "native_sync_mutation_receipt_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_scope_member" ADD CONSTRAINT "native_sync_scope_member_bcVvGz1VKcL4_fkey" FOREIGN KEY ("scope_id") REFERENCES "native_workspace_snapshot"("scope_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_scope_member" ADD CONSTRAINT "native_sync_scope_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_workspace_snapshot" ADD CONSTRAINT "native_workspace_snapshot_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_workspace_snapshot" ADD CONSTRAINT "native_workspace_snapshot_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;