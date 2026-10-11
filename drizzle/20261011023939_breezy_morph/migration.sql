CREATE TABLE "native_sync_entity" (
	"scope_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"owner_user_id" text NOT NULL,
	"payload" text NOT NULL,
	"server_version" integer DEFAULT 1 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "native_sync_entity_pkey" PRIMARY KEY("scope_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE INDEX "native_sync_entity_owner_scope_idx" ON "native_sync_entity" ("owner_user_id","scope_id");--> statement-breakpoint
ALTER TABLE "native_sync_entity" ADD CONSTRAINT "native_sync_entity_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;