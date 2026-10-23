# Blueprint-led discovery

**Direction accepted:** October 22, 2026; clarified October 22, 2026.  
**Current card direction:** scan-first, with a cover, prominent purpose-led title,
and a small optional creator byline. The existing card button opens the
read-only Blueprint preview.  
**Search implementation:** Published content search and bounded English/Spanish
aliases/related terms implemented locally October 22, 2026. No deployment
performed. Private actions and default-off recommendation measurement are also
implemented locally; categories remain internal.

## Product decision

Blueprints remain the main published and recommended object in Explore. People
scan cards to decide which plan is for them, so the title should say what
experience the Blueprint is for (for example, “Cottage Weekend” or “Backyard
Birthday Party”), supported by its cover artwork. Do not add title validation
or automatically rename published content, and do not inflate card metadata to
compensate for a vague title. Event and idea details belong
in the existing preview, where the complete plan can be explored before an
explicit setup action. Keep the card visually quiet: do not add category labels,
summaries, event/idea highlights, or a visible Preview Blueprint call to action.
The whole existing card button continues to open the preview.

Title and byline sit directly over the unblurred cover, with a smooth
contrast fade and no solid text tray. The artwork fills the card; larger text
can expand the layout.

A Blueprint may describe one dinner, a cottage weekend, or a wedding with
several events. Multiple child events are not a publication requirement. This
direction does not change executable content requirements, schema validation,
publication rules, or the separation between public Blueprint definitions and
private live-event content. Public discovery excludes unlisted-link content.

| Surface           | Responsibility                                                                      | Interaction                                                 |
| ----------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Explore card      | Show the Blueprint cover, prominent purpose-led title, and optional creator byline. | Tap the existing card button to open the read-only preview. |
| Blueprint preview | Reveal the complete published plan, including its events and ideas.                 | Use the existing explicit setup/install flow when ready.    |

Opening or dismissing a read-only surface creates no live event, draft,
membership, RSVP, vote, or social action. Existing [publication and copy
boundaries](experience-blueprints.md) remain authoritative.

## Simple content search

People should be able to type a familiar term such as outdoors and find useful
Blueprints without knowing catalog category names. Creators continue to name
and describe their plan and add events and ideas as usual. Do not require a new
category, topic, keyword, or hashtag-selection step to publish or be discovered.

The implemented search slice searches the public Blueprint name/summary,
published child-event titles, and published idea titles and notes. A bounded,
one-hop related-term map lets outdoors find picnic, camping, garden, or bonfire
content, including explicit English/Spanish aliases and selected plurals. Related terms provide retrieval evidence; they do not certify
that a whole plan is outdoors or change its event type. Prefer direct relevant
matches over weak contextual associations.

Keep existing category IDs and curated tags as internal metadata and
compatibility fields. Explore removes category tiles and presents search
followed directly by Blueprint cards. Creators do not need to classify a plan.
The [search relevance follow-up](../roadmaps/blueprint-ranking-roadmap/11-search-relevance-and-scroll-header.md)
adds phrase specificity, bounded typo repair, evaluated related terms, and a
standard native navigation title, profile toolbar action, and system search field.
Hashtag syntax, trending tags, and
topic-following are not part of the accepted direction. A result remains one
Blueprint. Cards remain unchanged and the existing preview reveals the source
content; no visible match explanation or new response field was added. Any later
query-specific explanation belongs in search context, not general browse cards.

Only public published content may enter discovery search. Private live-event
notes, guests, saved-copy edits, drafts, and bearer-link-only content are not
index inputs. The [content search slice](../roadmaps/blueprint-ranking-roadmap/02-content-search-and-related-terms.md)
owns matching, explanations, bilingual behavior, and cursor compatibility.

## Private Blueprint actions and measurement

The [unseen-first discovery slice](../roadmaps/blueprint-ranking-roadmap/16-unseen-first-discovery.md)
adds local account-scoped view history for unfiltered Explore. Actual qualifying
card views inform the next frozen browse session; fetched/offscreen cards do not.
Unseen Blueprints precede cooldown repeats without moving the current feed.
Typed search keeps its existing relevance and ignores freshness history. This
personalization is separate from default-off analytics and aggregate engagement
weights, and does not enable analytics collection or cross-device history sync.

