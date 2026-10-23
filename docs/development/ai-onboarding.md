# Start here: Gatherory across projects

Last reviewed: October 23, 2026. Read this guide when starting a fresh AI
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

For QR template distribution, start with the
[implementation handoff](../roadmaps/blueprints-roadmap/22-qr-distribution-handoff.md).
It records the native QR implementation, existing sharing/copy boundaries and
remaining physical-device/deployment acceptance checks.

| Task                                     | Read first                                                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend behavior and authorization       | [Server implementation guide](server-implementation-guide.md), [server architecture](../architecture/server-architecture.md), [data model](../architecture/data-model.md), then the owning code under `src/server/`.                          |
| Invitations, account switching, or RSVPs | iOS [authentication contract](../../../ios-apps/gatherory/docs/auth-integration.md), `Gatherory/App/AuthenticationSession.swift`, `Gatherory/Features/Events/`, and web `src/server/events/` plus `src/server/auth/`.                         |
| Offline sync and data isolation          | iOS [sync guide](../../../ios-apps/gatherory/docs/offline-sync.md), `Gatherory/OfflineSync/`, `Gatherory/Data/Persistence/`, and web `src/server/sync/`.                                                                                      |
| Missing images or uploads                | [Media system](../architecture/media-system.md), [Blueprint cover images](../architecture/blueprint-cover-images.md), web `src/server/media/`, iOS `Gatherory/OfflineSync/R2MediaTransport.swift` and `UploadImagePreparation.swift`.         |
| iOS UI and localization                  | iOS `Gatherory/Features/`, `Gatherory/DesignSystem/`, `Gatherory/Localization/AppCopy.swift`, `Gatherory/Localizable.xcstrings`, and `Gatherory/InfoPlist.xcstrings`.                                                                         |
| Web UI                                   | [Page creation](page-creation.md), [web localization inventory](i18n-string-inventory.md), and the relevant routes and shared components.                                                                                                     |
| Marketing, guides, or legal copy         | Landing [README](../../../gatherory-landing/README.md), `AGENTS.md`, `src/pages/`, `src/lib/components/landing/`, `src/i18n/`, and `src/lib/legal-details.ts`.                                                                                |
| Templates and expansion                  | [Experience architecture](../architecture/experience-blueprints.md), [blueprint roadmap](../roadmaps/blueprints-roadmap/README.md), `src/contracts/`, and `contracts/`.                                                                       |
| Explore advertising                      | iOS [advertising setup and release gates](../../../ios-apps/gatherory/docs/explore-advertising.md), `Gatherory/Advertising/`, Debug/Release xcconfigs, landing `public/app-ads.txt` and privacy policy.                                       |
| Monetization and delivery order          | [Monetization model](../architecture/monetization-model.md), [Event Pass roadmap](../roadmaps/monetization-roadmap/README.md), and [blueprints versus billing](../roadmaps/blueprints-roadmap/05-product-experience-and-billing-sequence.md). |
| Release preparation                      | [v1 safeguards](../release/v1-release-safeguards.md), iOS [release guide](../../../ios-apps/gatherory/docs/app-store-release.md), and `Config/Release.xcconfig`.                                                                              |

Paths in inline code are relative to their owning repository.

## Decisions to preserve

- Consumer-facing wording is **Event / Events** (Spanish: **evento / eventos**),
  including the former Workspaces directory/settings/budget labels. Keep stable
  localization keys, internal `PlanningWorkspace` names, ownership containers,
  IDs and sync formats unchanged. Blueprint authoring containers may say library.
- [Reusable event invitation QR links](../roadmaps/event-invitation-qr-roadmap/README.md)
  use separate Guest and Collaborator public links per exact event, with no
  scheduled expiry for new links. Loading sharing never creates a link; creation
  and role-specific revocation remain explicit. Scanning opens the existing
  invitation preview and never silently enrolls someone. Guests attend without
  planning access; collaborators sign in and retain current permission/approval
  checks. The migration preserves active tokens without reviving expired or
  revoked links. Private email invitations keep their expiry. The new native
  build requires the compatible schema/server rollout; no deployment is implied.
