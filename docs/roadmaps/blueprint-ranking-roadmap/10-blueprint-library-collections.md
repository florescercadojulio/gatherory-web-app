# Blueprint library collections

**Status:** This October 22, 2026 implementation record documents the earlier collection design. Its nested Drafts/Installed navigation under Yours is superseded by [14 — Unified Yours library](14-unified-yours-library.md), which records the current accepted direction. The verification below applies to this earlier implementation state.

## Product decision

The native Blueprint library keeps the fixed title **Blueprints** and presents three visible primary filters: **Yours**, **Saved**, and **Liked**. These are library collections, not new discovery or ranking controls. Do not replace the existing library title with the selected collection name.

- **Yours** contains the signed-in account's authored Blueprints (including unpublished drafts and published/listed or unlisted authored plans) and plans copied into the account's editable library. These are owned editable plans. Installation receipts and setup drafts remain available under the existing Yours content where applicable; a copied plan is not the same thing as a source bookmark.
- **Saved** contains public Blueprint references the account bookmarked. A source can also appear in Liked; membership is independent. Opening a saved row uses the existing read-only public preview. Removing the bookmark removes Saved membership only and does not unlike or delete an owned copy.
- **Liked** contains public Blueprints the account liked. A source can also appear in Saved. Opening a liked row uses the existing read-only public preview. Removing the Like removes Liked membership only and does not remove a bookmark or alter any copy.

The existing **Not interested** / hidden preference remains managed separately in Account. Hiding does not implicitly remove a bookmark or Like, and the Account management flow continues to own unhide. Hiding remains a discovery preference, not a library collection.

## Data and privacy boundaries

The iOS client uses the authenticated `/api/blueprints/preferences` endpoint. The server derives the actor from the session, scopes the preference query by that actor, and returns paginated rows (the native client requests 100 per page and follows cursors). Each Like, bookmark, and Not interested preference retains its own source revision/hash binding and availability, so removing one action does not accidentally target another action's revision. The primary-filter choice is stored in UserDefaults under an account-keyed key and included in account-deletion cleanup. The existing `BlueprintActionStore` is session-bound and clears its state when account identity changes. A caller-supplied account identifier cannot select another person's records. Saved and Liked are private account state; they do not expose counts, lists, or names to other accounts, and do not create public social activity.

Saved and Liked refer to a specific public catalog key, revision, and content hash. A bookmark can remain in the account's list after its source publication becomes unavailable; that entry should be presented as unavailable and be removable without requiring the original publication to load. Opening a Saved/Liked card fetches the current public catalog and resolves only a currently public, current-schema source by catalog key; the resulting entry uses current revision/content and clears discovery context. The route checks current account and request/session identity before presenting the existing preview. The collections do not grant access to private drafts, unlisted-link content, or another account's editable copy.

Yours contains the account's own editable records. Saving edits, deleting a copy, publishing, and listing remain explicit existing actions with their current authorization and confirmation behavior. Copying a public plan produces an independent editable plan; editing or deleting it does not mutate its public source. The collection filters do not change publication privacy or promote a private record to public.

The server preference endpoint and in-memory `BlueprintActionStore` are the source of truth for Saved/Liked membership. Preferences are not persisted as an offline list cache, so the public collections need a successful read after a fresh launch. Mutations update local membership only after the server acknowledges the exact request and action binding; failures keep the row and surface retry. Pull-to-refresh rereads the Yours data or all preference pages for Saved/Liked. The store protects acknowledged mutations from an overlapping refresh and drops results from an invalidated account session. The root passes only the current account's store, and the collection checks ownership again before rendering rows, so an account switch cannot briefly display the previous account's membership while asynchronous store setup runs.

## Navigation and behavior

The native library uses a visible segmented picker for Yours/Saved/Liked, while its navigation title remains fixed at **Blueprints**. Yours retains the existing inner scope menu for setup drafts and used installations. Saved and Liked use the same public Blueprint card presentation and a separate remove affordance. The Account screen continues to own the Not interested list and unhide action. Keep the filters accessible and reachable without a title menu. Each filter has an intentional empty state and a path back to the appropriate existing creation or discovery flow. The selected filter may be remembered per account, but changing accounts must not carry a private selection state or content across identities.

