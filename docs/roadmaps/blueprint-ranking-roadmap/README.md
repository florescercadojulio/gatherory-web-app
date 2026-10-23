# Blueprint discovery and community ranking

**Status:** Cards, content search, actions, opt-in measurement and recommendation baseline implemented locally; offline evaluation and signal-readiness audit complete. Measurement cleanup, report v2, promotion-only baseline v2 and the personal Like candidate are implemented locally; role-aware Like tuning and broader fixture evaluation are complete. Slice 13's context-specific preview actions are implemented locally; focused native and simulator visual checks passed. The known shared-copy diagnostic improves; the fresh challenge shows no overall precision/recall gain over v1. Production usefulness remains unverified.  
**Priority:** Blueprint-led discovery first; no delivery date committed.  
**Requested:** October 22, 2026: investigate Twitter Community Notes code for
Blueprint ranking and document suggestions using smaller Luna agents. The user
subsequently accepted scan-first Blueprint cards and content/related-term search
without required taxonomy, then requested private Blueprint actions and opt-in
measurement and a deterministic baseline, then baseline/signal-readiness evaluation. Own-account Like affinity is implemented; pooled engagement ranking remains planned.  
**Owner areas:** Public Blueprint catalog, native Explore/Blueprints, server
discovery contracts and workflows.  
**Current stopping point:** Blueprint-led discovery is the accepted product
direction. [01 — Scan-first Blueprint cards](01-blueprint-cards-and-highlights.md)
records the current card direction and superseded highlight-prototype history.
[02 — Content search and related terms](02-content-search-and-related-terms.md)
is implemented locally with nested public content, bounded bilingual aliases and
query relevance. [03 — Actions and measurement](03-actions-and-measurement.md)
adds private likes/bookmarks/hiding, explicit opt-in measurement and verified
saved-copy adoption. [04 — Recommendation baseline](04-recommendation-baseline.md)
adds explicit editorial priorities, creator diversity and bounded recent-authored
opportunity behind a paged capability. [05 — Baseline evaluation and signal readiness](05-baseline-evaluation-and-signal-readiness.md)
adds a reproducible offline artifact and source audit.
[06 — Measurement readiness report and attribution checks](06-measurement-readiness-report-and-attribution-checks.md)
adds a bounded read-only report and actual native snapshot/copy/install checks.
[07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md)
adds authoritative server acceptance order, exact pairing, opt-in serving diagnostics
and a promotion-only policy that preserves naturally high recent items.
[08 — Personal Like-based ranking](08-personal-like-ranking.md) implements a bounded
lexical content rule, account-scoped cursor invalidation, native disclosure and
stale-cursor recovery. Its offline comparison preserves relevance and baseline
fallback but finds broad matches in shared planning copy.
[09 — Personal Like ranking precision](09-personal-like-precision.md) adds role-weighted,
commonness-adjusted overlap and broader development/validation/challenge fixtures.
Wedding diagnostic boosts fall from 11 to 4; fresh-challenge precision/recall equal
v1. The native library follow-up is recorded in [14 — Unified Yours library](14-unified-yours-library.md): Yours/Saved/Liked are aligned primary filters, with personal working Blueprints and setup recovery unified in Yours. Implemented locally; library/recovery unit and Light/Dark simulator UI checks passed. Slice 10 records the earlier collection design and is superseded for current Yours navigation. Explore ranking is unchanged. Next review real public content and multilingual relevance with human judgments;
operational coverage and outcome evidence remain gates for pooled engagement weights. No backend rollout or device release occurred; new
measurement collection defaults off. Device-local unseen-first personalization
is separate and does not require analytics opt-in.

[11 — Search relevance and Explore header](11-search-relevance-and-scroll-header.md)
adds exact-name/phrase scoring, bounded typo correction and related terms,
evaluated against frozen v1 across 38 synthetic query cases. Explore removes
category tiles and retains the standard native title, profile toolbar action,
and system search field.
The experimental search-header redesign was reverted at the user’s request;
the standard native search layout is retained. Card image-loading, offscreen-return and inactive-slot spacing checks pass in
light and dark mode; the final Release simulator build passed. The comparison is
tuning-reviewed evidence rather than a blind production-quality estimate.

