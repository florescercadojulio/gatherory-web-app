# Read-only overview and retained guest RSVP — November 3, 2026

The product owner shelved the broader planner UI and selected an overview-only,
read-only event-planning web surface. Guest invitations and own RSVP remain
available. This supersedes the active UI direction in the earlier event-reading
and visual-redesign acceptance records; those records remain historical.

## Active scope

- `/workspaces` shows authorized main-event summaries with no event-detail links
  or event write controls. Upcoming activities remain a read-only list.
- Planner `/events/$eventId` and legacy workspace planning routes return to the
  overview. Shelved implementation source remains available for later work.
- `/join/$token` and `/invited/events/$eventId` retain invitation entry, guest
  event summaries, persisted own-response changes, and access/error recovery.
  Signed-in guests retain the same invitation flow; planner collaborators return
  to the overview.
- Server authorization/workflows, native and MCP APIs, existing Blueprint tools,
  account settings, and connected-app management are outside this UI change.

## Overview cleanup

The overview uses the installed [REUI Frame](https://reui.io/components/frame)
with its supported variants and spacing. The broader colored card treatment,
universal party motif, repeated dates, icon-only metrics, and progress-style
agenda are removed. Summary counts have visible labels, event/parent names can
wrap, and unknown activity purposes are not described as guest-facing.
Main-event dates use the event timezone. Activity timestamps lack event timezone
metadata in the existing projection and are displayed with an explicit viewer
timezone label. Money retains cents and the existing Decimal.js budget math.

A failed overview read displays its error and Retry action, instead of showing
empty-account onboarding and a misleading zero-event count.

## Verification

- `pnpm test`: contract generation check passed; 187 test files / 1,100 tests
  passed, with 48 opt-in files / 76 tests skipped.
- Eight focused overview, routing, guest UI, and invitation-boundary suites
  passed (43 tests). New coverage checks planner redirects, signed-in and
  accountless guest continuation, failed reads versus empty accounts, visible
  counts, timezone dates, cents, and noninteractive summaries.
- `pnpm typecheck --pretty false`, scoped Prettier, `git diff --check`, and the
  REUI C1–C4 static scans passed. Routes were regenerated with
  `pnpm generate-routes`. No lint script is configured and no REUI MCP audit
  tool was available in this session.
- An initial SSR request to the local app at `/events/:eventId` returned HTTP
  307 with `Location: /workspaces`, without following the redirect or reading
  shared event records.
- Browser visual acceptance used the real component/styles with synthetic
  records: English Light at 1440px and 390px; English and Spanish Dark at
  320px. No horizontal overflow was observed. The 320px count cells did not
  overflow, and the overview content contained no links, buttons, or forms.
  Empty, no-upcoming, and older-snapshot states were also checked in Spanish.
- Screenshots: `/tmp/gatherory-overview-only-desktop-20261103.png` and
  `/tmp/gatherory-overview-only-mobile-20261103.png`.

The disposable component preview used no database or authentication. It does
not establish end-to-end sign-in, invitation persistence, authorization, or
native-device behavior. Prior guest and database acceptance records remain the
evidence for unchanged functionality; no database suite or Android device pass
was rerun for this presentation/routing change. The temporary preview server,
fixture, and browser tab were removed, and the viewport override was reset.

The existing shared route-level loading skeleton remains; it is not a newly
verified per-region loading composition.

## Actual currency follow-up

The overview now returns a required `currencyCode: string | null` alongside
each main-event summary. Its source is the existing canonical
`workspacePlanningSettings.currencyCode` row joined by the event's organization,
which is also the source of that summary's budget cap. Child expenses continue
to aggregate into their own main event. There is no currency conversion or
cross-event combined monetary total.

The existing authenticated handler → Effect workflow → service → injected
repository path is unchanged. The repository selects the currency with the
existing scoped query and normalizes three-letter codes. Missing settings or
malformed currency produce `null`; they do not invent USD. A persisted USD
setting is still displayed as USD.

Spending and the budget cap share that event's locale-aware currency formatter.
Currency-specific display digits are used, including zero for JPY and three
for KWD. Decimal.js (`MoneyDecimal`) retains expense summation and budget-ratio
arithmetic and performs display rounding before the existing number formatting
boundary. Unknown currency displays neutral localized decimal amounts and one
localized “Currency unavailable” notice per event. No schema migration, FX
provider, dependency, native money transport, or writable browser surface was
introduced. The overview's existing JSON numeric amount fields remain numbers;
this change does not upgrade that transport to decimal strings or minor units.

Six focused regression suites passed (27 tests): query column selection and
separate USD/EUR root-plus-child totals, missing/invalid metadata, real
handler/workflow/service currency serialization and safe errors, mixed-currency
SSR rendering, JPY/KWD digits, English/Spanish formatting, and the unknown
currency notice. TypeScript, formatting, and C1–C4 checks passed. Final
`pnpm test` passed the contract check and 188 files / 1,107 tests; 48 opt-in
files / 76 tests were skipped. No additional database or browser
visual pass was performed for this formatting/projection change; the prior
layout screenshots above predate the currency follow-up.
