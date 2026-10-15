# Unlisted template links

**Status:** Implemented locally, October 15, 2026; deployment and device acceptance remain separate.

## Product behavior

A template workspace owner can create an unlisted link from a published template
detail page. It pins the selected immutable revision, including its description
and content hash. Publishing another revision never changes an existing link.
Recipients can forward the link; it is not proof of a booking or membership.
Links do not expire automatically in this slice. Owners can revoke individual
links and create replacements.

`/templates/shared/<token>` provides an anonymous web preview and an explicit
Open in Gatherory action. The app resolves the publication and uses the existing
selection/date confirmation/review/install experience. Installation requires an
authenticated recipient and creates their own independent plan. Opening a link
does not install anything. Shared templates do not appear in public discovery
or the recipient's ordinary private catalog.

New native Create & Share now explicitly publishes a version to Search as well;
see [16](16-public-discovery-and-automatic-ownership.md). Existing unlisted
templates are not promoted automatically. Search visibility and bearer-link
revocation are independent: revoking a URL does not hide a listed version, and
removing a Search listing does not revoke valid URLs or change installed copies.

The owner sees a newly created URL once and can copy it. Only the token's SHA-256
hash is stored on the server, so later visits list creation time, pinned version,
and revocation state without recovering the URL. After an uncertain creation
response, refresh the list and revoke unwanted links before creating another.

## Native owner controls

The Workspaces card's long-press menu offers **Share Template** and
**Manage Links**. Share Template now provides native content selection, review
and Create & Share; see [15](15-native-create-and-share.md). These actions
target the card's root event, including its accessible child for a scoped card,
not the last selected sub-event. Manage remains focused on planning tools.
These two link controls remain available for read-only/ended events to people
who retain the event's host/manager grant; this does not re-enable event editing.
Deleted events and invitation-only projections do not expose the controls.

The native link-management sheet lists templates explicitly captured from that event and owned
by the signed-in user. Source-event management and destination-template ownership
are separate server checks. Installing somebody else's template does not grant
access to manage that original template or its links. An empty list or unpublished
draft offers native creation; advanced web authoring remains optional. Native
creation captures and publishes only after selection, review and confirmation.
If multiple templates exist, link management requires choosing one explicitly.

Sharing requires an explicit create action for a published revision, followed by
the system share action. Link management lists creation dates, pinned revisions,
and revocation state, with confirmation before revocation. Raw URLs cannot be
recovered from historical entries: create a replacement when needed. Retired
templates remain manageable for revocation, but cannot create new links.

The authenticated `POST /api/blueprints/sharing` endpoint accepts a strict
`action` (`templates`, `list`, `create`, `revoke`) and explicit `eventId`, plus the
required template/revision/link identifiers. It reuses existing link persistence
and authorization under a source-scoped transaction; no new database migration
or sync entity is introduced. Portable request/response schemas live in
`contracts/schemas/blueprint-link-management-*.v1.schema.json`.

These are online-only operations, never queued in the offline outbox. Failures
must not report a successful revocation. An uncertain creation response requires
refreshing and inspecting existing links before retrying. Newly returned bearer
URLs stay only in the open sheet's memory and clear on dismissal/account changes;
late responses cannot populate another account's sheet. Detailed editing,
source refresh and advanced authoring remain available on the web. Native
selection/review and explicit capture/publication are now covered by
[15 — Native Create & Share](15-native-create-and-share.md); the native link
management permissions and transient-URL rules here still apply.

## Authorization and privacy

- Links use 256-bit cryptographically random tokens. Create/list/revoke require
  owner membership of the template's explicit workspace, independently of the
  active workspace. Bearer credentials never authorize authoring operations.
- The public resolver returns only the published catalog-entry projection.
  Capture metadata, source event IDs outside the published content, ownership,
  rosters, decisions, expenses, and live source data are not queried or returned.
  Published item keys are opaque identifiers, never access grants.
- Source-event and organization permissions do not change. The author receives
  no access to recipients' plans. Text deliberately included in a publication
  remains visible: review personal details, private addresses and access codes
  before creating a link. There is no automatic anonymization promise.
