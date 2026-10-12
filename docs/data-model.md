# Gatherory Data Model

This document maps the current iOS product model to the server-owned Drizzle
schema. It is the reference for API contracts, sync work, and future web
surfaces. PostgreSQL is the canonical shared model; the iOS graph is an
offline-first projection, and native sync tables are replication
infrastructure rather than a second product model.

## Product language and storage language

People create and switch between **events** in the interface. Internally, each
event planning space is backed by one Better Auth organization, which the code
calls a **workspace**. That boundary owns permissions, media, and billing-ready
resources without putting organization terminology in front of a host or
guest.

`organization.workspace_type` is a database enum. Every organization created
by the first-release product is `event`; `business` is reserved only as a clean
future discriminator. The first release does not create business profiles,
professional engagements, or template-marketplace records.

```text
user
  -> workspace membership (Better Auth organization)
      -> one main event
          -> direct child events
          -> participants and invitations
          -> ideas and decisions
          -> notes, costs, media, music, and registry
```

The event tree has a maximum depth of two. The database guarantees one main
event per configured workspace with a partial unique index; the event workflow
rejects a child whose parent is already a child.

## Workspace setup

The iOS `NewWorkspaceView` asks for an event name, location, date and time,
budget, and cover. The web creation flow asks for the durable details needed to
create a useful event immediately:

- event name;
- start and optional end, all-day state, and time zone;
- optional location name and address; and
- optional budget cap.

Creation provisions the Better Auth organization, Planning team, main event,
host participant, and workspace planning settings as one workflow. Cover media
and invitations use their existing focused flows after creation. This keeps
initial setup short without creating an empty workspace shell.

## Schema ownership

| Concern | Tables | Notes |
| --- | --- | --- |
| Identity and workspace access | `user`, `organization`, `member`, `team`, `team_member` | Better Auth owns authentication and workspace membership. |
| Event tree | `event` | A null `parent_event_id` is the main event. A non-null parent is a direct child. |
| Workspace people | `workspace_person` | Stable person identity before or after account signup. A nullable `user_id` links the contact to Better Auth after acceptance. |
| Event people | `event_participant`, `event_invitation` | Event-specific role, permission, RSVP, and invitation state. New child events copy, then diverge from, the main event roster. |
| Workspace planning defaults | `workspace_planning_settings` | Workspace budget, ISO 4217 currency, and collaboration defaults that do not belong to one child event. |
| Ideas | `idea`, `idea_decision` | Ideas are scoped to the active event context. Titles may be omitted when category configuration already names the idea. |
| Category-specific idea setup | `idea.configuration` | Versioned JSON for focused fields such as attire style or food servings. The relational category is the discriminator. |
| Music | `music_track`, `idea_music_track` | Provider-neutral catalog records. Apple Music is first; another provider does not change idea ownership. |
| Costs | `event_expense` | A decimal cost belongs to exactly one event and may retain a stable source-idea link. |
| Notes | `event_note` | Event-context message with the product's 750-character limit enforced in PostgreSQL. |
| Registry | `registry_item`, `registry_commitment` | Approved registry ideas can materialize as items. Commitments are per user and quantity. |
| Media | `media_asset`, `event_media`, `idea_media`, `registry_item_media` | Storage metadata is independent from typed placement and display order. |
| Native replication | `native_workspace_snapshot`, `native_sync_entity`, `native_sync_scope_member`, `native_sync_change` | Snapshot compatibility plus independently versioned entities and scope-based access. |

## iOS mapping

| PostgreSQL | iOS |
| --- | --- |
| `organization` + `workspace_planning_settings` | `WeddingWorkspace` |
| root `event` | main-event fields on `WeddingWorkspace` |
| child `event` | `TimelineItem` |
| `workspace_person` | `WeddingMember` |
| `event_participant` | `EventParticipation` |
| `idea` | `WeddingIdea` |
| `event_expense` | `EventExpense` |
| `event_note` | `EventNote` |
| `registry_item` | `RegistryItem` |
| `media_asset` + placement | `EventMoment.mediaAssetID` and local upload state |

