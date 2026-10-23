# Blueprint ranking: reusable Community Notes code

**Reviewed:** October 22, 2026.  
**Status:** Research completed; Blueprint-led product direction accepted,
ranking/model recommendations remain proposed and unimplemented.  
**Scope:** Rank discoverable Blueprints as Gatherory develops a social discovery
experience around reusable event plans. Three Luna agents investigated scoring,
trust mechanisms, and Gatherory integration; the parent reviewed the findings.

## Recommendation

Borrow Community Notes' approach to **evidence, independent feedback, and
confidence**. Build Gatherory's relevance and discovery pipeline in the existing
TypeScript/Effect backend. Consider its Python models later as offline quality
experiments, once Gatherory has overlapping, explicit Blueprint feedback.

The supplied repository is a helpfulness/consensus scorer. Its output can
contribute a community-quality feature, but does not supply a personalized social
feed. A wedding plan can be excellent for its audience without appealing to
people planning a cottage stay. Keep suitability, quality, adoption, and safety
separate rather than reducing them to one popularity count.

Read the [discovery and ranking roadmap](../roadmaps/blueprint-ranking-roadmap/README.md)
for implementation order, signal contracts, and acceptance criteria.

## Accepted product follow-up — October 22

The user accepted **Blueprint-led discovery** after this source investigation.
The [discovery decision](../architecture/blueprint-led-discovery.md) keeps the
Blueprint as the main published/recommended object. Cards are scan-first: cover,
a prominent title that says what experience the Blueprint is for (such as
“Cottage Weekend”), and a small optional creator byline. The existing whole-card
button opens the read-only preview for full event/idea detail. Do not add
category labels, summaries, highlights, or a visible preview CTA; do not add
title validation, automatically rename published content, or inflate card
metadata to compensate for vague titles. Single-event plans remain valid.