[12 — Ads-enabled Explore stability](12-ads-enabled-feed-stability.md) adds
prefetch and below-viewport admission, measured slot reservations, and preview
suspension without clearing unexpired inventory. Real Google SDK samples passed
Light/Dark paging and preview-return checks, with accessibility text and ad-free
card regressions: 38 tests, followed by a 9-test arrival/policy check with
overlapping placement coverage. The native validator reports no implementation
issues in the inspected sample captures. This uses a local catalog and Google's
sample app/unit pair; Gatherory UMP, physical devices and production catalog
acceptance remain separate. Production advertising stays disabled.

[13 — Discovery and library actions](13-discovery-and-library-actions.md)
aligns Search and profile using native inline-large toolbar presentation and
adds explicit discovery, Saved/Liked, Yours and shared-link preview contexts.
Public previews are read-only; preferences do not create copies, and explicit
Use prepares or resumes a local working copy before existing setup. Saved/Liked
offer Use, shared links retain direct Use, and Yours keeps personal editing.
Implemented locally; 58 focused unit methods and four UI methods passed,
including Light/Dark controls and the local Save → Saved → Use → Yours journey.
A temporary DEBUG fixture covers the local working-copy helper and does not
verify setup, server or canonical import. Accessibility XXXL read-only controls
passed, with existing event-picker label truncation recorded in slice 13.

[14 — Unified Yours library](14-unified-yours-library.md) records the accepted local change: personal working Blueprints and setup recovery appear together in Yours, with Saved and Liked as aligned primary filters. Native unit and Light/Dark simulator UI checks passed; the slice records exact results and limits.

[15 — Single Blueprint preview and event creation](15-single-preview-and-event-creation.md)
combines the main event, related events and masonry ideas across public contexts
and Yours. Yours now opens full screen like Liked, with native bottom-toolbar Use/Add
and direct taps into existing sheet editors. Blueprint Decide and Edit mode
are removed; Decide belongs to created events/workspaces. Library card covers
match their preview content. New plans include authored content without legacy
Love responses; existing selections and confirmed schedules are preserved.
Current verification uses standard Light/Dark layouts and exercises Use through
the real native import/navigation path, including unchanged-request retry.
Disposable PostgreSQL workflow tests verify copied content and replay without
duplicate provisioning. The slice links exact verification bundles and retains
deployed-account, media-transfer and device acceptance as the next gate.

[16 — Unseen-first discovery](16-unseen-first-discovery.md) adds bounded
device-local view history, a 24-hour repeat cooldown and frozen browse sessions.
Only meaningful visible cards enter history; returning from a preview or a quick
tab switch preserves the current feed. Explicit refresh or return after 30 minutes
away starts another session. Typed search ignores freshness context and retains
its relevance order. The slice links pinned Twitter/X/Bluesky source research,
repeated-visit evaluation and native/server verification. No deployment is implied.

## Outcome and product direction

Help people discover Blueprints they can use for their own events, and help
useful creators reach the right audience. The user described a social platform
built around Gatherory; public reusable plans are the discovery objects.
Private event collaboration continues to have its existing access boundaries.

The accepted [Blueprint-led discovery decision](../../architecture/blueprint-led-discovery.md)
keeps one Blueprint as the primary published/feed object. Cards show a cover,
prominent purpose-led title, and small optional creator byline; the existing
whole-card button opens the read-only preview for event/idea detail. Do not add
category labels, summaries, highlights, or a visible preview CTA. A Blueprint
can describe one dinner or a multi-event weekend; multiple child events are not
required. Later event/idea spotlight cards remain a separate experiment tied to
their public parent.

Search now uses content creators already publish: the public Blueprint
name/summary, child-event titles and idea titles/notes, with bounded related-term
matching so outdoors can find picnic or bonfire plans.
Keep category assignment and existing curated tags behind the scenes; category
tiles are removed from Explore. No topic picker, keyword form,
hashtag requirement, or creator-managed taxonomy is needed for discovery.

Optimize for useful independent planning starts and recipient-reported usefulness.
An installation proves successful copying, not that an event went well.
Time spent scrolling, clicks, and follower counts should not become the sole
objective. Blueprint likes, private bookmarks, and Not interested are implemented in the
actions/measurement slice without changing ranking. Follows, reviews, and creator profiles remain
later extensions; none is required to prove the initial discovery presentation.

The [source research](../../research/blueprint-ranking-community-notes-2026-10-22.md)
explains what Community Notes can contribute, with pinned files and functions.
The product hierarchy and initial query relevance are implemented; initial editorial/diversity/opportunity baseline is implemented; engagement
features and later model choices remain proposals. None is an upstream default.

