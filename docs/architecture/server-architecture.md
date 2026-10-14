# Gatherory Server Architecture

This document defines the server conventions for Gatherory. Gatherory is one
product, not a platform that hosts several independent applications. It uses
workspaces as ownership, collaboration, and template-publishing scopes, without
carrying over Humphrey Hub's application or platform-host abstractions. The
agreed domain hierarchy is defined in [Product model](product-model.md).

## Product boundary

The TanStack Start project owns the authenticated web product on the `app`
subdomain. It contains the web UI, Better Auth endpoints, server functions, and
the application domain. The public Astro landing page is a separate project
and must not acquire authentication or database responsibilities.

Normal request/response work belongs in TanStack Start server functions. Public
or cross-origin endpoints, such as future mobile API routes and webhooks, use
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

src/server/ideas/
src/server/participants/
src/server/registry/
src/server/media/
src/server/workspaces/
src/server/templates/
```

There is no `src/server/apps/<app>` level. Events, ideas, participants, and
registry entries are domains within the same Gatherory product.

Use these suffixes consistently:

- `*.contract.ts` or `*.contracts.ts` — serializable Zod schemas and types.
- `*.handler.ts` — TanStack Start server-function boundaries.
- `*.workflow.ts` — one use-case orchestration and transaction ownership.
- `*.service.ts` / `*.service.live.ts` — domain API and implementation.
- `*.repo.ts` / `*.repo.live.ts` — persistence API and implementation.
- `*.con.ts` — an external provider connector.

UI routes and client components call handlers. They never import Drizzle,
repositories, workflows, or provider SDKs. HTTP API routes are transport
boundaries too: they may compose live layers and execute workflows through
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

### Effect runtime

Application server logic is modeled with Effect. The conventions intentionally
match the reference architecture:

- repositories and connectors are `Context.Service` contracts;
- `*.live.ts` modules provide their production `Layer` implementations;
- workflows return `Effect` values and never call `Effect.run*`;
- handlers provide the required layers and call `runServerEffect` exactly once;
- expected failures use tagged domain errors rather than sentinel strings;
- promise-based SDKs are lifted at the repository or connector boundary, never
  in a workflow.

`src/server/effect.ts` is the only Effect-to-transport boundary. It logs the
full failure with trace and error IDs while returning only safe product copy.
This is also why handlers must not maintain their own `try/catch` error maps.

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
2. apply session middleware;
3. make its event-scoped authorization requirement explicit in the domain
   service call;
4. validate all caller input;
5. call exactly one workflow; and
6. return a safe serializable result.

Authentication and authorization are separate. `requireSessionMiddleware`
proves identity. `EventAuthorization` evaluates a repository-backed participant
assignment against the declared resource/action statement. Route guards and
client visibility checks improve navigation, but do not authorize data access.

```ts
export const updateEvent = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(UpdateEventSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(UpdateEventSchema, data).pipe(
        Effect.flatMap((input) =>
          updateEventWorkflow(input, { userId: context.user.id }).pipe(
            Effect.provide(EventServiceLive),
            Effect.provide(EventRepoLive),
            Effect.provide(EventAuthorizationLive)
          )
        )
      )
    )
  )
```

Authorization stays in a service when it depends on a domain record, such as an
event participant assignment. Request middleware is reserved for request-wide
facts such as identity or an active Better Auth organization. Neither layer may
trust a role, event ID, or permission statement supplied by the browser.

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

Services and repositories do not open or commit transactions. Repositories may
perform row locking inside a workflow-owned transaction.

## Services, repositories, and connectors

Services own domain rules and public domain operations. Repositories own
database reads and writes. Connectors own external APIs such as WeatherKit,
Apple Music, maps, email, and object storage.

Every event-owned repository query includes an access or ownership scope. An
event ID by itself is never authorization. Repositories return narrow typed
projections; services map those projections into public contracts.

Expected failures use tagged domain errors and cross one safe handler boundary.
Never send database messages, provider responses, stack traces, or raw `Error`
objects to the client. Client errors contain safe copy and a trace ID.

## Drizzle schema split

Keep schema files aligned to durable domains:

```text
src/db/schema/
  auth.schema.ts
  event.schema.ts
  media.schema.ts
  idea.schema.ts
  registry.schema.ts
  shared.ts
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

## Current backend slice

The foundation now includes the auth UI shell, sidebar-07 protected shell,
PostgreSQL client, Drizzle configuration and migrations, Better Auth
organizations with teams, automatic personal-workspace provisioning,
additional event-workspace creation, an account-level workspace directory,
session middleware, permission vocabulary, reusable entity components, the
first Events persistence slice, and the private R2 media-upload foundation.

The Events slice currently provides main/child event persistence, the two-level
tree invariant, participant snapshots for new child events, event-scoped invite
records and acceptance, Effect repository/service layers, tagged domain errors,
safe handlers, and Better Auth-style repository-backed authorization checks.
Email delivery, event mutation, and participant administration are the next
backend workflows. Media currently provides reusable asset metadata,
event placement records, signed direct uploads, finalization checks, and
authorized reads; durable image rendition processing remains deferred. Template
and professional-workspace tables remain deferred; the ownership model above
reserves room for them without putting them in the first-release path.

## New use-case checklist

1. Define input and public output contracts.
2. Declare authentication at the handler and event permissions in the domain
   service operation.
3. Add event-scoped repository operations with narrow projections.
4. Add service behavior and one workflow.
5. Put multi-write atomicity in the workflow.
6. Cross the safe result boundary once in the handler.
7. Consume only the handler from routes/components.
8. Cover unauthorized access, cross-event isolation, state conflicts, and safe
   error results in tests.
