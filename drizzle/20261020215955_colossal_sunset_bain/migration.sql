CREATE TYPE "announcement_audience" AS ENUM('all', 'planning', 'guests');--> statement-breakpoint
ALTER TABLE "event_announcement" ADD COLUMN "audience" "announcement_audience" DEFAULT 'all'::"announcement_audience" NOT NULL;--> statement-breakpoint
ALTER TABLE "event_announcement" ADD COLUMN "author_label" text DEFAULT 'Host' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_announcement" ADD CONSTRAINT "event_announcement_author_label_check" CHECK ("author_label" in ('Host', 'Planning Team'));