## Current state

- The accepted card direction is scan-first and title-led. The earlier local
  event/idea-highlight prototype, its projection/tests, and preview localization
  are superseded history, not current behavior. See slice 01 for its historical
  verification record and current build/visual validation.
- Discovery accepts curated publications and the exact publicly listed revision
  of an authored Blueprint. Private drafts, owner-only revisions, saved private
  copies, and unlisted links do not become public catalog candidates.
- Search includes published event titles and idea titles/notes as well as the
  public name/summary. Whole-word/phrase concepts, explicit EN/ES aliases and one
  directed outdoors expansion replace arbitrary substring matching. Direct
  content outranks loose relations/supporting metadata; all concepts must match.
- The catalog deduplicates by key and pages in memory. Legacy empty browse retains key
  order; query results use deterministic relevance with key ties. Explicit
  `baseline_v1` requests apply the versioned slice-07 policy within equal relevance groups. The
  [pagination contract](../../architecture/explore-catalog-pagination.md) binds
  source projections, actual dictionaries, rule version, filters and page size.
  Native paged results preserve server matches/order without a local re-filter.
  No response fields, explanatory card text or new taxonomy were added.
- Installation is idempotent and produces durable receipts. Native setup installs
  a private saved copy, so its receipt often identifies that copy rather than
  the public source. The copy's client-origin source marker is insufficient for
  trusted ranking credit.
- Private account-scoped likes, bookmarks and Not interested, plus default-off
  organic impression/open measurement and verified acquisition/install attribution,
  are implemented in [slice 03](03-actions-and-measurement.md). Own current exact
  public Likes now inform personal content affinity, tuned in [09](09-personal-like-precision.md),
  independently of measurement opt-in. Bookmarks and measured events do not
  affect ordering. The deterministic baseline still uses editorial and
  publication metadata. There are no public counters, follows or quality ratings;
  existing image moderation does not constitute Blueprint content review.

## Target architecture

Use the existing [server architecture](../../architecture/server-architecture.md)
and [implementation guide](../../development/server-implementation-guide.md).
Keep authorization and ranking separate:

```text
Current public eligibility + plain-text query / optional browse scope
  -> candidate set
  -> published-content matching + versioned related-term rules
  -> later validated recommendation features
  -> deterministic order and bounded discovery opportunities
  -> current listing/retirement recheck + future adopted safety policies
  -> snapshot-bound page
```

Proposed ownership: schemas in `src/contracts/`; pure ranking rules alongside
`src/server/blueprints/services/blueprint-discovery.ts`; injected aggregate reads
and writes through repositories; workflow composition in the domain's existing
live bindings. Transport handlers authenticate and validate. PostgreSQL owns
authoritative attribution and feedback. Analytics is a measurement sink, not
authority to grant rank credit. The native client renders ranked organic entries
and reports authorized signals; ad insertion remains separate.

Heavy aggregation runs outside catalog requests. A published ranking snapshot
records algorithm/config version, input cutoff, source revisions, ordered keys,
and internal reason codes. Start with a scheduled/batch read model only when
there is a real collection and refresh requirement; no scheduler is created by
this plan. Failing refresh uses the last good snapshot or the deterministic
baseline. It never broadens catalog visibility.

## Implementation order

### 1. Keep Blueprint cards scan-first

The accepted card shows its cover/fallback, a prominent purpose-led title, and
an optional creator byline. The existing card button opens the read-only preview
for the complete plan and its event/idea detail. Do not add a category label,
summary, highlight, count, or visible preview CTA. See the [current card record](01-blueprint-cards-and-highlights.md)
and its explicitly superseded prototype history.

Keep ordering, paging, ad boundaries, and explicit setup/install behavior
unchanged. Small plans, missing artwork, localization, accessibility, and the
optional byline must work. Likes, bookmarks, and ranking changes are not
required for this slice.

### 2. Search published Blueprint content and related terms

Implemented locally: [02 — Content search and related terms](02-content-search-and-related-terms.md).
Search uses the exact public plan and its published event/idea content, with
internal source references and a small related-term map with explicit bilingual
aliases. Cards remain clean; source details are in the existing preview, with no
new visible match explanation. Searching
outdoors can find a lakeside picnic inside a cottage Blueprint without requiring
its creator to classify or hashtag it.

