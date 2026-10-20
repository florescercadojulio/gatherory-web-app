# Automatic ownership and searchable shared templates

Implemented locally October 15, 2026. Consumer template creation no longer asks
where to save a template. Create & Share publishes a reviewed version that
another signed-in user can find in Search and install independently.

## Consumer experience

Long-press the event card, choose Share Template, adjust the selected content,
review it and choose Create & Share. The review clearly states that this version
will appear in Search. All supported content and idea notes remain selected by
default; deselection and review still precede publication. Selected prose may
contain personal details, so the author sees the actual content being published.

There is no Save To picker or authoring-workspace setup button. The server uses
the actor's owned personal organization for template ownership, independently
of the source event's organization and the active session workspace. If that
personal owner does not exist, Create & Share provisions it through the existing
Better Auth connector. Source and review reads never provision anything.
Owning unrelated business organizations does not choose one accidentally.
Creation does not switch the active organization or add anyone to the source.

The organization remains an internal ownership boundary; the template is a
separate server record, not content placed inside the original live event.
Advanced web authoring can still explicitly select an owned destination.

## Discovery and withdrawal

`blueprint_template.listed_revision` is nullable and identifies exactly one
immutable publication offered through the catalog. All existing templates
default to NULL, so private drafts, unlisted links and old publications do not
silently become public. Current native sharing requests use `discoverable: false`;
Search publication is a separate explicit action. The earlier opt-in
`discoverable: true` command remains compatible; omitted flags default false.

The existing catalog projection supplies the template name, browse category and
summary to native Search. A viewer needs no membership or planning grant in the
author's organization or source event. Catalog/revision/preview/schedule/install
access checks recognize only the listed revision, while exact owner and bearer-link
access retain their separate existing rules. Catalog browsing never uses the
owner-access exception: owners see the same public entries and revision as other
viewers. Drafts, capture metadata, private
source records, participants and costs are never added to catalog responses.

Manage Links includes Search visibility controls, using a source-scoped,
owner-authorized `listing` command. Owners can remove a template from Search
without deleting independent copies. Listing another revision is explicit;
editing/publishing a draft never silently replaces an existing public version.
The personal Blueprints library also offers Publish to Search / Remove from
Search in its long-press menu. Removal uses personal ownership and optimistic
draft/listing checks, without requiring continued access to the captured event.
It preserves links, the creator label and publication history. Personal blueprint
saves may update an already-listed entry under its stable catalog key; saving
an unlisted blueprint does not list it.

Public visibility and bearer links are independent. Revoking a link does not
remove a listed template from Search. Removing a Search listing does not revoke
existing links. A supplied revoked token still fails rather than falling back to
public access. To stop both entry paths, withdraw the listing and revoke links.

## Transactions and recovery

Personal-owner provisioning occurs outside the SQL capture/publication
transaction. It uses the deterministic existing personal slug and rechecks owned
context after concurrent creation or a lost external response. A failed
publication may leave the personal organization available for the next attempt;
the source event and installed copies remain untouched.

Capture, immutable publication, request binding and initial listing commit in
one transaction. A private `nativeCreationRequestHash` binds visibility as well
as content and ownership. Reusing the same request UUID with changed visibility
fails; exact replay returns its original publication and does not re-list a
version that its owner subsequently withdrew. Old committed unlisted requests
cannot gain public visibility through replay.

Installation checks and locks template authority through canonical/native
completion. Withdrawal prevents new or unfinished public installations when it
commits first. A completion that commits first remains an independent plan;
authorized completed-receipt recovery remains available after withdrawal.
Ordinary offline edits, outbox transactions, sync cursors, setup drafts and
canonical imports keep their existing behavior.

## Delivery and verification

Apply `drizzle/20261015194344_cheerful_sharon_carter/migration.sql` through the
normal migration runner before deploying the updated server. It adds only the
nullable listing pointer and a positive-value constraint. Update server and iOS
together for automatic ownership and accurate native publication visibility.
No existing template is backfilled into Search.

Tests cover automatic ownership, source-first authorization, anonymous denial,
public catalog visibility, exact revision access, withdrawal, private/unlisted
isolation, immutable replay, independent installations, and native visibility
controls. UI tests are intentionally excluded; physical-device presentation and
system sharing remain manual acceptance checks.

Local verification (October 15, 2026):

- Web suite: 415 passed; 20 opt-in tests skipped. Type checking and generated
  contract consistency checks passed.
- iOS non-UI suite: 444 passed, including missing listing acknowledgement,
  account-switch isolation, publication disclosure and strict request bodies.
- All seven opted-in blueprint database suites passed against disposable
  PostgreSQL 18 with the full migration chain, including cross-account Search
  discovery and two independent installations. The disposable container was
  removed afterward. An older sharing assertion now excludes its private
  fixture keys rather than incorrectly requiring an empty curated catalog.
- English/Spanish localization validation passed (1,105 matching keys).

The migration has not been applied to the shared development database, and no
deployment or physical-device installation was performed as part of this change.
