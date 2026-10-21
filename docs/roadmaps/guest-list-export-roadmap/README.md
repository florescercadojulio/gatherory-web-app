# Export Guest List — mobile V1

Implemented locally October 21, 2026. Authorized event managers can explicitly
export a CSV attachment through the native iPhone share sheet. No server API,
database schema, browser feature, deployment or commit is part of this slice.

## Experience and contents

In Home, open an event's **…** menu or long-press its card and choose **Export
Guest List**. The same action appears as the share/export toolbar button in
**Manage → Guests → Guest List**. There is no extra selection or review wizard.

`Guest List.csv` contains exactly two columns: **Name** and **RSVP Status**.
English statuses are Invited, Going, Maybe and Can't go; headers, statuses,
controls, unnamed-guest placeholders and errors also have Spanish translations.
It matches the app's existing Guest List semantics: all attendees in the selected
event, including hosts and collaborators, across every RSVP state. Distinct
people with the same name retain separate rows. Roster order is preserved.

A root event exports only its own roster, never child rosters. A child exports
only its own contextual attendance, never its parent or siblings. Status comes
from that exact event's participation, not a person's main-event default. Pending
join requests and unrelated workspace members are not part of the roster.

There are no email, phone, role, account/member/event IDs, avatar/profile links,
invitation credentials, notes, budget or other contact/planning columns. Names
are never generated from email. Blank names and names matching the stored email
address become **Unnamed Guest**; other display names are copied as entered.

## Permissions and privacy

The action requires a configured signed-in account whose exact ID matches an
active host or managing collaborator for the selected event. It reuses existing
invitation-management lifecycle rules. Guests (device or account), contributing
or view-only planners, inactive memberships, invitation projections and unresolved
accounts cannot export. Preview first-member and email-match fallbacks never
authorize the action. Finished/read-only, cancelled and removed events do not
gain additional rights.

Explicit scope checks reject unrelated children and malformed scoped projections.
A scoped child workspace can export only its genuine matching main record.
The action does not create a link, invitation, permission grant or sync mutation.

Both schedule and guest-list exports use the same native presentation machinery.
The pending request stores only kind, event reference, workspace ID, exact account
ID and session generation. It builds the file from a fresh authorized projection
immediately before presentation. An account switch (including A → B → A), sign-out,
unfinished guest handover, permission loss or changed eligible CSV data dismisses
or rejects a pending share. RSVP/name/roster changes invalidate the frozen sheet
rather than exporting an older cached guest list.

Local cached permissions and data permit offline use; the existing sync flow
must receive a server revocation before the device can know about it. This is
an explicit independent file copy, not a live roster or a freshness guarantee.
Once a destination has copied the attachment, it cannot be recalled or updated.
Managers choose where to send it in the system share sheet; the app never sends
the roster automatically or logs its contents.

## Shared CSV and attachment lifecycle

`EventCSVEncoder` is the small shared encoder extracted from schedule sharing.
Both exports use quoted/escaped RFC-4180-style fields, comma separation, CRLF
records and UTF-8 with a BOM. Commas, quotes, line breaks and accented names round
trip. Formula-like values (including those behind whitespace/control characters)
receive a leading apostrophe so spreadsheet apps treat them as data.

A sealed export-kind enum chooses only `Event Schedule.csv` or `Guest List.csv`.
No user input can choose a path or filename. Each export gets a separate temporary
directory and an atomic write requesting complete file protection. Dismissal,
completion and object release remove only that export's directory. Failed creation
preserves existing data and reports a localized error. Cleanup cannot remove an
open schedule or another guest export, including those from another account.

Abrupt process termination can leave a protected temporary file until OS cleanup;
it is not an account cache and a later share never reuses it. The simulator omits
file-protection metadata, so that protection check remains device-only. Names are
personal information; do not add broad export logging, persistent previews or
cross-account cleanup of active attachments.

## Implementation

Native owners:

- `Gatherory/Features/Events/EventGuestListExport.swift`: exact-event policy and
  the two-column projection.
- `Gatherory/Features/Events/EventCSVEncoder.swift`: shared CSV security, UTF-8
  bytes and explicit locale bundle resolution.
- `Gatherory/Features/Events/EventScheduleShareButton.swift`: shared request,
  screen-root presentation modifier and native activity controller. Its original
  filename is retained; the presentation now handles both CSV kinds.
- `Gatherory/Features/Events/EventScheduleShareAttachment.swift`: sealed filenames,
  protected temporary storage and isolated cleanup shared by both exports.
- `Gatherory/Features/Events/EventGuestListExportButton.swift`, Home and
  `CollaborationInviteView.swift`: existing event menus and Guest List toolbar.
- `EventGuestListExportTests.swift`, `EventCSVExportRequestTests.swift` and the
  expanded attachment tests: non-UI coverage alongside existing schedule tests.

No dependency or Xcode project-file changes are required; synchronized source
groups include the new Swift files. Existing staged build artifacts, blueprint
edits and prior notification/schedule work remain intact.

## Verification and device checks

October 21 verification:

- **884 native tests in 124 suites pass**, selecting only `GatheroryTests` with
  PostHog and parallel testing disabled. Nine guest-export tests cover role and
  identity matrices, exact contextual roster/status, privacy/name redaction,
  duplicate names, scoped projections, Spanish, immutable copies, CSV escaping
  and formula neutralization. Three shared-request tests cover sign-out/re-entry
  generations, workspace mismatch, fresh RSVP data, permission loss, separate
  export kinds and pending guest handover. The expanded attachment suite verifies
  cross-kind cleanup isolation. Existing schedule tests remain green.
- Localization checks pass for **1,492 English/Spanish strings**, including 11
  new controls, headers, RSVP labels, placeholder and errors. The existing
  AppCopy dynamic-key extraction warning remains.
- Swift parsing and both repositories' `git diff --check` pass. No dependency,
  backend API, database or portable-contract changes require server tests.

Logs: `/tmp/gatherory-guest-export-native-20261021.log` and
`/tmp/gatherory-guest-export-localizations-20261021.log`. Commands and the result
bundle are recorded in the native
[verification log](../../../../ios-apps/gatherory/docs/testing-verification.md).
No UI-automation tests, real exports, remote writes or deployment were performed.

Physical-device acceptance remaining:

1. As host/manager, export from the event menu and Manage Guest List toolbar.
   Verify `Guest List.csv` in Mail, Messages, AirDrop, Files and a spreadsheet app.
   Check English/Spanish headers and all RSVP states, accented/duplicate names,
   quoted/multiline names and disabled formula-like values.
2. Inspect every column and the selected roster. Confirm no contact information,
   parent/sibling attendees, pending join requests, roles or identifiers appear.
   Try the same person with different RSVP states in two events.
3. Verify guests, contributors, view-only/inactive planners and pending guest
   imports have no export action. Exercise parent and child manager differences.
4. Change accounts, roles, names, roster or RSVP while the sheet is open. Confirm
   dismissal, no stale file reuse and isolated cleanup. Test share/cancel, file
   protection on a physical iPhone, a creation failure and abrupt termination.
5. Check VoiceOver, large text, light/dark appearance and iPad presentation. Recheck
   schedule sharing through the common presenter, including its rounded Home
   card/menu behavior. This feature asks for no contacts or calendar permission.

No build upload, commit, push or deployment is authorized by this implementation.
