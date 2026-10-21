# 01 — Device guest planning and attendance

**Status:** Implemented first slice — non-UI verification passed locally; device and deployment checks remain.  
**Recorded:** October 20, 2026.  
**Source base:** web/server `6ff53ae`; native `5bdd241`.

## Native behavior

The sign-in screen offers **Continue as Guest**. A short name form creates an
app-private device profile. Local event creation, Ideas, Decide, To-dos and other
planning edits use the existing local domain/persistence behavior. The profile
has its own `device-guest:<UUID>` archive namespace and a separate device-only
Keychain proof. `AuthenticationSession.currentUser` stays nil. Guest saves do
not create planner outbox entries or media uploads.

Account offers **Sign In to Save** and **Leave Guest Mode**. Leaving explains
that guest plans and cached invitations will be removed from this device, and
offers sign-in, explicit removal or cancellation. Removal does not cancel event
attendance on the server. Ordinary signed-in sign-out keeps account-scoped
pending work as before.

Public shared links with the exact **guest** role can be joined with the guest
name. Private/email-bound invitations and planner invitations still require
sign-in. Joining and changing an attendance response require a server
acknowledgement. Cached event details remain readable offline; an offline RSVP
is not presented as successfully sent. Guests do not get planner tabs or data
from a parent, sibling, or another event.

Sharing/inviting and blueprint account controls ask the guest to sign in.
Chosen public blueprint creator names and Search publishing remain independent
of a guest's private display identity.

## Sharing and invitation wording — V1 follow-up

The confirmed rule is **attend as guest; sign in to help plan**. Native public
Guest links explain event viewing/RSVP without an account and offer **Attend as
Guest**. Collaborator links state sign-in, approval when enabled, and the access
level the host selected. A view-only collaborator invitation says **Sign In to
View Plans**, without promising editing. Private/email invitations still require
the invited account; signing in alone does not upgrade an existing guest role.
A host must explicitly grant planning access through existing controls.

Guest sign-in displays a short assurance that their plans and invitations will
be kept with the account. The pending invitation survives cancellation/failure
and sign-in; the existing import/claim recovery remains in place. Native preview
requests now follow the active session: after sign-in they use the real account
bearer so private previews and existing roles resolve correctly. Guest previews
explicitly omit account tokens, including leftover Keychain credentials, and
native requests do not use browser cookies.

The browser join page explains that guest attendance is available in the iPhone
app, while its existing browser journey requires an account. It distinguishes
planning from view-only invitations and shows a pending host request separately
from accepted access, including immediately after the join response. New
invitation copy is available in English and Spanish; other browser copy keeps
its existing English fallback. Browser guest RSVP is still outside this slice.

## Sign-in and recovery

Before sign-in changes the account session, guest edits are flushed. The target
account is activated and bootstrapped using existing account isolation rules.
Guest plans are then added alongside its existing plans. Guest host/authorship
references are linked to the signed-in identity; workspace identifiers remain
stable. An identifier collision aborts the import without replacing either
copy. It requires investigation/recovery rather than silently overwriting data.

An account-bound import receipt is saved in the same SwiftData transaction as
account archives and outbox creates, including when there are no local plans.
Retries into that account are idempotent. Import into a different account is
rejected. The original guest records remain until server attendance claiming
also succeeds. An interrupted handover cannot return to editing the old guest
copy: the app asks the person to finish signing in to the original target account.
This avoids losing guest edits made after the account copy was created.

Server attendance claim requires both the original guest proof and a verified
Better Auth session. Existing account participation/RSVP and explicit departure
win. Claims do not add planner/organization membership or increase a role. The
server transaction records the target account, consumes guest access and keeps
an idempotent receipt. A replay into the same account succeeds; another account
is denied. This server transaction and the device transaction cannot be one
atomic transaction: retained source data and receipts support retry across that
boundary. The device removes its guest source/profile/proof only after success.

## Server ownership and contract

- `src/server/events/contracts/guest-capability.contracts.ts` validates UUIDs,
  trimmed 1–80 Unicode-code-point names and a 43-character base64url proof.
- `src/routes/api/guest/{session,events,claim}.ts` and the device-guest handler
  expose the normal result envelope. Registration is `POST /api/guest/session`
  with `{ id, name, credential }`; repeating the same proof is safe.
- Other requests use `X-Gatherory-Guest-Id` and `X-Gatherory-Guest-Token` headers.
  `GET /api/guest/events` returns existing invitation projections;
  `POST { token }` joins; `PATCH { eventId, attendance }` responds;
  `DELETE { eventId }` leaves that one event.
- `POST /api/guest/claim` additionally requires a verified account session and
  returns `{ claimedEventIds }`, including an empty result for local-only guests.
- `device-guest.repo.persistence.ts` owns profile proof verification and atomic
  admission/response/claim writes. Credentials are hashed; plaintext must never
  be put in URLs, logs, schema snapshots or native planner records.
- Existing guest service/artwork projection is reused, with account identifiers
  redacted for device guests. No auth anonymous plugin is enabled.
