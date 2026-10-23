# Single Blueprint preview and event creation

**Status:** Public and Yours single-scroll previews are implemented and verified
locally on October 23, 2026. Creation handoff now has native transport/import
and disposable-database regression coverage. Deployed-account and device acceptance remain open;
one editor frame-dimension runtime diagnostic remains unresolved.

## Accepted flow

Public discovery, Saved/Liked, shared-link previews, and Yours use one scrolling
view containing the main event, related events and masonry ideas. Public content
opens read-only details. In Yours, tapping the main event, a related event or an
idea opens its existing native editor directly. There is no Edit mode, second
Edit tap, or Blueprint Decide route. Decide belongs to the event/workspace after
explicit creation.

Yours opens with the same standard SwiftUI full-screen presentation as Liked,
with a back chevron to return to the collection. This supersedes the large-sheet
iteration below. Explore retains its existing native zoom return and inner
public details retain normal stack navigation. No custom gesture code is added.

**Use** is the native bottom-toolbar action that opens event creation. A native Add menu
provides event and idea creation, including empty sections. There is no pinned
bottom action panel. Event and idea editors use native large sheets with explicit Save/Cancel behavior, account/version
checks and personal-save retry. Use remains available for reusable
plans after earlier use, separately from receipt recovery.

The Yours library cards resolve cover artwork from the same customized content
and source identity as the opened preview. They retain concise scan-first text.
The overview uses a regular VStack for its sections to avoid lazy height jumps.
The current acceptance pass uses standard text sizes in Light/Dark; dedicated
super-large layout tests were removed at the user's request. Existing Dynamic
Type behavior remains supported in the implementation.

The public main-event presentation uses a reserved image area and text that can
grow below it. Long titles and accessibility text must not be clipped inside a
fixed-height cover. Included events stay compact; ideas use the existing
`AdaptiveMasonry` layout with independent columns and 12-point spacing, matching
the personal Ideas view. Cards retain their category-specific artwork ratios;
each next card fills the shorter column instead of aligning to a shared grid
row. Accessibility sizes use one column.

Actions retain the [slice 13](13-discovery-and-library-actions.md) distinction:

- Explore has Like, Save and More. More contains Use Blueprint and Not interested.
- Saved/Liked retain direct Use Blueprint; shared links retain direct Use without
  public preference controls.
- Like and Save remain private references and never create a personal copy or event.
- Explicit Use prepares or resumes the account-bound working plan and opens setup.
- Yours provides native bottom-toolbar Use and Add controls; tap content directly to edit.

For a **new** working plan, Use includes all authored ideas and events by default.
Creation selection no longer depends on legacy Blueprint Love/Pass responses.
Existing saved plans preserve selected sets, exclusions, dates and pinned source
revisions. Editing an existing excluded item does not include it; explicitly
adding a new event or idea includes that new item. Name/cover/date-only saves do
not re-project selection. Saving an editable used source retains its schedule and receives a fresh
working request identity. The separate explicit fresh-workspace-copy path still
resets date confirmations. Pending requests remain immutable.

## Focused setup and completion

Setup opens at full height with a grouped native form inspired by onboarding's
`NewWorkspaceView`: an editable event name, main date/time and included-event
dates. Onboarding itself is unchanged. Date rows open the existing shared
`EventDateTimeEditorView`, using its native Cancel/Done controls instead of a
forced calendar popover. Blueprint creation supports a timed start; it does not
expose unsupported end/all-day, location, budget or cover inputs. The main date
chooses the common event time zone; child editors retain that zone.

Done explicitly confirms a date; Cancel leaves the saved draft unchanged.
Suggestions remain unconfirmed until explicitly accepted. Creation requires a
valid event name and confirmed dates for every selected event. Name edits keep
confirmed dates; cancelling setup retains valid progress. Stale editor callbacks
must match the opening owner, setup generation and request identity. Existing
saved selections are restored directly, independently of legacy Decide responses.
Legacy setup retains its event-inclusion switches. Content editing stays in Yours.

User-facing creation and retry controls say Create Events / Retry Creating
Events rather than exposing the internal installation terminology. API names,
receipt identities and durable installation intents keep their existing names.

The existing coordinator remains responsible for private snapshot preparation,
review, installation and canonical bootstrap import. It selects the main event
matching the server's scope identity; the actual event workspace provides access
to its related events. The client does not create another local event on success.
Cleanup removes only the exact completed setup request. Workspace selection
happens after both draft cleanup and durable request completion succeed. Failed
cleanup retains receipt recovery and does not open a partially completed handoff.
The coordinator rejects a caller-supplied intent that differs from the exact
stored request, and rejects another account before writing an intent.
Personal Blueprint
records and reusable installation source snapshots are separate from that cleanup.
Yours keeps an explicit Use action for reusable plans even after an
earlier use; that deliberate action remains separate from receipt recovery.

Interrupted creation retries the same persisted request/body. Pending canonical
imports take priority over starting another creation; account-generation and
source/version checks remain in place. This slice adds no publication, sharing,
ranking, database schema or backend behavior.

