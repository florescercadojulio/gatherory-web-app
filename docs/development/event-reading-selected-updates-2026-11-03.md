# Event reading and selected browser updates — November 3, 2026

Implemented locally; no production rollout, shared-database change or new
migration. This record continues the [web experience roadmap](../roadmaps/web-experience-roadmap/README.md)
and [accountless browser RSVP slice](browser-invitation-rsvp-2026-11-03.md).

## Delivered behavior

Authenticated planners enter `/events/$eventId` from overview titles, accepted
invitation continuation or independently authorized schedule links. The
identity-only `_event` layout reuses the account sidebar without provisioning
a workspace. One main landmark owns the page. REUI Frame, owned Base Nova
primitives, ordered reading rows and an explicit details dialog provide the
reading-first presentation; copy is available in English and Spanish.

The read contract contains the selected event’s details, own attendance,
people, direct authorized children, tasks and notes. Each list is capped at 50
with an explicit truncation notice. A child-only participant receives no parent
or sibling IDs, titles or private content. Guests, signed in or accountless,
continue to use the narrow invited-event summary; this planner endpoint denies
them before private queries.

Allowed updates reuse existing resource permissions:

| Role                         | Own RSVP when open      | Task complete/undo | Create own note | Basic details |
| ---------------------------- | ----------------------- | ------------------ | --------------- | ------------- |
| Host / managing collaborator | Yes                     | Yes                | Yes             | Yes           |
| Contributing collaborator    | Yes                     | Yes                | Yes             | No            |
| View-only collaborator       | Yes                     | No                 | No              | No            |
| Guest                        | Through invited summary | No                 | No              | No            |

Basic details means title, description and location **name**, preserving address
and coordinates. Dates, time zones, lifecycle, people, invitations, budgets,
ideas, registry, media and broad authoring are outside this slice. Explicitly
closed event/parent state prevents writes; dates alone do not close an ongoing
event. Missing snapshots or native entity versions keep reading available
without offering unsafe updates. No new monetary calculation was introduced.

## Architecture and recovery

Dedicated browser contracts and server handlers call injectable Effect
workflows. Read ports capture their Effect PostgreSQL dependency in live
composition. The write port wraps the existing Promise-based native transaction
engine, an intentional legacy adapter boundary; it does not introduce a fake
Effect database requirement or import live infrastructure into pure workflows.
UI imports handlers/contracts only.

Handlers bind actors to the session, validate strict fields and guard mutation
origins. Native transactions recheck current permission, lifecycle, exact scope
and versions under existing locks. Todo/detail updates use compare-and-swap.
Notes use a stable UUID and semantic fingerprint, derive the author on the
server and encode dates as native Foundation seconds in entity/change payloads.
Cleared descriptions and required location fields serialize as empty native
strings, preserving Swift decoding while canonical optional text stays nullable.

The private root-details command accepts only the three allowed fields and
merges them into the locked current archive. It preserves unrelated concurrent
notes/entities, budget data and canonical sharing settings, then uses the
existing materializer, snapshot, receipt and native change pipeline. Public
native push input rejects server-only fingerprints and trusted patch fields.

A stale editor retains its draft and original version. Reload shows current
values; only an explicit “Use the current version and keep my edits” action
adopts that reviewed version. Further conflicts invalidate the review. The UI
recognizes the sanitized public `CONFLICT` error code. Uncertain note retries
reuse the exact key/body; confirmed saves remain saved if the following refresh
fails. Reads and refresh errors have a persistent retry control.

## Verification

Opt-in database tests ran only in an owned, disposable PostgreSQL 18 container on loopback with the 26
checked-in migrations. Browser tests used that database through a separate
Vite server on port 3011 and synthetic accounts; no shared development records,
media providers or notification recipients were used.

- `pnpm typecheck --pretty false`: passed.
- `pnpm contracts:check`: passed (also part of `pnpm test`).
- `pnpm test`: 183 files passed, 48 opt-in files skipped; 1,077 tests passed,
  76 opt-in tests skipped.
- Opt-in event-reading/update database test: passed. Covers host/manage/
  contribute/view-only/guest/outsider/child-only access, payload isolation,
  closed state including archived-event own RSVP rejection without changing
  attendance, native versions/change records, stale writes, own-note exact
  replay and mismatched reuse, server author, numeric native timestamps,
  root/child detail edits, required native string preservation when clearing
  optional text, and preservation of concurrent unrelated archive data.
- Existing scoped-sync and browser-guest database suites: eight tests passed.
- Existing native-budget database suite: eight tests passed in a separate
  disposable database with its required `gatherory_budget_test` name. The first
  invocation correctly refused a differently named test database before writes;
  it was rerun against the correctly named target.
- Actual browser: sign-in preserves exact-event continuation; host note creation,
  task complete/undo, root/child details and independently authorized schedule
  links work. Two tabs prove stale-save rejection, retained draft, explicit
  reload/review/adoption and successful subsequent save. View-only collaborators
  have no planner-write controls but can save their own RSVP. Direct parent
  access by a child-only viewer is denied without exposing its title. A signed-in
  guest is denied the planner page and can open the narrow invited summary.
  Light and system-theme reading views were inspected.

Screenshots from synthetic fixtures:
`/tmp/gatherory-event-reading-desktop-20261103.jpg`,
`/tmp/gatherory-event-reading-desktop-light-20261103.jpg`, and
`/tmp/gatherory-event-reading-view-only-20261103.jpg`.

The owned Vite server and disposable database container were stopped after
verification; temporary credential fixtures were removed. No test service was
left running.

## Remaining acceptance limits

Physical Android Chrome, QR scan entry, narrow-screen keyboard/Back/scrolling,
screen-reader interaction and deployment proxy/header behavior remain open.
The browser viewport override reported success but the DOM stayed at 1280px;
that attempt does not establish narrow-screen acceptance. No native application
code changed and no native UI test was claimed. No production deployment,
provider-backed media test or shared-database migration was performed.
