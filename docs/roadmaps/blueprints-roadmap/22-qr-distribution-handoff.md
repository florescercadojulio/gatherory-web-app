# 22 — QR distribution: AI implementation handoff

October 20 subsequent scope: the user authorized
[optional blueprint To-dos](../to-dos-reminders-roadmap/02-blueprint-to-dos.md).
They start excluded during capture; explicit inclusion creates fresh independent
tasks in workspace copies. This supersedes the original To-do deferral only;
QR/link pinning, explicit actions and release gates below remain in force.

**Status:** First native slice implemented locally, October 19, 2026.
Physical-device and deployment acceptance remain open. The original handoff
and required reading below are retained for future work.

## Goal and first slice

Let an owner present and share a QR code for an existing template sharing URL.
A cottage visitor scans the printed code with the system Camera, opens the
existing template preview, and explicitly saves/customizes an independent copy.
The code distributes a template, not the owner's live workspace or an invitation.

Start with native QR presentation and system image sharing from the existing
template-sharing controls. Reuse the existing HTTPS resolver, preview and copy
flow. Do not add a scanner, web-editor requirement, new link service, billing,
checklists, reminders, booking integrations or a broad creation engine.
Web QR authoring and print-layout tooling can be separate follow-ups.

## Read these documents in order

Paths here are relative to this directory unless stated otherwise. The web/server
repo is `gatherory-web-app`; the iOS repo is its sibling `../ios-apps/gatherory`.

1. [AI onboarding](../../development/ai-onboarding.md): repository map, current
   product decisions, local Intent skill loading, authorization and offline rules.
   Read applicable `AGENTS.md` files and inspect Git state in both repos first.
2. [Blueprint architecture](../../architecture/experience-blueprints.md) and
   [roadmap index](README.md): publications, copies, scope and deferred work.
3. [Host-authored experiences](10-host-authored-experiences.md): cottage/rental
   use cases, privacy boundaries and future checklist/reminder constraints.
4. [Unlisted links](14-unlisted-template-links.md): bearer tokens, owner controls,
   revocation, pinned publications, universal links and migration boundaries.
5. [Native Create & Share](15-native-create-and-share.md) and
   [automatic ownership/discovery](16-public-discovery-and-automatic-ownership.md):
   explicit publication, native sharing, listing versus link access and retries.
6. [Resumable setup](12-resumable-setup.md),
   [native customization](17-native-install-customization.md), and
   [Blueprints library](18-native-blueprints-library.md): recipient-owned saved
   snapshots, installation recovery and independent workspaces.
7. [API conventions](../../development/api-contract-conventions.md) and
   [server implementation](../../development/server-implementation-guide.md)
   if server/contracts need changes. Prefer no new API for QR rendering.
8. iOS `docs/offline-sync.md`, `docs/workspace-boundaries.md`,
   `docs/testing-verification.md` and `docs/app-store-release.md`: transaction,
   account and release boundaries. Dated test counts are not fresh acceptance.

## Verify current source before designing

Some earlier docs describe superseded screens or draft behavior. Current code
and regression tests win; record discrepancies rather than restoring old flows.
In particular, saved drafts are now independent copies, not continued access to
the original link. No native UI should direct people to a web editor.

### iOS starting points (paths relative to iOS repo)

- `Gatherory/Features/Blueprints/BlueprintLinkManagementView.swift`: owner link
  controls and existing `ShareLink` presentation. Inspect its store and transient
  generated URL lifecycle before adding QR presentation.
- `Gatherory/Features/Blueprints/BlueprintCreateShareView.swift` and
  `BlueprintCreateShareStore.swift`: creation/publication followed by sharing.
- `Gatherory/Features/Blueprints/BlueprintSharedPreviewView.swift` and
  `BlueprintSharedPreviewModel.swift`: incoming-link preview.
- `Gatherory/Features/Blueprints/BlueprintSavedCopyResolver.swift`,
  `BlueprintSetupDraft.swift`, `BlueprintPersonalLibrary.swift`, and
  `Gatherory/OfflineSync/BlueprintInstallationIntent.swift`: copy/retry isolation.
- `Gatherory/ContentView.swift` and app URL routing: existing incoming URL path.
- `Gatherory/Localizable.xcstrings` and `Gatherory/Localization/BlueprintCopy.swift`:
  localized fixed copy and accessibility labels.
- Search `GatheroryTests` for link management, shared previews, routing, saved
  copies and installation recovery; extend existing fixtures instead of live calls.

### Web/server starting points (paths relative to web repo)

- `src/contracts/blueprint-link-management.contracts.ts` and corresponding
  handlers/workflows/repos under `src/server/blueprints/`.
- `src/routes/api/blueprints/shared/$token.ts`, the route for
  `/templates/shared/<token>`, and
  `src/routes/[.]well-known/apple-app-site-association.ts`.
- `src/server/blueprints/planning/blueprint-share-token.server.ts` and existing
  sharing tests. Locate paths using `rg --files` rather than assuming filenames.
- `src/routes/api/blueprints/copies.ts` and personal/library workflows for the
  recipient-owned snapshot boundary. Do not bypass these when installing.

## Implementation guardrails

- Encode the exact validated HTTPS URL returned by the existing authorized link
  flow. The QR is another representation of that bearer credential, not a new
  authorization mechanism. Never encode event membership or private event data.
- Evaluate native Core Image QR generation first; avoid a remote QR service that
  would receive the token. Render crisp square modules, sufficient contrast and
  a quiet margin. Do not blur the code or obscure it with artwork/logos.
- Keep a normal share/copy-link alternative and meaningful accessibility text.
  Support light/dark appearance and Dynamic Type without shrinking scan quality.
- Keep displayed URL/code transient and account-scoped. Clear in-memory state on
  dismissal, sign-out, account switch or permission loss. The later user-authorized
  reusable-link follow-up below retains new owner credentials in device-only
  Keychain storage and revalidates authorization before reopening. Do not log
  URLs or add credentials/QR images to analytics, archives, outboxes or media.
- A deliberately shared/exported image contains the credential and can be
  forwarded. Explain that revocation disables future acquisition, not copies
  already saved. Do not automatically save to Photos or request camera access.