- Private catalog reads still require their original access. Supplying a link
  authorizes only its exact revision; a different template/revision fails even
  when the caller knows its catalog key/hash. Retired sources are unavailable.
- Responses use no-store, no-referrer and noindex headers. Preview/link controls
  are excluded from DOM capture; telemetry redacts token-shaped values. Hosting
  infrastructure should redact these bearer URL paths from access logs.

## Revocation and installation recovery

Schedule, preview and new installation requests revalidate link access. An
installation receipt stores the token hash, not its raw credential. Completion
holds a shared lock on the active link through the existing canonical/native
write transaction, so revocation and completion have a defined ordering. If
revocation commits first, no new plan is materialized. External organization
provisioning may already have occurred; the existing receipt retains that
recovery state without duplicating provisioning.
This slice does not add cancellation or automatic cleanup of an unfinished
installation whose link has been revoked.

A completed receipt remains recoverable by its authorized installer after link
revocation, source retirement or source deletion. Exact retries return the same result; changing
the reviewed request under the same UUID is rejected. Revocation never deletes
or modifies installed copies. Previously downloaded previews/drafts cannot be
remotely erased; server checks prevent them authorizing a new installation.

## Native and sync boundary

HTTPS links use the configured app origin and `/templates/shared/<token>`;
`gatherory://template/<token>` is the web fallback. The association document adds
the HTTPS path alongside existing event invitations. Native setup keeps shared
credentials in account-scoped setup drafts and installation intents, isolates
drafts for different links, and preserves the exact reviewed installation body
for recovery. It does not add the shared publication to Explore history/catalog.

Ordinary local edits, outbox mutation transactions, native entity payloads,
remote merges and cursors are unchanged. Installed data still arrives through
the canonical bootstrap import. Account-generation guards apply to resolution,
setup and recovery. Confirmation and user-edited dates retain their existing
semantics.

## Delivery and verification

Apply `drizzle/20261015180658_needy_donald_blake/migration.sql` through the normal
migration runner before serving this feature. It adds the link table and a
nullable receipt token-hash column. Deploy server/schema and the updated native
app together for the complete open/review/install experience. Apple association
caching can delay HTTPS handoff; the explicit app action provides the fallback.

Tests cover public projection, owner authority, pinned revisions, cross-template
misuse, revocation before/during installation, completed receipt recovery, and
independent copies. Native tests cover URL routing, account isolation, draft
credential persistence and transport/recovery. UI tests are excluded; physical
device and authenticated browser acceptance remain manual.

Local verification on October 15, 2026:

- Web suite: 383 passed, 17 skipped. Type checking and generated contract checks
  passed.
- Disposable PostgreSQL: sharing integration plus the existing authoring,
  capture and installation regressions all passed (four tests). The development
  database was not used or modified.
- Native non-UI suite: 404 of 405 tests passed initially. The sole failure was a
  new transport fixture reading only `httpBody`, not `httpBodyStream`; after
  correcting the fixture, all 27 tests in the affected blueprint suites passed.
  This was a focused corrective rerun, not a second complete suite run.
- Localization validation passed for 1,020 English/Spanish strings, and
  deployment-target checks confirmed iOS 26.0 for app and test configurations.

Native owner-control verification on October 15, 2026:

- Web suite: 397 passed, 17 skipped. Type checking, generated contract checks,
  formatting and whitespace checks passed.
- Disposable PostgreSQL: the new source-scoped link-management integration
  and existing sharing/revocation/independent-install regression both passed.
  The temporary database was removed; the development database was untouched.
- Complete native non-UI suite: 425 tests passed (505 runs including parameters),
  including account switching, late responses, uncertain creation, revocation,
  card permissions and authenticated transport coverage.
- Localization validation passed for 1,057 English/Spanish strings. UI tests
  were intentionally skipped; physical-device presentation remains manual.

QR generation, automatic expiry, public search, link usage analytics, and a
general creation engine are outside this slice. Distribution grants no billing,
booking, playlist, or reminder capability.
