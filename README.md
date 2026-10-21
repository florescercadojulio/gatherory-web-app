# Gatherory Web App

Gatherory Web is the authenticated companion to the iOS-first planning product.
For the initial iOS release it provides account management and a read-only view
of synchronized workspaces, schedules, ideas, people, and budget signals. Event
creation and editing remain in the iPhone app rather than being duplicated with
partial web controls. This TanStack Start project is served from
`app.gatherory.com`; the public marketing site remains a separate Astro project
at `gatherory.com`.

## Current foundation

This repository currently includes:

- TanStack Start and file-based TanStack Router;
- shadcn/Base UI components and the sidebar skeleton;
- a Better Auth endpoint, client, provider, and minimal auth routes;
- verified email/password authentication through Resend and React Email, with
  existing-account email OTP and magic-link sign-in, and
  optional Google and Apple sign-in;
- Better Auth organizations and teams behind Gatherory's workspace language;
- automatic personal-workspace and Planning-team provisioning;
- an account-level workspace directory with additional workspace creation and
  URL-based workspace switching;
- PostgreSQL through Drizzle ORM, with versioned auth and event migrations;
- session middleware for authenticated server functions;
- Gatherory's event-scoped permission vocabulary;
- main/child event, participant, and event-invitation persistence;
- authenticated native workspace snapshot sync with idempotent mutation
  receipts and cursor-based change delivery;
- transactional projection of accepted native mutations into normalized
  workspace, person, event, idea, cost, registry, note, and media-placement
  tables;
- a read-only iOS companion dashboard backed by the normalized product tables,
  without sending image bytes or the complete native archive to the browser;
- reusable event-media metadata with private Cloudflare R2 signed uploads;
- the sidebar-07 protected application shell;
- reusable `EntityTablePage`, `EntityPicker`, and `MultiEntityPicker`
  components; and
- architecture and page conventions in the [documentation index](docs/README.md).

Media storage behavior, authorization, and R2 configuration are documented in
[`docs/architecture/media-system.md`](docs/architecture/media-system.md).

## Image safety and moderation

`/admin/reports` is a platform-only abuse review queue. Event hosts and
organization owners do **not** automatically have access. An account must be
verified and have a non-revoked row in `moderation_staff`. No account is seeded,
auto-granted, or allowed to grant itself this permission. Provision moderator
membership explicitly after confirming the operator's signed-in account; the
support mailbox `info@gatherory.com` is not a moderator identity by default.

After applying the migrations and registering/verifying the operator's account,
grant local permission explicitly with:

```sh
pnpm moderation:grant --email verified-account@example.com
```

This command refuses remote databases and missing/unverified accounts. It never
creates an account or grants organization/event roles.

The additive moderation migrations must be applied before enabling this flow.
Reports follow `open → in_review → resolved/dismissed` (direct resolution is
also supported). Each decision requires a note, checks the expected status,
and appends an audit row atomically with its image-visibility change. Evidence
previews are opt-in because images may be sensitive. The queue shows the oldest
100 reports in each status; review active reports to advance the queue.

`POST /api/moderation/hide` hides an accessible image for the signed-in user.
`POST /api/moderation/reports` hides it personally and submits an idempotent
report. `GET /api/moderation/hide` returns personal and accessible moderated
image IDs so iOS can suppress cached artwork. Normal uploads require no host
approval. Moderator hiding is independent of upload state and stops new image
URLs, including guest projections; previously issued R2 read URLs may remain
valid for up to five minutes. It does not delete the R2 object.

`GET/POST/DELETE /api/moderation/blocks` manages personal user blocks. Blocks
hide that author's content and prevent new invitations in either direction;
they do not remove shared membership. Unblock is available in iOS Account.
Offline blocks hide locally immediately and retry when the app refreshes.

Support and abuse reports can also reach `info@gatherory.com`; privacy/legal
inquiries use `legal@gatherory.com`. A staffed response process and a
content-filtering strategy still need release verification. This report
queue alone is **not** a claim of App Store moderation compliance.

Tests are grouped by purpose under `tests/`: fast logic in `unit/`, portable
schema and boundary checks in `contracts/`, Effect-backed checks in `effect/`,
external database/HTTP/R2 checks in `integration/`, and script-environment
checks in `tooling/`. Vitest discovers all groups recursively.

