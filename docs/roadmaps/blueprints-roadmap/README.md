# Experience Blueprints — First Iteration

**Status:** In progress — first Wedding installation slice implemented; full iteration remains open.
**Priority:** P1, explicitly requested on 2026-10-13.
**Owner area:** `src/server/blueprints/`, protected `/blueprints` pages, and native new-event setup.
**Last reviewed:** 2026-10-20, against web/server `69e28f0`, iOS `dd28ba8`,
and the uncommitted native QR slice described in `22`.
October 14 implementation evidence in `00`/`00a` remains dated to that review;
the subsequent October 15 implementation adds the Wedding proving slice described below.

## Outcome

A host can start from Wedding, Birthday Party, or Thanksgiving, make a private
template with suggested activities, starter ideas, and instructions, preview
it, and publish a version for reuse. Creating an event from a version produces
independent planning records that the host can change normally.

Use **Blueprints**, **New blueprint**, and **Use blueprint** in the product.
As of October 19, Blueprint is the product term as well as the shared contract
and implementation term. Existing route, storage and localization identifiers
remain compatible. Blueprint suggestions are offered for review; they are not
attendance responses or final planning decisions.

The same configuration model must later support a host's Airbnb-style stay or
experience: arrival instructions, recommended activities, local ideas, and
departure guidance. That future example does not imply an Airbnb integration,
booking system, or marketplace in this iteration.

The user has explicitly reaffirmed rental/cottage experiences and reusable
wedding-package recommendations as a future goal, with QR-based copying,
arrival/departure checklists and opt-in reminders. Detailed configuration is
web-first; keep iOS lightweight. See
[10 — Host-authored experiences](10-host-authored-experiences.md). These are
design constraints and future slices, not newly implemented capabilities.

## Current position and stopping point

**Native QR distribution — October 19:** Owner sharing controls can display and
share a PNG for the current authorized template URL. Codes use the existing
preview and explicit independent-copy flow, with no server or sync change.
New owner links are retained in device-only, account-scoped Keychain storage
and reused after fresh ownership/active-link checks. Older unsaved URLs remain
unrecoverable; replacement creation and revocation stay explicit.
Share Blueprint opens existing owned blueprints and restores their saved QR
after authorization. First-time sharing offers an explicit Create Share Link
action after read-only preparation; workspace/blueprint editing is the content
verification step, with no repeated review in sharing or saving. Manage Sharing
keeps the QR and link visible, with replacement, revocation and Search visibility
in its toolbar menu. New sharing is unlisted by default; Search publication
is a separate confirmed action and is never required for a link or QR.
The native creation screen leads with the plan name and a short explanation;
link creation has a full-width bottom action. Private Save Blueprint from Home
and Workspaces uses the same compact screen and an explicit Save Blueprint action.
The rest of the native flow uses Use Blueprint → confirm dates → Create
Workspace, with no extra pre-setup confirmation. Library cards omit internal
versions, collections say Blueprints / Drafts, and setup/recovery copy uses plain
language while keeping date consent and exact-retry boundaries.
Owner badges now distinguish Link active, In Search and Private using fresh
metadata. First native Search publication asks for a chosen public creator name;
public discovery and shared previews show it without exposing account data.
Titles remain flexible, republishing retains one catalog entry, and saved copies
start private without inheriting attribution. No social features are added.
The additive creator-name migration and server release are still undeployed.
**October 20 follow-up:** Search no longer includes private owned revisions.
Creating a first link remains unlisted; catalog access now uses the same public
listing rule for owners and other viewers. Personal blueprint menus provide both
Publish to Search and Remove from Search, independently of link revocation.
Device scanning, system sharing and deployed universal links still need manual
acceptance. See [22 — QR distribution](22-qr-distribution-handoff.md).