Preserve one result per Blueprint and all current visibility constraints. Keep
multi-term intent, bound expansion, prefer direct matches, and make corpus/rule
changes invalidate incompatible cursors. Existing categories/tags remain internal
metadata and optional browse scope; no new taxonomy or social data is required.
Content search can improve before likes, measurement, or recommendations exist.

### 3. Add Blueprint actions and trustworthy measurement

Implemented locally: [03 — Actions and measurement](03-actions-and-measurement.md).
Private account-scoped preferences are available in card context menus and the
preview toolbar, with Saved Blueprints and reversible Hidden management.
Not interested suppresses browse/category results before pagination while
explicit search, bookmarks and recents remain available. Saved references
recheck the current public listing and grant no continued access.

Explicit opt-in defaults off. Qualified visible organic impressions and explicit
opens use short-lived actor/source-bound exposures, daily influence limits and
30-day retention. Server-verified unchanged-copy acquisition supports bounded
completed-install attribution. Opt-out purges telemetry/attribution while keeping
functional preferences. Cards remain uncluttered, and ordering remains the
existing deterministic content relevance/key baseline.

### 4. Establish a relevant, stable recommendation baseline

Implemented locally: [04 — Recommendation baseline](04-recommendation-baseline.md).
Paged clients explicitly request `ranking=baseline_v1`; native browse, category
and search do so. Existing clients and the full catalog keep their ordering.
The baseline applies explicit editorial priority and catalog-key ties, a soft
same-creator run cap, and a promotion-only cumulative recent-authored target
using `floor(global position * 0.1)`. Naturally high recent items count toward the
target and are never demoted. [07](07-measurement-cleanup-and-new-item-opportunities.md)
replaces the initial reservation policy with internal algorithm/configuration v2.
All rules stay within identical content-search relevance vectors; categories
and public eligibility constrain candidates before ordering.

First-publication metadata comes from immutable earliest revision history, so
republishing cannot refresh its age. This conservative proxy can undercount a
newly listed older private publication. Internal creator IDs never enter response
objects. Version-2 cursors freeze policy/configuration and `asOf` for up to 24
hours; incompatible catalog, actor, hide scope, configuration or mode restarts
with 409. The baseline uses deterministic request-time computation, with no
persistent snapshot table, aggregate job or model. An additive nullable exposure
policy label makes algorithm/configuration and position evaluation possible.

An explicit server kill switch, invalid configuration or policy failure retains
the existing content-relevance/key fallback. Mode changes invalidate continuation.
Cards, preview/copy/install, recents and ad boundaries remain independent.
Opt-in views, opens and qualified installs are bounded measurement; likes and
bookmarks are separate private current preference state, not a pooled evaluation
dataset. None has a ranking weight in this initial baseline. See 04 for exact choices, limits and checks.

### 5. Evaluate baseline and establish signal readiness

[05 — Baseline evaluation and signal readiness](05-baseline-evaluation-and-signal-readiness.md)
is complete as an offline/source evaluation. Its checked-in artifact compares
17 repository curated fixtures and eight synthetic scenarios in the current v2 artifact, with
relevance/key and editorial-only controls. Traversal is complete and stable;
creator diversity changes top-result concentration. The initial audit found that
reserved slots demoted some naturally high recent items and rounded up in small
groups. [07](07-measurement-cleanup-and-new-item-opportunities.md) resolves both
with the versioned promotion-only rule and preserves the original audit finding.
These are ordering findings, not measured usefulness or production uplift.

[06 — Measurement readiness report and attribution checks](06-measurement-readiness-report-and-attribution-checks.md)
implements the read-only report and native snapshot/copy/install matrix locally.
Its default mode is explicitly synthetic; database mode uses a loopback target
and one bounded repeatable-read, read-only snapshot. It separates analytic cutoff
from current read/retention time and does not claim coverage or readiness for weights.
[07](07-measurement-cleanup-and-new-item-opportunities.md) upgrades that report to v2: accepted sequence and
explicit prior-impression links replace transaction-time pairing; daily opt-in
serving counters expose quota denials for full UTC-day windows. Eligible sessions,
supported client versions and overall opt-in coverage remain unknown.
Daily impression/open credits can refer to different exposures, private current
preferences are not history, and accepted rows lack a complete coverage denominator.
Thirty-day exposure deletion cascades outcomes as a full 30-day cohort matures:
start with a predeclared seven-day diagnostic plus ingestion lag, or first redesign
retention/derived data. Preserve consent, withdrawal and deletion through reports.

