CREATE TABLE "registry_reservation_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"guest_profile_id" uuid,
	"request_id" uuid NOT NULL,
	"registry_item_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_reservation_request_exact_actor_check" CHECK (("user_id" is not null and "guest_profile_id" is null) or ("user_id" is null and "guest_profile_id" is not null)),
	CONSTRAINT "registry_reservation_request_hash_check" CHECK ("request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD COLUMN "guest_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "registry_commitment" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX "registry_commitment_item_user_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "registry_commitment_item_user_uidx" ON "registry_commitment" ("registry_item_id","user_id") WHERE "user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "registry_commitment_item_guest_uidx" ON "registry_commitment" ("registry_item_id","guest_profile_id") WHERE "guest_profile_id" is not null;--> statement-breakpoint
CREATE INDEX "registry_commitment_guest_profile_id_idx" ON "registry_commitment" ("guest_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_reservation_request_user_request_uidx" ON "registry_reservation_request" ("user_id","request_id") WHERE "user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "registry_reservation_request_guest_request_uidx" ON "registry_reservation_request" ("guest_profile_id","request_id") WHERE "guest_profile_id" is not null;--> statement-breakpoint
CREATE INDEX "registry_reservation_request_item_created_idx" ON "registry_reservation_request" ("registry_item_id","created_at");--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD CONSTRAINT "registry_commitment_MxvTGq65OJtY_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "event_guest_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_reservation_request" ADD CONSTRAINT "registry_reservation_request_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_reservation_request" ADD CONSTRAINT "registry_reservation_request_KR0rLcGor6Fl_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "event_guest_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_reservation_request" ADD CONSTRAINT "registry_reservation_request_LNDECjGeTDWo_fkey" FOREIGN KEY ("registry_item_id") REFERENCES "registry_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registry_commitment" ADD CONSTRAINT "registry_commitment_exact_actor_check" CHECK (("user_id" is not null and "guest_profile_id" is null) or ("user_id" is null and "guest_profile_id" is not null));