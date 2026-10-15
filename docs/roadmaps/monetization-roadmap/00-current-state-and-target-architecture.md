# 00 — Current state and target architecture

**Status:** Planned. Source review: October 15, 2026.

## Current implementation and gaps

| Area inspected                                                    | Reusable boundary                                                                      | Missing monetization behavior                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/server/events/`, `src/lib/event-authorization.middleware.ts` | Per-event host/collaborator/guest access and invitation operations                     | Operation-specific commercial coverage, separate from roles                              |
| `src/server/workspaces/`                                          | Ownership/provisioning and main-event scope                                            | Purchase sponsor/root binding and lifecycle policy                                       |
| `src/server/sync/`                                                | Existing atomic ingestion, receipts, projections and account-scoped delivery           | Recoverable paid-operation outcomes, legacy client behavior and safe enforcement rollout |
| `src/server/media/`                                               | Authorized media access and transfers                                                  | Explicit free/paid allowances and retention policy                                       |
| iOS `Gatherory/OfflineSync/`, `Data/Persistence/`                 | Durable local mutations, outbox, remote merge, account isolation and media bookkeeping | Cached entitlement projection, billing hold recovery and purchase reconciliation         |
| iOS `Gatherory/App/GatheroryLaunchExperience.swift`               | Existing authentication/onboarding routing                                             | No promise of anonymous personal planning; that is a separate product choice             |
| Portable experience contracts and blueprint roadmap               | Generic template envelopes and planned installation identity                           | No executable blueprint engine or billing linkage                                        |

No server billing/entitlement domain or native StoreKit flow was found in the
reviewed source. Source inspection is not verification of deployed behavior.
No payment provider or schema was changed for this assessment.

## Target responsibility split

- Product policy owns what Free and Event Pass include, duration and retention.
- A billing domain verifies provider evidence, records purchase/revocation
  history and binds grants to a permitted canonical root. Proposed home:
  `src/server/billing/{contracts,handlers,workflows,services,repos,connectors}/`.
- A provider-independent entitlement service resolves operation/capability,
  actor, event scope and server time. It returns only authorized coverage data.
- Existing event authorization still decides who can perform the action.
- Native purchase/setup state owns pending purchase recovery and user feedback;
  it is not an alternative event store or sync engine.
- Native account-scoped cached coverage supports offline presentation. Server
  policy governs connected paid actions; stale cache is not proof of purchase.

Use production Layer composition so new SQL workflows are provided `PgClientLive`
at the edge. Provider calls are outside database transactions. Receipt/grant
and event binding writes need one caller-owned transaction and durable recovery.
Do not assume an Effect wrapper joins the existing Promise sync transaction.

## Separate identities and operations

Record provider transaction identity, canonical application account identity,
and canonical main-event identity separately. Store environment, product/policy
version, verification status, service period and audit provenance. Exact table
names and DTOs are implementation decisions, not existing schema contracts.

Idempotency must prevent one verified transaction from funding two roots while
allowing safe replay/restore for the same binding. Invalid or reordered provider
notifications cannot create or resurrect coverage. Concurrent grants, refunds
and later annual coverage must resolve without removing unrelated valid grants.

Never determine root coverage from an untrusted client parent ID. Child-only
native scopes intentionally look like roots locally; the server resolves their
canonical parent privately. Return coverage for that authorized child only.

Classify free RSVP/invitation operations, personal edits, paid collaborative
edits and media operations explicitly. A blanket gate on bootstrap, pull or
push would break free functionality and pending sync. At the actual write
boundary, recheck access and applicable coverage under the correct transaction;
middleware or a cached UI flag alone is insufficient.

## Non-goals

No subscriptions at launch, professional billing, team-seat charges, paid
blueprint marketplace, payouts, tax engine, general permission builder or
rewrite of incoming sync. Do not automatically monetize existing shared events
before a migration/grandfathering policy is approved.