An earlier local highlight prototype and its tests were removed after this
clarification. Its recorded test and synthetic-render results are superseded
history, not evidence for current title-led behavior; see the [slice 01
record](../roadmaps/blueprint-ranking-roadmap/01-blueprint-cards-and-highlights.md#superseded-highlight-prototype-history).
Earlier native verification after simplification is recorded in the onboarding
guide: the build and 25 focused tests passed, localization passed 1,638 strings,
and synthetic light/dark plus AX3 captures were visually inspected. Physical-
device and spoken VoiceOver acceptance remain unverified.

[Content and related-term search](../roadmaps/blueprint-ranking-roadmap/02-content-search-and-related-terms.md)
is now implemented locally with supported published event/idea text, bounded
EN/ES aliases and query relevance. Its current verification is recorded in 02;
[Actions and opt-in measurement](../roadmaps/blueprint-ranking-roadmap/03-actions-and-measurement.md)
are now implemented locally, followed by the
[deterministic recommendation baseline](../roadmaps/blueprint-ranking-roadmap/04-recommendation-baseline.md).
Coverage and baseline evaluation are next.
Keep categories and curated tags internal, with optional browse shortcuts and no
required taxonomy, topic selection, keyword form, or hashtags. Search the public
plan plus its published event/idea content; nested match explanations belong in
search results or the preview. Likes, social controls, and ranking changes are
not required for this direction. This is an accepted Gatherory product choice,
not a conclusion demonstrated by the upstream scorer, and it does not change
the pinned source findings below. Resolve the source-attribution gap before
installation counts can influence ranking. Nothing here claims deployment.

## Sources and limits

The upstream checkout was pinned to
[`93647eb9ad57642c05a9dc79fba9d6df42c5ae06`](https://github.com/twitter/communitynotes/commit/93647eb9ad57642c05a9dc79fba9d6df42c5ae06),
the `main` HEAD retrieved on October 22; its latest commit is dated September 30, 2026. Links below point to that snapshot. The upstream
[README][cn-readme] locates the scoring code in `scoring/src` and explains that
it is exported from an internal repository. This review establishes public-code
behavior, not the configuration or state of X's live services.

Gatherory findings refer to the local `feat/rc-1` checkout based on `d3f5a17`,
including its substantial uncommitted work. Source was inspected; production
traffic, rating distributions, deployment state, and ranking performance were
not measured. No upstream models or datasets were executed or imported.

## Source map: what we can pull

### 1. Separate broad usefulness from audience-specific agreement

[`BiasedMatrixFactorization.forward`][mf-model] predicts a rating from a global
intercept, rater intercept, note intercept, and rater–note factor interaction.
[`MatrixFactorization`][mf-training] owns optimization and regularization.
The associated [algorithm explanation][ranking-guide] describes why broad
agreement can emerge in the item intercept while factors capture disagreement.

For Gatherory, experiment with Blueprint helpfulness ratings as inputs and a
broad-usefulness feature as output. Learned factors are statistical patterns;
they are not verified demographic or political identities. A quality score
should supplement category relevance, not suppress a useful niche Blueprint.

**Reuse decision:** the small PyTorch model is a plausible literal reuse target
for an offline experiment. Its training objective, input adapters, calibration,
and evaluation still need Gatherory-specific work. Clicks, installs, and missing
ratings cannot simply replace explicit helpfulness labels.

### 2. Include the current Gaussian consensus implementation

[`GaussianScorer._return_all_pts`,
`_gaussian_kernel_extrapolator_vectorized`, and
`_calculate_gaussian_scores`][gaussian] smooth evidence over learned rater-factor
positions and aggregate agreement, using priors and geometric-mean calculations.
This matters because the inspected code goes beyond the older matrix-factorization
description commonly associated with Community Notes.

**Reuse decision:** defer literal adoption. It could test whether a Blueprint's
quality holds across different usage communities after a connected rating graph
exists. Its source schema, factor estimates, priors, and thresholds are tightly
coupled to Community Notes. Sparse cottage or Spanish-language ratings should
produce uncertainty, not an automatic quality penalty.

### 3. Make insufficient evidence an explicit outcome

[`PseudoRatersRunner`][pseudo-raters] refits item parameters with synthetic extreme
raters to measure sensitivity. The current `_make_extreme_raters` adds only
helpful pseudo-ratings: the not-helpful perturbations used for the lower
confidence-bound path are disabled. Aggregation still reports minimum, median,
and maximum values across refits. These are sensitivity estimates from one-sided
pseudo-rating perturbations, not calibrated statistical confidence intervals.
[`note_ratings`][note-ratings] combines evidence and score conditions into status
decisions.

**Reuse decision:** adapt the principle first. A Blueprint with one enthusiastic
rating should retain an uncertain quality estimate. New entries should still
receive exploration opportunities. A simple shrinkage estimate is a more
appropriate first experiment than porting the pseudo-rater pipeline. Do not copy
Community Notes' numeric cutoffs or present its sensitivity bounds as calibrated
probabilities of Blueprint quality.

### 4. Treat reliable reviewing separately from creator popularity

[`compute_general_helpfulness_scores` and
`filter_ratings_by_helpfulness_scores`][helpfulness] calculate contributor track
records and filter rating inputs. [`MFBaseScorer`][mf-base] uses those functions
between model rounds. These are the clearest pointers for the actual
helpfulness-based filtering path; `ReputationScorer` is a separate model example.

**Reuse decision:** adapt later, after useful independent outcomes exist. Do not
reward reviewers merely for agreeing with the current rank order: that would
reinforce the system's own mistakes. Creator followers, reviewer reliability,
event management permissions, and platform moderation privileges must remain
different concepts. Give new reviewers a path to contribute and cap established
reviewer influence.

### 5. Detect coordinated influence without treating friends as attackers

There are two distinct mechanisms in the active source:

| Source                                                                | What it actually measures                                                                                                                                                            | Gatherory implication                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| [`PostSelectionSimilarity`][pss]                                      | Rapid helpful ratings concentrated on particular authors, plus repeated same-note co-rating within a timing window. Its timing pair-count path does not require equal rating values. | Potential signal for concentrated promotional activity; requires many repeated observations and exposure context. |
| [`QuasiCliqueDetection._get_pair_counts` and `_grow_clique`][cliques] | Repeated equal-valued ratings on the same notes/posts, followed by dense-group growth. This mechanism has no rating-timing condition.                                                | Potential signal for coordinated agreement once rating volume supports it.                                        |

[`run_rater_clustering`][clustering] combines them in active orchestration;
`post_selection_similarity_old.py` is not the implementation to start from.
[`apply_post_selection_similarity`][pss] filters clustered influence, including
same-cluster author relationships and duplicate cluster contributions.

**Reuse decision:** keep for later abuse experiments. Planning groups naturally
share interests and act together around an event. Co-occurrence, household
membership, or a burst after legitimate sharing is not proof of manipulation.
Start with self-rating exclusions, idempotency, rate limits, and bounded influence.
Do not infer a social graph from private guest lists for ranking.

### 6. Explain decisions and preserve their history

[`apply_scoring_rules` and `NmrDueToMinStableCrhTime`][rules] demonstrate ordered,
named scoring rules and stabilization. [`note_status_history`][status-history]
records transitions and historical timestamps.

**Reuse decision:** adapt this pattern immediately. Persist a ranking version,
input cutoff, evidence counts, eligibility decisions, and reason codes. Build
clear fallback and rollback behavior. New evidence should not make a paginated
feed reorder between every request. Safety actions must still remove an item
immediately; ranking stability must never delay removal or unlisting. Do not
copy note status locking into permanent Blueprint immunity.

### 7. Separate preparation, scoring, and serving

[`runner._run_pss_phase`, `_run_prescoring_phase`, and `_run_final_phase`][runner]
separate stages and intermediate artifacts. This supports reproducible scoring
outside interactive request handling.

**Reuse decision:** adapt the architecture. Compute versioned ranking features
and snapshots outside the catalog request, then serve authorized public entries
through existing Effect workflows. Keep the last good snapshot if a job fails.
Do not add Python model training or full-history scans to an iPhone catalog call.

### 8. Defer supervised confidence and specialized safety models

[`PCRHModel.fit` and `predict`][pcrh] use historical outcomes to estimate early
confidence. Diligence and tag-consensus models elsewhere in the repository
address specific Community Notes quality problems.

**Reuse decision:** defer. Gatherory lacks the labeled history needed to validate
these models. A Blueprint usefulness rating does not establish that a travel
instruction is safe or a source is accurate. Blueprint content reporting and
moderation need an explicit policy and review path independently of ranking.

## Where personalized social discovery comes from

A narrowly scoped comparison with
[`twitter/the-algorithm`][algorithm-readme] found the closer architectural
reference for feeds. Its inspected documentation snapshot is
`c54bec0d4e029fe34926ef3258a86ccacc0d0182`; this is a separate source reference,
not a claim about X's current production recommender.

| Area to study next                                                                   | Transfer to Gatherory                                                                            | Adoption decision                                                                                                                |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| [`home-mixer`][home-mixer]                                                           | Candidate retrieval → feature preparation → ranking → diversity/visibility filters → pagination. | Reimplement a small pipeline in Effect; avoid importing its Scala service graph.                                                 |
| `user-signal-service` and `unified-user-actions`, described in the repository README | Explicit and implicit actions have defined meanings and collection boundaries.                   | Create a small first-party Blueprint signal contract; existing installs are not sufficient attribution.                          |
| `SimClusters`, `TwHIN`, and graph-based candidate sources, described in the README   | Candidates can come from interest or interaction neighborhoods.                                  | Defer until optional public follows/interests and enough activity exist. Never substitute event membership for public following. |
| Home Mixer's author diversity, feedback fatigue, and deduplication stages            | Limit repeated creators, repeated items, and unwanted recommendations.                           | Adapt after relevance and eligibility; preserve a useful catalog when authored inventory is small.                               |

This comparison inspected the official overview documents, not a full audit of
those subsystems. It is a reading map, not a recommendation to vendor them. Use
Community Notes for a possible community-quality layer and the feed pipeline
pattern for discovery. Neither supplies Gatherory's product-specific objective.

## Gatherory's existing foundation and important gaps

| Current evidence                                                                                                                                                                                                                                                                                              | Consequence for ranking                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`buildBlueprintCatalog`](../../src/server/blueprints/services/blueprint-discovery.ts) deduplicates by catalog key and sorts keys lexically. Search applies all query tokens; paging happens in memory.                                                                                                       | There is no learned or engagement-driven ordering to preserve. Search relevance needs its own policy.                                                         |
| [`blueprint.repo.live.ts`](../../src/server/blueprints/repos/blueprint.repo.live.ts) allows curated revisions and an authored Blueprint's exact listed revision into discovery.                                                                                                                               | Eligibility comes before scoring. Private ownership, a saved copy, or possession of a share link must not add a candidate.                                    |
| [`Catalog pagination`](../architecture/explore-catalog-pagination.md) binds cursors to catalog metadata, query, category, and page size.                                                                                                                                                                      | Changing score order needs a versioned ranking snapshot/cursor contract; the current metadata digest does not bind new score inputs.                          |
| [`BlueprintSavedCopyResolver.swift`](../../../ios-apps/gatherory/Gatherory/Features/Blueprints/BlueprintSavedCopyResolver.swift) pins native setup to a private copy. [`install-blueprint.workflow.ts`](../../src/server/blueprints/workflows/install-blueprint.workflow.ts) installs the requested revision. | Many native receipts identify the private copy, not the public Blueprint that inspired it. Counting receipts grouped by catalog key would miss that adoption. |
| [`blueprint-personal.repo.live.ts`](../../src/server/blueprints/repos/blueprint-personal.repo.live.ts) stores a setup-copy source marker originating in the copy request.                                                                                                                                     | That marker lacks verified public-discovery attribution and source hash. It is a lineage hint, not sufficient authority to award ranking credit.              |
| Creator metadata is an optional chosen display name; existing moderation primarily handles media and user blocking.                                                                                                                                                                                           | No public account graph or Blueprint-level quality-review lifecycle should be inferred from those features.                                                   |
| Web and native analytics exist generally. No Blueprint discovery impression/open/conversion instrumentation was found in the inspected web and native Blueprint/Explore paths. AdMob impressions are separate.                                                                                                | Do not assume a usable organic interaction dataset exists. Its actual availability and historical completeness remain unverified.                             |

## Runtime and reuse costs

The scorer is Python, with [requirements][requirements] including PyTorch,
NumPy, pandas, SciPy, scikit-learn, and pyarrow. The README records Python 3.10
as tested. Gatherory runs Node 24 and Effect; vendoring the scorer would add
another runtime, data adapters, batch scheduling, model artifacts, and monitoring.
No compatibility or performance test was performed here.

Literal reuse would need a dependency inventory and a small reproducible
experiment first. The root [Apache-2.0 license][license] includes redistribution,
notice-retention, and modified-file requirements; also inspect
[third-party notices][third-party]. Do not assume the same terms cover separately
downloaded X user datasets or another repository. This work copied no upstream
implementation and added no dependencies.

## Conclusion and stopping point

The most valuable immediate transfer is the discipline around evidence and
decision boundaries. The most plausible later code reuse is the small biased
matrix-factorization model in an offline experiment. Gaussian consensus,
correlation detection, and reputation filtering are later candidates, contingent
on sufficient data and measured benefit.

The [updated roadmap](../roadmaps/blueprint-ranking-roadmap/README.md) records the
current scan-first Blueprint-card direction and the superseded local highlight
prototype history. Content search and private actions/default-off measurement
and the deterministic recommendation baseline are implemented locally;
coverage and baseline evaluation are next. See slice 03
for the additive migration, conservative attribution rules and current checks. The card reduction changed no server contract, ranking behavior,
social feature, schema, analytics collection, migration, deployment, or upstream
model execution.

[cn-readme]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/README.md
[mf-model]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/matrix_factorization/model.py#L19-L97
[mf-training]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/matrix_factorization/matrix_factorization.py#L27-L84
[ranking-guide]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/documentation/under-the-hood/ranking-notes.md#L53-L85
[gaussian]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/gaussian_scorer.py#L394-L760
[pseudo-raters]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/matrix_factorization/pseudo_raters.py#L52-L120
[note-ratings]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/note_ratings.py#L567-L730
[helpfulness]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/helpfulness_scores.py#L83-L234
[mf-base]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/mf_base_scorer.py#L758-L885
[pss]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/post_selection_similarity.py
[cliques]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/quasi_clique_detection.py#L16-L199
[clustering]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/run_scoring.py#L1480-L1492
[rules]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/scoring_rules.py
[status-history]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/note_status_history.py
[runner]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/runner.py#L306-L458
[pcrh]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/src/scoring/pcrh_model.py#L645-L889
[algorithm-readme]: https://github.com/twitter/the-algorithm/blob/c54bec0d4e029fe34926ef3258a86ccacc0d0182/README.md
[home-mixer]: https://github.com/twitter/the-algorithm/blob/c54bec0d4e029fe34926ef3258a86ccacc0d0182/home-mixer/README.md
[requirements]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/scoring/requirements.txt
[license]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/LICENSE
[third-party]: https://github.com/twitter/communitynotes/blob/93647eb9ad57642c05a9dc79fba9d6df42c5ae06/THIRD_PARTY_LICENSES
