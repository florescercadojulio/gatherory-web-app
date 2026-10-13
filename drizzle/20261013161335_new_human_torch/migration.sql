CREATE TABLE "event_departure" (
	"event_id" uuid,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_departure_pkey" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "event_departure" ADD CONSTRAINT "event_departure_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_departure" ADD CONSTRAINT "event_departure_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;