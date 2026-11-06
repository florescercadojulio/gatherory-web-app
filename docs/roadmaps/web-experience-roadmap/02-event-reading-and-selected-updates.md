# 02 - Event Reading and Selected Updates

**Status:** Implemented locally — November 3, 2026. Selected browser planner interactions are verified at narrow widths and with Android API 37 Chrome keyboard resizing; broader authorization, physical-device, accessibility, and deployment acceptance remain open.
**Priority:** P1
**Depends on:** 01 - Invitation, accountless guest RSVP, and signed-in event entry

## What this is

A mobile-first browser event experience for people who arrive through a scanned
invitation, especially on Android. It makes approved event information easy to
read, then offers a small set of deliberate updates where the existing role
and event policy allow them. Accountless guests can complete their own RSVP
through the scoped guest flow defined in slice 01; they do not enter the
authenticated planning workspace.

The browser remains a companion for reading and a few useful actions. It is not
a full native planning replacement. MCP remains the existing integration for
broader structured access; developer consoles, API keys, and webhooks are later
work and should not be prerequisites for these user-facing flows.

## Why it exists

A person following an event invitation from an Android browser needs to
understand the event and take a small number of high-value actions without
having to find an iPhone. Reading should be the default. Any write action must
be bound to the acting participant, their role or scoped guest capability, and
the event's current policy.

## Current implementation

The authenticated `/events/$eventId` surface now reads the exact authorized
planner event through a dedicated browser contract. It shows dates/time zone,
location, description, own attendance, people, independently authorized child
schedule links, tasks and notes. Sections are capped at 50 items with explicit
truncation copy. A child-only collaborator receives no parent or sibling
identity/content. Accountless and signed-in guests retain slice 01's narrow
invited-event summary and own RSVP; they cannot read this planning projection.

REUI Frame and owned Base Nova primitives provide the responsive reading flow,
response panel and explicit details dialog. English and Spanish copy cover the
new states. Overview titles and signed-in invitation continuation open the exact
event. The route establishes identity without provisioning a workspace or
implicitly granting parent access.

The selected writes are implemented: own RSVP when open; versioned task
completion/undo for hosts, managers and contributors; idempotent own-note
creation for those same planning roles; and title, description and location
**name** edits for hosts/managers. View-only collaborators retain their own RSVP
but no planning writes. Closed events/parents disable writes. Missing native
snapshots/versions retain reading without offering unsafe updates.

Server functions enforce session, current event/resource policy and same-origin
writes. Pure Effect workflows use injected ports; only live composition binds
adapters. Selected writes reuse the existing native transaction/materialization,
receipt and change-stream engine. A private root-details command merges three
allowed fields into the locked latest archive, preserving unrelated concurrent
updates. Native envelopes are never browser contracts. Stale edits require a
refresh and explicit reviewed version adoption while retaining the draft;
uncertain note retries retain their original key/body.

See the [implementation and acceptance record](../../development/event-reading-selected-updates-2026-11-03.md)
for test results and remaining acceptance limits. Ideas, registry, media,
budgets, date/time and broader authoring remain deferred.

The [mobile browser acceptance update](../../development/mobile-browser-acceptance-2026-11-03.md)
records the 320×400 details-editor fit/save/reopen and focus-return check, child
task completion/undo and note creation at 320×568, and viewport resizing above
the Android software keyboard. The long description and new title were saved
and reopened in the in-app browser; Android editor text-value saving was not
verified. Physical QR scanning, Dark mode, live Spanish UI, child-only parent
denial, view-only control visibility, collaborator approval refresh, and full
assistive-technology acceptance remain open.

## Target behavior

1. Follow slice 01's established entry path. An accountless guest may preview
   the invitation, establish the explicit scoped browser guest capability, and
   submit only their own RSVP without creating an account. A signed-in
   collaborator who requires approval follows the separate authenticated
   approval path. Preserve invitation and event context through either flow.
2. Keep guest invitation/RSVP access separate from authenticated planning
   routes. Accountless guests do not access ordinary `_protected/workspaces`
   pages or private planning lists. Any guest-visible event details must come
   from the explicitly scoped guest projection. Do not assume it includes a
   participant roster; roster access requires a separate product and contract
   decision. For signed-in planning participants, show their authorized event first:
   title, description, date and time with its time zone, location, current
   person's attendance, people, and child events. Make each child event's
   purpose apparent; show parent context only when independently authorized.
   A child-only collaborator sees that child as their local planning root,
   without parent/sibling content. Show schedule, ideas, notes, todos,
   registry, or media only when the current role is allowed to read that
   resource and a browser-readable projection/contract exists.
