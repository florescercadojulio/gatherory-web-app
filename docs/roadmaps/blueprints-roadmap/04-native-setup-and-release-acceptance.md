# 04 — Native Setup and Release Acceptance

**Status:** Planned
**Priority:** P1
**Depends on:** 02 and 03; confirm the other AI's event/sync changes are integrated.

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
- `Gatherory/App/PlanningWorkspace.swift`
- `Gatherory/App/WorkspaceLibrary.swift`
- `Gatherory/Features/Onboarding/OnboardingView.swift`
- `Gatherory/Features/Workspaces/WorkspaceBrowserView.swift`
- `Gatherory/Features/Events/` shared detail/editor views
- `Gatherory/OfflineSync/` transport, bootstrap, store, and coordinator
- `Gatherory/Localization/AppCopy.swift`

Add a focused blueprint client and setup model following current repository
conventions. Keep contract decoding, capability checks, request identity, and
UI state separate. Shared fixtures should cover the executable module versions
and canonical/native mappings. Decode unknown optional modules safely and fail
required incompatible ones with useful copy before submission.

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
- Keyboard/VoiceOver labels, Dynamic Type, light/dark contrast, loading/error
  states, and date/time-zone wording use existing native design/localization
  conventions. Verify the actual screen on an available device/simulator when
  authorized; do not close the user's simulator.

## Validation and handoff

Use scoped contract and workflow checks plus the minimal native validation
needed for changed model/transport/UI code. The user has asked to avoid repeated
heavy builds/tests: do not repeatedly invoke `xcodebuild`, run all suites, or
start simulator tooling automatically. Record checks actually run and any
untested device behavior. A build/device run can be scheduled explicitly when
the implementation is ready to review.

Before marking the iteration implemented, record the actual routes, handlers,
schema/migration, seed command, native entry points, failure/retry behavior, and
privacy checks in this roadmap. Update `product-model.md`,
`experience-blueprints.md`, `data-model.md`, and `server.architecture.md` to
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
