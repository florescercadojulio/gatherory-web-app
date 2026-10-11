UPDATE "event"
SET "scheduling_state" = 'unscheduled', "ends_at" = NULL
WHERE "starts_at" IS NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_schedule_state_check" CHECK (("scheduling_state" = 'scheduled' and "starts_at" is not null) or ("scheduling_state" = 'unscheduled' and "starts_at" is null and "ends_at" is null));
