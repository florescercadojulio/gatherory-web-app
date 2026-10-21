# Development seed

`pnpm db:seed` loads `.env.local` and **resets the configured database** before
creating fixtures. Check the target first; this is not an incremental update or
a migration for existing user data. The script refuses `NODE_ENV=production`,
but that check alone does not prove a database is safe to reset. Never point it
at production. The reset clears blueprint revisions and private templates too;
the seed then restores curated starters and creates App Review's private cottage
published template plus an editable draft. After a reset, use clean local app
data: old offline outboxes belong to the previous accounts/database and are not
migrated by this seed.

## Fixtures

The development catalog contains **25 searchable templates**: seventeen
production starters plus eight synthetic `dev_` templates: Lakeside Cottage
Weekend, Garden Wedding Weekend, City Hall and Rooftop Celebration, Backyard
Birthday Adventure, Milestone Birthday Dinner, Cozy Friendsgiving Potluck, Winter
Holiday Open House, and Creative Team Retreat. Each development template has six
sub-events, twelve ideas across multiple categories, and seven guidance sections.
They cover all four browse categories, main/child idea filtering, long notes,
multi-day date suggestions, masonry previews and larger Decide queues.

The eight additional development fixtures live in `src/db/seeds/development-blueprints.ts` and are included only by
the development reset seed—not `pnpm blueprints:seed` or the production starter
registry. They contain no real guest data, source-event access, votes, uploads,
or preconfirmed dates. Existing private cottage publications stay private.
The seed does not fabricate native setup drafts or installation history; create
those through the app to exercise In Progress and Installed Templates normally.

The production catalog now covers eighteen Explore categories. The original
Wedding/Birthday/Thanksgiving revisions remain unchanged; fourteen new curated
starters each provide four activities, six ideas and five guidance sections.
See [expanded Explore](../roadmaps/blueprints-roadmap/21-expanded-explore-catalog.md).
`pnpm blueprints:seed` is the additive deployment tool for those seventeen
production entries; unlike `pnpm db:seed`, it does not reset the database.

The wedding workspace has six child events, all thirteen idea categories,
individual Decide preferences, RSVP variants, a pending email invitation,
registry content, and estimated/committed/paid expenses. Root and reception
events have note histories; other children exercise the empty-notes state.
Budget allocations fit within the workspace cap.

| Account                               | Access in the seeded workspace                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `planner@gatherory.test`              | Root host and organization owner                                                     |
| `jordan@gatherory.test`               | Root co-host                                                                         |
| `coordinator@gatherory.test`          | Root collaborator, contribute permission                                             |
| `guest@gatherory.test`                | Guest/RSVP access; no planning scope grant                                           |
| `appreview@gatherory.test`            | Local-only organizer/review fixture                                                  |
| `reception-planner@gatherory.test`    | Reception-only collaborator; no root, sibling, organization, or team access          |
| `pending-collaborator@gatherory.test` | Pending collaborator requests on the root and reception; no granted access           |
| `latest-collaborator@gatherory.test`  | Newer pending requests on the same events; exercises the latest-request quick action |

Credentials are defined in the local development script, not production review
credentials. Only the primary host and local reviewer join the Planning team.
Pending requests are `eventJoinRequest` rows associated with per-event
collaborator share links, not organization invitations or preapproved participants.
Links expire fourteen days after seeding. Contacts without accounts exercise
going, declined, and invitation-pending guest states.

## Keep both clients aligned

`src/db/review-workspace-fixture.ts` defines the native archive, including
Foundation reference-date seconds and Swift enum encodings.
`src/db/development-workspace-seed.ts` derives versioned sync records from that
archive and passes them through the production native materializer in dependency
order, using the correct actor for people, ideas, preferences, expenses, and notes.
The normalized web data, archive, entity versions, links, and requests are written
in one transaction after account/workspace provisioning. A failure aborts those
workspace writes, but does not undo the earlier database reset or provisioning.

Child-only planning uses the existing projection of the root storage. Do not
seed an independent child snapshot or grant root sync/organization membership
to make a child fixture visible. Likewise, a pending request must not be added
to archive members or participation before approval.

To change fixture content, edit the archive and derive any supplemental web rows
from it; do not restore separate copies of the event/idea/note data in `seed.ts`.
The ordinary database-only seed creates no media uploads, sync mutation receipts,
moderation staff grants, or simulated outbox acknowledgements. The optional image
step below uploads only bundled fixture photos into private development storage.

## Event, idea, and registry images

The App Review fixture and the other seed accounts share the existing event.
Photo visibility follows their existing event permissions; this step does not
create accounts, enroll pending collaborators, or expand guest/child access.

`src/db/seeds/development-event-images.ts` assigns a separate, relevant photo to
the main event, six child events, thirteen ideas, and the registry item. The
JPEGs are bundled under `scripts/seed/assets/`, with credits and source links in
[seed image sources](seed-image-sources.md). Seed runs use those local files,
so they do not download from Unsplash at runtime or require the landing/iOS
repositories to be present. Replacing a photo means updating its catalog entry
and bundled file.

### Fill missing photos without a reset

```sh
pnpm db:seed:images
pnpm db:seed:images --apply
```

The first command is a dry run with no database or object-storage writes.
`--apply` fills only eligible missing images in the known local fixture. Existing
normalized covers, legacy event image URLs, native inline images, and native
media references are preserved. Deleted records and records whose fixture
identity no longer matches are skipped. Re-running after a successful apply
should report zero candidates.

