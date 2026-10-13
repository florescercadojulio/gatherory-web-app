CREATE TABLE "user_block" (
	"user_id" text,
	"blocked_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_block_pkey" PRIMARY KEY("user_id","blocked_user_id"),
	CONSTRAINT "user_block_no_self_check" CHECK ("user_id" <> "blocked_user_id")
);
--> statement-breakpoint
ALTER TABLE "user_block" ADD CONSTRAINT "user_block_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_block" ADD CONSTRAINT "user_block_blocked_user_id_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "user"("id") ON DELETE CASCADE;