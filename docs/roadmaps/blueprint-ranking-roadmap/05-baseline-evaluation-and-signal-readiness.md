# Baseline evaluation and signal readiness

**Current follow-through:** [07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md)
implements accepted signal order, exact prior-impression links, daily serving
diagnostics and promotion-only baseline v2. Policy/chronology descriptions and
verification below record this earlier slice; 07 owns the current changes.
Own-account Like affinity is subsequently implemented in [08](08-personal-like-ranking.md);
bookmarks and measured installs still do not affect ranking.

**Status:** Offline evaluation and source audit completed October 22, 2026.
Three Luna agents covered reproducible evaluation, signal readiness and experiment
gates; parent review corrected metrics and integrated the findings. Serving order,
collection, schemas and native behavior are unchanged. Production data, coverage
and deployment status were not inspected. No outcome uplift is established.

**Decision:** Keep the deterministic baseline as the control. Build measurement
and cohort readiness before pooled engagement features. Separately, resolve the
new-item reservation tradeoff below before treating the current opportunity rule
as settled. Likes, bookmarks and installs have **no ranking weight today**.

**Implementation follow-through:**
[06 — Measurement readiness report and attribution checks](06-measurement-readiness-report-and-attribution-checks.md)
now implements the internal read-only report and native copy/install checks
locally. This document preserves the evaluation findings and future feature gates;
06 owns the exact current time bounds, command and verification evidence.

## Reproducible offline evidence

Run from the web-app root with installed dependencies; neither command connects
to a database or reads production telemetry:

```sh
pnpm exec tsx scripts/evaluate-blueprint-ranking.ts
pnpm exec tsx scripts/evaluate-blueprint-ranking.ts --check
```

The first command replaces the checked-in
[JSON artifact](artifacts/baseline-evaluation.json); the second detects drift.
It evaluates the actual 17 curated repository starters and seven deliberately
constructed authored scenarios at `2026-10-22T12:00:00.000Z`. The scenario version
is a fixture identifier, not a random sample or observed creator population.
Controls use identical candidates, snapshot time and relevance: relevance/key
order and editorial-only order. Actual search/category calls use repository
matching through `pageBlueprintCatalog`, rather than fabricated query scores.

| Check                               | Observed result                                                                                                      | Interpretation                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Curated browse                      | All 17 retained, no duplicates or relevance inversions; baseline equals editorial-only                               | This fixture has no authored creators/publication ages, so cannot exercise diversity or freshness |
| Curated searches/category           | `outdoors`: 2 results; `wedding`: 1; `picnic`: 1; `weddings` category: 1; baseline/control orders identical          | Real matching is preserved in these small fixtures; this is not search usefulness evaluation      |
| Browse traversal                    | Page sizes 1, 2, 3, 7 and 20 all return the same complete order, 17/17                                               | Stable complete traversal for this fixed corpus                                                   |
| Repeated-creator scenario           | Top 10 creator split 7/3 versus control 10/0; largest share 70% versus 100%; concentration HHI .58 versus 1          | Diversity affects exposure opportunity, while inventory concentration remains unchanged           |
| Sparse creator inventory            | Seven items from one creator are all retained; run reaches seven                                                     | The run cap relaxes to fill results; it is not a hard global limit                                |
| Nine relevance groups of sizes 1–9  | Nine reserved items out of 45: 20%                                                                                   | `ceil(group size × 10%)` can exceed 10% across small groups                                       |
| New-item comparison                 | Baseline top 10 has 20% recent authored items versus 40% in both controls; reserved slots at ranks 10, 20 and 24     | Reserving items for later slots can demote items already near the front                           |
| Relevance barriers and day rotation | No weaker group promoted; cap resets at group boundaries; next-day reserved selection changes in the 60-item fixture | Determinism is snapshot/day scoped; no guarantee of equal creator opportunity over time           |

Baseline curated browse top 10: Wedding, Birthday, Thanksgiving, Anniversary
Supper, Engagement Gathering, Family Cottage Escape, Family Reunion Weekend,
Friends Celebration Weekend, Graduation Open House and Neighborhood Gathering
(exact keys in the artifact). These are fixture results, not deployed inventory.

Metrics distinguish full candidate coverage from unique known keys within the
first 10/20 positions. They count duplicate/unknown keys and relevance inversions.
Creator concentration is reported both for the input inventory and for authored
positions within each prefix; curated slots are excluded from that concentration
denominator and authored slot share is reported separately. HHI is the sum of
squared creator shares. The artifact omits internal creator identities.
“Truly new” metric names mean the policy's metadata-based recent-authored proxy:
earliest revision is not necessarily first public listing. These metrics measure
ordering properties, not relevance judgments, satisfaction, fairness or lift.

