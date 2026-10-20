# Shared event To-dos

**Status:** Implemented in the October 20, 2026 checkpoint. Not deployed.
**Scope:** The first slice of [simple To-dos and reminders](README.md).

## Everyday use

Open the event, then **Manage → To-dos**. Tap **+**, enter a title and save.
The date is optional: tap **Add due date** to choose one, or remove it later.
An optional website opens through an explicit web link. Tap the circle to complete an item; select **Completed**
and tap again to undo. Tap a title to edit or delete, with one confirmation for
deletion. Main events and sub-events have separate lists. Duplicate titles are
allowed. Manage previews one of the current planner's assigned unfinished items
first. When they have none, it offers an unassigned item they can take, with a
direct icon-and-label Take button. Tasks assigned to someone else do not fill
this personal preview. Each group orders by earliest due date, then newest
unfinished item when no dates are set. Completed items are excluded.
There are no priorities, progress charts or new app-wide tabs. A native
**Upcoming / Completed** segmented control switches the local list. Upcoming
includes all unfinished items, including overdue ones. Adding successfully from
Completed returns to Upcoming; edits retain the selected segment. Completing or
undoing an item moves it out of the selected list. Account changes close the
editor and reset the selection to Upcoming.

The native editor and date picker follow the existing Idea editor's visual
style: an adaptive system background, soft gray grouped fields, standard section
labels, native toolbar actions and the exact event shown above the editor.
The task list uses one soft gray inset-grouped surface, with separators between
rows on an adaptive background. There are no nested task/action cards.
Manage uses one outer card with flat
preview content; the Take action has no additional filled card or pill.
New items use **New To-do → Add**; existing items use **Edit To-do → Save**.
The palette follows dark appearance and accessibility settings. Visual acceptance
on physical devices remains required; this styling pass does not change the
shared data model, validation, permissions or offline transaction behavior.

Take uses a short native icon-and-label action (with the full accessible name),
sharing a compact action line with Website when present. This stacks at narrow
widths and keeps separate 44-point targets. Titles use normal content styling
with a disclosure cue for editing. Completed items have quiet checkmarks and
secondary text in their own segment;
tapping a completed checkbox undoes completion, without a duplicate Undo row.
No completion dates
or calendar groupings are invented from creation dates. Short system haptics
follow successful local actions, after the archive/outbox save succeeds; sync,
appearance and failed saves do not trigger them. Haptics complement visible
feedback and do not indicate server acknowledgement or notification delivery.
Assignee names show the existing participant profile photo with initials as a
fallback; the Take action uses the current planner's avatar. Manage previews
and the editor's assignment choices reuse the same avatar component. The
current account's latest photo takes precedence for that account. Assignee
lookup requires readable access and an active non-guest participant in the
exact event; no extra account/profile lookup or permission grant is introduced.

An item may be unassigned or assigned to an active, signed-in host or collaborator
with Manage/Contribute permission for that exact event. Planning writers can
assign, reassign and clear assignment. **Take this to-do** assigns an unassigned,
unfinished item to the current planner. Assignment grants no new permissions.
Concurrent claims use the existing version conflict recovery instead of silently
stealing an assignment. If an editor's item changes during a received sync, Save
retains the draft and asks the person to reopen it to see the latest version.
An unavailable former assignee can remain on history; other fields can still be
edited, and a writer can explicitly clear or replace the assignment.

Read-only collaborators can view the list. Active hosts and collaborators with
Manage or Contribute planning permission can change it while that exact event
is writable. Guests do not receive planner To-dos. Archived, cancelled or
completed events retain readable history but cannot be edited. Existing event
and account access remains authoritative; workspace membership does not grant
access to an unrelated child list.

## Implementation boundaries

- Server `event_todo` stores the stable UUID, organization/event, title,
  optional date-only due value, website URL, assignee person UUID, explicit
  completion Boolean and timestamps.
  Organization/event foreign keys cascade with event deletion. The generated
  additive migration is `drizzle/20261020135353_polite_klaw/migration.sql`.
  Optional website/assignment columns are added by
  `drizzle/20261020143402_parallel_sunspot/migration.sql`; existing rows remain
  unassigned with no website. Assignee validation checks exact-event access at
  the server; changing a task cannot assign a guest, read-only planner, an
  unaccepted contact, or a person from another event/organization.
  The legacy native repair script excludes task replay: these rows and sync
  receipts are materialized transactionally from feature launch, and historical
  update/delete replay must not revive tasks or bypass their version guards.
- Native `EventTodo`, `PlanningWorkspace` and the optional version-1 archive
  `todos` array extend existing persistence. Old archives decode as empty.
  `ManageTodosView` saves the archive and outbox through the existing persistence
  controller, restoring the visible draft if local persistence fails.
- Sync uses entity type `todo`, stable mutation IDs, receipts, tombstones and
  explicit completion values. Updates/deletes require the recorded server
  version. Account/scope-keyed `RemoteEntityVersionRecord` values are committed
  with received pages or acknowledgements. Pending drafts keep their original
  comparison version; a pull does not silently rebase a conflicting edit.
- Ordinary root sync checks the actual target event's grant. Child-only sync
  supplies an isolated canonical archive plus supplemental task records carrying
  the same root-log entity versions, allowing safe edits from either projection.
  Pending drafts stay visible across archive refreshes. Deletion cannot be
  undone by a stale retry; unsent create/delete pairs cancel locally.
- The server overwrites embedded archive task arrays from canonical authorized
  storage. A workspace snapshot cannot bulk-edit tasks or erase them. Planner
  checks apply to bootstrap, pull, push and materialization. Child grants do not
  expose parent or sibling payloads, and guests receive no task data.