The first personalization candidate is implemented in
[08 — Personal Like-based ranking](08-personal-like-ranking.md): own current exact
public Likes, bounded lexical overlap, no-history fallback and undo/revision
invalidation. [09 — Precision tuning](09-personal-like-precision.md) weights names
and child titles above summaries/notes, normalizes overlap, and limits common-word
influence. Broader results are mixed: fewer unrelated development boosts, but no
strict precision/recall gain on the fresh challenge. It remains an experimental
heuristic with unverified user usefulness. Pooled bookmark/adoption features require their own
purpose, evidence and lifecycle gates. Stable randomized account assignment,
power planning and a reversible test come before any claim of engagement uplift.

### 6. Experiment with spotlights and optional social personalization

After cards and measurement have been evaluated, test occasional
published event/idea spotlight cards. Each names its source Blueprint/creator,
opens the exact item in that Blueprint's context, and offers the whole plan.
Bound and deduplicate exposure by parent Blueprint so one source cannot occupy
a page through many children. There is no independent event/idea publishing,
partial installation, or item-level saving in this experiment.

When the product needs it, extend the Blueprint preferences from slice 3 with
opt-in interests, public follows, and creator pages as separate contracts.
Following someone grants no access to their events, private library, guests,
or unlisted links. A chosen creator name is not a globally unique account handle
or authorization identity.

Candidate sources could then include current search intent, internal content
similarities, followed creators'
public Blueprints, and relevant new public items. Add clear preference controls,
hide/mute behavior, and creator diversity. Do not infer a follow graph from
invitations, collaboration membership, or shared household planning. Retain a
useful non-personalized experience for signed-in people with no history.

### 7. Add conservative adoption and usefulness features

After attribution is valid, experiment with a bounded recent distinct-account
installation feature. A logarithmic transform can limit head-item dominance;
it is an adoption feature, not a quality estimate. Normalize within sufficiently
populated comparable categories/windows; fall back to a shared prior when small.
Never treat zero installs before exposure as evidence of poor quality.

Optional recipient feedback should ask about the Blueprint actually used, once
per account/source revision with edits and withdrawal allowed. An install is a
grounded eligibility check, not evidence of a real-world completed event. Decide
the feedback prompt timing and rating scale before building a form.

For an illustrative binary helpfulness model, let `h` be eligible positive
responses and `n` all eligible responses. A shrinkage estimate is:

```text
Q = (h + k * p0) / (n + k)
```

Here `p0` is a documented prior and `k` its effective evidence weight. These
parameters need calibration; they are not Community Notes constants. Publish
neither a quality badge nor a confidence claim below a justified sample threshold.
If experimenting with a Beta posterior lower quantile, state its independence
assumptions: correlated accounts make naive uncertainty estimates overconfident.
Keep exploration separate so cautious quality estimates do not bury new creators.

Within relevance tiers, compare this quality feature, bounded adoption, and a
small new-publication opportunity against the baseline in shadow mode. Set
weights only after checking feature distributions. Mere edits or republishing
must not reset first-listed age or erase poor revision-specific feedback.
Any adoption transfer across revisions needs an explicit tested policy; current
qualification records the exact source revision/hash. Quality feedback remains
revision-scoped until a tested transfer policy exists.

### 8. Introduce community trust models only when justified

First add idempotent feedback, self-rating exclusions, request limits, minimum
distinct-account evidence, and reasoned moderation decisions. Then test bounded
reviewer reliability and coordinated-influence features in shadow mode.

Use Community Notes matrix factorization or Gaussian aggregation only after
ratings span overlapping Blueprints and enough independent accounts to estimate
factors. There is no universal safe minimum borrowed from X. Compare held-out
performance and cohort coverage with the simple baseline. Keep model outputs
private during evaluation; correlated planners must not be automatically banned
or treated as low quality.

Any Python experiment should run separately against minimized eligible data,
produce versioned artifacts, and receive dependency/license review before code
is vendored. No production request should import or train those models.

## Signal collection and source attribution

The implemented [slice 03 contract](03-actions-and-measurement.md) establishes
source verification, explicit opt-in, expiry and conservative edited-copy rules. Keep
ranking eligibility distinct from installation permission: an authorized private
copy must still work even when it earns no public-discovery credit.

