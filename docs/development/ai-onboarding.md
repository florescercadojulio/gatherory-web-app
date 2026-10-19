# Start here: Gatherory across projects

Last reviewed: October 15, 2026. Read this guide when starting a fresh AI
conversation, then inspect the repositories relevant to the requested task.

## Product and project map

Gatherory helps hosts, collaborators, and guests plan events together. The
current product includes event invitations and RSVPs, shared ideas, individual
preferences through Decide, schedules, budgets, notes, and media. iPhone is the
primary planning experience; the web app provides account management and a
read-only companion. Public guides and marketing belong to the landing site.

The repositories are separate Git checkouts under the same Gatherory directory:

| Project            | Location relative to the web-app root | Responsibility                                                                                                                                                                       |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web app and server | `.`                                   | TanStack Start/React, Better Auth, Effect workflows, PostgreSQL/Drizzle, native APIs, private R2 media, moderation, and portable contracts. Production: `https://app.gatherory.com`. |
| iOS app            | `../ios-apps/gatherory`               | SwiftUI UI, SwiftData persistence, offline mutations, account/session lifecycle, native permissions, image preparation, and API transport.                                           |
| Landing site       | `../gatherory-landing`                | Astro/Svelte marketing, guides, public resources, privacy policy, terms, and support content. Public site: `https://gatherory.com`.                                                  |

On the current machine these live below `/Users/nexus/Documents/gatherory/`.
Prefer the relative locations above when transferring this guide to another
machine. Use an explicit working directory for every command; an older chat
may still refer to the previous `isaidyes` checkout location.

## First steps in a new context

1. Read the user's current request and each applicable `AGENTS.md`, including
   ancestor and feature-specific instructions if present.
2. Inspect `git status --short`, the current diff, and recent commits in each
   affected repository. Preserve existing edits and inspect overlapping work.
3. Read the [product overview](../README.md),
   [product model](../architecture/product-model.md), and the task-specific
   documents listed below.
4. Check the current source, package scripts, configuration, and tests before
   relying on an older document's status or command. Verify installed versions.
5. Implement the requested behavior in its owning project and verify the
   relevant integration boundaries. Update the owning docs or roadmap when
   behavior, contracts, or release evidence changes.

The web app's `AGENTS.md` requires `pnpm intent list` before a substantial
change, then `pnpm intent load <package>#<skill>` for matching guidance.
`@tanstack/intent` is installed as a pinned development dependency. Use the
package script: `@tanstack/devtools-event-client` also exports an `intent`
binary, so bare `exec intent` commands can select its incompatible launcher.
If the local dependency is unavailable, report it rather than downloading a
replacement.

## Where to read for a task

| Task                                     | Read first                                                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend behavior and authorization       | [Server implementation guide](server-implementation-guide.md), [server architecture](../architecture/server-architecture.md), [data model](../architecture/data-model.md), then the owning code under `src/server/`.                          |
| Invitations, account switching, or RSVPs | iOS [authentication contract](../../../ios-apps/gatherory/docs/auth-integration.md), `Gatherory/App/AuthenticationSession.swift`, `Gatherory/Features/Events/`, and web `src/server/events/` plus `src/server/auth/`.                         |
| Offline sync and data isolation          | iOS [sync guide](../../../ios-apps/gatherory/docs/offline-sync.md), `Gatherory/OfflineSync/`, `Gatherory/Data/Persistence/`, and web `src/server/sync/`.                                                                                      |
| Missing images or uploads                | [Media system](../architecture/media-system.md), web `src/server/media/`, iOS `Gatherory/OfflineSync/R2MediaTransport.swift` and `UploadImagePreparation.swift`.                                                                              |
| iOS UI and localization                  | iOS `Gatherory/Features/`, `Gatherory/DesignSystem/`, `Gatherory/Localization/AppCopy.swift`, `Gatherory/Localizable.xcstrings`, and `Gatherory/InfoPlist.xcstrings`.                                                                         |
| Web UI                                   | [Page creation](page-creation.md), [web localization inventory](i18n-string-inventory.md), and the relevant routes and shared components.                                                                                                     |
| Marketing, guides, or legal copy         | Landing [README](../../../gatherory-landing/README.md), `AGENTS.md`, `src/pages/`, `src/lib/components/landing/`, `src/i18n/`, and `src/lib/legal-details.ts`.                                                                                |
| Templates and expansion                  | [Experience architecture](../architecture/experience-blueprints.md), [blueprint roadmap](../roadmaps/blueprints-roadmap/README.md), `src/contracts/`, and `contracts/`.                                                                       |
| Monetization and delivery order          | [Monetization model](../architecture/monetization-model.md), [Event Pass roadmap](../roadmaps/monetization-roadmap/README.md), and [blueprints versus billing](../roadmaps/blueprints-roadmap/05-product-experience-and-billing-sequence.md). |
| Release preparation                      | [v1 safeguards](../release/v1-release-safeguards.md), iOS [release guide](../../../ios-apps/gatherory/docs/app-store-release.md), and `Config/Release.xcconfig`.                                                                              |

