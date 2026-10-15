# Gatherory Experience Architecture

This document records the cross-platform architecture for extending Gatherory
beyond the first event-planning release. It defines the language shared by the
web application, native clients, Android, automation, and future MCP tools.

The first release remains event focused. The concepts below are extension
boundaries, not a requirement to expose generic configuration or professional
features in the release UI.

## Architectural decision

Gatherory uses a **versioned, declarative experience blueprint** as its reusable
configuration language.

- JSON is the interchange format.
- JSON Schema 2020-12 is the validation and compatibility contract.
- OpenAPI describes HTTP transport using those schemas.
- PostgreSQL remains the canonical source of live collaborative state.
- Swift, Kotlin, and TypeScript use generated or hand-written wire DTOs that
  adapt into platform domain models.
- MCP tools expose authorized domain operations with schema-defined inputs and
  outputs; they do not expose tables or native replication mutations.

The blueprint describes product meaning, not platform UI. It may describe a
money field, choice, visibility policy, or module order. It must not contain a
SwiftUI view name, SF Symbol, CSS class, Android resource, screen coordinate,
or other platform-specific instruction.

## Why experience is the durable boundary

An event is the first Gatherory experience, but the underlying product can
support other coordinated, time-bounded experiences:

- a wedding or destination wedding;
- a professional planner's customer engagement;
- a family cabin stay;
- a business retreat; or
- another experience assembled from capabilities supported by every client.

The product UI should continue to use familiar words such as **event**,
**wedding**, **stay**, **guest**, or **visitor**. The shared contract uses the
broader terms **experience blueprint** and **experience instance** where the
behavior truly applies across those products.

This is not a request to rename the first-release database wholesale. Existing
event tables and native models remain compatible while new public contracts use
the generalized language and explicit adapters.

## Core concepts

### Workspace

A workspace is the ownership, administration, and publishing boundary. It may
be personal or business owned. Better Auth organizations implement this scope,
but provider terminology does not belong in customer-facing product language.

### Resource

A resource is something persistent that experiences may use, such as a cabin,
venue, property, or reusable service location. A resource is not itself a
booking or event.

### Experience blueprint

A blueprint is reusable configuration owned by a workspace. It defines the
supported modules, defaults, roles, policies, and limited presentation hints
for a kind of experience. It contains no real participants, customer secrets,
RSVP responses, actual expenses, or private contributions.

Published blueprint revisions are immutable. Continued editing creates a new
draft and publication creates a new revision.

### Experience instance

An instance is live collaborative product state created from a blueprint or
from a blank supported experience type. Event rows, participants, ideas,
decisions, expenses, tasks, notes, and media remain normalized relational
records. Instantiation records the exact blueprint revision used, then the
instance evolves independently.

### Participant group

A participant group represents a household, family, party, team, or other
experience-local grouping. A person retains an individual identity and account
while gaining group-scoped permissions or contribution visibility.

### Contribution

A contribution is participant-authored content such as a journal entry,
recommendation, memory, photo, maintenance report, or idea. Its type and
visibility are explicit. Operational reports and private memories must not be
forced into the idea model merely because both can contain text and media.

### Service, package, proposal, and engagement

- A **service** is a reusable unit of professional work or a deliverable.
- A **package** is a marketable combination of a blueprint, included services,
  pricing rules, limits, and optional additions.
- A **proposal** is a package customized and quoted for one customer.
- An **engagement** is the explicit relationship granting a professional access
  to a customer's experience.

Using a template or buying a package never grants its creator access by
itself. Professional access always comes from an explicit engagement and
scoped participant assignment.

## Blueprint document

Every document identifies its contract kind and schema version separately from
its business revision:

```json
{
  "$schema": "https://schemas.gatherory.com/experience-blueprint/v1.json",
  "kind": "experience_blueprint",
  "schemaVersion": 1,
  "blueprint": {
    "id": "destination-wedding",
    "revision": 3,
    "name": "Destination Wedding"
  },
  "experienceDefaults": {
    "type": "wedding",
    "timeZone": "America/Detroit"
  },
  "roles": [
    {
      "key": "host",
      "permissions": ["experience.manage", "ideas.decide", "budget.manage"]
    },
    {
      "key": "guest",
      "permissions": ["invitation.view", "attendance.respond"]
    }
  ],
  "modules": [
    {
      "key": "schedule",
      "type": "experience_tree",
      "version": 1,
      "required": true,
      "config": {
        "suggestedChildren": [
          { "key": "ceremony", "category": "ceremony" },
          { "key": "reception", "category": "reception" }
        ]
      }
    },
    {
      "key": "ideas",
      "type": "ideas",
      "version": 1,
      "required": true,
      "config": {
        "categories": ["venue", "attire", "flowers", "food", "music"]
      }
    }
  ],
  "presentation": {
    "theme": "sage",
    "coverAssetId": null,
    "moduleOrder": ["schedule", "ideas"]
  }
}
```

