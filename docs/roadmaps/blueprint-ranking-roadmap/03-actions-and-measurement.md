# Blueprint actions and recommendation measurement

**Current follow-through:** [07 — Measurement cleanup and new-item opportunities](07-measurement-cleanup-and-new-item-opportunities.md)
implements accepted signal order, exact prior-impression links, daily serving
diagnostics and promotion-only baseline v2. Policy/chronology descriptions and
verification below record this earlier slice; 07 owns the current changes.
Own-account Like affinity is subsequently implemented in [08](08-personal-like-ranking.md);
bookmarks and measured installs still do not affect ranking.

**Implemented locally:** October 22, 2026, across the server and native iOS app.
The migration is additive. No shared database migration, backend deployment,
production collection, or device release was performed. This slice supplies
preferences and a bounded evaluation dataset. The subsequent
[recommendation baseline](04-recommendation-baseline.md) is now implemented locally
without engagement weights.

## Product behavior

The Blueprint remains the discovery object. Cards retain their full cover,
title and optional creator byline. Long-press a card for actions, or use the
preview toolbar menu. Each action is independent and private to the account:

| Action                      | Behavior                                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Like / Unlike               | Record an explicit preference for the public Blueprint. No public counter or quality claim.                                                                          |
| Bookmark / Remove bookmark  | Keep a reference in Saved Blueprints. Reopening resolves the current public publication in the existing preview. It creates no setup copy or access grant.           |
| Not interested / Show again | Hide the Blueprint from browse and category feeds. Explicit search, saved references and recent history remain available. Hidden management reverses the preference. |

Saved rows never grant continued access after unlisting or retirement. An
unavailable bookmark shows a generic label and can still be removed. Enabling
a preference requires an exact currently public revision and hash; removing
one's own preference remains allowed when that source is unavailable. Captured
revisions provide context, while preferences follow the stable Blueprint key.
Likes and bookmarks do not cancel Not interested or each other.

Native commands are account-bound and serialized. State changes after a server
acknowledgement, and a visible failure can retry the same UUID. There is no
persistent offline social-action queue. Account changes cancel work and discard
local preferences, settings, pending commands and signal deduplication state.
Server desired-state commands reject request-ID reuse with a different payload;
replaying an old command returns current flags without undoing later changes.

## Opt-in measurement

“Improve Blueprint recommendations” defaults **off** and is separate from
functional likes, bookmarks and hiding. Loading the setting does not enable it.
When enabled, the server can issue an opaque UUID for an organic catalog entry,
bound to the account, source revision/hash, surface, global organic position,
and a one-way snapshot/scope digest. References expire after 30 minutes.
The digest stores no raw query or encoded cursor. Actor-linked hashes remain
sensitive pseudonymous data, not anonymous data.

Fetching a page is not an impression. The native card reports an impression
only after at least 50% is visible continuously for one second, in the active
foreground surface with no preview presented. It reports an open for an explicit
selection from that eligible organic entry. Recent-history entries, ads,
private library copies and bearer-link previews produce neither signal.
Client visibility remains an untrusted claim, not proof a person looked.

The server rechecks opt-in, account, expiry, current public source and creator
ownership. Self-authored views and explicitly designated internal/test accounts
are excluded. Configure `BLUEPRINT_DISCOVERY_EXCLUDED_ACCOUNT_IDS` with comma-
separated server account IDs before evaluating real data; email/display-name
heuristics are deliberately absent. Signal UUIDs and exposure/kind pairs are
deduplicated. At most one impression and one open per account/source/UTC day has
`rankEligible = true`; additional exposure-level opens may support attribution
but cannot multiply future ranking influence. No ranking consumer exists yet.
Daily credit crosses surface/revision/snapshot/position, so independently credited
impressions and opens may refer to different exposures. The measurement audit in
[05](05-baseline-evaluation-and-signal-readiness.md) specifies pairing limitations,
missing coverage denominators and why these counts do not form a naive CTR.

