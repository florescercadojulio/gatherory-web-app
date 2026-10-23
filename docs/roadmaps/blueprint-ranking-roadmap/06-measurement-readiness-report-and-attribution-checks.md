# Measurement readiness report and attribution checks

**Current follow-through:** [07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md)
implements accepted signal order, exact prior-impression links, daily serving
diagnostics and promotion-only baseline v2. The operational report descriptions below reflect v2;
the original verification record remains historical. 07 owns the new schema,
migration and policy details.
Own-account Like affinity is subsequently implemented in [08](08-personal-like-ranking.md);
bookmarks and measured installs still do not affect ranking.

**Status:** Implemented and verified locally, October 22, 2026.
This slice implements the next report/checks proposed in
[05 — Baseline evaluation and signal readiness](05-baseline-evaluation-and-signal-readiness.md).
It adds an internal operational report and cross-runtime attribution checks.
Ranking, functional likes/bookmarks/hiding and measurement consent are unchanged.
The original slice added no collection or migration. Slice 07 adds measurement
fields/diagnostics and a targeted migration; there is still no public report
endpoint, scheduler or deployment.

## Running the report

From the web-app root, the default command evaluates deterministic synthetic
rows and needs no database or application credentials:

```sh
pnpm exec tsx scripts/report-blueprint-measurement-readiness.ts
```

Output is aggregate JSON labeled `dataOrigin: synthetic_fixture`, with report
version `blueprint-measurement-readiness-v2`. Fixture counts demonstrate the
report's behavior; they are not evidence of product usage or recommendation
performance. No report file is automatically written.

To inspect an explicitly selected local database, provide its `DATABASE_URL`
through the process environment and request database mode with a complete window:

```sh
pnpm exec tsx scripts/report-blueprint-measurement-readiness.ts --database \
  --cohort-start=2026-10-10T00:00:00.000Z \
  --cohort-end=2026-10-11T00:00:00.000Z \
  --as-of=2026-10-22T00:00:00.000Z
```

These dates are illustrative and must satisfy the bounds at execution time.
Database mode accepts loopback PostgreSQL URLs only. There is no remote override
in this slice. It does not load dotenv files, choose a shared environment, or
require auth/media/analytics credentials. Fixture mode imports no database graph.
Database errors are reported with safe messages rather than connection details,
SQL parameters or source/account data.

## Scope and time boundaries

- The cohort is `[cohortStart, cohortEnd)` by exposure `issuedAt`. The outcome
  window is `[issuedAt, issuedAt + 7 days)`. An outcome exactly seven days after
  issuance is late, not in the seven-day numerator.
- The analytic `asOf` cutoff must be at least eight days after `cohortEnd`:
  seven days for every member's outcome plus 24 hours of ingestion lag.
- `readAt` captures the current read boundary separately. It must be no earlier
  than `asOf` and must precede `cohortStart + 30 days`. A historically valid
  `asOf` cannot recover an already-expired cohort. Database mode rejects future
  cutoffs and logically expired history even if cleanup has not deleted it.
- Reads use one repeatable-read, read-only transaction. Current consent, account
  eligibility and current public-source status are evaluated in that snapshot.
  This is a report over currently retained data with an analytic cutoff, not a
  reconstruction of consent, population or visibility at a past date.
- Each of six source projections is capped at 20,000 rows, fetching one extra
  to detect overflow. Overflow fails the report; it never silently samples or
  truncates the denominator. Narrow the cohort only when that still leaves the
  required retained history available; a larger catalog needs a reviewed bounded
  aggregation design rather than a hidden partial result.
- Continuation exposure chains support later acquisition/install checks without
  enlarging the cohort denominator. Retained prior credit is used only while
  its original exposure chain is still within retention. Older lost history
  remains unknown.

No longer-lived measurement dataset is created. The report contains no actor,
exposure, installation or acquisition identifiers, source keys/hashes/titles,
private content, raw query, cursor or snapshot IDs. It emits coarse policy,
surface and position-band aggregates rather than per-source rows. Private
preference tables and their mutation ledger are never read. Re-run after
withdrawal/deletion to reflect the current snapshot; do not turn terminal output
into an enduring account-linked export or publish small-cell operational reports.

## Reading the results

