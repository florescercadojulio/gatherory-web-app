CREATE TABLE "waitlist_rate_bucket" (
	"key" text PRIMARY KEY,
	"attempts" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_signup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL UNIQUE,
	"locale" text NOT NULL,
	"source" text NOT NULL,
	"campaign" text,
	"consent_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "waitlist_email_normalized" CHECK ("email" = lower(trim("email")) and length("email") between 3 and 254),
	CONSTRAINT "waitlist_locale_check" CHECK ("locale" in ('en', 'es')),
	CONSTRAINT "waitlist_source_check" CHECK ("source" in ('landing_home', 'landing_iphone')),
	CONSTRAINT "waitlist_consent_check" CHECK ("consent_version" = 'launch-updates-v1')
);
--> statement-breakpoint
CREATE INDEX "waitlist_rate_expiry_idx" ON "waitlist_rate_bucket" ("expires_at");--> statement-breakpoint
CREATE INDEX "waitlist_signup_created_idx" ON "waitlist_signup" ("created_at","id");