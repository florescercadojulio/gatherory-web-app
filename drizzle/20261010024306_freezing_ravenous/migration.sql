CREATE TYPE "event_category" AS ENUM('venue', 'food_tasting', 'photography', 'honeymoon', 'attire_fitting', 'wedding_shower', 'bachelor_bachelorette', 'rehearsal', 'ceremony', 'reception', 'other');--> statement-breakpoint
CREATE TYPE "event_completion_status" AS ENUM('upcoming', 'complete');--> statement-breakpoint
CREATE TYPE "event_planning_mode" AS ENUM('open_to_ideas', 'help_me_decide', 'quiet_planning', 'decision_made');--> statement-breakpoint
CREATE TYPE "event_planning_status" AS ENUM('draft', 'approved', 'not_sure', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "event_scheduling_state" AS ENUM('scheduled', 'unscheduled');--> statement-breakpoint
CREATE TYPE "planning_media_role" AS ENUM('cover', 'gallery');--> statement-breakpoint
CREATE TYPE "expense_category" AS ENUM('venue', 'food_and_drink', 'attire', 'decor', 'entertainment', 'photography', 'stationery', 'travel', 'gifts', 'other');--> statement-breakpoint
CREATE TYPE "expense_status" AS ENUM('estimated', 'committed', 'paid');--> statement-breakpoint
CREATE TYPE "idea_category" AS ENUM('event', 'registry', 'venue', 'attire', 'flowers', 'food', 'photography', 'music', 'decor', 'invitations', 'honeymoon', 'other');--> statement-breakpoint
CREATE TYPE "idea_decision_choice" AS ENUM('pass', 'maybe', 'love');--> statement-breakpoint
CREATE TYPE "idea_status" AS ENUM('new', 'maybe', 'shortlisted', 'approved', 'passed', 'archived');--> statement-breakpoint
CREATE TYPE "registry_category" AS ENUM('home', 'kitchen', 'travel', 'experience', 'cash_fund');--> statement-breakpoint
CREATE TYPE "registry_commitment_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TABLE "idea_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"idea_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" "planning_media_role" DEFAULT 'gallery'::"planning_media_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registry_item_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"registry_item_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" "planning_media_role" DEFAULT 'gallery'::"planning_media_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_expense_amount_check" CHECK ("amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
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
	"title" text,
	"note" text,
	"estimated_cost" numeric(14,2),
	"configuration" jsonb NOT NULL,
	"submitted_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idea_estimated_cost_check" CHECK ("estimated_cost" is null or "estimated_cost" >= 0)
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
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_item_price_check" CHECK ("price" is null or "price" >= 0),
	CONSTRAINT "registry_item_quantity_check" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "workspace_planning_settings" (
	"organization_id" text PRIMARY KEY,
	"budget_cap" numeric(14,2),
	"registry_shared" boolean DEFAULT false NOT NULL,
	"collaborator_link_enabled" boolean DEFAULT true NOT NULL,
	"requires_collaborator_approval" boolean DEFAULT true NOT NULL,
	"default_collaborator_permission" "event_planning_permission" DEFAULT 'contribute'::"event_planning_permission" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_planning_budget_cap_check" CHECK ("budget_cap" is null or "budget_cap" >= 0)
);
--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "dress_code" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "planning_status" "event_planning_status";--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "completion_status" "event_completion_status" DEFAULT 'upcoming'::"event_completion_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "scheduling_state" "event_scheduling_state" DEFAULT 'scheduled'::"event_scheduling_state" NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "category" "event_category";--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "planning_mode" "event_planning_mode" DEFAULT 'open_to_ideas'::"event_planning_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "is_all_day" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_address_line_2" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_latitude" double precision;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "location_longitude" double precision;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "map_item_identifier" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "budget_cap" numeric(14,2);--> statement-breakpoint
UPDATE "event"
SET
	"planning_status" = 'approved'::"event_planning_status",
	"category" = 'other'::"event_category"
WHERE "parent_event_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "workspace_planning_settings" ("organization_id")
SELECT "id" FROM "organization"
ON CONFLICT ("organization_id") DO NOTHING;--> statement-breakpoint
CREATE UNIQUE INDEX "event_one_main_per_workspace_uidx" ON "event" ("organization_id") WHERE "parent_event_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "idea_media_idea_asset_role_uidx" ON "idea_media" ("idea_id","media_asset_id","role");--> statement-breakpoint
CREATE INDEX "idea_media_idea_sort_idx" ON "idea_media" ("idea_id","role","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_media_item_asset_role_uidx" ON "registry_item_media" ("registry_item_id","media_asset_id","role");--> statement-breakpoint
CREATE INDEX "registry_media_item_sort_idx" ON "registry_item_media" ("registry_item_id","role","sort_order");--> statement-breakpoint
CREATE INDEX "event_expense_event_status_idx" ON "event_expense" ("event_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_expense_source_idea_uidx" ON "event_expense" ("source_idea_id") WHERE "source_idea_id" is not null;--> statement-breakpoint
CREATE INDEX "event_note_event_sent_at_idx" ON "event_note" ("event_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_organization_id_id_uidx" ON "idea" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "idea_event_status_created_idx" ON "idea" ("event_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idea_submitted_by_user_id_idx" ON "idea" ("submitted_by_user_id");--> statement-breakpoint
CREATE INDEX "idea_decision_user_id_idx" ON "idea_decision" ("user_id");--> statement-breakpoint
CREATE INDEX "idea_music_track_sort_idx" ON "idea_music_track" ("idea_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "music_track_provider_id_uidx" ON "music_track" ("provider","provider_track_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_commitment_item_user_uidx" ON "registry_commitment" ("registry_item_id","user_id");--> statement-breakpoint
CREATE INDEX "registry_commitment_user_id_idx" ON "registry_commitment" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_item_organization_id_id_uidx" ON "registry_item" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "registry_item_event_category_idx" ON "registry_item" ("event_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_item_source_idea_uidx" ON "registry_item" ("source_idea_id") WHERE "source_idea_id" is not null;--> statement-breakpoint
ALTER TABLE "idea_media" ADD CONSTRAINT "idea_media_idea_same_workspace_fk" FOREIGN KEY ("organization_id","idea_id") REFERENCES "idea"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_media" ADD CONSTRAINT "idea_media_asset_same_workspace_fk" FOREIGN KEY ("organization_id","media_asset_id") REFERENCES "media_asset"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item_media" ADD CONSTRAINT "registry_media_item_same_workspace_fk" FOREIGN KEY ("organization_id","registry_item_id") REFERENCES "registry_item"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item_media" ADD CONSTRAINT "registry_media_asset_same_workspace_fk" FOREIGN KEY ("organization_id","media_asset_id") REFERENCES "media_asset"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_idea_same_workspace_fk" FOREIGN KEY ("organization_id","source_idea_id") REFERENCES "idea"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_submitted_by_user_id_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_decision" ADD CONSTRAINT "idea_decision_idea_id_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_decision" ADD CONSTRAINT "idea_decision_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_music_track" ADD CONSTRAINT "idea_music_track_idea_id_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "idea"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "idea_music_track" ADD CONSTRAINT "idea_music_track_music_track_id_music_track_id_fkey" FOREIGN KEY ("music_track_id") REFERENCES "music_track"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD CONSTRAINT "registry_commitment_registry_item_id_registry_item_id_fkey" FOREIGN KEY ("registry_item_id") REFERENCES "registry_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD CONSTRAINT "registry_commitment_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_idea_same_workspace_fk" FOREIGN KEY ("organization_id","source_idea_id") REFERENCES "idea"("organization_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "workspace_planning_settings" ADD CONSTRAINT "workspace_planning_settings_DhJFXmP4w9T5_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_child_metadata_matches_hierarchy_check" CHECK (("parent_event_id" is null and "category" is null and "planning_status" is null) or ("parent_event_id" is not null and "category" is not null and "planning_status" is not null));--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_location_coordinate_pair_check" CHECK (("location_latitude" is null and "location_longitude" is null) or ("location_latitude" is not null and "location_longitude" is not null and "location_latitude" between -90 and 90 and "location_longitude" between -180 and 180));--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_budget_cap_check" CHECK ("budget_cap" is null or "budget_cap" >= 0);
