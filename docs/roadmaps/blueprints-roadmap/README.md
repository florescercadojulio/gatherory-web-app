# Experience Blueprints — First Iteration

**Status:** Planned — implementation has not started.
**Priority:** P1, explicitly requested on 2026-10-13.
**Owner area:** `src/server/blueprints/`, protected `/blueprints` pages, and native new-event setup.
**Last reviewed:** 2026-10-14, against web/server `f9f322c` and iOS `39a0df5`.

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

## Current position and stopping point

Completed blueprint behavior: portable contracts, generated JSON Schemas,
example documents and generic Swift decoding only. No executable blueprint
storage, authoring, publication or installation exists. The October 14 review
also inspected the current Effect server architecture and extracted iOS
archive/outbox/remote-merge/media boundaries.

Decisions made: private authoring plus three curated starters; immutable
publication; server-owned installation with review and idempotency; instructions
included from the outset; native event creation is the first consumer.

Files changed by this planning session: only this roadmap folder.
Validation: documentation consistency and local-link checks; no builds, tests,
database commands, or runtime changes are needed for this planning handoff.

**Immediate next slice, when implementation is requested:** read `00` and `00a`,
finalize typed modules/plan DTOs and the compatibility test matrix, then implement
`01`. Prove one starter's transactional installation and native import (`03` plus
the model/transport part of `04`) before completing the full authoring UI. Do not
describe the feature as shipped until all slices are complete. This session is
docs-only; no implementation slice was started.

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

## Implementation order

1. [00 — Current state and target architecture](00-current-state-and-target-architecture.md)
2. [00a — Engine readiness and delivery plan](00a-implementation-readiness.md)
3. [01 — Contracts, storage, and starter catalog](01-contracts-storage-and-starter-catalog.md)
4. [02 — Private authoring, preview, and publishing](02-private-authoring-and-publishing.md)
5. [03 — Installation and native delivery](03-installation-and-native-delivery.md)
6. [04 — Native setup and release acceptance](04-native-setup-and-release-acceptance.md)

Each numbered slice is a usable boundary. Contract/storage completion is not
authoring completion; authoring completion is not installation completion.
The numbers group responsibilities. The delivery sequence in `00a` pulls the
highest-risk install/native proof forward rather than waiting for all of `02`.

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
- The repository requires an installed Intent skill check before substantial
  edits. The planning-time check reported `@tanstack/intent` unavailable. Do not
  download a substitute automatically; use the repository instructions.
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
