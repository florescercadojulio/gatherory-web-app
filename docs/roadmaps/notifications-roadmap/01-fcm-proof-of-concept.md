# FCM collaboration proof of concept

## Scope and behavior

This is mobile-only. iOS has the first client integration; the server registry
also understands Android installations, but there is no Android client in these
repositories. Existing Better Auth accounts and device guest proofs remain the
identity authorities. A push token identifies an installation, never a person
or an event permission.

- **Assignment:** assigning or reassigning an unfinished To-do to another active
  planner creates a notification intent. Taking your own task, clearing an
  assignment, unchanged assignments, completed/deleted tasks, rejected writes,
  and duplicate mutation retries do not create additional intents.
- **Event change:** an existing event's time, date, time zone, location, or
  cancellation changes notify participants in that exact event, excluding the
  editor. Initial event creation/import and routine text edits do not notify.
  Child events do not notify unrelated parent or sibling participants.
- Device guests can opt into updates for events they attend. They cannot receive
  planner assignments or gain planning access through a notification.
- Personal reminders remain deferred. A due date does not schedule an alert.

## Service and transaction boundaries

`NotificationConnector` is an injectable transport port. The FCM implementation
uses OAuth service credentials and the HTTP v1 API on the server.
`NotificationService` consumes that connector and the notification repository;
other server services can consume the service without importing Firebase.
Contracts and service tags do not initialize production database/provider state.

The existing native mutation transactions write opaque, deduplicated outbox
intents alongside canonical event/task changes. A rollback also rolls back the
intent. No FCM request occurs inside these transactions or native sync requests.
The dispatcher leases work, checks current participation/assignment and device
binding again, and records provider acceptance or retry state. FCM acceptance
does not mean a device displayed or read the notification. Crash/retry windows
can still result in duplicate alerts; this is not exactly-once delivery.

The installation registry uses its own random installation ID and device-only
secret. The server stores a hash of the proof and encrypted provider tokens.
Bindings have a persistent revision so delayed registration requests cannot
restore an older account binding. Account and device-guest credentials are not
combined. Signing out or removing a guest detaches the current installation;
switching identities requires a new authenticated binding. Notification opt-in
is per identity on that device.

Visible content is generic: no event title, task title, names, address, invitation
token, or share URL. Payloads carry opaque event/entity IDs and an expected
recipient. Mobile taps check that recipient, refresh with current credentials,
and resolve only a currently accessible event or still-assigned unfinished task.
They never apply payload data to a workspace or follow a supplied URL.
An already submitted push may arrive after sign-out, particularly offline;
generic lock-screen text and the recipient/access checks are still necessary.

## Configuration and local exercise

1. Keep normal builds unconfigured. On the server, configure `FCM_PROJECT_ID`,
   `FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY` only in the intended test environment.
   Use a service account authorized to send FCM messages in that project. Never
   put the private key in the app, repository, logs, or public environment fields.
2. Register the native bundle ID in that Firebase project and add its genuine
   `GoogleService-Info.plist` to the app target. Enable the native
   `FCM_NOTIFICATIONS_ENABLED` build setting only for the intended test build.
   The bundled Firebase configuration must match the app's bundle ID.
3. Configure Apple Push Notifications capability/provisioning and upload the
   correct APNs key in the Firebase console. Debug and release APNs environments
   must match their provisioning. No credentials or provisioning were created
   as part of local implementation.
4. Apply the additive migration to a separately approved target environment.
   Do not reset an existing database. Sign in on two test devices, join the same
   event as planners, and explicitly enable **Planning Notifications** on the
   receiving device. A device guest may instead enable updates for attendance.
5. Assign an unfinished To-do to the second planner or change the shared event's
   location/time. Let the existing offline outbox sync successfully. Run the
   explicit `pnpm notifications:dispatch` command against that
   configured environment. That was the initial proof-of-concept procedure.
   The current [V1 best-effort flow](04-best-effort-delivery.md) attempts delivery
   after saving, without this command or a worker. Retry scheduling is retained
   for later, disabled.
6. Confirm generic localized content, tap to refresh/open the authorized event
   or To-do list, then test revocation, completion/reassignment, identity changes,
   logout, and guest-to-account claim before dispatch and before tapping.

The native integration currently uses the supported FCM registration-token
delegate/API. Firebase's installation-ID target transition is separate work;
do not substitute a Firebase Installation ID into the token field without
updating both client and provider contracts.

Token encryption currently derives its key from `BETTER_AUTH_SECRET`. Rotating
that secret requires installation re-registration; unreadable old token bindings
are disabled rather than sent. Dedicated versioned encryption-key rotation,
outbox expiration/retention and operator retry controls remain production work.

## Verification and remaining checks

Non-UI tests must cover connector responses without real network sends,
service dispatch, registry proof/revision isolation, transactional capture,
rollback/retry deduplication, exact-event access and native lifecycle/tap guards.
Run the English/Spanish native localization check. Database integration tests
require an explicitly enabled, disposable localhost database with all migrations.