Paths in inline code are relative to their owning repository.

## Decisions to preserve

- Future host-authored experiences include rental stays, family cottages, and
  wedding-package recommendations. Fine-grained business configuration belongs
  in the web app; consumer template selection, review, creation and sharing also
  work entirely on iOS.
  QR template links must not become event invitations or workspace membership.
  Each copy is independent; checklists reset per instance and reminders require
  separate consent/delivery handling. See the
  [recorded direction](../roadmaps/blueprints-roadmap/10-host-authored-experiences.md).
  This is a planning constraint, not implemented QR/checklist/reminder support
  or authorization to build those features incidentally.

- New API/MCP contracts use explicit Unicode character limits and monetary
  envelopes `{ amountMinor: "100", currency: "USD" }` (one USD dollar).
  Follow [API contract conventions](api-contract-conventions.md); existing
  budget, archive and sync money formats require explicit adapters/versioning,
  not reinterpretation. Blueprint schemas already enforce these conventions.
- Date reasoning for blueprints uses native Temporal in protected server-only
  code on Node 26+. Shared/browser contracts remain plain strings without a
  Temporal dependency. Keep confirmed instants, named event zones and date-only
  values distinct; reject ambiguous/gapped local times rather than guess.
  Current installation precision is milliseconds. See the date section of the
  same conventions guide; do not migrate offline-sync formats incidentally.
  Native blueprint setup now requests read-only date suggestions, requires
  explicit confirmation, and preserves confirmed/edited instants on refresh.
  See [date-aware setup](../roadmaps/blueprints-roadmap/08-date-aware-setup.md).
- Server code uses pure injectable workflows plus production `*.workflows.live.ts`
  bindings. Compose dependency graphs once with `Layer.provide`; database-backed
  transports supply only `PgClientLive`. Service tags/contracts must not initialize
  production dependencies. Follow the [implementation guide](server-implementation-guide.md)
  for examples, import aliases, and test boundaries.
- Native sync/materialization and account deletion still retain Promise-based
  persistence engines behind Effect ports. Their migration was deferred, not
  implemented. Preserve transaction/side-effect ordering during structural work;
  do not silently resume that migration from an earlier chat request.
- There is no ambient Effect execution-context service. Explicit actor/scope
  inputs and reusable authorization middleware are the current design.
- Keep the iOS experience offline-first. Local data drives rendering; background
  refreshes must not pause navigation or tab changes. Save mutations durably and
  deliver them with stable idempotency keys.
- Identity, workspace organization, event role, and RSVP are distinct concepts.
  Better Auth owns identity and organizations; event participation determines
  event access. Guests must not gain workspace-wide planning access.
- Collaborators receive planning controls alongside hosts; guests receive the
  invitation/home content without planning tabs. Check operation-specific
  permissions on the server. Link access and collaborator approval must follow
  the configured sharing policy.
- Child-only collaborators use an isolated native planning projection keyed by
  the child event UUID. Root storage and transaction boundaries are shared, but
  parent/sibling data and organization grants are not. See the data model's
  native replication section and `scoped-event-sync.persistence.ts`. Do not
  "fix" child access by adding root participation or organization membership.
- Who's Coming displays each person's RSVP for that specific event and refreshes
  on pull-down. A planning role does not imply an attendance response.
- iOS planning tabs are Home, Ideas, Decide, and Manage. Manage owns event-scoped
  Budget, a combined Guests/Collaborators card (including quick join-request approval),
  and Notes (latest preview and history). Home's note shortcut is compose-only;
  sending uses the existing offline note flow. Keep
  approval controls out of guest-facing invitation content. Manage selection is
  view-local; pushed tools retain an explicit event reference. Workspace budget
  rollups are labeled separately and unavailable to child-only projections.
- Decide records each planner's preference. Team input includes unanswered
  planners and updates as participation changes. Preference and approval remain
  separate operations.
