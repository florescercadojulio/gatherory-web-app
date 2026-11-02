# Shared budget sync

October 30, 2026. Source implementation only; no production rollout is authorized.
The native product rules, recovery flow and release limits are described in
[team budget safety](../../../ios-apps/gatherory/docs/team-budget-safety.md).

## Command boundary

Native `budget-atomic-v1` clients send a `budget_transfer` entity with
`entityID == scopeID == root event ID`, operation `update`, and a `replace_budget`
payload. Its fields are `expectedBudgetVersion`, `workspaceCapCents`, and
`allocations: [{ eventID, amountCents }]`. Optional money values are explicit JSON
nulls. The vector contains the root and every canonical child, including retained
archived children. Amounts use the existing two-decimal money contract; they do
not introduce currency conversion.

The budget entity's server version is independent of the workspace snapshot
version. This allows content and allocation edits in the same push. One command
validates and persists the complete vector, overall cap, canonical rows,
compatibility payloads, replication changes and mutation receipt in one root
transaction. Total allocation cannot exceed the cap; disabling the cap clears
allocations. A new workspace's initial budget also needs conservation validation.

Root host/Manage authority is required, plus authority on each changed child.
Unchanged child allocations do not require a new child permission check. Legacy
snapshot/event writes cannot bypass this boundary by directly changing a budget
field. Ordinary native updates omit those keys; canonical budget values are
preserved in both materialized rows and stored replication payloads.

Competing revisions return a conflict without applying any budget balance.
Retries retain the same mutation ID and payload and use the existing receipt.
The server returns the independent budget version and the resulting workspace
version on application. Clients without the capability receive an upgrade
response before reading an activated budget scope.

## Native recovery

Only one budget command per account/scope is delivered at a time. Ambiguous
transport retries keep their original identity. Conflicts retain the whole local
vector, block later budget commands and preserve ordinary edits. Pull supplies
the shared vector separately. Account's confirmed **Use shared budget** action
discards the complete local budget intent and restores shared balances while
keeping unrelated edits. It does not automatically rebase a conflicting vector
over another manager's changes.

An event-content create and its budget allocation remain separate remote
operations. A rejected allocation can leave an existing unfunded child while
its local budget intent awaits review; the protocol does not claim atomicity
for the whole Schedule workflow.

## Owning implementation and tests

- `src/server/sync/contracts/native-budget-mutation.contract.ts`: wire validation,
  precision and legacy-budget comparison.
- `src/server/sync/repos/native-budget.persistence.ts`: atomic replacement,
  authorization, canonical projections and budget revision.
- Native sync routes/workflows forward the capability. Legacy/scoped mutation
  handlers guard direct budget fields.
- `tests/unit/native-budget-mutation-contract.test.ts` and
  `tests/integration/native-budget-sync.database.test.ts` cover the boundary.
  Database tests require explicit opt-in and a loopback disposable database
  whose name begins `gatherory_budget_test`.

See native [testing verification](../../../ios-apps/gatherory/docs/testing-verification.md)
for the final executed checks and known acceptance limits. No shared database
reset, production change or TestFlight upload is part of this implementation.

## Native interoperability follow-up — November 2, 2026

Decimal.js calculations and PostgreSQL amounts retain decimal strings internally.
At the native archive/entity boundary, money fields are JSON **numbers** in
major units: `workspaceBudgetCap: 1000`, `mainEventBudgetCap: 800`, child
`budgetCap: 100`, and expense `amount: 250.01`. Cleared optional fields are
explicit JSON nulls. This matches Foundation Decimal Codable; numeric strings
are not the native wire format. Budget command fields remain integer cents and
are not reinterpreted as major units.

Paid-expense projection translates the database category `food_and_drink` into
native `foodAndDrink`. Archive reconciliation takes canonical event/source-idea
ownership, while mutation writes still permit an authorized rehome. A scoped
snapshot removes a paid expense moved out of that child, including when the
child has no remaining paid expenses.

Same-push processing now orders ordinary writes, non-workspace deletes in reverse
dependency order, the budget vector, and finally root workspace deletion. This
allows a paid expense to move before its child is deleted and makes the vector
validate against the post-deletion event set. Budget replacement also removes
canonically deleted children from the compatibility timeline. Individual mutation
transactions and budget revision/conflict handling retain their existing scope;
the entire push is not a new atomic transaction.

Verification uses focused numeric/category/null regressions, all 120 input
permutations of a representative dependency batch, and the native budget
database suite against a new disposable local PostgreSQL 18 container. The
eight database tests pass, including concurrent revision conflicts, authorization,
paid-record protection, numeric archive/event/pull projections, and the combined
rehome/delete/reallocate case. Shared or production databases were not used.
See [money arithmetic](money-arithmetic.md) for the full source map and final
typecheck/contract/test results; native codec results belong in the linked native
verification record. No server schema migration or deployment is introduced.
