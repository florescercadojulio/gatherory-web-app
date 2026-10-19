# 07 — Native blueprint discovery

Implemented October 15, 2026, following the Wedding installation proof.

October 16 follow-up: [19 — Preview workspace interaction](19-native-preview-workspace-polish.md)
supersedes the earlier outer-zoom and browse-only Decide behavior below. Preview
opening now matches Workspaces; Decide inclusion choices are staged in memory
and require Save Draft. The Blueprints tab uses masonry for drafts/history.

## Navigation and search

- The library has **Workspaces** and **Explore** tabs. Workspaces remains the
  default and owns existing plans and invitations. Opening an event still uses
  its existing full-screen Home/Ideas/Decide/Manage experience; the library tab
  bar is not nested inside those event tabs.
- Explore uses the search icon, native searchable navigation and search focus.
  Unfocused search shows a two-column category grid (one column at accessibility
  text sizes). Focused empty/whitespace search shows recently viewed blueprints.
  Focused nonempty search filters as the user types, matching all words against
  names, categories, tags and descriptions without case or accent sensitivity.
- Categories are Weddings, Birthdays, Holidays and Other Events. Category taps
  open a filtered list. Only Wedding currently has an installable starter;
  other categories honestly show an empty state, not pretend templates.
- Opening a result records access and presents the existing setup → server
  preview → confirmed installation path. Workspaces’ **Use Template** shortcut
  now switches to Explore. Interrupted installations remain reachable through
  **Resume installation**, even if the catalog request fails.

## Catalog contract

The authenticated catalog response now adds `discovery` per entry: nonempty
`categories`, `tags`, and `summary`. The schema is
`contracts/schemas/blueprint-catalog.v1.schema.json`. Assignment is currently
deployment-managed in `src/server/blueprints/services/blueprint-discovery.ts`:
Wedding has explicit discovery copy; future starter types receive their matching
category or Other Events. Private authoring of discovery metadata is deferred.

This metadata is outside the immutable installation definition. No revision,
content hash, installation receipt, event data or transaction boundary changes.
The listing returns the newest available revision per catalog key and excludes
repository-only fields. Repository publication/retirement filtering and endpoint
authentication remain authoritative. The installer still re-fetches and pins
the selected revision for review; browsing does not create anything.

Native clients accept older responses without discovery metadata and derive a
fallback category from the experience type. New/unknown categories fall back to
Other Events instead of making the catalog undecodable. The shared Wedding
catalog fixture is byte-identical across the web and native test bundles.

## Local state and offline behavior

Recent history stores at most 12 deduplicated catalog keys, most recent first,
in account-scoped local preferences. Reopening a blueprint moves it to the top;
Clear removes only the active account's history. Recent rows resolve against
the currently available catalog, never resurrecting retired entries. Searches
themselves are not recorded.

Explore state/navigation is recreated on account changes. Catalog requests use
the existing account-generation-checked coordinator; canceled or superseded
loads cannot publish into the current model. Loading/empty/error states have
retry, and a failed refresh keeps the last loaded in-memory catalog with a
warning. Catalog content is not persisted for offline browsing in this slice.
Workspaces remain locally available regardless of catalog connectivity.

No workspace archive, outbox, sync protocol, provisioning or transaction code
was changed for discovery. The earlier migration/seed prerequisites in `06`
still apply; this slice adds no migration or automatic seed.

## Verification and remaining work

Non-UI tests cover search states/matching, account-isolated bounded recents,
latest-revision selection, unavailable entries, canceled/stale loads, refresh
failure/retry, and shared catalog decoding. The existing installation/import,
offline/outbox and transaction regression tests remain in place.

The full web suite passed: 208 tests, 14 environment/opt-in tests skipped;
typecheck and generated-contract checks passed. The full non-UI native suite
passed: 359 tests, 427 executions including parameterized cases, no failures or
skips, on iPhone 17 / iOS 27 simulator. English/Spanish coverage passed for 1,002
strings. UI tests and physical-device/iOS 26 runtime checks were not run.

Remaining: Birthday/Thanksgiving starter content, richer catalog artwork,
localized catalog-authored copy, scalable server search/pagination when the
catalog grows, and private authoring. Search currently filters the small
authorized catalog in memory; it makes no request per keystroke. Billing and
permissions are unchanged.

## October 15 category and result-row styling follow-up

Discovery now reuses the invitation artwork language in category tiles and
template-row thumbnails. Category names sit on adaptive system surfaces rather
than over busy artwork; text and symbols still identify each category without
depending on color. The grid remains two columns at ordinary text sizes and one
at accessibility sizes, with a bounded width on larger screens. Template names
wrap, summaries remain short previews, and accessibility-sized rows stack their
artwork above the text. The existing Search/account header and native disclosure
navigation are retained. No category counts, promotional labels or extra browse
heading were added.

This is presentation-only: category membership/filtering, recents, catalog
requests, preview/setup navigation, permissions, local drafts and sync
transactions are unchanged. It does not add template-uploaded cover images.
Earlier availability and direct-setup notes above describe the original slice;
the current roadmap records subsequent starters, public discovery and the
read-only preview entry point.

