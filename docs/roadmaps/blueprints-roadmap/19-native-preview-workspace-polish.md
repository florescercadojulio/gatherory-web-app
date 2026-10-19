# Native preview workspace interaction

Implemented locally October 16, 2026. Device acceptance remains open.

## Presentation

- Blueprints uses the shared masonry collage for drafts and used templates,
  with two columns normally and one at accessibility text sizes.
- Search, category and draft tiles open the ordinary full-screen workspace
  flow, without an outer tile zoom. Saved drafts open Home/Ideas/Decide first;
  Customize opens the existing setup editor. Pending receipt recovery still
  opens setup directly. Used templates open their independent local workspace.
- Preview Home shares the live event rail and workspace-library exit icon.
  Main/child IDs scope content without exposing siblings or inventing dates.
- Event cards and details share the same category/symbol/palette descriptor,
  including snake_case child categories. Detail starts clear, with blur driven
  by scrolling rather than an unconditional full-artwork blur. No source photos
  or higher-resolution media are implied by portable v1 content.

## Explicitly saved choices

Preview Decide shares live swipe thresholds, guide and feedback, but not its
workspace mutations: right/Love includes an idea, left/Pass excludes it, and
up/Maybe preserves the existing inclusion. Unanswered ideas retain their saved
default. Users can revisit Maybes, Passes or all ideas.

Choices stay in a memory-only `BlueprintPreviewSession` until **Save Draft**.
Exit and Customize prompt for save/discard/cancel if there are unsaved choices.
Saving updates the existing account/link-scoped setup or creates one; it does
not install, publish, update a source event or cast a live vote.

The optional local `previewDecisions` field retains review state across resume.
Only the resulting selected idea keys reach the existing installation contract;
the decision metadata never reaches the server vote or sync APIs. Old drafts
remain readable. Save preserves the pinned source, request UUID, customized
content, selected events and confirmed dates, and refuses pending recovery or
a replaced draft. A failed save leaves staged choices in memory for retry.

Customize retains its established editor autosave after the preview's explicit
save/discard boundary. Review/install still owns the durable intent, canonical
server transaction and atomic bootstrap import. No archive, outbox, receipt,
database schema or ordinary offline sync transaction changes are introduced.

## Verification

Regression coverage includes staged/discarded choices without writes, explicit
save/resume, preservation of confirmed dates/custom content/link identity,
account isolation, pending/replacement guards, shared swipe thresholds and queue
review, and rail/artwork mappings.

- App build and 546 non-UI tests passed (656 executions with parameterized
  cases) on an isolated iPhone 18 Pro / iOS 27 simulator, with zero runtime
  warnings reported by the test result bundle.
- English/Spanish localization coverage passed for 1,201 strings; both
  repositories passed `git diff --check`.
- Disposable fixture captures checked Home's shared rail/exit icon, a sharp
  child-event detail, light-mode Decide, and accessibility-sized Decide. The
  larger-text capture exposed truncated swipe-guide labels; these now use
  direction icons while retaining full action buttons and VoiceOver guidance.
- The non-UI rendering tests require an uninterrupted foreground test host.
  A run overlapped with manual capture failed rendering assertions; the
  subsequent uninterrupted full run passed. UI test targets were not run.

No live account, source event, database, physical-device install or deployment
was used for these checks. Physical-device gesture and transition acceptance
remains manual; captures alone do not prove those animations.

## Rail and content-only library follow-up

The preview rail now scrolls cards during scrubbing and follows the actual card
nearest the viewport center during normal scrolling. Observed positions and
requested scroll targets are separate, so geometry updates do not fight a drag.
Selection haptics follow event changes without repeating for intermediate frames
or again when the requested card arrives. A direct swipe interrupts a pending
rail scroll; Reduce Motion removes the programmatic animation. VoiceOver retains
the adjustable rail action.

Preview Decide removes its visible choice buttons, making swipes primary while
retaining named accessibility actions and the existing memory-only/Save Draft
boundary. This supersedes the larger-text action-button note above.

Blueprints removes the Explore shortcut and adds a native category dropdown,
defaulting to All Categories. It filters both content sections without hiding
pending installation recovery. Drafts match any declared browse category; used
history uses the associated local workspace's experience type, or Other Events
when that information is absent/unknown. It never fetches a private source or
changes the history API/cache contract just to infer categories. Empty-filter
states differ from an actually empty library.

Regression coverage adds rail selection/interrupt/deduplication logic, real card
geometry, a hosted-view unit test that scrolls the actual preview, and category
filter/mapping checks. No UI automation test target is used. Device haptic feel
still requires physical-device acceptance.

Follow-up verification: the app build and 555 unit tests passed (665 executions
with parameterized cases), including the real-scroll-view regression. Localization
coverage passed for 1,208 English/Spanish strings. Offline sync/import regressions
remain green; no installation, draft-save or sync transaction boundary changed.
