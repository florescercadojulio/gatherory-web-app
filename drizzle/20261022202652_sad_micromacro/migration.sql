-- Pre-release measurement reset: acceptedAt/sequence cannot be fabricated for
-- existing transaction-time rows. Clear only discovery measurement chains
-- before adding required accepted evidence; keep functional preferences,
-- measurement settings, private copies/events, and authentication records.
delete from "blueprint_preference_mutation" where "kind" = 'signal';--> statement-breakpoint
delete from "blueprint_discovery_exposure";--> statement-breakpoint
CREATE TABLE "blueprint_discovery_serving_daily" (
	"actor_user_id" text NOT NULL,
	"signal_date" date NOT NULL,
	"surface" text NOT NULL,
	"policy_mode" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"configuration_version" text NOT NULL,
	"configuration_digest" text NOT NULL,
	"requested_item_attempts" integer DEFAULT 0 NOT NULL,
	"eligible_items" integer DEFAULT 0 NOT NULL,
	"issued_exposures" integer DEFAULT 0 NOT NULL,
	"reused_exposures" integer DEFAULT 0 NOT NULL,
	"quota_denied_items" integer DEFAULT 0 NOT NULL,
	"source_ineligible_items" integer DEFAULT 0 NOT NULL,
	"last_accepted_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_discovery_serving_daily_surface_check" CHECK ("surface" in ('browse', 'category', 'search')),
	CONSTRAINT "blueprint_discovery_serving_daily_policy_check" CHECK ("policy_mode" in ('baseline_v1', 'catalog')),
	CONSTRAINT "blueprint_discovery_serving_daily_configuration_digest_check" CHECK ("configuration_digest" = 'unknown' or "configuration_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "blueprint_discovery_serving_daily_counts_check" CHECK ("requested_item_attempts" >= 0 and "eligible_items" >= 0 and "issued_exposures" >= 0 and "reused_exposures" >= 0 and "quota_denied_items" >= 0 and "source_ineligible_items" >= 0),
	CONSTRAINT "blueprint_discovery_serving_daily_conservation_check" CHECK ("requested_item_attempts" = "eligible_items" + "source_ineligible_items" and "eligible_items" = "issued_exposures" + "reused_exposures" + "quota_denied_items")
);
--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD COLUMN "matched_impression_id" uuid;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD COLUMN "accepted_at" timestamp with time zone NOT NULL;--> statement-breakpoint
CREATE SEQUENCE "blueprint_discovery_signal_accepted_sequence_seq" AS bigint;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD COLUMN "accepted_sequence" bigint NOT NULL DEFAULT nextval('blueprint_discovery_signal_accepted_sequence_seq'::regclass);--> statement-breakpoint
ALTER SEQUENCE "blueprint_discovery_signal_accepted_sequence_seq" OWNED BY "blueprint_discovery_signal"."accepted_sequence";--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_discovery_serving_daily_identity_uidx" ON "blueprint_discovery_serving_daily" ("actor_user_id","signal_date","surface","policy_mode","algorithm_version","configuration_version","configuration_digest");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_serving_daily_retention_idx" ON "blueprint_discovery_serving_daily" ("last_accepted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_discovery_signal_accepted_sequence_uidx" ON "blueprint_discovery_signal" ("accepted_sequence");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_signal_actor_accepted_idx" ON "blueprint_discovery_signal" ("actor_user_id","accepted_at");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_signal_exposure_order_idx" ON "blueprint_discovery_signal" ("actor_user_id","exposure_id","accepted_sequence");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_signal_accepted_idx" ON "blueprint_discovery_signal" ("accepted_at");--> statement-breakpoint
ALTER TABLE "blueprint_discovery_serving_daily" ADD CONSTRAINT "blueprint_discovery_serving_daily_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD CONSTRAINT "blueprint_discovery_signal_W84IuJLLG640_fkey" FOREIGN KEY ("matched_impression_id") REFERENCES "blueprint_discovery_signal"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD CONSTRAINT "blueprint_discovery_signal_matched_impression_check" CHECK ("matched_impression_id" is null or ("kind" = 'open' and "matched_impression_id" <> "id"));
