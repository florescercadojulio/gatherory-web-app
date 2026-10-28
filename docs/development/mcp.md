# Gatherory MCP

Gatherory exposes event planning through the Model Context Protocol (MCP) at
`POST /mcp`. The endpoint uses the current MCP protocol profile
`2026-07-28`, `@modelcontextprotocol/server` 2.4.0, and Better Auth 1.7.13.
It also serves 2025-era Streamable HTTP clients through the SDK's stateless
compatibility mode, including Codex CLI's `2025-06-18` handshake. This
implementation uses Better Auth's MCP and CIMD plugins; it does not use the older standalone MCP OAuth plugin.

## Enablement and rollout

`MCP_ENABLED` defaults to `false`. Keep it off until the additive Drizzle
migration [`20261025150000_mcp_oauth_provider`](../../drizzle/20261025150000_mcp_oauth_provider/migration.sql)
has been applied to the target database. Apply the migration and deploy with
MCP enabled as separately controlled rollout steps. Do not enable the feature
before the OAuth tables exist. No deployment is implied by this local code.

The migration creates eight new tables: Better Auth JWT signing keys in
`jwks`, plus seven OAuth tables: `oauth_client`, `oauth_resource`,
`oauth_client_resource`, `oauth_access_token`, `oauth_refresh_token`,
`oauth_consent`, and `oauth_client_assertion`. The schema is the authority; see
[`mcp-oauth.schema.ts`](../../src/db/schema/mcp-oauth.schema.ts). The sync
mutation receipt gains nullable `mcp_fingerprint` for binding write retries to
their arguments. Account deletion cascades through user-owned clients, grants,
and tokens; tokens detach from deleted sessions with `ON DELETE SET NULL`.

## OAuth and client setup

The OAuth resource identifier is the canonical app origin plus `/mcp`. Better
Auth serves authorization server and protected resource discovery metadata. MCP
clients use OAuth authorization-code flow with PKCE and user consent. Access
tokens are signed JWTs with a five-minute lifetime; refresh tokens last 30 days.
The MCP resource accepts `gatherory:read` and `gatherory:write`; `offline_access`
is an optional authorization scope for refresh access. Better Auth 1.7.13 also
requires `offline_access` in the configured resource's `allowedScopes` when
issuing and refreshing that scope; the plugin intentionally omits it from the
protected-resource metadata's capability list. Existing `oauth_resource` rows
are seeded insert-only, so upgrading an already-enabled dev instance requires
updating that exact resource row as well as the configuration, then
reauthorizing clients whose old refresh grant omitted the scope. New CIMD clients default
to read scope and may request write and offline access.

Client identification uses Client ID Metadata Documents (CIMD), fetched through
Better Auth's Node CIMD implementation. Dynamic Client Registration (DCR) and
client-credentials grants are not supported. Clients that cannot use current
CIMD must be provisioned as public clients through a trusted server-side
administrative procedure, with PKCE enabled; there is no admin API or UI for
this. 2025-era clients may use the SDK's stateless compatibility transport; standalone
SSE/sessionful legacy connections are not exposed. OAuth registration still
requires CIMD or trusted pre-provisioning; compatibility does not add DCR.

After rollout, configure a compatible client with the remote server URL
`https://app.gatherory.com/mcp`. Modern clients bootstrap with `server/discover`; 2025-era clients use
`initialize`, followed by `notifications/initialized` and tool discovery. Both
paths use the same account, scope, permission, and retry checks.
The explicit `/mcp/connect` entry reuses the app's existing sign-in form and
auth components. Current web source also reopens ordinary browser login and
planning by removing the former blanket TestFlight redirect. Production
availability of that source change has not been confirmed. After
authentication, the browser opens `/mcp/consent`, then returns to the client's
registered callback after approval or denial. Consent remains a separate,
explicit OAuth step; signing in alone does not grant MCP access. MCP itself is
separately controlled by `MCP_ENABLED` and is not enabled in production by this
source change. Never paste a native session token into an AI client as a
substitute for this flow.

