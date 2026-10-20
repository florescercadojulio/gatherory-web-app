ALTER TABLE "event_todo" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "event_todo" ADD COLUMN "assignee_person_id" uuid;--> statement-breakpoint
CREATE INDEX "event_todo_assignee_idx" ON "event_todo" ("assignee_person_id");--> statement-breakpoint
ALTER TABLE "event_todo" ADD CONSTRAINT "event_todo_website_url_check" CHECK ("website_url" is null or (char_length("website_url") <= 2048 and "website_url" = btrim("website_url") and "website_url" !~ '[[:space:][:cntrl:]]'));