Issuance reuses an unexpired exposure when account, source/revision/hash,
surface, position and snapshot match. New exposure writes are capped under the
actor lock at 120 per rolling minute and 1,000 per UTC day. Exhausting a quota
omits new measurement contexts while catalog and actions continue working.
Duplicate or capped signals write no extra request ledger. These are initial
storage/influence safeguards, not tuned recommendation weights or a substitute
for deployment-wide request protection.

Disabling measurement purges the account's exposure/signal data and cascades its
verified acquisitions and qualified adoptions. It preserves preferences. Shared
actor transaction locks serialize opt-out with issuance, recording, copying and
qualification. Telemetry failures never block catalog, preview, copying or
installation. These records remain in the product database; this slice sends no
new events to PostHog or an external analytics provider.

## Verified adoption through a private setup copy

The copy request optionally includes `source.discoveryExposureId` alongside
its existing public source key/revision. The source marker alone earns no credit.
The server requires an unexpired exposure for that actor and exact source,
a recorded explicit open, current opt-in, a current public publication, and
non-self ownership. Bearer-link acquisition is excluded.

Copy credit is deliberately conservative: reconstructing the public definition
from the submitted draft must reproduce the immutable publication hash exactly.
Names, descriptions, content, stable keys, ordering, configuration and cover
references participate. A renamed or edited setup still works, but earns no
organic adoption credit. Unsupported or transformed definitions that cannot
round-trip exactly also earn no credit. This can undercount useful adaptations;
do not interpret its conversion rate as all Blueprint use.

The acquisition binds the original public source to the actor's exact private
copy template/revision/hash. Qualification occurs in the completed installation
transaction only if that copy remains unchanged and unpublished, the original
revision is still publicly listed, consent remains on, and acquisition has not
expired. Pending/failed installs earn nothing. A unique account/source constraint
bounds adoption within the retained dataset; request/receipt retries add no
credit. Best-effort writes use savepoints so telemetry errors cannot roll back
an authorized copy or install.

Exposure-linked signals and attribution expire no later than **30 days after
exposure issuance**, including credited adoptions. Signal replay hashes expire
within 30 days of their own creation; they contain no raw exposure reference or
query. Account deletion cascades the records;
measurement opt-out removes them immediately. Functional preference/settings
replay ledgers are retained for idempotency until account deletion; signal
ledgers are purged with measurement and retention cleanup. There are no public
popularity counters, trained models, private-event scans, guest/member signals,
or usefulness judgments in this slice.

## Contracts and persistence

| Endpoint                                         | Contract                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `GET /api/blueprints/preferences?limit=&cursor=` | Private paged flags and current-public bookmark availability.                                                      |
| `PATCH /api/blueprints/preferences`              | `{requestId, catalogKey, revision, contentHash, kind, enabled}`; kind is `like`, `bookmark` or `notInterested`.    |
| `GET /api/blueprints/measurement`                | Account setting, default `{enabled:false}`.                                                                        |
| `PATCH /api/blueprints/measurement`              | `{requestId, enabled}`.                                                                                            |
| `POST /api/blueprints/measurement/signals`       | `{requestId, exposureId, kind}`; kind is `impression` or `open`. Invalid/unusable measurement evidence is ignored. |

Catalog entries add optional `viewerState` and `discoveryContext`; older clients
can ignore them. Legacy full-catalog reads carry viewer state but issue no
exposures and preserve their full list. Paged browsing applies hiding before
pagination. Cursors bind the account and eligible catalog; a changed hide scope
or different account requires the existing stale-409 restart. Search keeps its
content relevance and can return hidden Blueprints. Public listing authorization
is rechecked for each request. Neither cursor nor exposure grants access.

Migration: `drizzle/20261022184607_flowery_mikhail_rasputin/migration.sql` adds
`blueprint_preference`, `blueprint_preference_mutation`,
`blueprint_measurement_setting`, `blueprint_discovery_exposure`,
`blueprint_discovery_signal`, `blueprint_attribution_acquisition` and
`blueprint_qualified_adoption`, with account cascades and uniqueness constraints.
The additive follow-up
`drizzle/20261022185658_awesome_invisible_woman/migration.sql` adds issued-time,
account/issued-time, signal-created-time and ledger-kind/created-time indexes for
quotas and retention cleanup. Portable JSON schemas are generated by
`pnpm contracts:generate`.

