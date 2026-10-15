# 07 — Native blueprint discovery

Implemented October 15, 2026, following the Wedding installation proof.

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
