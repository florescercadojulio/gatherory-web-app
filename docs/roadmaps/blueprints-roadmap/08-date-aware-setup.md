# Date-aware native blueprint setup

Implemented October 15, 2026. This adds suggestions to the existing curated
Wedding setup, not automatic rescheduling or a new sync engine.

## Contract and server behavior

- Authenticated `POST /api/blueprints/schedule` accepts the catalog key, immutable
  revision, content hash, and main event's confirmed instant plus named IANA zone.
- The Effect workflow reads the requested revision, rejects a changed hash, and
  calls a pure server-only Temporal planner. No organization, receipt, event,
  native projection, outbox entry, or other database write is created.
- Server-only Temporal on Node 24 (via the pinned polyfill) derives the main event's calendar date in its
  event zone, adds calendar days, then combines the proposed local clock time.
  Server/device default zones and 24-hour duration arithmetic are not used.
- A normal time returns one UTC candidate. A repeated time returns both
  candidates in chronological order. A clock gap or skipped date returns no
  candidate; the user must choose another time. Missing proposals remain manual.
- Browser-safe input/response JSON schemas have explicit character limits.
  `localDateTime` is a wall-clock label, never a confirmed instant. Candidates
  use UTC strings. The Wedding revision and content hash are unchanged.

## Native confirmation and edits

- Selecting a sub-event does not select its date. **Use suggested date** or
  **Confirm date** is required before that child can enter review/install.
- Repeated times show both instants with their event-zone GMT offsets. Manual
  date entry uses the system picker in the event zone, with Cancel and Confirm.
- Main-date or zone changes expire suggestions immediately, then debounce a new
  request. UUID generations reject stale replies and stale confirmation buttons,
  including an A → B → A input change. Account-bound calls also reject replies
  from an old authentication generation.
- Confirmed and manually edited dates remain the exact chosen instants after
  refresh. A zone change changes their display, not when they happen. A notice
  explains this. Deselecting a child clears only that child's confirmation.
- Network failure leaves manual date entry and existing choices available.
  Suggestion fetching never creates a durable installation intent. The later
  [resumable setup slice](12-resumable-setup.md) adds device-local, account-scoped
  setup recovery without changing suggestion confirmation or sync transactions.
- Existing native transport encodes dates to whole seconds. Schedule anchors
  normalize to that precision before requests/echo checks; server contracts still
  accept milliseconds. No existing date, archive, outbox, or sync format changes.

## Preservation boundaries

Review and installation continue to accept only confirmed instants. Installation
uses the same durable account-scoped request UUID, provisioning recovery, and
atomic product/native transaction. Ordinary offline mutations, outbox delivery,
remote merge, and account switching are unchanged. This slice does not reschedule
already-installed events or overwrite user edits from a catalog update.

## Verification and remaining work

Server tests cover DST gaps/folds, Lord Howe, Apia's skipped date, quarter-hour
offsets, leap days, year rollover, calendar-day arithmetic, pinned revision reads,
anonymous rejection, and absence of writes. Native tests cover confirmation,
stale responses, manual edits, failed refreshes, deselection, response pinning,
account switches, request encoding, and the shared Wedding response fixture.
Run the full web suite and native `GatheroryTests`, not UI tests.

Verification on October 15: TypeScript, generated-contract checks, and all 292
web tests passed (14 environment/opt-in tests skipped). The separate installation
database test also passed against a freshly migrated disposable PostgreSQL 18
container, including rollback/recovery and ordinary post-install sync checks;
the container and its test volume were removed afterward. The 41 date tests
passed with server `TZ=Pacific/Honolulu` and `TZ=Asia/Tokyo`.

All 373 non-UI native tests passed (446 executions including parameterized cases),
with zero failures/skips on iPhone 17 / iOS 27. English/Spanish localization
coverage passed for 1,011 strings. Shared schedule fixtures are byte-identical.
UI tests and an iOS 26 simulator run were not performed; no iOS 26 runtime is
installed on this machine.

Deployment still requires the existing blueprint migration/catalog setup and a
Node 24 server with the installed Temporal polyfill. This change does not run migrations, seed data, or deploy. A
device visual/interaction pass is still needed, especially for repeated times,
large text, English/Spanish, and offline retry. Next product work remains the
other curated starters, guide editing, and the release gates in `06`.
