CREATE TYPE "native_sync_scope_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "native_sync_scope_member" (
	"scope_id" uuid,
	"user_id" text,
	"role" "native_sync_scope_role" DEFAULT 'editor'::"native_sync_scope_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "native_sync_scope_member_pkey" PRIMARY KEY("scope_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "workspace_planning_settings" ADD COLUMN "currency_code" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uidx" ON "account" ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_uidx" ON "member" ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_team_user_uidx" ON "team_member" ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "native_sync_scope_member_user_idx" ON "native_sync_scope_member" ("user_id","scope_id");--> statement-breakpoint
ALTER TABLE "native_sync_change" ADD CONSTRAINT "native_sync_change_yyDdaGGek66v_fkey" FOREIGN KEY ("scope_id") REFERENCES "native_workspace_snapshot"("scope_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_entity" ADD CONSTRAINT "native_sync_entity_y0TytjqNhSKO_fkey" FOREIGN KEY ("scope_id") REFERENCES "native_workspace_snapshot"("scope_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_scope_member" ADD CONSTRAINT "native_sync_scope_member_bcVvGz1VKcL4_fkey" FOREIGN KEY ("scope_id") REFERENCES "native_workspace_snapshot"("scope_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_scope_member" ADD CONSTRAINT "native_sync_scope_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_title_not_blank_check" CHECK (length(trim("title")) > 0);--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_time_zone_not_blank_check" CHECK (length(trim("time_zone")) > 0);--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_role_permission_check" CHECK (("role" = 'host' and "planning_permission" = 'manage') or ("role" = 'collaborator' and "planning_permission" in ('manage', 'contribute', 'view_only')) or ("role" = 'guest' and "planning_permission" = 'view_only'));--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_role_permission_check" CHECK (("role" = 'host' and "planning_permission" = 'manage') or ("role" = 'collaborator' and "planning_permission" in ('manage', 'contribute', 'view_only')) or ("role" = 'guest' and "planning_permission" = 'view_only'));--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_sort_order_check" CHECK ("sort_order" >= 0);--> statement-breakpoint
ALTER TABLE "idea_media" ADD CONSTRAINT "idea_media_sort_order_check" CHECK ("sort_order" >= 0);--> statement-breakpoint
ALTER TABLE "registry_item_media" ADD CONSTRAINT "registry_media_sort_order_check" CHECK ("sort_order" >= 0);--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_configuration_version_check" CHECK (jsonb_typeof("configuration") = 'object' and "configuration" @> '{"version": 1}'::jsonb);--> statement-breakpoint
ALTER TABLE "workspace_planning_settings" ADD CONSTRAINT "workspace_planning_currency_code_check" CHECK ("currency_code" ~ '^[A-Z]{3}$');