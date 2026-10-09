# Gatherory Product Model

This document records the agreed product hierarchy for Gatherory. It guides
database modeling, authorization, navigation, template publishing, and future
marketplace work.

Gatherory is one event-planning product with two complementary experiences:

1. people and teams create and coordinate their own events; and
2. professional planners create reusable, branded event templates that other
   people can discover and use.

The product borrows Vercel's clear scope and resource hierarchy without copying
Vercel's deployment domain or turning Gatherory into a collection of separate
applications.

## Release boundary

The first release is intentionally smaller than the complete model in this
document.

### Now: core event planning

- A user signs up and receives a personal event workspace.
- The user can create additional event workspaces and switch between them from
  the account-level workspace directory.
- The user creates a main event and optional child events.
- Hosts invite collaborators and guests to individual events.
- Every event owns its participant list, planning permissions, and attendance
  responses.
- Ideas, decisions, timeline entries, registry items, and notes are built in
  the context of an event.

### Later: professional ecosystem

- business and planner workspaces;
- branded and versioned event templates;
- public creator profiles, discovery, and marketplace surfaces;
- template licensing, commerce, reviews, and planner engagement; and
- business administration UI.

The later capabilities remain part of the architecture so the core does not
need an ownership migration, but they must not add UI or workflow complexity to
the first release. A disabled label in the web shell may communicate the future
direction; it is not a promise that the capability is currently available.

## Core hierarchy

| Vercel concept | Gatherory concept |
| --- | --- |
| Account | User |
| Personal or team scope | Workspace |
| Project | Main event |
| Project resources | Sub-events, ideas, decisions, people, and registry |
| Project template | Event template |
| Template creator | Planner or event-business workspace |

```text
user
  -> workspace membership
      -> workspace
          -> main events
              -> zero or more child events
              -> ideas and decisions
              -> participant assignments
              -> registry
              -> invitation experience
          -> event templates
              -> immutable published versions
```

## Users and workspaces

A **user** is one authenticated identity. A **workspace** is the ownership and
collaboration scope in which durable resources are created.

Every new user receives a personal workspace. A user may also belong to one or
more business workspaces, such as a wedding planner, venue, photographer, or
event-production company.

Workspace roles describe workspace administration:

- **Owner** manages the workspace, membership, billing, and destructive actions.
- **Admin** manages members and workspace resources according to policy.
- **Member** works with resources made available inside the workspace.

The interface calls this concept a **Workspace**. Better Auth's Organization
plugin may provide the underlying membership implementation, but provider
terminology must not leak into the product domain.

The first release uses the Organization plugin as infrastructure for the
automatically provisioned personal workspace and any additional event
workspaces a user creates. Its Teams feature creates a default **Planning**
team in each workspace and supplies active-workspace, active-team, member,
invitation, and lifecycle hooks that later business workspaces can reuse.
Gatherory still presents this as an event workspace, not an organization.

Better Auth membership and event participation are deliberately separate. A
workspace member can administer workspace-owned resources; an event
participant can access only the event assignments granted to them. In
particular, guests must not become organization members merely because they
receive an event invitation.

Workspace membership does not automatically grant access to every event owned
by the workspace. Event access remains explicit and event-scoped.

The signed-in workspace surface is URL-scoped. `/workspaces` is the
account-level directory for creating and selecting workspaces, while
`/workspaces/:workspaceSlug` is the selected workspace surface. The workspace
switcher includes both workspaces where the user is a Better Auth member and
workspaces where the user has an explicit event-participant record. This keeps
guest and collaborator access usable without promoting every participant to a
Better Auth organization member. Selecting a workspace changes the URL and
limits the surface to that workspace's authorized events.

## Events

A **main event** is the top-level Gatherory resource and is analogous to a
Vercel project. It owns the complete planning context, including its invitation
experience, participants, ideas, decisions, registry, and scheduled children.

The event tree has a maximum depth of two:

```text
main event
  -> zero or more child events
```

A child event cannot contain child events. Child events may represent either:

- **Planning and scouting** — work that helps bring the main event to life,
  such as venue tours, fittings, tastings, or vendor meetings.
- **Part of the experience** — something attendees may experience, such as a
  ceremony, dinner, after-party, excursion, or farewell brunch.

Main events and child events use the same event details and invitation
presentation where applicable. Child-event screens omit nested-event controls
because deeper nesting is not allowed.

An event belongs to exactly one workspace. Moving an event between workspaces
is a deliberate future workflow, not a change to `workspaceId` performed by a
generic update operation.

## Event participation

Event roles describe a person's relationship to a specific event:

- **Host** manages the event and its people.
- **Collaborator** helps plan according to the participant assignment.
- **Guest** receives the invited experience and controls their own response.

Workspace and event roles answer different questions:

- workspace membership answers who may operate within a workspace;
- event participation answers what a person may do in a particular event.

Creating a child event copies the main event's participant assignments as an
initial snapshot. Each event then owns independent participant records. Later
changes to a parent event do not silently rewrite child-event participation.

The same rule applies to professional planners: using a planner's template does
not give that planner access to the consumer's event. A consumer who hires the
planner must separately invite the planner or a planner-workspace member as an
event collaborator.

## Event templates

An **event template** is a reusable blueprint owned by a workspace. Templates
can be created by individuals, but the professional ecosystem is centered on
business workspaces with a public profile and recognizable brand.

