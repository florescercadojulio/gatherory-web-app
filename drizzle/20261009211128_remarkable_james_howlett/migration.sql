CREATE TYPE "event_media_role" AS ENUM('cover', 'background', 'gallery');--> statement-breakpoint
CREATE TYPE "media_kind" AS ENUM('image', 'video', 'audio');--> statement-breakpoint
CREATE TYPE "media_status" AS ENUM('pending', 'uploaded', 'processing', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "media_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "event_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" "event_media_role" DEFAULT 'gallery'::"event_media_role" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
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
CREATE UNIQUE INDEX "event_media_event_asset_role_uidx" ON "event_media" ("event_id","media_asset_id","role");--> statement-breakpoint
CREATE INDEX "event_media_event_sort_idx" ON "event_media" ("event_id","role","sort_order");--> statement-breakpoint
CREATE INDEX "event_media_asset_id_idx" ON "event_media" ("media_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_storage_key_uidx" ON "media_asset" ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_organization_id_id_uidx" ON "media_asset" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "media_asset_organization_status_idx" ON "media_asset" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "media_asset_uploaded_by_user_id_idx" ON "media_asset" ("uploaded_by_user_id");--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_asset_same_workspace_fk" FOREIGN KEY ("organization_id","media_asset_id") REFERENCES "media_asset"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploaded_by_user_id_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT;