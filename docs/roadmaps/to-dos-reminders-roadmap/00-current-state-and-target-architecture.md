# Current state and implementation boundaries

**Status:** Shared To-dos and optional [blueprint definitions](02-blueprint-to-dos.md)
implemented locally; reminder sections are future design.
**Reviewed:** October 20, 2026; changes on top of server `4806dad`, iOS `e1bdab6`.

## Current truth

The native app already has event-specific Home and Manage surfaces, local
SwiftData persistence, transactional outbox mutations, account isolation and
event-scoped server sync. Shared To-dos now extend those paths through the
`todo` entity, `event_todo` table and optional archive `todos` array. Native
Manage provides title, optional date/website/assignee, completion and deletion,
plus a preview prioritizing the viewer's assigned work, then claimable unassigned
items (earliest due then newest within each group). Planning writers
can take an unassigned item; concurrent claims use ordinary entity versions.
These local
changes have not been deployed. There is still no local notification scheduler.

`AccountView.swift` has a global `@AppStorage("planningNotifications")` boolean
defaulting true. `PermissionPrimerView.swift` has notification artwork/example
copy. Neither is system authorization, explicit personal reminder consent or
evidence of delivery. Do not schedule from that legacy boolean or create a
second contradictory toggle. The reminder slice must give Account settings a
truthful relationship to actual OS authorization and account-scoped preferences.

`CalendarEventEditor.swift` creates an explicit calendar copy through the system
editor; it is not a task/reminder scheduler. Do not request calendar/Reminders
access or repurpose that integration for this feature.

Blueprint capabilities currently do not include executable checklist items.
Guidance and idea prose must not be parsed into to-dos or treated as completed
tasks. The existing host-authored roadmap's instance/definition boundaries remain
applicable, with simple manual to-dos now proposed ahead of automated stay rules.

## Shared state and authorization

- A live to-do belongs to one concrete event and its organization, with a stable
  ID, title, optional date-only due value, completion state and version/deletion
  metadata. The server owns synchronized state; native committed local state
  drives rendering and preserves pending edits. Do not store live tasks in a
  blueprint JSON document, idea configuration or a separate parallel sync engine.
- Explicitly permit hosts/collaborators to read and existing planning writers
  to mutate. Generic event read access can include guests, so reusing it without
  a planner check would be a leak. Require the same rule in native projections,
  ordinary sync, child-scoped sync and every write/materialization path.
- A parent workspace organization or template-author role grants no additional
  event access. Validate event ID/organization and current participant grants;
  reject cross-event moves or forged relationships. Follow existing cancellation,
  archive, departure and deletion lifecycle rules for read/write eligibility.
- Use explicit completion values, not a retryable “toggle” command. Local edits
  and outbox writes commit together. Stable mutation IDs, server validation,
  receipt/cursor transactions and conflicts must work for the new entity.
  Deleted records must not return through stale edits or notification callbacks.
  Ordinary sync status remains in Account; do not add technical sync badges to
  every to-do. Use existing recovery UI for edits that actually need attention.
- Extend the native archive/model, mutation contract, outbox diff/merge, server
  materializer and scoped projections together. Follow the existing pure Effect
  workflows/live bindings and native sync exception documented in the onboarding
  guide; do not introduce a generic task workflow runtime.

## Personal reminder state and side effects

The first reminder implementation is device-local and keyed to the canonical
account, event and item. Its desired time/zone, explicit enablement, scheduling
outcome and cancellation state are separate from shared task state. They are not
visible to collaborators and do not enter a blueprint or shared task payload.
A second/new phone does not automatically arm reminders from a restored copy.

Commit local intent before requesting a notification. Reconcile OS requests from
that committed state with stable scoped identifiers; OS scheduling is an effect
after persistence, not part of the task database/outbox transaction. Handle a
crash between commit and schedule/cancel without duplicate requests or revival
of disabled reminders. Report “Reminder not set” inline if scheduling fails;
never undo a saved task because notification permission or scheduling failed.

Reconcile on launch/foreground, committed local changes, received sync changes,
authorization/settings changes and account lifecycle. Cancel pending and relevant
delivered notifications for completed/deleted/inaccessible items when observed.
On sign-out/account switch cancel the outgoing account's requests; discard stale
callbacks and guard A → B → A transitions. Notification payloads contain routing
IDs, not bearer sharing credentials or private source records. Tapping must
recheck the current account and access rather than selecting an old account.

