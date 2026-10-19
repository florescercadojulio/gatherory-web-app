# Focused native preview editing

Implemented locally October 16, 2026; device acceptance remains manual.

## Content-first navigation

- Blueprints replaces its repeated title/category filter with a native title
  dropdown: **Installed Templates** (default) or **In Progress**. Only the chosen
  masonry collection is shown, without another section heading. Pending install
  recovery remains available in either collection; account/cache rules are unchanged.
- Preview Ideas moves its scope menu to the leading side and the library exit
  icon to the trailing side.
- Preview Decide removes its library exit and Customize controls. The leading
  menu shows the current idea's actual target event title, changing as the deck
  moves between events; empty/unknown targets fall back to the selected scope.
  The inbox remains the response/review filter and contains Save Draft when dirty.

## Edit content where it is presented

Home's actions menu, event card/detail edit actions, and idea tile/detail actions
open focused editors rather than routing customization through the full setup
form. Ideas can be added from its scope menu; Home can add ideas or sub-events.
New ideas default to the current event scope and can be reassigned explicitly.

The idea/sub-event adapters use the same shared workspace editor fields and
category/purpose controls already used by setup. Main date/time editing reuses
the actual workspace `EventDateTimeEditorView`. Its blueprint caller hides end
and all-day controls, because those values are not in the portable installation
contract; existing live callers retain their unchanged default behavior.
Main naming uses the shared workspace name field in a focused sheet.

The preview still reads a personal projection, not a fabricated live workspace.
Editor values stage in `BlueprintPreviewSession`. Editor **Save** explicitly
writes the account/link-scoped draft; **Cancel** leaves it unchanged. Save also
commits any staged Decide choices in that personal draft. A write failure keeps
the staged state and a retryable save action. Owner/generation checks reject
stale editor callbacks, and pending installation blocks edits and saves.

Overlay writes preserve the source pin, request UUID, link identity, confirmed
child dates and unrelated setup selections. New items are selected for review,
but a new sub-event is never silently assigned or confirmed a date. Main date
changes preserve already-confirmed child instants. No source publication, shared
vote, workspace entity or outbox mutation is written by these editors.

**Review & Install** is separate from editing. It retains the existing date-aware
setup/review, durable intent, server permission checks, idempotent installation
transaction and atomic native import. This slice does not change installation
contracts, source-event privacy or independence of installed copies.

## Verification

The app build and 561 non-UI tests passed (671 executions with parameterized
cases). New coverage includes staged/discarded content edits, explicit saves,
source immutability, preserved IDs/dates/selections, pending-install guards,
account isolation and Decide title context. Existing offline sync/import tests
remain green. English/Spanish localization covers 1,213 strings.

Disposable fixture captures checked the actual preview shell: Decide's event
title/inbox without exit or Customize, Ideas' leading filter/trailing library
icon in light mode, the reused date/time sheet without unsupported end/all-day
controls, and the focused idea editor. These captures do not prove physical
gestures, sheet saving on device, or the library's live-account contents.

UI automation test targets, deployment and live database writes are excluded.

## Collection and Ideas follow-up

Blueprints remembers each account's last collection when it has content and falls
back to a populated collection otherwise, including pending-install recovery.
Manual selection remains stable during an active visit. This preference is local
presentation state, not a draft, archive or outbox mutation.

Preview Ideas starts at All independently of Home/Decide context. Its leading
group is library return followed by filters; Add Idea and Review & Install are
trailing icons. The existing workspace response bar renders personal preview
choices with the same green/yellow/red/gray palette. Changes remain staged until
explicit save; no collaborator votes or shared statuses are manufactured.

Follow-up verification: the app build and 570 non-UI tests passed (680 executions),
including collection fallback/account isolation and personal response bars across
staging, discard and saved-draft resumption. Localization coverage passes for
1,214 English/Spanish strings. UI automation targets were not run.

The preview action is now **Install**, with an explicit confirmation on every
tap. Cancel keeps edits in memory; continuing saves dirty choices before the
date-only installation completion flow. The blueprint workspace is the editor
and review; neither setup form nor plan-review form reappears. Missing main and
selected-child confirmations are requested, then server validation and the
existing durable coordinator run automatically. Saved confirmed instants and
selections stay intact. Legacy drafts lack the optional local main confirmation
marker and conservatively ask once. No automatic date confirmation,
discard, source write or installation occurs on the initial tap. Empty library
collections retain their explanation and offer a direct switch to the other
collection using the existing account-local manual preference.

Date-only completion verification: app build and 574 non-UI tests passed (684
executions), including missing-date readiness, legacy draft decoding, explicit
main-date save/discard/resume, changed-date invalidation, and the existing
installation recovery/import and offline sync regressions. Localization checks
pass for 1,217 strings. No UI automation targets or live database writes were run.

Library empty-state polish uses native `ContentUnavailableView` with distinct
installed/draft symbols and headings, short guidance and a compact capsule
switch action. Empty content centers in the viewport unless recovery/errors
need space. Native typography and semantic styling preserve appearance and
Dynamic Type; no Explore shortcut or fake content was added. The build and
575 non-UI tests passed (685 executions), and localization checks cover 1,223
strings. Disposable simulator captures of the actual empty-state component
checked installed/light and draft/dark at accessibility text size; these are
isolated presentation checks, not a live-account library or UI automation run.