3. Keep every first-release write narrow and attributable:
   - **Own RSVP:** slice 01 owns explicit `going`, `not_sure`, or `not_going`
     for the accountless guest's own scoped guest participation, subject to the
     attendance policy. Signed-in participants may also RSVP only through an
     explicitly authorized participant path. Neither path may change another
     person's response.
   - **Eligible task completion:** propose complete/undo only for authenticated
     planning participants with a readable task and `todo.update`. This is a
     provisional planner-only subset pending contract and permission audit;
     it does not grant this action to guests. Do not include task creation,
     deletion, reassignment, or broad task editing in this slice.
   - **Own note creation:** propose creating a note authored by the current
     authenticated planning participant only where `note.send` is permitted.
     This is a provisional planner-only subset pending contract and visibility
     audit; it does not grant note access to guests. Existing policy restricts
     guest access to private planning notes.
   - **Basic event details:** consider title, description, and location edits
     for hosts and manager collaborators only after an event-update contract,
     field-level permission decision, and server authorization audit exist.
     This is a proposed subset, not current browser capability. Do not expose
     the broader existing event-update path without that audit.
4. Use explicit submit and success/error feedback for mutations. A failed save
   preserves entered values. A stale or conflicting update refreshes authoritative
   data and explains what changed before the user retries. Do not imply a save
   succeeded until the server confirms it.
5. Keep broad planning, administrative operations, developer tooling, API key
   management, and webhook setup out of the user-facing path. Revisit tooling
   only after the read and selected-update experience is proven useful and the
   existing MCP access is insufficient.

## Role and action matrix

This matrix describes the current permission vocabulary and the proposed web
subset. It does not grant new capabilities. The event's current assignment and
server authorization remain authoritative.

| Participant access             | Read event details                                                      | Read planning content          | RSVP own response                                          | Complete/undo task      | Create own note       | Edit title/description/location      |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------- | ----------------------- | --------------------- | ------------------------------------ |
| Host                           | Yes                                                                     | Per resource policy            | Yes, if attendance is open                                 | Yes, with `todo.update` | Yes, with `note.send` | Yes, three allowed fields            |
| Collaborator, manage           | Yes                                                                     | Yes, per resource policy       | Yes, if attendance is open                                 | Yes, with `todo.update` | Yes, with `note.send` | Yes, three allowed fields            |
| Collaborator, contribute       | Yes                                                                     | Yes, per resource policy       | Yes, if attendance is open                                 | Yes, with `todo.update` | Yes, with `note.send` | No under current event update policy |
| Collaborator, view only        | Yes                                                                     | Read only, per resource policy | Yes, if attendance policy permits                          | No                      | No                    | No                                   |
| Accountless browser guest      | Only the slice 01 scoped invitation/guest projection; no assumed roster | No private planning lists      | Slice 01 owns own RSVP through its scoped guest capability | No                      | No                    | No                                   |
| Signed-in guest                | Authorized guest projection; no assumed roster                          | No private planning lists      | Own response through audited participant path              | No                      | No                    | No                                   |
| Awaiting collaborator approval | Pending status only, unless independently granted guest access          | No                             | Only through an independent authorized attendance grant    | No                      | No                    | No                                   |

Slice 01 owns the decision and contract for accountless guest RSVP. For any
signed-in RSVP action, confirm whether each attendance status can be changed
after acceptance and whether event state closes RSVP. Check permissions at the
server boundary for each action; hiding a control is not authorization.

## Mobile and desktop experience

- Mobile Android is the primary browser target for this slice. Keep the event
  identity, own RSVP state/action from slice 01, and approved event information
  visible early without forcing a wide table or nested card stack. Guest entry
  must not require a native-app install or planning-account creation.
- Use a single-column reading flow on narrow screens. Use compact section
  navigation or tabs only when it materially shortens the page; preserve a
  visible event identity and do not make the only route to an action depend on
  hover, long press, or a desktop sidebar.
- Desktop may use a wider event summary and a secondary column for people or
  upcoming activity, while retaining the same content order and permission
  rules. Authorize every roster row, activity and child-event link; do not add
  a parent summary or sibling content for a child-only collaborator.
- The existing app uses REUI `Frame` for event summaries. Start from the verified
  REUI compositions in [00a](00a-ui-feel-and-reui-composition.md), adapt the best
  matching block, and reuse owned primitives. Verify the exact source and Base
  Nova compatibility when implementing. Free-component compositions remain the
  fallback when a Pro block is unavailable.
- Follow the page creation standard for route ownership, typed server-function
  reads, TanStack Form, accessible controls, and explicit mutation recovery.

## Architecture boundary