- The server stores token hashes, not recoverable raw URLs. An old link row
  alone cannot regenerate its QR. Reopen a credential saved on this device only
  after authorized server reads confirm the exact link is active; otherwise
  offer explicit replacement. Never silently create on opening or retry an
  uncertain create.
- Preserve actual link revision semantics. Existing unlisted links pin a
  publication; do not silently turn printed codes into mutable aliases. If owners
  need one printed code to follow later publications, propose that as a separate
  versioned-link design with explicit approval before implementing it.
- Search withdrawal and individual link revocation are distinct. Owner deletion
  must retain the existing takedown behavior; recipients' saved blueprints and
  created workspaces stay independent.
- Opening/scanning only previews. Saving, date confirmation and installation
  remain explicit. Never create a workspace on scan or rewrite frozen intents.
- Link mutations remain online-only. Preserve existing offline edits, sync
  transactions, retries and account-generation guards. Ignore PostHog work.

## Verification and stopping point

Use native non-UI tests for QR payload round-trip through a decoder, invalid URL
handling, render dimensions/contrast policy, unavailable historical raw URLs,
and clearing/rejecting stale results after account changes. Retain link creation,
revocation, permission, saved-copy and installation recovery regression coverage.
If backend changes are genuinely needed, use Vitest/Effect tests, contract checks
and typecheck; never reset or seed the development DB for this task casually.

Run iOS localization validation. Skip UI tests unless explicitly authorized.
Manual acceptance should scan the exported code from another device or printed
page, check app-installed and browser fallback paths, sign-in continuation,
revocation before saving, and saved-copy survival after revocation/deletion.
Verify iOS 26 compatibility as well as the current iOS version. Universal-link
association and live backend behavior require deployed/device evidence; unit
tests alone do not prove them.

Finish with changed files, exact checks/results, and remaining device/deployment
acceptance. Do not deploy, migrate production, upload to TestFlight or claim
release readiness without separate authorization. Update this handoff and the
roadmap status after the implementation, keeping future work explicitly deferred.


## Implemented first slice — October 19, 2026

Native Create & Share and Share Blueprint controls now
present a QR for their currently generated URL and export a PNG through system
sharing. The ordinary link-sharing action remains available. Historical rows
still cannot recover a raw URL: creating a replacement is explicit, and uncertain
creates still require a successful explicit refresh before retry.

`BlueprintShareQRCode` validates HTTPS using the existing shared-template URL
parser and configured origin, encodes the exact URL bytes locally with Core
Image, and renders opaque black/white modules at an integer scale with a
four-module quiet margin. It performs no network or filesystem I/O. The QR
presentation derives from the current store URL; it is not a workspace asset,
archive field, outbox mutation or persisted recipient snapshot. English/Spanish
copy explains preview-only scanning, independent saves/copies, forwarding and
revocation. No scanner or camera/Photos permission is introduced.

Both owner stores clear transient sharing state on definitive authentication,
permission or missing-resource denials. Network failures retain their existing
retry semantics; confirmed revocation, invalidation and account-generation
checks continue to clear/reject URLs. Rendering and sharing do not create a link
or install a workspace. Incoming routing, recipient snapshots, immutable pins,
installation intents and transaction boundaries are unchanged.

No server, contract, schema or association-document changes were needed. The
existing `/templates/shared/<token>` preview, `/api/blueprints/shared/<token>`
resolver and recipient-owned `/api/blueprints/copies` flow remain authoritative.
The older `14` discussion of source-dependent downloaded drafts is superseded
by the independent saved snapshots in `12`; no legacy frozen intent is rewritten.

### Verification

All checks below ran on October 19, 2026. Native environment: Xcode 27.0,
iPhone 18 Pro simulator / iOS 27.0, compiling against the iOS 26 minimum.

- Native app build and complete `GatheroryTests`: **640 tests passed**, **758
  executions** including parameterized cases, zero failures/skips (93 suites).
  The new cases decode the rendered image and exported PNG to the exact URL;
  reject invalid origins/schemes/paths/credentials; verify opaque binary pixels,
  integer module blocks, size and quiet margin; and cover historical URLs,
  denials, network failures and invalidated account callbacks. Existing preview,
  saved-copy, installation recovery, permissions and sync regressions passed.
- `pnpm test`: **465 passed, 23 environment-gated tests skipped** across 79
  passing files; generated contract freshness passed as part of this command.
- `pnpm typecheck`: passed. No web production build was run.
- `bash scripts/verify-localizations.sh`: **1,253 English/Spanish strings** passed.
  The existing generic `AppCopy` non-literal extraction warning remains.
- `bash scripts/verify-deployment-targets.sh`: all **12 effective-setting checks**
  passed at iOS 26.0. This checks configuration, not an iOS 26 runtime.
- `git diff --check`: passed in both repositories.

Exact native command, run from the iOS root:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-qr-native-20261019-verified.xcresult \
  POSTHOG_ENABLED=NO
