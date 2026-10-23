# 02 — Blueprint content search and related terms

The matching rules and verification below describe the original v1 slice.
[Slice 11](11-search-relevance-and-scroll-header.md) supersedes its relevance
rules with phrase scoring, bounded typo tolerance and related-term updates,
and removes category tiles from native Explore.

**Status:** Implemented locally October 22, 2026; no deployment performed.  
**Depends on:** Existing authorized public catalog and paged native Explore.  
**Owner areas:** Server catalog matching/paging and native integration tests.  
**Follow-up:** [Actions and opt-in measurement](03-actions-and-measurement.md) are
implemented locally, followed by the [recommendation baseline](04-recommendation-baseline.md).
Coverage and baseline evaluation are next.

## Outcome

Someone types outdoors and finds a Blueprint containing a picnic or bonfire,
even when those words are absent from its name. Search also finds published
event titles, idea titles and idea notes. One result remains one Blueprint;
opening it uses the existing read-only preview. Creators need no topics,
hashtags, keyword forms or new category selection.

The [discovery decision](../../architecture/blueprint-led-discovery.md#simple-content-search)
is the product rule. Cards retain the [scan-first layout](01-blueprint-cards-and-highlights.md):
cover, title and optional creator byline. This slice adds no visible match
explanation or response field; actual event/idea detail remains in the preview.
Query-specific explanations are a separate optional enhancement.

## Implemented search projection

[`blueprint-discovery.ts`](../../../src/server/blueprints/services/blueprint-discovery.ts)
projects each entry already returned by the authorized public catalog:

- Blueprint name and the public discovery summary actually serialized in the
  response. Authored descriptions remain bounded to that public summary; search
  does not retrieve additional authoring/source rows.
- Supported `experience_tree@2` child event titles and stable child keys.
- Supported `ideas@2` titles and notes, stable idea keys and explicit main/child
  targets. Child targets must resolve in that revision's supported tree.
- Catalog key, category IDs/current English-Spanish labels and curated tags as
  lower-priority supporting metadata.

Module extraction uses the existing supported module schemas. Unsupported or
malformed module content is not crawled as arbitrary JSON. Source kind/key and
idea target kind are retained in the internal projection and snapshot digest;
they are not new public IDs or independently published items. No source
revision, definition or installation hash is rewritten.

The repository's catalog eligibility remains authoritative: only non-retired
curated revisions and the exact currently listed authored revision are supplied
to the search service. Private live-event data, saved-copy edits, draft rows,
newer unlisted revisions and bearer-link-only content are not search inputs.
The service never adds candidates outside that catalog.

## Matching and relevance

Search case-folds and removes accents, then tokenizes Unicode letters/numbers.
Matching uses whole words and contiguous normalized phrases. Punctuation
separates words; arbitrary substrings, fuzzy correction and general stemming
are not supported. Whitespace-empty queries retain ordinary browse order;
nonempty queries with no searchable words return no results.

The initial explicit aliases cover:

| Concept  | Accepted forms after case/accent folding     |
| -------- | -------------------------------------------- |
| Outdoors | outdoor, outdoors, aire libre, al aire libre |
| Picnic   | picnic, picnics                              |
| Camping  | camping, camp, acampada, acampar             |
| Garden   | garden, gardens, jardín, jardines            |
| Bonfire  | bonfire, bonfires, fogata, fogatas           |
| Wedding  | wedding, weddings, boda, bodas               |
| Birthday | birthday, birthdays, cumpleaños              |

A single directed related rule expands **outdoors → picnic, camping, garden,
bonfire**, including those concepts' explicit aliases. It applies once, without
recursive or reverse expansion: picnic does not implicitly find every outdoor
plan. These are retrieval hints, not claims about an entire plan. The map is
small and deliberate; this is not general English/Spanish translation.

Known multiword aliases are consumed as one concept. Alternatives within a
concept are ORed, while separate concepts require evidence in the same
Blueprint. Thus outdoor wedding still requires both concepts, and
al aire libre wedding does not accidentally require the separate words al/aire/libre.

For each concept, use its best source tier: direct/alias Blueprint name, then
direct/alias event/idea title, then public summary/idea note, then related-only
content, then direct supporting metadata. Related expansion does not operate
on metadata alone. Compare the weakest concept's tier first, then the sum and
sorted tiers; catalog key breaks ties. This keeps a name hit plus a tag from
beating direct content evidence for every concept. Query word order and repeated
content occurrences do not manufacture extra relevance credit.

The full-catalog legacy response and empty-query browse order are unchanged.
Query relevance does not depend on likes, installs, follows or analytics.

## Paging and native integration

The opaque version-1 cursor shape is retained. Its catalog digest now includes
the structured searchable projection, `content-search-v1`, and the actual alias
and related-term maps alongside the existing revision/hash/author/art metadata.
The cursor still binds query, category and page size, and its last key is located
in the deterministic query order. Relevant source or rule changes invalidate an
old snapshot rather than silently skip/repeat results. Existing pre-change
cursors require a restart. Malformed cursors remain 400; changed snapshots or
scope remain 409. Every request reloads current eligibility before paging.

Category filtering and matching category metadata remain supported; related
content cannot escape a selected category. See the
[pagination contract](../../architecture/explore-catalog-pagination.md).

The native public search path is `BlueprintExploreView` → `catalogPage` →
[`BlueprintCatalogFeedModel`](../../../../ios-apps/gatherory/Gatherory/Features/Blueprints/BlueprintCatalogFeed.swift).
It already preserves server relevance order and does not reapply the old local
metadata matcher, so no native production change was needed. Legacy local
matching helpers remain unused by the public paged results; recent history
keeps its existing separate behavior. New tests protect server-only nested
matches, page order/query/cursor forwarding, and rejection of a late page after
switching queries. A stale-cursor error uses the existing Retry refresh path,
which starts again without a cursor. Account changes recreate the feed.

## Verification and handoff — October 22

Three Luna agents handled server implementation/tests, native caller audit/tests,
and independent review. The parent reviewed and integrated their work, including
fixes for mixed-evidence ranking and Spanish/plural related matches.

- `pnpm test`: **684 passed, 47 skipped** across **107 passing/31 skipped files**;
  generated contract freshness passed. Opt-in integration suites remained skipped.
- A final category-scope regression was then added: **19 focused tests passed**
  across content-search and existing discovery suites. Production code did not
  change after the full run. The new search file contains 15 tests.
- `pnpm typecheck` passed after fixing a test fixture's excess property.
- Native simulator build and **37 tests in four suites passed**: discovery,
  navigation, preview content and preview sessions. Two new feed tests were added.
- Targeted formatting, local references and whitespace checks passed. No new
  display copy or portable schema was introduced, so regeneration/localization
  edits were not needed. No automated UI tests or live database tests ran.

Server fixtures cover field matching, whole-word boundaries, EN/ES aliases,
directed expansion, multi-concept intent and ranking, unsupported/malformed
content and orphan targets, source nonmutation, empty/punctuation-only queries,
category scope, stable tie paging and nested-content/scope cursor invalidation.
Eligibility was audited against existing repository filtering; this pure-search
change did not introduce database authorization logic.

Logs: `/tmp/gatherory-blueprint-content-search-tests-final.log`,
`/tmp/gatherory-blueprint-content-search-focused-final.log`,
`/tmp/gatherory-blueprint-content-search-typecheck-final.log`.
Native log: `/tmp/gatherory-blueprint-content-search-20261022-native.log`;
result: `/tmp/gatherory-blueprint-content-search-20261022.xcresult`.
Native [verification notes](../../../../ios-apps/gatherory/docs/testing-verification.md#blueprint-content-search--october-22-2026)
record the device and selected suites. No server deployment, phone installation,
new data collection, database change or release is implied. Actual signed-in
search/preview on a device remains runtime acceptance after compatible rollout.

## Deferrals and continuation

Defer match-explanation UI, required taxonomy, hashtag feeds, trending tags,
topic-following, full translation, spelling correction, embeddings, external
search services and live-event indexing. Nothing in this slice authorizes
Pinterest ingestion or recommendation training.

Continue with Blueprint-level likes, private bookmarks, Not interested and
trustworthy measurement. That slice must resolve source attribution through
private-copy installation before using receipt counts for ranking credit.
