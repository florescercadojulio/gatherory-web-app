# 03 — Installation and Native Delivery

**Status:** Planned
**Priority:** P1
**Depends on:** 01; share preview semantics with 02.

## What this is / why it exists

Create a new event from a published version and deliver the resulting records
to the native app. This is the boundary that turns a template into independent
collaborative data.

## Input and observable result

Input contains a source blueprint/revision, stable installation request UUID,
main-event details, selected starter keys, confirmed child schedules, and client
capabilities. The client chooses neither the owner nor participant records,
database IDs, approval permissions, provenance, or system origin. Credentials
come from the existing web-session/native authentication boundary.

Preview resolves the exact revision and returns a normalized proposed plan,
omitted dependency list, missing required input, capability warnings, and content
hash. Install revalidates everything; a successful preview is not authorization
and does not freeze membership. Use the revision/hash to prevent review of one
version followed by installation of another.

Result identifies the new organization, main event/native scope, installation,
and bootstrap/sync position through typed transport DTOs. The created main event
is draft; selected scheduled children are approved with independent participant
rows; ideas are `new` with no votes or inferred decisions. Instructions preserve
their declared audience. No invitations or announcements are sent by installing.

## Workflow and recovery

1. Authenticate, authorize the source revision and destination creation, enforce
   size/capability limits, and expand the validated plan.
2. Claim an installation receipt unique to actor/request UUID with a normalized
   request hash. A reused key with different content returns a conflict. Same
   content returns the previous result or resumes the same in-progress attempt.
3. Resolve a permitted empty personal event workspace or provision a new one
   through the existing Better Auth boundary. Claim/lock a reused workspace so
   two concurrent creations cannot both insert its main event. For a new scope,
   persist a stable provisioning token/slug before calling Better Auth and verify
   identity/membership when recovering it after an interrupted response.
4. In one workflow-owned product transaction, create the root event, host/person,
   planning settings, included direct children/participant snapshots, ideas,
   instructions, independent configuration, and completed installation manifest.
   Record every generated ID by source key. Never create grandchildren.
   Recheck source/destination authority and source retirement at this commit
   boundary after any provisioning delay.
5. In that transaction, write compatible native entities, scope membership,
   bootstrap snapshot, and change-log records through a domain-to-sync adapter.
   If transactional projection proves incompatible with current infrastructure,
   add a transactional outbox with an actual retrying worker and readiness state
   before shipping. A best-effort post-commit sync call is insufficient.
6. Commit, then activate the new context. Session-selection failure is recoverable
   and must not create a second installation or roll back an already-created event.

Better Auth workspace creation is outside the product transaction. Receipt
states are `pending`, `provisioned`, `completed`, and `failed` with explicit
retryability. Bound concurrent execution with a database lock or recoverable
lease; never keep a database transaction open across an external auth operation.
A crash after provisioning must recover the same scope. Cleanup may remove only
a workspace created exclusively by this attempt that still has no user content;
do not delete an existing empty personal scope or restore a stale session value
over a user's newer context selection.

Database uniqueness enforces one main event per configured event workspace and
one completed install per request. Recheck authorization on replay before
returning the event. A concurrent retirement/revocation should have defined
serialization: reject new installs once retired; replay may return an existing
authorized result without reinstalling it.

## Mapping and sync requirements

Use portable idea content at the blueprint boundary. Current canonical idea
configuration contains native compatibility payloads: isolate conversion in an
adapter and test actual native decoding. Do not embed Swift enum encoding into
published blueprints or claim arbitrary category settings are supported.

Known required modules must be supported by both the server installer and the
requesting client. Instructions need their own canonical projection/native
models; do not disguise them as broadcast notes or private idea comments. Extend
the version/capability handshake and native payload transport as needed, with
explicit rejection for clients that would lose required instruction/configuration
content. Existing clients must not erase new content through an older snapshot.

Instruction read/update checks reuse event authorization, with writes requiring
event-manage permission. `planning_only` guidance is returned only to hosts and
authorized planning collaborators; `event_participants` guidance is visible to
assigned participants of that specific event. Filter guest HTTP projections and
sync/bootstrap consistently. If a shared snapshot currently cannot support that
filtering, this slice must correct the projection before enabling guide delivery.

Blueprint ownership grants no installation access. Source template deletion or
editing cannot alter created events. Future instances get fresh participants,
responses, and contributions; the source configuration contains no previous
guest's data. The instruction model never treats property credentials as public
template content.

## Architecture boundary

Expose authenticated folder-based `/api/blueprints/...` routes for native catalog,
revision preview, installation, and installation status, with the same domain
workflows as TanStack handlers. Add the route contracts to existing contract
generation/API documentation practices; do not invent an independent mobile
installer. Keep `native-materializer.ts` as incoming replication infrastructure,
not the blueprint business workflow.

Provide event-guide read/update operations for the copied live sections, with
expected-version conflict checks on edits. These belong to the event domain;
editing live instructions never calls the blueprint draft-update workflow.

Refactor only the touched event creation/repo operations to accept the shared
workflow transaction. Reuse domain rules for participant snapshots and scope
checks, never handler-to-handler calls. Follow `src/server/effect.ts` for tagged
errors and safe transport responses.

## Acceptance criteria

- Creating from each preset yields exactly the reviewed items and canonical IDs.
- Same-key retries, concurrent requests, and interrupted provisioning do not
  duplicate workspaces, main events, ideas, or instructions.
- A failure halfway through product writes leaves no partial event tree or
  partially completed installation; retry has a defined recovery path.
- Source and destination access are independently checked, including status
  queries and retries. Another user's installation key exposes no records.
- Invalid schedules, DST ambiguity, unknown required modules, and dangling
  targets fail before event writes. Optional unknown modules are visibly omitted.
- Two new clients see the same installed event and generated IDs through normal
  bootstrap/pull; the next native edit updates those records without duplicating
  them. Unsupported older clients cannot overwrite richer server content.
- A guest cannot receive planning-only instructions in any delivery path.
- Editing, retiring, or deleting the source does not change an installed event.
- Focused database/contract tests cover failure injection, replay, cross-scope
  access, and privacy. Use local disposable fixtures, never production data.

## Explicit deferrals

Applying templates to existing populated events, repeat application, merging
template updates into live plans, background offline installation, public link
redemption, and commerce. Restricting installation to new plans avoids destructive
merge decisions while keeping the independent-instance architecture intact.