```

The first compile caught a displaced `@ViewBuilder` annotation; it was restored.
The next run passed 639 tests but Vision could not initialize its inference
context in the simulator. The round-trip test now uses Apple's Core Image QR
detector with a software context, requiring both exact decodes without skipping
or weakening assertions. The final full run above passed.
UI automation and live database/provider integrations were not run.

### Remaining acceptance and rollout

- On two physical devices, scan both the displayed image and an exported/printed
  PNG using system Camera. Check scan quality, system image sharing, light/dark
  appearance, VoiceOver, large Dynamic Type and iPad sizing/dismissal.
- Exercise iOS 26 as well as the current iOS version. The available local runtime
  is iOS 27; compiling with an iOS 26 minimum does not prove runtime behavior.
- Verify app-installed HTTPS handoff, browser fallback, explicit Open in Gatherory
  and signed-out/sign-in continuation against the intended deployed origin and
  Apple association cache. Opening must only preview.
- With disposable accounts, revoke before saving; confirm a fresh scan is denied.
  Separately verify saved blueprints and completed workspaces survive revocation
  and author deletion, and frozen installation recovery keeps its existing rules.
- Check dismissal, sign-out/account switching and permission loss while the QR
  or system sharing sheet is open. Exported images already delivered to another
  app cannot be erased; link revocation controls their future acquisition access.
- Confirm the existing sharing/copy endpoints and earlier migrations are deployed
  before shipping the native client. This QR slice adds no migration or API.
  No deployment, database reset/seed, build upload, commit or push was performed.

Web QR authoring, print layouts, mutable printed aliases, automatic expiry,
custom scanning, billing, checklists and reminders remain outside this slice.


### Changed-file inventory

Paths below are relative to their owning repository. The previously uncommitted
handoff, onboarding addition and roadmap link were preserved and updated; all
work remains uncommitted.

| Repository | Files |
| --- | --- |
| iOS rendering/presentation | `Gatherory/Features/Blueprints/BlueprintShareQRCode.swift`, `BlueprintShareQRCodeView.swift`, `BlueprintCreateShareView.swift`, `BlueprintLinkManagementView.swift` (same directory) |
| iOS owner lifecycle | `Gatherory/Features/Blueprints/BlueprintCreateShareStore.swift`, `BlueprintLinkManagement.swift` (same directory) |
| iOS localization | `Gatherory/Localization/BlueprintCopy.swift`, `Gatherory/Localizable.xcstrings` |
| iOS tests | `GatheroryTests/BlueprintShareQRCodeTests.swift`, `BlueprintCreateShareStoreTests.swift`, `BlueprintLinkManagementStoreTests.swift` (same directory) |
| iOS evidence | `docs/testing-verification.md` |
| Web handoff/status | `docs/roadmaps/blueprints-roadmap/22-qr-distribution-handoff.md`, `docs/roadmaps/blueprints-roadmap/README.md`, `docs/development/ai-onboarding.md` |


## Simpler sharing follow-up — October 19, 2026

The current sharing surface shows the QR immediately after an explicit,
successful link creation. It has one explanation — anyone with the link can
preview and save their own copy — and two actions: **Share Link** and
**Share QR Code**. The extra Show QR disclosure, duplicate URL action and
repeated post-publication privacy/review paragraphs were removed.

Workspaces **Share Blueprint** now opens the existing template/link selector in
share mode. A sole owned template is selected through the existing read flow;
multiple templates still require an explicit choice. The owner must tap
**Create Share Link**. An empty list offers native template creation and its
existing content/publication review. **Save Blueprint** remains the separate
private capture action. Opening sharing never creates a link or publishes.

**Manage Sharing** in the toolbar menu exposes versions, Search visibility and
historical links/revocation. The duplicate workspace-card management action was
removed. Creating a link from management returns to the ready sharing surface;
returning to management keeps the same transient credential. The Create & Share
success screen likewise keeps publication status and its existing link controls
behind Manage Sharing. Content and visibility are still reviewed before
publication; revocation confirmation explains that saved copies survive.

An uncertain link create still forces the existing successful explicit refresh
before replacement; recovery messages/actions remain visible. Once publication
succeeds, a missing/revoked link shows compact link recovery rather than the
pre-publication content review again. No store,
transport, authorization, persistence or retry implementation changed in this
follow-up. Automatic rendering remains synchronous and account/permission
scoped, and dismissal clears the existing owner store.

Additional changed file: iOS
`Gatherory/Features/Workspaces/WorkspaceBrowserView.swift`. Localization adds
Share Link / Manage Sharing and updates the concise explanation in English and
Spanish. This follow-up uses the same rendering and non-UI regressions as the
first slice. No UI automation is run.

Manual checks should now start with **Workspaces → Share Blueprint → Create
Share Link**, then scan or share the visible QR. Also check More → Manage
Sharing, return to sharing, uncertain-create refresh and first-time template
creation. The physical-device, iOS 26 and deployed-link checks above remain open.

Final verification for this follow-up: **640 native non-UI tests passed** in 93
suites (**758 executions** including parameters), zero failures/skips, on
Xcode 27.0 / iPhone 18 Pro / iOS 27.0 simulator with the iOS 26 minimum.
Rendering/PNG decoding, explicit link creation, historical URL handling,
revocation, account isolation, saved copies, installation and offline-sync
regressions passed. **1,255 English/Spanish strings** passed localization
validation; the existing generic AppCopy non-literal extraction warning remains.
Whitespace checks passed in both repositories. UI tests, live backend/device
checks, database changes, uploads, deployment, commits and pushes were excluded.
No server/contracts changed, so the web checks from the first slice were not
repeated for this native presentation follow-up.

Exact commands from the iOS root:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-simple-sharing-20261019-verified.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```

## Reusable owner links — October 19, 2026

At the user's explicit request, newly acknowledged owner link credentials now
persist in device-only Keychain storage. Reopening Share Blueprint performs the
existing authenticated template/owner and link-list reads before restoring the
same token and QR. It does not create a link, change the pinned publication,
republish a template or grant event/workspace access. The credential is scoped
to canonical account, server origin, source event and template, stored with
When Unlocked / This Device Only protection and no Keychain synchronization.
The server continues to store only token hashes; no API/schema change is needed.

Create Blueprint was removed from sharing whenever templates exist; it remains
only in the empty-template state. A ready saved link opens directly to the QR
and the two native sharing actions. More → Create Replacement Link requires an
explicit confirmation explaining that previous links stay active until revoked.
Revoke remains separately confirmed. Missing/revoked rows, retirement, removed
ownership and definitive permission denials clear the affected saved credential;
network failure never authorizes offline restoration or automatic replacement.

In-memory URL/image state still clears on dismissal/account changes. Signing
back into the same account can reopen its saved credential after fresh online
checks. Acknowledged account deletion removes only that account's Keychain
namespace; a failed remote deletion preserves it. Saving a new credential can be
retried locally without another HTTP create if Keychain access fails. The current
URL remains shareable and the save failure is shown. Uncertain HTTP creates keep
the existing explicit-refresh gate and exact native creation retry behavior.

