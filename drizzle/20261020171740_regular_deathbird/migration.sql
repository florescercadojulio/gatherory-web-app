CREATE TYPE "native_notification_state" AS ENUM('pending', 'leased', 'delivered', 'discarded');--> statement-breakpoint
CREATE TYPE "native_notification_type" AS ENUM('assignment_changed', 'event_changed');--> statement-breakpoint
CREATE TYPE "notification_platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TYPE "notification_recipient_kind" AS ENUM('user', 'device_guest');--> statement-breakpoint
CREATE TABLE "native_notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dedupe_key" text NOT NULL,
	"mutation_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"entity_id" text NOT NULL,
	"source_revision" text,
	"recipient_kind" "notification_recipient_kind" NOT NULL,
	"recipient_id" text NOT NULL,
	"type" "native_notification_type" NOT NULL,
	"state" "native_notification_state" DEFAULT 'pending'::"native_notification_state" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"lease_key" uuid,
	"accepted_installation_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"delivered_at" timestamp with time zone,
	"last_failure" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "native_notification_outbox_attempts_check" CHECK ("attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "notification_installation" (
	"id" uuid PRIMARY KEY,
	"installation_secret_hash" text NOT NULL,
	"recipient_kind" "notification_recipient_kind" NOT NULL,
	"recipient_id" text NOT NULL,
	"platform" "notification_platform" NOT NULL,
	"token_hash" text NOT NULL,
	"token_ciphertext" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"binding_generation" integer DEFAULT 1 NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"detached_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_installation_secret_hash_check" CHECK (char_length("installation_secret_hash") = 64),
	CONSTRAINT "notification_installation_token_hash_check" CHECK (char_length("token_hash") = 64),
	CONSTRAINT "notification_installation_generation_check" CHECK ("binding_generation" > 0),
	CONSTRAINT "notification_installation_revision_check" CHECK ("revision" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "native_notification_outbox_dedupe_uidx" ON "native_notification_outbox" ("dedupe_key");--> statement-breakpoint
CREATE INDEX "native_notification_outbox_pending_idx" ON "native_notification_outbox" ("state","next_attempt_at");--> statement-breakpoint
CREATE INDEX "native_notification_outbox_recipient_idx" ON "native_notification_outbox" ("recipient_kind","recipient_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_installation_token_hash_uidx" ON "notification_installation" ("token_hash");--> statement-breakpoint
CREATE INDEX "notification_installation_recipient_idx" ON "notification_installation" ("recipient_kind","recipient_id","enabled","detached_at");