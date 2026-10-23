# Search relevance and the Explore header

**Status:** Server scoring evaluated locally; experimental header redesign reverted. Card UI checks and Release build passed locally, October 22, 2026.

## Product decision

Explore retains the standard native SwiftUI search layout: a navigation title,
profile toolbar action, and system search field above Blueprint cards. The
custom field and experimental shared large-title/profile row were reverted at
the user's request. The October 23 follow-up uses native inline-large toolbar
presentation to align Search with profile and retain system scroll collapse;
see [13 — Discovery and library actions](13-discovery-and-library-actions.md).

Category tiles and the redundant All Blueprints heading remain removed.
Categories remain background metadata and compatible API filters. Creators need
no topics, hashtags, or keyword forms. Native search uses Apple's
[Search APIs](https://developer.apple.com/documentation/swiftui/search), including
system keyboard, clear, Cancel, and search-presentation handling.

The subsequent card-stability fix keeps cover geometry independent of image
loading and removes Glur from catalog cards. A dark gradient preserves title
contrast. See the native [rendering handoff](../../../../ios-apps/gatherory/docs/explore-performance.md).

## Matching and ranking

Search still projects only the already-authorized public catalog: Blueprint
name and public summary, supported child-event titles, supported idea titles
and notes, and weak supporting metadata. One result remains one Blueprint and
opens the existing preview. Drafts, private live events, private copies, and
unlisted-link content do not become new search inputs.

The revised matcher distinguishes exact Blueprint names, contiguous title
phrases, and concepts present together in a title. Literal and explicit bilingual
alias evidence takes priority over inferred evidence; bounded related terms and
typo repair are weaker. Every distinct query concept needs evidence in the same
Blueprint. Repetition does not manufacture relevance credit. Category-only
matches remain fallback candidates, and internal metadata cannot fill a missing
concept alongside an authored-content match to manufacture intent.

The internal policy is `content-search-v3`. Lower vectors rank first: maximum
evidence confidence tier, sum of confidence tiers, Blueprint-name specificity,
weakest field tier, field-tier sum, then sorted field tiers. Confidence is 0 for
literal/alias content, 1 for inferred content, and 2 for metadata. Blueprint-name
specificity is 0 for a normalized whole-title match (including explicit aliases),
1 for a contiguous alias-aware query phrase, 2 for all concepts together in the
name, and 3 otherwise. Field tiers are name 3, child/idea title 4, public
summary/idea notes 5, inferred content 6, and metadata 7. An exact nested title
does not receive the Blueprint-name specificity boost.

Wedding aliases remain wedding/weddings/boda/bodas. Directed wedding-related
phrases include bridal shower, bridal celebration, bridal bouquet, nuptial
celebration and nuptials. Bride/brides can find bridal content as inferred
evidence; they are not exact wedding aliases. Generic reception or ceremony
alone does not expand into wedding. Outdoors retains its bounded picnic,
camping, garden and bonfire expansion. Expansions do not recurse.

Typo repair permits one insertion, deletion, substitution, or adjacent
transposition for a query term of at least five characters. Existing authored
vocabulary is not fuzzily broadened, metadata cannot supply or suppress typo
corrections, and multiple different canonical corrections are rejected as
ambiguous. Recognized aliases of a corrected concept remain searchable across
the supported English/Spanish forms. Source tokenization and query match terms
are prepared once per request, rather than rescanning the vocabulary per source.

Search policy and dictionaries participate in the catalog snapshot digest. Old
cursors restart through the existing stale-cursor recovery path. Empty-query
browse keeps its existing order. Existing personal Like affinity,
editorial priorities, creator variety, and new-item promotion continue to act
only within identical relevance vectors. This slice adds no engagement weight.

## Reproducible comparison

The v1 comparator is frozen from the pre-change discovery service, SHA-256
`1c606eeec95358e856f3cbd9c394608f2f725407a53331972b5e777017318e18`.
Its source-derived matcher is kept separately in
[`scripts/blueprint-search-legacy-v1.ts`](../../../scripts/blueprint-search-legacy-v1.ts).
The candidate uses the current production catalog-page function, with the same
synthetic public corpus and relevance judgments as the comparator.

Run from the web workspace:

```sh
pnpm tsx scripts/evaluate-blueprint-search.ts
pnpm tsx scripts/evaluate-blueprint-search.ts --check
pnpm vitest run tests/unit/blueprint-content-search.test.ts tests/unit/blueprint-search-evaluation.test.ts
```

The paired report is
[`tests/fixtures/blueprint-search-evaluation-report.json`](../../../tests/fixtures/blueprint-search-evaluation-report.json).
It separates development queries from challenge queries and reports per-query
results as well as aggregates. Challenge queries were inspected during tuning;
they are not blind held-out evidence. Hand-authored examples do not establish
production usefulness. Relevance metrics exclude queries with no judged
relevant items, which have separate false-positive reporting. Precision at five
uses a fixed denominator of five, including unfilled positions.

The corpus has 19 synthetic public Blueprints and 38 query cases: 26 development
queries (24 with positive judgments and two negative queries), plus 12
tuning-reviewed challenge queries. The frozen comparator matched the original
pre-change production function on all 38 cases in the parent audit, with zero
order mismatches.

| Set / metric            | Frozen v1 | Current matcher |
| ----------------------- | --------: | --------------: |
| Development precision@5 |    0.3417 |          0.3750 |
| Development recall@5    |    0.7527 |          0.8360 |
| Development MRR         |    0.7500 |          0.8125 |
| Development nDCG@5      |    0.7340 |          0.7970 |
| Challenge precision@5   |    0.2500 |          0.5333 |
| Challenge recall@5      |    0.3690 |          0.6892 |
| Challenge MRR           |    0.4583 |          0.8333 |
| Challenge nDCG@5        |    0.4352 |          0.8277 |

Both systems returned no false positives on the two explicitly negative queries.
Browse and nonempty-query traversals are stable and unique across page sizes
1, 2, 3 and 5. Orphan-target content is tested separately; those checks do not
claim to test live database authorization. No individual query loses nDCG@5 in
this fixture snapshot, but the small, tuning-reviewed corpus cannot establish
that search is regression-free on real creator content. Missing language
coverage, ambiguous spellings, and novel related concepts remain limitations.

The recommendation baseline artifact was refreshed only for its search-policy
snapshot digest; its ordering, metrics and policy remain unchanged. All three
personal Like evaluation artifacts are unchanged and pass freshness checks.

## Native verification boundary

The explicit DEBUG-only `-BlueprintSearchVisualFixture` launch flag provides
populated local catalog pages without a signed-in server. It uses public fixture
data, keeps the production native search interface and grid, and disables Explore API actions,
ads, and measurement in that mode. The normal app path and Release behavior do
not enable this fixture. Local fixture filtering tests presentation; production
search relevance is verified on the server.

Native card regression tests explicitly set the app's `appAppearance` preference
for light and dark runs. They compare card heights and relative placement before
and after decoded artwork is present, scroll cards offscreen, and compare them
again after returning. A forty-entry DEBUG fixture varies category ratios, title
length, and creator bylines. Tail-spacing checks also reject large empty column
gaps caused by ad-slot estimates on screens without an ad session. The
rejected header-collapse test is removed with that design.

The final card UI regression passed in explicit light and dark app appearances
on the iPhone 18 Pro simulator (iOS 27.0). It verifies decoded artwork, stable
heights/relative placement within one point after offscreen/return scrolling,
and no oversized column-tail gaps from inactive ad slots. Eight screenshots were
captured; selected loaded/scrolled/returned captures were inspected in both
appearances. Result: `/tmp/gatherory-card-stability-no-inactive-slots.xcresult`.
The final Release simulator build passed
(`/tmp/gatherory-card-stability-release-final.log`). Thirty-two
focused native discovery, navigation, preview-session and layout tests passed,
and English/Spanish localization coverage passed for 1,671 strings. Earlier
web/server checks passed 786 tests (54 skipped) and TypeScript typechecking; the
search fixture report and recommendation/Like artifacts passed freshness checks. No server deployment, phone release,
database reset, or new data collection is implied by this implementation.