Verification without a web build:

```sh
pnpm typecheck
pnpm test
pnpm exec dotenv run -f .env.local -- sh -c 'RUN_MODERATION_DB_TESTS=1 RUN_EVENT_LIFECYCLE_DB_TESTS=1 vitest run tests/effect/moderation.database.test.ts tests/effect/event-lifecycle.database.test.ts tests/integration/event-departure-materialization.database.test.ts'
```

The database test accepts localhost only and rolls back fixture data, moderator
grants, and any temporary moderation DDL. It does not reset the database, write
to R2, or apply production migrations.

## Event lifecycle and native release checks

Cancellation keeps event records but closes new invitations and attendance
responses. Cancelling a parent closes its children too; cancelling a child
does not close other events. Archive is separate, reversible history—not a
cancellation. The iOS event-detail menu owns these controls, not the Home cards.

`DELETE /api/events/invitations` with `{ "eventId": "<uuid>" } lets an
authenticated guest leave exactly that invitation. It does not change other
event access, organization membership, or the shared event. The departure
marker prevents old planning snapshots from restoring the guest, and a fresh,
valid invitation acceptance explicitly clears it. Previously issued media
URLs can remain valid until their five-minute expiry.

iOS provides native Add to Calendar as a one-time copy, not two-way sync.
Sync status, media-transfer status, and manual retry stay in Account. Event and
idea editors and invitation content do not duplicate sync indicators or copy.

Remaining release audit items are tracked in
[`docs/release/v1-release-safeguards.md`](docs/release/v1-release-safeguards.md).

The first release is scoped to user-created event workspaces, events, and the
people invited to plan or attend them. Professional workspaces, published
templates, discovery, and marketplace capabilities are planned later. Their
ownership boundary is documented now, but the core release does not depend on
their UI or tables. The development seed creates a representative event
workspace so the database and protected UI exercise the same product model.

## Local setup

Use Node.js 24.x (`.nvmrc` and the project Volta pin) and pnpm 12.9.1. Blueprint
scheduling uses an explicit server-only Temporal polyfill; native Temporal and
experimental Node flags are not required. CI and production must also use Node 24.
Vercel builds with `pnpm build`; Nitro detects Vercel and generates
`.vercel/output` with Node 24 functions. Leave the output-directory override
unset and use the TanStack Start framework preset. Local builds retain the Node
server output used by `pnpm start`. Keep existing Neon and other service
configuration in the deployment environment.

Authentication callbacks and email delivery use the shared `runInBackground`
adapter backed by Vercel `waitUntil` so work survives the response. Local
development observes the same promises without a Vercel request context.
`vercel.json` restores the Apple association JSON header. The internal
notification dispatch endpoint retains its 60-second function limit, but no
cron schedule is configured: notification delivery remains best effort after
the canonical operation commits.

Install and start locally:

```bash
pnpm install
pnpm dev
```

For a physical iPhone on the same trusted network, expose the development
server with `pnpm dev:device` and point the app's
`-AuthenticationBaseURL` launch argument at the Mac's LAN address. Do not expose
the development server directly to the public internet.

Copy `.env.example` to `.env.local`, then configure PostgreSQL and Better Auth:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gatherory
DATABASE_POOL_MAX=5
BETTER_AUTH_SECRET=replace-with-a-generated-secret
BETTER_AUTH_URL=http://localhost:3003
RESEND_API_KEY=re_replace_me
EMAIL_FROM="Gatherory <hello@your-verified-domain.com>"
```

Generate a secret with `pnpm auth:secret`. Your local `.env.local`
needs a non-empty `BETTER_AUTH_SECRET` and a real `DATABASE_URL` before sign-in
or registration can persist accounts. Email registration and password reset
also require a Resend API key and a sender on a verified Resend domain.

## Useful commands

```bash
pnpm generate-routes
pnpm typecheck
pnpm auth:check
pnpm db:generate
pnpm db:migrate
pnpm db:materialize-native:local
pnpm db:seed
pnpm db:studio
pnpm email:dev
pnpm dev
```

Run route generation after adding, moving, or renaming a route. Run a production
build only when the task calls for one; routine changes should use the lighter
route-generation and typecheck workflow.

`db:generate` creates versioned SQL from the checked-in schemas. `db:migrate`
applies unapplied migrations to `DATABASE_URL`. Use `db:push` only for temporary
local prototyping; committed environments should use migrations.

