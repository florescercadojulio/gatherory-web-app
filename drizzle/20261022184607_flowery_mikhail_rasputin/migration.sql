CREATE TABLE "blueprint_attribution_acquisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" text NOT NULL,
	"exposure_id" uuid NOT NULL,
	"copy_template_id" uuid NOT NULL,
	"copy_revision_id" uuid NOT NULL,
	"copy_content_hash" text NOT NULL,
	"source_catalog_key" text NOT NULL,
	"source_revision" integer NOT NULL,
	"source_content_hash" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blueprint_attribution_acquisition_hash_check" CHECK ("copy_content_hash" ~ '^[0-9a-f]{64}$' and "source_content_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "blueprint_attribution_acquisition_expiry_check" CHECK ("expires_at" > "acquired_at")
);
--> statement-breakpoint
CREATE TABLE "blueprint_qualified_adoption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" text NOT NULL,
	"acquisition_id" uuid NOT NULL,
	"installation_id" uuid NOT NULL,
	"source_catalog_key" text NOT NULL,
	"source_revision" integer NOT NULL,
	"source_content_hash" text NOT NULL,
	"qualified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_qualified_adoption_hash_check" CHECK ("source_content_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "blueprint_discovery_exposure" (
	"exposure_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" text NOT NULL,
	"catalog_key" text NOT NULL,
	"source_revision" integer NOT NULL,
	"content_hash" text NOT NULL,
	"surface" text NOT NULL,
	"rank" integer NOT NULL,
	"snapshot_id" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "blueprint_discovery_exposure_revision_positive" CHECK ("source_revision" > 0),
	CONSTRAINT "blueprint_discovery_exposure_hash_check" CHECK ("content_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "blueprint_discovery_exposure_rank_check" CHECK ("rank" > 0),
	CONSTRAINT "blueprint_discovery_exposure_expiry_check" CHECK ("expires_at" > "issued_at")
);
--> statement-breakpoint
CREATE TABLE "blueprint_discovery_signal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" text NOT NULL,
	"exposure_id" uuid NOT NULL,
	"catalog_key" text NOT NULL,
	"signal_date" date NOT NULL,
	"request_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"kind" text NOT NULL,
	"rank_eligible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_discovery_signal_hash_check" CHECK ("request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "blueprint_measurement_setting" (
	"actor_user_id" text PRIMARY KEY,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprint_preference" (
	"actor_user_id" text NOT NULL,
	"catalog_key" text NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"like_revision" integer,
	"like_content_hash" text,
	"bookmarked" boolean DEFAULT false NOT NULL,
	"bookmark_revision" integer,
	"bookmark_content_hash" text,
	"not_interested" boolean DEFAULT false NOT NULL,
	"not_interested_revision" integer,
	"not_interested_content_hash" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_preference_any_enabled_check" CHECK ("liked" or "bookmarked" or "not_interested"),
	CONSTRAINT "blueprint_preference_versions_check" CHECK (("like_revision" is null or ("like_revision" > 0 and "like_content_hash" ~ '^[0-9a-f]{64}$')) and ("bookmark_revision" is null or ("bookmark_revision" > 0 and "bookmark_content_hash" ~ '^[0-9a-f]{64}$')) and ("not_interested_revision" is null or ("not_interested_revision" > 0 and "not_interested_content_hash" ~ '^[0-9a-f]{64}$')))
);
--> statement-breakpoint
CREATE TABLE "blueprint_preference_mutation" (
	"actor_user_id" text NOT NULL,
	"request_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"kind" text NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_preference_mutation_hash_check" CHECK ("request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_attribution_acquisition_copy_uidx" ON "blueprint_attribution_acquisition" ("copy_template_id");--> statement-breakpoint
CREATE INDEX "blueprint_attribution_acquisition_actor_source_idx" ON "blueprint_attribution_acquisition" ("actor_user_id","source_catalog_key","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_qualified_adoption_actor_source_uidx" ON "blueprint_qualified_adoption" ("actor_user_id","source_catalog_key");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_qualified_adoption_installation_uidx" ON "blueprint_qualified_adoption" ("installation_id");--> statement-breakpoint
CREATE INDEX "blueprint_qualified_adoption_source_time_idx" ON "blueprint_qualified_adoption" ("source_catalog_key","qualified_at");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_exposure_actor_expiry_idx" ON "blueprint_discovery_exposure" ("actor_user_id","expires_at");--> statement-breakpoint
CREATE INDEX "blueprint_discovery_exposure_expiry_idx" ON "blueprint_discovery_exposure" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_discovery_signal_actor_request_uidx" ON "blueprint_discovery_signal" ("actor_user_id","request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_discovery_signal_actor_exposure_kind_uidx" ON "blueprint_discovery_signal" ("actor_user_id","exposure_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_discovery_signal_daily_credit_uidx" ON "blueprint_discovery_signal" ("actor_user_id","catalog_key","signal_date","kind") WHERE "rank_eligible";--> statement-breakpoint
CREATE INDEX "blueprint_discovery_signal_actor_created_idx" ON "blueprint_discovery_signal" ("actor_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_preference_actor_catalog_uidx" ON "blueprint_preference" ("actor_user_id","catalog_key");--> statement-breakpoint
CREATE INDEX "blueprint_preference_actor_bookmark_idx" ON "blueprint_preference" ("actor_user_id","bookmarked","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_preference_mutation_actor_request_uidx" ON "blueprint_preference_mutation" ("actor_user_id","request_id");--> statement-breakpoint
ALTER TABLE "blueprint_attribution_acquisition" ADD CONSTRAINT "blueprint_attribution_acquisition_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_attribution_acquisition" ADD CONSTRAINT "blueprint_attribution_acquisition_OfwJSw7p5lkA_fkey" FOREIGN KEY ("exposure_id") REFERENCES "blueprint_discovery_exposure"("exposure_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_attribution_acquisition" ADD CONSTRAINT "blueprint_attribution_acquisition_1VgptycQtdaH_fkey" FOREIGN KEY ("copy_template_id") REFERENCES "blueprint_template"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_attribution_acquisition" ADD CONSTRAINT "blueprint_attribution_acquisition_iHDQotGtZJ57_fkey" FOREIGN KEY ("copy_revision_id") REFERENCES "blueprint_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_qualified_adoption" ADD CONSTRAINT "blueprint_qualified_adoption_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_qualified_adoption" ADD CONSTRAINT "blueprint_qualified_adoption_mArr1FcDDPSf_fkey" FOREIGN KEY ("acquisition_id") REFERENCES "blueprint_attribution_acquisition"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_qualified_adoption" ADD CONSTRAINT "blueprint_qualified_adoption_yTDzQBy5oGsZ_fkey" FOREIGN KEY ("installation_id") REFERENCES "blueprint_installation"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_exposure" ADD CONSTRAINT "blueprint_discovery_exposure_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD CONSTRAINT "blueprint_discovery_signal_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_discovery_signal" ADD CONSTRAINT "blueprint_discovery_signal_2JXOaxFbQjCs_fkey" FOREIGN KEY ("exposure_id") REFERENCES "blueprint_discovery_exposure"("exposure_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_measurement_setting" ADD CONSTRAINT "blueprint_measurement_setting_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_preference" ADD CONSTRAINT "blueprint_preference_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_preference_mutation" ADD CONSTRAINT "blueprint_preference_mutation_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;