Card context menus and the preview toolbar offer independent Like, Bookmark and
Not interested actions. Saved Blueprints retain references to current public
publications; unavailable sources show a removable generic row. Hidden management
reverses Not interested. Hiding applies to browse/category feeds before paging,
while explicit search, saved references and recents stay reachable. No public
counters or additional card details were introduced.

Recommendation measurement has its own account opt-in, off by default. Organic
impressions require half the card visible for one second in the active foreground
surface; explicit opens are separate. Server-bound exposures, daily contribution
limits, exact unchanged-copy attribution, opt-out deletion and 30-day retention
are detailed in [slice 03](../roadmaps/blueprint-ranking-roadmap/03-actions-and-measurement.md).
The [offline evaluation and source audit](../roadmaps/blueprint-ranking-roadmap/05-baseline-evaluation-and-signal-readiness.md)
records ordering tradeoffs and required coverage, pairing, retention and deletion
gates. Private preferences are current state, separate from consented telemetry;
pooled ranking use is not implied. The subsequent
[measurement report/checks](../roadmaps/blueprint-ranking-roadmap/06-measurement-readiness-report-and-attribution-checks.md)
add an internal aggregate-only read-only diagnostic and native copy/install
checks. These records do not carry ranking weights or establish quality. The separate
[recommendation baseline](../roadmaps/blueprint-ranking-roadmap/04-recommendation-baseline.md)
uses explicit editorial priorities, creator diversity and recent-publication
opportunity within identical search relevance groups. Native paged requests
opt in; legacy ordering remains available. No additional card detail is added.
The [measurement cleanup and baseline v2](../roadmaps/blueprint-ranking-roadmap/07-measurement-cleanup-and-new-item-opportunities.md)
adds server acceptance order, exact prior-impression pairing and opt-in daily
serving diagnostics; its promotion-only new-item rule preserves naturally high
recent entries. [Personal Like ranking](../roadmaps/blueprint-ranking-roadmap/08-personal-like-ranking.md)
now uses only the requesting account's exact current public Likes for bounded
lexical content affinity, independent of measurement consent. Bookmarks and
measured events have no ranking influence. No creator/popularity affinity is used.
The [v2 precision rule](../roadmaps/blueprint-ranking-roadmap/09-personal-like-precision.md)
weights names/child titles above summary/notes, requires title evidence corroborated
by non-notes text, and normalizes commonness-adjusted overlap. It preserves relevance
and baseline fallback. Wedding diagnostic boosts fall 11 to 4; fresh-challenge
precision/recall equal v1, so general usefulness remains unverified. A typed stale continuation restarts the native feed once from page one.

## Native Blueprint library collections

The accepted native follow-up keeps the library title **Blueprints** and gives people visible **Yours**, **Saved** and **Liked** filters. Yours contains the account’s editable authored and copied plans. Saved bookmarks and Liked are independent account-scoped references to public publications; a source can appear in both, and each opens the existing read-only preview. Removing a bookmark does not unlike, and unliking does not remove a bookmark. Not interested remains managed separately in Account. This navigation slice does not add ranking signals or change Explore ordering. See the [library collections roadmap](../roadmaps/blueprint-ranking-roadmap/10-blueprint-library-collections.md) for data boundaries and acceptance checks. Implemented locally; targeted native tests, web/server checks, localization checks, and simulator Release build passed. Xcode Canvas crashed; live device/VoiceOver and visual acceptance remain pending. See the library collections roadmap for review details.

## Later work

This card decision does not change feed order, pagination, ads, or ranking. It
does not require likes, private bookmarks, follows, creator profiles, social
counters, analytics collection, taxonomy, or standalone event/idea posts.
Blueprint-level actions and reliable measurement are implemented as their own
contract slice. Signal-derived ranking changes require evaluated evidence. The initial
deterministic baseline already preserves relevance, stable paging and a bounded
opportunity for recently published authored Blueprints. Optional event/idea spotlights
are a separate future experiment and must remain tied to an eligible public
parent.

The [living roadmap](../roadmaps/blueprint-ranking-roadmap/README.md) owns
delivery status and later sequencing. A previous local experiment rendered
published event/idea highlights in cards and recorded corresponding tests and
visual checks. That experiment is superseded by this title-led card direction;
its historical evidence is documented in the [first-slice record](../roadmaps/blueprint-ranking-roadmap/01-blueprint-cards-and-highlights.md#superseded-highlight-prototype-history),
not current behavior. Nothing here asserts a server rollout or phone release.