Credentials created before this retention change, on another device, or lost
when the creation response never arrived cannot be recovered from server hashes.
They require explicit replacement if the owner has not kept the exported URL/QR.
No old link is silently revoked or migrated. A saved link continues to identify
its original immutable revision even after later template publication; create a
replacement explicitly to share the newer publication.

New native files: `BlueprintShareLinkCredentialStore.swift` and its test suite.
Both owner stores and their tests now cover credential persistence; both owner
views inject the production Keychain store. `AuthenticationSession` adds an
injected post-deletion cleanup callback, with failure/sign-out regression tests.
UI copy/localizations and this handoff/onboarding/roadmap are updated. The
existing rendering, recipient-copy and installation paths are unchanged.

Additional manual acceptance: close/relaunch and reopen the same link/QR; switch
A → B → A; confirm no cross-account or development/production reuse; revoke on a
second device and reopen; check locked-device Keychain failures and local retry;
confirm replacement is explicit and leaves other links active. Test on iOS 26
and the current OS. Keychain wrapper tests use injected fake Security calls;
physical Keychain behavior and deployed authorization still require device checks.

Verification for reusable owner links: **665 native non-UI tests passed** in
94 suites (**783 executions** including parameters), zero failures or skips.
Xcode 27.0 / iPhone 18 Pro / iOS 27.0 Simulator compiled against the existing
iOS 26 minimum. The final run includes secure-store error/isolation tests,
reopen-without-creation and exact-pin tests, stale/denied/offline reads, explicit
replacement after an unreadable saved credential, local-only save retry,
revocation, account deletion/sign-out, and the existing copy/install/sync suites.
The app build passed. Localization validation passed **1,262 English/Spanish
strings**; the existing generic AppCopy extraction warning remains. Whitespace
checks passed in both repositories. UI tests were skipped. No new backend/API
code, schema, deployment, database mutation, upload, commit or push was involved.

A failed local restore never displays its credential. After successful server
authorization, the owner may retry reading it or explicitly create a replacement;
a malformed record does not permanently block that explicit recovery action.
Account deletion attempts namespace cleanup after remote acknowledgment, matching
the existing best-effort Keychain cleanup policy. If the OS refuses that local
cleanup, the deleted account's links still fail server authorization; physical
Keychain cleanup failure behavior remains part of device acceptance.

Exact commands from the iOS root:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-reusable-sharing-20261019-complete.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```


## Product wording and QR payload — October 19, 2026

Fixed native and web product copy now uses Blueprint / Blueprints. Native
Spanish uses plano / planos consistently with the existing Blueprints library.
This is a display-copy change; existing localization keys, API commands, DTOs,
source pins, stored credentials and deep-link paths remain compatible.
Historical narrative in older roadmap documents may still use template.

The QR payload is exactly the validated HTTPS sharing URL, encoded as UTF-8
by `BlueprintShareQRCode` through Apple's local Core Image QR generator.
For example, the path remains `/templates/shared/<token>` on the configured
app origin. The code contains the bearer URL, not blueprint JSON, people,
workspace state or event invitation/membership. The existing resolver maps its
token to the pinned published revision. Rendering uses no remote QR service;
creating/revalidating a share link still uses the existing authorized server
flow. Reopening restores the device-saved credential after current permission
checks and renders the same URL again.

Wording verification: **665 native non-UI tests** (94 suites, 783 executions)
and **465 web tests** passed; **23 web environment-gated tests** were skipped.
TypeScript and generated-contract checks passed. Native localization validation
passed for **1,262 English/Spanish strings**. The web currently has an English UI
catalog and Spanish server errors only; no incomplete Spanish UI catalog was
introduced. A display-value audit found no remaining template/plantilla terms
in effective native English/Spanish catalog copy; technical keys are unchanged.
Both repositories passed whitespace checks. UI tests were intentionally skipped.

Source files for this wording slice: native `BlueprintCopy.swift`,
`Localizable.xcstrings`, `BlueprintLibraryView.swift`,
`BlueprintLibraryEmptyState.swift`, `BlueprintContentEditors.swift`,
`BlueprintLinkManagement.swift` (localized fallback only), and web
`src/i18n/locales/en.ts`. Existing user-authored/curated content, protocols,
sharing credentials and QR generator behavior are unchanged. Device/deployment
checks from the earlier slices remain open; no deployment/commit/push occurred.

Commands: web `pnpm test`, `pnpm typecheck`, and Prettier checking of the English
catalog; native `bash scripts/verify-localizations.sh` and:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-blueprint-wording-20261019.xcresult \
  POSTHOG_ENABLED=NO
```

## Direct first-time workspace sharing — October 19, 2026

Workspaces long-press → Share Blueprint now skips the empty Create Blueprint
landing and initial selection screen when no owned blueprint exists. It loads
the authorized source and prepares the existing read-only review automatically.
The owner sees the actual selected content and Search/privacy disclosures before
choosing **Publish to Search**; **Edit Blueprint** opens the optional selection
screen. Opening this flow never creates a blueprint, publishes or creates a link.
Existing blueprints keep their explicit link creation/replacement flow and saved
credentials still reopen directly to the authorized QR. Multiple blueprints
still require choosing which one to share. A sole blueprint no longer has a
redundant Choose Blueprint section heading.

A failed initial read/review exposes the existing error and explicit retry;
source changes, account/permission checks and frozen creation/link recovery
remain authoritative. Editing does not automatically send another review.
Close dismisses the sharing sheet in the direct route; creation from management
still returns to management. Private Save Blueprint remains unchanged.

Changed native files: `BlueprintLinkManagementView.swift`,
`BlueprintCreateShareView.swift`, and `BlueprintCreateShareStoreTests.swift`.
The new regression verifies read-only preparation makes no template/link writes,
and explicit creation binds to the reviewed selection and hashes. The complete
native non-UI suite passed **666 tests / 784 executions**, with zero failures or
skips, on iPhone 18 Pro / iOS 27 Simulator. Localization validation passed for
**1,262 English/Spanish strings**; no new copy keys were introduced. Existing
AppCopy dynamic-key extraction warning remains. Whitespace checks passed in both
repositories. A final native build also checks the management Close correction.
No server/contracts changed, so web tests were not repeated for this native
navigation change. UI tests were intentionally skipped.

