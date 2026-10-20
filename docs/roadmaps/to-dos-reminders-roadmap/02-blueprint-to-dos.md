# Blueprint To-dos

**Status:** Implemented in the October 20, 2026 checkpoint. Not deployed.

Blueprints can carry reusable To-do definitions. In workspace sharing and
blueprint saving, To-dos start excluded. **Include To-dos** opts into the exact
event's eligible items; detailed content selection can choose individual items.
Reloading source content clears the selection. Opening sharing never creates a
link. Existing links keep their immutable publication pin; reopening a link or
QR does not change its content or silently create a replacement.

Only the title, optional HTTP(S) website and main/sub-event placement travel.
Assignments, people, completion, original due dates and reminder settings never
enter the portable definition. The recipient sees read-only definitions in the
preview and installation review. Saving a blueprint preserves them in a private,
independent snapshot. Creating a workspace remains explicit and creates fresh,
unassigned, unfinished tasks without due dates, under the existing transaction.
Separate installations have separate task IDs and completion state. Tasks for
excluded sub-events are omitted using the existing review explanations.

## Contract and access

- Optional module `todos@1`, key `starter_todos`, config `{ todos: [...] }`.
  Definitions have stable `key`, `title` (1–200 Unicode characters), optional
  validated `websiteURL` and an existing main/child `target`. Limits are 100
  definitions; titles remain flexible and need not be unique.
- Capture source reads canonical `event_todo` rows only for the authorized
  source event and its individually authorized children. Source output exposes
  only ID, event ID, title and website. Selection `todoIds` defaults to empty;
  unknown IDs or tasks targeting unselected children fail validation.
- `planning.todos_v1` enables installation. The module is optional so older
  clients omit it with the existing compatibility explanation. New clients
  retain the ordinary `event-todos-v2` sync capability and authorization rules.
- Draft/source/plan models decode old missing arrays as empty. Empty task modules
  are omitted from publications so existing catalog pins and hashes remain
  intact. Frozen installation inputs remain unchanged; no new install selection
  field or automatic reminder is introduced.
- Canonical task rows, manifest IDs, archive payloads, native entities/versions
  and installation receipt commit together. Failure rolls back the whole copy.
  Later edits use the existing To-do permissions, offline outbox and recovery.
- Native saved-copy and personal-draft conversion preserve definitions when
  editing other content. Web child-deletion dependency checks count tasks too.
  Publishing and Search visibility remain explicit; saved copies stay private.

## Verification and release checks

Run the complete native `GatheroryTests` target (excluding UI tests), native
English/Spanish localization checks, `pnpm test` (includes generated contract
freshness), and `pnpm typecheck`. Run capture/installation database integration
suites only against a new disposable database with the full migration chain.
Local results (October 20):

- Native non-UI target: **711 tests in 97 suites passed**. Result bundle:
  `/tmp/gatherory-blueprint-todos-native-20261020-r2.xcresult`.
- English/Spanish localization: **1,339 strings** passed, with the existing
  generic dynamic-key extraction warning only.
- Full ordinary backend suite: **478 passed, 26 environment-gated skips**,
  across 79 passing files. `pnpm test` also verified generated-contract
  freshness. `pnpm typecheck`, changed TypeScript/TSX formatting, and whitespace
  checks in both repositories passed. Web log:
  `/tmp/gatherory-blueprint-todos-web-tests-r2.log`.
- Four database integration suites passed against a fresh disposable PostgreSQL
  18 database: capture, installation, sharing and link management. Tests cover
  child-only isolation, source field whitelisting, fresh IDs/reset state,
  canonical/native versioned rows, capability omission, transactional rollback,
  sync upgrade-required recovery, and existing copy survival after revocation.
  The disposable database/container was removed; existing databases were not
  reset or migrated.
- UI tests were skipped as requested. No device appearance, physical haptic or
  deployed compatibility acceptance is implied by these checks.

The first complete runs exposed additive fixture expectations (new empty task
arrays and URL-schema bounds), legacy review-hash expectations, and a native
mock that expected current capabilities for historical requests. The fixes
retain exact legacy request bodies and explicit legacy hash assertions; the
passing runs above include those checks.

Before release, use two physical devices to verify default exclusion, explicit
inclusion, main/sub-event preview placement, website opening, private saving,
and two independent workspace copies. Complete/assign/date an item in one copy
and confirm the source and other copy stay unchanged. Check offline relaunch and
sync, conflicting edits, account switching, revoked source access, and a saved
copy after link revocation. Verify the default-off switch and content with large
text, VoiceOver and both languages. Check old clients omit the optional module;
existing task-bearing workspace scopes must retain upgrade-required recovery.

Deploy the matching server and the already pending shared-To-do migrations
before enabling task installation in the native release. This extension adds no
new database migration. Live deployment, physical-device and cross-device
acceptance remain separate. No deployment, existing database reset, build
upload or push is authorized by this implementation request. The user
subsequently authorized committing the checkpoint in both repositories.

Personal reminders, date-relative task scheduling, task-definition authoring
tools and social features remain outside this slice.
