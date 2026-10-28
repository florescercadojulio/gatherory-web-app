# MCP production readiness

Last reviewed: October 25, 2026. This is implementation and development
acceptance evidence, not a production deployment record. Production MCP remains
disabled. See [the MCP guide](mcp.md) for the tool and permission contract and
[the development rollout record](mcp-dev-rollout.md) for the earlier conference
import and App Review tool evaluation.

## Problems fixed

### Google and Apple callback recovery

Social success and cancellation callbacks retain the original Better Auth signed
OAuth parameters, including client, state, resource, and PKCE challenge. Unsigned
tracking and arbitrary redirect fields are excluded. A successful provider login
returns to the connection page with an explicit **Continue as** action; the
authenticated account is visible before proceeding to MCP consent. Provider
errors cannot automatically resume authorization. **Sign out** on the connections
page ends the current browser session without deleting grants; **Revoke access**
remains a separate action.

Synthetic integration tests execute the installed Better Auth Google and Apple
handlers, including Apple's form POST callback, consent, and PKCE token exchange.
Provider token/user responses are substituted: these tests do not prove real
provider credentials, domain registration, account linking, or live provider UI.
They cover cancellation/retry, missing/wrong/replayed provider state, tampered
signed requests, consent denial, incorrect PKCE, and authorization-code replay.

### Refresh and revocation

Better Auth 1.7.13's consent-delete endpoint removed consent but left refresh
credentials usable at its token endpoint. Gatherory now checks the current
session, verified account, enabled client, exact grant, consented scopes, and
resource before refreshing. A post-refresh consent check handles revocation
racing token issuance. Revocation removes that grant's access/refresh records,
including rotated refresh records, while preserving sibling grants. The token
hash matches the previously configured provider default; no reset or new
migration is required for this fix.

Access JWTs retain their five-minute lifetime. Refresh tokens retain their
30-day lifetime and the provider's 30-second rotated-token retry window. No
production lifetime was shortened to make tests pass. The request-time
authorizer rejects revoked access JWTs immediately, before cryptographic expiry.
Gatherory currently supports user-level MCP consent only; JWT authorization
filters out reference-scoped consent because its JWT contract has no reference
claim.

Regressions exercise rotated-token scopes/audience, expired access and refresh
credentials, expired sessions, disabled clients, cross-client refresh, scope
escalation, unauthorized/failed/cross-account revocation, sibling-grant
isolation, and revocation racing refresh. The live HTTP regression uses the
same authenticated consent-delete API as the UI and checks that original and
refreshed JWTs lose both reads and writes and neither refresh token works.

### Release test gate

The Android Apple handoff handler's existing direct SQL import prevented the
full architecture suite from passing. Its persistence queries now live in a
repository and its Better Auth/environment binding in an adapter. The strict
architecture guard was retained. The handoff database regression additionally
checks that a consumed handoff cannot restore a revoked session. Tests still
run before production migrations in the existing workflow.

## Real App Review acceptance

The first connection's real refresh succeeded and retained `gatherory:read`,
`gatherory:write`, and `offline_access`. Revoking it through the browser removed
its consent and refresh records; its still-signed access token was denied and
refresh returned `invalid_grant`. These checks established the revocation
boundary, but the grant was subsequently renewed during the development
retest. The old “intentionally left revoked” status is superseded.

In the latest connection retest, a fresh `appreview@gatherory.test` grant was
authorized through the browser and the real Codex client completed read-only
calls. The raw trace contains one `list_events` result and one
`search_blueprints` result, each with a pagination cursor. An interim model
summary incorrectly described these results as empty; the raw tool results are
the evidence. The grant is currently active in development. This latest read
check does not repeat expiry/refresh or revocation acceptance for the renewed
grant.

Local evidence includes the earlier refresh/revocation traces
(`/tmp/gatherory-mcp-production-readiness-refresh-trace.jsonl`,
`/tmp/gatherory-mcp-production-readiness-revoked-trace.jsonl`) and the latest
raw Codex trace (`/tmp/gatherory-mcp-appreview-final-connection-trace.jsonl`).
Credentials and tokens are not included in this record.

## Live provider acceptance

Google's real callback reached an authenticated development session and MCP
consent earlier, but no completed real Google-backed Codex token exchange is
verified. Apple live sign-in has not been tested. Synthetic Google and Apple
handler tests do not establish live provider credentials, registrations,
account linking, or client exchange.

## Shared login entry acceptance — October 25, 2026

The MCP connection page now uses Gatherory's existing shared sign-in form.
Against the development app, App Review entered an incorrect password and saw
the visible **Invalid email or password** message. The password field cleared,
while the signed MCP authorization context remained available for retry. After
entering the valid password, the browser reached the client callback with
**Authentication complete**, and `codex mcp login` succeeded. The existing
approved read/offline grant was reused, so this login did not require new
consent.

Historical route check before the October 25 web-access policy reversal: a bare
`/mcp/connect` request without a valid signed authorization request was
rejected instead of showing a login form, and ordinary `/auth/sign-in` and
`/workspaces` requests returned HTTP 307 to TestFlight. The current source has
since removed the blanket redirect; these observations do not describe current
source routing or confirm the behavior on the live production origin.

Separately, with `prompt=consent`, App Review saw a consent page listing read
and offline access. Denial returned to the client callback with
`error=access_denied` and matching state; Codex ended with the expected
`access_denied` before code exchange. The existing approved App Review grant
remains available. Browser evidence: `/tmp/gatherory-mcp-shared-login-consent.png`.