A template may define:

- the main-event structure and defaults;
- suggested child events and their planning/experience classification;
- idea categories and starter ideas;
- decision prompts and planning milestones;
- invitation sections and guest-facing information;
- dress-code, music, registry, and experience configuration;
- reusable copy, imagery, colors, and branding; and
- prompts for information the consumer must supply.

A template must not contain real guests, private customer notes, credentials,
or customer-specific personal information.

### Template visibility

- **Private** — available only within the owning workspace.
- **Unlisted** — accessible through a direct link but absent from discovery.
- **Public** — eligible for search, creator profiles, and marketplace surfaces.

### Template lifecycle

- **Draft** — editable and visible only to authorized workspace members.
- **Published** — has at least one immutable version available for use.
- **Retired** — no longer offered for new installations; prior installations
  and their attribution remain valid.

Publishing creates an immutable **template version**. Continued editing creates
a new draft that may later become another version. Published versions are never
changed in place because consumers must be able to identify exactly what they
used.

## Using a template

The consumer flow is:

1. Discover or directly open a template.
2. Review its creator, content, branding, and terms.
3. Choose **Use this template**.
4. Select the destination workspace.
5. Create a new main event and its starter resources from the selected version.
6. Continue editing the resulting event independently.

Installation materializes a snapshot; it does not leave the event dependent on
the template's live records. The installation record retains attribution to the
template and exact version used, while the generated event data belongs to the
consumer's workspace.

Future template updates must never silently alter an existing event. Gatherory
may later provide an explicit update comparison or migration flow, but applying
an update always requires an informed user action.

Template use and professional service engagement are separate concepts:

- **Template use** copies a blueprint and grants no event access to its creator.
- **Planner engagement** is an explicit relationship in which the consumer
  invites a planner to collaborate on an event.

This separation supports self-service templates, fully managed planning, and
hybrid offerings without weakening event privacy.

## Discovery and creator ecosystem

A public planner or event-business profile may eventually expose:

- business name, logo, description, and service region;
- published templates and featured experiences;
- categories, specialties, and supported event types;
- verified links and contact or engagement actions; and
- pricing or licensing information when commerce is introduced.

Search results identify both the template and its publisher. A consumer should
understand who created an experience before installing it.

Marketplace publication, purchasing, licensing, reviews, verification, and
payouts are later capabilities. The initial data model must leave room for them
without making billing a requirement for private or free templates.

## Navigation principles

Gatherory should preserve the user's current scope and make it visible:

- A workspace switcher selects the personal or business context.
- `/workspaces` is the account-level directory for every member workspace and
  every event workspace explicitly shared with the signed-in user.
- The canonical workspace route is `/workspaces/:workspaceSlug`; `/` redirects
  to the user's active or default workspace.
- The workspace overview presents main-event cards with search, filters, and
  grid/list presentation.
- **Create New** starts from a blank event or an event template.
- Workspace navigation contains Events, Templates, People, and Settings as
  those capabilities become available.
- Event navigation contains Home, Ideas, Decide, Timeline, People, and Registry
  according to the active event context.
- Resource settings belong to their resource rather than becoming global
  workspace settings.

URLs should encode stable workspace and resource context where practical. The
workspace slug is a readable locator, not an authorization credential. The
workspace route independently resolves the signed-in user's Better Auth
membership or event-participant access before rendering. Every server operation
still resolves the required workspace or event assignment independently.

## Authorization boundaries

There are two related authorization layers:

1. **Workspace authorization** protects workspace administration, membership,
   template authoring, publishing, and workspace-owned resource creation.
2. **Event authorization** protects event details, participant information,
   ideas, decisions, timeline entries, registry items, and notes.

Owning an event through a workspace is not, by itself, sufficient evidence that
the current user may read or modify it. Event handlers resolve an explicit event
participant assignment unless the operation is a narrowly defined workspace
administrative workflow.

Template installation crosses both boundaries: the caller must be allowed to
read the template version and create an event in the destination workspace. The
installation workflow creates the event, assigns its initial hosts, copies
template content, records attribution, and commits those writes atomically.

## Implementation sequence

1. **Complete:** use Better Auth organizations and teams for workspace and
   planning-team persistence, including automatic personal provisioning.
2. **Complete:** make every main event belong to one workspace while preserving
   event-scoped participant authorization.
3. **In progress:** complete event creation, event invitation acceptance, and
   participant management end to end.
4. Build ideas, decisions, timeline, registry, and notes against the active
   event context.
5. After the core product ships, add template, template-version, and
   template-installation models.
6. Implement private template authoring and installation before public
   discovery.
7. Add business profiles, unlisted/public publishing, and search.
8. Introduce commerce and professional engagement only after ownership and
   authorization behavior are stable.

## Decisions recorded

- Gatherory remains one product, not a multi-application platform.
- Workspace is the ownership and publishing scope.
- Main event is the top-level planning resource.
- Event trees have at most two levels.
- Workspace roles never replace event roles.
- Template versions are immutable after publication.
- Installing a template creates an independently editable snapshot.
- Template creators receive no consumer-event access by default.
- Planner collaboration always requires an explicit event relationship.
- Better Auth organizations and teams implement workspace coordination, not
  event attendance.
- Professional workspaces and the template ecosystem are explicitly deferred
  until after the core event-planning release.
