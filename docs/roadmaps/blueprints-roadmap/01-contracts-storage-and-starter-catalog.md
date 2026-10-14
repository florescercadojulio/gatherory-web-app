# 01 — Contracts, Storage, and Starter Catalog

**Status:** Planned
**Priority:** P1
**Depends on:** `00` and `00a`; inspect the current schema before generating migrations.

## What this is / why it exists

Establish the executable blueprint subset and three real starter definitions so
authoring and installation share one validated contract. Configuring a new
experience should add content, not require a separate Wedding or Birthday code
path.

## Current implementation

The shared envelope and generic module configuration already exist. There are
no blueprint tables or system catalog seeds. Current development seeding also
imports reset utilities; it is not an appropriate deployment mechanism for a
non-destructive starter catalog.

## Target behavior

Extend the shared contract with a capability registry for the versions in `00`.
Bound strings, list lengths, nesting, and total document size. Suggested starting
limits: 50 children, 100 ideas, 30 instruction sections, titles 120 characters,
idea notes/event descriptions 2,000, instruction bodies 5,000, and 256 KiB per
serialized blueprint. Use narrower canonical field limits when they already
exist. Reject duplicate stable item keys, missing targets, invalid categories,
unknown visibility, and unsafe role/permission declarations.

New schedule proposals use `anchor: main_start`, an integer `dayOffset`, and a
24-hour `localTime`; they describe suggestions, not fixed UTC offsets. No
schedule proposal means the user supplies the selected child's start during
review. Published content has a `contentLocale` defaulting to `en` in the
revision metadata; names and instructions remain authored content, separate
from localized interface messages.

Generate JSON Schemas from the Zod source and add matching fixtures. Keep the
existing envelope examples and tests; add compatibility assertions for the new
module versions. A structural schema pass does not replace semantic validation
of targets, capabilities, schedules, or authorization.

Define a pure expanded-plan DTO alongside the modules: stable source keys,
confirmed event specifications, idea/guide targets, configuration, omissions and
errors, with no allocated database IDs or native enum encoding. Preview and
installation must use the same planner. Define canonical hashing/default rules
and pin the planner semantics used by an in-progress installation. Keep blueprint
envelope/module versions distinct from sync payload and local archive versions.

## Starter content

Store reviewed definitions under a dedicated server-side catalog directory,
with no runtime dependence on development mock users. Initial content:

| Key / title                       | Optional activity suggestions                                                  | Starter ideas                                                | Instruction themes                                           |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `wedding` / Wedding               | Venue visit (planning/scouting), rehearsal, ceremony, reception                | Venue, attire, food, flowers, photography, music             | Planning priorities; ceremony/reception guidance             |
| `birthday_party` / Birthday Party | Preparation (planning/scouting), celebration, optional meal                    | Theme/decor, food/cake, music, activities (`other`)          | Arrival and celebration details; food/preferences checklist  |
| `thanksgiving` / Thanksgiving     | Meal preparation (planning/scouting), shared meal, optional gathering/activity | Menu (`food`), table setting (`decor`), activities (`other`) | What to bring; dietary considerations; arrival/meal guidance |

Use existing child categories when accurate; use `other` with the actual title
for birthdays/meals/activities. Do not expand wedding-specific DB enums merely
to duplicate each template title. Curated copy should invite editing and avoid
pretending that venues, menus, access instructions, or people are confirmed.

Add a non-selectable future fixture for a property-stay experience containing
arrival, suggested local activities/ideas, and departure guidance. It exercises
the same target references and instructions but is not a fourth launch preset.
Advanced stay modules such as private journals must remain unsupported and
prevent installation when marked required.

Provide a separate non-destructive `blueprints:seed` command. It uses stable
catalog keys, compares the validated content hash, and is a no-op for an already
published identical version. A content change creates a new revision, never
updates a published document. Database locking/uniqueness must make concurrent
seed runs safe. Do not insert users, reset tables, mutate private drafts, run
the seed automatically on requests, or apply it to a remote database implicitly.

## Architecture boundary

- Shared contract/schema generation: `src/contracts/experience.contracts.ts`,
  focused module files if needed, and `scripts/generate-contract-schemas.ts`.
- Drizzle: blueprint and event-guide/configuration schemas, additive migration,
  minimal exports/relations integration.
- Domain: semantic validator and capability registry in `src/server/blueprints/`.
  Keep client-compatible structural validators free of DB/provider imports.
- Read handlers: paginated accessible catalog/revision reads and supported
  capability metadata; private reads always verify actual membership.
- Workspace authorization: a distinct `blueprint` resource/action policy for
  read/create/update/publish/retire. Owner/admin can author; workspace members
  can read/use published private entries; event-only participants cannot.
  System catalog writes have no customer-facing privileged switch.

The custom resource is new work: `src/lib/org-permissions.ts` currently exposes
only built-in organization statements and `src/lib/auth.ts` does not register a
blueprint policy. Wire fixed owner/admin/member permissions consistently at
server/client declaration boundaries, and test direct domain calls as well as
middleware. This does not require a user-defined roles/permissions editor.

## Acceptance criteria

- The three presets validate and can be read from real persisted catalog rows.
- Running the seed twice produces no duplicate definitions or revisions.
- Published content updates are rejected; legitimate draft edits remain possible.
- Private catalog search, counts, individual revision reads, and error messages
  do not disclose another workspace's templates.
- Stored identities, revisions, audit fields, permissions, and system origin
  cannot be spoofed through input JSON.
- Existing fixtures retain structural compatibility; unsupported required
  capabilities are rejected separately from envelope parsing.
- Behavioral tests cover validation boundaries, private access, seed retry,
  concurrent publication allocation, and schema constraints. Keep tests scoped
  to this feature and use disposable local DB fixtures for database behavior.

## Explicit deferrals

No public catalog, business profile, template media, installation into existing
plans, arbitrary custom permissions, or new property/resource tables. The typed
instructions and extensible experience key are enough to preserve the later
stay experience without introducing its unimplemented capabilities.