The actual tile/row components were inspected in an isolated fixture host on an
iPhone 18 Pro iOS 27 simulator: light/dark appearance and accessibility text
size AX3. This was layout evidence, not live catalog/account acceptance. The
main app build passed, as did all 466 non-UI tests (548 executions including
parameterized cases) and English/Spanish coverage for 1,122 strings. Existing
test-isolation and localization-extraction warnings remain. UI test targets
were excluded; device/release acceptance remains manual.

## October 16 row-to-preview navigation motion

Explore now owns a stable namespace for catalog-row → blueprint-preview zoom
navigation. Query results, recent entries and category lists use the same
source/destination wiring, keyed by the entry's catalog key and revision.
Reduce Motion uses standard navigation instead. Shared-template links remain
independent because they have no catalog-row source. Access recording still
occurs when the preview appears; catalog loading, permissions, setup and offline
sync are unchanged. UI test targets remain excluded from this follow-up.
Verification passed the app build, all 477 non-UI tests (583 executions), and
English/Spanish localization coverage for 1,123 keys. Gesture/animation feel
remains a manual device check; this run did not execute UI tests.

## October 16 masonry and transition-source retention

Result rows are replaced by artwork-led masonry tiles in query results, recent
history and category results. They reuse the workspace Ideas `MasonryLayout`,
with two columns, one at accessibility text sizes, RTL placement and native
tile-button navigation. Titles and short summaries overlay category artwork;
the main preview uses the same category symbol/palette. No custom source-event
photos, fabricated planner/status data or publishing changes are introduced.

Matching images are not required for a native zoom: a live matched source is.
The earlier focus-driven mode could replace Search results with categories
when navigation dismissed search focus. A transient navigation snapshot now
retains the source mode and entries/order through presentation and return.
Recents may still record access on preview appearance, without moving the
retained source. Returning restores the query/focus before releasing the
snapshot; catalog retirement/refresh results apply normally afterward.
Source identities include the results/recent/category surface plus catalog
key/revision, preventing identical entries on different screens from colliding.
Reduce Motion keeps standard navigation. Shared-link entry, authorization,
installation, account isolation and ordinary offline sync are unchanged.

Verification: the current app/test binaries passed all 510 non-UI tests (617
executions) on an isolated iPhone 18 Pro iOS 27 simulator, including four new
navigation/source-retention regressions. English/Spanish localization coverage
passed for 1,151 keys. An isolated read-only visual fixture confirmed masonry
layout and grid-to-preview/back endpoints with Search query/order retained;
animation feel still needs a manual device check. UI test targets were excluded.

### Category tile follow-up

`BlueprintCategoryResultsView` owns its own namespace, selected preview and
navigation destination on the visible category screen. Category tiles no longer
drive the Search screen's preview binding from one navigation level below.
The same native tile-to-preview zoom and Reduce Motion fallback apply; returning
keeps the category grid rather than activating Search. Catalog access recording,
refresh, permissions, installation and offline sync remain unchanged.
Verification passed the app build and all 511 non-UI tests (618 executions),
including a category/Search navigation-isolation regression, on an isolated
iPhone 18 Pro iOS 27 simulator. UI tests were skipped; transition feel remains
a manual device check.

## October 16 shared workspace preview — first slice

Search results, recents, categories and shared links now converge on a
read-only Home / Ideas / Decide session. Catalog tiles retain their native zoom
and source snapshots; their full-screen destination owns the preview tabs so
the Workspaces/Explore tab bar is not nested beneath them. Shared links retain
their existing token-pinned authorization and offline recovery rules.

Reuse is at the presentation boundary: `WorkspaceTabShell`,
`WorkspaceEventHero`, `IdeaCollectionPresentation`, `DecisionCardPresentation`,
`EventReadingHero`, `IdeaDetailScreen` and supported category cards are shared
with live workspace screens. Preview adapters consume only the authorized
catalog document, not a fabricated mutable workspace. Home shows authored
events, Ideas provides masonry and event scoping, and Decide browses scoped
ideas with a transient cursor. It records no votes, inclusion choices or team
responses. Manage, note sending, invitation tools and other live controls are
absent. Sub-event details cannot expose sibling ideas/guidance.

**Customize** opens current setup with its confirmed dates, selections,
account-scoped drafts and receipt recovery unchanged. Success dismisses setup
and catalog preview before presenting the installed workspace. Merely browsing
never creates drafts, installation intents or outbox work. Ordinary offline
sync, permissions, server transactions and independent copies are unchanged.

Next, separately scoped: a root **Blueprints** library for used templates and
work in progress; richer pre-install customization (adding/editing authored
ideas and events) through shared editor presentations. Neither is implemented
here. Draft editing must remain separate from live workspace sync and from
publishing updates to a shared template. This does not introduce a universal
creation engine or make sharing automatic.

Verification: app build and 517 non-UI tests passed (624 executions including
parameterized cases), including event identity/scoping and cursor bounds,
reordering, removal and source-immutability regressions. English/Spanish
localization covers 1,158 keys. UI test targets were excluded. Physical-device
layout, transition feel and successful-install presentation remain manual
acceptance checks.

The next implemented slice adds supported idea/sub-event editing inside
Customize with shared workspace editor presentations and account-local overlays.
See [17 — Native install customization](17-native-install-customization.md) for
the contract, validation, transaction boundaries and current verification.
