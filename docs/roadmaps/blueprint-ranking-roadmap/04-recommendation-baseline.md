# Recommendation ranking baseline

**Current follow-through:** [07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md)
implements accepted signal order, exact prior-impression links, daily serving
diagnostics and promotion-only baseline v2. Policy/chronology descriptions and
verification below record this earlier slice; 07 owns the current changes.
Own-account Like affinity is subsequently implemented in [08](08-personal-like-ranking.md);
bookmarks and measured installs still do not affect ranking.

**Implemented locally:** October 22, 2026. Server-owned deterministic ranking for
explicitly capable paged clients; iOS Explore opts in. No deployment or shared
DB change was performed. The baseline uses editorial priority, creator variety
and recent-publication opportunity. It does not consume engagement aggregates,
train a model or claim a Blueprint is high quality.

## Ordering policy

The candidate remains one currently public Blueprint. Existing public content
search, English/Spanish aliases and related-term matching run first. Every query
concept must still have evidence. Optional categories constrain the candidate
set; they remain internal metadata and browse shortcuts, with no required
hashtags or topics.

The baseline reorders only **identical search relevance vectors**. A name match
stays ahead of a related-term match regardless of editorial priority, creator,
or publication age. Category filtering happens before opportunity and diversity
selection, and Not interested continues to suppress only browse/category feeds.
Explicit search, bookmarks and recents remain reachable.

[`blueprint-ranking-config.ts`](../../../src/server/blueprints/catalog/blueprint-ranking-config.ts)
contains the versioned initial choices:

| Rule                        | Initial configuration                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editorial priority          | `wedding: 30`, `birthday: 20`, `thanksgiving: 10`; other keys default to zero. Higher numbers lead within equal relevance. These are editorial choices, not popularity or confidence scores.                               |
| Stable ties                 | Catalog key, independent of request/input order.                                                                                                                                                                           |
| Recent authored opportunity | Target 10% of each relevance group's positions, rounded up to an available item. Eligibility is within 30 days of earliest publication, with future/invalid timestamps excluded.                                           |
| Creator diversity           | Prefer an alternative after two consecutive authored entries by the same server-owned creator, within the same relevance group. Relax the cap to fill sparse or single-creator inventory. Curated entries are independent. |

Eligible opportunity candidates are selected deterministically by SHA-256 of the
snapshot's UTC day and catalog key, up to the rounded target. Only selected
reservations wait for opportunity slots; other recent entries retain ordinary
priority/key eligibility. Slots use the global every-tenth-position cadence,
with remaining reservations filling near the group's end. A short group can
use its final position. Thus 10% is a rounded target, not a hard fraction for
small catalogs. Diversity can consume a reserved item earlier when needed.
No inventory is dropped to satisfy a quota or cap.

The pure policy returns ordered keys and internal reason codes. Reason codes,
creator IDs, metadata and scores are never added to cards or public entries.
The configuration fingerprint covers the actual values, including the editorial
map. Change the algorithm version when rule semantics change and the config
version when making intentional editorial/parameter changes.

## Publication history and trust boundaries

The public catalog query supplies an internal creator key from
`blueprint_template.created_by_user_id`. Matching display names do not merge
people, and a public byline is never an authorization or diversity identity.
For a currently eligible authored template, a single grouped SQL subquery reads
its earliest `blueprint_revision.created_at`. Republishing or unlisting/relisting
does not reset this value. Curated entries carry null creator/publication
metadata and do not participate in authored freshness or creator caps.

This timestamp is a conservative **first-publication proxy**, not a newly stored
first-listed date. An old privately published Blueprint listed for the first time
can miss the recent-item slot. It still participates in ordinary ordering.
The query reads no private content or copied-source lineage to infer popularity;
only the timestamp of the same currently public template's revision history is
used. A dedicated first-listing lifecycle can be added later if that distinction
is needed. No first-listing column or backfill is introduced. The only schema
addition is the nullable exposure policy label described below.

Eligibility remains the existing catalog rule: non-retired curated revisions or
the exact currently listed revision of a non-retired authored template. Private
drafts/copies, owner-only publications and bearer-link-only Blueprints never
become ranked candidates. Ranking metadata survives only within the server;
full and paged responses explicitly pass through public schemas to strip it.

## Capability, snapshots and compatibility

`GET /api/blueprints/catalog?ranking=baseline_v1&limit=20` explicitly requests the
baseline. `q` and `category` work as before. Invalid ranking values fail input
validation. A request with the ranking parameter alone is paged with the normal
default limit. Without the parameter, paged requests retain the existing ordering
and version-1 cursor. Parameter-free full catalog reads remain unranked and
continue to support history and exact-key saved-reference reopening.

Ranked responses add an optional summary:

```json
{
  "ranking": {
    "mode": "baseline_v1",
    "algorithmVersion": "blueprint-baseline-v1",
    "configurationVersion": "blueprint-baseline-v1",
    "asOf": "2026-10-22T12:00:00.000Z",
    "snapshotId": "<64-character SHA-256 digest>"
  }
}
```

The version-2 cursor freezes the initial `asOf`, actual mode, configuration
digest, algorithm, effective catalog/source metadata, ordered keys, actor,
filters, size and last key. Subsequent pages recompute that deterministic order
against the frozen time. New pages do not rotate opportunity at midnight or
reorder in response to later likes. Snapshots expire after 24 hours. Malformed
cursors return 400; expired/incompatible snapshots, account changes, public
listing/revision changes or changed hide scope return 409 for restart. This
baseline restarts after a visibility change rather than keeping a stored list
and skipping removed items. It creates no persistent snapshot table or batch job.

