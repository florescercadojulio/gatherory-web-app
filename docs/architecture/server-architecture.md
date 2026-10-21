# Gatherory Server Architecture

This document defines the server conventions for Gatherory. Gatherory is one
product, not a platform that hosts several independent applications. It uses
workspaces as ownership, collaboration, and template-publishing scopes, without
carrying over Humphrey Hub's application or platform-host abstractions. The
agreed domain hierarchy is defined in [Product model](product-model.md).

For a practical walkthrough, canonical source links, and validation checklist,
use the [server implementation guide](../development/server-implementation-guide.md).
These conventions are self-contained; the external reference project is not
required to work in this repository.

## Product boundary

The TanStack Start project owns the authenticated web product on the `app`
subdomain. It contains the web UI, Better Auth endpoints, server functions, and
the application domain. The public Astro landing page is a separate project
and must not acquire authentication or database responsibilities.

Normal request/response work belongs in TanStack Start server functions. Public
or cross-origin endpoints, such as the native API routes and future webhooks, use
server routes. Durable notifications, media processing, and scheduled weather
checks must not be hidden inside request handlers. Media upload authorization
and finalization are request workflows; rendition generation remains durable
background infrastructure.

## Domain layout

Product modules live directly under `src/server/<domain>/`:

```text
src/server/events/
  contracts/
  handlers/
  workflows/
  services/
  repos/
  connectors/
  event.layers.live.ts

src/server/media/
src/server/workspaces/
src/server/moderation/
src/server/sync/
src/server/auth/
src/server/email/
```

There is no `src/server/apps/<app>` level. This is the current top-level domain
layout, not a mandate to create every folder for every use case. Ideas,
participants, and registry entries are product concepts, but do not yet have
standalone server domain directories; existing native persistence handles them.

Use these suffixes consistently:

- `*.contract.ts` or `*.contracts.ts` — serializable Zod schemas and types.
- `*.handler.ts` — TanStack Start server-function boundaries.
- `*.workflow.ts` — one use-case orchestration and transaction ownership.
- `*.workflows.live.ts` — production bindings of injectable workflows to domain layers.
- `*.layers.live.ts` — reusable dependency graphs; leave `PgClient` unresolved.
- `*.service.ts` / `*.service.live.ts` — domain API and implementation.
- `*.repo.ts` / `*.repo.live.ts` — persistence API and implementation.
- `*.con.ts` / `*.con.live.ts` — an external provider port and implementation;
  retain existing `*.connector.ts` names where already established.
- `*.adapter.ts` — a runtime bridge for framework callbacks, scripts, or legacy
  callers; use composed workflows rather than rebuilding their dependency graphs.
- `*.persistence.ts` — a concrete persistence implementation behind an injected
  repository, including retained Promise transaction engines.

UI routes and client components call handlers. They never import Drizzle,
repositories, workflows, or provider SDKs. HTTP API routes are transport
boundaries too: they provide infrastructure and execute composed workflows through
`runServerResponse`, or delegate to a dedicated request handler.

TanStack Start emits a client RPC stub for every imported server function.
Handler modules must therefore keep their client-transformed import graph clean:
do not derive exported or local types from runtime server singletons such as
`typeof auth.api`. Define serializable contracts explicitly or import them with
`import type` from a server-independent contract module. Database, Better Auth
server, Node built-in, and provider imports may only remain in the server half
of the transformed module.

## Request flow

```text
route or component
  -> authenticated, authorized handler
  -> one workflow
  -> domain service(s)
  -> repository or connector
```

Dependencies point only down that chain. Keep a layer only when it owns a real
responsibility; do not add empty wrappers for ceremony.

Put each use case in its own `*.handler.ts` and `*.workflow.ts` file, following
the Humphrey Hub project-request reference. A plural handler/workflow module
may re-export those entry points for existing callers. Contract modules must
be safe to import without database credentials or provider configuration.
Use `import type` for persistence projections needed by a service contract;
never initialize a production dependency when importing a service tag.

Resolve repository and connector tags once in `Layer.effect` when building
a service. Live repositories can capture `PgClient` at layer construction and
bind it to their operations, so their contracts do not force injected unit
tests to provide a dummy database. Keep the client's ambient transaction
service intact; never build a second PostgreSQL layer inside a repository or
service method. `Layer.mergeAll` combines independent layers but does not feed
one layer's outputs into another; use `Layer.provide` to wire dependencies.

### Production layer composition

