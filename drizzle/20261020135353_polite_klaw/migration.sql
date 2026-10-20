CREATE TABLE "event_todo" (
	"id" uuid PRIMARY KEY,
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"due_date" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_todo_title_check" CHECK (char_length("title") between 1 and 200 and "title" = btrim("title")),
	CONSTRAINT "event_todo_due_date_check" CHECK ("due_date" is null or "due_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_todo_organization_event_id_uidx" ON "event_todo" ("organization_id","event_id","id");--> statement-breakpoint
CREATE INDEX "event_todo_event_created_idx" ON "event_todo" ("event_id","created_at","id");--> statement-breakpoint
ALTER TABLE "event_todo" ADD CONSTRAINT "event_todo_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_todo" ADD CONSTRAINT "event_todo_event_same_workspace_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "event"("organization_id","id") ON DELETE CASCADE;