# 04 — Native Setup and Release Acceptance

**Status:** Planned
**Priority:** P1
**Depends on:** 02 and 03 for full delivery. Bring model/transport/import proof
forward alongside 03, before completing authoring UI, as described in `00a`.

The curated native milestone in [05](05-product-experience-and-billing-sequence.md)
does not require `02`'s full authoring UI. Private-template selection/customization
tests below still require `02` and remain necessary for full iteration completion.
Curated use is free; later Event Pass purchase is separate from installation.

## What this is / why it exists

Expose the templates where people already create their events. This completes
the first iteration; a web authoring page alone would leave the main product
unable to use the configuration.

## Target behavior

In onboarding and subsequent new-event setup, offer **Start from scratch**,
Wedding, Birthday Party, Thanksgiving, and the user's authorized published
private templates. Use shared setup state and native controls; do not fork three
separate creation forms. Distinguish starter definitions from already-created
events. Explain the included suggestions briefly and preview them before saving.

Collect main-event name/date/time zone and optional location/end/cover/budget
using the existing editor controls. The user can review starter ideas, select
suggested activities and confirm their dates, and inspect instructions by
audience. Do not force a fabricated date for an unselected or unscheduled item.

Blueprint creation requires a connection in this iteration. Preserve a user's
unfinished setup and stable request UUID during retry. After a lost response,
query/retry that installation before offering a second creation. Start-from-
scratch retains the existing local flow. Never create a local duplicate before
the server installation returns its canonical identity.

On success, import the server bootstrap through the normal sync path and select
the created event. Do not call `PlanningWorkspace.newWorkspace` again for the
same installation. Resolve local cover upload through the existing new-event
media flow after canonical scope authorization; upload failure does not rerun
installation.

Persist setup recovery as an account-bound pending installation intent, not a
workspace mutation: request UUID, exact revision/hash, reviewed selections,
confirmed inputs, and the last known installation ID/status. Account changes
cancel in-flight work and prevent an old result entering the new library. After
restart, resolve status before starting another install; clear the intent only
after the canonical scope is durably imported or the user explicitly abandons
an attempt with a known outcome. Never store credentials in this intent.

Use copied live configuration to suggest/order the relevant idea categories;
leave **Other** available and do not remove existing capabilities from old
events. Show and edit copied instructions in the shared event detail experience
with normal host controls and server-enforced visibility. Sub-events use the
same view with no nested schedule of their own. All subsequent event/idea edits
are independent of the source template.

## Source areas and architecture boundary

Native files to inspect before editing:

- `Gatherory/Models/ExperienceContracts.swift`
- `Gatherory/Models/PlanningModels.swift`
- `Gatherory/Data/Persistence/WorkspaceArchiveV1.swift`
- `Gatherory/Data/Persistence/WorkspaceArchiveV1+Sync.swift`
- `Gatherory/Data/Persistence/WorkspaceArchiveCodec.swift`
- `Gatherory/Data/Persistence/WorkspacePersistence.swift`
- `Gatherory/Data/Persistence/WorkspaceRemoteMerger.swift`
- `Gatherory/Data/Persistence/WorkspaceOutboxWriter.swift`
- `Gatherory/Data/Persistence/WorkspaceMediaBookkeeper.swift`
- `Gatherory/App/PlanningWorkspace.swift`
- `Gatherory/App/WorkspaceLibrary.swift`
- `Gatherory/Features/Onboarding/OnboardingView.swift`
- `Gatherory/Features/Workspaces/WorkspaceBrowserView.swift`
- `Gatherory/Features/Events/` shared detail/editor views
- `Gatherory/Features/Events/GuestInvitationStore.swift`
- `Gatherory/OfflineSync/` transport, bootstrap, store, and coordinator
- `Gatherory/Localization/AppCopy.swift`

Add a focused blueprint client and setup model following current repository
conventions. Keep contract decoding, capability checks, request identity, and
UI state separate. Shared fixtures should cover the executable module versions
and canonical/native mappings. Decode unknown optional modules safely and fail
required incompatible ones with useful copy before submission.

The recent extraction is implemented, not a prerequisite to repeat. Follow the
native [workspace boundaries](../../../../ios-apps/gatherory/docs/workspace-boundaries.md):

