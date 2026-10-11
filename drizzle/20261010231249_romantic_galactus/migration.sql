CREATE TABLE "native_sync_change" (
	"cursor" bigserial PRIMARY KEY,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"owner_user_id" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"payload" text NOT NULL,
	"server_version" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "native_sync_mutation_receipt" (
	"mutation_id" uuid PRIMARY KEY,
	"owner_user_id" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"disposition" text NOT NULL,
	"server_version" integer,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "native_workspace_snapshot" (
	"scope_id" uuid PRIMARY KEY,
	"owner_user_id" text NOT NULL,
	"payload" text NOT NULL,
	"server_version" integer DEFAULT 1 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "native_sync_change_owner_scope_cursor_idx" ON "native_sync_change" ("owner_user_id","scope_id","cursor");--> statement-breakpoint
CREATE INDEX "native_sync_receipt_owner_scope_idx" ON "native_sync_mutation_receipt" ("owner_user_id","scope_id");--> statement-breakpoint
CREATE INDEX "native_workspace_snapshot_owner_updated_idx" ON "native_workspace_snapshot" ("owner_user_id","updated_at");--> statement-breakpoint
ALTER TABLE "native_sync_change" ADD CONSTRAINT "native_sync_change_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_sync_mutation_receipt" ADD CONSTRAINT "native_sync_mutation_receipt_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "native_workspace_snapshot" ADD CONSTRAINT "native_workspace_snapshot_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE;