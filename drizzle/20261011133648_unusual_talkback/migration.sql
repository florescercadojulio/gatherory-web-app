CREATE TYPE "organization_type" AS ENUM('event', 'business');--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "workspace_type" DROP DEFAULT;--> statement-breakpoint
UPDATE "organization"
SET "workspace_type" = 'event'
WHERE "workspace_type" NOT IN ('event', 'business');--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "workspace_type" SET DATA TYPE "organization_type" USING "workspace_type"::"organization_type";--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "workspace_type" SET DEFAULT 'event'::"organization_type";