Follow the [Effect v4 layer guide](https://effect.website/docs/v4/requirements-management/layers).
Define each domain graph once with `Layer.provide`, combining independent inputs
with `Layer.mergeAll`. For example, `EventServiceLive` receives `EventAccessLive`
(the repository and authorization layers); the graph still requires `PgClient`.
Do not provide `PgClientLive` inside that graph or inside a workflow binding.

Production handlers import from `workflows/*.workflows.live.ts`. These small
bindings supply the graph to the underlying use case, preserving its inferred
input, success, and error types. PostgreSQL-backed callers now supply just
`PgClientLive`. Individual `*.workflow.ts` files remain pure and injectable:
tests and larger use cases import those to substitute services or compose a
single shared graph. Do not compose larger workflows from production bindings,
which would rebuild their service layers in separate scopes.

Invitation acceptance/preview compose the required event, sharing, and guest
graphs together. All use the caller's client and retain ambient transaction
context. Layer composition does not start a new transaction or move existing
transaction boundaries. Email, legacy native sync, and account deletion do not
acquire an artificial `PgClient` requirement: their existing connectors/Promise
persistence engines remain responsible for their resources.

Keep unrelated runtime dependencies in separate entry points. For example,
moderator session lookup has its own binding so ordinary moderation workflows
do not initialize Better Auth just by being imported.

### Effect runtime

Application server logic is modeled with Effect. The conventions intentionally
match the reference architecture:

- repositories and connectors are `Context.Service` contracts;
- `*.live.ts` modules provide their production `Layer` implementations;
- workflows return `Effect` values and never call `Effect.run*`;
- handlers provide `PgClientLive` when required and call `runServerEffect` exactly once;
- expected failures use tagged domain errors rather than sentinel strings;
- promise-based SDKs are lifted at the repository or connector boundary, never
  in a workflow.

`src/server/effect.ts` is the shared HTTP/server-function result boundary. It logs the
full failure with trace and error IDs while returning only safe product copy.
This is also why handlers must not maintain their own `try/catch` error maps.
Framework callbacks and trusted scripts instead use explicit Promise adapters
under `handlers/`. They must preserve the callback's failure/return contract,
not replace it with an HTTP result envelope. Authentication email adapters also
retain runtime-neutral background scheduling and logged, non-disclosing delivery
failures.

The implementation lives in `src/server/effect-utils.ts`; `effect.ts` re-exports
it for existing callers. Backend expected failures use `Data.TaggedError` with
`DomainErrorShape` and stable codes. Set `userMessageKey` to a typed
`serverErrors.*` catalog entry; `debugMessage` and `cause` are developer-only
and can remain English. Promise adapters preserve existing tagged errors.
Never manufacture `new Error(code)` or inspect `cause.message` to classify a
domain failure. Configuration and native materialization failures are tagged
as well; native mutation rejection codes remain part of the sync protocol.

`runServerEffect` resolves safe copy with an isolated, per-call translator.
`runServerResponse` adds category-based HTTP status handling for API routes;
native sync retains its successful wire shapes and legacy error-code field.
The client receives a translated `userMessage`, a translation key where
available, and a support ID, never the original cause or stack. Frontend React
invariant/request errors continue using ordinary `Error` and Sonner.

Use `transportInput(schema)` only for server-function input typing, then call
`validateInput(schema, data)` inside the Effect passed to `runServerEffect`.
This makes invalid input use the same safe localized response rather than
letting Zod throw before the response boundary. Domain-specific parsers can
provide more specific tagged input failures. Framework redirects remain
navigation control flow, not domain failures.

## Workspace ownership and event authorization

Workspaces own main events, templates, brand settings, and workspace
memberships. Workspace roles authorize workspace administration and template
publishing, but they are not a substitute for event access. A person may host
one event, collaborate on another, and attend a third. Authorization for event
content is therefore evaluated against the event in the request.

The core vocabulary lives in `src/lib/permissions.ts`:

- **Host** — can manage the event and its people.
- **Collaborator** — can help plan according to the participant record's
  planning permission.
- **Guest** — can view invited experiences and manage only their own response.

Every event owns participant assignments. Creating a child event may copy the
main event assignments as a starting snapshot, but the child keeps independent
records after creation. Never infer current child membership from the parent at
read time.

### Better Auth organizations and teams

Better Auth's Organization plugin is the persistence and lifecycle layer for
Gatherory workspaces. The Teams feature is enabled even though the first
release provisions only one default **Planning** team. This provides stable
active-workspace and active-team session context plus membership and invitation
hooks without prematurely building the professional-workspace product.

Use the boundary this way:

- `organization` is the infrastructure record behind a Gatherory workspace;
- `team` groups workspace members who coordinate planning;
- `member` and Better Auth organization invitations concern workspace access;
- `event_participant` and `event_invitation` concern one event's hosts,
  collaborators, guests, permissions, and attendance.

Do not add every guest to the Better Auth organization or Planning team. If a
future workflow promotes an event collaborator into a durable workspace member,
that must be an explicit workflow with both authorization checks and auditable
writes.

### Workspace routing

`/workspaces` is the authenticated account-level directory for creating and
selecting workspaces. Selected workspace pages use
`/workspaces/:workspaceSlug`. The root product route redirects to the user's
active or default member workspace. Switching the top-left workspace control
navigates to a new slug, which causes the server-side workspace layout to
resolve a fresh scope and render the matching sidebar.

The resolver permits access through either Better Auth organization membership
or an explicit `event_participant` record in that workspace. Participant access
does not grant workspace administration, team membership, or resource creation.
Never trust the slug alone: route loaders and server handlers continue to filter
event data by both the resolved workspace ID and the signed-in user.

The event hierarchy is deliberately shallow:

```text
main event
  -> zero or more child events
```

A child event cannot have children. Enforce that invariant in the event-create
workflow and back it with the strongest practical database constraints.

## Handler construction

A handler is the only server-function edge. It must:

1. declare the HTTP method;
2. apply session middleware when the use case requires identity; public token
   previews retain their explicit token-based access path;
3. declare event permissions in middleware for participant-gated single-event
   inputs, retaining the domain service's authorization checks;
4. validate all caller input;
5. call exactly one workflow; and
6. return a safe serializable result.

Authentication and authorization are separate. `requireSessionMiddleware`
proves identity. `EventAuthorization` evaluates a repository-backed participant
assignment against the declared resource/action statement. Route guards and
client visibility checks improve navigation, but do not authorize data access.

```ts
import { inviteEventParticipantWorkflow } from '@/server/events/workflows/event.workflows.live'

export const inviteEventParticipant = createServerFn({ method: 'POST' })
  .middleware([eventAuthorizationMiddleware({ event: ['manage_participants'] })])
  .validator(transportInput(InviteEventParticipantInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(InviteEventParticipantInputSchema, data).pipe(
        Effect.flatMap((invitation) =>
          inviteEventParticipantWorkflow({ userId: context.user.id, invitation }).pipe(
            Effect.map((result) => ({ ...result, expiresAt: result.expiresAt.toISOString() })),
            Effect.provide(PgClientLive)
          )
        )
      )
    )
  )
```

Authorization remains enforced in services for all callers, including native
APIs. Event middleware also checks participation and declared capabilities
before a server-function handler executes. Neither layer may treat a caller's
event ID as proof of access or trust caller-supplied identity, roles, or permissions.

### Reusable event authorization

Use `eventAuthorizationMiddleware` from `src/lib/event-authorization.middleware.ts`
for handlers whose input identifies a single event with `eventId`:

```ts
.middleware([eventAuthorizationMiddleware({ event: ['manage_participants'] })])
```

It composes session authentication, validates the event UUID before lookup, and
calls the reusable `ensureEventPermission` Effect in `src/server/events/authorization.ts`.
The repository resolves the authenticated user's current participation for that
specific event, including existing retained-access rules. `EventAuthorization`
evaluates the same policy used by services: hosts and managing collaborators can
manage participants; contributing collaborators have contribution capabilities;
view-only collaborators and guests have viewer capabilities. Guests cannot gain
management rights from their planning-permission field. No active organization
or organization membership is required. Guests here are authenticated participants,
not anonymous visitors.

Permissions come from server code and empty declarations fail closed. The
middleware preserves the full payload for handler validation and exposes verified
`context.eventAccess` (`eventId`, `role`, `planningPermission`). It is ordinary
middleware context, not an ambient Effect execution-context service. Failures use
the sanitized `runAuthorizationCheck` boundary described below and never call
`next()`. Pre-handler denials reject the call rather than returning `ServerResult`.

`inviteEventParticipant` uses this gate. Its service still rechecks permission;
the middleware does not replace domain enforcement or provide transactional
protection against concurrent permission changes. Do not apply this gate to
invitation acceptance/previews, which authorize tokens before participation
exists, or to root-event creation/listing, which have different scope. For inputs
keyed by another resource (such as a media asset), resolve its actual event in
the domain service; never authorize a separate caller-provided event ID and then
operate on an unrelated resource.

### Reusable organization authorization

Use `orgAuthorizationMiddleware` from `src/lib/auth.middleware.ts` for
organization administration. Declare the required permissions in server code:

```ts
createServerFn({ method: 'POST' }).middleware([
  orgAuthorizationMiddleware({ organization: ['update'] }),
])
// Validate input, then execute the settings workflow in runServerEffect.
```

The middleware composes `requireActiveOrgMiddleware`, which itself composes
`requireSessionMiddleware`. It checks the authenticated user's actual active
membership, verifies that both its user and organization IDs match the session,
then calls Better Auth's permission endpoint with that explicit organization ID.
The endpoint rechecks current membership and roles. A session's active
organization ID alone is not evidence of membership. Required actions are never
read from caller input, and empty permission declarations fail closed.

`ensureActiveOrg` and `ensureOrgPermission` are reusable Effect helpers exported
from `src/lib/auth.functions.ts`; their implementation and injectable connector
live under `src/server/auth/`. They are not new RPC endpoints. Other server
boundaries can compose these Effects with their own safe response runner.

Middleware failures occur before the handler's `runServerEffect`. The
`runAuthorizationCheck` boundary uses the same logging and translation before
throwing only public copy and an error ID; it never passes provider error details
to the client and never calls `next()` on denial. Consumers attaching this
middleware must handle a rejected server-function call, not expect a handler's
`ServerResult` for pre-handler failures. Unauthenticated requests retain the
existing sign-in redirect.

No current event, media, sync, or workspace-selection handler is gated by this
organization-administration middleware. Event hosts, collaborators, and guests
can have event access without organization membership; their event-scoped
authorization remains in domain services. When an organization-settings handler
is introduced, attach the middleware explicitly. No ambient execution-context
service is introduced by this pattern.

## Permission rules

Permissions use Better Auth's resource/action statement model, not dotted
strings or screen names. Examples include:

```ts
{
  event: ['update', 'manage_participants']
}
{
  idea: ['create', 'decide']
}
{
  registry: ['commit']
}
{
  media: ['upload']
}
```

`src/lib/permissions.ts` owns the statement, roles, and participant-to-role
mapping. A persisted participant assignment is still authoritative. The server
resolves it, maps `host`, `collaborator`, or `guest` plus the planning
permission to an access-control role, and asks Better Auth's access-control
engine to authorize the required statement. Client-side checks may hide
controls but never replace this server check.

Keep differently privileged operations in separate handlers. For example,
responding to an invitation and editing an event are different endpoints even
when they appear in the same screen.

## Contracts

Contracts are serializable boundary vocabulary. Every handler input has a Zod
schema. Inputs contain only values the caller may choose. IDs, ownership,
participant snapshots, defaults, audit fields, and state transitions are set
from trusted server context or by the workflow.

List endpoints used by `EntityTablePage`, `EntityPicker`, and
`MultiEntityPicker` use the shared shape:

```ts
type PageInput = { limit: number; offset: number; query: string }
type Page<T> = { data: T[]; hasNextPage: boolean }
```

Repositories own filtering, stable ordering, and pagination. Fetch `limit + 1`
rows and return only `limit`; the extra row is evidence for `hasNextPage`.
Selectors return only the fields the picker needs.

## Workflows and transactions

A workflow represents one use case. It applies defaults, coordinates services,
and owns the database transaction when multiple writes must be atomic.

Creating a child event is a good transaction example:

1. verify the parent is the main event;
2. create the child event;
3. copy the main event participant assignments into independent child records;
4. commit all writes together.

For new use cases, services and repositories should not open or commit separate
transactions: repositories may perform row locking inside a workflow-owned
transaction. Existing atomic persistence operations are intentionally retained
at their established boundaries during the structure cleanup. In particular,
native sync/materialization, account deletion, event RSVP/invitations,
moderation, and workspace creation keep their existing transaction ownership,
locks, savepoints, ordering, and rollback behavior. Do not move a transaction
outward merely to match the target folder layout.

The sync Promise engines live in `sync/repos/*persistence.ts` behind `NativeSyncRepo`.
Account deletion lives in `auth/repos/account-deletion.persistence.ts` behind
`AccountDeletionRepo`. Its injected storage callback remains Promise-based so
idempotent object deletion completes at the same point before the database
transaction. The repository adapter lifts the whole operation, rather than
running a separate Effect runtime inside its transaction. Original callback
failures remain observable to Better Auth. A future native-Effect rewrite of
these engines is a separate behavior-sensitive migration, not unfinished file
organization. Its current status is recorded in the
[roadmap stopping point](../roadmaps/server-architecture-roadmap/README.md#current-stopping-point).

## Services, repositories, and connectors

Services own domain rules and public domain operations. Repositories own
database reads and writes. Connectors own external APIs such as WeatherKit,
Apple Music, maps, email, and object storage.

Every event-owned repository query includes an access or ownership scope. An
event ID by itself is never authorization. Repositories return narrow typed
projections; services map those projections into public contracts.

Guest invitation repositories return asset metadata without signing URLs.
`EventGuestService` resolves artwork through `EventInvitationArtwork`, preserves
the public feed projection, and treats signing failure as a null URL. Moderation
evidence signing similarly belongs in the service/connector path after access
checks. Metadata such as private bucket names and storage keys must never appear
in those public projections.

Retained root modules and plural `*.handlers.ts`/`*.workflows.ts` files are
compatibility exports, not alternative implementations. Production
`*.workflows.live.ts` files are bindings, not compatibility barrels. Application
routes and domain modules use canonical contracts, handlers, and injected ports.
Compatibility adapters provide dependencies without creating a second PostgreSQL client inside an
existing transaction.

Expected failures use tagged domain errors and cross one safe handler boundary.
Never send database messages, provider responses, stack traces, or raw `Error`
objects to the client. Client errors contain safe copy and a trace ID.

## Drizzle schema split

Keep schema files aligned to durable domains. The current schema modules are:

```text
src/db/schema/
  auth.schema.ts
  event.schema.ts
  media.schema.ts
  planning.schema.ts
  moderation.schema.ts
  sync.schema.ts
  index.ts
src/db/relations.ts
src/db/index.ts
```

Better Auth owns its core auth tables. Gatherory owns product tables. Drizzle
Kit reads only `*.schema.ts`, preventing the schema barrel from being discovered
as a duplicate table source. Export all runtime relations through one relation
composition file, but do not turn it into a catch-all schema file. Migration
and seed utilities may use the ordinary Drizzle client. Application persistence
is exposed through injected Effect repository services. A repository may lift
the ordinary Drizzle promise while its domain is being migrated; callers still
depend only on its service contract, making a native Effect/Drizzle
implementation an isolated change.

## Testing injected domains

Use Vitest for all tests and `@effect/vitest` for Effect programs. A domain test
should provide the real service implementation with substitute repository and
connector layers, so it exercises authorization, decisions, and failure behavior
without opening production resources. Use `it.effect` with `Effect.gen` and
assert expected typed failures with `Effect.exit`. Use `it.layer` for shared
immutable fixtures; create mutable fixtures separately for each test.

Use `it.live` for explicit database/provider integrations that need real clock
behavior. Both runners manage a test scope. Keep local-host checks, environment
opt-ins, and rollback or resource cleanup in integration tests. Workflows do
not call `Effect.runPromise` to make tests easier; the test runner owns execution.

Architecture checks additionally guard use-case handlers against direct SQL
and SDK imports, and guard workflows against runtime execution, Promise
adapters, and imports of live implementations. These checks complement behavior
tests and do not replace database integration verification.

`workflow-layer-requirements.test.ts` checks every production binding's remaining
requirements during `pnpm typecheck`; run typechecking as well as Vitest because
Vitest does not typecheck assertions by default. Composition tests exercise real
repository adapters and service graphs with substituted persistence, verifying
shared client identity, ambient context, scope cleanup, and authorization.

## Implementation status and examples

Use the [implementation guide](../development/server-implementation-guide.md)
for source-level examples and the
[architecture roadmap](../roadmaps/server-architecture-roadmap/README.md)
for completed work, intentional exceptions, and dated verification evidence.
Authentication email workflows, event invitations/sharing, guest operations,
media operations, workspace services, moderation, and sync boundaries already
exist; do not treat them as unimplemented foundation work. Future product scope
belongs in the relevant product roadmap rather than this conventions document.

## New use-case checklist

1. Define input and public output contracts.
2. Declare authentication at the handler and event permissions in the domain
   service operation.
3. Add event-scoped repository operations with narrow projections.
4. Add service behavior and one pure workflow; compose its production graph and binding.
5. Define multi-write atomicity for new work; preserve established transaction boundaries.
6. Supply remaining infrastructure and cross the safe result boundary once in the handler.
7. Consume only the handler from routes/components.
8. Cover unauthorized access, cross-event isolation, state conflicts, and safe
   error results in tests; verify dependency types and import safety too.
