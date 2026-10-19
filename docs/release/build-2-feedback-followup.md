# Build 2 feedback follow-up

Implemented locally on October 15, 2026; this is not a release/deployment record.

## Shared album

- The iOS invitation leads with up to three visible photos and a single compact
  footer for album/upload controls. Opening the album shows a three-column grid;
  tapping a tile opens that photo in the full-screen paged viewer. Hide/report
  actions remain available for photos beyond the first three. The visually
  smaller icon controls retain localized labels and 44-point touch targets.
- Current upload-capable planners can remove their own accidental uploads after
  confirmation. Guest invitation projections stay read-only; no new guest upload
  or organization/planning grant is introduced.
- Native deletion checks the stored photo, canonical account and exact event.
  The existing archive/outbox save produces an account-scoped moment tombstone.
- Server deletion verifies gallery placement and canonical uploader. Existing
  host/manager moderation authority is retained; a contributor's ownership is
  not inferred from a delete payload. Root-scoped child photos and child-only
  scopes remain distinct. Trusted first-create records support deletion before
  media registration without turning client-authored identity fields into grants.

## Event idea names

The event-idea editor previously hid the name field and regenerated titles from
the event category. It now allows an explicit name, using the existing edit
permission and `updateIdea` path. A dated approved idea retains its ID, approval,
configuration and linked Home event while that event's name changes in place.

## Blueprint preview visual iteration

The real SwiftUI preview was captured in a disposable simulator host using
fixture data, with no sign-in, persistence or network calls. Initial, scrolled,
light/dark and larger-text layouts were inspected. Captures exposed and guided
fixes for a section peeking behind the tab bar, low light-mode toolbar contrast,
status-bar contrast over the cover, and final text obscured by the floating tab bar. Activities now use the same
horizontal card pattern as event invitations. This is visual/layout evidence,
not end-to-end public-catalog or shared-link installation acceptance.

Later visual feedback superseded the extra dimming and status-band treatments:
the cover now uses bright, scrolling artwork above an adaptive title surface.
Native iOS 26+ scroll-edge effects blur content beneath controls; no custom black
cover gradient or white status-band fade is painted over the image. The opening
cover accounts for the full viewport and the information surface joins flush,
without revealing rounded backdrop corners at its edge. Album card, three-column
gallery, selected-photo ownership controls, and light/dark/large-text layouts
were inspected with local fixture data, without signing in or mutating account
data. This does not add source-event photos to template publications.

## Local verification

- Native build passed; 466 non-UI tests passed on the iPhone 18 Pro iOS 27.0
  simulator (548 executions including parameterized cases), with no failures.
  Regressions cover stored-photo ownership, exact-event access, account-scoped
  offline deletion tombstones, rename permission and linked-event persistence.
  The later photo-first gallery/native-blur revision reran the full native suite
  with the same passing totals; no UI test target was run.
- Web typecheck and contract checks passed; Vitest passed 415 tests, with 21
  opt-in tests skipped by the default environment.
- A separate disposable PostgreSQL 18.6 database run passed all six targeted
  tests across three files, including root/sub-event album ownership, deferred
  upload deletion, immutable creation ownership and denied cross-scope requests.
  Its container was removed; the development database was not used.
- English/Spanish localization coverage passed for 1,122 strings. The existing
  non-literal-key extraction warning in `AppCopy.swift` remains.
- UI test targets were excluded. Visual inspection used the isolated fixture
  host described above; physical-device and release acceptance remain manual.

## October 16 preview pagination follow-up

The cover now uses the full viewport with a lower-quarter title rather than a
separate title panel. Initial Glur is zero; the invitation scroll signal drives
the background blur, disabled for Reduce Motion/Transparency. Summary and scoped
planning guidance precede event/idea pages. Events group four per 2×2 page (two
single-column entries at accessibility sizes), and ideas group three rows per
horizontal column. Full detail content, authored order and target/audience
filtering are retained.

The immersive-scrolling revision moves horizontal gutters from the surrounding
container into scroll-content margins. Both carousels have screen-wide
viewports, and their cards can reach the screen edge. The opaque light/dark
content backing is removed; Glur artwork remains visible behind the content.
Individual cards reuse the idea-detail adaptive material with explicit semantic
text colors, including the Reduce Transparency fallback. Fresh verification
passed the app build, 469 non-UI tests (551 executions), and 1,122-key localization
coverage. Isolated fixture captures checked light-mode contrast and dark-mode
accessibility text; no real account data or installed templates were modified.

