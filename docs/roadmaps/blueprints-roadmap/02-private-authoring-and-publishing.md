# 02 — Private Authoring, Preview, and Publishing

**Status:** Implemented locally October 15, 2026; deployment and manual visual acceptance remain open.
**Priority:** P1
**Depends on:** 01

**Delivery gate:** share the pure planner from `01` and prove the internal
install-to-native path in `03`/`04` before completing this UI. See `00a`; preview
and forms are not evidence that installation or native delivery works.

The [October 15 assessment](05-product-experience-and-billing-sequence.md)
recommends curated native setup before paid Event Pass rollout and completion of
this authoring UI afterward. This remains planned first-iteration scope, not a
new paid feature or a prerequisite for billing. The user subsequently selected this
slice before billing to prove cottage reuse. Its private-template acceptance
criteria still apply before declaring the whole blueprint iteration complete.

## Implemented boundary

`/blueprints` provides private draft creation, curated customization, editing,
saved-draft preview, immutable publication, retirement and unpublished-draft
deletion. The collection uses scoped search, source/status filters and pagination.
The account route authenticates without provisioning or changing the active
workspace. Only owners of the explicitly selected workspace can manage or
install its private templates in this first slice; event-only guests,
collaborators and ordinary organization members do not gain template access.
Missing authoring workspace creation is an explicit, recoverable action.

Supported content is names/descriptions, direct-child activities, optional
`main_start` date proposals, undecided ideas and plain-text audience-scoped
instructions. The editor uses TanStack Form and keyboard reorder controls.
It prevents removing activities while ideas/instructions still target them.
Each consumer still chooses activities/ideas and confirms dates in native setup.
Preview dates are illustrative only and never create or schedule anything.

`blueprint_template` holds mutable versioned drafts; `blueprint_revision`
holds immutable publications. Save compares `expectedVersion`. Publish locks
the draft and writes the snapshot and pointer in one Effect SQL transaction;
the saved draft version is its idempotency key. Source access is checked for
catalog, preview, schedule, new claims, pending retries and final completion.
Completed installations retain independent copies and existing host checks,
even when a source is retired. Existing Better Auth provisioning remains outside
the canonical/native completion transaction.

Apply the additive `20261015152051_loose_owl` migration after the initial
blueprint migration. See [11 — Cottage authoring proof](11-private-cottage-proof.md)
for seed fixtures, verification and exact deployment limits. No migration or seed
has been applied to the user's development or production database by this task.

## What this is / why it exists

A host configures a reusable template through ordinary controls. Saving a draft
and publishing a reusable version are explicit, distinct actions.

This web editor is also the future configuration surface for property stays,
family cottages, and package recommendations. Keep template composition on the
web rather than duplicating it in iOS. The initial editor still handles only
supported modules; QR distribution, checklists, reminders and richer place
configuration require separate slices. See [10](10-host-authored-experiences.md).

## Target behavior

Add an account-level **Templates** destination in the existing protected shell.
Use `/blueprints` internally with folder-owned routes:

```text
src/routes/_protected/blueprints/
  index.tsx
  new/index.tsx
  $blueprintId/
    index.tsx
```

The collection includes curated starters and authorized private templates,
with source/status filters, search, and pagination through `EntityTablePage`.
Use **Customize** for a curated entry: it creates a private copy with source
attribution and fresh identity. It never modifies the system definition.

Use the existing personal workspace for ownership where possible, even before
it contains an event. If there are multiple eligible workspaces, show an explicit
owner selection; revalidate that selection server-side. Do not derive ownership
from an arbitrary active guest event or require an unrelated event to be created
just to author a template. Authoring context reads must not silently switch the
active event or organization.

The existing `WorkspaceService.provisionPersonal` does change active organization
and team. Reuse its connector/repository operations selectively; do not invoke it
as an authoring-context read. Treat creation of a missing authoring workspace as
an explicit, recoverable action.

The editor uses TanStack Form, shadcn controls, and these sections:

1. Name, description, and supported experience type.
2. Suggested activities: name, purpose, category, optional relative scheduling
   guidance; direct children only.
3. Starter ideas: category, title, note, and target event; optional default
   inclusion. Reuse related-item selection patterns where useful.
4. Instructions: heading, plain-text body, target event, order, and visibility.
5. Preview: resolved structure, idea counts, instructions by audience, capability
   warnings, and what a consumer will be asked to fill in.

Allow keyboard-accessible reordering/removal; do not require drag gestures.
Changing/removing an activity explains dependent ideas/instructions and requires
the author to remove or explicitly retarget them. A validation error keeps all
entered content. No raw JSON or permission editor is needed.

`Save draft` uses expected `draftVersion`. Concurrent edits return a recoverable
conflict instead of overwriting another editor. `Publish` validates and snapshots
that exact saved draft version in one transaction; require saving unsaved edits
first. Retrying the same publish request returns the same revision. New edits
after publishing form a new draft; the last published version remains available.
`Retire` removes the entry from new selection while preserving existing events
and provenance. Unpublished private drafts can be deleted explicitly.

## Architecture boundary

Planned handler/workflow operations: list catalog, get draft, create/copy draft,
update draft, preview draft, publish revision, retire template, delete draft.
Use session middleware, workspace authorization, input contracts, one Effect
workflow, and one safe result boundary per operation. Repositories own scoped
pagination, draft version comparison, and publication locks inside the
workflow's transaction. UI receives narrow DTOs and never server singletons.

Preview uses the same semantic validation and expansion planner as installation.
It writes no events, participants, decisions, notifications, or sync records.
Published preview always identifies the exact revision and its authored locale.

Add interface copy under an English `blueprints` catalog section. Follow
`docs/development/page-creation.md` for breadcrumbs/header controls and route generation.
The current shell does not consistently have the guide's described RouteHeader
helper; inspect what exists and reuse the working header, or add the smallest
shared helper needed. Do not invent a second shell or restructure unrelated pages.

## Acceptance criteria

- A host can customize each starter, save, reload, preview, publish, and reopen it.
- The editor shows the three different sets of content without experience-name
  conditionals controlling server persistence.
- Draft data is never exposed as published content or visible to an event-only guest.
- Published version 1 remains unchanged after saving/publishing version 2.
- Concurrent saves and publish retries have deterministic conflict/replay behavior.
- Instruction visibility and omitted-child dependencies are clear in preview.
- Forms work by keyboard, at small viewport widths, in both themes, and with
  loading/empty/unauthorized/error states. Check visually when a local session
  is available; keep evidence and any limits in the roadmap.
- Targeted tests cover workspace access, conflict handling, and publication
  behavior. Regenerate routes and typecheck; no production build is required.

## Explicit deferrals

No public/unlisted publishing, rich-text builder, template upload/import, AI
generation, media sharing, arbitrary question/field builder, sales, or native
template-authoring screen. Publishing in this iteration means a usable private
version or a deployment-managed system starter, not public distribution.