`WeddingMember` can exist without an account. Its optional Better Auth user ID
is linked after invitation acceptance. Role and RSVP are event-specific and
live in `EventParticipation` / `event_participant`.

The native archive is not a wire DTO. Several Swift case names intentionally
read naturally in app code (`chosen`, `maybe`, `viewOnly`), while PostgreSQL
uses stable API values (`approved`, `not_sure`, `view_only`). The
materialization adapter translates these enums explicitly; it must not
persist Swift raw values directly into normalized enum columns.

Every mutation and remote envelope declares a `payloadSchemaVersion`. Version
1 remains the compatibility default for clients and deployments created before
the field existed. Unsupported future versions are rejected at the transport
boundary before their payload reaches materialization.

## Event state

Main events use the lifecycle states `draft`, `ongoing`, and `finished`.
Child events also have a planning state: `draft`, `approved`, `not_sure`,
`rejected`, or `archived`. Completion (`upcoming` or `complete`) and scheduling
(`scheduled` or `unscheduled`) are separate because they answer different
questions.

Child events are classified by purpose:

- `planning_scouting` helps bring the main event to life; and
- `part_of_event` is part of the attendee experience.

Their category records the familiar event tile selected in the iOS editor,
such as venue, tasting, rehearsal, ceremony, or reception.

## Ideas and decisions

An idea always belongs to an event, including a child-event planning context.
The base row owns status, category, optional title and note, decimal estimated
cost, submitter, and the versioned category configuration.

Votes are separate `idea_decision` records keyed by idea and user. This avoids
overwriting another participant's choice and supports aggregate decision UI
later. Approving an event or registry idea may materialize an `event` or
`registry_item`, while retaining the source idea for traceability.

## Cross-workspace safety

Workspace-owned tables repeat `organization_id` where needed to enforce
composite foreign keys. This prevents media, ideas, costs, and registry items
from being attached to a resource in another workspace even if an ID is known.
Route slugs remain locators, never authorization credentials.

## Native replication

`native_workspace_snapshot` is a compatibility archive and maps each native
scope directly to its canonical Better Auth organization.
`native_sync_entity` records are the independently versioned collaboration
boundary. `native_sync_scope_member` authorizes all accounts that can read or
write a workspace; ownership of the latest payload is not authorization. This
membership is workspace-wide and therefore must never be inferred from a guest
or child-event invitation. Those relationships remain event-scoped.

Accepted native mutations are validated and materialized into normalized
product rows in the same PostgreSQL transaction that writes the native entity,
change cursor, and idempotency receipt. If canonical projection fails, the
entire mutation rolls back and receives a rejected result rather than an
`applied` receipt. Existing snapshots can be replayed idempotently with
`pnpm db:materialize-native` after the relevant migration is installed.

Signed-in hosts and collaborators are Better Auth organization members and may
receive native sync-scope membership. Guests remain workspace people and event
participants; they receive a guest-facing event projection rather than the
workspace planning graph.

## Required invariants

1. Every child record references an event in the same workspace.
2. A person appears at most once per workspace/account and once per event.
3. Host participation always has manage permission; guest participation is
   view-only.
4. Event deletion cascades through event-scoped planning records.
5. An idea-derived expense or registry item references at most one source idea,
   and that idea belongs to the same event and workspace.
6. Amounts and allocations are never negative and share the workspace currency.
7. Media sort positions are non-negative and storage keys are immutable.
8. Sync access is checked through scope membership for push, pull, and bootstrap.

## Deferred model

Professional planner workspaces and published templates remain described in
`product-model.md`. The broader cross-platform blueprint, package, resource,
participant-group, and contribution-visibility direction is recorded in
`experience-blueprints.md`. No speculative marketplace or generic-experience
tables are added yet. The current schema prioritizes the first release: a host
creates an event, invites people, and plans through event-scoped ideas,
decisions, and details.
