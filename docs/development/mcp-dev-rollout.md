# MCP dev rollout and real-client evaluation

Last updated: October 25, 2026

This record covers the development-only rollout and an actual Codex CLI session.
It is separate from the synthetic conference import regression in
[`mcp-conference-evaluation.md`](mcp-conference-evaluation.md). Do not use this
record as production rollout approval.

## Isolated environment

- MCP was enabled only on `https://dev.gatherory.com/mcp`.
- The development app used the local PostgreSQL database at `localhost:5438`,
  database `gatherory`. The production Neon database and production app were not
  touched.
- Before applying the migration chain, a development database backup was saved
  at `/tmp/gatherory-mcp-dev-before.dump`. The full migration chain completed
  against the isolated development database.
- The development app used its local `.env.local` configuration. Do not copy
  credentials, OAuth codes, tokens, cookies, or account configuration into this
  document or into source control.

The local server is behind a TLS-terminating proxy. Its MCP host validation now
keeps the configured host check and accepts a forwarded HTTPS scheme only
when both the request URL host and Host header match the configured host. Do not remove the host/origin checks to make a
client connect.

## Client setup and authentication

The real client was Codex CLI 0.162.1 using `gpt-6-luna`. It discovered the
server through Client ID Metadata Documents (CIMD), completed OAuth, discovered
the tools, read the account's events, and created the development event below.
The user authenticated with an existing development account. No credentials
are recorded here.

Keep the test connection in a temporary private Codex home so the development
server and its OAuth state do not become part of the user's normal global
configuration:

```sh
DEV_CODEX_HOME="$(mktemp -d /tmp/gatherory-dev-codex.XXXXXX)"
CODEX_HOME="$DEV_CODEX_HOME" codex mcp add gatherory_dev --url https://dev.gatherory.com/mcp
CODEX_HOME="$DEV_CODEX_HOME" codex mcp login gatherory_dev
CODEX_HOME="$DEV_CODEX_HOME" codex mcp list
CODEX_HOME="$DEV_CODEX_HOME" codex --model gpt-6-luna
```

The private home also needs its own Codex model sign-in (`codex login`) before
running a model; that is separate from Gatherory MCP authorization.