Physical-device acceptance still requires foreground/background/terminated app
delivery, denied/re-enabled system permission, token refresh/reinstall,
APNs sandbox/production provisioning, deep-link navigation, offline sign-out,
guest attendance/claim, two-account switching and localized lock-screen text.
Verify event cancellation/restoration and device clock/time-zone changes.

Before production, separately review credential storage/rotation, retention and
cleanup of tokens/outbox records, retry/lease limits and monitoring, rate limits,
and the scheduled dispatcher deployment. Push is best effort; the canonical
event and offline sync remain the source of truth. No physical delivery or
production deployment is implied by passing local tests.

Official references: [Apple setup](https://firebase.google.com/docs/cloud-messaging/ios/get-started),
[HTTP v1 sending](https://firebase.google.com/docs/cloud-messaging/send/v1-api),
and [delivery error handling](https://firebase.google.com/docs/cloud-messaging/error-codes).

### Local capture verification — 2026-10-20

Applied the repository migrations, including both notification migrations, to a
new disposable local PostgreSQL 18 container. The container was stopped and
removed after verification; no existing database was reset or modified.

- Passed `RUN_NATIVE_NOTIFICATION_DB_TESTS=1 pnpm exec vitest run tests/integration/native-notification-capture.database.test.ts` — 1 file, 1 test. Assertions cover canonical assignment capture and deduplication, rejected/ineligible assignment suppression, existing-event scheduling changes versus title-only edits, scoped child-event participant isolation (including device guests), no initial child-event notice, and transaction rollback when receipt persistence fails.
- Passed `RUN_SCOPED_EVENT_DB_TESTS=1 pnpm exec vitest run tests/integration/scoped-event-sync.database.test.ts` — 1 file, 7 tests.
- Passed `RUN_DEVICE_GUEST_DB_TESTS=1 pnpm exec vitest run tests/integration/device-guest-capability.database.test.ts` — 1 file, 1 test.
- Passed `pnpm exec vitest run tests/effect/notification-service.test.ts` — 1 file, 3 tests.
- Passed `pnpm typecheck` and `git diff --check`.

The full test suite, notification registry HTTP/database tests, physical-device
delivery, and production deployment were not run as part of this capture check.

### Final server verification — 2026-10-20

- `pnpm test`: **493 passed, 32 skipped**. The default suite intentionally leaves
  environment-gated database suites off; this does not mean their assertions ran.
- The focused connector/service tests pass **9 tests**, included in that total,
  using mocked HTTP/provider responses with no real FCM send.
- Separately enabled registry/dispatcher/handler tests pass **3 database tests** on a
  fresh disposable PostgreSQL container. They exercise installation proofs,
  concurrent revision ordering, detach-before-first-register tombstones, account
  rebinding, detached-token reuse, lease expiry and eligibility changes after
  claim and authenticated HTTP binding. Combined with capture/scoped/guest checks above, **12 database cases**
  were run explicitly; all test containers were removed.
- `pnpm typecheck`, changed-file formatting and whitespace checks pass.

The installed Intent CLI works. Its listed dotenv skill resolves to a missing
local skill file; no replacement was downloaded and no environment files were
changed for this proof of concept. Required variable names are documented above.

### Registry HTTP handler verification — 2026-10-20

Applied the full migration chain to a second, new disposable PostgreSQL 18
container, ran the notification registry database suite, then stopped and
removed the container. The tests call the HTTP handler directly and use
Better Auth sessions plus actual guest-profile proofs.

- Passed `DATABASE_URL=postgresql://postgres:<disposable-password>@127.0.0.1:32785/gatherory_test RUN_NATIVE_NOTIFICATION_DB_TESTS=1 pnpm vitest run tests/integration/notification-registry.database.test.ts` — 1 file, 3 tests. In addition to registry and dispatcher coverage, it verifies the recipient is derived from the valid account session despite spoofed body fields, valid guest proof binds only the guest, guest proof plus an invalid Authorization header is rejected, wrong guest proof and expired account session are denied, and exact installation proof can detach after session expiry while a wrong proof is rejected.
- Passed `pnpm typecheck`.

No existing database was reset or modified; no external notification was sent.

### Final native verification — 2026-10-20

- Full `GatheroryTests` target: **749 tests in 103 suites passed**. The command
  selected only the non-UI test target, with parallel testing disabled and
  PostHog disabled. No `GatheroryUITests` were selected.
- Focused notification/navigation/guest-authentication run: **18 tests in
  3 suites passed**, included in the full total. This covers feature-off consent,
  guest-only credentials, detach revisions, delayed A→B→A token/HTTP callbacks,
  cold-start tap recovery, exact-event routing and stale assignment rejection.
- Native English/Spanish coverage: **1,377 strings verified**. The existing
  dynamic localization-key extraction warning remains; notification copy has
  both translations.
- Firebase Apple SDK **12.19.2** resolves alongside existing Google Sign-In
  **9.2.0**. Firebase 13's incompatible AppCheck dependency was rejected during
  resolution; the app now pins the compatible version. The supported legacy
  registration-token API emits a deprecation warning; installation-ID migration
  is deliberately not inferred from that warning.
- Native and server whitespace checks pass. Existing uncommitted guest work,
  handoff documentation and other edits were retained. Neither repository was
  committed or pushed; no deployment/build upload occurred.

Local evidence: `/tmp/gatherory-fcm-native-full-20261020.log` and `.xcresult`,
`/tmp/gatherory-fcm-web-verified-20261020.log`, and
`/tmp/gatherory-fcm-localizations-final-20261020.log`. Logs are local evidence,
not committed artifacts. Real provider/device delivery remains untested.

### Firebase device setup started — 2026-10-20

The user selected existing Firebase project `gatherory-e4d8b`. The Firebase
plugin registered iOS app `1:221925876535:ios:3968ff28092ee855d3f0b2` for
`com.guide-systems.gatherory` and downloaded the SDK plist into the native
repository's ignored configuration path. Debug now enables FCM locally; Release
remains disabled. A native Debug simulator build passed and the bundled project
ID/feature flag were verified. See the native
[device setup record](../../../../ios-apps/gatherory/docs/mobile-notifications.md#device-setup-progress--october-20-2026).

APNs key upload/provisioning, backend service-account credentials, local backend
reachability and the chosen migration target still need verification before
testing live assignment/event-change delivery. No existing database was changed;
no services were deployed, no build was uploaded, and neither repo was committed.

### APNs upload and server environment preparation — 2026-10-20

The user uploaded development APNs key `KL2Y639363` for Apple team
`LW97NHT3JA`. Firebase Cloud Messaging settings visibly show that key under
Gatherory iOS (`com.guide-systems.gatherory`), and the HTTP v1 API is enabled.
Production APNs remains unconfigured. The `.p8` was not read or copied into
environment files; the upload was completed by the user.

`.env.example` and the ignored `.env.local` now contain `FCM_PROJECT_ID`,
`FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY`. The project is `gatherory-e4d8b`;
the latter two values remain blank pending a Firebase service-account JSON key.
These are distinct from the Apple APNs key and the existing `APPLE_*` variables
used for Sign in with Apple. Existing environment values were preserved.

The Firebase Service accounts page is open for the next user step: generate
and download the server service-account JSON privately. Its `project_id`,
`client_email`, and `private_key` map to the three FCM environment fields. Do
not put the JSON or private key in Git, the app, browser-client variables, or
chat. The installed local dotenv skill remains unavailable; the existing env
loader and example parsing were checked directly, without downloading a skill
replacement. No dispatch or database migration has been run during this setup.

### Temporary server-key setup access — 2026-10-20

With explicit user approval, `juliof@guide-systems.com` received Organization
Policy Administrator access on `guide-systems.com`, conditioned on
`request.time < timestamp("2026-10-20T20:00:00Z")` (4 PM Detroit time). A
project-only Browser grant uses the same expiry so the console can resolve
Gatherory's project metadata.

The user separately approved temporarily overriding
`iam.disableServiceAccountKeyCreation` **only on `gatherory-e4d8b`**. The
console now shows the project policy as Not enforced, and Firebase no longer
shows its key-creation restriction. The organization policy was not changed.
The Firebase Generate key confirmation is open for the user to complete;
no server key has been generated or imported by the agent.

After the user downloaded the key, the project's original **Inherit parent's
policy** setting was restored and the console verified effective status
**Enforced**. The temporary exception is closed; the two temporary IAM grants
retain their 4 PM expiry.

### Local credentials ready — 2026-10-20

Imported the user-downloaded Gatherory service-account JSON into the three FCM
fields in ignored `.env.local`, preserving unrelated settings. Both local
credential files have owner-only filesystem permissions. `.env.example` keeps
blank email/private-key placeholders. The private key was not printed, added to
Git or copied into the native app.

Verified dotenv parsing against the downloaded fields, valid RSA signing and a
successful Google OAuth exchange for the Firebase Messaging scope. This verifies
credentials, not delivery or an iPhone registration. No notification was sent.
The focused connector/service suite passes **9 tests**.

The Debug API origin `https://dev.gatherory.com` reaches the notification POST
route: an unauthenticated empty request returns the expected JSON validation
error (HTTP 400). The configured database resolves to local PostgreSQL; its
latest migration was the guest-capability migration. Applied the two pending
notification migrations with `pnpm db:migrate`, then verified the installation
and outbox tables and installation locale column. No reset or seed was run.

Next: verify Apple device provisioning, run Debug on the iPhone, explicitly
enable notifications, confirm registration, and test assignment/event changes
with manual dispatch. Production APNs, deployment and real-device delivery
remain pending. No deployment, commit, build upload or dispatch occurred.