| Signal                               | Meaning and trust boundary                                                                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organic impression                   | A client-reported visible card, with server-issued exposure/snapshot reference, position, and source revision. Fetching a page is not an impression. Client visibility claims remain untrusted and rate-limited. |
| Detail open                          | An explicit open from an eligible organic item. Weak relevance evidence; never a quality vote.                                                                                                                   |
| Blueprint like/unlike                | Explicit preference for the Blueprint, with the viewed revision retained as context. No implied vote on a live event or independent proof of quality.                                                            |
| Private bookmark/unbookmark          | Intent to return to the public Blueprint; distinct from saving an independent setup copy. Bookmark lists are private and availability is rechecked.                                                              |
| Not interested                       | An account-scoped preference to reduce/suppress this Blueprint in recommendations, with reversible behavior. It is not a report or dislike of every category/idea it contains.                                   |
| Highlight open, if later interactive | Interest in an event/idea stable key within the exact Blueprint revision. Do not multiply parent impressions or manufacture a parent like/save.                                                                  |
| Private setup saved                  | A private working copy. It is neither a public bookmark nor proof of installation; omit from initial positive rank credit.                                                                                       |
| Qualified completed install          | A completed server receipt with a verified original public source, source revision/hash, and eligible discovery attribution. Deduplicate retries and cap each account's contribution per source/window.          |
| Explicit usefulness feedback, later  | An eligible recipient's answer about a specified immutable revision, with update/retraction semantics. Keep missing answers distinct from negative answers.                                                      |
| Report, later                        | A private safety signal, separate from Not interested. Reports enter a review process; raw volume alone cannot remove a competitor or create a quality verdict.                                                  |

For setup copies, persist verified attribution at acquisition: resolve the exact
original revision server-side, verify public listing at that time, bind the
discovery reference to the actor/source/hash, and retain it through independent
private copying and the eventual installation receipt. Define expiry and credit
rules for materially edited saved copies; an old source marker alone is not
proof the installed content still represents the public source.

Exclude self-installs, designated internal/test fixtures, failed/cancelled attempts,
retry replays, and bearer-link/private-only acquisition from the initial organic
ranking dataset. Resolve creator identity from server ownership, not a display
name. Multiple authenticated accounts do not prove multiple independent people;
describe counts as distinct accounts and retain bounded influence/rate limits.
Do not traverse unpublished lineage or private event data to manufacture public
popularity. Record only necessary private attribution, with explicit retention
and deletion behavior; public counters should suppress small samples.

For analytics, allow only public catalog references and coarse surface/rank
metadata. Never emit private keys, event/member/guest details, search text, source
event names, share tokens, signed URLs, or raw account/event IDs. Internal
account-linked attribution stays access-controlled in the product database.
The new recommendation measurement control is account-scoped and defaults off;
it governs this private product-database collection independently of existing
SDK analytics settings. Opt-out deletes telemetry and derived attribution. The
[release safeguards](../../release/v1-release-safeguards.md) still identify broader
production SDK consent and App Privacy review as pending; this control does not
complete that review. No external analytics export was added.

## Paging and immediate visibility changes

A ranked page must bind `algorithmVersion`, immutable `rankingSnapshotId`,
request filters/page size, and its position/tie-break into a new cursor version.
Later personalization also needs actor/experiment scope; never share a user's
ranked snapshot with another account. Use an opaque validated reference and
recheck authorization; a cursor is never an access credential.

Freeze score order within a snapshot. Revalidate current listing and retirement
at serving time. Blueprint-specific blocking and content moderation are proposed
extensions; once adopted, their restrictions must also apply at serving time.
Existing image/user-block infrastructure does not currently establish those
catalog filters. Skip removed entries and advance through the original order to
fill a page; do not insert newly eligible entries midway. Expired/incompatible
snapshots should produce an explicit restart conflict consistent with the current
409 recovery pattern. The current metadata digest alone cannot detect changing
adoption scores.

## Evaluation, acceptance, and rollout

The current offline findings and required report/experiment gates are in
[05](05-baseline-evaluation-and-signal-readiness.md). Production coverage and
outcomes remain unverified. Current schemas do not establish an eligible-session
denominator or a fully matured 30-day conversion cohort.

Use the deterministic baseline as the control. Predeclare a coherent account/source
opportunity denominator and bounded outcome horizon for qualified organic adoption;
subsequent optional usefulness feedback remains a future measure.
Report both numerator and denominator; clicks, save volume, and time spent are
diagnostics. Log position and assignment so comparisons can account for exposure
bias. A failure to install may mean no current need, not dislike. Test with
shadow results first and a small controlled allocation only after instrumentation
and eligibility checks are trusted. Do not declare gains from a handful of events.

