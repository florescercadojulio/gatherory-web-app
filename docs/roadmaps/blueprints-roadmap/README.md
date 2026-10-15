# Experience Blueprints — First Iteration

**Status:** In progress — first Wedding installation slice implemented; full iteration remains open.
**Priority:** P1, explicitly requested on 2026-10-13.
**Owner area:** `src/server/blueprints/`, protected `/blueprints` pages, and native new-event setup.
**Last reviewed:** 2026-10-15, against web/server `ef57f6a` and iOS `9e3a70e`.
October 14 implementation evidence in `00`/`00a` remains dated to that review;
the subsequent October 15 implementation adds the Wedding proving slice described below.

## Outcome

A host can start from Wedding, Birthday Party, or Thanksgiving, make a private
template with suggested activities, starter ideas, and instructions, preview
it, and publish a version for reuse. Creating an event from a version produces
independent planning records that the host can change normally.

Use **Templates**, **New template**, and **Use template** in the product.
**Blueprint** is the shared contract and implementation term. A template's
suggestions are offered for review; they are not attendance responses or final
planning decisions.

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
billing-first recommendation in `05`; billing remains unimplemented. Future
QR generation remains a follow-up to the URL flow in `14`; native public
discovery is implemented in `16`. Templates do not require payment. Do not
describe the full feature as shipped until its remaining slices are complete.

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