- [Share Event Schedule](../roadmaps/event-schedule-sharing-roadmap/README.md)
  creates an explicit CSV attachment through the iPhone share sheet.
  Exact-account active event managers may share only the allowlisted public
  schedule; child exports never include parent/sibling data. Guest/member
  records and private planning data are excluded. Local cache permissions are
  rechecked before presentation; exported copies cannot be recalled or updated.
  Temporary files are protected and removed on dismissal; never include account
  or event identifiers in their filenames or reuse another share's attachment.
- [Export Guest List](../roadmaps/guest-list-export-roadmap/README.md) shares only
  names and RSVP statuses from the selected event's roster, using exact-account
  active-manager permissions. Parent and child rosters never merge. Contact
  fields, credentials, roles and IDs are excluded; email placeholders become
  Unnamed Guest. It reuses the schedule export's CSV encoder and protected native
  presenter, which invalidates stale account, permission and roster snapshots.
- [Event announcements](../roadmaps/notifications-roadmap/02-event-announcements.md)
  use one iPhone Updates UI with All/Planning/Guests audiences. Hosts can send
  all audiences; contributors/managers can send to Planning only. Exact-event
  server read and notification policies isolate Planning from guests and Guests
  from collaborators; hosts can oversee guest history. Earlier notes stay private
  Planning history in their existing stores; do not convert or resend them.
  Feed bylines resolve the sender's current event-member name and profile image
  without storing a personal snapshot; deleted authors fall back to the generic
  role label.
  Guest access never grants sending or planning rights. Announcement/outbox writes
  are atomic and request IDs deduplicate retries. Lock-screen text is generic,
  and taps reauthorize before fetching text. The additive migration and updated
  backend/native build require separate rollout approval; nothing was deployed.

- Native launch routing uses a pure ordered `AuthenticationFlowChain` with a
  separate `SessionPreparationCoordinator` for data activation/handover and
  `SessionLifecycleActions` for save/exit hooks. Transient credential restore
  failures show recovery; account readiness and onboarding are identity scoped.
  Check [mobile session lifecycle](../architecture/mobile-session-lifecycle.md)
  before changing sign-in, guest retention, or entry ordering. Do not put
  network, deletion, or permission changes in routing handlers.
  Confirmed account deletion now keeps an atomic account-ID cleanup journal
  until exact-account device removal succeeds. Cleanup retries before session
  restoration, never repeats remote deletion, and never uploads pending edits.
  Lost confirmation requires explicit device-only removal. Preserve other
  accounts, guest sources, notification installation credentials, and the
  account-scoped media/file retry boundaries.

- The October 20 [mobile FCM proof of concept](../roadmaps/notifications-roadmap/01-fcm-proof-of-concept.md)
  adds a reusable notification connector consumed by the service layer, with
  transactional assignment/event-change intents and separate delivery. Guest
  and account bindings remain isolated. Personal reminders and browser push are
  deferred. It is local implementation, not deployed or physical-device delivery
  evidence; Firebase/APNs configuration and a dispatch deployment need separate
  acceptance.

- [Notification delivery](../roadmaps/notifications-roadmap/04-best-effort-delivery.md)
  attempts delivery once after a native assignment/event change commits or an
  announcement is explicitly saved. Failures do not undo the saved change or
  trigger automatic retries. Preserve current permission/binding checks, lease
  fencing and accepted-device checkpoints. The earlier retry worker and protected
  scheduler remain available for later, disabled, with no cron schedule configured.
  Do not enable recovery or replay old notifications as part of ordinary requests.
  The [mobile notification policy](../roadmaps/notifications-roadmap/05-mobile-notification-policy.md)
  keeps draft event edits quiet and classifies eligible schedule, location,
  cancellation and reopening alerts without putting event content in push payloads.

- The October 20 [V1 guest slice](../roadmaps/v1-guest-release-candidate-roadmap/README.md)
  allows device-local planning and public guest invitation attendance. Sharing
  owned events and blueprint account actions require sign-in. Device guest
  identity is separate from Better Auth and planner sync; account linking must
  preserve existing account data and retain the source until retry-safe import
  and attendance claim complete. V1 wording is “attend as guest; sign in to help
  plan”; signing in never automatically upgrades attendance to a planning role.
  Private/email invitations and view-only permissions remain explicit. Browser
  guest RSVP remains a later slice.

