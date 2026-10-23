# Personal Like ranking precision

**Status:** Implemented and evaluated locally, October 22, 2026.
This follows [08 — Personal Like-based ranking](08-personal-like-ranking.md).
Three Luna agents handled the pure policy, independently authored fixtures/evaluation,
and public-field/cursor integration. The parent reviewed and verified the result.
The known shared-copy diagnostic improves; the fresh challenge shows no overall
precision/recall gain over v1. Production usefulness remains unverified. No shared
database reset, deployment or device release occurred.

## Problem and comparison protocol

The original Like heuristic flattened public names, summaries, event titles and
idea titles/notes into one token set. Shared planning language could create a
match without shared intent. One Wedding Like boosted 11 of 16 other curated
plans, with nine reaching the score cap. A City Break received score 3 through
incidental budget, dietary and food-options wording.

Compare four fixed policies on identical candidates and frozen time:

1. Nonpersonal editorial/diversity/recent-opportunity baseline v2.
2. Frozen personal Like v1, with the original flat content and scoring rule.
3. Frozen initial v2 candidate, rejected for excessive loss of relevant matches.
4. Final role-aware personal Like v2.

The [frozen v1 policy](../../../tests/fixtures/blueprint-like-affinity-v1.ts)
records original source SHA-256
`cd21a91a4df115f976bdbabc9d4b5ce4a4c2c8dec9407e0c9f61239130551b1e`.
The [original evaluator](../../../scripts/evaluate-blueprint-personal-likes.ts)
imports that snapshot, preserving its [historical artifact](artifacts/personal-like-evaluation.json).
The [frozen initial v2 policy](../../../tests/fixtures/blueprint-like-affinity-v2-initial.ts)
records original source SHA-256
`18666aa462b0dac5f50860a8afd226db60e53c5d2d383912d4edf2ed1dd912d9`;
the snapshot file additionally contains its provenance header. Its
[initial evaluator](../../../scripts/evaluate-blueprint-personal-like-tuning.ts)
and [artifact](artifacts/personal-like-tuning-evaluation.json) preserve the failed
coverage experiment. The nonpersonal baseline and original v1 artifact are unchanged.

A separate agent authored fictional content and pair judgments before tuning.
Development data informed policy selection. An initial validation set exposed
coverage failures and therefore informed the revision; it is no longer an
independent final test. A fresh challenge was frozen before choosing the final
formula/threshold and withheld from the policy agent. No policy or label tuning
followed its result. Curated repository content remains an unlabeled diagnostic.

## Final policy and integration

Policy `blueprint-personal-likes-v2` keeps public fields separate:

| Public field          | Strongest token weight | Can anchor shared intent?                 |
| --------------------- | ---------------------: | ----------------------------------------- |
| Blueprint name        |                      3 | Yes                                       |
| Published event title |                      2 | Yes                                       |
| Published idea title  |                      2 | Yes                                       |
| Summary               |                      1 | Can corroborate a title on the other side |
| Published idea notes  |                    0.5 | Supporting overlap only                   |

Use the existing small EN/ES alias and stopword rules. Each distinct token gets
its strongest field weight; repetition and appearance in multiple fields do not
add weight. Retain at most 64 terms by descending field weight, then codepoint
lexical order. Notes cannot evict stronger title evidence.

For each currently public source corpus, count each bounded source vector once.
With `N` valid sources and document frequency `df(t)`, use
`idf(t) = ln(1 + N / (1 + df(t)))`. Multiply field weight by IDF. This measures
public-content commonness, not user popularity. No fixture-specific blacklist or
new topic dictionary was introduced.

A pair needs at least two distinct shared meaningful terms. At least one shared
term must appear in a name/event title/idea title on one side and in a non-notes
field on both sides. Title-to-summary evidence can qualify; summary-to-summary
alone and title-to-notes-only evidence cannot anchor a match. Notes can still
support a pair that otherwise qualifies.

Compute weighted Jaccard: sum of per-term minimum vector weights divided by sum
of per-term maximum weights. Similarity below **0.03** contributes zero; otherwise
pair score is three times similarity. Take the **maximum** qualifying seed score,
rather than accumulating weak similarities across Likes. Scores remain 0–3.
The final policy fingerprint is
`c7f7218e57aa1717dbf840a6e61cc23e2ee50ee60ba7a645512bb4e221ae4204`.
Weights, threshold, normalization/dictionaries, frequency calculation, anchor
rule, caps and aggregation are versioned in this fingerprint.