**Opportunity decision to make next:** specify whether the goal is a minimum
chance for eligible recent items or fixed reserved positions. Compare a proposed
promotion-only alternative that credits recent items already high in the order,
within identical relevance groups, against the current control. Require explicit
rounding/small-group behavior, diversity interaction and full traversal tests.
Do not silently change `baseline_v1` or claim this synthetic demotion proves
real-world harm. A changed policy needs its own version and cursor invalidation.

## What the available signals mean

| Signal/store       | Current source behavior                                                                                      | Before ranking use                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Likes              | Private current desired state, with source revision/hash while enabled; functional even with measurement off | Separate own-account affinity from community endorsement; define revision transfer and unlike invalidation                   |
| Bookmarks          | Same desired-state model; means “keep this for later,” not necessarily approval                              | Keep private; establish intended use and disclosure before any pooled feature; do not infer satisfaction                     |
| Not interested     | Removes a source from browse/category before paging; explicit search remains inclusive                       | Preserve this functional suppression; no automatic negative vote against its creator/community score                         |
| Impressions/opens  | Default-off measurement, actor/exposure/source bound; client visibility claim and explicit selection         | Establish coverage, coherent joins and timestamp semantics; never equate served tokens with views                            |
| Qualified adoption | Successful install through a verified unchanged private copy, bound to an organic open/source                | Validate native copy round trips and short-window cohorts; report this narrow definition rather than all installs or quality |

Preference rows are mutable, with one timestamp shared across kinds. Turning a
flag off clears its revision/hash; an all-false row is deleted. They are not an
action history. The generic preference idempotency ledger is not a replacement
event stream. Default false, an absent row or no action is not negative feedback.
Self-likes/bookmarks and internal/test-account preferences are allowed functional
state, so cannot be counted as independent endorsement. Matching display names
never establish account identity. Distinct accounts are not proven independent
people.

The current measurement disclosure covers organic views, opens and public-source
usage, with private content excluded. Functional preferences do not require this
setting. Their existence does not establish permission to pool private bookmarks
or preferences. Before a new use, decide and explain its purpose, eligible data,
control and withdrawal behavior; version changed disclosures and obtain the
required reaffirmation. Reuse simple controls where appropriate. Do not add a
taxonomy or make private actions depend on analytics.

## Measurement gaps that prevent weights today

### Coverage and provenance

Exposure records identify actor, exact source key/revision/hash, surface, global
position, hashed snapshot, issuance/expiry and optional policy context. Legacy
contexts can be null. Issuance requires the account opt-in and excludes self and
explicit configured internal account IDs. Quotas cap new exposure rows at 120
per rolling minute and 1,000 per actor UTC day; exact active contexts are reused.

The schema has no complete denominator of eligible catalog sessions, client
version, disclosure version, experiment assignment, or quota-denial counters.
Consequently opt-in coverage, unsupported-client loss and quota loss cannot be
calculated from accepted rows alone. Enabled-account counts are not active-session
coverage. Best-effort signal acceptance can acknowledge an ignored request;
missing rows cannot be labeled quota loss, rejection, dislike or non-conversion.
Use an existing authorized denominator only if independently verified; otherwise
report **unknown**. Any new collection requires a specific contract/purpose.

### Impression/open pairing

Native impressions require at least 50% visibility for one continuous second in
the active foreground surface. A quick explicit open can occur first. The server
checks eligibility but cannot prove attention. Daily `rankEligible` uniqueness is
per actor/source/UTC day/kind, across surfaces, revisions, positions and snapshots.
The first credited impression and first credited open can therefore refer to
different exposures. Additional raw opens can have `rankEligible=false` and still
be the exact open supporting copy attribution; later daily impressions are not
all retained. Dividing separately credited opens by impressions is not CTR.

For a matched diagnostic, join the exact exposure and actor, preserving its
served revision/hash and position. Include eligible raw opens irrespective of
daily credit, and only pair an open after its qualifying impression. Report
fast-open/unpaired/unknown chains separately; anchor the cohort consistently
across UTC midnight. Current `createdAt defaultNow()` is PostgreSQL transaction
start, not strict post-lock acceptance chronology, and there is no client event
time/acceptance sequence. Until chronology is sufficient, report a clearly
labeled server-time proxy or mark the ordered funnel unavailable. A future
canonical accepted timestamp/sequence must not pretend to prove client visibility.

