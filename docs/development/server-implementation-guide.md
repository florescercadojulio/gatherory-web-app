# Server implementation guide

Use this guide when adding or changing server code. The
[server architecture](../architecture/server-architecture.md) owns the rules;
this guide shows where to start and which existing files to follow. Read the
[cross-project onboarding guide](ai-onboarding.md) first in a new chat, then
check the current source and Git diff rather than treating a past handoff as
current implementation evidence.

## Start with the use case, not a new abstraction

1. Identify the actor, target event/workspace, allowed operation, public result,
   and expected failures. Choose the authorization scope before writing queries.
2. Find the owning domain under `src/server/<domain>/`. Reuse its contracts and
   services; create folders and layers only when they have a responsibility.
3. Implement the injectable use case and its tests. Keep transport details,
   provider SDKs, and production configuration out of the workflow.
4. Bind its production dependency graph once, then connect the transport.
5. Verify behavior, dependency types, import boundaries, and any affected wire
   contracts. Update the owning documentation and roadmap with actual evidence.

Run the repository's installed Intent check before substantial changes as
required by `AGENTS.md`. If it is missing, report that; do not download a
replacement. Check installed Effect APIs before copying examples: at this
review, `effect`, `@effect/sql-pg`, and `@effect/vitest` are pinned to
`4.0.0-beta.102`. The project uses v4 conventions, not v3 service APIs.

## Choose the right entry point

| Caller or responsibility           | Use                                                                          | Do not use                                             |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| UI route/component                 | A server-function handler                                                    | A repository or production workflow                    |
| Server function or HTTP handler    | `workflows/*.workflows.live.ts`                                              | Repeated repo/service/connector provision              |
| A larger use case                  | Individual `*.workflow.ts` programs with one combined graph                  | Nested production workflow bindings                    |
| Unit/Effect test                   | Pure workflow, service tag, or service implementation with substituted ports | Production configuration or a real database by default |
| Better Auth hook or trusted script | An explicit `handlers/*.adapter.ts` runtime bridge                           | `Effect.runPromise` buried in domain logic             |
| External SDK integration           | A connector implementation                                                   | Provider calls inside a repository or workflow         |

Use `@/` for imports rooted in `src`, including dynamic imports in tests:

```ts
const { EventService } = await import('@/server/events/services/event.service')
```

Short relative imports within a domain are fine. Do not add a new alias per
folder or import a legacy compatibility barrel when a canonical module exists.
Keep `import type` dependencies type-only so contracts and service tags do not
initialize auth, storage, or database configuration.

The database adapter (`src/db/index.ts`) requires only an explicit `DATABASE_URL`
from the process environment. It must not import `src/env.ts` or load dotenv
files: database-only CI and maintenance tools do not require auth, media, or
notification credentials. Local CLI entry points should load their environment
before importing the adapter (for example, `pnpm db:materialize-native:local`).
The application environment still validates its full configuration. Import
regressions in `tests/tooling/database-cli-environment.test.ts` run in isolated
temporary directories so developer `.env.local` files cannot hide failures.

## Follow one use case through production

Participant invitation is a useful reference because it includes input
validation, middleware, domain authorization, persistence, and serialization:

1. [Handler](../../src/server/events/handlers/invite-event-participant.handler.ts)
   authenticates/authorizes, validates, supplies PostgreSQL, and serializes dates.
2. [Production binding](../../src/server/events/workflows/event.workflows.live.ts)
   provides the reusable domain graph.
3. [Pure workflow](../../src/server/events/workflows/invite-event-participant.workflow.ts)
   calls the injected service with explicit actor and operation inputs.
4. [Service implementation](../../src/server/events/services/event.service.live.ts)
   captures repository/authorization dependencies and enforces domain policy.
5. [Repository adapter](../../src/server/events/repos/event.repo.live.ts)
   captures the caller's `PgClient`; persistence owns the SQL.

The composition pattern is small and explicit. In
[`event.layers.live.ts`](../../src/server/events/event.layers.live.ts):

```ts
export const EventAccessLive = Layer.mergeAll(EventRepoLive, EventAuthorizationLive)
export const EventDomainLive = EventServiceLive.pipe(Layer.provide(EventAccessLive))
```

`Layer.mergeAll` combines available services; it does not wire one into another.
`Layer.provide` supplies a layer's construction dependencies. Service methods
should return effects without leaking those construction dependencies into
every call. The service implementation remains independently testable by
providing substitute repository and connector layers.

In the production workflow module, preserve the pure function's signature:

```ts
import { inviteEventParticipantWorkflow as program } from './invite-event-participant.workflow'

export const inviteEventParticipantWorkflow = (...args: Parameters<typeof program>) =>
  program(...args).pipe(Effect.provide(EventDomainLive))
```

At the transport boundary, only infrastructure remains:

```ts
runServerEffect(
  inviteEventParticipantWorkflow({ userId: context.user.id, invitation }).pipe(
    Effect.map((result) => ({ ...result, expiresAt: result.expiresAt.toISOString() })),
    Effect.provide(PgClientLive)
  )
)
```

