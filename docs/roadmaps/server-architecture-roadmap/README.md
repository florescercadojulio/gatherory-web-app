# Server architecture refactor

Status: Structural refactor complete; persistence follow-up remains
Owner: `src/server/` and native API transport boundaries
Started: October 14, 2026

## Purpose

Bring existing backend domains back to the [server architecture](../../architecture/server-architecture.md),
using Humphrey Hub's `src/server/apps/project-request` as the implementation reference.
Gatherory keeps domains directly under `src/server/`; it does not acquire an `apps` namespace.

## Target and implementation order

1. Separate use-case handlers, contracts, workflows, injected domain services,
   repository contracts/live implementations, and provider connectors.
2. Compose production layers at transport boundaries. Keep workflows as Effect
   programs that tests can run with substitute services.
3. Verify authorization, safe errors, and existing wire shapes with Vitest and
   `@effect/vitest`; keep local database and R2 tests explicitly opt-in.
4. Continue native Effect persistence migration for legacy transactional engines
   after their locking and rollback behavior has equivalent integration coverage.

## Completed scope

Events, media, workspaces, moderation, sync, and Apple-token auth now expose
injected Effect boundaries. Six Luna agents worked in separate ownership slices;
integration review covered shared imports, dependency provision, client-safe
contracts, failure behavior, and the complete test suite.

- Events: individual server-function handlers and workflows, pure repository
  tags, injected sharing/guest operations, and invitation lookup SQL removed
  from transport code.
- Media: injectable storage, repository, and service layers; separate upload,
  finalize, and read workflows for both web and native API transports.
- Workspaces: native Effect Drizzle repository, Better Auth connector, and
  service orchestration for provisioning, creation/compensation, and resolution.
- Moderation: injectable moderation/block repositories and evidence-storage
  connector, individual workflows, and a separate moderator-access handler.
- Sync: bootstrap/push/pull workflows over a typed legacy-persistence adapter;
  workspace insights use a separate repository, service, workflow, and handler.
- Auth: Apple-code exchange and token storage use a handler/workflow/service,
  provider connector, and native Effect Drizzle repository. The existing Promise
  entry point delegates to those same layers.

Existing public import paths may remain as compatibility barrels. Those paths
must not become the dependency used by new injectable workflows or service
contracts. Provider promises belong in connector implementations. Legacy
transactional persistence may use a typed Effect adapter while its underlying
algorithm remains unchanged.

## Constraints and deliberate deferrals

- Preserve event permissions, workspace membership distinctions, sync protocol,
  receipt ordering, locks, transaction behavior, and error codes.
- Keep Better Auth's required Promise callbacks at their integration boundary.
- Native materialization and account-deletion persistence need a follow-up
  migration; extracting interfaces does not make their internals Effect-native.
- Guest invitation feed/artwork helpers still mix projection and URL signing
  inside the legacy repository adapter. Extract those into injected storage
  orchestration in a follow-up, retaining the current visibility checks and
  best-effort artwork behavior.
- The seed-compatible `workspaces/create-event-workspace.ts` helper, Apple
  account-revocation/deletion callbacks, and direct moderation preview export
  remain compatibility boundaries. New application code should use the injected
  paths rather than expand these older entry points.
- No schema migration, deployment, provider operation, or production build is
  required by this structural refactor.

## Verification and stopping point

- `pnpm typecheck`: passed.
- `pnpm test`: passed, 73 tests across 24 files; 9 opt-in integration tests skipped.
  Contract schema freshness is included in this command.
- New service tests use `@effect/vitest` with substituted ports. They cover
  event authorization, workspace compensation and participant-only resolution,
  media permission/state denial, moderation evidence access, sync wiring,
  and Apple token mismatch/persistence-failure revocation.
- Architecture checks guard handler/API, workflow, and service dependencies.
  An import test rejects production DB, environment, and auth initialization
  while importing live domain logic.
- Existing real-resource Effect tests use `it.live` rather than the test clock.
  They were not enabled during this refactor; transaction/provider behavior
  still needs explicit local integration verification before release.
- `git diff --check`: passed. No production build, schema migration, deployment,
  or external database/provider write was performed.

The required local Intent check reported `@tanstack/intent` unavailable. No
replacement dependency was downloaded or installed.
