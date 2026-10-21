# Explicit event announcements

Requested October 20, 2026. Local implementation for iPhone; no browser authoring
or announcement screens, deployment, commit, or real push send is included.

## Experience

Open an event, choose **Updates**, then **Send Update**. One composer replaces
the separate team-note and announcement entry points. Its **To** selector offers
**All**, **Planning**, and **Guests**, subject to the sender's existing rights.
Planning is the safe initial choice when available. Each message displays its
audience. Write up to 750 Unicode characters and explicitly tap Send; editing,
reconnecting and refreshing never send messages. Existing assignment and
event-change notifications retain their own behavior.

| Audience | Who can read | Who can send | Push recipients |
| --- | --- | --- | --- |
| All | Exact-event hosts, collaborators and guests | Host/manage | Both groups, excluding sender |
| Planning | Exact-event hosts and collaborators | Host/manage or collaborator/manage/contribute | Planning team, excluding sender |
| Guests | Exact-event guests and hosts overseeing their event | Host/manage | Guest roles only |

The server enforces these audiences before applying the latest-50 history limit,
and again at notification dispatch. Hiding a UI tab is not the access boundary.
Guests and view-only planners cannot send. Device guests use their existing
verified attendance proof. Unaccepted public invitations grant no message
access. Finished, completed, cancelled or archived events remain readable but
cannot send. Generic **Host** or **Planning Team** bylines retain no personal
account snapshot. The feed resolves the current sender name and profile image
from the event member; deleted accounts retain only the generic role byline.

Existing notes appear as earlier **Planning** history in the same screen for
authorized planners. They remain in their existing offline/sync stores and are
never converted into public announcements or resent. Device-local planning
keeps its existing private Save behavior in this UI, restricted to Planning,
with an explanation that it stays on this device and sends no notification.

Sending requires a connection and server acknowledgement. A failed attempt
keeps the message and its request ID while the Updates screen remains open;
only another explicit Send retries it. Canceling/reopening the composer within
that screen retains the message. Closing the Updates screen or terminating the
app does not persist the draft. Server announcements have no offline outbox and
are not included in blueprints, local guest imports or planning archives.
Existing note persistence and device-only saves remain separate. Already loaded messages may remain visible during a network
failure in the same session; a denied-access response clears them.

Visible consumer **Workspace / Workspaces** copy now says **Event / Events**
in English and **evento / eventos** in Spanish. Stable translation keys,
internal model names, event organization, APIs, and offline formats remain
unchanged. Blueprint ownership containers use **library / biblioteca** where
calling them events would be misleading.

## API and persistence

- `GET /api/events/:eventId/announcements`: authenticated exact-event list.
- `POST /api/events/:eventId/announcements`: authorized send with
  `{ requestId: UUID, message: string, audience: "all" | "planning" | "guests" }`.
- `GET /api/guest/events/:eventId/announcements`: device-guest proof and
  exact-event attendance, always read-only. No guest POST route exists.

Success responses use the existing `{ ok: true, data: ... }` envelope. Lists
contain `{ announcements, canSend, allowedAudiences }`; send returns
`{ announcement }`. A message contains `id`, `eventId`, `message`, `audience`, a
nullable `authorId`, a generic fallback `authorName`, and ISO-8601 `createdAt`.
The native client resolves the current sender name and profile image from the
event member record; no personal name or image snapshot is stored on the
announcement. Deleted authors fall back to the generic role label. Old messages and requests default
to All; new clients disable sending if audience capabilities are absent, so an
older backend cannot accidentally broaden a Planning choice.
Responses are private/no-store. Native transports disable cookies, URL caches,
credential stores and redirects; account bearers and guest proofs never mix.

`event_announcement` is separate from notes and native sync entities. Sending
locks the root event before its child and validates exact-event participation;
organization ownership alone is insufficient. The row and notification intents
commit in one transaction. A stable actor/event/request ID deduplicates retries;
reusing it with changed normalized text or audience returns a conflict. Native
retries retain both text and audience; explicitly changing either starts a new
request ID. Event deletion
cascades its messages. Author account deletion clears the author FK without
retaining a name or email snapshot in the byline.

The service/workflow/repository modules live under `src/server/announcements`.
The notification service consumes the existing outbox through its FCM connector.
The new `event_announcement` type uses a generic English/Spanish lock-screen
message and the canonical announcement UUID, never its private message text.
Recipient access, author permission, installation binding and consent are
rechecked at dispatch. A notification is not a delivery receipt. Native taps
refresh current access before opening Updates and fetch its text from the
authorized API; a push payload never grants access. Session generations reject
late responses across account switching, including A → B → A.

## Verification and release boundary

Run `pnpm typecheck`, `pnpm test`, the focused announcement database integration
against a fresh disposable localhost PostgreSQL instance, native `GatheroryTests`
only, and `bash scripts/verify-localizations.sh`. Automated UI tests are excluded.

Initial announcement verification on October 20, 2026:

- Native: **846 tests in 119 suites pass**, with only `GatheroryTests` selected,
  parallel testing disabled, and PostHog disabled.
- Web/server: **505 tests pass / 33 environment-gated skips** in `pnpm test`,
  including portable contract freshness. TypeScript and targeted Prettier pass.
- The separate enabled announcement integration passes on a fresh disposable
  PostgreSQL 18 container. It covers real rollback, concurrent receipt reuse,
  changed-payload conflicts, exact-event isolation, guest claim invalidation,
  sender/recipient revocation, history bounds, completion and deletion privacy.
  The container was removed after testing; no existing database was changed.
- Native English/Spanish localization checks pass for **1,432 strings**,
  including rendered event terminology. The existing AppCopy dynamic-key
  extraction warning remains. Both repositories pass `git diff --check`.

Logs: `/tmp/gatherory-announcements-20261020-r2.log`,
`/tmp/gatherory-announcements-web-tests-20261020-r2.log`, and
`/tmp/gatherory-announcements-typecheck-20261020.log`.
The native [verification record](../../../../ios-apps/gatherory/docs/testing-verification.md)
contains the command and result bundle. No automated UI tests were run.

Audience follow-up verification on October 20: **855 native non-UI tests in
120 suites pass**, **512 web/server tests pass / 33 environment-gated skips**,
TypeScript and formatting pass, and **1,447 English/Spanish strings** pass
localization and rendered terminology checks. Real PostgreSQL audience tests
also pass separately, verifying account/device-guest privacy, host moderation,
contributor/view-only rights, role changes before dispatch, audience-bound
receipts and filtering before the history limit. Disposable test databases were
removed; existing databases remain unchanged. Logs:
`/tmp/gatherory-audience-native-20261020-r2.log`,
`/tmp/gatherory-audience-web-tests-20261020.log`, and
`/tmp/gatherory-audience-typecheck-20261020.log`. No UI tests, live pushes,
deployment, build upload, commit or push were performed.

The initial additive migration is
`drizzle/20261020212025_colossal_talon/migration.sql`. It adds the table and
notification enum value. The audience follow-up is
`drizzle/20261020215955_colossal_sunset_bain/migration.sql`, adding the audience
enum/default and generic author label. Both have only been applied to disposable test databases.
Before testing on an iPhone against another environment, separately approve and
apply the migration, run the matching backend, and install the updated native
build. Existing environments have not been migrated by this task.

Physical-device acceptance remains:

1. Host sends to each audience; verify Planning is absent for account/device
   guests, Guests is absent for collaborators, and All reaches both groups.
   Hosts can read guest history, but guest-targeted alerts go only to guest
   roles. No parent/sibling event details appear. A contributing planner can
   send only to Planning; view-only planners and attendees cannot send.
2. Dismiss/reopen the composer after a failed send; retry the same text and check
   one canonical message and no duplicate notification intent. Change the
   audience explicitly and verify it becomes a different send, never a retry
   using the first audience's request ID.
3. Dispatch with the existing manual `pnpm notifications:dispatch` command in
   the approved test environment. Check foreground/background/terminated launch
   and a tap into Updates. Permission denial must still allow reading Updates.
4. Revoke event access or change accounts while a fetch/send/tap is in flight;
   check that no previous account's content appears. Test guest-to-account claim.
5. Check English/Spanish, larger text, VoiceOver, haptic feedback, and offline
   failure wording. Confirm notes and ordinary sync continue working.

Production dispatcher scheduling, production APNs acceptance, broader delivery
operations and rollout remain separate release work. No social features,
personal reminders, browser expansion or billing are added.