The updater verifies the local database, exact seed owner/workspace/scope, and
the `gatherory-private-dev` bucket. It uploads immutable private objects, verifies
their metadata, then writes ready media assets and typed cover placements.
Bootstrap snapshots, native workspace/entity payloads, versions, and change-log
records are updated together in one database transaction. It never calls the
reset seed, rewrites planning content, or creates mutation receipts/notifications.
An interrupted storage/transaction attempt may leave an unplaced object; a retry
reuses its verified immutable key rather than overwriting it.

Missing account portraits have a separate fill-only command:

```sh
pnpm db:seed:portraits
pnpm db:seed:portraits --apply
```

### Fresh database seed with photos

```sh
pnpm db:seed:with-images
```

This is explicitly **destructive**, just like `pnpm db:seed`. It checks the image
configuration and bundled files before the reset, creates the regular fixtures
and portraits, then runs the same media updater. The ordinary `pnpm db:seed`
remains available for database-only development. For an existing database,
always use the fill-only commands above.

These tools target the local fictional App Review account, not the credentials
or database used for a live App Store review. They reject production targets.

On October 21, 2026, the fill-only updater added all 21 covers to the existing
`localhost:5438/gatherory` fixture and verified them in `gatherory-private-dev`.
A second apply reported zero candidates and writes. All 21 private signed reads
returned the expected bytes. A before/after comparison found no changes in the
44 non-media tables or the non-image content of native snapshots/entities.
The eight account portraits were already populated; no database reset ran.

## Sample profile pictures

The eight fictional `@gatherory.test` accounts have sample portrait URLs in
`src/db/seeds/development-profile-images.ts`. The same catalog includes distinct
portraits for the three root-event contacts: Invited Family (invited), Jamie Park
(going), and Drew Ellis (declined). Their native participant photos and
organization-scoped `workspace_person.avatar_url` values are populated without
creating accounts or changing their guest role, RSVP, or view-only permission.
Each of the eleven fixture people has a different stock portrait. Existing
custom account pictures are preserved.

To fill missing portraits in an **existing local** fixture database without
resetting it, preview this incremental command first:

```sh
pnpm db:seed:portraits
pnpm db:seed:portraits --apply
```

The default is a transaction-backed dry run that rolls back. `--apply` fills
missing account and normalized-person pictures plus the exact fixture contacts
and matching native bootstrap and participant payloads. It advances versions
and adds native change-log records so an existing client can pull the update.
Contact updates require the known stable participant ID, exact email and name,
the fixture organization, and the seeded root snapshot owner. The command only
accepts the `gatherory` database on localhost/loopback, refuses production, and
checks exact account names and emails before writing. It recognizes the current
`Alex & Jordan's Gatherory` workspace and the exact legacy
`Alex & Jordan's Wedding` label used by existing local fixtures. It never creates users,
changes access, or replaces existing pictures. Re-running it after applying
should report zero changes. No account credentials or database connection
strings are printed.

These are temporary stock photographs served by the [Unsplash image
CDN](https://images.unsplash.com), used under the [Unsplash
License](https://unsplash.com/license). The people pictured are not customers,
testimonial authors, or the fictional fixture identities. URLs are recorded
beside each fixture so the local database, birthday-dinner simulator assets,
and marketing prototype can use the same portraits. Replace these prototype
assets with owned/consented images before using them as real customer content.

The incremental portrait update is local development tooling only. Review the
dry-run counts before applying it to a seeded local database. On October 21,
the updater filled eight missing normalized-person portraits and three contact
portraits in the legacy bootstrap snapshot. Verification found all eight demo
accounts, all nine workspace people, both pending requestors, and all native
sync people pictured; a final dry run reported zero changes. RSVP and request
statuses were retained, and no database reset ran. Contact payloads accept both
null and omitted optional account IDs while retaining exact identity checks.

Run the DB-free regression checks with:

```sh
pnpm exec vitest run tests/unit/development-workspace-seed.test.ts tests/unit/review-workspace-fixture.test.ts tests/unit/scoped-event-projection.test.ts
pnpm exec vitest run tests/unit/development-profile-images.test.ts
pnpm exec vitest run tests/unit/development-event-images.test.ts tests/unit/development-event-images-update.test.ts
pnpm exec vitest run tests/unit/development-blueprints-seed.test.ts tests/unit/development-catalog-seed-wiring.test.ts tests/unit/seed-modules.test.ts tests/unit/private-templates-seed.test.ts
pnpm typecheck
```

These checks cover fixture consistency, scoped projection, and seed write wiring;
they do not execute a database reset or certify an end-to-end device sync.

`tests/integration/development-event-images.database.test.ts` is an opt-in check
against a separate local database whose name starts with
`gatherory_seed_images_test_`. Supply its schema and set
`DEVELOPMENT_EVENT_IMAGES_TEST_DATABASE_URL` plus
`RUN_DEVELOPMENT_EVENT_IMAGES_DB_TESTS=1` before running that test. It uses a fake
object store and exercises the real materializer/SQL updater: existing covers,
inline images, tombstones, mismatched records, other organizations, sync versions,
repeat runs, and rollback after a storage-success/database-failure boundary.
It refuses the normal `gatherory` database as its test target.