| Section                                            | Meaning                                                                                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `window`, `dataOrigin`, `reportVersion`            | Exact cutoff/read times, fixed cohort definition and synthetic versus database origin                                                                           |
| `policyDigest`, `policyDigestCounts`, `breakdowns` | Policy mode, algorithm/configuration versions and digest, surface and position bands 1–10, 11–20, 21+; unknown legacy context stays unknown                     |
| `counts`                                           | Eligible served contexts, separately credited impressions/opens, raw opens including false daily credit, and invalid/out-of-window signal diagnostics           |
| `population`                                       | Distinct eligible actors and exposures with valid source revision/hash fields; these source-field counts are not distinct Blueprint counts                      |
| `exactSourceStatusCounts`                          | Exposure counts whose exact served revision is currently public, subsequently withdrawn, or missing; withdrawal does not silently drop historical opportunities |
| `openPairing`                                      | Exact prior accepted impression links, invalid/non-prior references, unmatched opens and timestamp regressions                                                  |
| `adoption`                                         | Unique recorded-open opportunities, prior-credit exclusions, duplicate/tied opportunities, chain integrity and seven-day versus later qualified adoption        |
| `servingDiagnostics`                               | Recorded opt-in page-item attempts, token reuse, quota denials and source ineligibility for full past UTC days; partial-day counts unavailable                  |
| `coverage`, `readinessReasons`, `limitations`      | Missing denominators and methodological limits; `readinessForRankingWeights` remains false                                                                      |

Served contexts are not views. Daily credited impressions and opens can refer to
different exposures; the report never divides those totals into CTR. A raw
`rankEligible=false` open is still useful exact-exposure attribution evidence.
`signal.createdAt` remains PostgreSQL transaction-start metadata. Report v2 uses
`acceptedSequence` and saved exact prior-impression links, with `acceptedAt`
captured after the account lock and eligibility checks. Clock regressions are
diagnosed without reversing sequence order. `provesClientEventOrder` stays false;
server acceptance cannot establish client event order or attention.

Eligible catalog sessions, supported client versions and opt-in denominator
remain `unknown`: accepted rows cannot reconstruct them. Daily diagnostics measure
quota denials among successfully recorded opt-in page-item attempts, including
retries/reuse. They do not prove complete client traffic or failed-write coverage.
Full UTC-day cohorts receive counts; partial-day cohorts receive nullable counts
and `unavailable_partial_day`, rather than inferred zeros. Missing
signals are not inferred rejection reasons or negative feedback. Source metadata
presence does not prove that native setup can round-trip its content.

## Conditional adoption diagnostic

The denominator is one selected first recorded organic open per actor/source
among cohort exposures, ordered by the unique server acceptance sequence.
Pairing and daily ranking credit do not restrict this raw-open denominator.
Malformed or duplicate sequence evidence is excluded and diagnosed.
The selected exposure's `issuedAt` is the outcome anchor. Retained qualification
before that anchor excludes an already-credited actor/source; repeated opens
cannot add opportunities.

A numerator requires a consistent actor/source/revision/hash chain through an
opened, active exposure, acquisition, immutable copy revision and completed
installation. The private copy's hash normally differs from its public source
because its identity and cover references change. Validate its stored hash and
installation binding separately; do not require those two hashes to be equal.

An outcome from another exposure may count only for the same actor/source and
exact served revision/hash within the selected anchor's seven-day window. Such
outcomes have a separate counter from same-exposure outcomes. Revision changes,
outcomes preceding the selected open, late outcomes and malformed chains are
reported separately, rather than silently transferring credit to a different
publication or surface. No per-surface adoption rate is inferred from them.

This measures verified unchanged-copy adoption among retained recorded-open
opportunities. It is neither overall discovery conversion nor satisfaction,
causal ranking lift or a validated planning-cycle metric. Opt-in selection,
deletion/opt-out attrition, strict-copy exclusions and expired older credit history
limit interpretation. It cannot measure every useful installation.

## Copy/install checks

The cross-runtime bridge captures the actual iOS
`BlueprintDraftContent.snapshot(of:)` result consumed by
`BlueprintSavedCopyResolver`. Server tests validate that captured JSON with the
real draft schema, `draftDefinition` and `blueprintHash`, comparing against current
public fixtures. A TypeScript approximation of native conversion is not used.

The fixture covers all 17 curated repository starters and deterministic authored
single-event/multiple-event capability examples, including child targets, ideas,
instructions, to-dos and main/child/idea cover references. Native assertions guard
the bridge's snapshot behavior, and server checks detect fixture/publication drift.
All 17 curated source snapshots reproduce their source hashes and pass database
copy/acquisition checks. Both authored definitions also reproduce their definition
hashes; their fixture-only metadata hash is an explicit zero sentinel, not a
claimed publication hash. The database matrix constructs real immutable source
hashes before use. Representative single/multiple-event authored installs exercise
children, ideas, instructions and to-dos; their general module fixture removes
synthetic cover IDs because that harness has no corresponding asset rows.

A separate exact full native Wedding snapshot runs through the existing real
cover-backed database harness with fixture image bytes/storage. It verifies
cover import/cloning, the changed private copy hash, acquisition and completed
qualified adoption together, with an exact-exposure non-ranking open. Media
validation remains active. These are representative install checks, not a full
install of every curated starter or provider/production storage acceptance.

