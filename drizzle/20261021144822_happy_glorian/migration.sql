ALTER TABLE "event_share_link" DROP CONSTRAINT "event_share_link_pkey";--> statement-breakpoint
ALTER TABLE "event_share_link" ADD PRIMARY KEY ("event_id","role");--> statement-breakpoint
ALTER TABLE "event_share_link" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
UPDATE "event_share_link" SET "expires_at" = NULL WHERE "revoked_at" IS NULL AND "expires_at" > now();
