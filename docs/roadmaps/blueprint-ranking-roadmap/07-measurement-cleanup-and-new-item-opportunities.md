# Measurement cleanup and new-item opportunities

**Status:** Implemented locally, October 22, 2026. Three Luna agents handled the
writer/schema, report and ranking changes; the parent integrated and verified them.
This supersedes the chronology proxy and reservation policy documented in slices
[04](04-recommendation-baseline.md), [05](05-baseline-evaluation-and-signal-readiness.md)
and [06](06-measurement-readiness-report-and-attribution-checks.md). Their original
verification records remain historical evidence. No shared database, deployment
or device release was changed.

## Measurement acceptance and pairing

Accepted signals now have a database `clock_timestamp()` captured after the
account measurement lock and consent/source checks, plus a database-generated
`acceptedSequence`. The sequence defines server acceptance order for an account;
`createdAt` remains transaction-start metadata. Report DTOs carry the bigint as
decimal text without JavaScript number rounding. Neither field proves client
event chronology or attention.

An open can reference only a previously accepted impression for the same account,
exposure and public source. The pointer is saved when accepting the open; a later
impression never repairs it retroactively. Sequence order remains authoritative
if the database wall clock moves backwards. Both signals must fall inside the
exposure token's valid interval. Self-source, disabled consent, ineligible account,
expired/future exposure and unavailable exact publication checks still apply.

Keep every deduplicated per-exposure impression and open, including rows with
`rankEligible=false`. The existing one-account/source/kind/UTC-day credit limit
continues independently. A fast open without a prior accepted impression remains
valid copy/install evidence. The adoption diagnostic still selects the first
valid accepted raw open per account/source, regardless of pairing or daily credit;
pairing quality is reported separately.

## Serving diagnostics and report v2

An opt-in-only daily table records page-item attempts by account, UTC day,
surface and policy version/digest: requested, eligible, issued, reused,
quota-denied and source-ineligible. The writer and database enforce
`requested = eligible + sourceIneligible` and
`eligible = issued + reused + quotaDenied`. Repeated requests and reused tokens
count as attempts. Fetching a card does not record an impression.

These diagnostics contain no content, raw query, session identifier or private
preferences. Opt-out/account deletion removes them; retention remains 30 days.
They describe successfully recorded attempts from eligible opted-in accounts.
They cannot establish total traffic, failed-write coverage, eligible sessions,
supported client versions or the opt-in denominator.

The existing [report CLI](../../../scripts/report-blueprint-measurement-readiness.ts)
now emits `blueprint-measurement-readiness-v2`, using accepted order and explicit
pairing diagnostics. Its sixth bounded projection reads daily diagnostics.
Full past UTC-day cohorts receive measured attempt counts; partial-day cohorts
receive `unavailable_partial_day` and nullable counts rather than misleading zeros.
Malformed/nonconserving rows and integer overflow are rejected or diagnosed.
Signal, attribution and daily-diagnostic SQL projections filter current consent
and account eligibility. Exposure rows retain consent/source-status diagnostics;
the builder excludes ineligible contexts from opportunities.

The CLI remains synthetic by default, explicit loopback-only in database mode,
read-only and aggregate-only. Each projection has a 20,000-row cap and overflow
fails closed. The seven-day outcome plus 24-hour maturity lag remains diagnostic.
Thirty-day exposure retention still prevents observing a fully mature 30-day
outcome cohort. `readinessForRankingWeights` remains false; unknown traffic is
not negative feedback. See [06](06-measurement-readiness-report-and-attribution-checks.md)
for the unchanged native snapshot/copy/install checks and operational commands.

## Pre-release migration and maintenance

The user authorized resetting pre-release data. The generated
[migration](../../../drizzle/20261022202652_sad_micromacro/migration.sql) instead
clears only existing measurement signal replay records and exposures, cascading
their signals/acquisitions/qualified adoptions before adding required acceptance
fields. It does not invent historical order. It preserves functional preferences,
measurement settings and their replay records, private copied content/revisions,
completed installation receipts, events and authentication data.

Apply the migration before running the compatible backend. The new daily table
starts empty. The migration was exercised against seeded old-schema data and
against an empty disposable PostgreSQL 18 database. No shared reset was performed.
The 30-minute exposure token lifetime is distinct from 30-day history retention.
Bounded cleanup includes the new diagnostics and removes stale opens before
impressions, respecting the row budget; the optional impression FK uses
`ON DELETE SET NULL`. The existing cleanup CLI remains explicit/local. A deployed
maintenance job and operational monitoring remain release work.