These excerpts omit surrounding imports/validation; follow the complete handler
for an endpoint. Never put `PgClientLive` in a service graph or binding to make
its inferred requirements disappear. Do not introduce a generic dependency
injection framework, options bag, or extra alias layer for a single existing
connector. Keep unrelated initialization separate: the
[moderator-access binding](../../src/server/moderation/workflows/moderator-access.workflows.live.ts)
loads session infrastructure without making ordinary moderation bindings do so.

## Make authorization explicit

Use session middleware for identity, event middleware for event capabilities,
and organization middleware for organization administration. Hosts,
collaborators, and authenticated guests do not need organization membership
merely to participate in an event. Anonymous invitation previews use their
token-specific flow; they are not authenticated guest participants.

Declare required permissions in server code. Do not accept a caller's role,
actor ID, or permission statement as authority. Middleware does not replace
domain authorization: native APIs and other callers must remain protected.
For asset IDs, resolve and authorize the asset's actual event instead of
trusting an unrelated event ID in the input.

There is deliberately no ambient execution-context service. Pass the small
actor/scope input required by a use case; infrastructure belongs in Effect
layers. Revisit this decision only for a demonstrated need, not merely to
remove a few parameters. See the architecture's
[authorization rules](../architecture/server-architecture.md#workspace-ownership-and-event-authorization)
and [middleware behavior](../architecture/server-architecture.md#reusable-event-authorization).

## Preserve runtime and transaction boundaries

- Workflows return Effects; HTTP/server-function runners execute them once at
  the edge. Framework callbacks retain their Promise contract through adapters.
- New database work uses the existing Effect/Drizzle stack. Do not create a
  second PostgreSQL client inside an operation or lose ambient transaction state.
- Do not move transaction ownership during a folder or layer refactor. Preserve
  lock order, savepoints, receipt idempotency, write order, and rollback behavior.
- Preserve external side-effect ordering too: account-deletion object removal
  currently finishes before its SQL transaction, and auth email delivery retains
  its existing `waitUntil` behavior.
- Tagged failures, stable sync rejection codes, and safe response serialization
  are part of the contract. Do not classify failures by matching error messages.

Native sync/materialization and account-deletion persistence **still use Promise
transaction engines** behind Effect ports. Their migration was deferred; no
native-Effect persistence rewrite was performed. Do not add a dummy `PgClient`
requirement to those bindings or describe them as fully Effect-native. See the
[roadmap stopping point](../roadmaps/server-architecture-roadmap/README.md#current-stopping-point).
This is a documented exception, not the template for new persistence code.

## Test at the boundary you are changing

All tests use Vitest, not `node:test`. Vitest's Node environment and imports of
Node utilities such as `node:fs` are compatible with that rule. Use
`@effect/vitest` for Effect execution; prefer `it.effect`, `Effect.gen`, and
typed failure assertions rather than manually running the runtime in each test.

| Test location        | Responsibility and reference                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/`        | Pure rules and middleware behavior; [event middleware](../../tests/unit/event-authorization-middleware.test.ts)      |
| `tests/effect/`      | Real domain logic with substitute ports; [guest service](../../tests/effect/event-guest-service.test.ts)             |
| `tests/contracts/`   | Wire/schema and architecture/import checks; [architecture guards](../../tests/contracts/server-architecture.test.ts) |
| `tests/integration/` | Opt-in database, HTTP, and provider behavior                                                                         |
| `tests/tooling/`     | CLI/environment and tooling contracts                                                                                |

Some existing database tests live in `tests/effect/`; their resource opt-in is
what matters, not just the directory name. Use `it.live` when real clock behavior
is required. Isolate mutable fixtures per test; use shared layers only for safe
shared fixtures. Substitute services with `Layer.succeed`/`Layer.mock`, and test
service implementations with substitute repos/connectors. Module mocks are
appropriate for testing import safety and production composition, not a reason
to hardwire production dependencies into pure programs.

Check these complementary guarantees:

- [Pure imports](../../tests/contracts/server-domain-imports.test.ts) do not
  initialize configuration or providers.
- [Requirement types](../../tests/contracts/workflow-layer-requirements.test.ts)
  leave only the intended infrastructure unresolved.
- [Composition tests](../../tests/effect/workflow-layer-composition.test.ts)
  retain client identity, ambient context, scope cleanup, and authorization.
- Real-resource tests verify actual SQL rollback/locking and provider behavior;
  mocked composition tests cannot prove these properties.

For code changes, run relevant tests followed by `pnpm typecheck` and `pnpm test`
as appropriate. Type assertions need typechecking; `vitest run` alone does not
validate them. `pnpm test` includes contract schema freshness. `pnpm format`
formats `src/` and `tests/`; use targeted Prettier commands for docs. Do not run
a routine production build. Enable integration tests only after inspecting the
target environment and cleanup behavior; never silently use shared resources.

## Hand off evidence, not assumptions

State the changed behavior, source areas, checks actually run, skipped
integrations, and deliberate exceptions. Put durable rules in architecture
docs and task status in the roadmap. Do not turn a historical green test count
into a claim about the current checkout. When agents are requested, give them
disjoint file ownership and an agreed interface, then review their integration
and run shared checks before reporting completion.