The initial candidate required an identity-field anchor on both sides and used
0.05. It cut unrelated matches but lost too many relevant matches. The final
revision permits title/summary corroboration and uses the rounded 0.03 threshold;
it boosts 17 relevant development pairs versus v1's 21 while reducing unrelated
matches from 14 to 9. These development counts guided selection, rather than
serving as independent evidence of generalization.

The server extracts these roles from the existing safe public catalog projection.
No category, tag, creator identity, private content, bookmark, install or other
account's Like becomes an affinity feature. Only own current exact public Likes
seed ranking, independently of measurement opt-in. Unlike, hiding, ineligibility
and revision/hash mismatch invalidate seeds; at most 50 exact Likes seed the
profile. Already liked sources receive no target boost. The existing eligibility,
relevance, editorial priority, creator diversity and recent-promotion rules remain.
A zero score leaves the Blueprint eligible in baseline order.

The wire request stays `ranking=baseline_v1`; response metadata identifies the
actual personal-v2 policy. Private role vectors/scores are not serialized to
cards. Policy/configuration and private-profile bindings invalidate incompatible
cursors even if ordering is unchanged. A fixed v1 cursor regression verifies
this boundary. Existing [native one-time cursor recovery](../../../../ios-apps/gatherory/docs/explore-performance.md)
requires no native code or wire change. The off switch
`BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED=false` still selects baseline v2.
No schema or measurement reset is needed. Cards remain scan-first, with no
required categories, topics, keywords or hashtags.

## Broader fixtures and results

The three fictional corpora contain 101 plans and 465 pair judgments. They are
separate catalogs with separate document frequencies, not one pooled dataset.
Labels describe intent-family relevance with selected ambiguous adjacent formats;
they are authored synthetic judgments, not independent reviewers or observed user
preferences. Pairs sharing a seed are correlated. Ambiguous predictions are
excluded from strict precision and counted as incorrect in conservative precision.

| Corpus           | Plans / seeds / pairs | Relevant / ambiguous / unrelated pairs | Role in selection                  |
| ---------------- | --------------------- | -------------------------------------- | ---------------------------------- |
| Development      | 49 / 6 / 288          | 43 / 65 / 180                          | Used to choose rule                |
| Prior validation | 24 / 3 / 69           | 21 / 16 / 32                           | Coverage failure informed revision |
| Fresh challenge  | 28 / 4 / 108          | 16 / 32 / 60                           | Frozen before final lock           |

[Development](../../../tests/fixtures/blueprint-personal-like-development.ts)
covers wedding, birthday, food/dietary needs, camping, crafts and generic logistics;
it includes English, Spanish, mixed and low-information content. Canonical hash:
`31309b41556e52ddb5a6a1121b1150780eb012aadd5787192bc048b4bc74ca7b`.
One intended notes-only ceramic example also shares “studio” in event titles.
Its content/label was preserved; a separate unlabeled boundary probe verifies
clean notes-only rejection. Do not describe that labeled example as notes-only.

[Prior validation](../../../tests/fixtures/blueprint-personal-like-heldout.ts)
was authored before the first lock; only a TypeScript narrowing annotation changed
subsequently. Canonical content/label hash:
`b8bab4bb4f69e6ceacb12cca33e44ae2f5a1cbaa95f5ddf0e35a7f07bc5493cc`.
The initial candidate retained only 2 of v1's 9 relevant matches and matched no
Spanish candidates. This failed coverage check motivated the revision.

[Fresh challenge](../../../tests/fixtures/blueprint-personal-like-challenge.ts)
introduces book circles, tabletop games, live music and plant/seed exchanges,
with 13 English and 15 Spanish plans and three Spanish seed profiles. Canonical hash:
`9c446f787b1e8dc773cf4c5930ad9d56b876d4eb8e4ebe25e28bbb10700291c1`.
No challenge-specific vocabulary was added to production.

| Corpus / policy             | Relevant boosted | Unrelated boosted | Ambiguous boosted | Strict precision | Relevant boost recall |
| --------------------------- | ---------------: | ----------------: | ----------------: | ---------------: | --------------------: |
| Development v1              |               21 |                14 |                10 |            60.0% |                 48.8% |
| Development initial v2      |               11 |                 5 |                 1 |            68.8% |                 25.6% |
| Development final v2        |               17 |                 9 |                 5 |            65.4% |                 39.5% |
| Prior validation v1         |                9 |                 2 |                 3 |            81.8% |                 42.9% |
| Prior validation initial v2 |                2 |                 0 |                 0 |           100.0% |                  9.5% |
| Prior validation final v2   |                9 |                 0 |                 2 |           100.0% |                 42.9% |
| Fresh challenge v1          |                7 |                 4 |                 2 |            63.6% |                 43.8% |
| Fresh challenge initial v2  |                6 |                 2 |                 1 |            75.0% |                 37.5% |
| Fresh challenge final v2    |                7 |                 4 |                 1 |            63.6% |                 43.8% |

