# Pinterest inspiration for event ideas

**Status:** Planning; no integration implemented.  
**Requested:** October 22, 2026: explore bringing a person's Pinterest boards
into Gatherory as ideas for an event and document how it could work.  
**Owner areas:** Native event Ideas, server provider connections, existing
event authorization and sync.  
**Current stopping point:** Product flow and technical boundaries documented.
Confirm Pinterest's permission for the intended storage and event-sharing model
before committing to API-backed imports. This is a separate planning feature;
[Blueprint content search](../blueprint-ranking-roadmap/02-content-search-and-related-terms.md)
is implemented locally; this proposal does not change discovery's actions and
measurement sequence. No Pinterest implementation date is committed.

## User outcome

Turn inspiration someone has already collected into a short list of things to
consider for their event. For example, choose a few decoration Pins from a
wedding board, add personal notes about using them, and discuss those ideas with
eligible event planners. Importing a board should never mean dumping hundreds
of Pins into the event or creating a second Pinterest interface.

The user has requested this investigation and documentation. The defaults below
are implementation proposals, not approved provider access or shipped behavior.

## Proposed experience

1. Open an event's **Ideas → Add → From Pinterest**. The event is already selected;
   if the person changes to a child event, show that destination explicitly.
2. Connect Pinterest in its authorization screen. Explain the read-only purpose
   and who would see any ideas added. Cancelling creates nothing.
3. Choose one accessible board. Show a paged, simple image picker with short
   titles and a selected count. Board sections can be a later enhancement.
4. Select individual Pins, then review. Nothing starts selected. A proposed
   first limit is 20 Pins per submission, adjustable after usability checks.
   No required category or hashtag step. Let the person write their own title
   and note, such as “Use this lighting around the dinner table.”
5. Confirm **Add 4 Ideas** once. Show what was added or skipped and offer to open
   the event's Ideas list. Each item has an identifiable Pinterest reference
   with an **Open on Pinterest** action. Rich imagery is conditional on the
   provider permission described below.

These become suggestions in the existing Ideas experience. Adding them does not
approve them, cast a Decide preference, add a scheduled event, assign work, or
invite anyone. Existing Decide behavior may apply to an eligible idea afterward;
it does not become a like or vote on Pinterest. No Pinterest write operation or
continuous board synchronization is part of this proposal.

## Provider permission is the first dependency

Pinterest's [developer guidelines](https://policy.pinterest.com/en/developer-guidelines)
restrict storage of API information beyond the campaign-analytics exception,
sharing API information with third parties, and creating distributable new
content from Pins. They require attribution and source links for displayed Pins
and restrict scraping and model development. OAuth consent alone does not
resolve these restrictions. This is our reading, not provider approval.

Ask Pinterest to confirm the exact proposed use: persistent references and
user-authored notes, image/text display, offline behavior, event collaborators,
and secret/group boards. Record any permitted fields, audiences, retention and
deletion requirements before choosing a persistence contract. Standard API
access must not be treated as permission for this particular content use.

Three product levels should remain distinct:

| Level                                  | Gatherory proposal                                                                                                                               | Readiness                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| User-authored link idea                | Person pastes a Pin or board URL into the existing Website idea and writes an original title/note. No automated page extraction or copied image. | Closest fit to existing code; verify the exact link flow before advertising support. A board link is one reference, not its individual Pins imported. |
| Connected board browser                | Fetch accessible boards/Pins for the connected person during that session.                                                                       | Requires approved API access and a compliant display model; does not itself create shared ideas.                                                      |
| Selected Pin references in event Ideas | Create reviewed, event-scoped references with the person's planning notes and any expressly permitted display data.                              | Conditional on confirmation covering persistence and the intended audience; do not promise permanent Pin copies.                                      |

The manual link option is an independent user-authored flow, not a way to bypass
API restrictions. If the requested board-to-shared-ideas use is not permitted,
retain the simpler link flow and drop the richer import promise.

## What exists in Gatherory

Native [PlanningModels.swift](../../../../ios-apps/gatherory/Gatherory/Models/PlanningModels.swift)
already defines `PlanningIdea`, the `.link` category, and `LinkIdeaConfiguration`
with HTTP/HTTPS URL normalization.
[IdeaEditorView in IdeasView.swift](../../../../ios-apps/gatherory/Gatherory/Features/Ideas/IdeasView.swift)
already accepts a website, title and optional description. This is a better
starting point than a new idea category for every external provider.

There is no Pinterest connection, board picker, import batch, provider-reference
visibility model, or provider cleanup path implemented by this work. The existing
link model alone is insufficient to distinguish API-derived references during
sync, capture and removal. Do not silently place API payloads in ordinary idea
notes, generic configuration JSON, or private-media storage.

## Technical shape, if the use is permitted

Use the existing [server implementation guide](../../development/server-implementation-guide.md)
and [server architecture](../../architecture/server-architecture.md). Keep
provider HTTP/token handling in a connector, orchestration in Effect workflows,
and event writes behind existing authorized domain boundaries. Native owns the
picker/review UI and its transient selection, not provider credentials or policy.

- **Connection:** A signed-in Gatherory account links its own Pinterest account
  through OAuth. Bind a one-time expiring authorization transaction to that
  actor/session, verify state, and keep tokens in protected server-side storage
  outside native sync. This does not replace Gatherory sign-in. Account switches
  invalidate in-flight selections and callbacks.
