# Event experience redesign — November 3, 2026

**Historical record:** the subsequent product decision shelves the broader
planner UI and simplifies the overview. Guest RSVP remains active. See the
[overview-only follow-up](overview-only-2026-11-03.md) for the current scope.

Local browser UI redesign for the event overview and exact-event reading page.
No production release, schema migration, new runtime package, paid block, or
license purchase was part of this work.

## Composition and registry sources

The project uses `base-nova` with Base UI and the existing Lucide icon library.
The ReUI MCP was unavailable in this run because its startup failed
authentication, so no MCP responses or claimed MCP audits were used. The
installed ReUI skill and the official ReUI pages informed an official
shadcn-registry CLI fallback. ReUI components and `c-*` examples are free; no
Pro block or Ultimate icon was installed. The installed shadcn CLI was version
4.21.4. The component/example installs changed source files only; no
`package.json` or `components.json` change was needed, and existing runtime
dependencies were reused.

| Source                                            | Use in Gatherory                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Frame](https://reui.io/components/frame)         | Existing owned Base UI Frame keeps event sections bounded. It is used for the event summary, RSVP, schedule, and overview agenda.                                                                                                                             |
| [Timeline](https://reui.io/components/timeline)   | Installed Base UI Timeline. The vertical `c-timeline-1` composition is adapted for upcoming activities and the exact-event schedule. `c-timeline-8` was also installed as a source example; its horizontal milestone layout is not used in the final screens. |
| [Icon Tile](https://reui.io/components/icon-tile) | Installed Base UI IconTile. `c-icon-tile-8` informs the event date and icon surfaces, empty state, and event identity treatment.                                                                                                                              |
| [Item](https://reui.io/components/item)           | Existing local Item primitive is reused for task, note, and people rows; no duplicate row component was added.                                                                                                                                                |

The registry components and examples were installed through the project's
configured `@reui` registry with these commands:

```sh
node_modules/.bin/shadcn add @reui/timeline @reui/icon-tile --yes
node_modules/.bin/shadcn add @reui/c-timeline-8 @reui/c-icon-tile-8 --yes
node_modules/.bin/shadcn add @reui/c-timeline-1 --yes
```

The Timeline page exposed `c-timeline-8` as a vertical example, but the
installed example is horizontal; the final vertical agenda follows
`c-timeline-1`. The resulting source lives in `src/components/reui/` and
`src/components/examples/`. Vendored component sources were formatted without
behavior changes. The UI adapts example structure to current event contracts,
English/Spanish labels, authorized data, and existing Gatherory theme tokens.
Sample dates, descriptions, and progress states are not rendered as product
data.

## What changed

The overview now gives actual event summaries a two-column card grid when space
allows and places a compact chronological agenda alongside it on wide screens.
Each linked event card combines its date, title, place, participants, schedule
and idea counts, planned spending, and budget progress. The agenda retains the
parent event title. Empty events, no upcoming activities, and unavailable older
snapshots remain explicit. Currency formatting retains cents, and the progress
calculation continues to use `MoneyDecimal`.

The exact-event page uses a framed, event-colored header, an RSVP panel, and
ordered schedule, task, note, and people sections. It uses the Timeline for
chronological agenda items and Item rows for readable planning lists. Long
titles and names wrap; schedule links and write controls keep visible focus and
at least 44px targets. The event colorway is a visual accent only; labels and
permissions retain their existing text and contract semantics.

The redesign keeps the existing capability gates and mutation behavior: own
RSVP when open, task complete/undo for permitted collaborators, own notes for
permitted collaborators, and basic details for hosts/managers. Guest summaries
remain separate from planner event reading. The host browser pass below
exercised persisted details, RSVP, task, and note updates; it does not establish
the full collaborator/guest role matrix by itself.

Empty events, no upcoming activity, and unavailable older snapshots have
explicit UI states. This redesign retains the shared route-level
`PageSkeleton`; it does not add a separate loading skeleton for every region.
The overview's existing loader error remains a toast with its current
empty-content fallback, without a new region-level Retry control. Those states
were not expanded in this visual slice.

## Verification

Browser checks used the owned disposable PostgreSQL 18 fixture and a separate
Vite server on loopback port 3011. The fixture contains synthetic users and two
independently persisted root events, including a committed $12.75 expense and a
$200 budget cap. It did not use shared development records or external media,
email, notification, FCM, MCP, or analytics providers.

- Overview: Light and Dark at 1440px, and Dark at 320px, 390px, and 768px. No
  horizontal overflow was observed. The 768px layout kept event cards in one
  column beside the existing navigation; the desktop fixture showed two real
  event cards.
- Exact-event page: Dark at 1440px, 768px, 390px, and 320px. No horizontal
  overflow was observed; the desktop view placed the schedule and RSVP in two
  columns, and narrow views kept RSVP before the vertical schedule. Visible
  controls and agenda anchors measured at least 44px.
- Details editor at 320×400px stayed within the viewport (`top=8`, `bottom=392`).
  Save, Cancel, and Close met the 44px target. Cancel returned focus to Edit
  details.
- As the host, editing the root event title, description, and location appeared
  in the persisted overview; changing RSVP to Maybe and opening a child event
  worked; a task transitioned Complete → Undo → Complete; and a new note saved
  once and appeared in the event.
- A view-only collaborator could see their own RSVP choices, while details,
  note creation, and task completion controls stayed absent.
- Screenshots: `/tmp/gatherory-reui-overview-dark-20261103.png`,
  `/tmp/gatherory-reui-overview-light-20261103.png`,
  `/tmp/gatherory-reui-event-dark-20261103.png`, and
  `/tmp/gatherory-reui-event-mobile-20261103.png`; the Light exact-event view
  is `/tmp/gatherory-reui-event-light-20261103.png`.
- Focused UI regressions: 27 tests across five files passed. The two changed UI
  agents reported passing focused TypeScript and Prettier checks. The final
  `pnpm typecheck --pretty false`, 14-file scoped Prettier check, and
  `git diff --check` passed. ReUI static C1–C4 checks passed. The MCP audit
  checklist was not run because MCP startup failed authentication.
- Disposable PostgreSQL regressions: the opt-in event-reading/selected-updates
  database test and browser-guest invitation database test both passed (2
  tests total) against the owned loopback database.
- Final full suite: `pnpm test` passed the contract check and 185 test files;
  48 opt-in files were skipped. 1,091 tests passed and 76 opt-in tests were
  skipped (57.23 seconds).

Focused coverage includes responsive overview composition and empty states,
cent-accurate tracked spending and budget display, event detail wrapping,
permission-gated controls, RSVP rendering, task/note content, and the selected
event editor layout. Browser acceptance covered a host and a view-only
collaborator. Contributor, child-only, and guest role checks; live Spanish;
screen-reader and 200% text checks; and Android re-verification of this visual
redesign remain open. The prior
[event reading acceptance record](event-reading-selected-updates-2026-11-03.md)
and [mobile browser record](mobile-browser-acceptance-2026-11-03.md) retain the
earlier functional and device limits. No production deployment was performed.
