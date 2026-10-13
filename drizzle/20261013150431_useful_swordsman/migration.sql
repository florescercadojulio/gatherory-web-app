CREATE TYPE "abuse_report_status" AS ENUM('open', 'in_review', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "abuse_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reporter_user_id" text,
	"media_asset_id" uuid,
	"reported_user_id" text,
	"reason" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"status" "abuse_report_status" DEFAULT 'open'::"abuse_report_status" NOT NULL,
	"resolution" text,
	"reviewed_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "abuse_report_reason_check" CHECK ("reason" in ('inappropriate', 'harassment', 'privacy', 'other')),
	CONSTRAINT "abuse_report_resolution_check" CHECK (("status" in ('open', 'in_review') and "resolution" is null) or ("status" = 'resolved' and "resolution" = 'hidden') or ("status" = 'dismissed' and "resolution" = 'kept'))
);
--> statement-breakpoint
CREATE TABLE "abuse_report_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"report_id" uuid NOT NULL,
	"actor_user_id" text,
	"previous_status" "abuse_report_status" NOT NULL,
	"status" "abuse_report_status" NOT NULL,
	"action" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hidden_media" (
	"user_id" text,
	"media_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hidden_media_pkey" PRIMARY KEY("user_id","media_asset_id")
);
--> statement-breakpoint
CREATE TABLE "moderation_staff" (
	"user_id" text PRIMARY KEY,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "moderation_hidden_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "abuse_report_reporter_media_uidx" ON "abuse_report" ("reporter_user_id","media_asset_id");--> statement-breakpoint
CREATE INDEX "abuse_report_status_created_idx" ON "abuse_report" ("status","created_at");--> statement-breakpoint
CREATE INDEX "abuse_report_review_report_idx" ON "abuse_report_review" ("report_id","created_at");--> statement-breakpoint
ALTER TABLE "abuse_report" ADD CONSTRAINT "abuse_report_reporter_user_id_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "abuse_report" ADD CONSTRAINT "abuse_report_media_asset_id_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_asset"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "abuse_report" ADD CONSTRAINT "abuse_report_reported_user_id_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "abuse_report" ADD CONSTRAINT "abuse_report_reviewed_by_user_id_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "abuse_report_review" ADD CONSTRAINT "abuse_report_review_report_id_abuse_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "abuse_report"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "abuse_report_review" ADD CONSTRAINT "abuse_report_review_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "hidden_media" ADD CONSTRAINT "hidden_media_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hidden_media" ADD CONSTRAINT "hidden_media_media_asset_id_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_asset"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moderation_staff" ADD CONSTRAINT "moderation_staff_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;