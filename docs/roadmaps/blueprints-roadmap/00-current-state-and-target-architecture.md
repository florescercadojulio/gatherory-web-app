# 00 — Current State and Target Architecture

## Current implementation

Observed on 2026-10-13; recheck before implementation because another feature is
actively changing shared event, media, and sync code.

| Area | Existing behavior | Gap for this iteration |
| --- | --- | --- |
| `src/contracts/experience.contracts.ts` | Schema-v1 envelope, roles, module metadata, generic `config`, duplicate-key checks | No executable, typed configuration for events, ideas, or instructions; no capability enforcement |
| `contracts/examples/` and `tests/contracts/experience-contracts.test.ts` | Destination wedding, cabin stay, and package fixtures | No Wedding/Birthday/Thanksgiving catalog or installation behavior |
| `scripts/generate-contract-schemas.ts` | Generates JSON Schema from Zod sources | New supported module shapes need generator and fixture coverage |
| `src/db/schema/` | Auth, events/participants, planning, media, sync | No blueprint, published revision, installation, or reusable instruction records |
| `src/server/workspaces/handlers/workspace.handlers.ts` | Creates/provisions workspaces and a main event | No template selection; creation mixes Better Auth calls and product writes |
| `src/server/events/` | Effect services/repos, event creation and authorization | Existing repo-owned transactions cannot simply be nested inside an atomic installation |
| `src/server/sync/` | Native mutation ingestion, canonical materialization, snapshots/change log; web insights read canonical tables | A canonical blueprint installation is not automatically a native bootstrap/sync result |
| Swift `Models/ExperienceContracts.swift` | Decodes generic blueprint documents; checks envelope version | No per-module capability check or creation integration |
| Swift `App/WorkspaceLibrary.swift` and `Features/Workspaces/WorkspaceBrowserView.swift` | Creates a local blank planning workspace with an owner and no ideas/events | No server-owned template creation flow; timeline items require `scheduledAt` |

The old example documents are architecture fixtures, not a usable catalog.
In particular, `suggestedChildren` is currently an array of strings in the
wedding JSON fixture, while the architecture prose has an object example. Do
not choose one implicitly and break readers; define new module versions.

## First-iteration product boundary

Deliver the whole path: curated starter → private editable draft → preview →
published revision → native selection/review → independent event.

Curated starters are Wedding (`wedding`), Birthday Party (`birthday_party`), and
Thanksgiving (`thanksgiving`). Experience types are stable strings, not a
closed database enum. Display names are editable/localizable content. A custom
template can use `other`; arbitrary names do not enable arbitrary capabilities.

The system catalog is deployment-managed. Signed-in users can inspect its
published entries and copy one into a workspace they administer. Private
templates belong to a personal event workspace; no business workspace or
professional subscription is required. First-iteration consumers use system
entries or private entries they are independently authorized to read.

Airbnb-style experiences remain a later catalog/product surface. Reserve the
existing `property_stay` experience type and support instructions and suggested
activities generically now. Resource ownership, separate guest stays, bookings,
private family journals, and property access credentials require later slices.

## Source of truth and ownership

Published documents are bounded, immutable configuration. Live events,
participants, ideas, and instructions are canonical PostgreSQL records.
Published revisions never act as a live event's mutable data source.

Blueprint access uses workspace membership and explicit workspace resource
permissions. Event participation alone does not authorize template authoring.
Installation checks both source-read access and destination-create access.
Installed events use ordinary event participant permissions. The initial host
is the authenticated installer; child participant assignments are independent
snapshots from the newly created main event. Template author IDs, sample people,
and arbitrary role declarations never become participant assignments.

Curated system entries are the one ownership exception: a `source = system`
record has no customer owner and only deployment tooling may alter its draft or
publish revisions. User-created records require an owning organization. Never
trust a client-supplied system flag or reuse moderation-admin access implicitly.

## Target storage

Place blueprint tables in `src/db/schema/blueprint.schema.ts`; event-owned
configuration/instructions can have their own `event-guide.schema.ts`. Exact
Drizzle names follow repository conventions; preserve these responsibilities:

| Record | Responsibility and constraints |
| --- | --- |
| `experience_blueprint` | Stable UUID, optional stable system catalog key, source, owning organization for private entries, draft document, optimistic `draftVersion`, lifecycle, audit fields. Source/owner check constraint; scoped indexes. |
| `experience_blueprint_revision` | Blueprint ID + unique positive revision, canonical validated document, content hash, publication metadata. Content cannot be updated after publication; enforce through narrow repos and a DB update guard. |
| `experience_blueprint_installation` | Actor + unique request UUID, request hash, exact source revision snapshot, provisioning status, optional destination IDs while pending, completed item-key-to-record-ID manifest. Completed content/provenance is immutable. |
| `event_experience_configuration` | One scoped row per main event: experience type, selected capability configuration/category order, optional installation reference. This is the independent live configuration. |
| `event_guide_section` | Scoped event ID, stable section key, title, bounded plain-text body, order, visibility, attribution/audit metadata. Ordinary event content after installation. |

Use same-workspace foreign keys for event-owned rows. Installation provenance
retains the sanitized revision snapshot and creator attribution when an origin
workspace/template is deleted; nullable source FKs may be cleared. Deleting a
consumer event removes its event-owned configuration and installation records
under the existing lifecycle policy. Resolve FK cycles deliberately rather than
adding cascading links in both directions.

No bulk backfill of live user events into templates. Blank events without a
configuration row retain existing behavior. Publication retirement hides a
template from new selection but does not disable installed events.

## Supported configuration

Keep the envelope at schema v1 only while changes remain compatible with its
existing structure. Register typed supported module versions:

- `experience_tree` v2: keyed suggested direct children, title, description,
  existing event category, purpose, and optional relative schedule proposal.
- `ideas` v2: category order and keyed starter ideas with title, category, note,
  and target `main` or a suggested-child key. Start with basic idea fields;
  produce a supported default category configuration through a platform adapter.
- `instructions` v1: ordered keyed sections, title/body, event target, and
  `planning_only` or `event_participants` visibility.

Module `required` means required software capability, not mandatory attendance
or forced inclusion of a suggested activity. Templates cannot disable server
authorization, change moderation policy, define executable expressions, or add
new event/idea enum values. Blueprint portable role labels map to existing
server policies; dotted permissions in old fixtures are not executable access
control statements. New authoring exposes only supported host/collaborator/guest
presets and prevents privilege escalation.

Unknown optional modules can be retained in documents and skipped with a clear
preview notice. Unknown required modules/versions prevent installation before
any event is created. Unsupported or invalid known configuration fails
validation, even when its module is optional. Keep older fixtures valid as
documents, but do not pretend they are installable through this new subset.

## Temporal and content decisions

The user supplies the main event's date, time zone, optional end, and optional
location. Thanksgiving never assumes a country, year, or holiday date. Birthday
templates never require a birth date or age. Wedding templates never assume a
couple's genders, traditions, or participant names.

Suggested children are optional and initially unchecked. A selected child
requires a confirmed start; relative proposals use local calendar-day offsets
and local clock times in the selected IANA zone. Explicitly handle ambiguous
and missing times around DST. Do not fill an unknown schedule with today's
date or silently approve a proposal. Confirmed selected children become ordinary
approved scheduled events; starter ideas remain undecided (`new`).

Starter ideas default to selected and may be deselected. Items targeting an
excluded child are excluded with it, shown in the review, and never silently
moved to the main event. Instructions are copied for included targets; the host
reviews which participant-visible guidance will be shared. Private planner
instructions remain excluded from guest queries and guest sync projections.

## Responsibilities and tradeoffs

Use `src/server/blueprints/{contracts,handlers,workflows,services,repos}` and the
standard Effect boundary. Shared blueprint contracts stay client-safe in
`src/contracts/`. Web forms and Swift views consume contracts; neither writes
template-shaped JSON into native replication as a source of live truth.

Publish and install workflows own their transactions. Split transaction-aware
event/idea repository operations where necessary; do not call a transaction-
opening handler/repo repeatedly and claim the batch is atomic. Keep this refactor
limited to the creation path used by blueprints.

Better Auth workspace provisioning precedes the product transaction and needs a
durable retry record. The installation workflow must resume after failures and
must not delete a pre-existing or user-modified workspace as compensation.
The canonical event tree, ideas, guide sections, live configuration, provenance,
and sync delivery records commit together (see `03`).

Blueprint-specific media selection, rich text, custom forms, public sharing,
licensing, and payment are deferred. Text-only authoring and normal per-event
cover selection avoid introducing private cross-workspace media references in
this iteration.
