# Mobile browser acceptance — November 3, 2026

**Status:** Core guest RSVP and selected planner interactions passed recorded in-app browser and Android API 37 Chrome checks. The full web test suite and disposable database regressions passed. Physical QR scanning, Dark mode, live Spanish UI, and broader role/accessibility coverage remain open.

## Fixture and safety

The repeatable fixture is `scripts/seed-mobile-browser-test.ts`. It creates
synthetic host/manage, contributor, view-only, signed-in guest, and child-only
planner accounts; public guest and collaborator approval links; expired and
revoked invitation links; and a long bilingual event, location, participant
names, child events, task, note, and native sync records.

The seed command requires `--confirm-disposable-target`, a loopback PostgreSQL
URL whose database name is exactly `gatherory_mobile_browser_test`, and a
loopback app URL. Its default app URL is `http://localhost:3011`. Credentials,
IDs, and routes are written to `/tmp/gatherory-mobile-browser-fixture.json`
with mode `0600`; the password is kept out of that file and console output. No
media, notification, or other external provider is used.

The native archive uses the iOS `WorkspaceArchiveV1` fields and `EventLocation`
object shape. Event payloads use the iOS `EventPurpose` raw values
`planning` and `eventExperience`; timestamps use numeric Foundation reference
seconds. The disposable fixture has five root participants, six child timeline
items and event entities, one note, and one task. Existing fixture IDs, tokens,
and guest RSVP data were preserved while correcting the archive and invitation
preview access.

## Recorded browser checks

In the in-app browser, the guest form was inspected at 320×568, 360×740,
390×844, 768×1024, and 1440×900. At each size the document width matched the
viewport width. Interactive controls measured at least 44 px high, and phone
inputs used 16 px text.

The child event was also inspected at 320×568, 360×740, 390×844, 768×1024,
and 1440×900. Each viewport had one main landmark and RSVP section, and its
document width matched the viewport. A width-only test does not establish
physical-device or camera behavior.

At 390 px width, submitting the blank guest form focused the inline validation
error. A guest named María submitted Going, reloaded with the response retained,
changed the response to Maybe, opened View event, and returned with browser
Back. The explicit different-person flow cleared the name while preserving the
earlier guest response. Host sign-in continued to the exact root event. A
320 px title layout issue was found and fixed during this pass.

On Android API 37 Chrome, after the first-run setup was approved, touch focus
opened the keyboard for the guest name field. Dismissing the keyboard and
scrolling retained the draft. Touching Going and Send displayed the saved
confirmation; View event showed that guest's own Going response. Android Back
returned to the join URL after opening the invited-event summary, and the saved
Going response remained visible.

At 360 px width, anonymous visits to expired and revoked guest links showed a
generic unavailable page without a response form, plus sign-in and account
creation links. A signed-in host with existing event membership could still
open the expired link for their own event, as expected.

At 320×400, the event details editor now stays inside the viewport
(`top=8`, `bottom=392`, `max-height=384`). A 1,260-character description saved
as 1,259 characters with a new title; reopening the editor showed the saved
values, and closing it returned focus to Edit details. At 320×568, the child
task transitioned Complete → Undo → Complete, and a newly created note showed
success confirmation and appeared in the list.

The Android editor originally let the software keyboard cover Save and Cancel.
The root viewport metadata now includes
`interactive-widget=resizes-content`. In Android API 37 Chrome, opening the
keyboard resized the editor so both actions remained visible above it. A
focused regression test covers the viewport metadata without disabling zoom.
See Chrome's [viewport resize behavior guidance](https://developer.chrome.com/blog/viewport-resize-behavior/).
Tapping Save with the keyboard open closed the editor. This pass did not verify
a new Android editor string value being saved.

Screenshots: [390 px child event](/tmp/gatherory-mobile-child-390-20261103.jpg),
[Android RSVP](/tmp/gatherory-mobile-android-rsvp-20261103.png), and
[Android editor with keyboard](/tmp/gatherory-mobile-android-editor-keyboard-20261103.png).

## Verification

- `pnpm test`: 185 files passed, 48 skipped; 1,088 tests passed, 76 skipped
  (69.73 seconds).
- `pnpm typecheck --pretty false`: passed.
- Prettier check for the changed components, routes, and fixture tests: passed.
- `git diff --check`: passed.
- Focused mobile viewport and fixture tests: 2 files, 4 tests passed. The
  viewport regression confirms Android keyboard resize metadata while preserving
  zoom.
- Against the owned loopback PostgreSQL database, the opt-in event-reading and
  browser guest invitation integration files passed: 2 files, 2 tests. The
  disposable PostgreSQL container was stopped with automatic removal; Vite was
  stopped, browser tabs were closed, viewport state was reset, and the Android
  emulator was stopped (`adb devices` listed no attached devices).

## Remaining acceptance

- Physical Android device and camera-based QR scanning have not been verified;
  the accepted guest flow above used Android API 37 Chrome.
- Dark mode and an interactive Spanish-locale browser pass are pending. Spanish
  unit-render coverage exists, but it does not establish the live browser flow.
- Broader permission coverage remains open: view-only control visibility,
  child-only parent denial, and collaborator request → approval → refresh.
- Full accessibility, zoom, and network-recovery coverage remain open; the
  recorded keyboard paths do not replace that full interaction coverage.
- On Android, tapping the editor Save action while the keyboard was open closed
  the editor after the viewport fix. Only the in-app browser verified saving
  and reopening new title and description values.

No deployment or shared-database change is part of this acceptance record.
