CREATE TABLE "blueprint_share_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision_id" uuid NOT NULL,
	"token_hash" text NOT NULL UNIQUE,
	"created_by_user_id" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_share_link_hash_check" CHECK ("token_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "blueprint_installation" ADD COLUMN "share_token_hash" text;--> statement-breakpoint
ALTER TABLE "blueprint_share_link" ADD CONSTRAINT "blueprint_share_link_revision_id_blueprint_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "blueprint_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_share_link" ADD CONSTRAINT "blueprint_share_link_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE;