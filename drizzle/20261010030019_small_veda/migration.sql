ALTER TABLE "event" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
UPDATE "event" SET "status" = NULL WHERE "parent_event_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_lifecycle_matches_hierarchy_check" CHECK (("parent_event_id" is null and "status" is not null) or ("parent_event_id" is not null and "status" is null));