Position affects clicks, so observational click rates cannot establish relevance
or policy lift. This limitation is supported by the search eye-tracking study,
not an assertion that its setting exactly matches Gatherory.
[Joachims et al., SIGIR 2005](https://research.google/pubs/accurately-interpreting-clickthrough-data-as-implicit-feedback/).

### Install definition and cohort maturity

Qualified adoption requires active opt-in, an eligible non-self public source,
an exact organic exposure/open, an exact-hash copy and a successful unchanged-copy
install while the original source is still listed. It is at most one credited
adoption per actor/source while retained. Edited/adapted copies, bearer links,
missing tokens and expired chains can still install successfully without credit.
At this audit, existing integration fixtures did not establish round-trip parity
for the curated catalog and representative authored capability/cover cases.
[06](06-measurement-readiness-report-and-attribution-checks.md) adds a captured
native snapshot matrix and completed-install checks for its declared fixtures.
Broader native setup transformations and live attribution yield remain unverified.

**A fully matured 30-day raw cohort is unavailable under current retention.**
Acquisition expires 30 days after exposure issuance. Cleanup also deletes the
exposure at 30 days, cascading signals, acquisitions and qualified adoptions as
that outcome window matures. The local bounded cleanup CLI exists; an operating
production maintenance job was not verified.

Start with a proposed **seven-day verified unchanged-copy adoption diagnostic**.
For a declared cohort interval, use one eligible recorded organic open per
actor/source, tied to its exact exposure, and anchor its outcome window to that
exposure's `issuedAt`. Count qualified adoption within seven days of issuance;
exclude actor/sources already credited in retained history at cohort entry.
Report this as adoption among recorded open opportunities, not overall discovery
conversion, and report served contexts/impressions separately. Repeated opens
cannot enlarge the denominator. Older acquisition history may already have expired.

Wait 24 hours after the last cohort member's seven-day window closes, then analyze
before the earliest cohort exposure reaches its 30-day expiry. Reject a cohort
interval too wide to satisfy both bounds. This short horizon is a practical
diagnostic, not a validated event-planning cycle. Full 30-day outcomes or longer
experiments need a reviewed retention/derived-data design first. Exporting raw
account-linked rows to outlive deletion is not that design.

### Withdrawal and derived data

Opt-out purges telemetry and attribution while preserving functional preferences;
account deletion cascades both. Unlike/unbookmark remove current preference, not
an independent negative vote. Current unlisting removes serving candidates but
does not immediately purge historical measurement rows.

Historical evaluation must preserve the exact served context and flag subsequent
withdrawal without exporting old private titles, silently dropping the cohort or
classifying withdrawal as failure. Future feature building must separately require
current public eligibility and an explicit revision policy. Any new read model,
cache, report or experiment export needs opt-out/deletion retraction and
unlike/unbookmark/source-withdrawal invalidation, a bounded retention policy and
rebuild/expiry tests. Retained evaluation artifacts must remain retractable where
required. Do not freeze an ineligible source into serving through a score snapshot.

## Build order and acceptance gates

1. **Measurement/cohort readiness report — implemented locally in [06](06-measurement-readiness-report-and-attribution-checks.md).** The slice implements a
   read-only, versioned report over authorized existing data, with dry-run/local
   fixture support and no ranking consumer. Record input cutoff, policy digest,
   population, surface, source/revision and position. Reconcile exposures, credited
   signals, raw extra opens, matched/unpaired chains, acquisitions and qualified
   adoptions. Show null contexts and unknown coverage explicitly. Keep private
   preference state outside pooled reports. Validate copy round trips and the
   seven-day/24-hour-lag cohort before expiry. Resolve required new timestamp or
   coverage fields as a deliberate contract change, not an inferred backfill.
2. **Resolve the opportunity policy in parallel.** Compare the alternative above
   offline/shadow with unchanged candidates and relevance. Adopt only an explicit,
   versioned decision; keep the current baseline as a reproducible control.
3. **First preference candidate: own explicit Likes, planned only.** If the product
   adopts personal affinity, start with the requesting account's current Likes on
   currently public content, within identical relevance groups, and a baseline
   fallback for no/sparse history. Explain this functional use before enabling it.
   Define which public content characteristics can transfer to other Blueprints;
   do not turn one like into endorsement of every creator item. Unlike, source
   withdrawal, revision change and account switching invalidate the preference
   snapshot. Verify account B is unaffected by account A. No pooled popularity
   count or bookmark weight is needed for this first candidate.
4. **Shadow one candidate before traffic.** Publish feature distributions,
   coverage, freshness, candidate/order changes and creator/new-item concentration
   against the same baseline. Add capped/shrunk distinct-account verified-adoption
   features only after measurement, pooling purpose, eligibility, retention and
   deletion gates pass. Do not choose weights from raw totals. Heavy aggregate
   refresh belongs outside requests, with immutable input cutoffs and fallback.
5. **Add experiment capability, then test.** Current policy context is not random
   assignment. Add server-owned sticky account assignment, immutable arm/version,
   exposure linkage, allocation/SRM checks, account-switch and pagination tests,
   consent enforcement, kill switch and baseline rollback. Assignment never turns
   measurement on. Predeclare one primary outcome, denominator, worthwhile minimum
   effect, alpha/power, eligible population, attribution horizon/lag, exclusions,
   guardrails and stopping rule before arm results are inspected. Derive required
   accounts and duration from measured rates/variance and a relevant planning
   cycle, not a universal event threshold. If retention or sample size cannot
   support that design, remain in shadow.

Analyze a randomized test by assigned account, not only clickers/installers.
Repeated observations are dependent; account-clustered uncertainty is a minimum
design consideration, with item dependence and spillover assessed separately.
[Bakshy and Eckles, 2013](https://ai.meta.com/research/publications/uncertainty-in-online-experiments-with-dependent-data-an-evaluation-of-bootstrap-methods/)
shows why event-level independence can understate uncertainty; it does not provide
Gatherory's sample size. Opt-in results first characterize that measured cohort,
not everyone using Gatherory. Require the predeclared worthwhile improvement,
acceptable uncertainty and passing guardrails before adoption; otherwise retain
the baseline. No engagement uplift can be inferred from this offline report.

Required report fixtures include cross-surface daily credits on different
exposures, a valid same-exposure raw open with false daily credit, open-before-
impression, midnight crossing, replay/retry, expired/deleted cohorts, repeated
like/unlike (not reconstructable as history), unavailable sources, no-consent
accounts and opted-out/deleted inputs disappearing from derived results.

Monitor measured qualified adoption and optional future usefulness, alongside
latency, paging conflicts, creator concentration, new-item reach and surface/
language coverage where available. Current private hide counts are not a pooled
guardrail until their use has been defined. No new public counters, follows,
ratings, embeddings, Community Notes model or analytics provider is needed now.

## Source map and verification

- [Policy](../../../src/server/blueprints/services/blueprint-ranking.ts) and
  [config](../../../src/server/blueprints/catalog/blueprint-ranking-config.ts)
  define current editorial, diversity and recent-item rules.
- [Evaluator](../../../src/server/blueprints/services/blueprint-ranking-evaluation.ts),
  [runner](../../../scripts/evaluate-blueprint-ranking.ts) and
  [metric tests](../../../tests/unit/blueprint-ranking-evaluation.test.ts)
  produce/check the artifact without live data.
- [Discovery schema](../../../src/db/schema/blueprint-discovery.schema.ts),
  [actions repository](../../../src/server/blueprints/repos/blueprint-discovery-actions.repo.live.ts)
  and [discovery workflow](../../../src/server/blueprints/workflows/blueprint-discovery-actions.workflows.live.ts)
  own preferences, contexts, credit, opt-out and cleanup.
- [Attribution schema](../../../src/db/schema/blueprint-attribution.schema.ts),
  [copy repository](../../../src/server/blueprints/repos/blueprint-personal.repo.live.ts)
  and [install repository](../../../src/server/blueprints/repos/blueprint.repo.live.ts)
  own the conservative copy/install chain. Native visibility/reporting lives in
  `Gatherory/Features/Blueprints/BlueprintActions.swift` and
  `BlueprintDiscoveryCards.swift` in the iOS repository.
- [03](03-actions-and-measurement.md) and
  [04](04-recommendation-baseline.md) retain their implementation/rollout evidence;
  this evaluation does not repeat those device/database acceptance claims.

Current evaluation checks passed:

- Artifact generation and `--check`: 17 curated fixtures, seven synthetic
  scenarios, five complete/stable browse traversals, and actual search/category
  requests. Fixed-time artifact is 65,840 bytes and contains no production data.
- `pnpm typecheck`: passed. Log:
  `/tmp/gatherory-ranking-evaluation-typecheck.log`.
- `pnpm test`, including contract freshness: **718 passed, 50 skipped**, with
  113 test files passed and 34 skipped. Eight new metric tests cover prefix
  coverage, unknown/duplicate keys, order-sensitive creator concentration,
  relevance inversions, cap scope, recent-item bounds and policy fingerprint.
  Log: `/tmp/gatherory-ranking-evaluation-tests.log`.
- Targeted Prettier checks, local document paths/anchors and both repositories'
  `git diff --check`: passed. Two Luna audit agents reviewed the integrated
  findings and current/planned boundaries; existing dirty work was preserved.

No database integration or native build was rerun for this pure offline
evaluator/documentation change. Database/native checks in 03/04 are historical
implementation evidence. No migration, deployment or production experiment is
part of this slice.
