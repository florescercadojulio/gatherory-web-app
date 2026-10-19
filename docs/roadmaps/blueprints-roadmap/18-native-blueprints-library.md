# Native Blueprints library

Implemented locally October 16, 2026. Release/device acceptance remains open.

## Experience

Root navigation is **Workspaces**, **Blueprints**, **Explore**. Blueprints uses
the same large title and account-button layout as the other library screens.

- **In Progress** lists account-local setup drafts. Resume now opens their
  workspace-style preview, then Customize opens the existing setup editor with
  the saved source pin, customizations, selections and confirmed dates, including
  drafts reached through an unlisted link. See [19 — Preview workspace interaction](19-native-preview-workspace-polish.md)
  for the subsequent masonry and explicit-save swipe follow-up.
- Pending installation recovery appears first. Other drafts remain visible,
  but cannot resume until recovery finishes. A corrupt draft store cannot hide
  a pending receipt; local failures offer retry.
- **Used Templates** shows each installation's template name, revision and the
  event it was used for. Tapping opens the associated installed workspace if
  that workspace is available locally. It does not grant access to the source
  event or bypass template-link revocation.
- Explore remains discovery. The Workspaces plus button creates a workspace;
  its former Resume Setup/retry-install menu has moved to Blueprints.

Repeated use of the same template produces separate history entries and
independent workspaces. This library does not make installed copies track
source edits, publish draft edits or add a native professional authoring area.

## History and offline behavior

`GET /api/blueprints/library` is authenticated and returns up to 200 recent
completed installation receipts for the current actor, newest first. Reads
also require current host access to the installed root event. A user-supplied
account ID is never accepted. Revoking a source template link does not remove
the actor's completed installation history.

The response contains only installation/scope IDs, catalog key, revision,
template name, installed event name and completion timestamp. The query selects
only that metadata from the stored source snapshot and plan; it does not load
or transmit full documents, people, media, credentials or private source data.
The generated `blueprint-library.v1.schema.json` records bounded Unicode text,
UUIDs, timestamps and collection limits. Responses use `no-store` HTTP caching.

The native `BlueprintLibraryCache` is a separate versioned, account-scoped
atomic file. Cached history appears before a network read and remains visible
when offline. A successful server refresh replaces the cached list, including
removing entries no longer accessible through the endpoint. Historical data is
never used as a catalog grant or a source for installing a revoked template.

Successful bootstrap import records a small history entry locally after the
existing draft/intent cleanup. Cache failure does not fail installation or
restore a completed intent; the server endpoint can recover history later.
Returning to the tab rereads local history, so a newly installed template can
appear even without another network response. Older installations backfill
when the new endpoint is first reached successfully.

The root passes tab activation explicitly, so retained tab views refresh when
selected again. Setup cannot be swiped closed or closed through its toolbar
while reviewing/installing; after a failed attempt it can close normally and
the library presents the durable pending recovery state.

The model rejects malformed/conflicting history and ignores cancelled, stale
or invalidated completions. Root account identity recreates the library model;
cached data and setup callbacks remain account scoped. Resumed setup closes
its local sheet before the root presents the installed workspace. It does not
alter an unrelated incoming shared-link router.

No archive, outbox, entity, receipt or database schema migration is required.
Ordinary workspace sync and installation transaction boundaries are unchanged.
Ship the server endpoint before the iOS release; against an older server the
tab can still resume local drafts and display any cached history, but cannot
backfill used templates.

## Verification

- iOS app build and 534 non-UI tests passed (644 executions with parameterized
  cases) on an isolated iPhone 18 Pro / iOS 27 simulator. Eleven library tests
  cover offline cache use, account isolation, malformed envelopes/responses,
  response ordering, cancellation/invalidation, recording and validation bounds.
- The existing installation/relaunch regression also varies history write
  failure: successful import and receipt/draft cleanup still complete, without
  introducing an outbox mutation.
- Web suite: 433 tests passed, 21 environment-gated tests skipped. Six new
  focused cases cover contract bounds, workflow actor scoping and authenticated
  HTTP behavior. Typecheck and generated contract checks passed.
- English/Spanish localization coverage passed for 1,186 keys.

UI tests, deployment, live database integration and physical-device acceptance
were not run. Historical backfill requires a deployed endpoint and a successful
authenticated read; it cannot be inferred from older local archive metadata.
