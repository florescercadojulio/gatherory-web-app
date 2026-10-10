# Gatherory Web App

Gatherory is the authenticated planning product for creating an event, shaping
ideas, coordinating its timeline, inviting people, and managing event-scoped
registry items. This TanStack Start project is intended for `app.example.com`.
The public marketing site remains a separate Astro project at the root domain.

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
- reusable event-media metadata with private Cloudflare R2 signed uploads;
- the sidebar-07 protected application shell;
- reusable `EntityTablePage`, `EntityPicker`, and `MultiEntityPicker`
  components; and
- architecture and page conventions in [`docs/`](./docs/).

Media storage behavior, authorization, and R2 configuration are documented in
[`docs/media-system.md`](./docs/media-system.md).

The first release is scoped to user-created event workspaces, events, and the
people invited to plan or attend them. Professional workspaces, published
templates, discovery, and marketplace capabilities are planned later. Their
ownership boundary is documented now, but the core release does not depend on
their UI or tables. The development seed creates a representative event
workspace so the database and protected UI exercise the same product model.

## Local setup

Use pnpm for this repository:

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local`, then configure PostgreSQL and Better Auth:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gatherory
DATABASE_POOL_MAX=5
BETTER_AUTH_SECRET=replace-with-a-generated-secret
BETTER_AUTH_URL=http://localhost:3003
RESEND_API_KEY=re_replace_me
EMAIL_FROM="Gatherory <hello@your-verified-domain.com>"
```

Generate a secret with `pnpm auth:secret`. The current local `.env.local` still
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

Pushes to `main` run the **Production database migration** GitHub workflow. Add
`PRODUCTION_DATABASE_URL` to the repository's `production` GitHub environment;
the workflow installs the locked dependencies and runs `pnpm db:migrate`. A
failed connection or migration makes the check fail, so it can be used as a
required release signal. Migrations are serialized and are never cancelled
mid-run. Vercel still deploys independently unless this check is also required
by the repository's branch or deployment rules.

`db:seed` is idempotent, non-destructive, and development-only. It creates four
accounts through Better Auth, ensuring their credential records and password
hashes use the same path as normal registration:

```text
Alex (host):        planner@gatherory.test
Jordan (host):      jordan@gatherory.test
Maya (collaborator): coordinator@gatherory.test
Sam (guest):        guest@gatherory.test
Password for all:   password
```

The scenario includes one personal workspace, its Planning team, Alex and
Jordan's wedding, six dated child events across both purpose classifications,
four participant assignments, attendance states, and one pending guest
invitation. Rerunning the seed updates only these deterministic development
records and does not duplicate them.

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

- [Product model](./docs/product-model.md)
- [Data model](./docs/data-model.md)
- [Server architecture](./docs/server.architecture.md)
- [Page creation standard](./docs/page-creation.md)
- [Roadmap guide](./docs/roadmap-guide.md)

The server boundary is event-scoped. A signed-in person can be a host,
collaborator, or guest on different events, so identity middleware and event
authorization remain separate concerns. Routes and components call typed server
functions; they do not import Drizzle, repositories, or provider SDKs.

## Adding shadcn components

The project uses the `@/` source alias:

```bash
pnpm dlx shadcn@latest add button
```

Keep generated components aligned with the installed Base UI composition API,
which uses `render` rather than the older Radix `asChild` prop.
