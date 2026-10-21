# Share Event Schedule — mobile V1

Implemented locally October 21, 2026. This iPhone action creates a CSV attachment
of an authorized event schedule and opens the native share sheet. No
backend endpoint, schema change, browser feature, deployment or commit is part
of this slice.

## Experience

Open an event in Home, choose its **…** menu, then **Share Event Schedule**.
The same action is available in the event card's long-press menu. The native
share sheet offers the system's available file destinations, such as Messages,
Mail, AirDrop and Save to Files. Sharing is explicit; changing an event never sends anything.
There is no additional review screen, link creation or publication step.

The CSV contains the chosen event's title, dates/times in its time zone and
public venue/address fields. A main event also includes eligible scheduled
child events, ordered by start time. A child event shares only itself. The file
is a snapshot: later edits do not update copies already sent elsewhere.

`Event Schedule.csv` has one header row and one row per event, with columns
**Event, Start, End, All Day, Time Zone, Location** (localized in Spanish).
Every field is quoted, quotes are escaped and records use CRLF line endings;
commas, Unicode and line breaks inside names/locations remain intact. Formula-like
cells are prefixed with an apostrophe so spreadsheets treat them as data.
The UTF-8 BOM helps spreadsheet apps preserve accented names and headers.

[Guest-list CSV export](../guest-list-export-roadmap/README.md) is a separate,
explicit manager action. It reuses the CSV encoder, sealed filenames and native
presentation machinery while preserving each export's distinct field allowlist
and event scope. The schedule attachment still contains schedule fields only.

## Permissions and privacy

- Only a signed-in, configured account with an active exact-event host or
  managing-collaborator membership can share. Existing invitation-management
  lifecycle rules apply; finished/read-only, cancelled or removed events do not
  gain new sharing rights.
- Device guests, account attendees, contributing/view-only planners, invitation
  projections and unresolved accounts have no action. A matching email or the
  preview first-member fallback cannot authorize export. Guest handover/session
  recovery/sign-out do not expose an account share action.
- A root export includes only approved, scheduled `eventExperience` children
  belonging to that root, and only where the same account has exact-child
  management permission. Planning/scouting items, drafts, rejected/undecided,
  archived, cancelled or completed children are omitted. An explicitly selected
  approved child may be undated and leaves Start/End empty, rather than
  exposing a placeholder date.
- A scoped child projection uses its own matching event record, never cached
  parent/sibling content. Ideas are not export targets.
- The allowlist excludes guest/member lists, RSVP data, names/contact records,
  private notes and descriptions, announcements, tasks, budgets, media, account
  or event IDs, map coordinates/identifiers and invitation credentials. User text
  in the intentionally shared title/location is copied as entered.

Authorization uses the currently active local workspace and exact account ID.
It is checked when displaying the action, on activation, and immediately before
creating the system share controller. The request pins the event, workspace,
account and session generation; changes invalidate it, including A → B → A.
An open sheet is dismissed when the currently eligible CSV changes, such as
an included child's permission changing. No broad workspace archive is passed
to the operating system; only the allowlisted CSV attachment is shared.

This local feature works from cached data offline. It does not discover server
revocations until the existing sync flow receives them, and it does not promise
a live/fresh-server schedule. Once a file has been copied or handed to another
app it cannot be recalled. No permission grants or server access are created.
The feature writes no archive, mutation, media upload or analytics event. Each
share gets its own temporary directory and a file written with complete data
protection, using a fixed, safe filename
containing no account/event identifiers. Completion, dismissal (including
permission/account invalidation) and object release remove only that directory.
Creation failures preserve existing files and show a localized retry message.
An abrupt process termination can leave a protected temporary attachment until
the operating system removes it; it is never exposed through account caches or
automatically reused in a later share.

## Dates and localization

Each event retains its own time zone, with ISO-8601 timestamps and numeric UTC
offsets to disambiguate daylight-saving transitions, plus an explicit zone
identifier. All-day ranges use inclusive `yyyy-MM-dd` local dates, without
fabricated times. The All Day column uses `TRUE`/`FALSE`. Missing or invalid end times
do not invent a duration; an invalid legacy zone uses labeled UTC. New controls,
CSV headers and file-creation errors have English and Spanish copy.

## Implementation and verification

Native owners:

- `Gatherory/Features/Events/EventScheduleShare.swift`: immutable CSV projection,
  allowlist, permission policy, CSV escaping and date formatting.
- `Gatherory/Features/Events/EventScheduleShareButton.swift`: explicit action,
  scope-only request and native activity controller.
- `Gatherory/Features/Events/EventScheduleShareAttachment.swift`: protected
  temporary attachment creation and isolated cleanup.