## Verification

### Use to created-event handoff — October 23

The native UI now exercises private copying, date confirmation, preview,
installation and canonical import through the production transport/coordinator,
then opens the actual event workspace. Discovery/Light succeeds directly;
Yours/Dark retries a simulated transient failure with the same request body and
idempotency key. Both journeys verify the submitted event name, selected related
event and copied ideas after setup/preview dismissal. Saved-reference-to-Yours
and date-progress regressions remain covered separately.

New native recovery tests hold selection until import and cleanup finish,
recover missing-bootstrap and cleanup failures without a second installation
POST, and reject altered intents or another owner's request before network or
intent writes. Existing tests retain customized content, account-generation,
relaunch and independent-copy checks.

Three enabled workflow tests passed against a disposable PostgreSQL 18 database
with the current migrations. They verify exact copied/published documents and
source snapshots, created event/idea content, guide audiences/targets, to-dos,
same-request copy/install replay and lost provider-response recovery without
duplicate provisioning. Typecheck passed. The temporary database was removed;
no shared database reset or deployment occurred.

The final native run passed 37/37 distinct checks (35 unit/two UI, 40 executions,
zero failures/skips). A separate passing two-method UI run also covers the full
Light/Dark date-confirmation and saved-progress journey. Final Light/Dark created
event captures were inspected; EN/ES localization passes for 1,694 strings.
The final simulator Release build passed without compiler diagnostics.