| Responsibility                                        | Integration point                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Copied live configuration and guide state             | Typed observable/domain fields, independent of the source revision                                                        |
| Local restart compatibility                           | Archive fields/defaults and an explicit migration/version decision; preserve the existing codec's reference-date encoding |
| Planner edits and remote updates                      | Entity projection/application in `WorkspaceArchiveV1+Sync`, then existing outbox/remote-merger staging                    |
| Atomic record/outbox or record/receipt/cursor commits | `WorkspacePersistenceController`, not the setup model or extracted helpers                                                |
| Account-bound install recovery                        | Focused setup/client persistence, distinct from ordinary sync mutation identities                                         |
| Guest guide reads                                     | Authorized invitation/guide DTO and guest cache; never the planner library/outbox                                         |
| Cover transfer after install                          | Existing media coordinator/bookkeeper after importing the canonical scope                                                 |

Do not enlarge `PlanningWorkspace` into a template interpreter or put HTTP,
installation, or save logic in the codec/merger. New guide/configuration edits
must survive offline save, relaunch and sync without erasure by older snapshots.
Retain budget rules and ordinary media behavior; installing suggestions must not
implicitly reserve money or create expenses.

Web collection/details should reflect the newly created canonical records via
existing views. Do not expand the web companion into full event editing just
to complete this slice. The user's new native plan is the first installation
consumer; future web creation can reuse the same workflow.

## Acceptance criteria

- A new user and an existing user can each create one event from every preset.
- A private Wedding customization published on the web appears in that user's
  native picker and creates the edited content. Another user's private draft or
  revision does not appear.
- Root and child events retain existing card/detail/attendance behavior; no
  default guests, attendance answers, or accepted decisions are invented.
- Ideas land under their reviewed event context; category order and instructions
  survive restart, sync, and a second-device bootstrap.
- Retrying after network interruption opens one event with one identity. Failure
  preserves input and provides a useful retry path.
- Hosts and guests see the correct instruction audience in both UI and payloads.
- Start-from-scratch, existing plans, and ordinary event editing still work.
- An old client's read/edit/retry cannot silently consume required guide changes
  or erase configuration. A later upgraded bootstrap recovers all supported data.
- Losing the install response, killing the app before import, switching accounts
  during the request, and retrying after relaunch each retain one canonical event
  and never publish another account's result.
- Keyboard/VoiceOver labels, Dynamic Type, light/dark contrast, loading/error
  states, and date/time-zone wording use existing native design/localization
  conventions. Verify the actual screen on an available device/simulator when
  authorized; do not close the user's simulator.

## Validation and handoff

This assessment is docs-only: no runtime tests or UI tests were run. During a
separately authorized implementation, use Vitest/`@effect/vitest`, disposable
database transaction tests, shared fixtures, and native Swift Testing. Reuse
the current archive, outbox, remote-merge, media and sync regression suites;
past green counts do not validate blueprint behavior. Avoid routine web
production builds. Scope simulator/test runs to the implementation request and
record actual checks and untested device behavior. UI validation requires a
later implementation/release check; it is not implied by this documentation work.

Before marking the iteration implemented, record the actual routes, handlers,
schema/migration, seed command, native entry points, failure/retry behavior, and
privacy checks in this roadmap. Update `product-model.md`,
`experience-blueprints.md`, `data-model.md`, and `server-architecture.md` to
distinguish the newly implemented private templates from the still-deferred
professional ecosystem.

## Later: host-configured stays and experiences

The first model already supports host-authored directions, recommended events,
ideas, and instructions. A later Airbnb-style experience can build on that with
`property_stay` configuration and one independently created event per stay.

Before launching it, add explicit resource ownership, access to each stay,
participant groups and privacy projection, safe handling of per-stay access
instructions, arrival/departure timing, and any operational checklist semantics.
Fresh installations must never copy previous guest participants, photos,
responses, private notes, or completion state. Reuse published suggestions and
instructions, then customize instance-specific sensitive information securely.

Public discovery, unlisted sharing, property/booking integrations, packages,
payments, custom permission builders, private journals, and template update
merging remain later work. Supporting the generic type and typed configuration
does not assert that those later products already exist.