Manual device acceptance: first-time sharing should open review without extra
taps, allow optional editing, and publish only after Publish to Search. Check
Close and swipe dismissal, failed reads/review and retry, source-change reload,
account/permission loss, existing saved QR reopening, multiple-blueprint choice,
and management navigation. The earlier physical scan, iOS 26, accessibility,
system sharing and deployed universal-link checks remain outstanding. No deploy,
database reset, upload, commit or push was performed.

Commands from the native repository:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-direct-sharing-20261019.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```


## Unlisted sharing and optional Search — October 19, 2026

This supersedes the earlier requirement to publish to Search before sharing.
First-time sharing is now **Share Blueprint → Review → Create Share Link**.
The existing authorized native create produces an immutable unlisted publication
(`discoverable: false`), then creates its link and local QR. No Search listing
is created. Actual selected content and the unlisted/forwardable-link disclosure
remain visible before the explicit action; editing stays optional.

**Manage Sharing → List in Search** is a separate confirmed action. Removing
Search visibility is separately confirmed too. Both use the existing listing
endpoint and exact created template/revision; neither replaces the link, changes
its QR or revokes access. Existing blueprints' visibility is unchanged. Private
Save Blueprint explicitly disables link creation as well as Search publication.

Link creation and Search publication now have separate native flags. The frozen
creation request still binds its reviewed visibility and hash; listing updates
only occur after creation and respect account, permission, mutation and uncertain
link recovery gates. Failure/mismatched acknowledgements preserve the existing
share URL; stale account callbacks are discarded. Listing state survives explicit
link replacement. No server/API/schema or transaction/sync change was needed.

Changed native files for this follow-up: `BlueprintCreateShareStore.swift`,
`BlueprintCreateShareView.swift`, `WorkspaceBrowserView.swift`, `HomeView.swift`,
`BlueprintCopy.swift`, `Localizable.xcstrings` and
`BlueprintCreateShareStoreTests.swift`. Regression coverage includes unlisted
sharing, private saves, separate list/unlist without duplicate blueprint/link
creation, failed acknowledgements, account switching and link replacement.

Manual acceptance still needs two accounts/devices: verify a new blueprint is
absent from another user's Search but opens through its QR; confirm List in Search
and withdrawal leave the same link usable; verify saved copies stay independent.
Check first-time/reopen, management dismissal, offline/denied requests, physical
scanning, iOS 26/current OS, accessibility and deployed universal links as recorded
above. No deployment, database reset, build upload, commit or push was performed.

Verification: native app build and **670 non-UI tests / 788 executions** passed
with zero failures/skips on iPhone 18 Pro / iOS 27 Simulator. **1,263** native
English/Spanish strings passed localization validation (the existing dynamic
AppCopy extraction warning remains). Web `pnpm test` passed **465 tests**, with
**23 environment-gated tests skipped**, including generated-contract checks.
Whitespace checks passed in both repositories. UI tests and live database/device
checks were excluded. Physical-device and deployment checks above remain open.

Native test command:
```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-unlisted-sharing-20261019.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```


## Plain-language sharing review — October 19, 2026

The supplied screenshot showed a truncated Review title between three toolbar
actions, raw `planning_scouting` / `part_of_event` values, repeated categories
and arithmetic-style negative day offsets. This presentation review follows the
local apple-design guidance on progressive disclosure (HIG Layout, Visual
hierarchy) and writing for a broad audience (HIG Writing, Getting started).
The screenshot supports hierarchy/copy findings; physical sizing and contrast
were not measured from it.

The review now shows the plan name, a short mode-specific explanation and one
personal-text reminder. **View Included Content** expands the full selected
description, events, ideas/notes and tips/instructions. **Edit Content** is
inline; the primary **Create Share Link** / **Save Blueprint** button is
full-width at the bottom and wraps at larger text sizes. Close stays in the
toolbar and the review title has room. The redundant details heading and repeated
Before You Share paragraphs are removed. Raw purpose metadata is hidden in both
selection and review; category/audience values retain localized mappings.
Repeated main-event labels are omitted.

The new presentation helper renders “The day before · 6:30 PM” or “148 days
before · 11:00 AM” using the user's short-time conventions. It validates clock
input and preserves local time/day-offset semantics; no blueprint data or
schedule proposal is changed. Unlisted creation, Search opt-in, explicit link
creation/replacement/revocation, account/permission checks, source hashes and
uncertain-create recovery remain unchanged.

Additional native files: `BlueprintReviewPresentation.swift` and
`BlueprintReviewPresentationTests.swift`; existing
`BlueprintCreateShareView.swift`, `BlueprintCopy.swift` and
`Localizable.xcstrings` are updated. Non-UI tests cover relative wording,
12/24-hour output, midnight preservation and invalid inputs. No UI automation is
used. Manual acceptance must check the initial compact review and expanded long
content, multiline bottom action, largest Dynamic Type, VoiceOver disclosure and
focus order, light/dark appearance, Spanish, iPad and error/retry states on iOS 26
and the current OS. Earlier physical QR/deployed-link checks remain open.
No deployment, database reset, build upload, commit or push was performed.


Verification: the native app build and **674 non-UI tests / 792 executions**
passed with zero failures/skips on iPhone 18 Pro / iOS 27 Simulator.
Localization validation passed for **1,275 English/Spanish strings**, with the
existing AppCopy dynamic-key extraction warning. Both repositories passed
whitespace checks. UI tests were skipped; no new runtime screenshot was captured,
so the device visual/accessibility checks above remain outstanding. No server
code/contracts changed and web checks were not repeated for this presentation
change.

Commands from the native root:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-plain-review-20261019.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```


## Compact private saving — October 19, 2026

Save Blueprint from both Home and the Workspaces card now opens the compact
prepared review directly. It skips the initial selection screen; **Edit Content**
still allows naming and selecting content before reviewing again. A single
bottom **Save Blueprint** action creates the private copy. Opening/reviewing does
not write, create a link or list in Search. The saved state shows the plan name
and one saved confirmation, without repeated pre-save instructions. Link-sharing
warnings are omitted from the private-save overview. Included content remains
expandable before and after saving.

