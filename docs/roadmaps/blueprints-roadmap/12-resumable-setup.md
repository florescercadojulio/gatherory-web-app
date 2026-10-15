# Resumable native template setup

Implemented locally October 15, 2026. Device verification remains open.

## Behavior

Opening a template starts or resumes one setup per account and catalog key.
The native draft stores its exact revision/hash and source definition, stable
request UUID, event name, main date/time zone, selected sub-events/ideas and
explicitly confirmed child instants. Empty selections remain empty. Relaunch
and A → B → A account switching preserve separate drafts.

The Workspaces **+** menu offers **Resume Setup** even without a catalog connection,
alongside creating a workspace. Pending installation recovery takes priority in
that menu. Search remains focused on discovery without a resume banner. Recovery
reads the draft and installation stores independently so one unreadable draft
cannot hide a pending installation. Local editing can continue offline,
including manual date confirmation. Suggestions are
transient and must be fetched again; restoring a draft never confirms one.
Preview/install still use the existing server authorization and source checks.
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

## Verification

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
