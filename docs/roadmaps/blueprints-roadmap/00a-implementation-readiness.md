# 00a — Engine Readiness and Delivery Plan

**Reviewed:** October 14, 2026. **Status:** assessment and recommendations only.
Web/server baseline: `f9f322c`; iOS baseline: `39a0df5`. Both checkouts were clean
at review start. No blueprint runtime implementation was found. This assessment
does not authorize code, migrations, deployment, or a general sync rewrite.

## Assessment

This is feasible as a bounded declarative engine on the existing event model,
not a new application framework. It is a multi-slice web/server and iOS feature,
not just a template picker. The portable envelope exists; executable module
validation, revision storage, expansion, reliable installation, and delivery of
new live configuration/instructions do not.

The largest uncertainty is the installation-to-native boundary, not the three
starter definitions. Prove that boundary before investing in the complete web
authoring experience. Keep the full first-iteration product scope in `00`;
the internal proving slice below is not a reduced release promise.

## Evidence and implementation implications

Paths are relative to the owning repository; native paths belong to
`../ios-apps/gatherory` from the web-app root.

| Evidence inspected                                                                                       | What can be reused                                                                                              | What still needs implementation                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/contracts/experience.contracts.ts`, `contracts/examples/`, Swift `Models/ExperienceContracts.swift` | Versioned envelope, generic module JSON, generated schemas and cross-platform fixture tests                     | Typed supported modules, semantic checks, limits and installability/capability negotiation; envelope acceptance alone is insufficient                                           |
| `src/db/schema/event.schema.ts`, `planning.schema.ts`, `sync.schema.ts`                                  | Main/direct-child model, participant records, one-main-event-per-workspace index, snapshots/entities/change log | Blueprint/revision/receipt/guide/configuration tables, immutable publication and scoped provenance                                                                              |
| `src/lib/org-permissions.ts`, `src/lib/auth.ts`                                                          | Organization membership and built-in administration checks                                                      | A blueprint resource is not registered: `OrgPermissions` currently derives only from Better Auth default statements; add a narrow fixed resource policy, not user-defined roles |
| `src/lib/permissions.ts`, `src/lib/event-authorization.middleware.ts`                                    | Separate event capabilities for hosts/collaborators/guests                                                      | Guide read/manage policy and destination-install checks; event role cannot substitute for private-template membership                                                           |
| `src/server/workspaces/services/workspace.service.live.ts`, `repos/workspace.repo.live.ts`               | Better Auth connector, personal workspace/team setup, ordinary main-event creation                              | Durable provisioning receipt and recovery without premature session switching; current create flow has compensation, not a blueprint installation state machine                 |
| `src/server/events/repos/event.repo.persistence.ts`, `src/db/index.ts`                                   | Effect/Drizzle and existing event invariants                                                                    | Transaction-aware creation operations; current creation repos open transactions themselves                                                                                      |
| `src/server/sync/repos/native-sync-legacy.persistence.ts`, `native-materializer.persistence.ts`          | Existing native wire mapping and incoming-sync behavior                                                         | Outgoing canonical-to-native installation projection in the same product transaction; current engines use the separate Promise-backed database client                           |
| Swift `Data/Persistence/WorkspaceArchiveV1.swift`, `WorkspaceArchiveV1+Sync.swift`                       | Explicit archive representation, entity projections and merge rules                                             | Live experience configuration/guide fields, defaults for old archives, entity handling and non-erasure rules                                                                    |
| Swift `WorkspaceRemoteMerger.swift`, `WorkspaceOutboxWriter.swift`, `WorkspaceMediaBookkeeper.swift`     | Save-free helpers with controller-owned commit boundaries                                                       | Extend the relevant mappings/tests, not a new persistence system or another copy of the workspace graph                                                                         |
| Swift `Features/Events/GuestInvitationStore.swift`; server bootstrap/pull                                | Guests already have an account-scoped read-only feed, separate from planner replication                         | Participant-visible guide projection/cache and revocation behavior; never grant planning-scope access just to deliver instructions                                              |
| Swift `Features/Workspaces/WorkspaceBrowserView.swift`, `App/WorkspaceLibrary.swift`                     | Local blank creation and normal workspace selection                                                             | Connected template setup, persisted pending installation intent, status recovery and import of server-issued IDs                                                                |

## Define the engine narrowly

Use a fixed, typed registry keyed by module type and version. Adding another
Wedding-like preset should be a content change. Adding a new executable module
type still requires server and supported-client implementation, tests, and
capability rollout. Arbitrary JSON is not an extension API for runtime code.

Separate four responsibilities:

1. **Parse and validate:** preserve the portable envelope; validate supported
   module shapes, reference integrity, bounds, categories and capability rules.
2. **Expand a plan:** a pure deterministic function of a validated revision,
   reviewed selections, confirmed schedules and explicit defaults. Return keyed
   event/idea/guide/configuration specifications, omissions and validation issues.
   No SQL, auth calls, random IDs, clock reads, Swift-specific enum shapes or UI.
3. **Install:** an Effect workflow authorizes, claims the receipt, provisions or
   claims the destination, then writes the independent records and ID manifest
   inside the product transaction. Preview and install share expansion logic;
   only install allocates persistent identity and writes data.
4. **Project and deliver:** a versioned adapter maps those records into native
   payloads. Native clients persist and edit the resulting event, not the source
   blueprint. A template is never re-evaluated on every launch or edit.

Keep three hashes distinct: immutable revision content; normalized installation
request (including exact revision, selections, schedules and destination intent);
and, if used, the reviewed expanded-plan representation. Define canonical JSON,
ordered versus unordered lists, omitted/default values, money and time encoding
before relying on hashes for idempotency. A server implementation/version change
must not silently alter an already claimed attempt's reviewed plan. Persist the
resolved plan or enough versioned inputs to reproduce it and its ID manifest.

Use ordinary domain services and pure workflows, production
`*.workflows.live.ts` bindings and `Layer.provide` composition. New Effect SQL
entry points should need only `PgClientLive` at the transport boundary. Keep
actor/scope explicit; do not introduce an ambient execution-context service.
See the [implementation guide](../../development/server-implementation-guide.md).

## Gates to resolve before full authoring UI

### 1. One real product transaction

`src/db/index.ts` exposes both Effect `DB`/`PgClientLive` and a legacy
node-postgres `db`. Providing `PgClientLive` to an Effect wrapper does **not** make
the Promise sync engine share that transaction. Calling push/materialization
after canonical creation would be a second write path with partial-failure risk.

Recommended approach: a narrow Effect-native installation writer plus a
transaction-aware projection writer on the same SQL connection. Use the existing
native payload shape as an adapter contract, not the incoming mutation handler
as a business API. Keep the legacy incoming engine unchanged unless a specific
shared mapping must be extracted. Prove rollback across canonical rows, native
snapshot/entities/scope membership/change log, and the completed receipt with
real disposable PostgreSQL tests. Broader Promise-to-Effect migration is not a
prerequisite and is not implicitly part of this roadmap.

Better Auth provisioning remains outside this transaction. An actor/request
receipt, exclusive recoverable claim, stable provisioning identity and ownership
verification must survive crashes before/after auth succeeds. A retry must not
create another organization. Never hold the SQL transaction across provider
calls or delete a reused/user-modified workspace as compensation.

### 2. Mixed-version native safety

There are three separate versions: blueprint envelope/module versions, native
sync payload versions, and local archive schema versions. A compatible blueprint
schema-v1 addition is not automatically a safe native wire/archive change.

Today Swift `SyncEntityType` accepts unknown strings, but `applyEntity` ignores
unknown types. `WorkspaceRemoteMerger` can still record their envelope IDs and
advance the cursor. Archive Codable fields also do not preserve arbitrary
unknown keys on re-encoding. Therefore neither successful decode nor unknown
entity tolerance proves support for required instructions/configuration.

Before emitting new content, define capability-aware delivery and mutation
handling for existing installed clients. The recommendation is to treat a missing
capability declaration as legacy, reject unsupported required-scope writes with
an upgrade-required outcome, and leave ordinary existing scopes working. Decide
the compatible read-only projection versus explicit scope rejection before
implementation; do not let an old client silently acknowledge required content
or overwrite it with a stripped snapshot. Test an actual legacy-shaped
bootstrap/pull/edit/retry sequence, including a subsequent upgraded bootstrap.

### 3. Guide visibility without planner access for guests

Current planner bootstrap selects main-event hosts/collaborators; pull access
rejects guests. Guest invitation content has its own feed and native cache.
Keep that separation. Deliver `planning_only` sections only through authorized
planner paths; deliver `event_participants` sections through an event-assignment
filtered guest DTO/cache as well as authorized planner paths. An invitation to a
child grants no automatic access to main/sibling guides. Tests must cover
revocation, account switches and removal of no-longer-visible cached sections.

### 4. Explicit authoring and destination ownership

Personal workspace provisioning currently selects active organization/team and
ensures settings. Do not call it from a supposedly read-only authoring-context
query. Use explicit eligible-owner listing and a separate provisioning action.
Installation must validate a requested destination or recover the attempt's
already claimed destination; active-session selection is not authority.

First-iteration policy remains fixed owner/admin authoring and member use of
published private templates. Extending the organization resource declaration is
required; a full dynamic/custom-RBAC product is not. Confirm how deleting an
event workspace affects its private templates before launching authoring. Keep
installed snapshots independent, as specified in `00`.

## Recommended delivery sequence and effort

October 15 sequencing addendum: [product experience and billing](05-product-experience-and-billing-sequence.md)
recommends validating the bounded curated native journey after the installation
proof and before paid Event Pass enablement. Full private-authoring UI may follow
billing; its acceptance criteria remain part of the complete blueprint iteration.
This is a product-risk recommendation, not an additional technical prerequisite.

Sizes are relative engineering/risk assessments, not elapsed-time estimates or
promises. Re-estimate after the transaction/compatibility proving slice.

| Work package                                                                              | Relative effort    | Exit evidence                                                                                                                               |
| ----------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Executable subset and pure planner (`01`, part of `03`)                                   | Medium             | New module fixtures validated in TS/Swift; deterministic review/expansion; unsupported required modules fail                                |
| Revision/catalog storage and fixed resource policy (`01`)                                 | Medium             | Additive constraints, safe seed replay, owner isolation, immutable publication                                                              |
| Internal one-starter install-to-native proving slice (`03`, model/transport part of `04`) | Large/highest risk | One connection/rollback proof, recoverable provisioning, canonical IDs imported and edited without duplication, old-client and guest safety |
| Private authoring and publishing (`02`)                                                   | Medium–large       | Real form/preview/publication through the proven planner; conflicts and source lifecycle tests                                              |
| Native picker/review/recovery and live guides (`04`)                                      | Large              | Account-bound pending intent survives restart, no local duplicate, offline post-install edits and second-device delivery                    |
| Release hardening (`03`/`04`)                                                             | Medium–large       | Crash/concurrency/mixed-version/privacy matrix, staged rollout evidence and operational recovery procedure                                  |

Keep `01`–`04` as ownership/acceptance documents, not a requirement to finish all
web UI before discovering delivery problems. Once contracts stabilize, web forms
and native presentation can be implemented independently, but share one planner
and DTO contract. Complete all three starters and private customization before
calling the first iteration shipped.

## Decisions still open, not silently approved

- Exact typed module fields, limits and canonical hash rules; `01` provides
  proposed bounds, not deployed contracts.
- Legacy-client policy and whether guide/configuration edits use the existing
  entity outbox or dedicated versioned endpoints. Recommendation: extend the
  existing entity path for planner offline edits; keep guest reads separate.
- Time-zone/DST implementation and explicit ambiguous/missing-time UX; resolve
  proposals into confirmed instants while retaining the user's zone. Do not
  add fixed 24-hour durations for calendar-day proposals.
- Receipt lease/retry timing, recovery ownership and operational cleanup policy.
  Store diagnostics without authored private content or access credentials.
- Deletion/retention behavior for workspace-owned private templates and creator
  attribution, using the existing account-deletion lifecycle as a constraint.

These do not prevent pure contract/planner work. Transaction, compatibility and
privacy choices block production installation, not merely final polish.

## Validation and handoff

This review changed documentation only. Source and Git inspection plus doc
formatting/local-link checks are the evidence; no test suites, builds, migrations,
seeds, network-provider calls or simulator actions were run. Prior native green
test counts validate the refactor, not an unimplemented blueprint engine.

During implementation use Vitest/`@effect/vitest` for the server, disposable DB
integration tests for real transaction guarantees, shared contract fixtures, and
native Swift Testing for archive/outbox/merge/transport/retry behavior. Extend
the current extracted helpers while preserving controller-owned saves, account
filters, no-echo behavior and media ordering. UI validation is a later authorized
implementation check, not part of this docs-only review.

**Next implementation slice:** finalize the typed module/plan DTOs and compatibility
test matrix, implement the `01` foundation, then prove the narrow `03` → native
delivery path before completing the authoring UI. No blueprint slice is complete
as a result of this assessment.