## Native iOS synchronization

The iOS app uses the same Better Auth bearer session as authentication and
calls three JSON endpoints:

- `GET /api/sync/bootstrap` returns the current non-deleted workspace snapshots
  the account can access;
- `POST /api/sync/push` applies up to 50 idempotent workspace mutations; and
- `GET /api/sync/pull?scopeID=<uuid>&after=<cursor>` returns the ordered change
  log for one authorized workspace.

The server stores a compatibility JSON snapshot per native workspace plus
independently versioned events, ideas, participants, expenses, registry items,
notes, and moments. Mutation receipts provide idempotency and the cursor log
feeds foreground and pull-to-refresh updates. Every accepted mutation is also
projected into normalized product rows in that same database transaction; a
projection failure rolls back the sync write. A normalized sync-scope membership table grants
owner, editor, or viewer access. Only main-event planning roles may be projected
into workspace-wide sync access; guest and child-event access remains scoped to
normalized event APIs. Image bytes remain a separate S3
media-transfer concern and should not be added to this JSON API.

The authenticated `/workspaces` route decodes only summary fields on the server
and renders a read-only companion overview. It deliberately does not expose
creation, editing, invitations, decisions, or budget allocation for the first
iOS release. The normalized event routes remain an architectural foundation,
but are not presented as product parity with the native app.

Pushes to `main` run the **Production database migration** GitHub workflow. Add
`PRODUCTION_DATABASE_URL` to the repository's `production` GitHub environment;
the workflow installs the locked dependencies, runs `pnpm db:migrate`, and
idempotently replays existing native records with `pnpm db:materialize-native`. A
failed connection or migration makes the check fail, so it can be used as a
required release signal. Migrations are serialized and are never cancelled
mid-run. The application server still deploys independently unless this check is
also required by the repository's branch or deployment rules.

For a completely fresh local database, run:

```bash
pnpm db:reset
```

This command only accepts a loopback PostgreSQL host. It removes the application
schema and Drizzle migration history, recreates the schema, and applies every
committed migration. It intentionally leaves the migrated database empty; run
`pnpm db:seed` afterward when you also want the development fixtures.

To manually perform the same full wipe against a Neon database, pass its URL
through the dedicated variable and include the exact confirmation phrase:

```bash
NEON_DATABASE_URL='postgresql://...' \
CONFIRM_NEON_RESET=RESET_GATHERORY_NEON \
pnpm db:reset:neon
```

`db:reset:neon` drops both the `public` and `drizzle` schemas, including Better
Auth accounts, workspace data, sync records, and migration history. It then
reapplies every committed migration and leaves the database empty. The command
does not read `DATABASE_URL`, accepts only a `*.neon.tech` PostgreSQL host, and
refuses to run without the confirmation phrase. Keep the connection string in
your shell or secret manager; do not commit it.

`db:seed` is destructive and development-only. It first resets every Gatherory
table represented by the checked-in Drizzle schema, then creates five accounts
through Better Auth so their credential records and password hashes use the
same path as normal registration. Never point `DATABASE_URL` at data you need
to preserve when running this command:

```text
Alex (host):        planner@gatherory.test
Jordan (host):      jordan@gatherory.test
Maya (collaborator): coordinator@gatherory.test
Sam (guest):        guest@gatherory.test
App Review (host):  appreview@gatherory.test
Password for all:   password
```

The App Review fixture has full organizer access to the representative wedding
workspace. It deliberately skips the first-workspace setup so seeded data is
immediately available; its contextual iOS primers remain unseen on a clean app
install. This is only a local fixture—submit separate production credentials in
App Store Connect.

The fresh scenario includes one personal workspace, its Planning team, Alex and
Jordan's wedding, six dated child events across both purpose classifications,
four participant assignments, attendance states, and one pending guest
invitation. Every run removes existing application records before recreating
this deterministic development state. Drizzle's migration history is not part
of the application schema reset.

Do not use `npx auth migrate` for this project. Better Auth's `migrate` command
supports its built-in Kysely adapters; Gatherory uses the Drizzle adapter, so
Better Auth generates/checks the auth schema and Drizzle Kit applies its SQL:

```bash
pnpm auth:check
pnpm db:migrate
```