Track category/language coverage, new-creator exposure, repeated-creator share,
report/hide outcomes, pagination errors, and latency alongside conversion. Long
planning cycles make immediate engagement an incomplete measure. Organic ranking
must not be influenced by ad impressions, ad clicks, or payment for an Event Pass.

Before a ranking slice is considered implemented, verify:

- Private/unlisted/draft/retired revisions never enter the candidate set, including
  through old cursors, installs, saved-copy lineage, or creator ownership.
- Source attribution survives private-copy installation without trusting a
  client-supplied source marker. Retries, self-installs, internal accounts, and
  link-only acquisition earn no duplicate/organic credit.
- Account switches invalidate in-flight signals and personalized cursors; deletion
  and feedback withdrawal update underlying records and rebuild aggregates under
  the documented retention policy.
- Ordering and exploration are deterministic for the snapshot, with no duplicate
  or skipped retained items as scores change between pages. Unlisting/removal
  takes effect immediately despite snapshot stability.
- Query/category relevance, bilingual matching, no-history behavior, sparse
  categories, small catalogs, and creator-diversity fallbacks remain useful.
- Published event/idea text and related terms remain searchable without required
  topics or hashtags. Nested matches explain their actual source and never
  imply that the entire Blueprint has an inferred property.
- Forged/replayed impression references cannot grant install or feedback credit.
  Analytics payloads contain no private content or credentials.
- A failed feature job or invalid model artifact falls back safely. Operators can
  disable ranked ordering without disabling Blueprint preview/copy/install.

Implementation should add focused Vitest rule/contract tests, disposable-database
tests for attribution/aggregation, and relevant native tests. Then run
`pnpm typecheck`, `pnpm test` (including contract freshness), and native checks
appropriate to changed contracts. Generate schemas when portable contracts change.
The original source investigation required no application checks; the implemented
card slice has the native build/test evidence linked in 01. Server/contract checks
remain required when those later slices change server behavior.

## Deferrals and next decision

The [Pinterest event-ideas proposal](../pinterest-event-ideas-roadmap/README.md)
is a separate private planning integration, conditional on provider permissions.
It does not supply Blueprint search content or recommendation signals and does
not replace the content-search slice below.

Defer large graph infrastructure, embeddings, online model training, public
leaderboards, paid boosts, automated reviewer punishments, public event activity,
and Community Notes status labels. None is necessary for the implemented content search. Keep the existing Blueprint/QR and mobile release acceptance gates
independent of this proposal.

The current card direction is scan-first and title-led; see [01 — Scan-first
Blueprint cards](01-blueprint-cards-and-highlights.md). Content search is
implemented locally and does not depend on social data or creator classification.
Blueprint actions, opt-in measurement and the deterministic recommendation
baseline are implemented locally. Offline evaluation and the source audit are
complete in [05](05-baseline-evaluation-and-signal-readiness.md). The [report and attribution checks in 06](06-measurement-readiness-report-and-attribution-checks.md)
are implemented locally. [07](07-measurement-cleanup-and-new-item-opportunities.md)
completes measurement cleanup and the promotion-only rule.
[08](08-personal-like-ranking.md) implements and compares the own-account Like
candidate. [09](09-personal-like-precision.md) tunes shared-copy matching and records
broader fixtures, including a fresh challenge with no overall gain over v1. Next
review multilingual and real-content relevance without fitting these frozen test
sets further, and verify operational coverage before pooled signal features;
publication and installation permission remain separate from ranking credit.

The initial editorial/diversity/opportunity policy is versioned in slice 04.
Later slices still need calibrated signal weights, a feedback prompt and minimum
evidence for public counts or quality labels. Those decisions do not block the
completed card slice or the content-search slice. Optional spotlight/follow experiments are not prerequisites for
adoption or quality work when evidence becomes available.

## Related sources and handoff

