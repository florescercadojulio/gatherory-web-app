ALTER TABLE "event_expense" DROP CONSTRAINT "event_expense_idea_same_workspace_fk";--> statement-breakpoint
ALTER TABLE "registry_item" DROP CONSTRAINT "registry_item_idea_same_workspace_fk";--> statement-breakpoint
CREATE UNIQUE INDEX "idea_organization_event_id_uidx" ON "idea" ("organization_id","event_id","id");--> statement-breakpoint
ALTER TABLE "event_expense" ADD CONSTRAINT "event_expense_idea_same_event_fk" FOREIGN KEY ("organization_id","event_id","source_idea_id") REFERENCES "idea"("organization_id","event_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "registry_item" ADD CONSTRAINT "registry_item_idea_same_event_fk" FOREIGN KEY ("organization_id","event_id","source_idea_id") REFERENCES "idea"("organization_id","event_id","id") ON DELETE RESTRICT;