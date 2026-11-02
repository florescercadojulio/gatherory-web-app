# Server architecture alignment — November 2, 2026

This follow-up brings newer MCP and Blueprint paths under the existing
[server architecture](../architecture/server-architecture.md). Public routes,
permission checks, monetary units, and existing transaction/replay boundaries
remain compatible. There are no schema changes or deployment steps.

## Implementation map

| Area                                 | Result                                                                                                                                                                           | Canonical entry points                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| MCP connection settings              | The API route delegates to a handler; Zod contracts, cookie-only session lookup, scope rules, and atomic consent/refresh-token writes use separate injected boundaries.          | `src/server/mcp/connection.handler.ts`, `connection.workflow.ts`, `connection.workflows.live.ts`                              |
| MCP authorization and tools          | SQL lookup uses an injected repository; explicit Promise adapters bridge the MCP SDK to composed Effect programs. Workflow bindings leave PostgreSQL unresolved.                 | `src/server/mcp/authorization.workflow.ts`, `authorization.promise.adapter.live.ts`, `content/native-sync.promise.adapter.ts` |
| Blueprint media                      | Storage, image normalization, and source downloads use pure connector ports. SQL, domain policy, workflows, and the HTTP handler are separate.                                   | `src/server/blueprint-media/{connectors,repos,services,workflows,handlers}/`, `blueprint-media.layers.live.ts`                |
| Blueprint creation                   | The workflow owns capture, review/idempotency policy, publication, listing, and one transaction port. The repository writes only request fingerprint and listing metadata.       | `src/server/blueprints/workflows/blueprint-native-creation.workflow.ts`, `blueprint-native-creation-transaction.ts`           |
| Blueprint catalog/discovery          | Business orchestration is injectable and separate from production graph bindings. Public serialization strips internal creator/ranking metadata.                                 | `src/server/blueprints/workflows/blueprint-catalog.workflow.ts`, `blueprint-discovery-actions.workflow.ts`                    |
| Existing Blueprint atomic operations | Workflow-supplied, lazy cover callbacks replace repository dependencies on a domain service. Replay and SQL/asset ordering stay at the existing atomic boundary.                 | `src/server/blueprints/repos/blueprint-cover-callbacks.ts`, `workflows/blueprint-cover-callbacks.workflow.ts`                 |
| Waitlist                             | The live HTTP adapter consumes production workflow bindings instead of assembling its repository graph.                                                                          | `src/server/waitlist/workflows/waitlist.workflows.live.ts`                                                                    |
| Attribution and diagnostics          | The attribution cleanup port imports without a database. Measurement row limits use typed failures rather than error-message matching; unexpected SQL diagnostics stay scrubbed. | `src/server/blueprints/repos/blueprint-attribution.repo.ts`, `blueprint-measurement-readiness.errors.ts`                      |

## Preserved boundaries

- MCP keeps its disabled behavior, exact origin checks, cookie-only uncached
  session lookup, user-scoped grants, scope reduction, and fresh-consent rule for
  expansion. Empty/oversized connection inputs now fail the explicit contract.
- Native monetary projections remain JSON numbers in major units, while budget
  commands remain integer cents plus explicit nulls. Decimal.js arithmetic and
  database decimal strings are unaffected.
- Native sync/materialization and account-deletion transaction engines were not
  rewritten. Event departure/lifecycle implementation files and the retained
  Promise media provider were moved to accurate implementation filenames with
  export-only compatibility paths. Formatting-normalized source comparison
  confirms their implementation bodies are unchanged.
- Blueprint asset callbacks are trusted runtime arguments, never JSON input.
  Building them performs no I/O. The persistence engine supplies its existing
  database handle when it invokes a callback. Cover paths fail closed when the
  callbacks are missing.
- Cover cloning retains source authorization, immutable IDs/keys, byte/checksum
  validation, processing-token fencing, and exact-request replay behavior.
  Database tests exercise real service/repository/image code with offline
  storage and locally reconstructed, checksum-verified image variants.
- New use cases should own their orchestration and transactions in workflows.
  The retained Blueprint callbacks preserve existing atomic engines; they are
  not permission to introduce repository-to-service imports.

## Regression guard coverage

`tests/contracts/server-architecture.test.ts` discovers all server domains,
including new domains added later. It checks `.functions.ts` handlers, API
routes, UI imports, pure workflows, services, repositories, and live bindings.
Repository-to-domain-service dependencies and business programs inside live
workflow bindings are rejected.

`tests/contracts/server-domain-imports.test.ts` imports contracts, ports,
services, and pure workflows with database, auth, environment, image processing,
and storage SDK implementations disabled. Historical facade exceptions are
explicitly registered in `tests/helpers/server-architecture.ts`; the source
guard requires them to remain export-only. A new port cannot silently inherit
that exemption.

`tests/contracts/workflow-layer-requirements.test.ts` checks every production
binding's inferred Effect requirements. Its file inventory fails when a new
binding is missing a type assertion. The normal typecheck is therefore required
alongside Vitest.

Focused behavior tests cover consent/authorization denials, safe failures,
cover permissions and state recovery, transaction client identity and rollback,
catalog cursor errors and public metadata, and measurement limits.

## Acceptance environment

Final local results on November 2, 2026:

- `pnpm typecheck`: passed, including requirement assertions for all 30
  production workflow binding modules.
- `pnpm test`: 999 tests passed, 74 opt-in tests skipped; 165 files passed and
  46 skipped. Generated contract freshness is included.
- Disposable PostgreSQL acceptance: all 39 tests across 24 files passed.
  This includes publication rollback, failed/missing cover callback behavior,
  checksum rejection, no-download replay, consent rows, budgets, lifecycle,
  invitations, and child-scope mutation/receipt isolation.
- Changed server/test source formatting checks and `git diff --check`: passed.

The scoped receipt regression separately proves authorization-first denial for
an account without root access, then mutation-ID scope binding after an explicit
root grant. It does not change production authorization or receipt ordering.

Run `pnpm typecheck` and `pnpm test` for local acceptance. The latter includes
generated contract freshness. Opt-in database acceptance uses a new disposable
PostgreSQL 18 container bound only to loopback, initialized from checked-in
migrations. Tests cover Blueprint authoring/copy/publication/install rollback,
offline cover copying/checksum failures/replay, MCP content and OAuth rows,
native budgets, invitations/lifecycle, and child-scoped sync isolation.

Live R2, email, OAuth-provider, and device delivery are separate acceptance
checks. No production build, deployment, shared-database mutation, or live
provider write is part of this refactor.