Users can review and revoke OAuth grants at `/mcp/connections`. Revocation is
checked against current consent on each request, alongside the current session,
client status, token signature, expiry, audience, and required scope. The
connection and consent UI is excluded from PostHog recording.
See [shared login entry acceptance](mcp-production-readiness.md#shared-login-entry-acceptance--october-25-2026)
for the development password-retry result, beta-gate checks, and remaining
explicit-consent UI check.

UI follow-up reference: the official Better Auth UI docs describe the
[Sign In component](https://better-auth-ui.com/docs/shadcn/components/auth/sign-in)
and [Settings component](https://better-auth-ui.com/docs/shadcn/components/settings/settings).
MCP sign-in currently reuses Gatherory's shared login form; this task does not
install separately purchased UI blocks or authorize a broader auth/settings
redesign.

Google and Apple callbacks retain the signed MCP request. After signing in,
**Continue as** shows the authenticated account and opens consent with that same
signed request; the server enforces fresh sign-in when `prompt=login` requires
it. Provider errors retain retry context without automatically resuming. The
connections page's profile menu offers **Log out**, which ends the browser session;
**Revoke access** separately removes the selected grant and its refresh family.

### Browser settings and access level

The in-development browser settings surface is reached from the profile menu as
**AI connections**. It is intentionally outside the primary planning sidebar;
Blueprints and Account are also omitted from that sidebar while the browser app
is being kept focused on event planning. This navigation cleanup does not remove
the underlying routes or server authorization checks.

Browser planning is primarily read-only. On the AI connections page, a user can
reduce a connected client's grant to `gatherory:read`. This operation is
account- and client-scoped, same-origin protected, and serialized with a row
lock. The server retains the read grant and narrows that client's refresh token
scopes. Previously issued access tokens that include write fail the current
consent-scope check; read-only access remains available. An unrecognized,
unrelated, or non-MCP grant cannot be changed by this action.
Restoring `gatherory:write` requires starting a new OAuth authorization and
explicitly approving the requested scope on the consent page; the settings
endpoint does not accept scope expansion. **Revoke access** removes the grant
and refresh family entirely. These settings changes apply to MCP only and do
not change browser event permissions.

This settings/navigation work is development-only. Keep `MCP_ENABLED=false` in
production and do not push or deploy it unless the product owner explicitly
requests a production rollout. The [dated development rollout record](mcp-dev-rollout.md)
records the completed implementation checks, browser acceptance, and remaining
acceptance limits.

Gatherory adds request-scoped refresh checks to Better Auth 1.7.13: the current
session, verified account, enabled client, consent, scope and resource must
remain valid before token rotation or replay. A post-refresh check handles
concurrent revocation. Existing signed access tokens lose MCP access immediately
when consent disappears. Only user-level consent authorizes MCP JWTs; reference
grants are outside the current JWT contract. See the
[production readiness record](mcp-production-readiness.md) for the fixes, real
refresh/revocation acceptance, live provider status, and rollout order.

## Available tools

All tools operate as the authenticated account and recheck the relevant event
permissions. Read calls require `gatherory:read`; writes require both read and
write scopes.

There are 17 tools:

| Tool                 | Access | Behavior                                                                      |
| -------------------- | ------ | ----------------------------------------------------------------------------- |
| `search_blueprints`  | Read   | Search published Blueprints.                                                  |
| `list_events`        | Read   | List accessible planning scopes, including independently shared child events. |
| `get_event`          | Read   | Read one accessible event.                                                    |
| `create_event`       | Write  | Create a main event.                                                          |
| `update_event`       | Write  | Update a manageable main event.                                               |
| `list_child_events`  | Read   | List scheduled children of an accessible main event.                          |
| `create_child_event` | Write  | Schedule a child under a manageable main event.                               |
| `update_child_event` | Write  | Update a scheduled child under its accessible main event.                     |
| `list_ideas`         | Read   | List an event's ideas.                                                        |
| `create_idea`        | Write  | Add an idea to an event the account can plan.                                 |
| `update_idea`        | Write  | Update an idea in an event the account can plan.                              |
| `list_notes`         | Read   | List notes for the requested event.                                           |
| `create_note`        | Write  | Add a planning note visible to people with access to that event.              |
| `update_note`        | Write  | Edit a note authored by the authenticated account.                            |
| `list_tasks`         | Read   | List tasks for an event the account can plan or view as a collaborator.       |
| `create_task`        | Write  | Add an unassigned task.                                                       |
| `update_task`        | Write  | Edit a task's title, due date, URL, or completion state.                      |

Idea categories are `event`, `registry`, `link`, `venue`, `attire`, `flowers`,
`food`, `photography`, `music`, `decor`, `invitations`, `honeymoon`, and
`other`.

Writes require an `idempotencyKey` and bind it to the authenticated user, tool,
and arguments. Retry the same operation with the same key and identical
arguments. Reusing a key with different arguments is rejected. Updates also
require `expectedVersion`; stale versions conflict instead of overwriting newer
data. `update_event` handles main events; `update_child_event` handles scheduled
children. Closed events reject planning writes, including retries of previously
successful writes after access or lifecycle changes.

Scheduled children use the existing native event entity and canonical parent
relationship. Supply a confirmed timestamp with `Z` or an explicit offset, plus
an IANA time zone. Child instants accept up to millisecond precision; an explicit
non-`Z` offset must agree with the zone's rules on that date. Invalid calendar
instants, unknown offsets, and excess precision are rejected. Text limits count
Unicode code points, matching the shared contract convention. The creating account becomes the child's host; other parent
attendees are not copied or invited. Only one child level is supported. The
child tools require access to the main event, so an independently shared
child-only scope cannot use those tools. Notes and tasks support both children
of an accessible root and independently shared child scopes.

Notes retain the existing 750-character limit; longer source documents must be
split into labeled excerpts. Notes are private Planning history: hosts and
collaborators, including view-only collaborators, can read them; guests cannot
read them even when they can read the event. Sending notes requires the existing
note permission, and only the author may update a note. Tasks support
calendar-only due dates (`YYYY-MM-DD`), optional HTTP(S) URLs and completion.
Explicit `null` clears a task's due date or URL. Assignment is not writable:
creation leaves it empty and updates preserve any existing assignee. Task access
is available to collaborators according to their planning permission; guests
cannot read or write tasks. Neither tool sends an announcement or schedules a
reminder.

Permission and lifecycle checks run again inside the native sync write
transaction before replaying a receipt or applying a change. Read results mark
independent child scopes with `isScopedEvent` without revealing hidden parent IDs.

MCP does not expose invitation management, event or account deletion, media,
Decide responses, or decisions. MCP tool availability and browser planning are
separate product surfaces: web browser access follows the web release policy,
while MCP OAuth access remains separately gated by `MCP_ENABLED`.

## Importing a structured plan

1. Read the source as content. Distinguish selected sessions from alternatives,
   optional items, preparation notes, and proposed follow-ups. Preserve unknown
   details as unknown; do not invent registrations, people, or commitments.
2. Create the main event with the supplied confirmed dates and time zone.
3. Create selected timed sessions with `create_child_event` and
   `purpose: "eventExperience"`. Keep conflicting or unscheduled alternatives as
   ideas. Store source attribution and session links in descriptions or notes.
4. Create labeled notes for goals, questions, and source excerpts. Keep each
   note within 750 code points. Create tasks with civil due dates and no
   invented assignee. Child notes/tasks use the child's `eventId`.
5. Read back and paginate each list using its returned cursor (maximum page
   size 50). Check parent relationships, times, optional labels, counts, and
   source retention before reporting completion.

Choose a stable key for every operation and retain successful IDs/versions.
After interruption, repeat the same inputs and keys; after a version conflict,
read the current entity before choosing a new update. There is no single
all-or-nothing import transaction. The conference regression intentionally
resumes after eight children have committed and verifies no duplicate content.
Creating this structure does not register sessions, contact people, or perform
the follow-up tasks.

## Local verification

Run the ordinary checks from the web-app root:

```sh
pnpm exec vitest run \
  tests/unit/mcp-auth-config.test.ts \
  tests/unit/mcp-authorization.test.ts \
  tests/unit/mcp-oauth-schema.test.ts \
  tests/contracts/mcp-http.test.ts \
  tests/contracts/mcp-token-verification.test.ts \
  tests/integration/mcp-oauth.test.ts
pnpm typecheck
pnpm test
```

The OAuth integration test uses Better Auth's in-memory adapter. The content
database test is opt-in and refuses non-loopback database hosts. Run it only
with an isolated disposable local database whose schema includes the MCP
migration. Set `DATABASE_URL` explicitly so dotenv's non-overriding load cannot
replace the target:

```sh
DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:PORT/DISPOSABLE_DB' \
RUN_MCP_DB_TESTS=1 \
pnpm exec vitest run \
  tests/integration/mcp-content.database.test.ts \
  tests/integration/mcp-oauth-cascade.database.test.ts \
  tests/integration/mcp-conference.database.test.ts \
  tests/integration/mcp-planning-boundaries.database.test.ts
```

Record the actual browser and database acceptance results with the rollout
record; a passing unit or contract suite does not establish deployed behavior.
The dated foundation evaluation below predates the later production-readiness
verification. See [production readiness](mcp-production-readiness.md#earlier-foundation-verification)
for the foundation-phase aggregate and opt-in MCP integration results; these
precede the shared-login changes and still skip the separate development
bootstrap acceptance case. The current shared-login test result is recorded in
the [acceptance section](mcp-production-readiness.md#shared-login-entry-acceptance--october-25-2026).

The live HTTP integration additionally requires `RUN_MCP_HTTP_TESTS=1` and an
explicit loopback `MCP_HTTP_BASE_URL` pointing at a running app configured with
`MCP_ENABLED=true` and the same disposable database. It seeds and removes its
own verified synthetic account and public OAuth client; it sends no email and
does not use a real Google/Apple account.

```sh
RUN_MCP_DB_TESTS=1 RUN_MCP_HTTP_TESTS=1 \
MCP_HTTP_BASE_URL='http://127.0.0.1:43123' \
pnpm exec vitest run mcp
```

Supply the isolated app configuration explicitly, prevent reads of real
workspace environment files, and restrict test networking to loopback. An
explicit database URL alone does not isolate optional email, storage, analytics,
or notification credentials loaded by application configuration.

## Foundation and planning-extension evaluation — October 25, 2026

The scheduled-event, note, and task extension was tested against a disposable
PostgreSQL 18 database and an isolated HTTP app. Workspace environment reads
and non-loopback test networking were blocked; all credentials and accounts
were synthetic. No additional migration is required by these new tools beyond
the MCP foundation migration described above.

| Check                  | Result                                                                                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP regression suite   | 17 files / 66 tests passed, including conference import, planning permissions, database retries, OAuth, and live HTTP. `/tmp/gatherory-mcp2-all-final.log`.                                                                                                                                     |
| Native compatibility   | 4/4 iOS simulator tests passed using actual app models and the exported conference payload. `/tmp/gatherory-mcp2-native-final.xcresult`.                                                                                                                                                        |
| Types                  | `pnpm typecheck` passed. `/tmp/gatherory-mcp2-types-verified.log`.                                                                                                                                                                                                                              |
| Full repository checks | Schema freshness passed. `pnpm test`: 906 passed, 65 skipped, one failure in the existing Android Apple sign-in architecture guard (`drizzle-orm` imported by a handler). `/tmp/gatherory-mcp2-full-tests-final.log`. This is not an all-green result.                                          |
| Production build       | Passed using isolated synthetic configuration. Existing Base UI module-directive advisories remain nonfatal. `/tmp/gatherory-mcp2-build-final.log`.                                                                                                                                             |
| Database rollout       | Complete migration chain applied to a fresh disposable PostgreSQL 18 database. `/tmp/gatherory-mcp2-migration-final.log`.                                                                                                                                                                       |
| HTTP composition       | OAuth PKCE → JWT/JWKS → current session/consent → `server/discover` → all 17 tool bindings. Child, note, and task create/list/update calls passed, alongside the original event/idea/search calls; revoked consent caused the next request to return 401. `/tmp/gatherory-mcp2-http-final.log`. |
| Conference import      | One main event, 17 scheduled children, six unscheduled options, 30 notes, and five tasks passed persistence and read-back checks, including a simulated interrupted import. See [conference evaluation](mcp-conference-evaluation.md).                                                          |

Coverage includes optimistic conflicts, identical and changed-argument retries,
current permissions and closure before receipt replay, event/sibling isolation,
author-only note editing, task guest denial, non-writable assignment, nullable
fields, calendar-only due dates, Unicode code-point limits through database persistence, offset/zone agreement, native-required payload fields, and independent
child scopes for notes/tasks. The original foundation checks also cover token
signature/issuer/audience/expiry, scopes, account isolation, OAuth state/PKCE,
refresh/revocation, request limits, and OAuth account cleanup.

Disposable servers and databases were removed after the final verification.

The prior foundation browser evaluation exercised password typing/sign-in,
consent denial/approval, connection listing and revocation against an isolated
app. That browser check was not repeated for this server-only extension.

Not established: a deployed third-party AI client connection, real-domain CIMD
fetching, real Google/Apple callbacks, or receipt/display of this imported plan
on physical iOS/Android devices. The conference plan's catalog details were
preserved as supplied rather than researched afresh. The feature remains
disabled by default; no production database, deployment, client registration,
conference registration, invitation, or notification was changed.

References: [Better Auth MCP](https://better-auth.com/docs/plugins/mcp),
[OAuth provider](https://better-auth.com/docs/plugins/oauth-provider), and
[MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/).

## Development rollout

See [the real-client dev rollout record](mcp-dev-rollout.md) for the actual
Codex import, iOS receipt, fixes, and final verification results. The earlier
table above records the separate synthetic fixture stage.

The default stays disabled for unconfigured environments. The authorized local
dev instance uses `https://dev.gatherory.com/mcp`, the local `gatherory` database
on port 5438, and `MCP_ENABLED=true` only in ignored `.env.local`. Its MCP
migration was applied after a local backup, then the exact dev resource row's
scope allowlist was aligned with the auth configuration. Production environment
variables and the Neon database were not modified.

TLS terminates at the existing development reverse proxy. MCP requires both the
request URL host and the Host header to match the canonical resource. An
internal HTTP request is accepted for the HTTPS resource only when the Host
matches and `X-Forwarded-Proto` is exactly `https`. `X-Forwarded-Host` cannot
select the resource or bypass validation; arbitrary Origin headers are still
rejected. The real client exposed the original scheme-only mismatch; contract
tests cover valid TLS termination and conflicting/spoofed hosts.

The compatibility implementation follows the SDK's
[legacy client guidance](https://ts.sdk.modelcontextprotocol.io/v2/serving/legacy-clients.html).
It creates a fresh server for each request and shares no identity-scoped state
between exchanges. This changes the previous modern-only transport decision;
it does not bypass authentication or enable browser planning.