The [native verification record](../../../../ios-apps/gatherory/docs/testing-verification.md#use-to-created-event-handoff--october-23-2026)
records bundles, counts, corrected fixture failures and acceptance boundaries.
Native UI uses local protocol responses; the PostgreSQL tests use provisioning
and cover-storage adapters. These checks do not prove deployed authentication,
real media transfer or physical-device behavior. The existing frame-dimension
diagnostic remains open. The next acceptance step is this same journey against
the compatible deployed backend with a disposable signed-in account and an
iPhone; retain the request across a failed response and confirm one creation.

### Native bottom actions and event creation — October 23

The follow-up passed **69 distinct checks across staged runs (65 unit/four UI)**;
a second run passed 67/67 selected checks, including normal Light/Dark name and
date confirmation/cancellation, retained progress and fully visible native bottom
actions. Creation restores saved selections without legacy Love projection.
Screenshot review also caught a first-open legacy-layout problem: setup now
uses an identifiable route with an immutable creation owner, covered by explicit
first-presentation assertions. Both final route UI methods passed, including
complete normal Light/Dark name/date flows. Final simulator Release build and
EN/ES localization pass. Onboarding files remain unchanged; no packages
were installed. The native project instructions now exclude ReUI/web guidance.

See the [current verification record](../../../../ios-apps/gatherory/docs/testing-verification.md#yours-bottom-controls-and-native-creation-form--october-23-2026)
for exact bundles, final route checks and remaining runtime/device boundaries.

### Previous Yours direct-edit correction — October 23

Three Luna agents handled UI, content/selection and tests. **72 distinct focused
methods passed across staged runs (57 unit and 15 UI)**; the final-source rerun
passed all 62 selected methods with zero failures/skips. Normal-size Light/Dark
captures of the overview, direct editor and masonry were inspected. Native Add
forms and Save/Cancel, real setup cancellation, full-screen recovery, read-only
public boundaries and selection/date/request regressions pass. EN/ES coverage
passes for 1,693 strings; the final simulator Release build and scoped native
source/documentation checks pass.

The existing frame-dimension diagnostic still appears (two occurrences in the
final result) without a source location. Live server creation and physical
VoiceOver/Reduce Motion acceptance remain open; no deployment occurred.
Exact bundles, initial failures/corrections and boundaries are recorded in the
[native verification record](../../../../ios-apps/gatherory/docs/testing-verification.md#yours-full-screen-and-direct-editing--october-23-2026).
The previous sheet/Edit/Decide and XXXL results below are historical, superseded
by this correction; they do not verify the final UI.

### Previous Yours single-scroll iteration (superseded)

Three smaller Luna agents split production UI, regression tests and shared docs;
parent integration handled accessibility fixes, native dismissal evaluation and
serial Xcode verification. **75 distinct focused methods passed across staged
runs: 61 unit and 14 UI methods**. The final seven-method Yours UI run passed
with zero failures/skips, followed by five geometry unit methods and two affected
UI methods after the final accessibility header/cover normalization changes.

Coverage includes Light/Dark one-scroll masonry, clean native sheet dismissal,
working/recovery return, editing and saved-title persistence, nested Decide
navigation, real Maybe queue advancement, dirty swipe prevention and explicit
close choices. Create Events opens the actual setup view and returns to the
overview on cancellation. Both Accessibility XXXL appearances pass, including
readable Add Idea width and reachable editing controls. Exported captures were
inspected. EN/ES coverage passes for 1,693 strings.

The final Release simulator build passed with no compiler diagnostics in
`/tmp/gatherory-yours-single-scroll-release-final.log`. Scoped source/whitespace
checks and roadmap formatting passed.

Evaluation changed the presentation to a native large sheet because the zoom
gesture bypassed unsaved-change protection. It also fixed accessibility controls
compressing details and lazy section-height jumps. The temporary UIKit bridge
was discarded; the final app uses native SwiftUI presentation and controls.
The [native verification record](../../../../ios-apps/gatherory/docs/testing-verification.md#yours-single-scroll-preview--october-23-2026)
records exact bundles, failures and corrections. A frame-dimension diagnostic
still appears in the editor journey without a source location, despite passing
behavior tests and normalized cover frames. It is not claimed resolved.

The setup fixture seeds a private pin and answers date suggestions only. It does
not prove live copy/install success or canonical import against a deployed
server. No database reset or deployment occurred. Physical VoiceOver/Reduce
Motion acceptance remains open; native lint/audit tooling is unavailable.

### Previously verified public preview and creation work

The public preview return-navigation, masonry, setup and creation checks below
record earlier completed work. Current Yours verification is recorded above;
these historical results do not replace that follow-up's regression checks.

### Explore return navigation

Explore's preview uses the existing card transition identifier and namespace
with native `.navigationTransition(.zoom(sourceID:in:))` on its full-screen
presentation. iOS owns interactive dismissal; no custom pan recognizer or
gesture threshold is added. The top-left control is a native back chevron with
the existing localized Back label. Liked uses its collection control; Yours uses Back and explicit
unsaved-change confirmation.

The existing presentation dismissal callback still resumes covered-feed ad
inventory and restores retained search state only after dismissal. Public
event and idea details keep their inner navigation stack, so returning from a
detail should leave the Blueprint preview available. Apple describes the
interactive transition and full-screen presentation support in
[Enhance your UI animations and transitions](https://developer.apple.com/videos/play/wwdc2024/10145/).

Regression tests accompany feature changes as a repository instruction. New
native UI coverage exercises the actual Back button, edge gesture, nested
return, retained search query and personal unsaved-change choices. **27 focused
unit methods and four new UI methods passed across two runs**, including
Light/Dark Back and gesture checks. Both Back-arrow captures were inspected;
EN/ES coverage remains complete for 1,684 strings. See the
[native verification record](../../../../ios-apps/gatherory/docs/testing-verification.md#explore-preview-back-and-swipe-return--october-23-2026)
for exact bundles, the native popover test adjustment and remaining acceptance
limits. No server or ranking behavior changed.

The final Release simulator build passed
(`/tmp/gatherory-preview-back-release.log`), along with scoped source/whitespace
and roadmap formatting checks. Native lint/audit tooling remains unavailable.

### Earlier single-preview and masonry checks

The subsequent masonry correction passed two focused UI methods across staged
runs: independent card placement/detail navigation at ordinary text sizes and
read-only content at Accessibility XXXL, both in Light/Dark. Exported ordinary
captures were inspected. The [focused native record](../../../../ios-apps/gatherory/docs/testing-verification.md#public-preview-idea-masonry--october-23-2026)
records its geometry checks and bundles. Debug was compiled by these UI runs;
the earlier Release and broad-suite results below remain historical.

Three smaller Luna agents implemented the public view, setup and local UI
harness. Parent integration handled source/route checks, reusable Yours actions,
default inclusion and native verification. On Xcode 27.1 / iPhone 18 Pro / iOS
27.0, **99 distinct focused methods passed across staged runs: 94 unit and five
UI**. Existing canonical-import, retry, owner isolation and source-retention
checks passed. New coverage protects all-content defaults, unchanged saved plans,
single-scroll read-only browsing, and actual setup confirmation/cancel/resume.

The broad r2 pass covered 93 unit methods; r3 covered 28 helper/session/editing
methods (including one additional regression) and four UI methods. The focused
r5 setup method passed after the test scrolled its confirmation above the native
medium sheet's bottom action bar. Earlier UI failures are superseded by these
passes; see the [native verification record](../../../../ios-apps/gatherory/docs/testing-verification.md#single-public-preview-and-event-creation--october-23-2026)
for exact bundles, failures, corrected behavior and acceptance boundaries.

Light/Dark public previews and read-only details at Accessibility XXXL passed.
Standard public, Saved, accessibility content/detail and confirmed-setup captures
were inspected. EN/ES localization passes for **1,684 strings**. Scoped source
and whitespace checks passed. The **Release simulator build passed**
(`/tmp/gatherory-single-preview-release.log`). ReUI audit tooling and native lint configuration
are unavailable; no dependency was added.

The ordinary preview fixture retains its temporary working-copy shortcut for
the library handoff. The new date-confirmation flag opens the actual setup view
using a temporary draft store and production coordinator with a schedule-only
local transport. It begins with a seeded private pin, does not submit creation,
and returns errors for unexpected copy/install routes. Separate transport and
canonical-import tests cover those client boundaries. None of this proves a
deployed server installation or physical-device/VoiceOver acceptance. No
deployment or database reset occurred.
