# 06 — Wedding installation proof

Implemented October 15, 2026 as the first bounded engine slice. This is not the
complete three-starter/private-authoring release and introduces no billing.

## What exists

- The existing schema-v1 blueprint envelope has executable `experience_tree`
  v2, `ideas` v2, and `instructions` v1 modules, with bounded content, stable
  references, explicit capabilities, and a pure deterministic expansion plan.
- One deployment-managed Wedding revision offers optional venue visit,
  rehearsal, ceremony and reception, five undecided planning ideas, and audience
  scoped guidance. Children require confirmed dates; no invitations, votes,
  attendance responses, venues, or budgets are invented.
- Authenticated `/api/blueprints/catalog`, `/preview`, `/install`, and
  `/installations/$requestId` endpoints share the Effect domain workflows.
  Preview and install pin the reviewed revision's SHA-256 content hash.
- An actor/request UUID receipt pins the plan and provisioning slug before
  Better Auth is called. A recoverable lease prevents concurrent attempts from
  independently provisioning. A completed replay returns the original manifest
  after rechecking live event access. Different input with the same key conflicts.
- New installations provision a new workspace. Reusing a personal empty workspace
  is deliberately deferred. No active-session switch or destructive compensation
  runs inside this flow. An interrupted attempt retains its receipt and empty
  provisioned workspace for recovery.
- The product transaction writes the event tree, host and event assignments,
  settings, ideas, guides, independent configuration, native snapshot/entities/
  change log and completed manifest on the same Effect PostgreSQL connection.
  It never calls the legacy Promise-based sync writer as an assumed transaction
  participant. Source retirement and destination ownership are rechecked at commit.
- Native import uses the existing bootstrap persistence transaction, preserving
  server IDs without generating local create mutations. The exact request is
  atomically saved under its account before POST; status recovery finishes an
  interrupted install. Account activation generations reject stale callbacks.
- Guides/configuration are optional fields in archive and sync payload v1.
  This slice delivers them through authoritative workspace snapshots, not new
  independent mutation types. Guides are read-only after installation for now.
  Normal event and idea editing continues through the existing outbox.
- `X-Gatherory-Capabilities: blueprint-guides-v1` gates reads/writes of installed
  scopes. Unsupported clients receive a recoverable HTTP 426 before accepting a
  write or advancing a cursor. A capable bootstrap restores the complete content.
  Compatibility is tied to live configuration, not the installation audit record.
- Canonical guide/configuration fields override client workspace snapshots.
  Child-only planners receive only their child's guides. Guest invitation DTOs
  expose only that exact event's `event_participants` guidance and never grant
  planner scope membership. Invitation UI excludes private planning guidance.

## Deployment and verification

The additive migration is
`drizzle/20261015131528_faulty_morbius/migration.sql`. It includes database guards
against modifying published revision content and completed installation results.
Apply it before deploying code that queries these tables. Run `pnpm blueprints:seed`
with an explicitly selected `DATABASE_URL` afterward. The command does not load
development secrets, reset data, create users, or run automatically on requests.
Repeated identical/concurrent runs are no-ops; changed content requires an
explicitly incremented revision. Retiring a revision does not mutate live plans.

Validation uses Vitest / `@effect/vitest`, an isolated local PostgreSQL database,
and native `GatheroryTests`; UI tests are excluded. The database test is opt-in:

```sh
RUN_BLUEPRINT_DB_TESTS=1 DATABASE_URL=<disposable-local-postgresql-url> \
  pnpm exec vitest run tests/integration/blueprint-installation.database.test.ts
pnpm typecheck
pnpm test
```

The shared wire fixtures are `contracts/examples/wedding-catalog.v1.json`,
`wedding-preview.v1.json`, and `wedding-install-native.v1.json`; the iOS test
bundle keeps matching files under `GatheroryTests/Fixtures/`. Keep each pair
byte-identical. Web tests regenerate the expected catalog, expanded plan, and
projection in memory and compare them with the fixtures. Native tests decode
catalog and review models, then import the archive using the real codec and
SwiftData persistence path.

Only the disposable test database was migrated/seeded during implementation.
No development or production migration, deployment, app upload, or release
enablement is implied by this proof.

Server verification on October 15: `pnpm typecheck`, `pnpm contracts:check`,
and the full Vitest run passed (205 tests; 14 environment/opt-in tests skipped).
The separate opt-in PostgreSQL integration test passed against a migrated
disposable local PostgreSQL 18 container. It covers rollback after native writes,
same-key concurrency, lost provider responses, source retirement, canonical/native
ID and visibility agreement, child/guest isolation, old-client rejection, and
normal sync edits after installation. That container was removed afterward.

The full non-UI `GatheroryTests` suite passed on the iPhone 17 / iOS 27 simulator:
352 tests (420 executions including parameterized cases), zero failures or skips.
Native coverage includes actual catalog/preview decoding, bootstrap import from
the server-generated archive, stable IDs and host controls, lost-response and
failed-attempt recovery, disk relaunch, A→B→A stale-callback rejection, edits made
during bootstrap, and a no-op save producing no outbox entries. The archive
adapter uses Swift's associated-value enum encoding and native empty-location
representation to avoid import-time normalization edits. English/Spanish
localization verification passed for 981 strings. UI tests were not run.

## Remaining work

- Birthday Party and Thanksgiving content is now implemented in [09](09-curated-starters.md);
  full curated review usability trials remain open.
- Template-created playlists. Native music is an always-active playlist and
  normalizes to `chosen`; it cannot represent an undecided starter without a
  false edit on import. Music is excluded from this executable subset rather
  than changing existing playlist behavior or inventing an approval. The Wedding
  ideas are venue, attire, food, flowers, and photography.
- Editable live guides with expected-version conflicts and authoritative change
  delivery. The read-only first slice must not be described as a guide editor.
- Private drafts, workspace blueprint permissions, publishing/retirement UI,
  private catalog pagination/search, and reuse of existing empty workspaces.
- Optional end time/location, currency selection and richer portable category
  configuration in template setup. Initial defaults are explicit: USD, no budget,
  no location, no end time, and no active collaborator share link.
- Physical-device and actual iOS 26 runtime checks, plus a real two-account
  invitation review before exposing this as a broad release. Simulator/unit
  checks do not prove the Better Auth provider's deployed configuration.
- Operator recovery for a revision retired during an incomplete installation.
  The pinned request and provisioned empty workspace are retained, but retries
  cannot complete while that source remains retired. Do not discard an uncertain
  receipt or silently substitute a new revision. A user-facing abandon/replan
  flow with authoritative server confirmation is future work.

The original first-iteration acceptance criteria remain open where they go
beyond this proof. Annual plans and Event Pass charging remain separate work.
