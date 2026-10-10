ALTER TABLE "event" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event_invitation" ALTER COLUMN "invited_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_asset" ALTER COLUMN "uploaded_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event_expense" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event_note" ALTER COLUMN "author_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "idea" ALTER COLUMN "submitted_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "registry_item" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" DROP CONSTRAINT "event_created_by_user_id_user_id_fkey", ADD CONSTRAINT "event_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_invitation" DROP CONSTRAINT "event_invitation_invited_by_user_id_user_id_fkey", ADD CONSTRAINT "event_invitation_invited_by_user_id_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "media_asset" DROP CONSTRAINT "media_asset_uploaded_by_user_id_user_id_fkey", ADD CONSTRAINT "media_asset_uploaded_by_user_id_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_expense" DROP CONSTRAINT "event_expense_created_by_user_id_user_id_fkey", ADD CONSTRAINT "event_expense_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "event_note" DROP CONSTRAINT "event_note_author_user_id_user_id_fkey", ADD CONSTRAINT "event_note_author_user_id_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "idea" DROP CONSTRAINT "idea_submitted_by_user_id_user_id_fkey", ADD CONSTRAINT "idea_submitted_by_user_id_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "registry_item" DROP CONSTRAINT "registry_item_created_by_user_id_user_id_fkey", ADD CONSTRAINT "registry_item_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;