Files changed for this follow-up: native `HomeView.swift`,
`WorkspaceBrowserView.swift`, `BlueprintCreateShareView.swift` and the existing
private-save regression in `BlueprintCreateShareStoreTests.swift`. No transport,
server, localization keys, transaction, permission or account-isolation rules
changed. Existing source-change, uncertain-save and explicit retry gates remain.

Manual acceptance: open private save from both entry points; inspect/edit included
content; save once; check confirmation and dismissal, offline/source-change retry,
large text/VoiceOver and account switching. Confirm no link or Search listing is
created. Earlier physical-device/deployment checks remain open. UI tests remain
excluded. No deployment, reset, upload, commit or push was performed.


Verification: **674 native non-UI tests / 792 executions** passed with zero
failures/skips on iPhone 18 Pro / iOS 27 Simulator. The private-save test now
asserts that opening/reviewing makes no writes, followed by exactly one private
blueprint and no links/listing after the explicit save. Localization checks
passed for **1,275 English/Spanish strings** (existing AppCopy extraction warning).
The final build checks the private-only removal of the sharing warning. UI tests
were skipped; device visual checks remain outstanding. No server changes required
new web checks.

Native test evidence: `/tmp/gatherory-private-save-review-20261019.xcresult`,
using the earlier full non-UI test command with that result-bundle path.
Final build log: `/tmp/gatherory-private-save-final-build.log`.


## Sharing actions menu and existing-edit verification — October 19, 2026

The user's latest direction supersedes the earlier separate content-review UI:
workspace and blueprint editing are already the content verification step.
Sharing/saving now use a short name/summary and an explicit creation action.
The mandatory authorized source and review-hash reads still run behind the
scenes. Opening never publishes, saves or creates a link automatically, and
stale-source/account/permission gates remain authoritative.

Manage Sharing and Share Blueprint now both keep the current QR and native
Share Link / Share QR Code controls on the main screen. The toolbar menu contains
**Create Replacement Link**, active-link **Revoke** choices and optional
**List in Search / Remove from Search**, with the existing confirmations.
Historical date/version information is used only to distinguish links in the
revoke submenu; no Search dashboard, link-history table or mode switch replaces
the QR. Missing local credentials are explained briefly and replacement remains
in the menu. A true no-link state offers explicit Create Share Link. Uncertain
creation retains explicit Refresh Links recovery and never retries writes
automatically. Private post-create library-save failures still offer Retry.

The creation store now has a separate guarded replacement action. Ordinary
create cannot replace an existing URL. An explicit replacement keeps the old
URL/Keychain credential until the new response is valid, creates no second
blueprint, preserves Search visibility and does not revoke old links. A lost
replacement response keeps the old URL and requires a successful explicit refresh
before another replacement. Account changes discard late callbacks.
An authoritative refresh still clears a revoked or missing current link; keeping
an old QR while a replacement is uncertain never bypasses that check.

Changed native files: `BlueprintLinkManagementView.swift`,
`BlueprintCreateShareView.swift`, `BlueprintCreateShareStore.swift`,
`BlueprintCreateShareStoreTests.swift`, `BlueprintLinkManagement.swift`,
`BlueprintLinkManagementStoreTests.swift`, `BlueprintCopy.swift` and
`Localizable.xcstrings`. Server/API/schema, offline sync, recipient copies and
installation transactions are unchanged. Earlier narrative describing repeated
UI review, inline admin tables or a second management screen is historical.

Manual acceptance: open both sharing modes, verify QR/link remain immediately
available, and exercise menu confirmations for current/older links and Search
visibility. Verify private save has no link/Search side effect, fresh creation
has no repeated verification page, and uncertain replacement retains the old
URL until refresh. Check account/permission loss, missing Keychain credentials,
Dynamic Type/VoiceOver, iPad, and physical scan/deployed universal-link behavior
on iOS 26/current OS. UI tests remain excluded. No deployment, database reset,
build upload, commit or push was performed.


Verification: native build and **678 non-UI tests / 796 executions** passed
with zero failures/skips on iPhone 18 Pro / iOS 27 Simulator. Replacement tests
cover both stores retaining the old URL/credential during the request, switching
only after acknowledgement, refresh gates, missing/revoked-link invalidation,
listing preservation and stale-account callbacks. **1,276 English/Spanish
strings** passed localization validation; the existing AppCopy dynamic-key
warning remains. Both repositories passed whitespace checks. UI tests were
skipped; physical visual/accessibility/deployed-link checks remain open. No
server/contracts changed, so web checks were not repeated for this native slice.

A final build validates the single-active-link menu shortcut: Revoke is directly
available in More when only one link is active; multiple links use a submenu.
Test result: `/tmp/gatherory-menu-sharing-20261019-complete.xcresult`.
Final build log: `/tmp/gatherory-menu-sharing-final-build.log`.

Native verification used:

```sh
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-menu-sharing-20261019-complete.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```


## Simpler blueprint browsing and use — October 19, 2026

The regular-user pass now covers preview, the library, content editors and
workspace setup in addition to sharing/saving. **Use Blueprint** opens setup
directly; the redundant confirmation in front of that date/setup screen is
removed. Its existing account, pending-install and explicit draft-save checks
still run. Opening/scanning/browsing does not create a workspace. The final
**Create Workspace** action and required main/child date confirmations remain
explicit. The regular editor's optional plan summary remains useful for checking
the resulting dates; it no longer shows raw event/configuration fields. Its main
date now has the same confirmation gate as the direct creation route.

The library collections are **Blueprints** and **Drafts**. Cards keep names and
useful workspace context while dropping internal revision/draft-version badges.
Duplicate local-read and network warning cards are consolidated. Existing
creation shortcuts, account-scoped collection preferences, deletion confirmations
and unfinished-workspace recovery remain. Editors use Add/Edit Idea or Event,
“For” instead of Target, and show length errors after input rather than red
missing-title warnings immediately on opening; Save still rejects blank names.

