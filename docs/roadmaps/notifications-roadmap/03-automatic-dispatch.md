# Automatic mobile notification dispatch

> Superseded V1 delivery policy: [best-effort delivery](04-best-effort-delivery.md).
> The worker, protected endpoint and retry logic described here remain available
> for a later release, disabled. The every-minute entry was removed from
> `vercel.json`; ordinary changes now attempt one scoped post-commit delivery.
> Do not follow this document's activation steps for V1.

Implemented locally October 21, 2026. This adds scheduling to the existing
transactional outbox for assignments, event changes and explicit announcements.
No deployment, existing-database migration, real push send, commit or push was
performed. Personal reminders and browser notifications remain deferred.

## Delivery and isolation

Services continue writing notification intents in the same transaction as the
canonical change. A scheduler calls the existing notification workflow and its
FCM connector; request handlers never start background timers or send pushes
before commit. Existing mutation deduplication remains in place.

The dispatcher claims one intent at a time, at most 20 per scheduled invocation,
with a 25-second sending budget. PostgreSQL row locks with `SKIP LOCKED` and
two-minute leases isolate concurrent workers. Expired leases can be reclaimed;
all checkpoints and settlements require the current leased state and lease key.
A late acknowledgement can still settle before a replacement lease wins, but
cannot overwrite a new owner. Claims bypass up to 100 ineligible candidates so
a revoked recipient at the head cannot starve the next eligible recipient.

Before every network send, the repository rechecks current event access,
announcement audience and sender rights, or the unfinished task's assignment.
It also verifies the installation's recipient, binding generation, revision,
token hash and consent. Guest attendance proofs and account sessions retain
their existing separate permissions. The scheduler grants no event access.

FCM acceptance is checkpointed per installation before another send. A later
attempt skips accepted installations, including partial success across several
devices. Invalid registrations disable only the exact installation binding;
invalid payloads discard the intent without disabling a valid device.

Retries use exponential backoff with positive jitter: at least one minute,
capped at one hour for the calculated delay. A longer provider `Retry-After`
is honored. An intent stops after eight claims or 24 hours; provider delays
beyond that lifetime expire the intent instead of causing an early resend.
Unconfigured providers never claim work. Credential failures stop that dispatch
cycle. Failed checkpoints stop further sends, leaving the lease recoverable.
FCM HTTP requests are abortable and each has a ten-second timeout.

These protections prevent ordinary duplicate sends from overlapping runs and
partial retries. They do **not** guarantee exactly-once phone delivery: FCM may
accept a request immediately before a process crash or acknowledgement failure.
The stable outbox ID is also sent as `notificationId`, the APNs collapse ID and
Android collapse key to reduce duplicate pending alerts. Collapse identifiers
are not durable delivery receipts. Canonical in-app data remains authoritative.

