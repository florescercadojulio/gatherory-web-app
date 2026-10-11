ALTER TABLE "user" ADD COLUMN "has_completed_onboarding" boolean DEFAULT false NOT NULL;

-- Existing accounts that already own native data or belong to a workspace
-- with a main event have completed onboarding. Preserve that state when the
-- explicit account flag is introduced.
UPDATE "user" AS "u"
SET "has_completed_onboarding" = true
WHERE EXISTS (
  SELECT 1
  FROM "native_workspace_snapshot" AS "nws"
  WHERE "nws"."owner_user_id" = "u"."id"
    AND "nws"."is_deleted" = false
)
OR EXISTS (
  SELECT 1
  FROM "member" AS "m"
  INNER JOIN "event" AS "e"
    ON "e"."organization_id" = "m"."organization_id"
  WHERE "m"."user_id" = "u"."id"
    AND "e"."parent_event_id" IS NULL
);