- `Gatherory/Features/Home/HomeView.swift`: event menus, current principal and
  open-sheet invalidation.
- `Gatherory/App/PlanningWorkspace.swift`: a small exact configured-account check
  that avoids legacy preview/email fallback authorization.
- `GatheroryTests/EventScheduleShareTests.swift`: role, account, scope, privacy,
  lifecycle, unscheduled, locale, time-zone and CSV regression coverage.
- `GatheroryTests/EventScheduleShareAttachmentTests.swift`: attachment bytes,
  protection, independent cleanup and creation-failure regression coverage.

No native project-file or dependency change is required. The synchronized source
groups include the new Swift files.

Initial text-sharing verification on October 21 (before the CSV follow-up):

- The full `GatheroryTests` target passes **866 tests in 121 suites**, including
  **11 new schedule-export tests**. Only that target was selected, parallel
  testing and PostHog were disabled, and no UI-automation target was run.
- English/Spanish localization coverage passes for **1,473 strings**. Five new
  schedule-sharing strings are translated. The 23 pre-existing missing Spanish
  translations that blocked the full suite were also filled, preserving every
  existing translation and English source value. The existing dynamic AppCopy
  extraction warning remains.
- Swift parsing and both repositories' `git diff --check` pass. No real external
  shares, server tests, database mutations or deployment were needed.

Commands and result bundle are recorded in the native
[verification log](../../../../ios-apps/gatherory/docs/testing-verification.md).
Logs: `/tmp/gatherory-schedule-share-native-20261021-r2.log` and
`/tmp/gatherory-schedule-share-localizations-20261021-r2.log`.

CSV/card follow-up verification on October 21:

- **871 native tests in 122 suites pass**, selecting only `GatheroryTests` with
  parallel testing and PostHog disabled. CSV coverage now has 13 export tests
  plus 3 temporary-attachment tests: independent parsing/round trips, commas,
  quotes, multiline/Unicode data, formula neutralization, file bytes, isolated
  cleanup, object release and failed creation without deleting existing data.
- English/Spanish localization checks pass for **1,481 strings**, including six
  CSV headers and the file-creation error. Swift parsing and whitespace checks
  pass. The simulator omits file-protection metadata; the protection assertion
  is device-only, while byte and cleanup assertions run on the simulator.
- No UI-automation tests, real shares, upload, commit or deployment occurred.
  Actual long-press animation, shadow appearance and file handling in destination
  apps remain physical-device acceptance.

Logs: `/tmp/gatherory-csv-native-20261021-r2.log` and
`/tmp/gatherory-csv-localizations-20261021.log`.

## Card long-press follow-up

The Home hero previously clipped its outer container after attaching the context
menu, allowing a rectangular source to be captured for the lift animation.
Its content, context-menu preview, interaction region and matched zoom source
now use the same continuous rounded rectangle. A subtle shadow sits outside the
clipped content/border (`mediaScrim` at 0.12 opacity, radius 12, vertical offset 6).
Gesture handlers, menu actions and permissions are unchanged. Actual preview
animation and shadow appearance still require the physical-device visual pass.

## Physical-device acceptance remaining

1. Host and managing collaborator: open a main event and a selected child,
   choose **… → Share Event Schedule**, and check the CSV attachment in Messages,
   Mail, AirDrop and Save to Files. Open it in Numbers/Excel and confirm headers,
   accents, multiline fields and disabled formula-like cells. Confirm
   share-sheet dismissal/cancel, keyboard behavior and repeated use. Check iPad
   sheet/popover placement as well as iPhone presentation.
   Verify file protection on a physical device and cleanup after cancel/share,
   permission invalidation, account switching and interrupted presentation.
2. Inspect the actual outbound copy. Verify only eligible public schedule items
   appear, with correct venue/address, dates, time zones and all-day ranges;
   private planning and guest information must be absent.
3. Verify the action is absent for device guests, attendees, inactive members,
   contributor/view-only planners and mismatched accounts. Confirm a child-only
   planner cannot export parent/sibling content.
4. While the sheet is open, switch accounts, begin sign-out, change schedule
   details or receive a permission/lifecycle change. Verify dismissal. Content
   already handed to a destination remains an independent copy.
5. Test offline cached sharing, Spanish, VoiceOver, larger text, Reduce Motion
   and light/dark appearance. This does not grant calendar, contacts, photos or
   notification permissions.
6. Long-press main/child cards and check that their rounded outline stays stable
   throughout the lift/dismiss animation. Inspect the subtle shadow in light and
   dark appearance, then normal tap/zoom/back and the event switcher gestures.

No build upload, commit, push or deployment is authorized by this implementation.