The retry policy follows Firebase's advice to honor server backoff, add jitter
and bound retries. See [FCM scale guidance](https://firebase.google.com/docs/cloud-messaging/scale-fcm).

## Running locally

Use an explicitly approved test backend, existing Firebase/APNs credentials,
and a device already registered for that backend. In that backend's `.env.local`:

```dotenv
NOTIFICATION_DISPATCH_ENABLED=true
# Existing server-only FCM_PROJECT_ID, FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY
# must also be configured. Never put APNs keys or service keys in the app.
```

Then start the separate worker:

```sh
pnpm notifications:worker
```

It awaits one dispatch, waits 60 seconds, and repeats without overlapping its own
runs. SIGINT/SIGTERM abort in-flight delivery and stop the loop. A crashed process
leaves leases for another run to recover. Application-level failures wait until
the next cycle; there is no tight failure loop. Restarting a failed worker
process belongs to its host's process supervisor. No worker is started merely
by starting Vite or importing its modules.

Assign an unfinished task to another planner, change an event time/location, or
explicitly send an update. Wait for the canonical mutation to sync, then watch
the worker's aggregate output. `claimed`, `delivered`, `pending` and `discarded`
describe this run's processed intents, not device receipts or total backlog.
Expired/ineligible rows discarded during claim cleanup are not included in
those counters. Credentials, device tokens and private message text are not
logged. The explicit one-shot `pnpm notifications:dispatch` remains available
for troubleshooting and does not require the automatic-enable flag.

## Scheduled hosting

`GET /api/internal/notifications/dispatch` accepts an exact Bearer `CRON_SECRET`
of at least 32 characters. Cookies, account/guest sessions, URL parameters and
body fields cannot authorize dispatch or choose recipients. Unauthorized,
disabled or unconfigured requests never load the live database/provider graph.
Every response is private/no-store. Failures return a sanitized 503; successes
return only aggregate counters. The local worker does not require this HTTP
secret because it calls the workflow directly.

`.env.example` keeps automatic dispatch off. Configure these server-only values
in the intended scheduler environment when rollout is approved:

```dotenv
NOTIFICATION_DISPATCH_ENABLED=true
CRON_SECRET=<independently-generated-random-secret-at-least-32-characters>
```

The initial implementation configured this route every minute; the later V1
decision removed that entry from `vercel.json`. If scheduling is approved in a
future release, Vercel supplies the Bearer
header when `CRON_SECRET` is configured. Nitro's route-specific function rule
sets a 60-second duration; verify that rule in the generated deployment output
before release. Vercel cron operates on production deployments, may overlap or
duplicate invocations, and does not retry failed invocations automatically;
the durable outbox and subsequent scheduled run provide recovery. See
[Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

The repository's schedule configuration requires a plan that supports every-minute
cron. Hobby only permits daily cron; verify the target plan before deploying,
or use the separate worker on a suitable process host. Do not silently upgrade
a plan or deploy a daily schedule that cannot meet notification latency. See
[Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Verification and remaining checks

Non-UI verification covers protected scheduling, lazy imports, enablement,
sequential worker timing/cancellation, bounded service dispatch, partial device
acceptance, provider classification and cancellation, jitter/expiry, and real
PostgreSQL concurrent leases, stale-owner fencing, revocation and account
rebinding. The database suite is gated by `RUN_NATIVE_NOTIFICATION_DB_TESTS=1`
and requires a fresh disposable localhost database. No new schema migration is
required by this slice; tests apply existing migrations only to that disposable
database.

Verification on October 21, 2026:

- `pnpm test`: **563 pass / 38 environment-gated skips**, including portable
  contract freshness; 119 test files discovered.
- Separately enabled disposable PostgreSQL 18 verification: **8 database tests
  pass**, plus **5 retry-policy unit tests**. All 13 existing migrations were
  applied only to the disposable database, and the container was removed.
  Coverage includes overlapping claims, late acceptance checkpoints, stale-owner
  fencing, expired leases, retry limits, permissions, account rebinding, queue
  fairness and corrupted-token ownership cleanup. No real FCM requests were made.
- `pnpm typecheck`, route generation, targeted Prettier and `git diff --check`
  pass. The scheduler/worker tests use injected dependencies and simulated time;
  no live worker or scheduler was started.
- Native localization verification was attempted and found **23 existing entries
  without reviewed Spanish translations**, across budget, idea expansion,
  filtering and approval copy. No native source or localization catalog was
  changed by this slice. The existing dynamic AppCopy extraction warning remains.
  No UI tests were run; no native code changed, so native unit tests were not
  repeated for this server-only slice.

Logs: `/tmp/gatherory-automatic-dispatch-tests-20261021-final.log`,
`/tmp/gatherory-automatic-dispatch-typecheck-20261021.log`, and
`/tmp/gatherory-automatic-dispatch-localizations-20261021.log`.

Focused database command (only with a fresh migrated localhost test database
and dummy application configuration):

```sh
RUN_NATIVE_NOTIFICATION_DB_TESTS=1 pnpm exec vitest run \
  tests/integration/notification-dispatch.database.test.ts \
  tests/integration/notification-registry.database.test.ts \
  tests/unit/notification-delivery-policy.test.ts
```

Before rollout, separately verify the hosting plan, production runtime/build
output, scheduler authentication, configured FCM credentials, migration parity
for earlier slices, invocation monitoring and recovery after a worker restart.
Check real iPhone foreground/background/terminated behavior, duplicate cron
invocations, permission revocation, logout/account switching, guest-to-account
claim and a network loss around provider acceptance. Real push delivery and
production APNs acceptance remain physical-device/deployment checks. No UI tests
or browser notification feature is included.
