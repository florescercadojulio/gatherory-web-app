# Discovery freshness evaluation CI follow-up — October 23, 2026

The production GitHub workflow initially failed in
`tests/unit/blueprint-discovery-freshness-evaluation.test.ts`. Its first test
evaluates 120 synthetic Blueprints across five visits and exceeded Vitest's
5-second per-test timeout. The evaluation was doing the same complete baseline
cursor traversal once per visit even though the baseline uses a fixed clock and
has no visit history.

The evaluation helper now computes that invariant baseline traversal once and
continues to recalculate the candidate traversal and cumulative baseline metrics
for every visit. A local benchmark of `evaluateRepeatedVisits(120, 5)` changed
from 5,366.5 ms to 3,592.9 ms (about 33% faster). This is a local fixture-helper
timing comparison, not a production ranking performance claim. The test's
timeout budget increased from 5 seconds to 20 seconds; the 5-second global
limit remains unchanged. The full fixture, cursor traversal,
duplicate/stability/privacy checks and checked-in artifact are unchanged. No
new retries, skips or coverage reductions were added (58 existing integration
gates remain environment-skipped), and production ranking behavior did not
change.

The workflow correctly stopped before database migrations when tests failed.
Its required order remains tests, `db:migrate`, then `db:materialize-native`;
workflow source was not changed. The fix is in commit
`39b4cce20864a44952242aa9cfc3c199be4a90da`.

The full local `pnpm test` run passed 827 tests with 58 environment-gated skips
across 121 passing and 37 skipped files. Typecheck, artifact `--check`, format
and diff checks passed. The corrected production workflow was started at the
fixed commit SHA:
[GitHub Actions run 40003240314](https://github.com/florescercadojulio/gatherory-web-app/actions/runs/40003240314).

The production workflow completed successfully at that SHA. Its test step passed
827 tests (58 environment-gated skips) across 121 files (37 skipped); the
migration step then passed, followed by native sync materialization.
The focused first evaluation test took 5,510 ms on GitHub, so
it still exceeds the former 5-second per-test budget after the optimization; the
bounded 20-second per-test allowance is needed for the complete CI fixture.
The workflow did not require a reset or a manual migration.