- Account switching must isolate local records, pending work, media caches,
  requests, and callbacks by the canonical user ID. Sign-out attempts to flush
  pending sync while authenticated; preserve the existing failure/retry behavior
  and prevent an old account's work from reaching the next account.
- Signed media URLs expire and require authorized refresh. Image transfers are
  separate from structured sync. Check current transport code: older iOS docs
  still describe media transfer as unfinished or embedded in snapshots.
- Use the existing progressive image blur (called “glurr” in product feedback):
  the image blurs progressively with scrolling, as in idea preview tiles. Keep
  system light/dark colors, soft headers, stable loading layouts, and native
  accessibility behavior.
- Sync visibility belongs in Account. Avoid adding sync labels to editors,
  event cards, or invitation content. Archive/delete management belongs inside
  event details.
- Localize fixed UI copy, accessibility labels, and permission explanations.
  Preserve user-authored content and format dates, counts, and currency by locale.
- The current Release configuration enables PostHog by default at the user's
  request. Inspect configuration and privacy disclosures before changing this.
- Use typed Effect domain errors at server boundaries, with useful structured
  diagnostics. Inspect existing error types before introducing generic errors.
- The user has asked to avoid routine web-app builds. Use relevant tests,
  typechecks, and route generation; run a web production build when requested.
- Templates, business packages, Android delivery, and private family stays are
  expansion directions. The blueprint roadmap records implementation status;
  do not infer that a planned capability is already available.
- The first Wedding template slice has catalog/preview/install/status APIs,
  durable native installation recovery and read-only audience-scoped guidance.
  See the [installation proof](../roadmaps/blueprints-roadmap/06-wedding-installation-proof.md)
  for migration/explicit catalog seeding, compatibility gates, tests, and limits.
  Preserve ordinary sync transactions and account-isolated install intents.
- Native pre-install setup now has device-local account/template drafts with an
  exact source pin, selections and confirmed dates. The Blueprints tab resumes
  them offline and lists account-cached used-template history; Search has no resume banner.
  Pending installation recovery takes priority, and matching drafts
  clear only after canonical import. Saved drafts are independent snapshots:
  `/api/blueprints/copies` privately publishes their validated portable content
  under recipient ownership before server suggestions/preview/install. A separate
  durable copy UUID/private pin preserves retries; local account/link identity,
  dates and edits remain unchanged. Original source access is no longer needed
  for saved drafts, but fresh links still require it. Do not rewrite existing
  installation intents or auto-list setup copies in search/the author library.
  See [resumable setup](../roadmaps/blueprints-roadmap/12-resumable-setup.md).
- Blank native events remain ordinary offline-created instances. Event-to-template
  capture is separate and explicit: long-press an iOS Workspaces card, choose
  Share Template, select supported content, review, then Create & Share. Web
  capture and advanced draft editing/refresh remain available. Capture
  only selected supported content, preserve manual template edits on reviewed
  refresh, and keep publication separate. Source-event permissions and destination
  template ownership are independent. See [capture](../roadmaps/blueprints-roadmap/13-event-to-template-capture.md).
  Playlist copying, inclusion defaults and QR distribution remain future work.