- [Blueprint-led discovery decision](../../architecture/blueprint-led-discovery.md)
- [01 — Scan-first Blueprint cards](01-blueprint-cards-and-highlights.md)
- [02 — Content search and related terms](02-content-search-and-related-terms.md)
- [03 — Actions and measurement](03-actions-and-measurement.md)
- [04 — Recommendation baseline](04-recommendation-baseline.md)
- [05 — Baseline evaluation and signal readiness](05-baseline-evaluation-and-signal-readiness.md)
- [06 — Measurement readiness report and attribution checks](06-measurement-readiness-report-and-attribution-checks.md)
- [07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md)
- [08 — Personal Like-based ranking](08-personal-like-ranking.md)
- [09 — Personal Like ranking precision](09-personal-like-precision.md)
- [Community Notes source audit](../../research/blueprint-ranking-community-notes-2026-10-22.md)
- [Existing Blueprint roadmap](../blueprints-roadmap/README.md)
- [Product and permission model](../../architecture/product-model.md)
- [Pagination contract](../../architecture/explore-catalog-pagination.md)
- [`blueprint-discovery.ts`](../../../src/server/blueprints/services/blueprint-discovery.ts)
- [`blueprint-copy.workflow.ts`](../../../src/server/blueprints/workflows/blueprint-copy.workflow.ts)
- [`blueprint-personal.repo.live.ts`](../../../src/server/blueprints/repos/blueprint-personal.repo.live.ts)
- [`install-blueprint.workflow.ts`](../../../src/server/blueprints/workflows/install-blueprint.workflow.ts)

Completed: source investigation/product decisions, title-led full-cover cards,
and published content search with bounded EN/ES matching and snapshot-safe query
relevance. Three Luna implementation/audit passes plus parent integration and
independent review completed the search slice. Web full tests/contracts passed
(684 passed, 47 skipped); a final category fixture passed with 19 focused tests,
with production code unchanged since the full run. Final typecheck and 37 native
search/navigation/preview tests passed. See 02 for exact logs, limits and staged
verification; earlier card-prototype results remain historical in 01.
That search slice changed no schema, dependency, database state, analytics
setting or deployment. The subsequent actions slice adds an additive migration
and a default-off measurement setting; see [03](03-actions-and-measurement.md)
for current verification. No shared database or physical-device acceptance is
claimed. The later offline evaluation is in 05; inspect the current diff and never infer
ranking credit from a saved copy's unverified source marker.

Validation: the discovery decision, first two specifications, research and
roadmap passed targeted Prettier checks. Local links, named references, and
heading anchors were verified; `git diff --check` passed. The earlier research
also verified pinned upstream source paths/line ranges. Existing index/onboarding
and Blueprint roadmap files received targeted updates without broad formatting.

Actions/measurement verification: web typecheck and full tests/contracts passed
(693 passed, 49 skipped), both new isolated PostgreSQL integration suites passed,
and the full native unit target passed 949 tests. The final consent retry change
then passed 42 focused native tests. Both additive migrations applied only to a
disposable database; its container was removed. See [03](03-actions-and-measurement.md#verification-and-handoff--october-22)
for exact logs, scope, maintenance, and remaining rollout/device checks.

Recommendation baseline verification: web typecheck and full tests/contracts
passed (710 passed, 50 skipped); final policy/paging checks passed 17 tests.
Three isolated PostgreSQL suites and the simulator app build plus 36 focused
native tests passed. The additive exposure-label migration was applied only to
the disposable database. No deployment occurred. See [04](04-recommendation-baseline.md#verification-and-handoff--october-22)
for exact scope, policy choices, logs and rollout order.

Offline evaluation/source audit: three Luna agents plus parent metric review
completed [05](05-baseline-evaluation-and-signal-readiness.md), with a repeatable
artifact, metric regression tests and ordered readiness gates. See its current
verification record. The subsequent
[report/checks slice](06-measurement-readiness-report-and-attribution-checks.md)
implements the local tool and cross-runtime attribution checks; see its current
verification evidence. Resume with authorized target coverage and the opportunity
policy decision. No engagement weights, production outcome or deployment claim
was added.

Measurement report/attribution checks: three Luna agents plus parent integration
completed [06](06-measurement-readiness-report-and-attribution-checks.md).
Final web typecheck and tests/contracts passed (737 passed, 53 skipped); seven
PostgreSQL tests in five suites and 40 native tests in four suites passed. The
read-only CLI was smoke-tested against the disposable database, which was removed.
All 17 curated native snapshots reproduce source hashes and pass copy/acquisition
checks; representative authored and cover-backed completed installs qualify.
No production data, new collection or ranking weight was introduced. Live coverage,
the opportunity policy and any future feature/experiment gates remain next.
