# Unified Yours library

**Status:** Implemented locally; native unit and simulator UI checks passed, October 23, 2026. No database reset, migration, deployment, or device release is part of this change.

## Product decision

The Blueprint library keeps its title and shows **Yours**, **Saved**, and **Liked** as aligned primary filters. Yours is the single home for personal working Blueprints and setup recovery. There is no Drafts collection or secondary Drafts/Installed scope menu, and the collection stack is not vertically centered to fill unused space.

Yours combines personal records from the existing sources:

- Authored personal Blueprints, including the current account's editable records.
- Saved local customizations and recovery copies.
- Installation-receipt sources that connect prior Blueprint use to its editable personal working copy.

When a recovery row exactly matches the complete saved source payload of an installation receipt, only the receipt row is displayed. Similar-looking records with a changed source, revision, share link, or setup progress remain distinct. Owned records are not silently substituted for differently edited recovery snapshots. This keeps source identity and unfinished work visible rather than collapsing by title or origin alone.

The initial ownership lookup still gates receipt cards when the personal cache is empty, preventing receipt-to-personal-card flicker. Saved recovery rows can display during that lookup. A failed cache reread retains previously visible rows. Deduplication canonicalizes each receipt and recovery payload once per projection, including complete nested definitions and normalized selection sets.

Existing internal draft storage and collection preferences remain compatible so older local state can still be recovered. This change adds no database reset, schema migration, or new autosave behavior. Editing remains explicit-save, and existing version and account checks still apply.

## Setup recovery and creation

**Continue setup** appears only when setup has confirmed date progress. Pending canonical imports retain their existing banner and recovery path. Other incomplete or unsaved work does not imply confirmed setup progress.

The Yours empty state is titled **Your blueprints**. Its primary **Create Blueprint** action opens a native chooser listing events the account can manage. Choosing an event continues through the existing private capture and review flow, with `publishesToSearch=false` and `createsShareLink=false`. The existing source-event permission checks still apply. **Explore** remains a secondary route to Explore; saving or bookmarking a public source does not make that source an owned personal Blueprint.

## Preserved boundaries

Saved and Liked remain independent public references with their existing account and visibility checks. Creating a personal Blueprint copies a plan into the account's own editable library; subsequent edits remain subject to explicit save and existing version/account validation. This navigation change does not loosen source permissions, publish content, create a share link, or change Explore ranking.

The preview-control follow-up in [13 — Discovery and library actions](13-discovery-and-library-actions.md) is now implemented locally and verified separately: Like/Save stay visible, discovery Use moves to More, and editing stays in Yours. Those changes are subsequent to this library slice.

## Current verification

Three smaller Luna agents implemented the library, localized copy, and visual fixture/tests; parent integration added the native creation chooser, fixture isolation and final verification.

- **42 unit tests passed** for library state/cache, primary and legacy preference compatibility, full-payload projection, preview save/resume and setup recovery in `/tmp/gatherory-yours-library-r2.xcresult`. This run also had UI failures caused by a container identifier overriding button identifiers and test navigation before initial account routing settled. Those UI results are superseded by the next run.
- **3 UI tests passed** with zero failures/skips in `/tmp/gatherory-yours-library-r3.xcresult`: top-aligned Yours/Saved/Liked, no Drafts scope, empty Create/Explore actions and chooser dismissal in Light/Dark; all three source types in one grid; opening/closing the recovery preview; and the pending-installation banner with Continue setup. Seven screenshots were exported to `/tmp/gatherory-yours-library-r3-shots`; empty states, the event chooser, mixed library, saved-preview presentation and pending recovery were inspected.
- **35 additional unit tests passed** with zero failures/skips in `/tmp/gatherory-yours-recovery-regression.xcresult`, covering draft persistence, preview editing, event-source capture permissions and personal Blueprint behavior. One parameterized method has three runs; this is 35 methods, not 37 distinct methods.
- English/Spanish localization coverage passed for **1,677 strings**; the existing dynamic-key extraction warning in `AppCopy.swift` is unchanged.
- Scoped C1–C4 and whitespace checks passed with no source matches. Native manual layout/accessibility review retains real buttons, labels, the system picker, large empty-state controls and the existing accessibility one-column grid. The web-specific audit tool and native lint configuration are unavailable.

The final **Release simulator build passed** (`/tmp/gatherory-yours-library-release.log`). Detailed build evidence is recorded in the [native verification log](../../../../ios-apps/gatherory/docs/testing-verification.md#unified-yours-library--october-23-2026).

The DEBUG fixture requires an explicit launch flag plus seeded, ephemeral, skipped-authentication mode. It supplies in-memory library/recovery state, bypasses account library files and feature API loads, and disables mutations; ordinary launches and Release cannot enter it. The chooser is inspected against seeded local events. Tests do not create a server Blueprint, publish/share content, complete an installation, or exercise real account switching through the UI. Persistence, permission and recovery boundaries have separate unit coverage. Physical-device scrolling, VoiceOver and live authenticated capture remain acceptance work; the fixture is not production authorization evidence.
