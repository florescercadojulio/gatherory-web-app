# Selective event-to-template capture

Implemented locally October 15, 2026. This precedes QR distribution; playlists
remain a subsequent typed capability.

## Product flow

Any managed event may be a source, whether created blank or installed from a
template. Native blank creation remains local/offline-first. The iOS Workspaces
card's **Share Template** action now provides native selection, review and
**Create & Share** for that card's root event (or its accessible child for scoped
cards), independently of the last selected sub-event. It requires event-management
permission and is also exposed as an accessibility action. See
[native Create & Share](15-native-create-and-share.md). Web Templates retains
**Capture event as template** and advanced draft editing/refresh.

At `/blueprints/capture`, choose an owned destination workspace and explicitly
select sub-events, supported ideas and guidance. New captures begin with nothing
selected. Idea notes require a separate opt-in. Child-scoped content requires
selecting its child. Preview the resulting content, save a private draft, then
use the existing editor/preview/publish flow. Publication remains private to
authorized template users, not public or unlisted distribution.

The draft may contain names or private details in selected titles/notes/guidance;
review and edit those before publishing. There is no heuristic claim that
arbitrary user-authored prose has been anonymized.

## Updates and independent instances

The authoring record's existing JSON `source` now distinguishes an original
catalog revision from an event capture. Captures retain their selected source
IDs and the last captured content as a private merge baseline. This adds no SQL
column or migration and exposes no source-event grant to template consumers.

**Refresh from event** previews a three-way comparison with the current draft.
Unedited captured content follows the new source; manual template edits,
additions and deletions are preserved. Conflicts are reported for review.
Saving uses a draft-version check and stable request UUID; retries recover a
committed save rather than apply it twice. Source changes invalidate an old
preview. Publishing is still a separate action creating an immutable revision.
An event edit never automatically publishes a template revision or updates an
already installed copy.

## Data and permission boundaries

The server requires explicit host/manage participation for the selected source
and each included child, honors personal departure, and separately requires
owner membership of the destination authoring workspace. A child-only manager
can capture that child as a standalone source but cannot read its parent/siblings.
Contributors and guests cannot use capture as an event export permission.

Canonical reads whitelist titles, categories, selected notes and guidance.
Participants, invitations, RSVP/vote state, approvals, costs/expenses, registry
commitments, notes history, media, original dates, and arbitrary configuration
are never copied into reusable content. Existing dates become optional Temporal
calendar-day/time proposals in the source root zone, not confirmed recipient
dates. Installation retains explicit confirmation and new identities/state.

Capture reads and authoring writes use their own Effect PostgreSQL transaction.
They do not mutate source events, native snapshots, cursors, outboxes, or ordinary
sync boundaries. Unsynced iOS edits must arrive through normal sync before
capture can observe them. No implicit flush, event recreation or source rewrite
is part of the native handoff.

## Future configuration

Sharing remains an explicit opt-in, not a side effect of normal event edits.
Blank-created events do not need a blueprint-backed creation engine to be
captured. A broad engine is deferred; extract small shared rules only when
actual duplication warrants it, without unifying native creation and server
installation transactions. See the
[creation-rules decision](README.md#creation-rules-and-optional-sharing).

Keep three independent controls: author selection of what is offered, recipient
selection of what to copy, and audience/operation permissions. Required-module
flags mean compatibility, not mandatory adoption of an author's preferences.
Current native setup already lets recipients omit offered ideas/sub-events.
Author-controlled default inclusion is a later versioned contract addition.

Playlists need a typed reusable track-reference module before capture/install
support. Copy track references into fresh event state; do not copy votes,
participant histories or credentials. QR codes later identify an authorized
published template and never substitute for explicit preview/install.

## Verification

October 15 verification:

- Full web suite: **373 tests passed**, 16 opt-in/environment-dependent cases
  skipped. TypeScript typecheck and generated contract freshness passed.
- All **3** dedicated PostgreSQL blueprint integration tests (capture, authoring,
  installation) passed separately against freshly migrated disposable PostgreSQL
  18. Capture verifies scoped authorization, departed users, destination ownership,
  exact retry recovery, stale-source checks, concurrent draft CAS, immutable
  publications and unchanged canonical/native sync records. The temporary
  container and its anonymous test volume were removed afterward.
- Native **395 tests / 473 executions passed**, with zero failures/skips on
  iPhone 18 Pro / iOS 27 Simulator. Result bundle:
  `/tmp/gatherory-capture-20261015-a.xcresult`. The final icon-only header build
  also passed. English/Spanish localization coverage passed for 1,019 strings.

Pure tests cover Temporal/DST proposals, whitelist selection, object-key-order
independence, manual edits/deletions and dependent-item conflicts. Injected
Effect tests cover validation and source pinning. Native URL tests verify the
exact event ID without credentials/query propagation; ordinary offline/sync
regressions remain green.

No UI tests or web production build ran. Physical-device and authenticated web
visual acceptance remain open. Rich idea configuration and playlist copying
remain unsupported; the capture page explains that ideas copy titles and
optionally notes only.
