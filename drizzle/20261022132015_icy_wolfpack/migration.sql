CREATE TABLE "blueprint_cover_asset" (
	"id" uuid PRIMARY KEY,
	"owner_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"storage_provider" text DEFAULT 'r2' NOT NULL,
	"bucket" text NOT NULL,
	"original_storage_key" text NOT NULL,
	"variant_storage_keys" jsonb,
	"original_filename" text NOT NULL,
	"content_type" text DEFAULT 'image/jpeg' NOT NULL,
	"byte_size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "blueprint_cover_asset_status_check" CHECK ("status" in ('pending','processing','ready','failed','deleted')),
	CONSTRAINT "blueprint_cover_asset_bytes_check" CHECK ("byte_size" > 0),
	CONSTRAINT "blueprint_cover_asset_dimensions_check" CHECK (("width" is null or "width" > 0) and ("height" is null or "height" > 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_cover_asset_original_storage_key_uidx" ON "blueprint_cover_asset" ("original_storage_key");--> statement-breakpoint
CREATE INDEX "blueprint_cover_asset_owner_status_idx" ON "blueprint_cover_asset" ("owner_user_id","status");--> statement-breakpoint
ALTER TABLE "blueprint_cover_asset" ADD CONSTRAINT "blueprint_cover_asset_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;