Saved and Liked use Blueprint cover cards. Selecting an available card opens the existing read-only Blueprint preview; it does not start setup, create a live event, or edit the source. Available cards expose removal through the card context menu and existing preview controls. An unavailable source has an explicit 44-point remove button on its card. Remove bookmark and unlike are separate actions. A source with both preferences remains in the other collection after either action. Account's Not interested management remains separate and keeps its existing remove/unhide behavior.

## Acceptance checks

- The navigation title remains **Blueprints** and Yours/Saved/Liked are visible as primary filters.
- Yours includes the current account's authored editable records, drafts, and copied editable plans according to the existing local/server record model.
- A copied plan can be edited without changing the public source; it remains Yours even if its source later becomes unavailable.
- A bookmarked public source appears in Saved and opens its existing preview; removing its bookmark leaves its Like (if any) and owned copies intact.
- A liked public source appears in Liked and opens its existing preview; unliking leaves its bookmark (if any) and owned copies intact.
- A source with both Like and bookmark appears in both collections. Toggling one does not clear the other.
- An unavailable saved source remains removable, and opening it does not bypass current publication eligibility checks.
- Not interested remains in Account management, does not appear as a fourth primary filter, and is independent of Like and bookmark state.
- Switching accounts, signing out, and account deletion clear or invalidate private collection state; a stale request cannot repopulate the next account's view.
- Load failures, refresh, empty results, and failed mutations have understandable states and retry paths. Failed removal/unlike does not silently remove membership.
- Collection browsing does not alter Explore ranking, cursor semantics, measurement, ads, publication rules, or server visibility.

## Scope and remaining verification

Yours combines existing account-owned authored/copy records, local setup drafts, and installation history in its inner scopes. Authored/copy records come from the authenticated personal Blueprint API and an account-scoped atomic local store; setup drafts and installation history retain their existing account-scoped stores. Saved/Liked filter the authenticated preference list by their independent booleans, so one source can appear in both. Not interested remains available only through Account management.

This is a native library/navigation slice using existing authored-plan, copy, public-preview, and private-preference capabilities. It does not add public social counters, cross-account visibility, new ranking signals, a new hidden-items surface, or a new publication rule. Own-account Likes may continue to inform the existing personal content-affinity policy under [slice 08/09](08-personal-like-ranking.md); this navigation change adds no weight or signal.

## Verification

- Targeted native Xcode tests: 89 passed, 0 skipped, including the final account-switch rendering guards. Result bundle: `/tmp/gatherory-library-collections-native-rerun.xcresult`. A preceding rerun failed to launch after Simulator SpringBoard crashed; booting the test simulator again allowed the same built test runner to pass.
- Web test suite: 771 passed, 54 skipped; 118 test files passed and 36 skipped.
- Web typecheck and generated contract checks passed.
- Eight database integration tests across six Blueprint integration files passed against a disposable PostgreSQL 18 database.
- All four ranking artifact checks passed with unchanged artifacts; targeted Prettier checks passed.
- English and Spanish localization checks verified 1,671 strings.
- Simulator Release build passed with exit code 0; log: `/tmp/gatherory-library-collections-release-verified.log`.
- ReUI source review of C1–C4 ran twice against the changed files and found no UI violations. Native accessibility source review covered the system segmented picker/buttons/empty states, combined card text, labeled 44-point unavailable-source remove control, one-column accessibility text sizing, untruncated titles, and layout direction. Live VoiceOver and device checks were not run.
- Xcode Canvas did not provide visual verification: Gatherory crashed, and the latest recorded crash at 18:24:35 was `EXC_BAD_ACCESS` / `SIGSEGV` in SwiftUI Preview/JIT frames. No visual acceptance, phone release, or deployment is claimed. The audit checklist tool was unavailable, so the manual native-adapted checklist is the recorded review; no native lint configuration or run is claimed.

These checks cover local source and disposable test data only. No deployment or phone release is implied by local changes.
