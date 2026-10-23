# Unseen-first discovery and stable browsing sessions

Implemented locally on October 23, 2026. Validation results below distinguish
server policy fixtures, native UI behavior and remaining deployment acceptance.

## User-facing behavior

Explore's unfiltered feed should offer unseen Blueprints near the top when
enough eligible inventory exists. New to the viewer is independent of publication
age. Seeing a card updates the next browsing session; the current feed does not
move while the person scans it or returns from a preview.

A quick tab switch or preview return preserves the session and loaded page.
The native toolbar Refresh button deliberately starts another session. Returning after at least
30 minutes away starts another session. Foreground reading and pagination do
not renew a session merely because time passed. Session ordering remains subject
to current public eligibility, preference changes and catalog updates; it is not
a retained server copy of withdrawn listings.

Typed search ignores freshness history completely. Exact names/phrases, related
terms, typo tolerance and existing relevance groups keep their current order.
Previously seen matching Blueprints remain findable. Saved, Liked and Recently
Viewed are reference/history surfaces and do not use unseen-first ordering.

## Initial policy

| Rule               | Initial value                                                   |
| ------------------ | --------------------------------------------------------------- |
| Meaningful view    | At least 50% visible continuously for one second                |
| History            | Device-local, exact account, at most 200 Blueprint keys         |
| History retention  | 30 days; expired or future records are removed                  |
| Context payload    | At most 16,384 UTF-8 bytes; long histories use a bounded prefix |
| Repeat cooldown    | 24 hours; exactly 24 hours is cooled                            |
| New browse session | Explicit refresh, or return after 30 minutes away               |
| Paging expiry      | Existing ranked cursor expiry of 24 hours                       |

Only active, uncovered browse cards count. Fetched pages, offscreen cards, ads,
typed results, previews and Account overlays do not add seen entries. Local
personalization does not enable analytics or reuse opt-in telemetry. History is
not synchronized across devices; reinstall/storage removal can reset it.
Deleting an account clears that account's local history and preserves others.

At session start, native code freezes `{version, sessionId, startedAt, seen}`.
Every page sends that same snapshot in `X-Gatherory-Discovery-Context` rather than
putting history in the URL. Live history continues independently. Serialization
enforces unique keys, timestamp/retention bounds and the header byte limit.
Late card callbacks are fenced by account and generation.

For an eligible ranked browse request, the server orders three tiers:

1. Keys absent from the frozen history.
2. Seen keys outside the cooldown, least recently seen first.
3. Seen keys inside the cooldown, least recently seen first.

Existing editorial/Like ranking breaks appropriate ties; a deterministic hash
of the session and key rotates baseline-equal candidates across sessions. The
creator soft cap applies within each freshness tier where alternatives exist.
It can relax for limited inventory. No tier is permanently excluded, so tiny
and all-seen catalogs remain complete and usable.

The header is client-supplied personalization input, not evidence for aggregate
ranking credit or authority to read private content. The normal public catalog
and Not interested checks remain authoritative. Invalid browse headers are
rejected; typed queries skip even malformed discovery headers. Older clients
without the header retain their existing order. The baseline kill switch and
failure fallback retain catalog behavior.

Cursor digests bind the account, query/category, catalog, ranking policy and
frozen history. Session start freezes age calculations, including at cooldown
and retention boundaries. Changed context cannot silently reorder a continuation.
Native stale-cursor recovery renews the browse snapshot before the existing
single page-one restart; typed-search recovery remains separate.

## Open-source research

[Pinned source review](../../research/blueprint-discovery-freshness-open-source-2026-10-23.md)
covers Twitter's Scala seen/served filters, xAI's Rust equivalents and Bluesky's
feed-generator example. The useful principle is keeping served and seen separate.
Gatherory independently implements bounded exact history, cooldown demotion and
snapshot paging; no external algorithm package was installed.

## Evaluation and verification

The reproducible comparison and checked-in artifact are generated with:

```sh
pnpm tsx scripts/evaluate-blueprint-discovery-freshness.ts
pnpm tsx scripts/evaluate-blueprint-discovery-freshness.ts --check
```

The [JSON artifact](artifacts/repeated-visit-freshness-evaluation.json) records
fixture definitions, baseline/candidate results and paging boundaries. These are
synthetic repetition results, not production relevance or usefulness estimates.

The fixture contains 120 Blueprints across 15 synthetic creators and four
categories. Each of five visits fetches 20 cards but records only six meaningful
views; the other 14 fetched cards remain unseen. Sessions use distinct seeds and
frozen per-visit clocks. The baseline and candidate keep their own cumulative
view histories.

| Measure                                  | Existing baseline | Unseen-first candidate |
| ---------------------------------------- | ----------------: | ---------------------: |
| Distinct top-ten items over five visits  |                10 |                     47 |
| Top-ten already-viewed share, visits 2–5 |               60% |                     0% |
| First unseen rank, visits 2–5            |                 7 |                      1 |

The first visit has no prior-view repeat denominator. These results assume
unseen eligible inventory remains. Empty, tiny, all-seen/cooldown and changed
catalog cases are recorded separately. Full traversals contain no duplicates;
unchanged frozen context produces identical ordering and valid continuation,
whereas changed history invalidates the cursor. Exact typed search remains
unchanged even when its best match has been seen and unrelated inventory is unseen.

The [CI evaluation follow-up](../../release/discovery-evaluation-ci-2026-10-23.md)
records the production workflow timeout, evaluation-only optimization, local
verification and remote workflow result.

Server validation passes 52 tests across six focused files, plus 33 measurement,
action and baseline-evaluation regressions across three files. Typecheck,
generated contracts and deterministic artifact check pass. No database migration
or deployment was needed for this device-local input policy.

Native UI evaluation also caught an existing host limitation: a pull on this
masonry ScrollView did not invoke the refresh environment action on the tested
OS. The delivered manual control is a standard SwiftUI toolbar Refresh button,
localized in EN/ES. There is no custom pull gesture, UIKit introspection bridge
or replaced masonry container. Do not describe pull-to-refresh as verified.

Final native verification passed **36/36 distinct checks (34 unit/two UI), 48
executions, zero failures/skips**, with no runtime warnings in the focused run.
Normal Light/Dark UI checks cover actual dwell, frozen context, unchanged first
page/scroll position across preview and quick-tab return, and explicit native
Refresh. The existing typed-search swipe-return test also passes. Localized
coverage passes for 1,695 EN/ES strings; final captures were inspected.
The final simulator Release build passed without compiler diagnostics.
The [native record](../../../../ios-apps/gatherory/docs/testing-verification.md#unseen-first-discovery-and-browsing-sessions--october-23-2026)
lists bundles, prior failures/corrections and remaining acceptance limits.

## Remaining acceptance

Compatible backend and native changes need deployment/device acceptance together.
Native UI tests use a fixed local catalog to inspect session, dwell, navigation
and refresh behavior; server tests separately exercise actual ranking. They do
not prove live end-to-end recommendation usefulness. Verify a disposable signed-in
account across repeated real visits, real listing changes, app backgrounding and
device restarts. Cross-device history and semantic similarity diversification
remain future work; neither is implied by this first version.
