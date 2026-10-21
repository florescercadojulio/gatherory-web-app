ALTER TABLE "notification_installation" ADD COLUMN "locale" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_installation" ALTER COLUMN "recipient_kind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_installation" ALTER COLUMN "recipient_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_installation" ALTER COLUMN "platform" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_installation" ALTER COLUMN "token_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_installation" ALTER COLUMN "token_ciphertext" DROP NOT NULL;--> statement-breakpoint
DROP INDEX "notification_installation_token_hash_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "notification_installation_token_hash_uidx" ON "notification_installation" ("token_hash") WHERE "token_hash" is not null;--> statement-breakpoint
ALTER TABLE "notification_installation" DROP CONSTRAINT "notification_installation_token_hash_check", ADD CONSTRAINT "notification_installation_token_hash_check" CHECK ("token_hash" is null or char_length("token_hash") = 64);