Each module is a discriminated, independently versioned capability. Clients
must safely ignore optional unknown modules and must reject an unsupported
required module before allowing creation or destructive edits.

Portable custom fields are deliberately limited to supported semantic types:
short text, long text, money, number, date, URL, boolean, single choice, and
multiple choice. Cross-field and authorization rules remain server-side even
when JSON Schema validates the document's structure.

## Packages and professional planning

A package references an immutable blueprint revision rather than copying the
entire planning model. It adds commercial information such as destination,
capacity, included services, pricing rules, seasonal availability, and add-ons.

Accepting a proposal transactionally materializes the customer-owned
experience, its initial event tree and planning data, the accepted service and
price snapshot, and the professional engagement. Later edits to the published
package cannot silently change an accepted proposal or existing experience.

The experience budget and package price are distinct. The first describes what
the customer plans to spend across the experience; the second describes what a
provider charges for a defined commercial scope.

## Resource stays and private family experiences

Host-authored stays and package-based recommendations are an explicit product
direction, including rental properties and privately lent family cottages.
Fine-grained reusable configuration belongs in the web app; iOS remains the
lightweight discovery, copy, and day-to-day participation surface. QR codes will
open template previews, not join an owner's workspace. Each recipient creates
an independent instance. These capabilities are planned, not implemented; see
[host-authored experience direction](../roadmaps/blueprints-roadmap/10-host-authored-experiences.md)
for sharing/privacy rules, checklist/reminder boundaries, and delivery gates.

A cabin is modeled as a persistent resource. Each reserved week is a separate
experience instance created from a cabin-stay blueprint. The blueprint may
provide arrival directions, access information, rules, emergency contacts,
arrival tasks, departure cleaning tasks, and optional shared media. Sensitive
access information belongs in authorized stay-specific delivery, never public
or unlisted template content. Checklist definitions are separate from per-stay
completion; reminder delivery requires its own consent and lifecycle rules.

Families participate through a stay-local participant group. Visitor content
must declare one of the supported visibility policies:

- `author_only` — only the author;
- `participant_group` — the author's household or party in this experience;
- `experience_participants` — everyone assigned to this instance;
- `experience_managers` — the owner or authorized caretaker;
- `resource_community` — intentionally shared with future resource visitors;
- `external_public` — intentionally published outside the workspace.

Authorization is enforced while querying, projecting, and synchronizing data,
not merely while rendering it. A property owner does not implicitly receive
private participant-group content. If Gatherory later promises that even the
service operator cannot read private content, that requires a separate
end-to-end encryption design rather than only an authorization flag.

Closing a stay preserves the family's permitted memories while completing its
operational checklist. Creating the next stay resets tasks from the blueprint
and never copies the previous family's participants or contributions.

## Instantiation and revision behavior

Blueprint installation is a server-owned transaction:

```text
published blueprint revision
  -> validate client support and caller authorization
  -> create experience instance
  -> create initial events, modules, roles, and defaults
  -> record immutable provenance
  -> return the independently editable instance
```

An instance retains provenance containing the blueprint ID and revision. A
package-created instance additionally records package and proposal revisions.
Existing instances never follow mutable draft data. A future update flow must
show a semantic diff and require informed user approval.

## Wire rules

- IDs are UUIDs or opaque stable strings with one canonical representation.
- Enum values use `snake_case`; clients preserve or tolerate unknown values.
- Confirmed instants use RFC 3339 with explicit `Z`/offset and at most millisecond
  precision; calendar-only dates use `YYYY-MM-DD` without an invented midnight.
- Time zones use IANA identifiers such as `America/Detroit`.
  Server-only Temporal validates date/offset agreement; shared browser schemas
  do not require Temporal. Never resolve event dates using the viewer's zone.
- Text has explicit Unicode-code-point `minLength` / `maxLength` constraints;
  formatting rules and serialized-byte limits are separate safeguards.
- New blueprint-linked prices use integer minor-unit strings and currency:
  `{ "amountMinor": "125000", "currency": "USD" }` represents USD $1,250.00.
  Decimal-price strings, JSON numbers and ambiguous `amount` fields are rejected.
  Existing budget/native-sync formats are not reinterpreted by this convention.
