# Discovery and library actions

**Status:** Search/profile alignment is implemented locally and native checks
passed. Context-specific preview actions and public read-only behavior are
implemented locally; focused native tests and simulator visual checks passed.
October 23, 2026.

The subsequent [single-preview and creation slice](15-single-preview-and-event-creation.md)
replaces the public Home/Ideas tabs with one reading scroll. The context and
preference boundaries below remain; the verification counts here describe the
earlier tabbed implementation.

## Search header

Explore uses `.toolbarTitleDisplayMode(.inlineLarge)` with the existing native
profile toolbar item, so the Search title and account action share a toolbar
row. The system `.searchable` field, focus, clear/dismiss and keyboard remain
native. This replaces the separate expanded-title row, without bringing back
the rejected custom search field or a custom scrolling header.

Apple documents this mode in
[ToolbarTitleDisplayMode.inlineLarge](https://developer.apple.com/documentation/swiftui/toolbartitledisplaymode/inlinelarge).
The API exists in the installed SDK and supports the project's iOS 26 minimum.
Seven focused native tests passed, including title/avatar vertical alignment,
query typing, result scrolling, native Close/Cancel and return to Browse in
Light and Dark. Inspected screenshots also show the title collapsing to the
compact native presentation on scroll. The Release simulator build passed.
Results are recorded in the [native verification log](../../../../ios-apps/gatherory/docs/testing-verification.md#native-searchprofile-alignment--october-23-2026).

## Preview contexts and actions

Preview presentation now distinguishes discovery, Saved/Liked collection
references, personal Yours plans and shared links. This makes the available
actions follow the source and authorization context.

| Context          | Presentation and actions                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public discovery | Event and idea content is read-only. Like and Save are visible preference toggles; More contains Use and Not interested. No Decide, editor, Add controls, response filters or private draft overlay. |
| Saved / Liked    | Read-only preview with a prominent Use action and the corresponding preference toggle. Removing the preference remains explicit.                                                                     |
| Shared link      | Read-only preview with direct Use. Public Like/Save preferences are not shown.                                                                                                                       |
| Yours            | Personal editing, Add and Decide remain available. Save Changes retains owner, version and import checks.                                                                                            |

Like and Save only update the current account's public preference. They do not
create a personal copy or event. Not interested suppresses recommendations
through the existing private preference path. Public and shared previews do not
expose editing or response state, and opening them does not create a private
draft overlay.

For explicit Use from a public or shared preview, the client calls
`BlueprintPreviewWorkingCopy.prepare` in the real local store. It creates or
resumes the pinned working plan, preserving existing edits, dates and revision,
then opens the existing setup view. A local copy appears in Yours. The existing
backend pin/copy/install pipeline remains responsible for its gated behavior.
Personal Yours editing and explicit saves keep their owner/version/import
checks.

## Verification scope and boundaries

Three smaller Luna agents handled presentation policy and working-copy tests,
read-only workspace views, and the isolated native UI harness. Parent integration
added route handling, account guards and immediate Yours refresh after Use.

On Xcode 27.1 / iPhone 18 Pro / iOS 27.0 simulator, **62 distinct focused tests
passed**: 58 unit methods and four UI methods, with zero failures or skipped
tests in the final runs. The broad rerun passed 61 tests
(`/tmp/gatherory-preview-actions-r2.xcresult`); the additional accessibility
method passed in `/tmp/gatherory-preview-actions-accessibility.xcresult`.
Coverage includes context/owner isolation, unchanged recovery of existing edits
and pinned revisions, pending-import guards, preference acknowledgement, public
read-only controls, and the local Explore → Save → Saved → Use → Yours journey.
That journey caught a stale library after switching back to Yours; the fixed
selection path reloads the collection and the rerun passed.

Six standard-size captures and two Dark Accessibility XXXL captures were
exported to `/tmp/gatherory-preview-actions-r2-shots` and
`/tmp/gatherory-preview-actions-accessibility-shots`. Inspected Light/Dark
discovery, Saved, personal working-copy Ideas, public Ideas and idea-detail
captures confirm the intended controls. The existing event picker truncates
its label at Accessibility XXXL; this pass verifies read-only behavior there,
not a complete large-text layout audit. Physical VoiceOver remains untested.

The final **Release simulator build passed**
(`/tmp/gatherory-preview-actions-release.log`). English/Spanish localization
passes for **1,678 strings**. Scoped C1–C4 source
and whitespace checks passed; the web-specific ReUI audit tool and native lint
configuration are unavailable. See the [native verification log](../../../../ios-apps/gatherory/docs/testing-verification.md#context-specific-blueprint-previews--october-23-2026)
for build results and exact boundaries.

The temporary DEBUG fixture exercises the working-copy helper in a temporary
store: its Use action saves through the real helper and closes the preview so
the copy can be inspected in Yours. It bypasses the actual setup/server/canonical
import path, so it does not verify a production install flow. Live server
copy/install acceptance remains separate.

This slice adds no backend, database, ranking or measurement behavior. It does
not change discovery attribution or convert Like/Save into ownership or
installation signals. The [library collections](10-blueprint-library-collections.md)
and [actions/measurement](03-actions-and-measurement.md) records describe the
existing library and preference contracts.