- **Read access:** Begin with `boards:read` and `pins:read`; request no write or
  ad scopes. Pinterest's [official quickstart](https://github.com/pinterest/api-quickstart/blob/main/python/README.md)
  lists separate secret-board/Pin scopes. Defer secret and group boards until
  access, audience and removal behavior are explicitly resolved.
- **Browsing:** The official [Boards API reference](https://github.com/pinterest/pinterest-python-generated-api-client/blob/main/docs/BoardsApi.md)
  describes `GET /boards` and `GET /boards/{board_id}/pins`, including paging.
  Use the active connection's accessible boards, not arbitrary board URLs or a
  global Pinterest search. Treat returned text/URLs as untrusted data.
- **Confirmation:** Recheck exact-event planning-write permission, active
  connection, source accessibility and selected Pin identities at confirmation.
  Bind an idempotency key to the actor, event and submitted selection. Enforce
  batch bounds; a client title or board ID is not authority to fetch other data.
- **Persistence:** Ordinary user-authored planning fields and a provider
  reference must have distinct ownership. Final reference fields, retention,
  deduplication key and storage are unresolved until permitted. Proposed retry
  behavior is one result per selected source Pin per exact event, including
  concurrent requests. Never overwrite an existing planner's title or notes.
- **Completion:** Prefer validating a small selection before an atomic local
  write transaction; do not keep a database transaction open during provider
  calls. Return per-item explanations for unavailable or existing items before
  confirmation. Transient failures should remain retryable without duplicate
  ideas. Loading the picker or cancelling never writes ideas.

Pinterest documents Trial and Standard tiers and an application review process
in its [access guide](https://dev.pinterest.com/docs/key-concepts/access-tiers/).
Validate actual read access, rate limits and refresh behavior using an approved
test account before committing to the production flow. Existing app approval,
consumer account coverage and secret-board access are unverified here.

## Sharing, offline use and lifecycle

These are Gatherory's proposed boundaries, conditional on the provider agreement:

- The connection belongs to one person, never to an event or all its members.
  Event membership cannot grant access to that person's Pinterest account.
  Even a public board does not automatically authorize redistributing its API
  data. Keep the connected browser personal; enable shared references only for
  an expressly permitted audience. Secret-board support starts out of scope.
- Use existing exact-event permissions. Guests and read-only participants do
  not gain import controls. Access to a parent or sibling does not grant import
  rights in another event. Do not expose references on invitations by default.
- Browsing needs a connection; no offline board mirror. Separately authored
  planning notes may use ordinary event sync, while provider display data follows
  its permitted lifecycle. Render a useful unavailable-reference state rather
  than showing a cached Pin after access is lost.
- Disconnect, revocation, provider deletion and account deletion need explicit
  cleanup semantics. Stop provider fetches, invalidate transient views and remove
  tokens; clear any derived data as required. Do not erase unrelated planning
  contributions. Resolve the fate of persistent IDs/URLs and shared reference
  shells before shipping; there is no blanket promise they survive disconnect.
- Keep API-derived references/media out of Blueprint capture, copy, publication,
  public search and recommendation signals. Capture/export should omit them
  until an approved provenance/rights rule exists; never bake transient Pin data
  into immutable Blueprint snapshots. Do not fetch Pin images through ordinary
  private cover/media import paths.
- Do not log tokens, board/Pin names, URLs, thumbnails, or personal notes in
  analytics. Respect rate limits and cancelled requests; show reconnect, removed
  content and retry states without losing the person's original planning notes.

## Build order and acceptance

1. **Validate the product and provider fit.** Review the existing manual Website
   idea path with a Pin and board link; confirm no unwanted metadata fetch.
   Obtain a documented answer on storage/audience, then a narrowly approved
   read-only test integration. Stop at this level if the desired use is refused.
2. **Prove the picker.** Account-scoped OAuth, board paging, individual selection,
   transient review and cancellation. No persistent event import yet. Test normal
   accounts, unsupported boards, denied access, expiry, rate limits and sign-out.
3. **Add references only under the agreed contract.** Introduce minimal portable
   provenance/sync changes and authorized, retry-safe creation; verify exact-event
   and audience boundaries, no silent duplicates/overwrites, partial-unavailable
   selections, disconnect/deletion cleanup, and Blueprint capture exclusion.

Implementation must include focused native interaction/model tests, connector
and workflow tests with substituted Pinterest responses, authorization and retry
tests, and disposable-database tests where persistence changes. Generate portable
schemas and run relevant native/web contract checks when contracts change.
Validate accessible selection, large text and English/Spanish copy. No live API
call, app registration, schema change or application test was performed for this
documentation-only investigation.

Defer whole-board one-click ingestion, background refresh, reverse syncing,
Pinterest posting, automatic category inference, AI extraction, imported images
as event covers, public Blueprint republishing, and ranking personalization from
Pinterest activity. The first useful experience is a few deliberately chosen
references attached to one event.

## Continuation

Read this proposal, the current code and the provider terms again before
implementation. Resolve the storage/audience contract first; then specify the
smallest permitted slice. No user account has been connected and no permission
has been requested from Pinterest. This document records the investigation and
does not authorize provider outreach or publish anything.

Documentation verification: targeted Prettier, local file/heading references and
`git diff --check` passed. Existing native link-idea code and official Pinterest
sources were inspected; no application tests were needed for these doc changes.