## Auth routes

- `/auth/sign-in` — minimal Gatherory sign-in surface.
- `/auth/email-otp` — passwordless sign-in with a six-digit email code.
- `/auth/magic-link` — passwordless sign-in with a single-use email link.
- `/auth/magic-link-sent` — magic-link delivery confirmation.
- `/auth/sign-up` — email/password account creation surface.
- `/auth/verify-email` — verification instructions and resend controls.
- `/auth/forgot-password` — requests a password-reset link without revealing
  whether the account exists.
- `/auth/reset-password` — chooses a new password from a valid reset link.
- `/login` — compatibility redirect to `/auth/sign-in`.
- `/api/auth/$` — Better Auth request handler.

Authenticated product routes live beneath the pathless `_protected` layout.
Its server-backed `beforeLoad` guard redirects signed-out requests before child
content renders. Signed-in users who revisit sign-in or sign-up are returned to
the authenticated home route.

`/workspaces` is the account-level directory for every accessible workspace.
`/workspaces/:workspaceSlug` is the canonical selected-workspace URL, and `/`
redirects to the active or default workspace. The top-left switcher links to
the directory and changes workspace URLs, reloading workspace-scoped event data
and sidebar content. Its choices include Better Auth member workspaces plus
workspaces shared through an explicit event-participant assignment; the slug
itself never bypasses server-side access checks.

The root provider configures system light/dark mode, Better Auth UI navigation,
and global toast feedback. Email/password accounts must verify their address;
verification and password-reset links expire after one hour, and a successful
password reset revokes existing sessions. Resend delivers account lifecycle and
passwordless sign-in emails from the React Email templates in `src/emails`;
`pnpm email:dev` previews them locally on port 3004. OTPs expire after 10 minutes
with three attempts, while magic links expire after 10 minutes and are
single-use. Both methods sign in existing users only, preserving the named
account-creation flow. Google and Apple are the only configured social-provider
options and
become operational when their credential pairs are supplied in `.env.local`.
A social button is rendered only when both credentials for that provider are
present, preventing a configured UI from pointing at an unavailable provider.
The protected sidebar exposes workspace context using Better Auth organizations
and teams. Billing and the professional-workspace product are not enabled.

In development, open TanStack Devtools and choose **Accounts** to switch through
Better Auth's normal email sign-in flow. All four scenario accounts are supplied
as initial rows so host, collaborator, and guest access can be exercised. Saved
rows are kept in local browser storage as plain-text development credentials;
the plugin is dynamically excluded from production.

Better Auth owns the identity, organization, team, membership, and
organization-invitation tables in `src/db/schema/auth.schema.ts`. Gatherory owns
`event`, `event_participant`, and `event_invitation`. Organization membership
must not replace event participation: guests and attendance remain scoped to an
event.

Account deletion is enabled through Better Auth and is available from the web
account page and iOS Account settings. A user must have a fresh authenticated
session, which means an older session is asked to sign in again before the
irreversible operation. Sole-owner workspaces are removed. Collaborative
workspaces stay available by transferring ownership to the oldest remaining
member; the deleted person's participation, decisions, registry commitments,
and uploaded media are removed, while historical author fields are cleared.

## Architecture

Start here before adding product behavior:

- [Product model](docs/architecture/product-model.md)
- [Data model](docs/architecture/data-model.md)
- [Cross-platform experience architecture](docs/architecture/experience-blueprints.md)
- [Server architecture](docs/architecture/server-architecture.md)
- [Page creation standard](docs/development/page-creation.md)
- [Roadmap guide](docs/development/roadmap-guide.md)

The server boundary is event-scoped. A signed-in person can be a host,
collaborator, or guest on different events, so identity middleware and event
authorization remain separate concerns. Routes and components call typed server
functions; they do not import Drizzle, repositories, or provider SDKs.

Cross-platform contract sources live in `src/contracts`; generated JSON Schema
documents and portable examples live in `contracts`. Run
`pnpm contracts:generate` after changing a source schema. `pnpm test` checks
that generated documents are current before running the contract and server
test suites.

## Adding shadcn components

The project uses the `@/` source alias:

```bash
pnpm dlx shadcn@latest add button
```

Keep generated components aligned with the installed Base UI composition API,
which uses `render` rather than the older Radix `asChild` prop.