- A broad shared creation engine is deliberately deferred. Do not route ordinary
  native workspace/event/idea creation through blueprints. Extract small shared
  rules only when actual duplication is demonstrated; keep existing local
  edit/outbox transactions and server installation/receipt/import workflows
  separate. Sharing, source refresh and publication stay explicit and optional.
  This is not a prerequisite for QR distribution or billing. See the
  [roadmap decision](../roadmaps/blueprints-roadmap/README.md#creation-rules-and-optional-sharing).
- Private web authoring/publication now lives at `/blueprints`; only explicitly
  selected workspace owners can author/install private templates. Account-level
  template navigation must not provision/select the active workspace. Draft CAS,
  publication locks, immutable snapshots and source access checks are separate
  from installed event permissions. See [cottage proof](../roadmaps/blueprints-roadmap/11-private-cottage-proof.md).
  Development seed data includes an App Review-owned published cottage and an
  unpublished editing draft. The seed remains destructive; never run it casually.
- Unlisted template links now grant preview/install access to one pinned published
  revision. Owner-only create/list/revoke never changes source-event or workspace
  permissions. Revocation blocks new source acquisition but cannot remove saved
  snapshots or completed copies. Saved setups install through their own private
  snapshot publication. Already-frozen legacy link-based requests retain their
  existing authorization/recovery behavior and are never rewritten. Native setup retains the
  credential in account/link-scoped drafts and exact installation intents; do
  not move it into ordinary discovery or sync payloads. See
  [unlisted links](../roadmaps/blueprints-roadmap/14-unlisted-template-links.md)
  for the migration and deployment boundary. QR generation remains deferred.
- Native Workspaces card menus offer Share Template and Manage Links for templates
  explicitly captured from that event and owned by the current user. Do not infer
  template ownership from installed-copy provenance or source-event management.
  The native management endpoint checks both grants, uses online-only requests,
  and never enqueues link mutations into offline sync. Advanced authoring remains
  on the web; native Create & Share also publishes explicitly reviewed consumer
  captures. Raw generated URLs are transient sheet state. See
  [native creation](../roadmaps/blueprints-roadmap/15-native-create-and-share.md)
  for atomic capture/publication, exact retry and account isolation.
- New native Create & Share requests omit destination ownership and explicitly
  publish to Search. The server uses/provisions the actor's personal owner only
  on creation, never on source/review reads; event permissions remain separate.
  A nullable listed revision grants catalog/install access to that exact
  publication. Existing private/unlisted templates remain private. Search
  withdrawal and bearer-link revocation are independent, and neither changes
  completed installed copies. See
  [automatic ownership and discovery](../roadmaps/blueprints-roadmap/16-public-discovery-and-automatic-ownership.md)
  for the additive migration and replay/installation boundaries.
- The curated catalog now also includes Birthday Party and Thanksgiving; the
  same native discovery/setup/install flow handles all three. See
  [curated starter proof](../roadmaps/blueprints-roadmap/09-curated-starters.md).
  Run the explicit catalog seed for availability; imports never seed on requests.
- Monetization is a documented plan, not implemented billing: free personal
  planning/RSVPs, an organizer-funded Event Pass for a main event plus children,
  and annual coverage later. Price, term and quotas remain undecided. Commercial
  coverage is separate from event permission; expiry must not lose offline work.
  The user subsequently prioritized private authoring/cottage reuse before paid
  enablement. The original sequencing assessment remains historical context;
  do not infer billing is implemented or silently drop release acceptance gates.

## Verification by project

For the web/server project, inspect `package.json` and choose relevant checks:

```sh
pnpm typecheck
pnpm test
pnpm contracts:check
```

`pnpm test` already runs the contract check. Run `pnpm generate-routes` when
routes change and `pnpm contracts:generate` when portable schemas change.
Local integration scripts include `test:invitations:local`, `test:media:r2`,
`test:account-deletion:local`, and `test:apple-tokens:local`. Inspect their tests
and environment requirements first; ordinary tests can skip these integrations.
Passing unit tests alone does not verify production auth, storage, or migrations.

For iOS, verify Xcode selection and available simulators, then run the relevant
`GatheroryTests` using the `Gatherory.xcodeproj` project and `Gatherory` scheme.
Use an installed simulator destination rather than assuming a specific device.
Run `bash scripts/verify-localizations.sh` after UI copy changes. Use previews
for visual feedback and physical-device testing for native permissions, sharing,
and account transitions when the task calls for it.

For landing content, use the relevant checks from its `package.json`:

```sh
pnpm test:content
pnpm test:legal
```

Read landing `AGENTS.md` before starting its development server. Keep public
guides aligned with shipped behavior and distinguish future plans in copy.

Database resets, seeding, migrations, moderator grants, uploads, and deployment
change external state. Follow the user's task authorization, resolve the target
environment, and read the corresponding script before running it. The local
reset leaves an empty database; seeding is a separate destructive operation.
Keep secrets and reviewer passwords out of docs and tool output.

## Release context and known documentation gaps

As of October 14, 2026, version 1.0 build 2 was successfully uploaded to
TestFlight, and the user reported sending tester links. The archived Release
configuration used `https://app.gatherory.com`, `APP_ENVIRONMENT=production`,
and disabled development seeding and authentication bypass. Confirm App Store
Connect status before describing beta review or public release as complete.

This is a dated handoff. Some iOS architecture/release documents retain early
wedding-specific language, old example commands, and media-transfer deferrals.
The current shared product overview, source code, tests, and build configuration
are the starting evidence for those areas. Report and correct discrepancies
relevant to the task instead of restoring an older design from prose alone.

End substantial work with the behavior changed, validation performed, and any
remaining work. Update the active roadmap's stopping point so the next context
can continue without relying on this conversation.
