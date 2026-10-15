CREATE TABLE "blueprint_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"catalog_key" text NOT NULL UNIQUE,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"create_request_id" uuid NOT NULL,
	"create_request_hash" text NOT NULL,
	"content" jsonb NOT NULL,
	"draft_version" integer DEFAULT 1 NOT NULL,
	"published_revision" integer,
	"published_draft_version" integer,
	"source" jsonb,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blueprint_template_version_positive" CHECK ("draft_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "blueprint_revision" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "blueprint_revision" ADD COLUMN "draft_version" integer;--> statement-breakpoint
ALTER TABLE "blueprint_revision" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "blueprint_revision" ADD COLUMN "authored_locale" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_revision_template_draft_uidx" ON "blueprint_revision" ("template_id","draft_version");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_template_creator_request_uidx" ON "blueprint_template" ("created_by_user_id","create_request_id");--> statement-breakpoint
ALTER TABLE "blueprint_revision" ADD CONSTRAINT "blueprint_revision_template_id_blueprint_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "blueprint_template"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_template" ADD CONSTRAINT "blueprint_template_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blueprint_template" ADD CONSTRAINT "blueprint_template_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION protect_blueprint_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.catalog_key IS DISTINCT FROM OLD.catalog_key OR NEW.revision IS DISTINCT FROM OLD.revision
     OR NEW.content_hash IS DISTINCT FROM OLD.content_hash OR NEW.document IS DISTINCT FROM OLD.document
     OR NEW.template_id IS DISTINCT FROM OLD.template_id OR NEW.draft_version IS DISTINCT FROM OLD.draft_version
     OR NEW.description IS DISTINCT FROM OLD.description OR NEW.authored_locale IS DISTINCT FROM OLD.authored_locale THEN
    RAISE EXCEPTION 'Published blueprint revisions are immutable';
  END IF;
  RETURN NEW;
END $$;