Preview dates now use short localized “Suggested · The day before · 6:30 PM”
wording instead of arithmetic offsets or repeated no-date paragraphs. Confirmed
dates retain their readable time-zone abbreviation. The plan summary's optional
Details explains omitted content in plain language without raw source keys or
capability codes, and repeated reasons are merged. Retry copy says Try Again or
Continue Creating Workspace rather than installation/request terminology.
Independent copies, exact frozen retry inputs, permissions, source pins, local
save/remote transaction boundaries and installation recovery are unchanged.
The public browser preview receives matching short copy only; no web authoring
UI or routes are changed.

Changed native files in this pass: `BlueprintPreviewView.swift`,
`BlueprintWorkspaceHomeView.swift`, `BlueprintWorkspaceEventDetail.swift`,
`BlueprintSetupView.swift`, `BlueprintLibraryView.swift`,
`BlueprintLibraryEmptyState.swift`, `BlueprintContentEditors.swift`,
`BlueprintWorkspaceDecideView.swift` (accessibility labels only),
`BlueprintCopy.swift` and `Localizable.xcstrings`. Web fixed copy is in
`src/i18n/locales/en.ts`. Earlier QR/link/token changes remain uncommitted and
are preserved; this pass adds no API/schema or persistence change.

Verification: **678 native non-UI tests / 796 executions** passed with zero
failures/skips on iPhone 18 Pro / iOS 27 Simulator. A final native build checks
the concise omission explanations and time-zone display. Existing date-readiness,
preview/draft isolation, independent-copy, exact-retry and sync regressions passed.
**465 web tests** passed; **23 environment-gated tests** were skipped.
TypeScript, generated-contract freshness, web locale formatting, and whitespace
checks passed. **1,279 English/Spanish native strings** passed localization
validation, with the existing generic AppCopy extraction warning. UI tests were
skipped. No live DB/device acceptance was inferred from unit tests.

Manual checks: browse → preview → Use Blueprint → confirm dates → Create
Workspace; save/cancel unsaved choices; reopen drafts offline; finish an uncertain
creation; verify foreign-time-zone and DST displays; check library/card naming,
editor validation, long text, VoiceOver, Spanish, iPad and iOS 26/current OS.
Existing physical QR and deployed universal-link checks remain open. No deploy,
database reset, build upload, commit or push was performed.

Native result: `/tmp/gatherory-simple-blueprint-flow-20261019.xcresult`, using
the earlier full non-UI command with that result-bundle path. Final build:
`/tmp/gatherory-simple-blueprint-flow-final-build.log`. Web verification used
`pnpm test`, `pnpm typecheck` and Prettier on `src/i18n/locales/en.ts`;
native localization used `bash scripts/verify-localizations.sh`.

## Sharing badges and chosen creator names — October 19, 2026

Owner surfaces distinguish **Link active**, **In Search**, and **Private**.
These are separate sharing states: a link does not imply Search publication,
and removing a listing does not revoke links. Unknown or stale sharing metadata
does not report Private; retired sources do not report active sharing. Existing
QR/link access stays prominent, with replacement, revocation and Search actions
in the menu. Sharing still creates links only after an explicit action.

First native Search publication asks for a public creator name, with a short
explanation of where it appears. It starts empty and never derives a name from
the signed-in account. A trimmed name of 1–80 Unicode scalar values is required
by the native flow; later publication reuses the chosen name. The server accepts
the optional label for backward compatibility, preserves it when omitted, and
returns it separately from the immutable blueprint definition/content hash.
Public previews and discovery show only that display name, with no public
account identifier, email, profile or social features. Curated starters show
Gatherory; legacy owner entries without a chosen label omit the byline.

Titles remain flexible. Different creators may use the same title; discovery
identity and deduplication use the existing catalog key, never the title.
Republishing updates the same catalog entry and preserves its key. Personal
copies receive their own identity and start with no listing, share links or
inherited public creator name. Existing immutable revision pins, installation
receipts, independent saved snapshots, exact retries, account isolation and
transaction/sync boundaries remain in force.

The additive migration
`drizzle/20261019201829_lively_steel_serpent/migration.sql` adds nullable
`blueprint_template.creator_name` with a nonblank/length constraint. Apply it
before deploying the updated server; then release native attribution support.
It has only been applied to a new disposable local PostgreSQL 18 test database.
Existing development/production databases were not changed. Legacy clients may
continue publishing without a name; no backfill exposes existing account data.

Remaining acceptance: check badge layout and creator names with long text,
Dynamic Type, VoiceOver, light/dark mode, Spanish, iPad and iOS 26/current OS.
Publish with a chosen name, cancel, simulate a failed/lost response, switch
accounts during a request, unlist/relist, revoke a link, and refresh from another
device. Verify duplicate titles with different creators in Search, same-key
republish without duplicate results, and a recipient's private saved copy.
Existing physical QR scanning, native share-sheet and deployed universal-link
checks remain open. UI tests are excluded; no deployment/build upload, commit,
push or database reset is authorized by these local checks.

Verification: **683 native non-UI tests / 801 executions** passed, with zero
failures/skips, on iPhone 18 Pro / iOS 27 Simulator. Tests cover optional legacy
metadata, chosen-name validation and transport, matching creator/revision
acknowledgements, account switching and known/unknown sharing counts. The
existing independent-copy, exact-retry, permission and sync tests remain green.
**471 web tests passed / 23 environment-gated tests skipped** in the ordinary
suite. All **nine blueprint database integration suites passed** separately
against the migrated disposable PostgreSQL 18 database. They verify attribution
privacy, revocation/counts, duplicate titles, stable catalog identity on republish,
private copies, and existing installation recovery. Older integration fixtures
were corrected to distinguish an unrelated actor from an actor with an existing
independent-copy receipt; no production authorization was changed for them.
TypeScript, generated-contract freshness, changed TypeScript/TSX formatting,
both repositories' whitespace checks, and **1,287 English/Spanish strings** pass.
The existing AppCopy dynamic-key extraction warning remains.

