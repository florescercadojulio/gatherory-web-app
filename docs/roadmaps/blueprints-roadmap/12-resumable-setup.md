# Resumable native template setup

Implemented locally October 15, 2026. Device verification remains open.

## Behavior

Opening a template starts or resumes one setup per account and catalog key.
The native draft stores its exact revision/hash and source definition, stable
request UUID, event name, main date/time zone, selected sub-events/ideas and
explicitly confirmed child instants. Empty selections remain empty. Relaunch
and A → B → A account switching preserve separate drafts.

The Blueprints **In Progress** section offers draft resume even without a
catalog connection. Pending installation recovery takes priority there. This
replaces the original Workspaces **+ → Resume Setup** menu as of the
[October 16 library slice](18-native-blueprints-library.md); Workspaces + now
creates a workspace directly. Search remains focused on discovery without a resume banner. Recovery
reads the draft and installation stores independently so one unreadable draft
cannot hide a pending installation. Local editing can continue offline,
including manual date confirmation. Suggestions are
transient and must be fetched again; restoring a draft never confirms one.
Saved drafts are independent copies, including those saved before installation.
Source updates, withdrawal and entry-link revocation do not change their content
or prevent resuming them. Server suggestions/preview/install still require
connectivity, but use a private publication of the saved snapshot owned by its
recipient rather than continued access to the original. Fresh links without a
saved snapshot still require source access.
A newer publication is not silently merged into an unfinished setup. The
confirmed **Start over** action discards that draft and loads the latest source.

## Persistence and installation boundary

`BlueprintSetupDraftStore` writes versioned atomic files in Application Support,
separate from workspace archives, outboxes and installation intents. Paths are
scoped by encoded canonical account ID and catalog key. Invalid versions,
identity mismatches, invalid dates/zones and corrupted files are rejected without
silently replacing them. Save failure is visible and blocks plan review.

Once installation begins, its exact persisted request takes priority. The
coordinator removes the matching setup draft only after canonical bootstrap
import, before clearing the installation intent. Cleanup failure retains the
intent for receipt-based retry; a newer request's draft is never removed by an
older completion. Existing offline sync and SQL/SwiftData transactions are
unchanged. This feature does not add cross-device setup synchronization.

### Independent saved copies — October 19

Optional draft fields retain a separate stable copy request UUID and private
catalog entry. Legacy drafts acquire these lazily, without discarding their
stored source, selections, customizations, notes or confirmed dates. The local
account/catalog/link file identity does not change when its server pin changes.
An interrupted copy response retries the same actor/request/content operation;
an account switch, replaced draft or newly pending install prevents a late
response from overwriting local state. Edits made during the request are merged
by retaining the latest same-request draft.

`POST /api/blueprints/copies` accepts only validated portable authored content,
not original permissions or an expanded install plan. It creates an unlisted
personal template and immutable first revision atomically, with no sharing link.
Internal setup copies are excluded from author-library cards, so saving dates
does not duplicate the blueprint. Copy preparation happens outside ordinary
workspace outboxes and before a new install request is frozen. Existing intents
are never rewritten. Canonical bootstrap still owns import, followed by exact
draft cleanup and intent completion; history retains the independent source pin.
Legacy intents already frozen against an entry link retain their existing
authorization and recovery behavior rather than being silently converted.

## Verification

October 19 independent-copy verification: **620 native non-UI tests** passed
(733 executions), **465 web tests** passed, and the focused local database test
passed with fixtures cleaned up and no reset. Typecheck, whitespace and
English/Spanish localization checks passed. Coverage includes original-source
withdrawal, private snapshot preview/scheduling, copy retry/conflict handling,
account/replaced-draft guards, concurrent edits, canonical import cleanup and
unchanged frozen requests. UI tests and simulator captures were not run.
The updated `/api/blueprints/copies` server endpoint must ship with the native
client; no new database schema migration is required for this slice.

Swift Testing coverage exercises disk reconstruction, Unicode names, empty
selections, confirmed-date refresh preservation, account/template isolation,
conditional cleanup, invalid storage and separation from installation intents.
The existing lost-response installation test also checks that the draft survives
the failed response, then clears only after successful bootstrap with no outbox
edits. The account-generation test also verifies that an A → B → A switch cannot
clear the original draft or import a stale callback's result.

October 15 verification: **393 tests / 471 executions passed**, zero failures
or skips on iPhone 18 Pro / iOS 27 Simulator. Result bundle:
`/tmp/gatherory-resumable-setup-20261015-b.xcresult`. English/Spanish localization
coverage passed for 1,017 strings, and both repositories passed whitespace checks.

No UI tests are included. Physical-device visual checks and the previously
reported selection-freeze investigation remain separate acceptance work.
