# Expanded Explore catalog

Explore now supports eighteen categories, each backed by deployable content:

- Weddings, Birthdays, Holidays, Other Events.
- Engagements, Showers & Welcomes, Bachelor & Bachelorette, Anniversaries.
- Graduations, Family Reunions, Dinner Parties, Picnics & Outdoors, Game Nights.
- Trips & Getaways, Cottage & Cabin Stays, Guest Stays, Team Retreats, Community Gatherings.

These are discovery categories, not new event types, permissions or sync scopes.
Names and symbols are localized in English/Spanish. Search includes category
labels, raw keys, relevant tags and summaries. Native Explore displays only
populated categories from its authorized catalog; an older server therefore
does not produce fourteen empty destinations. Unknown future categories still
fall back to Other Events. Existing category-to-preview navigation is retained.

## Content standard

The three original production revisions are unchanged. Fourteen additional
curated v1 starters provide four activities, six ideas and five guidance
sections each. The content is intentionally specific: accessible alternatives,
food preferences, realistic pacing, optional participation, weather options,
agreed cost expectations, and privacy-safe arrival/departure handoffs.
No real venue availability, bookings, property access codes or personal data
are asserted. Songs are suggestions, not copied playlists. Handoff notes do not
pretend to be automated checklists or reminders. All dates remain suggestions
until explicitly confirmed; installed copies retain the existing independent,
transactional creation/import behavior.

Content and discovery metadata live in `catalog/explore-collections.ts`;
`catalog/explore.v1.ts` validates portable drafts and creates immutable install
documents. `blueprintStarters` is the complete production deployment registry;
`coreBlueprintStarters` retains the original three cross-client proof fixtures.
Changing installed v1 content requires a new explicit revision, never replacing
an existing hash. Discovery labels/tags remain independent of installation data.

## Rollout

1. Deploy the server/contracts supporting the expanded category enum.
2. Run the existing **additive** `pnpm blueprints:seed` with the intended database
   configuration. It uses the existing transaction/immutable-hash checks and
   never resets user data. Do not run the development reset in production.
3. Ship the iOS build; refresh Explore against that server to see all categories.

These code changes do not themselves deploy or seed a live database, upload a
build, or submit it for review. Development resets include these seventeen
production templates plus eight development-only examples (twenty-five total).

The preview Ideas toolbar now contains Add only on the trailing side; Install
remains available from the Home actions menu. Installation, offline archives,
outboxes, and account-bound recovery are otherwise unchanged.

## Verification

`contracts/examples/explore-catalog.v1.json` is generated and checked alongside
the schemas. The iOS fixture is an exact copy. Regression tests cover category
parity/coverage, search, older-server fallback, immutable hashes, selected versus
excluded children, explicit schedule dates, and native decoding. No UI test
target or live database reset is required for these checks.

Verified October 16: 458 web tests passed (21 environment-gated skips), typecheck
and contract checks passed; the iOS build and 576 non-UI tests passed (686
executions). English/Spanish localization covers 1,237 strings. These results do
not claim a server deployment, live catalog seed or App Store/TestFlight submission.

Native build follow-up: preview Decide now compiles artwork, summary, card
presentation and interactions separately, with its title resolver colocated.
Shared artwork and preview viewport frames normalize invalid concrete dimensions
without changing valid sizes. PostHog's reported layout-publisher line forwards
UIKit layout and is not evidence that PostHog computes the bad dimension. The
original Explore warning was not reproduced; these guards address unsafe frame
inputs, not a claimed upstream SDK fix. A fresh unsigned iPhone-target Debug
build and 577 non-UI tests passed (687 executions), including dimension guards.

Decide presentation follow-up: live and preview cards now replace their static
Pass/Maybe/Love direction row with a shared target-event heading. Event selection
uses a calendar icon; response filters remain available, with Account on the
trailing side (restored in the preview). Gestures, transient swipe feedback,
accessible response actions, Undo and saved/offline decision semantics remain
unchanged. The build and 578 non-UI tests passed (688 executions), with localization
checks unchanged. An isolated preview capture checked the header and toolbar;
no UI automation target or live account mutation was used.
