# Native Create & Share

Implemented locally October 15, 2026. Consumer event-to-template sharing can
start and finish on iPhone. Advanced editing and business configuration remain
available on the web.

## Experience

Long-press a Workspaces card and choose **Share Template**. Name the template,
choose supported sub-events, ideas and guidance, then review the exact reusable
content before choosing **Create & Share**. All authorized supported content,
including idea notes, starts selected. Authors can exclude items or notes before
reviewing. Deselecting a child also removes
its selected ideas and guidance. The source is the card's root event, including
an isolated child-only planning card, not the last selected event inside it.

Review displays selected text, target events, guidance audiences and any
relative date proposals. Selected prose can still contain personal information;
the author must review it. Participants, invitations, RSVPs, decisions, expenses,
conversations, media and playlists are outside capture. Nothing automatically
publishes when the event changes.

Creating now handles ownership automatically and publishes the reviewed version
to Search before creating a sharing link and offering native system sharing.
The review makes this public visibility explicit. Search viewers and link
recipients install independent copies without source-event access. Existing
private/unlisted templates stay private. **Manage Links** retains link revocation
and now includes Search withdrawal, including after an event ends. See
[16 — Automatic ownership and discovery](16-public-discovery-and-automatic-ownership.md).

## API and permission boundary

Authenticated `POST /api/blueprints/create-template` has four strict actions:

- `source`: authorized capture snapshot, source hash and owned authoring
  destinations. No writes or implicit workspace provisioning.
- `review`: explicit selection, name and expected source hash; returns projected
  content and a hash identifying that review. No writes.
- `create`: the reviewed selection/name/hash, explicit `discoverable` flag and
  stable request UUID. New native clients omit destination selection; the server
  resolves or provisions the actor's personal owner only on this action.
  Capture/save, publication and initial listing share one PostgreSQL transaction. The
  response contains only the template ID and immutable publication revision.
- `workspace`: retained for legacy clients; explicitly creates an owner workspace only when none exists,
  reusing the existing recoverable Better Auth operation. It first checks source
  access and does not switch the active organization or modify event membership.

Every creation/replay checks current host/manage access to the source; capture
also checks each selected child's grant and destination ownership. Guests and
contributing-only collaborators cannot export through this flow. Native UUIDs
normalize to lowercase. Portable schemas retain explicit Unicode character
limits; no fixed-width SQL character columns or money format changes are added.

An exact creation retry recovers its original template and first publication.
Changed selections, name, destination, visibility or review hash cannot reuse that request.
The transaction rolls back a new draft when publication or review validation
fails. Later draft edits are never silently published by replaying creation.
Link creation uses the existing source-scoped management endpoint separately.
Public discovery adds the nullable listing-pointer migration documented in `16`;
the initial native capture slice itself required no additional migration.

## Offline and recovery

Ordinary event edits, outbox transactions, installation intents, sync cursors,
canonical imports and remote merges are unchanged. Capture reads the server's
authorized snapshot; local-only edits become available after normal sync.
Opening this sheet does not flush, rewrite or recreate the source event.

Selection/review/link management are online operations. The reviewed creation
request remains frozen in sheet memory after an uncertain network response;
an explicit retry uses its exact UUID/body. A definitive stale-source conflict
requires reloading and reviewing the source again. Publication and link creation
are separate: if the link response is uncertain, the template remains available
and a successful explicit link refresh is required before making a replacement.
There is no automatic mutation replay or duplicate-link retry loop.

Generated links and capture state remain transient and clear on dismissal,
account switching or permission loss. Late responses cannot continue publication
or create a link for the next account. This slice does not add capture drafts
across relaunch; existing account-scoped installation/setup drafts are untouched.

## Verification

Automated checks cover authorization, explicit content and notes selection,
review hashes, transaction rollback, concurrent/exact replay, source changes,
immutable publications, native HTTP serialization, account isolation, uncertain
link recovery and revocation. Existing sharing/installation regressions exercise
independent copies. UI tests are intentionally excluded; device presentation and
the system sharing sheet remain manual acceptance checks.

Local verification on October 15, 2026:

- Web suite: 405 passed, 19 skipped; TypeScript and portable contract freshness
  checks passed.
- Four PostgreSQL integration tests passed: native creation, capture, sharing
  and link management. They ran on freshly migrated disposable PostgreSQL;
  the container was removed and the development database was untouched.
- Native app build passed. The complete non-UI suite passed all 438 tests
  (518 executions including parameters), with no failures/skips, on iPhone 18
  Pro / iOS 27 Simulator. Result bundle:
  `/tmp/gatherory-native-create-share-20261015.xcresult`.
- English/Spanish localization validation passed for 1,097 strings.

Follow-up: all authorized supported content and idea notes now start selected.
Resume Setup and pending-install recovery moved from Search into the Workspaces
**+** menu. The updated app build and complete non-UI suite passed (441 tests,
521 executions including parameters); UI tests remained excluded.