Authenticate in the browser when the CLI prompts, then confirm the listed
server uses the dev hostname before testing. Do not copy the temporary
`CODEX_HOME` or its auth files to another machine or keep it as the default
Codex configuration. See the [Codex MCP connection guide](https://learn.chatgpt.com/docs/extend/mcp)
for supported CLI setup and authentication commands.

## Compatibility and OAuth fixes

Codex CLI 0.162.1 initiated the connection with the legacy `initialize`
handshake and protocol version `2025-06-18`. The MCP SDK server was configured
for stateless legacy compatibility while keeping the modern protocol path
available. The existing modern protocol tests remained passing. Stateless
compatibility does not add session state or enable the old SSE transport. See
the [MCP TypeScript SDK legacy-client guidance](https://ts.sdk.modelcontextprotocol.io/v2/serving/legacy-clients)
for the SDK's legacy posture and limitations.

The first real refresh after the short-lived access token expired failed with
`invalid_scope` for `offline_access`. Better Auth treats this as an
authorization-server scope: it does not advertise `offline_access` in
protected-resource metadata, but its configured per-resource `allowedScopes`
must include it so that it remains in the OAuth grant and refresh token. The
code now includes `offline_access` in the MCP resource allowlist. Because
Better Auth seeds resource rows as `insertOnly`, the existing development
`oauth_resource` row was also updated explicitly to include that scope, and the
client completed OAuth authorization again. New OAuth and loopback integration
coverage checks initial issuance and refresh with `gatherory:read`,
`gatherory:write`, and `offline_access`, while ensuring protected-resource
metadata still advertises only resource scopes. Access tokens retain a
five-minute lifetime; this change does not broaden event authorization.

Append-only create tools were also marked non-destructive in MCP annotations;
update tools remain destructive. This accurately describes the operations to
clients that request approval for destructive calls. Idempotency, current
permission checks, and conflict handling remain in force.

## Development import result

The real model-driven import created one event in the development database:

- **Title:** IBM TechXchange 2026 — Personal & Humphrey Plan
- **Dates:** October 26–29, 2026
- **Time zone:** `America/New_York`
- **Final read-back:** 16 scheduled child events, seven ideas, 47 notes, and
  four unassigned tasks.
- Every scheduled child was read back with `purpose: "eventExperience"`, the
  expected parent relationship, its confirmed time zone, and retained source
  information. The optional Monday block party, optional Wednesday outing, and
  five catalog alternatives remained ideas.
- Note pagination returned all 47 notes and a null next cursor. This corrects
  an interim model summary that reported 41.

The initial import read-back was 16 children, six ideas, 46 notes, and two
tasks. A later review corrected session titles, added the optional Wednesday
outing and a preparation task, and split proposed pilot/restore follow-ups
into separate tasks. Those were model-guided refinements to the same dev event,
not duplicate imports. The final verified counts above supersede the initial
read-back.

During a title-only correction, a partial Zod schema default reset omitted
child `purpose` fields to `planning`. The update contract was corrected to
preserve omitted values, and the complete child list was read back again: all
16 children had `eventExperience`. A focused regression test covers this
partial-update boundary.

The source plan was supplied by the user and was not independently verified
against IBM's live conference catalog. The import did not register sessions,
contact people, send invitations or notifications, assign tasks, or execute
proposed follow-ups. Catalog and schedule content should be treated as the
user-provided plan, not confirmation of current conference availability.

Sanitized evidence files from the dev run are available locally at:

- `/tmp/gatherory-dev-mcp-import-report.json`
- `/tmp/gatherory-dev-mcp-import-trace-sanitized.json`
- `/tmp/gatherory-dev-mcp-purpose-recovery-report.json`

The report and trace are diagnostic artifacts, not credentials or a durable
source archive. Keep them local and sanitized.

## iOS receipt and visible flow

Verified on the dedicated **Gatherory MCP Dev** iPhone 18 Pro simulator,
iOS 27.0, using an ordinary signed Debug build pointed at the dev origin.
Authentication and network sync were enabled. No seeded UI, auth bypass,
ephemeral app store, production endpoint, or device data reset was used.

The initial live app saw the conference through its attendance feed but had not
loaded its planning scope. The payload itself decoded and persisted correctly
through the native bootstrap pipeline. The cause was scope discovery: after its
initial bootstrap, the app only pulled scopes it already knew. Newly created
MCP events therefore appeared as invitation projections until another full
bootstrap. This was not a malformed payload or an invitation-acceptance issue.

Manual and foreground sync now discover new authorized scopes. The discovery
merge leaves known planner graphs and pending local changes intact, avoids
unrelated scoped-projection reconciliation, preserves onboarding state, and
checks the active account after the network request. Regression tests cover
new roots and children, repeated discovery, pending mutations, unsaved known
state, and a response arriving after an account switch.

The real app persisted **16 children, 7 ideas, 47 notes, and 4 tasks** under the
matching host account with manage permission. UI acceptance checked:

- Home and its native planning tabs, with the conference and scheduled sessions;
- the main event's October 26 noon–October 29 noon range in EDT;
- the first session's 1:00–2:00 PM EDT time, room B215, and source link;
- all seven idea entries, including the optional Wednesday outing's details;
- Planning history and source notes through Manage → Updates;
- all four unassigned tasks, due October 26, November 2, and November 28;
- scrolling the task list, light and dark appearance, and background/reopening
  without losing the selected event or its data.

A final MCP edit set the main venue to the source-provided **GWCC, Atlanta**.
Its native card updated through foreground sync while the sessions and other
content remained present. No street address, mapped coordinates, or live
catalog availability was invented. The signed Debug rebuild/launch also
retained the authenticated session. This establishes simulator receipt and
presentation, not physical-device or production acceptance.

Local screenshots include `/tmp/gatherory-mcp-dev-home-dark.png`,
`/tmp/gatherory-mcp-dev-session-light.png`,
`/tmp/gatherory-mcp-dev-ideas-light.png`,
`/tmp/gatherory-mcp-dev-notes-dark.png`, and
`/tmp/gatherory-mcp-dev-tasks-dark.png`.

## Source and permission verification

Independent database/bootstrap checks verified all 40 source excerpts retain
the source's non-whitespace content after correcting one shortened catalog URL
through MCP. Whitespace at excerpt boundaries is not byte-preserved. All source
URLs also occur intact in note or idea content; a supplemental reference note
makes a URL split between excerpts usable. Notes remain within 750 Unicode
code points. The selected schedule has no overlapping sessions, all sessions
retain `America/New_York`, and tasks have no assignee.

A permission regression found and closed a separate MCP edge case: an account
that collaborates on a parent but attends its child as a guest must not read
that child's private Planning notes through the parent bootstrap. `list_notes`
now requires explicit `note.read`; view-only collaborators retain read access,
while guests are denied. Create/update still require note-send permission and
updates remain author-only.

## Final verification results

| Check                                                                          | Result                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCP regressions, including disposable database and real HTTP/OAuth composition | 74 passed in 18 files; the dev acceptance case was skipped in this isolated run. `/tmp/gatherory-mcp-rollout-all-tests-verified.log`.                                                                                                |
| Actual dev bootstrap and source retention acceptance                           | Passed separately with the imported event and supplied source. `/tmp/gatherory-mcp-dev-native-export-final.log`.                                                                                                                     |
| iOS regression suites                                                          | 25 passed, zero failed/skipped across `WorkspaceBootstrapDiscoveryTests`, `McpPlanningPayloadTests`, and `EventInvitationTransportTests`.                                                                                            |
| Broader iOS sync and account regressions                                       | 54 passed, zero failed/skipped across `OfflineSyncTests`, `LocalGuestPersistenceTests`, `AccountDeletionLocalCleanupTests`, `SessionLifecycleActionsTests`, and `AccountDeletionSyncTests`; 79 native cases passed across both runs. |
| Actual native bootstrap decode/merge probe                                     | Passed on the exported real dev payload, including all 90 entities and full SwiftData persistence. Temporary probe and user payload were not retained in the repository.                                                             |
| Types, generated contract freshness and production build                       | Passed; the build used isolated synthetic configuration. `/tmp/gatherory-mcp-dev-types-verified.log`, `/tmp/gatherory-mcp-rollout-build-verified.log`.                                                                               |
| Full repository suite                                                          | 914 passed, 66 skipped, one existing Android Apple sign-in handler architecture failure (`drizzle-orm` import). `/tmp/gatherory-mcp-dev-full-tests-verified.log`. This is not an all-green repository result.                        |

The native result bundle is
`/tmp/gatherory-mcp-dev-ios-derived/Logs/Test/Test-Gatherory-2026.10.25_16-37-16--0400.xcresult`.
The broader native result bundle is
`/tmp/gatherory-mcp-dev-ios-derived/Logs/Test/Test-Gatherory-2026.10.25_16-56-08--0400.xcresult`.
See the native [testing record](../../../ios-apps/gatherory/docs/testing-verification.md)
for the owning app's acceptance notes.

## Reproduction and rollout boundary

1. Confirm the target is the dev hostname and the isolated local database.
2. Confirm `MCP_ENABLED=true` only in the development app configuration and
   that the full migration chain has completed on that isolated database.
3. Use the temporary Codex home steps above, authenticate with the intended dev
   account, and verify the discovered endpoint before any write.
4. Read existing events first. For an import, preserve the user's source and
   distinguish confirmed selected sessions from alternatives and optional
   items. Retain source attribution; do not invent dates, rooms, people,
   registrations, or commitments.
5. Read back and paginate every created list. Verify parent IDs, purpose,
   confirmed times, source retention, idea/task/note counts, and write versions.
6. Remove the temporary Codex home when testing is complete if it is no longer
   needed. Never enable MCP or apply this development resource configuration in
   production as part of this procedure.

The automated MCP regression and in-memory OAuth suites cover token refresh,
scope retention, revocation, idempotency, current event permissions, and
protocol behavior. The disposable-database/live HTTP suite is opt-in; its result
must be recorded separately when it is run. The plan was verified in the development iOS simulator; production and physical-device
rollout remain separate work.

The actual development server, local database, imported conference, and revocable
MCP grant remain available. The disposable regression database/server and temporary
native probe were removed. The copied model authentication file was removed from
the private temporary Codex home; its MCP configuration and OAuth connection were
retained. The normal Codex authentication file was unchanged.

## Browser connection settings acceptance — October 25, 2026

The MCP settings and navigation changes were verified against the development
app with a disposable settings grant in the local PostgreSQL database on port
5438. The grant contained no client credentials or tokens. App Review opened
the profile menu, selected **AI connections**, and confirmed the main planning
sidebar contains only Overview. Configure opened the permission editor;
changing the read-only switch and cancelling left the grant unchanged.

The first save exposed a TLS proxy origin check issue. After the origin handling
was corrected, saving the read-only setting succeeded. Reloading the page showed
the change persisted with read and offline access. The write control was disabled
and the page directed the user to reconnect to restore write access. Synthetic
OAuth reconsent coverage verifies that a new authorization can restore the
requested scopes; this task did not perform live provider reauthorization. The
fixture's Revoke action removed only that disposable grant; the real Codex grant
remained untouched. Cleanup completed by revoking the fixture consent through
the UI and removing only the synthetic client. No tokens were created; the
existing real Codex grant remains the sole grant. The browser evaluation record
is `/tmp/gatherory-mcp-settings-browser-evaluation.json`.

Light and dark appearance were checked using the desktop browser. Screenshots
are `/tmp/gatherory-mcp-settings-light.png` and
`/tmp/gatherory-mcp-settings-dark.png`; the final connection-row layout is captured
in `/tmp/gatherory-mcp-settings-final.png`. The original System appearance
preference was restored after these checks. No mobile viewport was checked. These
checks cover the development web UI only and do not establish production MCP
availability or a production rollout.

| Check | Result | Evidence |
| --- | --- | --- |
| Focused settings and MCP regressions | Passed: 9 files, 45 tests. | `/tmp/gatherory-mcp-settings-focused.log` |
| Full repository suite, including contract freshness | Passed: 144 files; 929 tests passed, 66 skipped. | `/tmp/gatherory-mcp-settings-full.log` |
| TypeScript typecheck | Passed (`tsc --noEmit`). | `/tmp/gatherory-mcp-settings-types-final.log` |
| Production build | Passed. Non-fatal Base UI `use client` advisories remain in build output. | `/tmp/gatherory-mcp-settings-build.log` |
| Desktop browser settings flow | Passed for profile-menu navigation, sidebar simplification, cancel, save/reload, read-only state, and fixture-only revoke. | Screenshots above; disposable local fixture |
| `git diff --check` | Passed. | Final local source diff |

Production was not pushed or deployed. Production MCP remains disabled. Any
future production push or deployment requires an explicit production rollout
request from the product owner.

## App Review connection retest — October 25, 2026

A later user-requested retest connected Codex CLI as
`appreview@gatherory.test` against `https://dev.gatherory.com/mcp`. Production
protected-resource discovery returned HTTP 404 and was not enabled or changed.
This uses the CLI's isolated OAuth connection; it does not dynamically add
Gatherory tools to an already-running desktop chat.

At the start of this retest, the local database contained no OAuth resources,
grants, refresh records, or client-resource associations, and the earlier
conference snapshot was absent. The previously loaded browser connection page
was stale. These observations do not establish who cleared the development
data. The earlier conference results above remain a historical acceptance
record, not a statement that its fixture is still present.

The old client could not refresh: the provider returned `invalid_target` for
the missing resource. Restarting the development server let Better Auth seed
the configured resource again, including `offline_access`. App Review then
signed in and renewed the same Codex read/write/offline connection through the
browser. No OAuth records were injected directly. After resetting an enabled
development database, restart the server and reconnect clients: the provider's
resource-seeding state can otherwise outlive the deleted rows. Do not treat
static discovery returning 200 as proof that token issuance works.

The fresh fixture is **MCP acceptance test — October 25, 2026**, root
`3f6bfce9-7f12-5e73-9b2b-0736b751601f`, with one child session, one idea, one
note, and one task. All creation and editing occurred through the real Codex
MCP connection. The fixture remains available in development.

- All **17 tools** were exercised in **27 calls**. Wedding search returned
  three Blueprints. Two calls were intentional rejection checks.
- Identical main-event creation returned the same ID and version. Reusing
  that key with a changed title returned `WRITE_REJECTED`.
- An identical task-update retry retained version 2. A main-event edit using
  the original stale version returned `VERSION_CONFLICT`.
- Final reads returned exactly one child, idea, note, and task, each at version 2. The main event retained October 30, 2–4 PM in `America/Detroit`; its venue
  changed to **Updated test venue**. A child title-only edit preserved
  `eventExperience`, category, and its 2:30–3 PM schedule.
- The task's due date cleared to null while its assignment stayed null and
  completion stayed false. Idea and note edits matched the requested text.
- Independent assertions over the actual tool results passed. No existing
  events were edited; no deletions, invitations, or notifications were requested.
- The read-only native bootstrap acceptance test passed separately for App
  Review and this root. It exported the saved event, idea, note, and task through
  the same repository used by iOS. Result:
  `/tmp/gatherory-mcp-appreview-recheck-native-bootstrap.log`; payload:
  `/tmp/gatherory-mcp-appreview-recheck-native-bootstrap.json`. This proves
  bootstrap availability, not a new simulator or physical-device UI check.

Private local evidence: `/tmp/gatherory-mcp-appreview-recheck-verified.json`,
`/tmp/gatherory-mcp-appreview-recheck-report.txt`, and
`/tmp/gatherory-mcp-appreview-recheck-connected-trace.jsonl`. The browser
connection receipt is `/tmp/gatherory-mcp-appreview-recheck-connection.png`.
The temporary model authentication copy was removed after each invocation;
the revocable MCP grant remains available in **Manage AI connections**.
The latest raw Codex trace at `/tmp/gatherory-mcp-appreview-final-connection-trace.jsonl`
contains one `list_events` item and one `search_blueprints` item, each with a
pagination cursor. This corrects an interim model summary that said both reads
were empty. The renewed grant is active in development. The trace does not
establish a new expiry/refresh or revocation check for this renewed grant,
production, a completed real Google/Apple Codex token exchange, or new iOS UI
acceptance.

## IBM TechXchange recreated through the dev MCP — October 25, 2026

The product owner requested importing the supplied IBM TechXchange plan again
and explicitly approved upgrading App Review's Codex connection from read-only
to read/write/offline access. All mutations used the real development MCP at
`https://dev.gatherory.com/mcp`; no direct database writes were used. A fully
paginated preflight found two accessible main events and no existing IBM
conference, so this import created a new main event:

- **IBM TechXchange 2026 — Personal & Humphrey Plan**
- Event ID: `ad84dc4e-0dd6-5bb5-8463-62ee22d11769`.
- Owner account: `appreview@gatherory.test`.
- Attendance: October 26 around noon through October 29 around noon, 2026,
  `America/New_York` (EDT). Event bounds store noon on each date.
- Verified final content: **16 scheduled children, eight ideas, nine planning
  notes, and six unassigned tasks**. Every list returned a null next cursor.
- Scheduled children use `purpose: "eventExperience"`. The general session
  remains marked optional/tentative. Optional social outings and conflicting
  catalog alternatives remain ideas. Relative follow-up deadlines are retained
  in task titles with null due dates because actual return travel is unconfirmed.

Two Luna agents prepared and independently reviewed the source-grounded
payloads. Local validation checked the actual MCP schemas, unique idempotency
keys, non-overlapping sessions within the attendance bounds, and note lengths.
A real Luna Codex client created the content through MCP. Independent read-back
caught two copying omissions in a child description and an idea source link;
both were corrected through MCP using automatic approval review. A final note
retains the company-background attribution and platform decision deliverable.
The final field-by-field comparison against the reviewed payloads passed,
including all session times, rooms, descriptions, source links, note bodies,
task fields, parent relationships, and child purpose values. The existing dev
web overview also displayed the conference with 16 scheduled activities and
eight ideas. This task did not recheck the iOS interface or IBM's live catalog.
No sessions were registered, people invited, notifications sent, or production
changes made.

Private local evidence: `/tmp/gatherory-ibm-techxchange-import.json`,
`/tmp/gatherory-ibm-import-trace.jsonl`,
`/tmp/gatherory-ibm-corrections-trace.jsonl`, and
`/tmp/gatherory-ibm-techxchange-final-verified.json`. The browser receipt is
`/tmp/gatherory-ibm-techxchange-created.png`. These results supersede the earlier
historical conference counts above for the currently accessible App Review dev
conference; the synthetic MCP acceptance event remains a separate fixture.