## Promotion-only recent-item policy

The wire capability stays `ranking=baseline_v1`; internal algorithm and
configuration versions are now `blueprint-baseline-v2`. Version/configuration
binding invalidates older ranked cursors and requires a restart. No native
transport change is needed.

Build the ordinary editorial/key order with its soft creator cap inside each
identical content-relevance group. Then, at global position `k`, compare recent
authored items already emitted with `floor(k * 0.1)`. Naturally high recent items
count toward that cumulative target. If there is a deficit, promote the earliest
remaining recent candidate in that same group across older candidates only,
provided the move does not introduce an avoidable creator-cap violation.

Recent means the existing immutable earliest-publication proxy is within 30 days
of frozen `asOf`. This is a minimum opportunity target when candidates and
diversity permit, not a ceiling on recent items. Recent candidates are never held
back or demoted relative to the ordinary order. Small groups no longer receive
rounded-up reservations. Daily hash selection was removed. Relevance barriers,
current public eligibility, deterministic complete paging and the fallback switch
remain intact. No likes, bookmarks or install weights were added.

The regenerated [evaluation artifact](artifacts/baseline-evaluation.json)
contains 17 curated fixtures and eight synthetic scenarios. The prior audit's
recent-item top-ten scenario changes from 20% versus 40% under the ordinary
editorial/diversity control to 40% versus 40%. A separate overlooked-item scenario
promotes one recent candidate to rank 10. Groups of sizes 1–9 show no rounded-up
promotions. These establish ordering properties, not real-world usefulness or
recommendation lift.

## Verification and next slice

- `pnpm typecheck` passed. `pnpm test` passed generated-contract checks and
  **747 tests in 116 files**; 53 environment-dependent tests were skipped.
  Logs: `/tmp/gatherory-measurement-cleanup-typecheck-verified.log` and
  `/tmp/gatherory-measurement-cleanup-web-verified.log`.
- Explicit opt-in PostgreSQL integration passed **7 tests across 5 files**:
  actions/measurement, readiness reporting, ranking metadata, attribution copies
  and cover-backed installation. Lock-wait coverage verifies post-lock acceptance;
  ordering, late impressions, daily credit, quota counters, consent deletion,
  row-limited cleanup and copy/install chains are exercised. Log:
  `/tmp/gatherory-measurement-cleanup-db-verified.log`.
- The old-schema upgrade fixture confirmed measurement deletion and preservation
  of preferences, settings, their replay records, a private copy/revision and a
  completed receipt. All migrations also applied to a second empty database.
  Logs: `/tmp/gatherory-measurement-cleanup-upgrade-check.log` and
  `/tmp/gatherory-measurement-cleanup-fresh-migrate.log`. Both databases were
  disposable PostgreSQL 18 targets, not shared product environments.
- `pnpm exec tsx scripts/evaluate-blueprint-ranking.ts --check` passed against
  the 89,052-byte checked-in artifact. Traversal at page sizes 1, 2, 3, 7 and 20
  is complete, duplicate-free and identical in order. The focused ranking,
  paging, evaluation and contract run passed 64 tests before the full-suite run.
- Synthetic-default and explicit database report CLI runs passed. The cleaned
  local database returned zero recorded counts, unknown traffic denominators and
  weight readiness false; this is an operational check, not usage evidence.
  The cleanup CLI also completed with `--apply --limit=1`; bounded deletion of
  seeded stale rows is covered by the database test. No daemon was started.
- Targeted formatting, local documentation links and both repositories'
  `git diff --check` passed. The 289,631-byte native snapshot fixture copies
  remain identical. No Swift implementation changed in this slice; the original
  native verification record remains in 06, with no new device acceptance claim.

[08 — Personal Like-based ranking](08-personal-like-ranking.md) now implements the
bounded own-account explicit-Like candidate, versioned rule, deterministic
evaluation and baseline fallback. This document retains the slice-07 scope. Pooled bookmark/install weights
still need operational collection and deletion checks, evaluated exposure/outcome
coverage, an agreed outcome window and sufficient independent evidence. These
release/evidence tasks do not require delaying other pre-release product work.
