CREATE TYPE "idea_guest_visibility" AS ENUM('planning_only', 'shown_to_guests');--> statement-breakpoint
CREATE TABLE "workspace_person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"user_id" text,
	"display_name" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_person_display_name_not_blank_check" CHECK (length(trim("display_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_user_id_user_id_fkey";--> statement-breakpoint
DROP INDEX "event_participant_event_user_uidx";--> statement-breakpoint
DROP INDEX "event_participant_user_id_idx";--> statement-breakpoint
ALTER TABLE "event_invitation" ADD COLUMN "person_id" uuid;--> statement-breakpoint
ALTER TABLE "event_participant" ADD COLUMN "person_id" uuid;--> statement-breakpoint
ALTER TABLE "idea" ADD COLUMN "guest_visibility" "idea_guest_visibility" DEFAULT 'planning_only'::"idea_guest_visibility" NOT NULL;--> statement-breakpoint
ALTER TABLE "idea" ADD COLUMN "materialized_event_id" uuid;--> statement-breakpoint
ALTER TABLE "native_workspace_snapshot" ADD COLUMN "organization_id" text;--> statement-breakpoint
INSERT INTO "workspace_person" (
	"id", "organization_id", "user_id", "display_name", "email", "avatar_url"
)
SELECT DISTINCT ON (e."organization_id", ep."user_id")
	gen_random_uuid(), e."organization_id", ep."user_id", u."name", lower(u."email"), u."image"
FROM "event_participant" ep
INNER JOIN "event" e ON e."id" = ep."event_id"
INNER JOIN "user" u ON u."id" = ep."user_id"
ORDER BY e."organization_id", ep."user_id", ep."created_at";--> statement-breakpoint
UPDATE "event_participant" ep
SET "person_id" = wp."id"
FROM "event" e, "workspace_person" wp
WHERE e."id" = ep."event_id"
	AND wp."organization_id" = e."organization_id"
	AND wp."user_id" = ep."user_id";--> statement-breakpoint
INSERT INTO "workspace_person" (
	"id", "organization_id", "display_name", "email"
)
SELECT DISTINCT ON (e."organization_id", lower(ei."email"))
	gen_random_uuid(), e."organization_id", split_part(ei."email", '@', 1), lower(ei."email")
FROM "event_invitation" ei
INNER JOIN "event" e ON e."id" = ei."event_id"
WHERE NOT EXISTS (
	SELECT 1 FROM "workspace_person" wp
	WHERE wp."organization_id" = e."organization_id"
		AND lower(wp."email") = lower(ei."email")
)
ORDER BY e."organization_id", lower(ei."email"), ei."created_at";--> statement-breakpoint
UPDATE "event_invitation" ei
SET "person_id" = (
	SELECT wp."id"
	FROM "event" e
	INNER JOIN "workspace_person" wp
		ON wp."organization_id" = e."organization_id"
		AND lower(wp."email") = lower(ei."email")
	WHERE e."id" = ei."event_id"
	ORDER BY wp."created_at"
	LIMIT 1
);--> statement-breakpoint
UPDATE "native_workspace_snapshot" nws
SET "organization_id" = e."organization_id"
FROM "event" e
WHERE e."id" = nws."scope_id";--> statement-breakpoint
INSERT INTO "organization" (
	"id", "name", "slug", "created_at", "workspace_type"
)
SELECT
	nws."scope_id"::text,
	'Gatherory Workspace',
	'native-' || replace(nws."scope_id"::text, '-', ''),
	nws."created_at",
	'event'
FROM "native_workspace_snapshot" nws
WHERE nws."organization_id" IS NULL
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "native_workspace_snapshot"
SET "organization_id" = "scope_id"::text
WHERE "organization_id" IS NULL;--> statement-breakpoint
INSERT INTO "member" (
	"id", "organization_id", "user_id", "role", "created_at"
)
SELECT
	gen_random_uuid()::text,
	nws."organization_id",
	nws."owner_user_id",
	'owner',
	nws."created_at"
FROM "native_workspace_snapshot" nws
ON CONFLICT ("organization_id", "user_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "event_invitation" ALTER COLUMN "person_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_participant" ALTER COLUMN "person_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "native_workspace_snapshot" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
UPDATE "idea"
SET "guest_visibility" = 'shown_to_guests'
WHERE "category" = 'attire';--> statement-breakpoint
ALTER TABLE "event_participant" DROP COLUMN "user_id";--> statement-breakpoint
CREATE UNIQUE INDEX "event_participant_event_person_uidx" ON "event_participant" ("event_id","person_id");--> statement-breakpoint
CREATE INDEX "event_participant_person_id_idx" ON "event_participant" ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_person_organization_id_id_uidx" ON "workspace_person" ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_person_organization_user_uidx" ON "workspace_person" ("organization_id","user_id") WHERE "user_id" is not null;--> statement-breakpoint
CREATE INDEX "workspace_person_organization_email_idx" ON "workspace_person" ("organization_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_materialized_event_uidx" ON "idea" ("materialized_event_id") WHERE "materialized_event_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "native_workspace_snapshot_organization_uidx" ON "native_workspace_snapshot" ("organization_id");--> statement-breakpoint
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_person_id_workspace_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "workspace_person"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_person_id_workspace_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "workspace_person"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_person" ADD CONSTRAINT "workspace_person_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_person" ADD CONSTRAINT "workspace_person_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "idea" ADD CONSTRAINT "idea_materialized_event_id_event_id_fkey" FOREIGN KEY ("materialized_event_id") REFERENCES "event"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "native_workspace_snapshot" ADD CONSTRAINT "native_workspace_snapshot_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
