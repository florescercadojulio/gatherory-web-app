# Personal Like-based ranking

**Status:** Implemented and evaluated locally, October 22, 2026. Experimental
lexical candidate; recommendation usefulness remains unverified.
This follows [07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md).
Three Luna agents own the native fixes/disclosure, pure affinity/evaluation and
server integration. The parent reviewed the integration and verified it together.
No deployment, shared database reset or device release
is implied.

**Current follow-through:** [09 — Personal Like ranking precision](09-personal-like-precision.md)
replaces the live v1 heuristic with v2. The v1 formula, counts and native test
results below are historical evidence. Its evaluator imports a frozen v1 policy
so the original artifact remains reproducible. See 09 for current role weights,
cursor version and broader results, including the fresh challenge's null gain.

## Product rule

Use the requesting account's explicit current Likes to tailor its Blueprint
recommendations. This is functional use of a private preference, independent of
optional impression/open/install measurement. Bookmarks, installs, other
accounts' Likes and creator popularity do not contribute. The native settings
explanation tells people that Likes tailor recommendations and can be undone.
Cards remain scan-first; there is no topic picker, hashtag requirement or new
card annotation.

A seed must still be a public Blueprint with the exact liked revision and
content hash. Unlike, hiding, withdrawal and republishing invalidate its use.
A Like on an older revision is not silently transferred to a new publication.
It remains possible to undo that Like through the existing action state.
Private copies, drafts and bearer-only sources never enter this feature.

The first content comparison uses published Blueprint names and summaries,
event titles, and idea titles/notes. Internal category labels, tags and creator
identity are not affinity features. Text normalization removes accents, English
and Spanish stopwords and generic planning words, with a small explicit alias
map. This is bounded lexical matching, not semantic understanding or a learned
model. Unrecognized synonyms and translations can produce no match.

## Limits and composition

- Keep at most 64 distinct meaningful terms per public source, selected in
  alphabetical order. Repetition does
  not increase influence. Select at most 50 valid current Like seeds in stable
  catalog-key order; no historical preference dataset is created.
- Require two distinct shared terms with a seed. A matching seed contributes
  shared-term count minus one; total candidate affinity is capped at three.
  Already-liked sources do not receive an affinity boost.
  The score cap bounds the feature contribution, not the number of ranking
  positions an item can move.
- Within an identical search-relevance group, compare editorial priority,
  affinity, then catalog key. Apply the existing soft creator cap and
  promotion-only recent-item pass. Affinity cannot make weaker search evidence
  outrank stronger evidence or bypass candidate eligibility/category filters.
- No usable seed or no matching candidate keeps the baseline v2 order. A sparse
  single Like can help only when its content has the required overlap.
  Zero affinity is not dislike. Not interested keeps its existing suppression
  behavior; bookmarks stay independent.

Recent-item promotion still preserves recent positions relative to the ordinary
order for the active policy. Personal affinity can change that ordinary order
compared with the nonpersonal baseline; the evaluation must report resulting
recent-item share and creator concentration rather than claim they are identical.

## Server boundaries and paging

The existing authenticated `ranking=baseline_v1` capability remains the request
shape. Legacy/full-catalog requests retain their ordering. Internal policy
`blueprint-personal-likes-v1` identifies personalized pages; the reproducible
`blueprint-baseline-v2` remains the control and personalization fallback.

The server reads exact Like bindings through the injected preference repository,
separately from bookmark-preferred display revision/hash fields. It builds the
profile from the full currently public catalog before query/category filtering,
excluding hidden seeds. Scores, source terms and Like bindings remain internal.
Public serialization strips those fields.

Ranked cursors bind account scope, the public catalog, active policy and a private
preference fingerprint even if the resulting order is unchanged. Preference
bindings beyond the selected 50 are included for invalidation. Unlike, source
revision/visibility changes and account switches require a restart. Client-supplied
cursors and scores grant no authority; the server recomputes the profile.
Policy/configuration labels in consented telemetry contain no personal profile.

Personal ranking is enabled by default for authenticated capable pages;
`BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED=false` selects baseline v2. The existing
baseline switch still selects content-relevance/key fallback. The pure rules are
independent of environment/DB clients; the production workflow supplies settings
and account state. No schema migration, DB reset, batch profile, scheduler or
additional measurement collection is required.

## Offline comparison

The comparison uses identical public candidates, relevance and frozen time for
baseline v2 and the personal candidate. It includes repository curated starters
and deterministic fictional authored profiles. Report content/profile coverage,
score distributions, changed positions/top-ten overlap, relevance violations,
creator concentration, recent-item share and complete stable paging.

Profiles must exercise no history, sparse/no overlap, useful overlap, unlike,
stale/withdrawn revision, another account's unaffected results, repeated words
and capped influence. A synthetic scenario that was designed to move an item
does not demonstrate usefulness, satisfaction, conversion or causal lift.
No production usage is consulted or exported by the evaluation.

Run from the web-app root; both commands use public repository/test fixtures
only, without database or application credentials:

```sh
pnpm exec tsx scripts/evaluate-blueprint-personal-likes.ts
pnpm exec tsx scripts/evaluate-blueprint-personal-likes.ts --check
```

The [personal evaluation artifact](artifacts/personal-like-evaluation.json)
is separate from the retained [baseline control](artifacts/baseline-evaluation.json).
The current comparison contains 17 curated fixtures, seven basic fictional text
examples and a 29-row mixed fixture (20 older authored, eight recent authored
and one Like seed). All reported baseline/personal relevance violations are zero.

