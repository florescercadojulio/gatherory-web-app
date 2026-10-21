CREATE TABLE "event_guest_claim" (
	"guest_profile_id" uuid,
	"event_id" uuid,
	"claimed_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_guest_claim_pkey" PRIMARY KEY("guest_profile_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "event_guest_profile" (
	"id" uuid PRIMARY KEY,
	"display_name" text NOT NULL,
	"credential_hash" text NOT NULL UNIQUE,
	"claimed_by_user_id" text,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_guest_profile_name_not_blank_check" CHECK (length(trim("display_name")) > 0),
	CONSTRAINT "event_guest_profile_name_length_check" CHECK (char_length("display_name") <= 80),
	CONSTRAINT "event_guest_profile_credential_hash_check" CHECK (char_length("credential_hash") = 64)
);
--> statement-breakpoint
ALTER TABLE "workspace_person" ADD COLUMN "guest_profile_id" uuid;--> statement-breakpoint
CREATE INDEX "event_guest_claim_user_created_idx" ON "event_guest_claim" ("claimed_by_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_person_organization_guest_profile_uidx" ON "workspace_person" ("organization_id","guest_profile_id") WHERE "guest_profile_id" is not null;--> statement-breakpoint
ALTER TABLE "event_guest_claim" ADD CONSTRAINT "event_guest_claim_guest_profile_id_event_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "event_guest_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_guest_claim" ADD CONSTRAINT "event_guest_claim_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_guest_claim" ADD CONSTRAINT "event_guest_claim_claimed_by_user_id_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_guest_profile" ADD CONSTRAINT "event_guest_profile_claimed_by_user_id_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "workspace_person" ADD CONSTRAINT "workspace_person_guest_profile_id_event_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "event_guest_profile"("id") ON DELETE SET NULL;