- Native advertises `event-todos-v2` in `x-gatherory-capabilities`. Older clients
  receive HTTP 426 `todos_client_upgrade_required` for scopes with readable task
  state/history before consuming unsupported records or overwriting task data.
  This includes the earlier v1 build, which cannot preserve website/assignment
  fields. The app uses existing update-required recovery presentation.
- Website values are optional explicit HTTP(S) URLs, at most 2,048 Unicode
  scalars after normalization, with a host and no credentials, whitespace,
  control characters or backslashes. No preview fetch or notification is
  scheduled. Optional nil website/assignee fields encode as explicit JSON null
  when cleared; missing fields in legacy data preserve existing server values.
  Root and child mutation logs store normalized complete task payloads alongside
  their matching entity versions; incremental historical values retain their
  historical version rather than being rewritten from newer state.
- Titles are trimmed, nonempty and at most 200 Unicode scalars. Due dates are
  valid Gregorian `YYYY-MM-DD` values (year 0001–9999), interpreted as an event
  calendar date rather than a notification instant. Native numeric `createdAt`
  remains Foundation reference-date seconds, preserving the existing wire format.

The hierarchy revision follows the Apple design skill's `layout.md` › Visual
hierarchy (group through alignment, spacing and separators), `lists-and-tables.md`
› Content (succinct rows), and `buttons.md` › Best practices (recognizable actions
and adequate hit regions). The nested-action card was a Gatherory design issue;
removing it is a product judgment, not an Apple requirement to avoid all cards.
`segmented-controls.md` › Mobile supports switching closely related subviews
with a native segmented control.
No exact visual/contrast or physical haptic acceptance is claimed by code tests.

## Verification

Use the non-UI native test target and `scripts/verify-localizations.sh` in the
iOS repository. Backend checks are `pnpm test`, `pnpm typecheck`, generated
contract checks and the opt-in scoped sync/lifecycle/identity database suites.
The database suites must use a disposable local database, never a development
or production database reset. UI tests are excluded at the user's request.

October 20 local results:

- Complete native non-UI target: **706 tests in 97 suites passed**. Result bundle:
  `/tmp/gatherory-todo-status-tabs-native-20261020-r2.xcresult`.
  The added profile lookup test covers exact-event active membership,
  read-only visibility, and guest/invited/unknown/cross-event rejection.
- Ordinary backend suite and generated contract check: **474 passed, 26 skipped**
  (79 passing files; provider/database suites remain opt-in).
- Dedicated disposable PostgreSQL run: **9 passed** across scoped event sync,
  event departure materialization and native workspace identity. The To-do
  integration covers exact-event/root/child authorization, guest exclusion,
  read-only writes, validation, duplicate retries, comparison-version conflicts,
  deletion/tombstones, website validation/clearing, exact-event assignment,
  concurrent claims and older-client capability gates. Native tests additionally
  cover legacy decoding, explicit null encoding, metadata roundtrips and preview
  ordering, current-assignee priority, claimable fallback and account/event-scoped
  previews. The full migration
  chain applied successfully to this disposable database only.
- `pnpm typecheck` passed. English/Spanish localization checks passed for
  **1,337 strings**, with the existing dynamic-key extraction warning only.
- `git diff --check` passed in both repositories. UI tests were not run.

## Remaining device and deployment checks

Before release, check on physical devices with two signed-in planners:

1. Add a title-only task, tap to set/remove a date, set/open/remove a website,
   assign/reassign/clear, take an unassigned item, complete/undo and delete.
   Confirm the Manage preview prioritizes the current account's assigned work,
   then claimable unassigned work, and follows the selected event. Confirm both
   status segments and their empty states, completion/undo moving items between
   them, successful Add returning to Upcoming, keyboard, VoiceOver actions,
   large text, and English/Spanish copy.
   Compare the To-do editor with the Idea editor in light/dark appearance and
   verify the destination card, grouped form fields and toolbar labels. Check
   that the list has one gray grouped surface and the Manage preview contains
   no nested filled action container.
   Check profile photos, initials fallback, unavailable/offline images and
   account switching in list rows, Take, assignment choices and Manage previews.
   Check checkbox undo and system haptic feel on a supported iPhone. Verify failed
   saves and received remote changes produce no success haptic, and check
   behavior with system haptics disabled and Reduce Motion enabled.

2. In airplane mode, add/edit/assign/claim/complete, force-quit and reopen, then reconnect.
   Verify the other planner receives the result once, and conflicting edits or
   deletion use the existing sync recovery controls. Have both planners take
   the same item concurrently; one assignment succeeds and the other is retained
   for conflict recovery. Receive a remote edit while an editor is open and
   verify its draft cannot silently overwrite that change.
3. Exercise read-only and guest accounts; a child-only collaborator; parent and
   sibling isolation; archive/cancel/completion; revocation while a draft is open;
   account switching and sign-out/relaunch. Offline devices learn permission
   changes on the next successful sync, following existing offline behavior.
4. With an older app (including To-dos v1), verify the update-required response for a task-bearing
   scope, including after its last task is deleted. Confirm upgrading preserves
   existing unrelated offline data and drafts.

Deployment is separate and requires approval: apply the additive migration
before deploying the backend that reads `event_todo`, then release the matching
native client. Do not enable the new client against an older server that lacks
the `todo` entity contract. Review the mixed-version update-required experience
before rollout. The migration has only been applied to a disposable local test
database. No deployed database, app build, or live service has been changed.

Personal reminders, notification authorization/scheduling, a Home preview,
blueprint capture/installation of task definitions, and all social or billing
features remain deferred. A due date never schedules a reminder.