## Maintenance, verification and rollout

`pnpm exec tsx scripts/cleanup-blueprint-measurement.ts --apply` requires an explicitly
supplied local-host `DATABASE_URL`; the `db:cleanup-blueprint-measurement:local` convenience
script loads the configured local environment. Cleanup is bounded per invocation;
repeat until exhausted. The CLI refuses remote hosts. A deployed maintenance
job should invoke the same bounded repository operation with its server database
layer at least daily before collection is enabled. No scheduler or shared-
database job was created here.
Use `--limit=1..1000` to bound each invocation.

Apply the migration before deploying routes or releasing native controls. Review
the disclosure and designated excluded accounts, run retention cleanup, and test
real authenticated app flows in the target environment before rollout. The
broader SDK/App Privacy and consent review in the
[release safeguards](../../release/v1-release-safeguards.md) remains separate.

The subsequent [baseline slice](04-recommendation-baseline.md) now supplies
relevance, creator diversity and bounded new-item opportunity. Next evaluate
coverage and data quality before adding signal weights. The offline/source
[evaluation in 05](05-baseline-evaluation-and-signal-readiness.md) is complete;
the subsequent [report/checks slice](06-measurement-readiness-report-and-attribution-checks.md)
implements a local report, short-horizon cohort bounds and actual native
copy/install checks. Target-environment coverage remains unverified. Keep query relevance primary; do not turn raw likes/clicks or client
visibility claims into a quality score.

## Verification and handoff — October 22

Three Luna agents implemented server actions/measurement, native integration,
and attribution with an independent server audit. Parent integration corrected
paging scope, native lifecycle/consent retry behavior and hidden-list identity,
reviewed the additive SQL, and ran the final checks:

- `pnpm typecheck`: passed. `pnpm test`, including contract freshness: **693
  passed, 49 skipped**, 110 test files passed. The opt-in database suites are
  skipped by default and were executed separately below. Log:
  `/tmp/gatherory-blueprint-actions-web-final2.log`.
- Both new database suites: **2 passed** against a task-created PostgreSQL 18
  Docker container bound to loopback, with an explicit test URL and
  `RUN_BLUEPRINT_DB_TESTS=1`. Tested concurrent preferences, replay after later
  state, unavailable rows, actor/source/expiry validation, opt-out races/cascades,
  source and edited-copy attribution, install retry, quotas and retention.
  Log: `/tmp/gatherory-blueprint-actions-db-final2.log`.
- The complete existing migration chain plus both new migrations applied to
  that empty disposable database. Final Drizzle explain returned `no_changes`.
  The local cleanup CLI ran successfully against the same test database.
  The task-created container was removed after verification; no shared database
  was modified.
- Native simulator build and full unit target: **949 tests in 132 suites
  passed**. After the final consent-specific retry fix and regression test,
  **42 tests in four Blueprint action/discovery/copy/preview suites passed**
  again. Xcode 27.1, iPhone 18 Pro simulator, iOS 27.0; `POSTHOG_ENABLED=NO`.
  Logs: `/tmp/gatherory-blueprint-actions-native-final4.log` and
  `/tmp/gatherory-blueprint-actions-native-verified.log`; matching `.xcresult`
  bundles retain results.
- English/Spanish localization: **1,658 strings** verified, with the existing
  dynamic-key extraction warning in `AppCopy.swift:341`. Scoped formatting,
  local links and both repositories' `git diff --check` passed.

No signed-in end-to-end test against a deployed server, UI automation,
physical-device scrolling or spoken VoiceOver acceptance is claimed. The iOS
unit target is broader regression evidence, not production collection or
release approval. Keep the existing dirty work in both repositories intact.
