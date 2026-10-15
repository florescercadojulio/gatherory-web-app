CREATE TABLE "blueprint_installation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" text NOT NULL,
	"request_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"revision_id" uuid,
	"plan" jsonb NOT NULL,
	"source_snapshot" jsonb NOT NULL,
	"provisioning_slug" text NOT NULL UNIQUE,
	"organization_id" text,
	"main_event_id" uuid,
	"state" text DEFAULT 'pending' NOT NULL,
	"lease_token" uuid,
	"lease_until" timestamp with time zone,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_installation_state_check" CHECK ("state" in ('pending','provisioned','completed','failed'))
);
--> statement-breakpoint
CREATE TABLE "blueprint_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"catalog_key" text NOT NULL,
	"revision" integer NOT NULL,
	"content_hash" text NOT NULL,
	"document" jsonb NOT NULL,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_revision_positive" CHECK ("revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "event_experience_configuration" (
	"event_id" uuid PRIMARY KEY,
	"organization_id" text NOT NULL,
	"experience_type" text NOT NULL,
	"category_order" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_guide_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"sort_order" integer NOT NULL,
	"visibility" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_guide_visibility_check" CHECK ("visibility" in ('planning_only','event_participants')),
	CONSTRAINT "event_guide_content_check" CHECK (length("title") between 1 and 120 and length("body") between 1 and 5000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_installation_actor_request_uidx" ON "blueprint_installation" ("actor_user_id","request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_revision_catalog_revision_uidx" ON "blueprint_revision" ("catalog_key","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "event_guide_event_key_uidx" ON "event_guide_section" ("event_id","key");--> statement-breakpoint
ALTER TABLE "blueprint_installation" ADD CONSTRAINT "blueprint_installation_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_installation" ADD CONSTRAINT "blueprint_installation_revision_id_blueprint_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "blueprint_revision"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "blueprint_installation" ADD CONSTRAINT "blueprint_installation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_installation" ADD CONSTRAINT "blueprint_installation_main_event_id_event_id_fkey" FOREIGN KEY ("main_event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_experience_configuration" ADD CONSTRAINT "experience_configuration_event_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_guide_section" ADD CONSTRAINT "event_guide_event_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE FUNCTION protect_blueprint_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.catalog_key IS DISTINCT FROM OLD.catalog_key OR NEW.revision IS DISTINCT FROM OLD.revision
     OR NEW.content_hash IS DISTINCT FROM OLD.content_hash OR NEW.document IS DISTINCT FROM OLD.document THEN
    RAISE EXCEPTION 'Published blueprint revisions are immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER blueprint_revision_immutable BEFORE UPDATE ON blueprint_revision
FOR EACH ROW EXECUTE FUNCTION protect_blueprint_revision();
--> statement-breakpoint
CREATE FUNCTION protect_completed_blueprint_installation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.state = 'completed' AND (NEW.request_hash IS DISTINCT FROM OLD.request_hash
     OR NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id OR NEW.request_id IS DISTINCT FROM OLD.request_id
     OR NEW.plan IS DISTINCT FROM OLD.plan OR NEW.source_snapshot IS DISTINCT FROM OLD.source_snapshot
     OR NEW.result IS DISTINCT FROM OLD.result OR NEW.state IS DISTINCT FROM OLD.state) THEN
    RAISE EXCEPTION 'Completed blueprint installations are immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER blueprint_installation_immutable BEFORE UPDATE ON blueprint_installation
FOR EACH ROW EXECUTE FUNCTION protect_completed_blueprint_installation();
