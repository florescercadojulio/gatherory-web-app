CREATE TABLE "event_share_link" (
	"event_id" uuid PRIMARY KEY,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"role" text DEFAULT 'guest' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_share_link_role_check" CHECK ("role" in ('guest', 'collaborator'))
);
--> statement-breakpoint
ALTER TABLE "event_share_link" ADD CONSTRAINT "event_share_link_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_share_link" ADD CONSTRAINT "event_share_link_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE;