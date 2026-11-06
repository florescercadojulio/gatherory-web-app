# Core Gathering Guest and Server Audit — 2026-11-04

## Scope and checkout

Reviewed core event invitation, guest, event authorization, and guest projection behavior in the web/server repository, plus native guest invitation tests and authentication/sync guidance. Explore and Blueprint feature suites were excluded. This was an audit; no source behavior was changed.

All checks and this document are from `/Users/nexus/Documents/gatherory/gatherory-web-app`, branch `main`, HEAD `93902bb1b8b98a19a96c6a66eccde1349df6f84c` (`main...origin/main [ahead 4]`). The checkout already had extensive unrelated modified and untracked work; those changes were left untouched. Installed versions: Effect `4.1.1`, `@effect/sql-pg` `4.1.1`, Drizzle `1.0.0-rc.4`, Vitest `4.1.11` (Node `26.12.0`). `pnpm intent list` succeeded (19 intent-enabled packages, 78 skills). No relevant skill matched an audit with no implementation changes, so no skill was loaded.

## Server permission findings

- The permission vocabulary has `host`, `collaborator`, and `guest`; planning levels are `manage`, `contribute`, and `viewOnly`. Hosts map to manager access; guests always map to viewer access regardless of their planning-permission field. Viewer access includes event/idea/timeline/media reads, registry read/commit, and attendance response; it excludes note sending and planning mutations. Contributors gain idea editing/decision, timeline management, child creation, media upload, and note sending; managers additionally gain event and participant management, registry management, and media management. Source: [permissions.ts](/Users/nexus/Documents/gatherory/gatherory-web-app/src/lib/permissions.ts:14).
- `ensureEventPermission` fails closed on an empty permission declaration, resolves participation for the exact event and authenticated user, denies absent participation, normalizes persisted view-only values, and delegates the requested action to `EventAuthorization`. Source: [authorization.ts](/Users/nexus/Documents/gatherory/gatherory-web-app/src/server/events/authorization.ts:7).
- Server architecture requires authentication and authorization to remain separate, repository-backed participant checks for event content, and service checks even when middleware already checks. Guest access is event-scoped and does not imply workspace membership. Invitation preview/acceptance uses token authorization before participation exists. Source: [server-architecture.md](/Users/nexus/Documents/gatherory/gatherory-web-app/docs/architecture/server-architecture.md:257).
- Public share-link previews use their token path. Email-bound invitation previews require a signed-in user and pass the signed-in email into the event service. Source: [preview-event-invitation.workflow.ts](/Users/nexus/Documents/gatherory/gatherory-web-app/src/server/events/workflows/preview-event-invitation.workflow.ts:8).
- Guest invitation projections are read-only, and the data-model invariant says guest participation is view-only. Source: [data-model.md](/Users/nexus/Documents/gatherory/gatherory-web-app/docs/architecture/data-model.md:177).

## Server tests

Command run from the checkout above:

```sh
pnpm vitest run tests/effect/event-authorization.test.ts tests/effect/event-guest-service.test.ts tests/effect/events-architecture.test.ts tests/effect/organization-authorization.test.ts tests/contracts/guest-capability.test.ts tests/contracts/event-invitations.test.ts tests/contracts/event-share-link-http.test.ts tests/contracts/browser-guest-boundary.test.ts tests/effect/browser-guest-invitation.test.ts tests/unit/event-change-policy.test.ts tests/unit/event-terminology.test.ts tests/unit/event-invitation-presentation.test.ts tests/unit/guest-invitation-content.test.ts tests/unit/event-authorization-middleware.test.ts tests/unit/organization-authorization-middleware.test.ts tests/unit/scoped-event-projection.test.ts tests/unit/browser-guest-request-guard.test.ts tests/unit/browser-guest-session-adapter.test.ts
```

Result: **18 test files passed; 112 tests passed**, Vitest 4.1.11, duration 4.97s. These are in-memory unit/effect tests, contracts, and source-architecture checks. For example, `event-guest-service.test.ts` provides a fake `EventGuestRepo` returning prepared projections. Browser guest boundary/session tests also use local test inputs/adapters. These results do not establish Postgres or running-service behavior.

### Isolated database checks

An isolated database run was possible. `pg_isready` confirmed the local PostgreSQL container on localhost:5438. A script parsed `.env.local` in memory and reported only that its URL points to localhost, port 5438, database `gatherory`; credentials were never printed. The configured local role could create databases. I created `gatherory_budget_test_codex_eda2943843a74fdb9adad3d1b484352c` from `template0`, ran `pnpm exec drizzle-kit migrate` against only that new database, ran the suites below with `DATABASE_URL` overridden in the test process, then dropped that database. No existing database was migrated, reset, seeded, or otherwise modified.

The invitation Effect suite checks the loopback host before DB imports, uses UUID fixture names, wraps writes in a transaction, and throws a sentinel to roll back ([lines 6–9, 53–60, 949–979](/Users/nexus/Documents/gatherory/gatherory-web-app/tests/effect/event-invitations.database.test.ts:6)). Event lifecycle uses temporary tables and a deliberate rollback. Device guest capability and browser guest invitation tests use UUID-scoped fixtures and `finally` cleanup. The budget suite requires a database name beginning `gatherory_budget_test`, uses fixture cleanup, and ran only on the newly created disposable database.

Command-equivalent test invocations (each received the disposable database URL through a process-local environment override):

```sh
pnpm exec vitest run tests/effect/event-invitations.database.test.ts tests/effect/event-lifecycle.database.test.ts tests/integration/device-guest-capability.database.test.ts tests/integration/native-budget-sync.database.test.ts
pnpm exec vitest run tests/integration/browser-guest-invitation.database.test.ts
pnpm exec vitest run tests/integration/guest-claim-feed.database.test.ts
pnpm vitest run tests/effect/mcp-notes-tasks.test.ts tests/effect/event-authorization.test.ts
```

Results: first command **4 files / 11 tests passed**; browser guest invitation **1 file / 1 test passed**; guest claim feed **1 file / 1 test passed**; MCP notes/tasks and event authorization **2 files / 22 tests passed**. The guest claim feed was first invoked after I had already dropped the initial disposable DB, so that attempt failed at connection with SQLSTATE `3D000` (database missing). I recreated the same uniquely named disposable database, applied migrations again, reran the test successfully, and dropped it afterward. This was a harness-ordering error, not a test assertion failure.

Exact DB/HTTP suites skipped: `tests/integration/device-guest-http.database.test.ts` (`RUN_DEVICE_GUEST_HTTP_TESTS`) and `tests/integration/invitation-http.database.test.ts` (`RUN_INVITATION_HTTP_TESTS`). The latter requires an existing local app server, inserts users/sessions/events, calls invitation/RSVP/note APIs, and uploads a fixture asset ([lines 5–18, 64 onward](/Users/nexus/Documents/gatherory/gatherory-web-app/tests/integration/invitation-http.database.test.ts:5)). It was not invoked; no invitations or messages were sent. Notes/tasks permission behavior has mock-backed coverage in `mcp-notes-tasks.test.ts`; the DB invitation HTTP guest-denial path remains unverified. The matching schedule-named test files found were Blueprint schedule suites, excluded by scope.

## Native guest coverage inspected

Native tests were read but not executed. `GuestInvitationsTests.swift` covers account cache isolation, guest-only locked viewer configuration, read-only projection, RSVP refresh, acknowledgement-required leave, and delayed response/leave races. Additional identified suites include `DeviceGuestInvitationClientTests.swift`, `EventInvitationTests.swift`, `GuestAttendanceRecoveryTests.swift`, and `GuestAuthenticationTests.swift`. Native authentication guidance says device guest identity uses its own credential namespace, attendance does not grant planner access, private/email invitations require real sign-in, and RSVP is not shown as sent without server acknowledgement ([auth-integration.md](/Users/nexus/Documents/gatherory/ios-apps/gatherory/docs/auth-integration.md:40), [offline-sync.md](/Users/nexus/Documents/gatherory/ios-apps/gatherory/docs/offline-sync.md:111)). No `xcodebuild` was run, per scope.

## Acceptance limits

Evidence is source review, 112 passing in-memory/contract tests, 13 passing isolated database tests across 6 files, and 22 passing focused note/task and authorization tests. There is still no HTTP server, deployed-service, or device evidence. Core schedule behavior has no separately run narrow check here. The opt-in invitation HTTP suite remains skipped because it requires an existing local server in addition to a local database.
