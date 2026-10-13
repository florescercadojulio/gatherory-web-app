# Experience Blueprints — First Iteration

**Status:** Planned — implementation has not started.
**Priority:** P1, explicitly requested on 2026-10-13.
**Owner area:** `src/server/blueprints/`, protected `/blueprints` pages, and native new-event setup.
**Intended implementer:** GPT-6.1 sol in a later implementation session.

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

Completed behavior: planning only. Existing portable contracts, generated JSON
Schemas, example documents, and Swift decoding were inspected. They do not yet
provide blueprint storage, authoring, publication, or installation.

Decisions made: private authoring plus three curated starters; immutable
publication; server-owned installation with review and idempotency; instructions
included from the outset; native event creation is the first consumer.

Files changed by this planning session: only this roadmap folder.
Validation: documentation consistency and local-link checks; no builds, tests,
database commands, or runtime changes are needed for this planning handoff.

**Immediate next slice:** read `00`, then implement `01`. Do not describe the
feature as shipped until `04` is complete. Update this README and each active
slice with actual behavior, validation performed, and remaining work.

## Implementation order

1. [00 — Current state and target architecture](00-current-state-and-target-architecture.md)
2. [01 — Contracts, storage, and starter catalog](01-contracts-storage-and-starter-catalog.md)
3. [02 — Private authoring, preview, and publishing](02-private-authoring-and-publishing.md)
4. [03 — Installation and native delivery](03-installation-and-native-delivery.md)
5. [04 — Native setup and release acceptance](04-native-setup-and-release-acceptance.md)

Each numbered slice is a usable boundary. Contract/storage completion is not
authoring completion; authoring completion is not installation completion.

## Constraints and concurrent work

- Another AI is working on a separate feature in this checkout. Inspect current
  diffs and applicable `AGENTS.md` files before implementation. Keep unrelated
  edits intact; prefer isolated feature files and small integration patches.
- At planning time, active changes include event lifecycle/departure,
  moderation, media, invitations, native materialization, schema exports,
  relations, generated routes, and migration directories. These are overlap
  areas, not blueprint implementation. Re-read their final contracts before
  changing them; do not copy this session's schema assumptions over newer work.
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
- Main event → direct child events remains the only supported tree depth.
- Blueprint author ownership grants no access to a created consumer event.
- Blank event creation remains available. The web app gains template authoring;
  a full web event editor is not required for this iteration.

This request promotes the bounded blueprint work below from the previous
post-release deferral. Business profiles, public discovery, commerce, packages,
and professional engagements remain deferred. During implementation, update
the broad architecture docs to reflect what actually ships, not anticipated
completion.

## Sources and continuation

- [Roadmap guide](../../roadmap-guide.md)
- [Product model](../../product-model.md)
- [Experience architecture](../../experience-blueprints.md)
- [Server architecture](../../server.architecture.md)
- [Page creation standard](../../page-creation.md)
- [Data model](../../data-model.md)
- [Media ownership](../../media-system.md)
- [Portable contracts](../../../src/contracts/experience.contracts.ts)
- [Shared fixtures](../../../contracts/examples/)
- Native repository: `../ios-apps/gatherory` relative to the web-app root.
  Use the current registered project path, not an old `isaidyes` checkout.

Open implementation risks are explicit in `00` and `03`: native bootstrap needs
server-created records; generic module JSON needs semantic validation; Better
Auth workspace creation does not share the product transaction; and the current
Swift timeline requires a date. These are delivery requirements, not reasons to
silently omit installation or invent event dates.
