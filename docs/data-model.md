# Gatherory Data Model

This document maps the current iOS product model to the server-owned Drizzle
schema. It is the reference for API contracts, sync work, and future web
surfaces.

## Product language and storage language

People create and switch between **events** in the interface. Internally, each
event planning space is backed by one Better Auth organization, which the code
calls a **workspace**. That boundary owns permissions, media, and billing-ready
resources without putting organization terminology in front of a host or
guest.

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
budget, people, and cover. The web creation flow asks for the durable details
needed to create a useful event immediately:

- event name;
- start and optional end, all-day state, and time zone;
- optional location name and address; and
- optional budget cap.

Creation provisions the Better Auth organization, Planning team, main event,
host participant, and workspace planning settings as one workflow. Cover media
and invitations use their existing focused flows after creation. This keeps
initial setup short without creating an empty workspace shell.

## Schema ownership

| Concern                       | Tables                                                            | Notes                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Identity and workspace access | `user`, `organization`, `member`, `team`, `team_member`           | Better Auth owns authentication and workspace membership.                                                                         |
| Event tree                    | `event`                                                           | A null `parent_event_id` is the main event. A non-null parent is a direct child.                                                  |
| Event people                  | `event_participant`, `event_invitation`                           | Every event has its own participant snapshot. New child events copy, then diverge from, the main event roster.                    |
| Workspace planning defaults   | `workspace_planning_settings`                                     | Workspace budget and collaboration defaults that do not belong to a single child event.                                           |
| Ideas                         | `idea`, `idea_decision`                                           | Ideas are scoped to the active event context. Titles may be omitted when the category configuration already names the idea.       |
| Category-specific idea setup  | `idea.configuration`                                              | Versioned JSON for focused fields such as attire style or food servings. The relational category is the discriminator.            |
| Music                         | `music_track`, `idea_music_track`                                 | Provider-neutral catalog records. Apple Music is first; Spotify or another provider can be added without changing idea ownership. |
| Costs                         | `event_expense`                                                   | A cost belongs to exactly one event and may retain a stable source-idea link.                                                     |
| Notes                         | `event_note`                                                      | Event-context message with the product's 750-character limit enforced in PostgreSQL.                                              |
| Registry                      | `registry_item`, `registry_commitment`                            | Approved registry ideas can materialize as items. Commitments are per user and quantity.                                          |
| Media                         | `media_asset`, `event_media`, `idea_media`, `registry_item_media` | Storage metadata is independent from typed placement and display order.                                                           |

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
The base row owns status, category, optional title and note, estimated cost,
submitter, and the versioned category configuration.

Votes are separate `idea_decision` records keyed by idea and user. This avoids
overwriting another participant's choice and supports aggregate decision UI
later. Approving an event or registry idea may materialize an `event` or
`registry_item`, while retaining the source idea for traceability.

## Cross-workspace safety

Workspace-owned tables repeat `organization_id` where it is needed to enforce
composite foreign keys. This prevents media, ideas, costs, and registry items
from being attached to a resource in a different workspace even if an ID is
known. Route slugs remain locators, never authorization credentials.

## Deferred model

Professional planner workspaces and published templates remain described in
`product-model.md`, but no marketplace tables are added yet. The current schema
prioritizes the first release: a host creates an event, invites people, and
plans through event-scoped ideas, decisions, and details.