- Admission uses existing lifecycle/share-link guards. Roster changes are
  published into existing host-visible native replication within the same
  database transaction. No guest planner bootstrap/pull/push scope is created.
- Additive migration: `drizzle/20261020162306_brainy_puma/migration.sql`.
  Local disposable-database verification is separate from production application.

## Important native sources

- `Gatherory/App/{AuthenticationSession,LocalGuestProfile,GatheroryLaunchExperience}.swift`
- `Gatherory/Data/Persistence/WorkspacePersistence.swift` and import receipt model
- `Gatherory/Features/Auth/{AuthenticationView,LocalGuestViews}.swift`
- `Gatherory/Features/Events/{NativeInvitationView,DeviceGuestInvitationClient,GuestInvitationStore}.swift`
- `Gatherory/ContentView.swift` and workspace creation/sharing gates

Native transport uses an ephemeral cookieless session, restricts cleartext to
loopback development, and blocks cross-origin redirects. Guest proof is never
used as a Better Auth bearer. Per-identity caches and async generation guards
prevent callbacks from showing a previous guest/account's event data.

## Automated verification

Verified locally on October 20, 2026:

- **Native:** 739 non-UI tests in 101 suites pass on iPhone 18 Pro / iOS 27
  Simulator. Result: `/tmp/gatherory-v1-attend-copy-native-20261020.xcresult`;
  log: `/tmp/gatherory-v1-attend-copy-native-20261020.log`.
- **Web/server:** `pnpm test` passes 484 tests; 28 environment-gated tests are
  skipped in the default run. Portable-contract freshness is included.
  Log: `/tmp/gatherory-v1-attend-copy-web.log`.
- **Database:** guest contracts plus repository integration pass (3 tests)
  against a new disposable PostgreSQL database after applying the migrations.
  Coverage includes lifecycle, exact child-event projections, privacy,
  no planner grants, existing-account RSVP/role preservation, rollback and claim
  replay. The HTTP proof-isolation suite passes separately (1 test) against a
  local Vite server and that database. Those temporary resources were removed.
- **Static checks:** `pnpm typecheck`, changed TypeScript formatting, both
  repositories' `git diff --check`, and native localization validation pass.
  **1,375 English/Spanish strings** are covered; the pre-existing dynamic-key
  extraction warning in `AppCopy.swift` remains.

Native focused tests cover local persistence, guest-to-existing-account additive
import (including Decide identity/authorship), empty imports, account binding,
source retention, auth/save/discard failures, stale A→B→A callbacks, credential
transport and the redirect delegate. Follow-up tests also cover a pending planner
invitation through guest sign-in, public collaborator/view-only DTO policy,
anonymous preview omission of a stale bearer, and authenticated private preview
transport. Browser presentation tests cover pending approval versus accepted
access, role-specific copy and EN/ES invitation keys. No UI tests ran. The default web test's
integration skips do not substitute for the separate database/HTTP runs.

Native full-suite command (run from the iOS root; use a fresh result path):

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-v1-guest-next.xcresult POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```

The opt-in server tests require an isolated migrated local test database and,
for HTTP, a dev server configured to that same database. Set `DATABASE_URL` only
for those test processes; do not reuse or reset a populated development database.

```sh
RUN_DEVICE_GUEST_DB_TESTS=1 pnpm exec vitest run \
  tests/contracts/guest-capability.test.ts \
  tests/integration/device-guest-capability.database.test.ts
RUN_DEVICE_GUEST_HTTP_TESTS=1 DEVICE_GUEST_TEST_BASE_URL=http://127.0.0.1:3018 \
  pnpm exec vitest run tests/integration/device-guest-http.database.test.ts
```

No production migration, deployment, build upload, commit or push was performed.

## Physical-device and deployment acceptance still required

1. Review/apply the additive migration through the approved deployment process,
   then deploy compatible server code before offering this native capability.
   Do not reset an existing database.
2. On a physical device, Continue as Guest, create/edit a plan with a photo,
   To-dos and a child event; force-quit/relaunch and repeat offline. Confirm
   sharing/publishing asks for sign-in and makes no remote planner writes.
3. Open a real public guest invitation; join with a name, change RSVP and check
   the host roster on another device. Check private/collaborator/revoked/expired
   links, cancellation, event-only access and leaving one invitation.
4. Sign in with each supported provider into both a new account and an existing
   account with plans/attendance. Confirm all original account data remains,
   guest plans appear once, account RSVP wins, and host display remains correct.
5. Interrupt handover, relaunch, retry and switch accounts. Verify the original
   target-account gate, source retention, no duplicate plans/people and recovery
   after network/disk failure. Check no guest data appears for another account.
6. Exercise Cancel, Sign In to Save and Remove from This Device from guest exit;
   verify normal account sign-out still retains its own pending drafts.
7. Inspect accessibility, Dynamic Type, dark appearance and Spanish copy on the
   physical device. Review guest-credential storage/retention and privacy copy
   before a public pilot. No build has been uploaded for these checks.

Remaining scope includes browser guest RSVP and app-less calendar handoff,
event announcements/notification delivery, optional personal reminders, exports,
and the broader V1 safeguards. This slice does not establish production readiness.