A subsequent real Codex `list_events` call still succeeded after that denial.
Independent assertions over the raw tool response verified one returned event
and a pagination cursor, confirming the earlier approved connection remained
usable. Evidence: `/tmp/gatherory-mcp-shared-login-cli.jsonl` and the sanitized
receipt `/tmp/gatherory-mcp-shared-login-browser-evaluation.json`.

The live bad-password attempt exposed a shared form error-rendering bug: the
form-level server error component was not mounted. Sign-in now renders that
component, with a focused submit/error-state regression in
`tests/unit/shared-sign-in-errors.test.ts` and actual browser verification of
the visible message. The final focused run passed 21 tests across six files.
No production state or planning content was changed, no migration was needed, and no
new package or native change was made. These checks establish the development
login and consent flow only; they do not establish production MCP authentication
or completed live Google/Apple client authentication.

## Current shared-login source verification

| Check                                                                                  | Result                                           | Evidence                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Full repository suite, including generated-contract freshness                          | Passed: 141 files; 922 tests passed, 66 skipped. | `/tmp/gatherory-mcp-shared-login-full.log`          |
| Focused login, signed continuation, provider callback, browser routing and OAuth regressions | Passed: six files, 21 tests.                 | `/tmp/gatherory-mcp-shared-login-focused-final.log` |
| TypeScript typecheck                                                                   | Passed (`tsc --noEmit`).                         | `/tmp/gatherory-mcp-shared-login-types-final.log`   |
| Production build                                                                       | Passed on Node 24.22.1.                          | `/tmp/gatherory-mcp-shared-login-build.log`         |

## Earlier foundation verification

These full-suite and build results are historical, from the MCP foundation
phase before the shared login-entry change. The opt-in MCP database/HTTP run is
also from that phase and remains useful evidence for the unchanged server
implementation; it is not a rerun of the current browser flow.

| Check                                                         | Result                                                                                                                                                                                        | Evidence                                                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Full repository suite, including generated-contract freshness | Passed: 140 files, 920 tests; 45 files and 66 tests skipped because their opt-in conditions were not enabled.                                                                                 | `/tmp/gatherory-mcp-final-full-suite.log`                                                                   |
| Opt-in MCP and Android Apple database/HTTP integration        | Passed: 22 files, 89 tests; one MCP dev-bootstrap test skipped because its separate acceptance fixture was not enabled. This is a separate run from the full suite.                           | `/tmp/gatherory-mcp-production-blockers-integration-final.log`                                              |
| TypeScript typecheck                                          | Passed (`tsc --noEmit`).                                                                                                                                                                      | `/tmp/gatherory-mcp-production-blockers-types-final.log`                                                    |
| Production Vite build                                         | Passed on Node 24.22.1, matching the repository's Node 24 pin. Ran from a temporary copy of current source so the workspace's existing build outputs and generated route tree were preserved. | `/tmp/gatherory-mcp-final-production-build.log`; version: `/tmp/gatherory-mcp-final-build-node-version.log` |

The current full suite above supersedes the earlier foundation aggregate of
920 passed and 66 skipped. The separate 89-passed/one-skipped MCP and Android
database/HTTP run remains historical server-integration evidence; the
shared-login change did not modify server behavior or require a migration. The
latest App Review read trace is direct dev acceptance evidence, but it does not
close the live-provider or production rollout gates below.

These checks used synthetic environment values and an isolation guard that
blocks workspace `.env*` contents and non-loopback network access. The database
and HTTP integration run used disposable PostgreSQL 18 on loopback port 55441
and the synthetic app on loopback port 3103. Neither used the development
database on port 5438 or production Neon.

## Production rollout order

1. Release the reviewed source and run the final contract, unit/integration,
   type, and production-build checks. Keep the existing tests-before-migrations
   order. Do not treat default-skipped database tests as executed coverage.
2. Back up the production database and apply the complete checked-in migration
   chain, including the additive MCP OAuth migration. Deploy the compatible
   server with `MCP_ENABLED=false` first. Do not reset production data.
3. Check the production canonical origin and provider callback registrations:
   `https://app.gatherory.com/api/auth/callback/google` and
   `https://app.gatherory.com/api/auth/callback/apple`. Apple uses the configured
   Services ID and registered HTTPS domain. Preserve native callback behavior.
   The current source reopens web browser login/planning, but production release
   and live-origin verification remain unconfirmed in this record. MCP enablement
   remains a separate production rollout gate.
4. Enable MCP in the production deployment. Confirm protected-resource and
   authorization-server discovery, issuer, audience, and resource all resolve
   to `https://app.gatherory.com/mcp` and its production auth server. Ensure its
   resource policy includes read, write, and offline access; never copy dev
   signing keys, cookies, clients, or grants into production.
5. Use a designated account for a clearly labeled production smoke event:
   connect Codex, approve consent, read/create/edit a small plan, retry one
   write, refresh after expiry, and revoke from the UI. Confirm existing JWTs
   and refresh credentials stop working. Inspect results without logging
   tokens, OAuth codes, query strings, or private planning content.
6. Ship the native scope-discovery fix and verify the created event on the
   supported TestFlight build and a physical iPhone. Earlier simulator checks
   establish development behavior, not production app delivery.
7. Verify the hosting request-limit and error-monitoring configuration for
   `/mcp` and `/api/auth/oauth2/*` before broad availability. This code review
   does not establish active production edge rules or alert delivery. Disable
   `MCP_ENABLED` and redeploy to stop MCP access without removing saved events
   or rolling back the additive schema.

The initial supported real client is Codex. Other client implementations need
their own compatibility check; CIMD is supported, dynamic client registration
and sessionful legacy SSE are not.