A remote completion or permission revocation cannot be observed while the phone
is disconnected. Use generic notification content to avoid exposing old private
task details in this window; validate access when opening. If a canceled local
completion is later rejected, recover the task using existing conflict UX, but
do not silently re-arm its old notification. A person can choose a new reminder.

Due dates are event-zone calendar dates. Reminder times are confirmed instants
with a named zone; validate missing, past, ambiguous or nonexistent local times.
Do not silently reinterpret an ambiguous selection. Device travel must not shift
a confirmed instant; event/date edits must not silently reschedule it. Expired
reminders do not turn into a burst of catch-up alerts on relaunch. OS notification
settings and delivery policy remain authoritative; no exact-time guarantee.

Check the platform's pending-request capacity before promising all reminders are
scheduled. Surface an item-level failure if a request cannot be retained; do not
silently drop later reminders or require a background refill to keep the promise.

## Blueprint extension, after the first version

Add an independently versioned portable task-definition module only when its
storage, authorization, installation and native support are ready. Carry titles
and explicit main/child targets initially; fresh copies receive new live IDs,
unchecked state and no assignees, history, absolute deadlines or enabled reminders.
Creating or saving a private copy schedules nothing. Include only deliberately
selected supported task content in capture; never leak personal reminder state.

Preserve immutable revisions, independent saved snapshots, exact frozen install
requests and atomic installation/materialization/import. Gate unsupported required
modules and explain optional omissions using existing compatibility rules. Later
relative due dates need typed anchors and separate confirmation; `main_start`
must not be overloaded as arrival/departure, and missing dates remain unresolved.

## Acceptance gates

| Slice               | Required evidence before completion                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared to-dos       | Title-only add; complete/undo; duplicate titles; due date optional; relaunch/offline recovery; stable retry; conflicting edits/deletion; guest denial; read-only collaborator denial on writes; parent/child/sibling and account isolation; denied pending writes recover truthfully.                                                                |
| Personal reminders  | Consent refusal keeps tasks usable; permission/settings truth; one-off schedule/replace/cancel; failure feedback; crash/relaunch deduplication; no re-arm after completion/undo; explicit times/DST/travel; expired/capacity handling; sign-out and A→B→A isolation; revoked access; tap routing; documented remote/offline cancellation limitation. |
| Blueprint extension | Fresh unchecked copies and IDs; no personal reminder data or automatic scheduling; selected capture only; independent edits; unknown-module handling; exact install retry; original source revocation does not alter saved copies.                                                                                                                   |

Use non-UI domain, authorization, sync, transport and scheduler-adapter tests plus
English/Spanish localization checks. Keep UI tests excluded unless separately
requested. Physical-device acceptance must cover permission denial, app restarts,
Focus/notification settings, multiple accounts/devices, remote completion while
offline, lock-screen privacy, VoiceOver, large text and current/minimum OS.

Implementation evidence and release gates for shared To-dos are recorded in
[01 — Shared event To-dos](01-shared-event-to-dos.md). Reminder acceptance remains
future work; no notification or deployment changes have been made.

## Sources and design basis

- [Server implementation guide](../../development/server-implementation-guide.md)
  and [AI onboarding](../../development/ai-onboarding.md).
- Server source: `src/lib/permissions.ts`, `src/server/sync/contracts/`,
  `src/server/sync/repos/scoped-event-sync.persistence.ts`.
- Native source: `Gatherory/Features/Manage/`, `Gatherory/Features/Account/AccountView.swift`,
  `Gatherory/Data/Persistence/WorkspaceOutboxWriter.swift`, `Gatherory/OfflineSync/`,
  `Gatherory/DesignSystem/Components/PermissionPrimerView.swift` and `docs/offline-sync.md`.
- Apple design skill references: `layout.md` › Visual hierarchy (progressive
  disclosure); `lists-and-tables.md` › Content (succinct rows); `accessibility.md`
  › Mobility/Vision (usable targets, large text and non-color status);
  `privacy.md` › Requesting permission (ask in context). The single list and
  phased scope are Gatherory product recommendations, not Apple requirements.
- [Apple: asking permission to use notifications](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)
  and [scheduling a notification locally](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app).
