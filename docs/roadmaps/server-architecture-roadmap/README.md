# Server architecture refactor

Status: Architecture and file-structure cleanup complete; existing transaction engines retained
Owner: `src/server/` and native API transport boundaries
Started: October 14, 2026

## Current stopping point

As of October 14, 2026, the structural cleanup and Effect v4 layer composition
are implemented. The subsequent request to migrate Promise-based sync and
account-deletion persistence was redirected to documentation before code edits
or agent work began. That migration is **deferred, not implemented or active**.
Do not resume it without a fresh request.

The [server implementation guide](../../development/server-implementation-guide.md)
captures the patterns for future contributors and chats. This documentation
follow-up changes no runtime code, schema, or transaction behavior. Historical
test results below belong to the implementation run, not a new release audit.

## Purpose

Bring existing backend domains back to the [server architecture](../../architecture/server-architecture.md),
using Humphrey Hub's `src/server/apps/project-request` as the implementation reference.
Gatherory keeps domains directly under `src/server/`; it does not acquire an `apps` namespace.

## Target and implementation order

1. Separate use-case handlers, contracts, workflows, injected domain services,
   repository contracts/live implementations, and provider connectors.
2. Compose domain layers once and bind production workflows, leaving only
   PostgreSQL at transport boundaries. Keep the underlying workflows as Effect
   programs that tests can run with substitute services.
3. Verify authorization, safe errors, and existing wire shapes with Vitest and
   `@effect/vitest`; keep local database and R2 tests explicitly opt-in.
4. Keep existing transaction engines intact behind injectable adapters. A native
   Effect persistence rewrite is a separate future migration requiring equivalent
   locking and rollback integration coverage.

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

## Completed remaining cleanup

- Account deletion's transaction algorithm now lives in `auth/repos/` behind
  injectable repository/storage contracts and a service/workflow. The Promise
  callback is composed in `handlers/account-deletion.adapter.ts`.
- Apple revocation now has separate account persistence, token decoding/configuration
  and revocation connectors, and a pure service/workflow. Sequential revocation,
  legacy token handling, and stop-on-failure behavior are preserved.
- Guest invitation repositories return projections and asset metadata; the guest
  service signs through an injected connector with the same best-effort null
  fallback. The original repository path delegates through a compatibility adapter.
- Moderation preview signing no longer lives in the repository. Its legacy
  adapter supplies the injected service while retaining the caller's PostgreSQL
  requirement and ambient transaction. Visibility predicates live under repos.
- Native sync helpers live under contracts, services, workflows, and handlers.
  Original root imports remain thin exports, and transaction engines use canonical
  imports. Native session lookup delegates to the auth connector boundary.
- Trusted workspace provisioning now uses an Effect workflow over the same
  repository/Better Auth connector ports, with a Promise script adapter. It does
  not add team/session/main-event side effects to seeding.
- Authentication emails use separate injectable Effect workflows; their adapter
  retains nonblocking scheduling, original copy/templates, and failure logging.
- Application route and auth integration imports point to canonical handlers and
  adapters. Architecture tests cover pure domain imports, provider-free repository
  implementations, email workflows, and thin legacy entry points.

## Preserved behavior and intentional boundaries

- Preserve event permissions, workspace membership distinctions, sync protocol,
  receipt ordering, locks, transaction behavior, and error codes.
- Keep Better Auth's required Promise callbacks at their integration boundary.
- Native materialization, sync, and account-deletion persistence remain
  Promise-based internally by design. Their transaction algorithms were not
  rewritten. Account deletion accepts an injected storage callback at its
  original execution point; it still finishes object removal before SQL work.
- Older public import paths remain as thin compatibility exports. Their actual
  composition lives in adapters, with domain logic and persistence in the canonical
  folders. These paths are supported but are not the entry point for new code.
- No schema migration, deployment, provider operation, or production build is
  required by this structural refactor.

## Verification and stopping point

### Organization authorization follow-up

Added `requireActiveOrgMiddleware` and `orgAuthorizationMiddleware` with typed
Better Auth organization permissions, reusable Effect helpers, an injectable
connector, and a sanitized pre-handler failure boundary. Existing session
helpers remain compatible. No execution-context service was added.

These organization gates are for future organization-administration handlers,
not event participation or workspace selection. Validation for this follow-up is in
the full suite, including real TanStack middleware-chain tests with substituted
auth APIs. Denials, scope mismatches, revoked membership, and provider failures
never reach the handler. Session-provider failures now use the same sanitized
pre-handler error boundary; missing sessions still redirect to sign-in.

### Event authorization follow-up

Added `eventAuthorizationMiddleware` with server-declared `EventPermissions` and
the injectable `ensureEventPermission` Effect. It authenticates, validates the
event ID, and checks current event participation through the existing policy.
Hosts, collaborator access levels, and authenticated guests do not need active
organization membership. Participant invitations now use the middleware;
domain checks remain in place for native APIs and direct service callers.
Token-based invitation flows and mixed-scope handlers remain unchanged.
Pre-handler denials use sanitized rejected calls, not handler `ServerResult`s.
Tests cover the role matrix, identity/permission spoofing, malformed scope,
revoked participation, empty declarations, and private provider failures.

### Effect v4 layer composition follow-up

Production workflow bindings now compose reusable domain graphs with
`Layer.provide`. PostgreSQL-backed transport callers provide only `PgClientLive`;
email and retained Promise-based sync/account-deletion workflows remain Pg-free.
The underlying use-case workflows stay injectable for tests. Transaction engines,
scope propagation, and authorization rules are unchanged. Luna agents handled
media/workspaces, auth/email, and moderation/sync; integration review covered
events, middleware, import isolation, and the shared tests.

New checks enforce the production workflow requirement types, prevent renewed
handler graph wiring, and exercise cross-service invitation composition with a
caller-owned client and ambient scope. The moderator-access workflow has a
separate production binding to avoid pulling session infrastructure into ordinary
moderation callers.

### Local verification from the implementation run (October 14, 2026)

- `pnpm typecheck`: passed.
- `pnpm test`: passed, 163 tests across 37 files; 9 opt-in integration tests skipped.
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
- Source comparison against the pre-cleanup revision confirms unchanged sync
  and materializer bodies (imports only), unchanged RSVP transaction code, and
  unchanged account-deletion operation body apart from the injected storage
  callback name. This is preservation evidence, not a substitute for executing
  the opt-in database/provider tests.
- `git diff --check`: passed. No production build, schema migration, deployment,
  or external database/provider write was performed.

The required local Intent check reported `@tanstack/intent` unavailable. No
replacement dependency was downloaded or installed.