The captured JSON is mirrored in the native test bundle so iOS tests do not
depend on a sibling checkout at runtime. When intentionally updating it,
regenerate from the real Swift snapshot implementation and its deterministic
authored cases, update both copies and run native/server freshness checks.
Do not hand-author a replacement native serialization or accept changed hashes
without checking the source/publication change.

Unchanged source input is checked before server-owned cover cloning. A valid
original copy plus later local install customizations is distinct from editing
the saved Blueprint before installation: qualification binds the immutable private
copy revision/hash, while setup choices continue to follow the install contract.
Forged source markers, bearer/private-only acquisition, invalid/expired exposure,
self-source, missing consent, edited/unavailable source chains and incomplete
installation receive no new credit. They do not remove ordinary authorized copy
or installation capabilities. Retry remains idempotent.

## Owning code and continuation

- [Report contract](../../../src/server/blueprints/contracts/blueprint-measurement-readiness.contracts.ts)
  and [pure builder](../../../src/server/blueprints/services/blueprint-measurement-readiness.ts)
  own definitions and diagnostics; no production configuration is imported.
- [Repository port](../../../src/server/blueprints/repos/blueprint-measurement-readiness.repo.ts),
  [PostgreSQL implementation](../../../src/server/blueprints/repos/blueprint-measurement-readiness.repo.live.ts)
  and [explicit CLI bridge](../../../src/server/blueprints/handlers/blueprint-measurement-readiness.adapter.ts)
  own bounded, consistent authorized reads through existing Effect/Drizzle.
- [CLI](../../../scripts/report-blueprint-measurement-readiness.ts),
  [synthetic rows](../../../tests/fixtures/blueprint-measurement-readiness.ts) and
  [native snapshot bridge](../../../tests/fixtures/blueprint-native-copy-snapshots.v1.json)
  support repeatable local checks. The native fixture contains test content only.

[07](07-measurement-cleanup-and-new-item-opportunities.md) implements measurement
cleanup and the promotion-only new-item rule. Next build/evaluate a bounded
own-account explicit-Like candidate, while verifying operational collection,
maintenance and actual coverage before pooled features. The current CLI
remains loopback-only; shared-environment operational integration is not created
by this slice. The v2 acceptance/diagnostic contract is recorded in 07.
Own-account Like affinity remains the first proposed preference candidate;
it is not implemented here.
Pooled bookmarks/adoption weights, aggregation infrastructure and account-randomized
experiments retain the evidence, purpose and lifecycle gates from 05.

## Verification and handoff

Three Luna agents implemented the pure report, database/CLI boundary and
cross-runtime attribution checks. Parent review integrated the work, corrected
the token-expiry/retention distinction, copy/source hash assumptions and cohort
anchor/proof checks, then ran final verification:

- `pnpm typecheck`: passed. Log:
  `/tmp/gatherory-measurement-readiness-typecheck-verified.log`.
- `pnpm test`, including contract freshness: **737 passed, 53 skipped**, with
  116 files passed and 35 skipped. This includes 13 report-rule tests, five CLI
  tests and the native-to-server snapshot check. Log:
  `/tmp/gatherory-measurement-readiness-web-verified.log`.
- **Seven PostgreSQL tests passed in five suites:** three report tests plus
  copy/install attribution, cover copy/install, existing discovery actions and
  ranked paging/metadata regression. The report tests cover realistic 30-minute
  tokens in mature retained cohorts, source withdrawal, malformed/prior credit,
  current consent, deletion, no report mutation and row-cap failure. The install
  tests include a forced completion rollback, retries, source unlisting, edited
  copies, expiry, opt-out and cover-backed qualification. Log:
  `/tmp/gatherory-measurement-readiness-db-verified.log`.
- Existing migrations applied to a fresh disposable PostgreSQL 18 container
  bound to loopback, using an explicit temporary configuration. No shared URL
  or dotenv file was used. The actual CLI database mode then returned an empty
  aggregate report from that cleaned fixture database and exited successfully;
  its coverage stayed unknown and weight readiness false. This is operational
  smoke evidence, not usage data. The task-created container was removed.
- Native simulator build and **40 tests across four suites passed** (55 runs
  including dynamic parameters): saved-copy resolver/bridge, installation import,
  actions and transport. Xcode 27.1, iPhone 18 Pro / iOS 27.0, with
  `POSTHOG_ENABLED=NO`. Log:
  `/tmp/gatherory-measurement-readiness-native-verified.log`; result:
  `/tmp/gatherory-measurement-readiness-native-verified.xcresult`.
- Existing ranking artifact `--check` passed unchanged. Targeted Prettier,
  local document paths/anchors, matching native fixture copies and both
  repositories' `git diff --check` passed. Existing dirty work was preserved.

No production dataset, physical-device acceptance, randomized outcome or
recommendation uplift is claimed. No serving, schema, dependency, consent or
collection behavior changed; all database writes were isolated test setup and
cleanup. The report deliberately leaves live coverage and engagement-weight
readiness unresolved.