| Profile / fixture                                     | Observed result                                                                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| No history, unliked, stale revision, withdrawn source | Zero changed positions compared with baseline                                                                                                   |
| One current Wedding Like, 17 curated candidates       | 11 other candidates match; nine reach score 3; nine positions change, including four top-ten positions; seven of ten top-ten members are shared |
| Three current Likes: Wedding, Birthday, Park Picnic   | Three valid seeds; nine positions change; nine of ten top-ten members are shared                                                                |
| Mixed recent/creator fixture                          | Recent share changes from 10% to 80% in the top ten and from 10% to 40% in the top twenty; maximum consecutive creator run stays one            |
| Paging at sizes 1, 2, 3, 7, 20                        | Complete, stable order without duplicates for baseline and personal profiles                                                                    |

The mixed fixture's top-ten largest creator share increases from 30% to 40%
(HHI 0.22 to 0.34) despite its consecutive run staying one. A run cap does not
guarantee equal creator exposure. The synthetic recent-item movement is caused
by matched content, not evidence that boosting recent publications is useful.

The one-Like saturation is a material limitation. Shared planning copy drives
matches: `dietary` appears in 11/17 curated documents, `food` in 8/17 and `needs`
in 7/17. A City Break fixture can reach score 3 from shared planning terms with
no wedding-specific overlap. Those are actual fixture observations, not inferred
user preferences. A scratch frequency-filter comparison reduced saturation but
did not establish an appropriate threshold. No catalog-fitted blacklist or
frequency weighting was added. Evaluate broader authored fixtures and review
lexical precision before a production rollout; this rule is a transparent initial
candidate, not a demonstrated improvement over baseline.

## Native diagnostics and verification

The user reported unused `Bool` task results in `BlueprintActions`, an isolated
adapter initializer in `SavedBlueprintsView` and formatter isolation in the
nonisolated discovery DTO. The fixes consume task results explicitly, bind the
existing preview directly to its catalog entry, and construct local date
formatters. No preference serialization, preview intent or date format changes.
The native disclosure is English/Spanish copy in an existing settings surface.

Personal changes invalidate continuations even when order is unchanged. The
native feed now handles a typed `BLUEPRINT_CATALOG_CURSOR_STALE` continuation
by clearing the old stream and fetching page one once in the same active scope.
It never merges old and newly ordered pages. A failed restart or stale first page
surfaces the existing retry state; unrelated errors keep their current cursor.
Account/query generation checks discard late responses after a scope change.

Integrated verification on the final local sources:

- `pnpm typecheck` passed. `pnpm test` passed generated contract freshness and
  **761 tests in 117 files**, with 54 environment-dependent tests skipped.
  Logs: `/tmp/gatherory-personal-like-typecheck-final.log` and
  `/tmp/gatherory-personal-like-web-verified.log`.
- Explicit opt-in PostgreSQL checks passed **8 tests in 6 files** on a disposable
  PostgreSQL 18 database after applying existing migrations. The new real workflow
  regression checks A/B isolation, separate Like/bookmark revision slots,
  measurement-off use, unlike/revision cursor invalidation and the baseline
  switch. Existing suites cover measurement, reporting, publication metadata and
  copy/install attribution. Source-withdrawal, hide, bookmark-only cursor stability,
  private-field stripping and fallback checks also run in the pure paging tests.
  Log: `/tmp/gatherory-personal-like-db-final.log`. No new migration or shared
  reset was needed.
- Both offline evaluator `--check` commands passed. The personal artifact is
  54,578 bytes; the retained baseline artifact is 89,052 bytes. These are
  reproducible fixture evaluations, not account-data exports or online tests.
- The iPhone 18 Pro simulator build passed. The final selected native run passed
  **30 tests in 3 suites**: `BlueprintDiscoveryTests`, `BlueprintActionsTests` and
  `BlueprintCatalogContractTests`. It covers one-time cursor replacement,
  failed/first-page restart bounds, ordinary errors and late scope responses.
  Log: `/tmp/gatherory-personal-like-native-feed-final-test.log`; result:
  `/tmp/gatherory-personal-like-native-feed-final.xcresult`. The reported
  diagnostics are absent from the successful build; unrelated existing warnings
  are not claimed fixed.
- English/Spanish coverage passed for **1,659 strings**. Targeted formatting,
  local documentation links and both repositories' `git diff --check` passed.
  No physical-device, VoiceOver, production auth/storage or online quality
  acceptance was performed in this slice.

## Owning code

- [Affinity policy/builder](../../../src/server/blueprints/services/blueprint-like-affinity.ts)
  owns normalization, exact Like eligibility, score bounds and private profile
  binding; [ranking](../../../src/server/blueprints/services/blueprint-ranking.ts)
  composes affinity with the existing order.
- [Discovery](../../../src/server/blueprints/services/blueprint-discovery.ts)
  extracts public content and binds/serializes pages;
  [production workflow](../../../src/server/blueprints/workflows/blueprint-discovery-actions.workflows.live.ts)
  supplies account state and switches through the existing repository.
- [Evaluator](../../../scripts/evaluate-blueprint-personal-likes.ts),
  [pure tests](../../../tests/unit/blueprint-like-affinity.test.ts) and
  [real preference/workflow test](../../../tests/integration/blueprint-personal-like-ranking.database.test.ts)
  own repeatable evidence. Native behavior is recorded in the iOS
  [Explore handoff](../../../../ios-apps/gatherory/docs/explore-performance.md).

## Continue from here

First evaluate/tune lexical precision, shared planning-copy saturation and sparse
language coverage on broader public fixtures. Then validate the personal rule
with real opt-in exposure/outcome evidence after an authorized rollout.
Pooled bookmarks/install weights still require operational coverage,
deletion/maintenance checks, an agreed outcome window and sufficient independent
evidence. Follows, public counts, quality labels and required taxonomy remain
separate later decisions.