As with the existing cursor, clients must treat it as an opaque continuation.
It is base64url-encoded validated JSON, not encryption or a signed access token;
the query can be decoded and a caller can choose to skip/replay positions.
Neither action grants access. Each request reloads current public eligibility,
recomputes scope digests and issues any measurement context server-side. Do not
log or export cursor contents as analytics. Snapshot digests are pseudonymous,
account-linked data, not anonymization.

## Fallback and operations

`BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED=false` disables the policy for capable
requests. The response reports `ranking.mode = "catalog"` and preserves current
content-relevance/key ordering. Invalid configuration or an unexpected policy
failure uses that same fallback. The mode is bound into the continuation, so a
change between baseline and fallback requires a 409 restart. Listing checks,
preferences, previews, copying and installation remain independent.

The native paged transport sends the capability on every browse/category/search
page, including continuation. Old servers ignore that extra query parameter;
old clients do not opt into the new ordering. Native feeds preserve server order
and use no local relevance sort. Recent-history ordering stays separate. Cards,
preview navigation and organic-position-based ad insertion are unchanged.

Existing default-off measurement retains its consent, signal and retention rules.
Eligible exposure records receive the new snapshot digest and global organic
position. A nullable private `ranking_context` JSONB label records actual mode,
algorithm version, configuration version/digest and frozen `asOf` so evaluation
can identify the policy that produced a position. It stores no query, creator
identity or source content. Legacy exposures retain null context. The label is
purged with its exposure on opt-out, retention cleanup and account deletion.
Migration: `drizzle/20261022192324_familiar_storm/migration.sql` adds only this
nullable column. Apply it before the compatible server update. New first-page requests
create a fresh snapshot time; continuation keeps it fixed. Existing exposure
quotas, deduplication and retention still apply. No new passive signal, analytics
export, public social counter, aggregate read model or scheduler was added.

Both the in-memory catalog ranking and grouped revision-history query run at
request time. This is suitable for the existing small catalog, not a claim of
indexed keyset pagination or a large-scale recommendation system. Monitor latency
and coverage before moving to a published projection/snapshot read model.

## Next slice

[05 — Baseline evaluation and signal readiness](05-baseline-evaluation-and-signal-readiness.md)
now records the offline evaluation and source audit. Stable traversal and relevance
barriers hold in the evaluated fixtures; creator diversity changes top-result
concentration. New-item reservations can demote already-high recent items, and
small-group rounding can exceed 10%. Decide the intended opportunity policy
before a versioned change. No usefulness or production uplift was measured.

The subsequent [report/checks slice](06-measurement-readiness-report-and-attribution-checks.md)
implements a local read-only measurement/cohort report and native copy/install
checks. Target-environment coverage remains unverified. Current private preferences are desired state, not pooled event history;
daily impression/open credits can point to different exposures; coverage loss is
not quantifiable from accepted rows alone. Thirty-day cascading cleanup prevents
querying a fully matured 30-day raw cohort. Slice 05 proposes a seven-day diagnostic
or a reviewed retention redesign, and specifies consent/deletion and experiment
gates before weights. Own-account explicit-Like affinity is the first proposed
personalization candidate; it is not implemented. Public counters, follows,
spotlights, usefulness ratings and trust models remain separate work.

## Verification and handoff — October 22

Three Luna agents implemented pure policy/tests, internal metadata/database
coverage, and the native capability/transport test. Parent integration connected
paging, public serialization and exposure labels, reviewed SQL and the privacy
boundaries, and ran final verification:

- `pnpm typecheck`: passed. `pnpm test`, including generated-contract freshness:
  **710 passed, 50 skipped**, 112 files passed. The new database suite is opt-in
  and was run separately. Log: `/tmp/gatherory-ranking-web-verified.log`.
- Final focused policy/paging tests after separating algorithm and configuration
  version constants: **17 passed**; typecheck passed again. The current algorithm
  constant value did not change. Log: `/tmp/gatherory-ranking-rules-verified.log`.
- **Three isolated PostgreSQL suites passed**: ranking metadata/real paging,
  existing actions/measurement and saved-copy attribution. Coverage includes
  matching creator display names with different identities, immutable publication
  age, unavailable sources, complete ranked traversal, unlisting invalidation,
  public metadata stripping, policy labels on opted-in exposures, null legacy
  labels, self-source exclusion, opt-out, quota and copy/install regression checks.
  Log: `/tmp/gatherory-ranking-db-verified.log`.
- All existing migrations and the new nullable-column migration applied to a
  fresh PostgreSQL 18 Docker database on loopback. Final Drizzle explain returned
  `no_changes`. No shared environment URL was loaded. The task-created container
  was removed after validation.
- Native app build and **36 tests in four suites passed** on the iPhone 18 Pro /
  iOS 27.0 simulator with Xcode 27.1 and `POSTHOG_ENABLED=NO`:
  `PostgresSyncTransportTests`, `BlueprintDiscoveryTests`,
  `BlueprintDiscoveryNavigationTests` and `BlueprintActionsTests`.
  Log: `/tmp/gatherory-ranking-native-verified.log`; result:
  `/tmp/gatherory-ranking-native-verified.xcresult`. No new display strings or
  visual fixtures were needed for the transport-only native change.
- Focused Prettier, local documentation links and both repositories'
  `git diff --check` passed. Existing dirty work was preserved.

Apply the migration, deploy the compatible server, then release the capable
native client. Verify signed-in browse/category/search continuations, source
withdrawal and opt-out in the target environment before rollout. No deployment,
physical-device/VoiceOver acceptance or randomized experiment was performed.
The deterministic policy choices are an initial baseline, not evidence of
improved recommendations or independent community approval.