- **Routes/components:** Use the authenticated `/events/$eventId` planning surface with its identity-only
  layout and exact-event server authorization. Keep accountless guest invitation/RSVP on the separate
  scoped route/capability owned by slice 01. Neither route should expose guest
  access to ordinary protected planning lists. Page components call typed
  server functions, never workflows, repositories, or Drizzle directly.
- **Read model:** Reuse only projections that expose the correct data for this
  user and event. Define a browser read contract for each included section;
  do not treat native sync archives or MCP tool output as a page contract by
  accident. Scope authenticated queries to the participant and event; scope
  accountless guest reads to slice 01's explicit guest capability and projection.
- **Writes:** Define typed contracts and server handlers/workflows for each
  approved operation. Reuse domain behavior where appropriate, but do not
  expose native sync mutation envelopes or broad MCP tools as browser APIs.
  RSVP must bind the mutation either to the signed-in participant or to slice
  01's scoped accountless guest capability. Task completion must enforce
  `todo.update` and same-event ownership. Note creation must enforce
  `note.send` and server-derived author identity. Event edits require
  field-level decision and an audited `event.update` authorization path.
- **Authorization:** Authenticated planning reads/writes recheck session,
  event participant, role, planning permission, event/resource scope, and
  relevant current state. Accountless guest reads and own RSVP use only the
  scoped guest capability from slice 01 and its explicit guest projection;
  do not create an authenticated planning session or broaden access to private
  lists. Guest roster visibility is not assumed.
- **State and concurrency:** Define the current server version or equivalent
  conflict check before writes. Do not silently overwrite newer event/task
  state. Keep mutation outcomes idempotent where retries can occur.

## Acceptance criteria

- An accountless guest can use slice 01's scoped capability to submit their
  own RSVP from an Android browser without creating an account. A signed-in
  collaborator who needs approval returns to the correct event context after
  authentication/approval.
- Accountless guest access cannot enter ordinary protected workspace routes or
  read private planning lists. Any guest-visible details are limited to the
  contractually scoped projection; tests do not assume a roster is present.
- A child-only collaborator lands on the invited child as their local planning
  root. Parent/sibling summaries, people, schedules and navigation links are
  absent unless separately authorized, including serialized loader data.
- At narrow viewport widths, the event identity, date/location, attendance,
  and readable sections remain usable without horizontal scrolling; desktop
  uses the same permission-aware content hierarchy.
- The browser shows only event sections the signed-in participant may read.
  Guests never receive private planning notes or todos through a hidden client
  control, loader payload, or alternate query.
- An accountless guest can change only the RSVP bound to their scoped guest
  capability; a signed-in participant, if enabled, can change only their own
  RSVP. The server enforces the relevant attendance policy. Neither path can
  change another person's attendance by altering client input.
- A participant without `todo.update` cannot complete or undo a task, including
  through a forged request. Eligible task completion and undo target the same
  event and return authoritative state.
- Note creation, if included, derives the author from the session and rejects
  an unauthorized role. Read visibility and any later edit/delete behavior are
  explicit and covered.
- Title, description and location-name edits require current manager/host
  permission, strict field validation and a server version. Non-manager
  collaborators and guests cannot mutate them.
- Permission denial, expired session, missing event, network failure, and
  stale/conflicting state have clear recovery paths. Failed forms retain input;
  retry cannot duplicate a note or task transition.
- Focused regression coverage exercises visible outcomes, role boundaries,
  cross-event isolation, retries, and conflict recovery. Use browser interaction
  tests and real Android browser acceptance for navigation, keyboard, Back,
  scrolling and scan-entry behavior that server-rendered unit tests cannot prove.

## Remaining decisions and acceptance

- Verify physical Android camera QR entry and complete assistive-technology
  acceptance; the API 37 Chrome browser pass does not establish those outcomes.
- Consider pagination beyond the explicit 50-row limits and decide separately
  whether ideas, registry and media need browser read projections.
- Address coordinates/address lines, dates/times, lifecycle and participant
  management are outside the basic edit subset. Notes remain planner-only;
  guest notes and task assignment-specific permissions are not introduced.
- Validate deployment proxy/header behavior before rollout. No deployment or
  shared-database migration is part of this local implementation.

## Explicit deferrals

- Broad event authoring, date/time and schedule changes, budget edits, idea
  voting/editing, registry reservation management, uploads, and offline editing.
- Invitations, participant management, bulk updates, event deletion/cancellation,
  and other destructive or broad administrative actions.
- Developer consoles, user-managed API keys, and webhooks. Existing MCP
  integration remains sufficient for current structured access; revisit these
  only with evidence of a user need and a separate security/operations plan.
- Any mutation whose contract, role policy, data visibility, or conflict
  behavior is unresolved.
