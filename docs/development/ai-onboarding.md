# Start here: Gatherory across projects

Last reviewed: October 14, 2026. Read this guide when starting a fresh AI
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

The web app's `AGENTS.md` requires `npm exec --no -- intent list` before a
substantial change. On this review date, the command reports that
`@tanstack/intent` is unavailable. Report that result and follow the repository
instructions; do not automatically download a replacement.

## Where to read for a task

| Task                                     | Read first                                                                                                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend behavior and authorization       | [Server implementation guide](server-implementation-guide.md), [server architecture](../architecture/server-architecture.md), [data model](../architecture/data-model.md), then the owning code under `src/server/`.  |
| Invitations, account switching, or RSVPs | iOS [authentication contract](../../../ios-apps/gatherory/docs/auth-integration.md), `Gatherory/App/AuthenticationSession.swift`, `Gatherory/Features/Events/`, and web `src/server/events/` plus `src/server/auth/`. |
| Offline sync and data isolation          | iOS [sync guide](../../../ios-apps/gatherory/docs/offline-sync.md), `Gatherory/OfflineSync/`, `Gatherory/Data/Persistence/`, and web `src/server/sync/`.                                                              |
| Missing images or uploads                | [Media system](../architecture/media-system.md), web `src/server/media/`, iOS `Gatherory/OfflineSync/R2MediaTransport.swift` and `UploadImagePreparation.swift`.                                                      |
| iOS UI and localization                  | iOS `Gatherory/Features/`, `Gatherory/DesignSystem/`, `Gatherory/Localization/AppCopy.swift`, `Gatherory/Localizable.xcstrings`, and `Gatherory/InfoPlist.xcstrings`.                                                 |
| Web UI                                   | [Page creation](page-creation.md), [web localization inventory](i18n-string-inventory.md), and the relevant routes and shared components.                                                                             |
| Marketing, guides, or legal copy         | Landing [README](../../../gatherory-landing/README.md), `AGENTS.md`, `src/pages/`, `src/lib/components/landing/`, `src/i18n/`, and `src/lib/legal-details.ts`.                                                        |
| Templates and expansion                  | [Experience architecture](../architecture/experience-blueprints.md), [blueprint roadmap](../roadmaps/blueprints-roadmap/README.md), `src/contracts/`, and `contracts/`.                                               |
| Release preparation                      | [v1 safeguards](../release/v1-release-safeguards.md), iOS [release guide](../../../ios-apps/gatherory/docs/app-store-release.md), and `Config/Release.xcconfig`.                                                      |

Paths in inline code are relative to their owning repository.

## Decisions to preserve

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
- Who's Coming displays each person's RSVP for that specific event and refreshes
  on pull-down. A planning role does not imply an attendance response.
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