**The fresh challenge does not show a general strict precision or recall gain
over v1.** Conservative precision changes from 53.8% to 58.3% because one fewer
ambiguous pair is boosted. Both rules boost five relevant and two unrelated
Spanish candidates. All four final seed profiles have a boost, but one Spanish
seed has no boosted Spanish-language candidate. Cross-language paraphrases and
body-only intent remain weak; a smaller boost set alone is not success.

The nonpersonal control has no affinity predictions, so pair precision/recall
are not applicable. Compare its ranked relevant share separately, treating
ambiguous candidates as non-relevant:

| Fresh challenge policy  | Relevant @3 | Relevant @5 | Relevant @10 |
| ----------------------- | ----------: | ----------: | -----------: |
| Nonpersonal baseline v2 |       25.0% |       20.0% |        17.5% |
| Personal v1             |       58.3% |       45.0% |        22.5% |
| Initial v2              |       50.0% |       40.0% |        22.5% |
| Final v2                |       58.3% |       45.0% |        22.5% |

These are small fixture ordering diagnostics, not causal uplift or population
estimates. Full per-profile, language, coverage and ranking results are in the
[final artifact](artifacts/personal-like-precision-evaluation.json).

## Curated diagnostic and verification

On the separate 17-plan curated catalog, one Wedding Like boosts 11 candidates
under v1, two under initial v2, and four under final v2. The incidental
`shared_city_break` score falls from 3 to 0. Nine v1 scores saturated at 3;
none do under final v2 (maximum approximately 0.2013). Final top-ten membership
matches the nonpersonal baseline, with two positions changed. This corpus is
unlabeled: neither fewer boosts nor baseline agreement proves relevance.

Actual final-policy and baseline cursor traversal at page sizes 1, 2, 3, 7 and 20
is complete, stable, duplicate-free and matches direct ranking. No-history order,
exact seed binding, liked-target exclusion, relevance separation, creator/recent
constraints, account separation, undo/revision behavior, measurement independence
and kill switches remain covered by unit and PostgreSQL checks. The evaluator
fails if its invariants fail, before writing or checking an artifact.

Reproduce the four versioned artifacts with:

```sh
pnpm exec tsx scripts/evaluate-blueprint-ranking.ts --check
pnpm exec tsx scripts/evaluate-blueprint-personal-likes.ts --check
pnpm exec tsx scripts/evaluate-blueprint-personal-like-tuning.ts --check
pnpm exec tsx scripts/evaluate-blueprint-personal-like-precision.ts --check
```

Final validation passed:

- `pnpm test`: 770 passed, 54 skipped; 118 test files passed, 36 skipped. Contract
  schema generation/check is part of this command.
- `pnpm typecheck`: passed.
- PostgreSQL integration: eight tests in six files covering personal ranking,
  discovery actions, measurement readiness, ranking metadata, copy attribution
  and curated covers. Run with `RUN_BLUEPRINT_DB_TESTS=1` and a disposable
  `DATABASE_URL`. Existing migrations applied successfully to local PostgreSQL 18.
- All four artifact `--check` commands above passed. Baseline, v1 and initial-v2
  evidence remains reproducible independently of the final policy.
- Targeted Prettier check and both repositories' `git diff --check` passed.
  All 347 local documentation links checked resolve.
- Native/web copy fixtures remain byte-identical at 289,631 bytes. No native
  code changed; native simulator results in 08 are historical, not rerun here.

The disposable PostgreSQL container was removed after testing. No shared database
was touched. No schema or reset migration was added for this slice.

## What to build next

Keep this versioned, reversible heuristic and its baseline control. Before claiming
recommendation improvement, collect a reviewable real-public-content corpus,
predeclare relevance judgments with multiple human reviewers, and examine
Spanish-to-Spanish and cross-language coverage, semantic paraphrases, and intent
expressed only in descriptions. Preserve these frozen sets; further threshold
selection needs a new independent test. Do not add a creator taxonomy or fit a
larger alias list to this challenge as a substitute for relevance evidence.

Operational measurement coverage, consent/lifecycle integrity and outcome evidence
remain gates for pooled bookmark/install weights. A successful copy still proves
copying, not event quality. Any later randomized feature-on evaluation needs its
own assignment, power and rollback plan; this offline task establishes none.