The main app build and all 469 non-UI tests passed (551 executions including
parameterized cases), including three new tests for grouping, partial pages and
accessibility ordering. Localization coverage remained 1,122 English/Spanish
strings. Fixture captures inspected clear/scrolled covers, long titles,
light/dark and accessibility text, priorities above content and compact pages.
Synthetic extra fixture content exercised multi-page layout without publishing
or installing a template. Native swipe acceptance remains a physical-device
check: the desktop simulator input bridge did not reliably forward gestures.
UI test targets were excluded. No setup, sync, permission or transaction code
changed in this follow-up.

No migrations, development database reset, TestFlight upload or deployment are
part of this change. Deploy the matching server authorization before shipping
the native contributor-delete affordance.

## October 16 content-first and shared detail presentation

The template header is now compact rather than taking the whole first screen:
summary, planning priorities and the first cards are visible on opening. Main
and sub-event previews share one event view. A read-only projection supplies
only the root with child cards; leaf previews retain their own ideas, guidance,
audiences and relative schedule proposal without exposing parent/sibling content.
Idea destinations reuse the workspace idea reading layout and summary surface.
Live response controls, metadata, media, refresh and playback cleanup remain in
the workspace caller; previews do not manufacture those dependencies or actions.

Verification: app build, 471 non-UI tests (553 executions), and 1,122-key
English/Spanish localization coverage passed. Two new projection regressions
cover root-only child lists and full child-scoped content. Disposable simulator
captures checked the opening screen, ceremony preview without a child carousel,
the shared idea summary, and a long title at accessibility text size. UI test
targets were excluded. Permissions, source events, installation/setup recovery,
offline mutations and transaction boundaries were unchanged.

## October 16 full-Glur and shared idea screen correction

All template preview backgrounds now open fully Glurred across their entire
area, rather than waiting for scrolling or leaving a clear upper band. This is
static even with Reduce Motion; Reduce Transparency retains the existing
unblurred-artwork/opaque-card fallback. Event previews retain their compact
opening and edge-to-edge carousels.

Workspace idea details and template idea previews now instantiate the same
`IdeaDetailScreen`, not separate compositions of only the summary/layout. The
screen owns the shared artwork contrast, summary surface and notes-card layout.
The workspace injects its existing votes, provenance, category tools, metadata,
refresh and playback lifecycle. Preview callers provide only authored display
content and no live controls. The shorter control-free summary stays at the
artwork-to-content anchor instead of being pushed to the bottom. Portable v1
templates do not gain invented category facts or source-event media.

Verification passed the app build, 474 non-UI tests (556 executions), and 1,123-key
English/Spanish localization coverage. Three new regressions cover complete
preview text, absent notes and future categories. Isolated simulator captures
checked initial full Glur and control-free idea cards in light and larger-text
dark appearance. UI test targets were not run. Offline sync, setup recovery,
permissions and transaction boundaries are unchanged.

## October 16 workspace idea-layout parity

This supersedes the preview-specific height/blur treatment described above.
Idea previews now use the workspace's full-height reading layout, artwork
scrolling behavior and `IdeaCategoryDetailContent` card renderer directly.
The idea screen no longer has `isPreview` or `fillsOpeningViewport` variants.
The surrounding main/sub-event preview keeps its static full-area Glur.

Live workspace content supplies its unchanged typed configuration and currency
to the renderer. An explicit live-idea binding gates picker callbacks, music
editing/playback, external actions and live event tools; display data alone
cannot enable those controls. Current portable template content remains
title/category/notes, so missing typed facts, currency, identity and source media
are not fabricated. No schema or template-capture expansion is implied.

The app build, 477 non-UI tests (583 executions including parameterized cases),
and 1,123-key English/Spanish localization coverage passed. New regressions cover
every native category's configuration/currency preservation, every template
category's read-only renderer, and configured card data without live controls.
A disposable simulator check inspected the restored workspace-height opening
and absence of live actions. UI test targets were skipped. Sync, persistence,
installation recovery and transaction behavior are unchanged.

## October 16 event preview card styling

Main and sub-event preview headers now reuse `IdeaSummaryContent` directly:
category label, left-aligned large title, description, shared material and card
spacing. Suggested timing and saved-preview context sit inside the summary;
guidance and the explanation footer use matching surfaces. The opening content
respects the navigation safe area rather than floating a shadowed title over
artwork. Full Glur, full-width carousel viewports, scoped content and setup entry
are unchanged. Shared summary titles are exposed as accessibility headings.

Verification passed the app build, all 477 non-UI tests (583 executions) and
1,123-key English/Spanish localization coverage. Disposable simulator checks
covered the light main preview and dark, accessibility-sized main/sub-event
summaries, including long-title wrapping and relative timing. UI test targets
were skipped. No permissions, sync, persistence or transaction code changed.