- Media is referenced by stable asset ID and placement. Payloads do not contain
  image bytes or expiring signed URLs.
- Polymorphic values always contain a discriminator and schema version.

The checked-in JSON Schema and examples are the contract authority. TypeScript,
Swift, and Kotlin representations must be verified against shared fixtures so
one platform's encoder cannot silently become the protocol specification.
See [API and MCP contract conventions](../development/api-contract-conventions.md)
for exact limits, Unicode semantics, money validation and compatibility rules.

## API, native sync, and MCP boundaries

OpenAPI describes user-facing HTTP operations using the same JSON Schemas.
Native replication remains an offline transport with idempotent mutation IDs,
entity versions, cursors, and conflict behavior. It is not the public template
language and it must not expose a Swift `Codable` representation as the durable
cross-platform contract.

MCP exposes intent-level tools such as:

- `list_blueprint_capabilities`;
- `get_experience_blueprint`;
- `validate_experience_blueprint`;
- `create_blueprint_draft`;
- `publish_blueprint_revision`;
- `preview_blueprint`;
- `instantiate_blueprint`;
- `search_business_packages`; and
- `create_customer_proposal`.

Tool handlers apply the same authorization, semantic validation, and
transactional workflows as human-facing APIs. AI may propose draft content but
cannot directly write tables, set unvalidated prices, bypass engagement rules,
or submit native synchronization envelopes.

## Storage direction

Normalized PostgreSQL tables remain canonical for identity, workspaces,
resources, live experiences, people, permissions, events, planning state,
packages, proposals, and engagements. JSONB is appropriate for bounded,
versioned module configuration and immutable published revision documents; it
is not a replacement for relational participants, authorization, money,
attendance, or collaboration records.

Likely post-release additions are:

- `resource`;
- `experience_blueprint` and `experience_blueprint_revision`;
- `experience_blueprint_installation`;
- `participant_group` and group membership;
- typed contribution records with enforced visibility;
- `business_profile` and `service`;
- `service_package` and immutable package revisions;
- `proposal`; and
- `professional_engagement`.

Names and exact normalization should be finalized with the contract and use
cases. These tables are intentionally not added to the first-release migration
only to reserve them speculatively.

## Monetization and near-term delivery

The [monetization model](monetization-model.md) is distinct from future paid
template licensing or business packages. Curated starter use is free; an Event
Pass later enables collaborative planning for an installed main event and its
children, just as for a blank-created plan. It does not grant template authoring
access or expose parent/sibling data to a child-only participant.

The [product-experience assessment](../roadmaps/blueprints-roadmap/05-product-experience-and-billing-sequence.md)
originally recommended curated native setup before paid billing and private
authoring afterward. The subsequent explicit request moved private web authoring
and cottage reuse before billing; see the [implemented local proof](../roadmaps/blueprints-roadmap/11-private-cottage-proof.md).
Release acceptance, live guide editing and future distribution remain open.
Billing and installation must remain separate
recoverable operations; neither is a technical prerequisite for the other.

## Evolution strategy

The unreleased native model now uses experience-neutral names throughout:
`PlanningWorkspace`, `PlanningIdea`, `WorkspaceMember`, `WorkspaceRole`, and
`mainEventStartsAt`. Wedding remains a supported experience type and fixture,
not a storage or runtime assumption. Evolution after release should be
additive:

1. **Complete:** establish contract sources plus generated JSON Schemas,
   examples, and cross-platform fixtures.
2. **Complete:** add schema versions to native entity payloads and align the
   Swift and TypeScript contract vocabulary before release.
3. Introduce blueprint authoring and immutable revisions after release.
4. Implement private authoring and preview before public discovery.
5. Add resources, participant groups, and contribution visibility with
   authorization tests.
6. Add business packages and engagements only after blueprint installation is
   stable.
7. Add Android by consuming the same wire schemas through Kotlin DTO adapters.

Because no public release depends on the earlier wedding-specific native
schema, schema v1 uses the generalized names directly and carries no legacy
aliases. Once released, future contract changes require a new version and an
explicit migration.

## Required invariants

1. A published blueprint or package revision is immutable.
2. Installation materializes independent customer-owned state atomically.
3. Template or package ownership grants no access to installed experiences.
4. Professional access requires an explicit, revocable engagement.
5. Participant contribution visibility is enforced by the server and sync
   projection.
6. Private content is never copied between experience instances.
7. Platform presentation details do not enter shared blueprint documents.
8. Unsupported required modules fail explicitly before instance creation.
9. Live collaborative entities remain normalized canonical records.
10. AI and MCP calls pass through the same domain workflows as every client.
