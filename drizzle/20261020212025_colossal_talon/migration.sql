ALTER TYPE "native_notification_type" ADD VALUE 'event_announcement';--> statement-breakpoint
CREATE TABLE "event_announcement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"author_user_id" text,
	"request_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_announcement_message_check" CHECK (char_length("message") between 1 and 750 and "message" = btrim("message"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_announcement_request_uidx" ON "event_announcement" ("event_id","author_user_id","request_id");--> statement-breakpoint
CREATE INDEX "event_announcement_history_idx" ON "event_announcement" ("event_id","created_at","id");--> statement-breakpoint
ALTER TABLE "event_announcement" ADD CONSTRAINT "event_announcement_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_announcement" ADD CONSTRAINT "event_announcement_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL;