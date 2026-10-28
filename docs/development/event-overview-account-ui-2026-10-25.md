# Event overview and Account UI — October 25, 2026

The browser remains primarily read-only. These changes are local/dev only;
there was no production push, deployment, schema change, or database reset.

## Account

The existing global sidebar is the only sidebar. Removed the additional
in-page settings navigation and its responsive/sticky navigation styles.
Profile, Appearance, AI connections and Account actions share a single column,
with the heading aligned to the panels (maximum page width 52rem).

Panels use the free [REUI Frame](https://reui.io/components/frame) component
copied from the official Base Nova registry. No paid settings block or new
runtime package is required. Better Auth continues to own theme preferences,
theme previews and account deletion. Profile information comes from the
existing signed-in account; no unsupported profile editor was added.
The theme previews are inert decorations, while labeled native Base UI radio
controls retain keyboard selection. AI connections uses the existing route.

The previous browser pass verified theme persistence after reload, keyboard
selection, AI connection navigation, and deletion cancellation: confirmation
starts disabled, becomes enabled after DELETE is typed, and resets after
Cancel/reopen. No deletion was submitted. The simplified layout was checked
again at desktop and mobile widths with no additional settings navigation.

## Events overview

The main content now starts with event summaries instead of the generic hero
and aggregate counters. Each REUI Frame shows the event title, date, venue,
participants, scheduled activity count, undecided idea count and planned
spending. A configured budget shows its progress within that event.
There are no new edit controls or clickable cards pointing at unsupported
native event detail routes.

Coming up is secondary: a 19rem column on screens at least 80rem wide, and a
section below the event summaries at smaller widths. Every session keeps its
parent event name. The existing insight query still authorizes root events by
the signed-in person's host/collaborator participation; this change does not
grant guests planning access or broaden event membership.

Upcoming sessions must be scheduled, incomplete, at or after the current time,
and neither cancelled nor finished. Cancelled/finished parent events are
excluded as well. The repository orders child events by start/creation time
and retains five eligible sessions per parent; the UI sorts across parents and
shows the first five. Keeping five per parent avoids incorrectly showing a
later session from another event ahead of the first event's fifth session.
Planning-purpose labels use the actual `planning_scouting` value.

## Verification

- `pnpm test`: contracts check passed; **939 passed, 66 skipped** across the
  Vitest suite. The additional empty-account rendering regression then passed
  in the final focused run below. Database-dependent suites remain skipped in
  the full run.
- `pnpm typecheck`: passed.
- Focused Account, overview rendering/order/state policy, shared shell, mobile
  breakpoint and MCP settings tests: **13 passed**.
- Browser at `dev.gatherory.com`, App Review fixture: 1440px Light/Dark,
  390px Light/Dark, and 1024px Dark. One main landmark and no horizontal
  overflow in every measured layout. Wide screens show both columns; smaller
  screens place event summaries first.
- Account: no in-page navigation; one main landmark; no horizontal overflow
  at desktop/mobile widths. Better Auth controls remain available.

Evidence is local: `/tmp/gatherory-event-context-web-full.log`,
`/tmp/gatherory-event-overview-tests.log`, `/tmp/gatherory-ui-types-final.log`,
`/tmp/gatherory-events-overview-dark.jpg`, and the browser evaluation JSON.
The dev tunnel served cached unversioned styles during verification. Only
the dev stylesheet cache entry was purged; development links now include a
stylesheet revision query. Release URLs continue to use Vite's hashed assets.
No production cache or deployment was changed. Real-device browser and native
release acceptance remain separate checks.

## Native Home

The matching iOS change keeps the selected event in the standard inline
navigation title. Cards visibly distinguish Main event from Subevent and show
the parent title only when that parent is visible to the viewer. See the native
repository's `docs/testing-verification.md`, Home event context clarity, for
unit and simulator acceptance. REUI is not used in the iOS app.