- Product wording is **Blueprint / Blueprints** across native and web UI
  (Spanish: **plano / planos**), per the October 19 terminology decision.
  Older documents may say template; stable localization keys, API fields and
  `/templates/shared/<token>` links retain their existing identifiers.

- The October 22 [Blueprint-led discovery decision](../architecture/blueprint-led-discovery.md)
  keeps Blueprints as the main published/recommended object. Current cards are
  scan-first: cover, prominent purpose-led title, and small optional creator
  byline. The title should say what experience a Blueprint is for (for example,
  “Cottage Weekend” or “Backyard Birthday Party”); no title validation or
  automatic renaming is introduced, and card metadata must not compensate for
  vague titles. The existing whole-card button opens the read-only preview; event and
  idea detail stays there. Cards have no category label, summary, highlights, or
  visible preview CTA. Single-event Blueprints remain valid. An earlier local
  highlight prototype and its tests are superseded history, documented in
  [slice 01](../roadmaps/blueprint-ranking-roadmap/01-blueprint-cards-and-highlights.md#superseded-highlight-prototype-history).
  Current listing cards reserve their cover geometry before artwork loads;
  title/byline use a dark gradient with no solid tray or Glur. See the native
  [rendering handoff](../../../ios-apps/gatherory/docs/explore-performance.md).
  [Public content/related-term search](../roadmaps/blueprint-ranking-roadmap/02-content-search-and-related-terms.md)
  is implemented locally: public name/summary, supported event titles and idea
  titles/notes, explicit English/Spanish aliases and directed outdoors expansion.
  Query relevance and cursor digests remain server-owned; the native feed keeps
  server matches/order without its legacy local metadata filter. The response
  contract and clean cards are unchanged, with source details in the preview.
  Web typecheck, contract/full tests and 37 focused native tests passed; see the
  slice for exact test stages and limits. No deployment/phone release occurred.
  [Blueprint actions and measurement](../roadmaps/blueprint-ranking-roadmap/03-actions-and-measurement.md)
  are now implemented locally: private likes/bookmarks/hiding in the native card
  and preview menus, saved/hidden management, exact-source validation and an
  account opt-in for organic measurement (off by default). Browse/category hiding
  happens before paging and cursors bind the actor; explicit search stays inclusive.
  Measurement uses 30-minute exposures, daily contribution limits and 30-day
  retention. Verified unchanged-copy acquisition supports completed-install credit;
  client source markers alone do not. Opt-out purges telemetry/attribution while
  preserving preferences. Apply the additive slice-03 migration before routes or
  native controls; no shared migration/deployment/collection occurred here.
  [Recommendation baseline](../roadmaps/blueprint-ranking-roadmap/04-recommendation-baseline.md)
  is also implemented locally: paged `ranking=baseline_v1` clients get editorial
  priority, creator diversity and promotion-only recent-publication opportunity within
  equal content relevance. Native opts in; full/legacy catalog stays available.
  Creator identity and earliest-publication timestamps are internal only, with
  explicit public response stripping. Ranked v2 cursors freeze time/configuration
  for 24 hours and restart on scope/visibility/configuration changes. The
  `BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED=false` switch selects the existing
  order as a fallback. One additive migration adds nullable policy labels to
  existing consented exposures for evaluation. No signal weighting, batch job,
  model or rollout was added for this baseline. The subsequent
  [offline evaluation/source audit](../roadmaps/blueprint-ranking-roadmap/05-baseline-evaluation-and-signal-readiness.md)
  records a reproducible fixture artifact, new-item reservation tradeoffs, private
  preference/history separation, daily-credit pairing limits and the conflict
  between 30-day raw retention and mature conversion cohorts.
  [Measurement readiness report and attribution checks](../roadmaps/blueprint-ranking-roadmap/06-measurement-readiness-report-and-attribution-checks.md)
  are now implemented locally: a synthetic-default CLI, explicit loopback-only
  bounded read-only database mode, current read/retention time separate from
  analytic cutoff, and actual native snapshot/copy/install checks. No private
  preference pooling or ranking weight is added. The subsequent
  [measurement cleanup and new-item rule](../roadmaps/blueprint-ranking-roadmap/07-measurement-cleanup-and-new-item-opportunities.md)
  adds database acceptance timestamps/sequence, exact prior-impression links and
  opt-in daily serving diagnostics. Report v2 keeps unknown traffic denominators
  explicit. Baseline algorithm/configuration v2 promotes recent items only and
  preserves their natural positions; the wire capability remains `baseline_v1`.
  Apply its targeted pre-release telemetry reset migration before the backend;
  preferences, settings and private content/installation receipts are preserved.
  No shared reset or rollout occurred.
  [Personal Like ranking](../roadmaps/blueprint-ranking-roadmap/08-personal-like-ranking.md)
  is now implemented locally for ranked authenticated pages: exact current public
  Likes inform bounded lexical content affinity after editorial priority within
  identical relevance groups. It is functional use independent of measurement;
  bookmarks and pooled signals do not contribute. New policy
  `blueprint-personal-likes-v2` and private preference bindings scope cursors;
  `BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED=false` selects baseline v2. No history
  preserves baseline order. Native paging restarts a stale continuation once,
  and EN/ES settings explain Like use and undo. Reported task-result/formatter/
  preview isolation diagnostics are fixed.
  [Precision tuning](../roadmaps/blueprint-ranking-roadmap/09-personal-like-precision.md)
  now separates names/child titles, summary and notes; requires shared title intent
  corroborated by non-notes text; adjusts common terms and normalizes overlap.
  Summary-only and notes-only matches cannot qualify. Wedding diagnostic boosts
  fall 11 to 4; fresh multilingual challenge precision/recall equal v1, so general
  quality lift and production usefulness remain unverified. No pooled bookmark
  feature or engagement experiment is implemented.
  Categories and curated tags stay internal, with optional browse shortcuts and
  no required taxonomy or hashtag authoring. Likes and ranking changes are not
  prerequisites. See the [ranking roadmap](../roadmaps/blueprint-ranking-roadmap/README.md)
  for remaining work.
  The native library follow-up keeps the fixed **Blueprints** title with primary
  **Yours/Saved/Liked** filters: Yours owns editable authored/copied plans, while
  Saved and Liked are independent references that can overlap. Not interested
  stays in Account. See [slice 10](../roadmaps/blueprint-ranking-roadmap/10-blueprint-library-collections.md);
  implemented locally; targeted native, web/server, localization checks, and simulator Release build passed. Canvas visual verification and live device/VoiceOver acceptance remain pending; no ranking change was made.
  The October 23 [single-preview follow-up](../roadmaps/blueprint-ranking-roadmap/15-single-preview-and-event-creation.md)
  combines the main event, related events and masonry ideas into one scroll across
  discovery, Saved/Liked, shared links and Yours. Yours opens full screen like
  Liked, with native bottom-toolbar Use/Add and direct taps into native edit sheets. There is
  no Blueprint Decide or Edit mode; Decide belongs to created event/workspaces. The
  subsequent creation UI follows onboarding's native form/date-editor patterns,
  with a full-height form and native bottom actions. Onboarding is unchanged;
  do not apply ReUI guidance to iOS (explicit user direction).
  Library cards use the same customized artwork as the opened preview. Like/Save
  stay references; explicit Use prepares the working plan. New plans include
  content without legacy Love responses; saved selections, exclusions and dates
  remain intact. Current acceptance uses standard Light/Dark layouts; dedicated
  super-large tests were removed per user direction. The bottom-controls/native
  creation follow-up passed 69 distinct checks across staged runs, including
  normal Light/Dark native form and date-editor journeys.
  The Use-to-event follow-up verifies native transport/import/navigation locally
  and copy/install content and replay against a disposable PostgreSQL database.
  Workspace selection waits for import and exact-request cleanup; missing
  bootstrap data and cleanup failures recover the original receipt without
  another install. Reject altered pending intents and wrong-owner writes.
  Slice 15 records exact results, the remaining frame-dimension diagnostic and
  deployed-account/device/media acceptance limits. Preserve exact-request retry,
  canonical import and account isolation.

- The [unseen-first discovery follow-up](../roadmaps/blueprint-ranking-roadmap/16-unseen-first-discovery.md)
  keeps a bounded, exact-account device history of meaningful visible browse
  cards, separate from opt-in analytics. A frozen header context gives ranked
  browse unseen-first ordering, 24-hour repeat cooldowns and stable pagination.
  Quick tab/preview returns retain the feed; explicit refresh or return after
  30 minutes away starts a new session. Typed search omits and ignores freshness
  context. Keep raw history out of URLs, logs and telemetry. Account deletion
  removes only its own history. Local implementation/evaluation does not imply
  a deployed backend, cross-device history or production recommendation lift.

- The October 22 [Pinterest event-ideas proposal](../roadmaps/pinterest-event-ideas-roadmap/README.md)
  explores connecting a person's boards, selecting Pins and reviewing references
  for one event. It is planning only, separate from public Blueprint discovery.
  Confirm permitted persistence and collaborator display with Pinterest before
  building API imports; OAuth alone is insufficient. The existing Website idea
  is the starting point for manually supplied links and original planning notes.
  Do not copy API images/text into ordinary idea sync, media or Blueprint capture.
  No connection, importer, provider approval or live API test exists from this work.

- Future host-authored experiences include rental stays, family cottages, and
  wedding-package recommendations. Fine-grained business configuration belongs
  in the web app; consumer template selection, review, creation and sharing also
  work entirely on iOS.
  QR template links must not become event invitations or workspace membership.
  Each copy is independent; checklists reset per instance and reminders require
  separate consent/delivery handling. See the
  [recorded direction](../roadmaps/blueprints-roadmap/10-host-authored-experiences.md).
  Native QR display/image sharing is implemented locally. On October 20 the
  user authorized the first [shared To-dos slice](../roadmaps/to-dos-reminders-roadmap/01-shared-event-to-dos.md):
  one list per exact event in Manage, with optional due dates, websites,
  exact-event planner assignment/self-claim, a next-item preview and completion,
  permissions and offline sync. Its additive migration and native/server changes
  are local, not deployed. The
  [optional blueprint task definitions](../roadmaps/to-dos-reminders-roadmap/02-blueprint-to-dos.md)
  are also implemented locally: capture starts excluded, portable title/website
  definitions create fresh unfinished/unassigned tasks in each copy. Personal
  reminders and the Home preview remain planned; due dates do not schedule
  notifications. Keep these separate from the QR release gates.

- New API/MCP contracts use explicit Unicode character limits and monetary
  envelopes `{ amountMinor: "100", currency: "USD" }` (one USD dollar).
  Follow [API contract conventions](api-contract-conventions.md); existing
  budget, archive and sync money formats require explicit adapters/versioning,
  not reinterpretation. Blueprint schemas already enforce these conventions.
- Date reasoning for blueprints uses explicit `Temporal` imports from the
  server-only `src/server/temporal.server.ts` polyfill adapter on Node 24.x.
  Shared/browser contracts remain plain strings without a Temporal dependency.
  Keep confirmed instants, named event zones and date-only
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
- Workspace administration has a [dynamic role foundation](../architecture/dynamic-workspace-rbac.md):
  Better Auth role definitions are organization-scoped, while its default
  owner/admin/member roles stay intact. Apply the additive role migration before
  deploying the new auth configuration. These custom workspace roles are not
  event participant roles or native planning capabilities; keep those contracts
  separate. No new V1 role editor is included.
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
  Share Blueprint, then create a template when needed, select supported content,
  review, then Create & Share. Existing owned templates open their explicit link
  creation and QR sharing controls directly. Web capture and advanced draft editing/refresh remain available. Capture
  only selected supported content, preserve manual template edits on reviewed
  refresh, and keep publication separate. Source-event permissions and destination
  template ownership are independent. See [capture](../roadmaps/blueprints-roadmap/13-event-to-template-capture.md).
  Native QR display/image sharing now reuses the generated URL; playlist
  copying remains future work. See [QR distribution](../roadmaps/blueprints-roadmap/22-qr-distribution-handoff.md).
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
  for the migration and deployment boundary. Native QR generation uses these
  exact URLs without changing their pinned-revision or access semantics.
- Native Workspaces card menus offer Share Blueprint for templates explicitly
  captured from that event and owned by the current user. Manage Sharing keeps
  the link and QR visible; its toolbar menu contains replacement, active-link
  revocation and Search visibility, with explicit confirmations;
  QR and two system-sharing actions appear after explicit creation or authorized
  reopening of a saved link. Do not infer template ownership from installed-copy provenance or source-event management.
  The native management endpoint checks both grants, uses online-only requests,
  and never enqueues link mutations into offline sync. Advanced authoring remains
  on the web; native Create & Share also publishes authorized consumer
  captures. New owner credentials are retained in device-only Keychain storage,
  scoped to account/origin/event/template. Displayed URL/code clears on dismissal;
  reopening requires fresh ownership/active-link reads. Replacement and revocation
  are explicit; older unsaved URLs remain unrecoverable from server hashes. See
  [native creation](../roadmaps/blueprints-roadmap/15-native-create-and-share.md)
  for atomic capture/publication, exact retry and account isolation.
- Owner blueprints now show **Link active**, **In Search**, or **Private** from
  fresh sharing metadata; unknown/offline state must not imply Private. First
  native Search publication asks for a chosen public creator name, never an
  account-name/email fallback. The display label is per blueprint, outside the
  immutable content hash. Discovery and shared previews show the byline; legacy
  owner entries without a chosen name omit it. Curated starters say Gatherory.
  Titles remain flexible and duplicate titles are allowed. Republish retains the
  same catalog key; independent saved copies start private with no inherited
  public creator label. No public account IDs or social features are added.
  Search shows only curated or explicitly listed revisions, even to the owner;
  direct owner access belongs to the private library/exact revision APIs. A link
  must never add its private blueprint to Search. Personal blueprint menus offer
  both Publish to Search and Remove from Search; withdrawal preserves links.
  The additive `20261019201829_lively_steel_serpent` migration must precede the
  updated server release; only a disposable test database has received it.
- New native sharing requests omit destination ownership and create an unlisted
  immutable publication and share link after an explicit creation action. Source
  authorization and review-hash reads still run behind the scenes. Users verify
  content by editing their workspace/blueprint, with no repeated review UI here. Search
  publication is optional through a separate confirmed management action; it
  neither replaces the link nor changes its QR. Private Save Blueprint creates
  no link and no Search listing. The server uses/provisions the actor's personal owner only
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

Add or update focused regression tests alongside feature and behavior changes.
Cover observable outcomes and the affected state, permission and recovery
boundaries; use UI tests for native gestures and navigation. Record actual
results and remaining acceptance limits with the implementation docs.

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
`pnpm db:reset` leaves an empty database; seeding is a separate destructive
operation. The default `pnpm db:seed` resets and seeds the local fixture with 21
covers and six shared-album photos after preflighting both catalogs and private
development storage. `pnpm db:seed -- --without-images` retains the database-only seed
behavior and is still destructive. Keep secrets and reviewer passwords out of
docs and tool output.

Local App Review/development photo fixtures have a fill-only updater:
`pnpm db:seed:images` previews missing covers and `--apply` fills them through
private development R2 without a reset. `pnpm db:seed:portraits` does the same
for account pictures. See [development seed](development-seed.md) for targets,
preservation rules, checked-in photos, and verification evidence.

## Release context and known documentation gaps

The [October 21 mobile V1 guest/invitation audit](../release/mobile-v1-guest-invitation-audit.md)
records current recovery fixes and distinguishes source test evidence from
remaining physical-device, migration, configuration, and submission checks.
Use it instead of copying dated blocker tables into a current release status.

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