Native result: `/tmp/gatherory-attribution-native-final-20261019.xcresult`.
Logs: `/tmp/gatherory-attribution-native-final-20261019.log`,
`/tmp/gatherory-attribution-web-tests.log`, and
`/tmp/gatherory-attribution-database-tests.log`. Commands:

```sh
pnpm test
pnpm typecheck
pnpm contracts:check
DATABASE_URL='<disposable test database>' RUN_BLUEPRINT_DB_TESTS=1 \
  ./node_modules/.bin/vitest run --no-file-parallelism \
  tests/integration/blueprint-*.database.test.ts
# From the native repository:
xcodebuild test -project Gatherory.xcodeproj -scheme Gatherory \
  -destination 'platform=iOS Simulator,id=3A4621C1-A19F-4EDD-A25F-6A1AB7663D6F' \
  -only-testing:GatheroryTests -parallel-testing-enabled NO \
  -disableAutomaticPackageResolution -collect-test-diagnostics never \
  -resultBundlePath /tmp/gatherory-attribution-native-final-20261019.xcresult \
  POSTHOG_ENABLED=NO
bash scripts/verify-localizations.sh
```

## Public catalog and applicable owner controls — October 20, 2026

First-link creation did not set `listed_revision`, but the catalog query reused
an owner-access predicate. As a result, an owner's private/unlisted publications
appeared in their own Search results, and a newer owned revision could replace
the exact older public revision in that projection. This was a discovery-scope
bug, not automatic publication to unrelated viewers. Search now includes only
curated entries or the exact active listed revision for every viewer. Owner
preview/copy access remains in the personal library and direct revision APIs;
bearer links and independent-copy recovery keep their existing authorization.

| Surface | Applicable controls | Server source of truth |
| --- | --- | --- |
| Personal blueprint long-press menu | Publish to Search / Remove from Search | Personal ownership, draft version, listed revision |
| Workspace Share Blueprint / Manage Sharing | Existing link and QR; explicit create, replacement, revoke, listing and removal | Source-event grant plus blueprint ownership and fresh link/listing metadata |
| Search | Public browsing and preview | Curated or exact `listed_revision`, without owner exceptions |
| Saved recipient copies / drafts | Private editing, saving and explicit workspace creation | Account-scoped independent snapshot / installation receipt |

The personal `unlist` command carries the confirmed blueprint ID, draft version
and listed revision. It locks/rechecks personal ownership, rejects stale inputs,
allows an already-null retry, and clears only listing metadata. Creator label,
catalog key, immutable revisions, share links and saved copies remain unchanged.
The native menu confirms removal, blocks stale/duplicate mutations and only
updates cached state after a matching acknowledgment for the current account
generation. Search refreshes on tab activation and app foregrounding.

No new migration is introduced by this correction. The prior creator-name
migration is still required for the combined server changes. Existing
explicit public listings are not silently withdrawn. Deployment and physical
device checks remain separate from local verification; nothing is deployed.

Manual acceptance: create the first link, confirm Link active without In Search,
and verify the blueprint is absent from Search for both its owner and another
account while QR/link preview still opens. Publish explicitly from the blueprint
menu, verify one catalog result, then Remove from Search from that menu. Confirm
Search refreshes, the same QR still works, and a saved recipient copy remains
private and independent. Check older-listed/newer-owned revisions, failed/lost
responses, double taps, account switching, Spanish and VoiceOver. UI tests remain
excluded.

Verification: **684 native non-UI tests / 802 executions** passed with zero
failures/skips on iPhone 18 Pro / iOS 27 Simulator. This includes personal unlist
wire inputs, explicit-null acknowledgment decoding, publication revision
transitions and existing account/link/copy/sync regressions. **472 web tests**
passed, with **23 environment-gated skips**. All **nine blueprint database
integration suites** passed separately against a new disposable PostgreSQL 18
database with the full migration chain. The first-link regression creates a
native unlisted blueprint and actual sharing link, checks owner and guest
catalog exclusion, then resolves the link successfully. Additional cases cover
the owner's exact older listed revision, private direct access, unlist ownership
and stale version/listing checks, nil retries, and preservation of creator,
catalog identity and links. Existing private-owner catalog assertions were
updated to the corrected Search policy, with direct owner-access checks retained.

TypeScript, generated-contract freshness, changed TypeScript/TSX formatting,
both repositories' whitespace checks, and **1,287 English/Spanish strings** pass.
The existing AppCopy dynamic-key localization warning remains. UI tests were
not run. The disposable database was removed after verification; existing local
and production databases were neither reset nor migrated. No deployment, build
upload, commit or push was performed.

Results: `/tmp/gatherory-catalog-controls-native-20261020.xcresult`;
logs: `/tmp/gatherory-catalog-controls-native-20261020.log`,
`/tmp/gatherory-catalog-controls-web-20261020.log` and
`/tmp/gatherory-catalog-controls-database-20261020.log`. Reuse the full commands
in the October 19 verification section, with this result path and a fresh
disposable database for the opt-in database suites.

## Checkpoint and next tasks — October 20, 2026

This checkpoint includes the native QR/simplified blueprint flows, reusable
account-scoped credentials, sharing badges, chosen creator names, public catalog
scope correction and personal Search controls across the web/server and iOS
repositories. The original handoff and the preceding uncommitted work are
included. Automated verification is recorded above; this checkpoint is not a
deployment or build-upload authorization.

- [ ] Approve and apply the creator-name migration to the intended server
  database, then deploy the matching server changes.
- [ ] Test a matching native build on physical devices: first link stays out of
  Search; QR opens the preview; explicit publication adds one catalog entry;
  withdrawal preserves the link; revocation stops new link access; saved copies
  stay private and independent.
- [ ] Check sharing/creator-name presentation with Spanish, VoiceOver, large
  text, light/dark mode, iPad, and iOS 26/current OS.
- [ ] Verify deployed universal links and scan both an exported PNG and a printed
  QR code from another device. Check account changes and offline recovery.
- [ ] After acceptance, approve a native build upload and TestFlight rollout.

Reminders and to-do/checklist features remain separate product work. Define
their scope and consent/delivery behavior before implementation; this checkpoint
adds no reminders, checklist persistence or scheduled notifications.
