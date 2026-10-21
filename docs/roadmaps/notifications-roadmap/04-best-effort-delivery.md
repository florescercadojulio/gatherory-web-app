# V1: send once after saving

Decision: October 21, 2026. Attempt a mobile push when an assignment, important
event change or explicit announcement is saved. If delivery fails or a person
does not receive it, accept that for V1. No scheduled retry, dead-letter replay,
periodic polling, new hosting service or cron job is required.

This replaces the active plan in [automatic dispatch](03-automatic-dispatch.md).
That infrastructure is retained for a later release. Nothing was deployed,
committed or pushed as part of this change, and no live credentials were edited.

## What happens now

1. Save the event/task change, or explicitly Send an update. An offline edit
   reaches this step only after it syncs successfully to the server.
2. The existing authorized transaction saves canonical data and notification
   records together. Rollbacks, rejected edits and conflicts do not send a push.
3. After commit, the request awaits one bounded, best-effort delivery pass for
   those records only. There are no detached promises, background timers, HTTP
   calls to the scheduler or periodic scans of unrelated pending work.
4. Each eligible registered installation gets at most one provider attempt.
   Current participation, audience, assignment, installation binding and consent
   are checked again. Guests remain attendees, and planning access still
   requires an authorized signed-in account.
5. Failed attempts, absent devices and unattempted records beyond the request's
   sending budget are retired. They are not retried on the next unrelated edit.
   A push failure does not turn the saved change into a failed API response.

Native sync uses only IDs from mutations the server actually applied, never
rejected, conflicting or duplicate receipts. Announcement delivery uses its
canonical announcement ID after authorized sending. These scopes are internal
server inputs, not notification-recipient controls exposed to the client.
Fresh-only atomic claims and accepted-device checkpoints prevent ordinary
request replays or overlapping calls from sending the same record again.

The sending pass is limited to 20 notification records and a 25-second budget;
provider HTTP requests each have a ten-second timeout. A large event may have
recipients outside that budget who receive no push. Saving may take longer
while the bounded attempt finishes. Saved tasks, event details and Updates
remain available through the existing authorized app views regardless of push
delivery. Do not display “everyone notified” or treat a push as a read receipt.

FCM acceptance is not confirmation that a person saw an alert. The provider and
phone still control transport, permissions and presentation after acceptance;
this policy adds no application-level retry. If the process stops after commit
but before sending, that notification may be missed. If it stops after provider
acceptance, delivery may be ambiguous. Neither case starts automatic recovery.

## Configuration and local testing

Normal best-effort sends use the existing server-only FCM credentials and the
device's existing notification registration. No cron secret or worker is
needed. Keep `NOTIFICATION_DISPATCH_ENABLED=false`; that flag belongs only to
the retained retry scheduler/worker, not the immediate delivery path.
`vercel.json` contains **no cron schedule**.

Run the configured backend normally. On two authorized test accounts/devices:

- Assign an unfinished task to the other planner, or change the shared event's
  time/location. Allow the edit to sync, then check the receiving iPhone.
- Explicitly Send an update to each permitted audience. Check that only that
  audience receives the generic alert and can read its authorized content.
- Disable notifications or remove the receiving person's event access before
  sending. The change must still save successfully, with no access bypass.
- Use invalid/unavailable test-provider configuration in an isolated test
  environment and confirm the change remains saved, with no later catch-up push
  when configuration is restored. Do not change live credentials for this test.
- Test foreground, background and terminated launch, account switching, guest
  attendance, guest-to-account claim and permission denial on physical devices.

Do not run `pnpm notifications:worker` or `pnpm notifications:dispatch` as part
of this V1 flow. Those commands exercise the retained queue/recovery behavior
and can send real pushes in a configured environment.

## Infrastructure kept for later

The transactional outbox, lease fencing, acceptance checkpoints, bounded retry
policy, FCM connector, protected dispatch endpoint and standalone worker remain
implemented and tested. The scheduler flag defaults false, the endpoint still
requires its dedicated secret, and starting the web app starts no worker.

No new database schema or migration is needed. Delivered/discarded records keep
their deduplication identity; no data cleanup or database reset was performed.
A process failure can leave unattempted or leased records behind. Ordinary
immediate delivery does not revisit those records. Before ever activating
recovery, explicitly decide how to retire earlier V1 records; do not sweep them
into a surprise burst of historical notifications. Also review retention of
terminal records, monitoring, queue age, hosting limits and deployment parity.

Future activation requires a separate decision: add a scheduler or host a worker,
enable its flag, configure its secret/credentials, and complete the build and
physical-device checks in the [retained handoff](03-automatic-dispatch.md).
Nothing automatically enables that infrastructure later.

## Verification

Non-UI tests cover committed-only dispatch, unchanged canonical responses after
notification failures, fresh-only scope isolation, no resend on replay, terminal
best-effort failures, per-device authorization and the dormant retry behavior.
Verification on October 21, 2026:

- `pnpm test`: **588 pass / 41 environment-gated skips**, including portable
  contract freshness, across 121 test files.
- Separately enabled disposable PostgreSQL 18 checks: **11 database tests pass**
  plus **5 retry-policy unit tests**. New regressions verify concurrent fresh
  claims, replay prevention, exact announcement/mutation scope isolation, empty
  scopes and retirement that cannot touch unrelated pending or leased work.
  All 13 existing migrations were applied only to that disposable database;
  the container was removed.
- `pnpm typecheck`, targeted Prettier and `git diff --check` pass. Transport
  architecture checks allow only the database runtime wiring needed at the sync
  boundary; queries and production graphs remain outside pure workflows.

Logs: `/tmp/gatherory-best-effort-tests-20261021-final.log` and
`/tmp/gatherory-best-effort-typecheck-20261021.log`.
Native UI and copy are unchanged; the 23 existing Spanish translation gaps
recorded in the [previous verification](03-automatic-dispatch.md) remain
separate work. Localization and native tests were not repeated for this
server-only policy change. No UI tests, real push sends, deployment or
existing-database migrations were performed.

Later October 21: the [schedule-sharing slice](../event-schedule-sharing-roadmap/README.md)
filled those 23 missing translations. The full native suite and localization
verification now pass; the earlier result above remains the historical evidence
for the notification-only change.

## Suggested next work

First complete the two-device acceptance above against an approved test backend.
Then a small mobile feature worth scoping is **Share event schedule**: a simple
readable handoff through the native share sheet, with deliberate permission and
privacy rules. It addresses day-of coordination without adding reminders,
browser planning, billing or social features. This is a proposal, not approval
to implement the export.