**Independent saved setup — October 19:** Saved native drafts are portable
copies even before installation. They can be resumed after the original is
changed, withdrawn or deleted. The next server setup operation privately
publishes the saved snapshot under the recipient's ownership, using a separate
durable copy UUID; frozen installation requests and workspace sync are unchanged.
See [12 — Resumable setup](12-resumable-setup.md#independent-saved-copies--october-19).

**Expanded Explore — October 16:** Eighteen populated discovery categories and
seventeen deployable curated starters; the original three revisions remain
unchanged. Preview Ideas no longer shows Install. The workspace is the editor
and review; confirmed Install asks only for missing dates before installation.
See [21 — Expanded Explore catalog and rollout](21-expanded-explore-catalog.md).

**Focused preview editing — October 16:** Blueprints replaces its repeated title
with Installed Templates / In Progress. Ideas swaps scope/exit placement; Decide
shows the actual event context and inbox without exit/Customize controls.
Personal editing now opens focused native sheets. Install uses a confirmation
and date-only completion, without repeating setup or review forms. See
[20 — Focused native preview editing](20-focused-native-preview-editing.md).

**Preview workspace interaction — October 16:** Blueprints uses masonry tiles
and the ordinary workspace opening, without an outer zoom. Preview Home shares
the event rail and exit icon; event artwork descriptors remain consistent on
opening details. Decide shares live swipes, but stages personal inclusion choices
in memory until Save Draft. Save preserves setup dates/customizations and never
casts live votes or changes sync transactions. See
[19 — Native preview workspace interaction](19-native-preview-workspace-polish.md).

**Blueprints library — October 16:** A root Blueprints tab now lists resumable
setup drafts and recent used-template history, alongside Workspaces and
Explore. History is read from the actor's completed receipts and cached per
account; drafts retain the existing recovery/installation flow. Workspaces +
returns to direct workspace creation. See
[18 — Native Blueprints library](18-native-blueprints-library.md).

**Native customization follow-up — October 16:** Customize now supports adding
and editing supported ideas and sub-events using shared workspace editor
presentations. Account-local overlays retain the source pin, confirmed dates
and exact retry body. The server validates the merged plan before the existing
installation transaction. This does not edit or publish the original template.
See [17 — Native install customization](17-native-install-customization.md).
The Blueprints library follow-up is recorded above.

**Latest native slice — October 16:** Search/category tiles and shared links now
open a read-only workspace-style session with Home, Ideas and Decide. Shared
tab chrome, event heroes, masonry tiles, decision cards and detail renderers
are used by live workspaces too. Live collaboration controls are absent;
Decide initially only browsed ideas; the explicit-save swipe follow-up above
supersedes that limitation without casting live votes.
**Customize** opens the existing date-aware setup/review flow. No source event,
outbox or installed copy is mutated by preview navigation. Draft writes require
the explicit Save Draft action outside Customize. See the latest
section of [07 — Native blueprint discovery](07-native-explore.md).
Earlier preview layout notes below are historical and superseded by this slice.
The **Blueprints** library and customization follow-ups above add saved activity
and supported draft editing. This is presentation
reuse, not the previously deferred broad native creation engine.

The first system Wedding starter now has typed executable modules, immutable
revision storage, preview, recoverable installation, atomic canonical/native
writes, and a native import path. See [06 — Wedding installation proof](06-wedding-installation-proof.md)
for exact scope, verification, and deployment prerequisites. Private web
authoring/publication is now implemented locally; see [11 — Cottage proof](11-private-cottage-proof.md).
Live guide editing and paid billing remain unimplemented.

Native discovery now adds an Explore tab beside Workspaces, category browsing,
account-local recently viewed blueprints and live search. See
[07 — Native blueprint discovery](07-native-explore.md). Birthday Party and
Thanksgiving now join Wedding through the same flow; see
[09 — Curated starters](09-curated-starters.md). Device/release acceptance remains open.

Native Search now opens a read-only, invitation-style template preview before
setup: an artwork cover, activity cards, scoped ideas with full notes, and
audience-labeled guidance. Use Template then opens the existing setup/review
flow. Browsing does not create a workspace, persist a setup draft, confirm dates
or enqueue sync work. Incoming shared links now resolve their token-pinned
publication into the same preview before setup; they never fall back to public
catalog access. Network loss may reuse an existing account/link-scoped saved
setup for viewing, but server rejection cannot. Pending receipt recovery remains
reachable even after link revocation. Workspaces saved-setup recovery retains
its direct setup entry. Template media copying and a live guest invitation are
not implied.
October 15 local verification: 448 iOS non-UI tests passed, including four
read-only preview projection regressions; English/Spanish localization checks
passed. Physical-device visual acceptance remains manual.
The shared-link preview follow-up passed 458 non-UI tests, including 10 new
resolution, offline fallback, account isolation and dismissal regressions;
English/Spanish localization coverage passed for 1,109 keys. UI tests were
intentionally excluded. Server authorization, ordinary sync transactions and
independent installed-copy behavior remain unchanged.
The preview styling follow-up now uses a viewport-filling invitation cover,
native scroll-edge blur and cards below the fold. The setup action is a
compact native toolbar control rather than a full-width fixed bottom button.
The Build 2 feedback follow-up adds invitation-style horizontal activity cards,
adaptive toolbar/status contrast and floating-tab-bar clearance, checked through
isolated simulator captures in light/dark appearance and larger text. The
integrated native suite passed 466 non-UI tests; see the
[feedback verification record](../../release/build-2-feedback-followup.md).
The October 15 visual revision removed the extra dark cover gradient and painted
status-band fade: artwork scrolls beneath the system blur, the title uses an
adaptive surface, and the cover/content boundary is flush. Shared albums now
lead with photos and open a three-column gallery before the paged photo viewer;
permissions and ordinary offline mutation transactions are unchanged.

October 16 preview layout: artwork fills the background, while the event header
now reuses the idea detail's `IdeaSummaryContent` card: category label,
left-aligned title and description on the shared material surface. Relative
timing and saved-preview context appear inside that card. It respects the
navigation safe area and keeps priorities/content immediately below, replacing
the former floating centered title and full-screen opening layouts.
The preview background now starts fully Glurred across its entire area, without
scrolling. Reduce Motion keeps this static effect; Reduce Transparency uses the
unblurred artwork/opaque card fallback.
Summary and audience-scoped guidance (including planning priorities) appear
before horizontally swipeable event pages (2×2) and idea columns (three compact
rows each). Accessibility-sized event pages use two single-column entries.
The horizontal scroll viewports now extend to the screen edges, with content
margins only for resting alignment. The solid light/dark section backing is
removed, leaving Glur artwork behind the entire preview. Cards reuse the native
idea-detail material and its accessibility fallback, rather than opaque fills.
Main and sub-event previews now use one native event presentation. Its scoped
read-only projection gives only the main event a child carousel; sub-events
retain their own guidance, ideas and suggested relative timing. Opening a
template idea uses the same `IdeaDetailScreen` and `IdeaCategoryDetailContent` as
workspace ideas, including the full-height opening layout and scroll-driven
artwork treatment. Only live actions are gated; there is no preview-specific
layout or blur variant. The surrounding main/sub-event preview retains full
static Glur. Portable v1 currently provides title/category/notes, not typed venue,
dress-code or other category facts; missing facts, currency and source media are
not invented. Browsing never creates a workspace or exposes live votes/editing.
Presentation grouping preserves authored order and partial last pages; it does
not change catalog grants, setup dates/selections, drafts, installed copies or
offline transactions. The compact Use Template action is unchanged.
Local verification passed 469 non-UI native tests (551 executions including parameterized cases),
including three new page-grouping regressions, plus the app build and 1,122-key
English/Spanish localization check. Fixture captures covered the clear cover,
scrolled Glur, priority ordering, compact pages, dark/light and larger text.
Device swipe acceptance remains manual; simulator input automation did not
reliably forward horizontal gestures. UI test targets were not run.
The subsequent content-first/shared-presentation revision passed the app build,
471 non-UI tests (553 executions including parameterized cases), and the same
1,122-key localization check. Two new regressions cover root-only carousels and
child-scoped guidance/ideas without selecting dates or mutating the catalog.
Isolated simulator checks covered initial content visibility, a leaf event's
matching presentation, a workspace-style idea detail, and long titles at larger
text sizes. No live account, setup, permissions or sync transaction was changed.
The full-Glur/shared-screen correction passed the app build and 474 non-UI
tests (556 executions). Three new display-content regressions retain full
authored notes, empty notes and future-category fallback without live identity
or workspace state. Localization now covers 1,123 English/Spanish keys, including
the shared About This Idea card. Light and larger-text dark simulator captures
checked the initial full-area Glur and the control-free shared idea screen.
The subsequent layout-parity correction removes the idea screen's preview-only
opening-height and full-Glur flags. Workspace and preview callers now also use
the same category-card renderer, with live controls enabled only by an explicit
live-idea binding. The app build and 477 non-UI tests passed (583 executions),
including all-category native configuration preservation and read-only preview
coverage. English/Spanish localization remains complete for 1,123 keys. UI test
targets were excluded; sync/storage and installation transactions are unchanged.

Date-aware setup now offers server-calculated Temporal suggestions with explicit
native confirmation and preserved user-edited dates. See
[08 — Date-aware native setup](08-date-aware-setup.md). This is read-only planning
until the existing review/install flow; installed events are not rescheduled.

Decisions made: private authoring plus three curated starters; immutable
publication; server-owned installation with review and idempotency; instructions
included from the outset; native event creation is the first consumer.

October 15 planning additions introduced the [monetization model](../../architecture/monetization-model.md),
its [roadmap](../monetization-roadmap/README.md), and the product-experience and
sequencing assessment. That docs-only work preceded the separately requested
Wedding implementation; billing is still only a documented plan.

Native setup drafts now preserve selections and confirmed dates across relaunch
and account switching; see [12 — Resumable setup](12-resumable-setup.md).
Selective event-to-template capture now precedes distribution; see
[13 — Capture and refresh from an event](13-event-to-template-capture.md).
Unlisted links now pin a publication and support owner revocation, anonymous
preview and native installation; see [14 — Unlisted template links](14-unlisted-template-links.md).
Native Workspaces card menus provide an end-to-end **Share Template** flow:
select supported content, review it, then **Create & Share** without leaving
iPhone. **Manage Links** retains source-scoped list/revoke controls. Advanced
authoring and business configuration remain on the web; these online operations
do not change the sync outbox. See [15 — Native Create & Share](15-native-create-and-share.md).
Native creation now handles ownership automatically and explicitly publishes to
Search. Existing private/unlisted templates stay private; owners can withdraw
the listed version without changing installed copies. See
[16 — Search discovery and automatic ownership](16-public-discovery-and-automatic-ownership.md).

**Next slice:** finish manual/device acceptance and deployment of private
authoring, and add live guide editing. The user explicitly moved private authoring ahead of the earlier
billing-first recommendation in `05`; billing remains unimplemented. Native
QR display and system image sharing are implemented locally in
[22](22-qr-distribution-handoff.md), reusing the URL flow in `14`; physical-device
scanning and deployed universal-link acceptance remain open. Web QR authoring
and print-layout tooling remain deferred. Native public discovery is implemented
in `16`. Templates do not require payment. Do not describe the full feature as shipped until its remaining slices are complete.

## Evaluation summary

The engine should validate and expand immutable configuration into ordinary
independent event records, not become a second state-management system. The
existing architecture is suitable, but four prerequisites are still substantial:

- Transaction-aware canonical **and** native projection writes; the legacy sync
  engine does not share an Effect transaction just because it has an Effect port.
- Recoverable Better Auth provisioning with a durable installation receipt.
- Mixed-version native support for new configuration/instructions, including
  preventing old-client content loss and silent cursor advancement.
- Fixed blueprint workspace permissions and separate planner/guest guide delivery.

See [00a — Engine readiness and delivery plan](00a-implementation-readiness.md)
for source evidence, relative effort, open decisions, and the recommended gates.
No broader custom-RBAC product or whole-server sync migration is a prerequisite.

## Creation rules and optional sharing

**Decision recorded:** October 15, 2026. **Broad creation engine: Deferred.**
This is a docs-only decision; no native creation or sync behavior changes.

Blueprint/workspace copies are independent. A blueprint-to-workspace copy uses
the latest saved personal blueprint edits when its install request is created;
workspace-to-blueprint copying requires an explicit snapshot/capture. Neither
direction has a live binding or automatic propagation. Saving a blueprint does
not change existing workspaces, and pending installs retain their frozen
request. These boundaries are also recorded in the
[experience architecture](../../architecture/experience-blueprints.md#copy-boundaries).

Keep ordinary native workspace, event, and idea creation independent of
blueprints. Template installation supplies starting content and creates an
independent live plan; it does not become the runtime for subsequent edits.
Selective capture already lets a blank-created event become a reusable template.

Extract shared creation rules only when a concrete feature or bug exposes
actual duplication across existing paths. Start with the smallest rule that
must behave identically, not a generic registry or a blueprint wrapper around
every new item. Checklists are a possible future example, not a scheduled engine
refactor. Before extracting:

- Identify the duplicated rule and its current callers; explain the consistency
  problem the extraction solves.
- Add behavior tests for both paths, including category-specific defaults and
  existing transitions where relevant. Prefer pure rules with explicit inputs.
- Preserve local edit/outbox atomicity, stable IDs, relaunch/retry recovery,
  account switching, scoped permissions, and existing merge behavior. Test the
  affected boundaries, including rollback where persistence is involved.
- Keep native blank creation and server-owned template installation as distinct
  persistence workflows. Retain installation receipts and canonical import;
  shared rules do not require a shared transaction implementation or offline
  template installation. Cross-platform contracts/fixtures can align behavior
  without sharing an executable engine.

Sharing remains optional: select supported content, save a private template
draft, explicitly review source refreshes, and publish separately. Everyday
planning never automatically exports private data, updates a template, or
changes an installed copy. Recipient inclusion choices and permissions remain
separate from the author's selection of reusable content.

Reconsider a broader engine only if repeated, demonstrated duplication cannot
be handled cleanly by small shared rules. This deferral does not block URL/QR
distribution or billing and adds no implementation slice ahead of them. See the
[architecture decision](../../architecture/experience-blueprints.md#decision-defer-a-broad-creation-engine)
and [selective capture](13-event-to-template-capture.md).

## Implementation order

1. [00 — Current state and target architecture](00-current-state-and-target-architecture.md)
2. [00a — Engine readiness and delivery plan](00a-implementation-readiness.md)
3. [01 — Contracts, storage, and starter catalog](01-contracts-storage-and-starter-catalog.md)
4. [02 — Private authoring, preview, and publishing](02-private-authoring-and-publishing.md)
5. [03 — Installation and native delivery](03-installation-and-native-delivery.md)
6. [04 — Native setup and release acceptance](04-native-setup-and-release-acceptance.md)
7. [05 — Product experience and billing sequence](05-product-experience-and-billing-sequence.md)
8. [06 — Wedding installation proof](06-wedding-installation-proof.md)
9. [07 — Native blueprint discovery](07-native-explore.md)
10. [08 — Date-aware native setup](08-date-aware-setup.md)
11. [09 — Birthday Party and Thanksgiving starters](09-curated-starters.md)
12. [10 — Host-authored stays, packages, and future capabilities](10-host-authored-experiences.md)
13. [11 — Private cottage authoring and independent-copy proof](11-private-cottage-proof.md)
14. [12 — Resumable native setup](12-resumable-setup.md)
15. [13 — Selective event-to-template capture](13-event-to-template-capture.md)
16. [14 — Unlisted template links and revocation](14-unlisted-template-links.md)
17. [22 — QR distribution implementation handoff](22-qr-distribution-handoff.md)

Each numbered slice is a usable boundary. Contract/storage completion is not
authoring completion; authoring completion is not installation completion.
The numbers group responsibilities. The delivery sequence in `00a` pulls the
highest-risk install/native proof forward rather than waiting for all of `02`.
The original recommendation in `05` was internal proof → curated native
experience → Event Pass → private authoring. The subsequent explicit request
selected private authoring/cottage reuse before Event Pass.
`05` is an assessment, not an additional engine runtime module.

## Constraints and concurrent work

- Both reviewed checkouts were clean at the October 14 assessment start. The
  previous planning session's concurrent-change list is historical, not current
  work ownership. Inspect diffs and applicable `AGENTS.md` files again before
  implementation and preserve any newer edits.
- Event lifecycle, moderation, media, invitations, native materialization,
  schema exports/relations and migrations remain integration areas. Re-read
  their current contracts rather than restoring earlier schema assumptions.
- Coordinate schema export/relations changes, migration generation, route
  generation, and native sync integration after the other changes settle.
  Regenerate against the then-current schema; never overwrite generated files
  or migrations to restore a previous baseline.
- Run installed `pnpm intent list` before substantial edits and load matching
  guidance. Intent is now installed; the earlier unavailable-dependency note is
  historical. Use the package script to avoid the dependency binary collision.
- Use Effect domain workflows, Better Auth resource/action authorization,
  Drizzle domain schemas, TanStack Form, folder routes, shadcn controls, and the
  existing English localization catalogs.
- Follow pure workflows plus production layer bindings; transports supply only
  `PgClientLive` for new Effect SQL work. Keep the existing Promise sync engine's
  exception explicit. See the [server guide](../../development/server-implementation-guide.md).
- Main event → direct child events remains the only supported tree depth.
- Blueprint author ownership grants no access to a created consumer event.
- Blank event creation remains available. The web app gains template authoring;
  a full web event editor is not required for this iteration.

The original roadmap selected this bounded work from the previous post-release
deferral; this assessment does not mark it implemented. Business profiles,
public discovery, commerce, packages,
and professional engagements remain deferred. During implementation, update
the broad architecture docs to reflect what actually ships, not anticipated
completion.

## Sources and continuation

- [Expanded Explore categories, curated starters and rollout](21-expanded-explore-catalog.md)

- [Roadmap guide](../../development/roadmap-guide.md)
- [Product model](../../architecture/product-model.md)
- [Experience architecture](../../architecture/experience-blueprints.md)
- [Server architecture](../../architecture/server-architecture.md)
- [Page creation standard](../../development/page-creation.md)
- [Data model](../../architecture/data-model.md)
- [Media ownership](../../architecture/media-system.md)
- [Portable contracts](../../../src/contracts/experience.contracts.ts)
- [Shared fixtures](../../../contracts/examples)
- Native repository: `../ios-apps/gatherory` relative to the web-app root.
  Use the current registered project path, not an old `isaidyes` checkout.

Open implementation risks are explicit in `00`, `00a` and `03`: native bootstrap needs
server-created records; generic module JSON needs semantic validation; Better
Auth workspace creation does not share the product transaction; and the current
Swift timeline requires a date. These are delivery requirements, not reasons to
silently omit installation or invent event dates.
