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
The default `pnpm db:seed` also seeds the bundled event covers and shared album.
It validates image coverage, local source checksums, the local target, and private
development storage configuration before the destructive reset. The legacy
`pnpm db:seed -- --without-images` option skips workspace cover and album uploads;
private Blueprint fixtures still require their covers and configured storage.
Use the default command for the complete presentation seed. Neither seed creates sync mutation receipts, moderation
staff grants, or simulated outbox acknowledgements. The separate
`pnpm db:reset` command remains reset-only and does not seed fixtures or images.

The App Review archive uses the map and music captured from the current local
`gatherory` database on October 21, 2026. The root-event venue is Leila Arboretum,
928 Michigan Ave W, Battle Creek, MI 49037 (42.3351401, -85.2133352; map item
`I23C0AE2C81FA20E5`). Its music idea contains four Apple Music library
references: “BABYDOLL (Speed)” by Ari Abdul, “BAILE INoLVIDABLE” and “VUELVE
CANDY B” by Bad Bunny, and “I'm Fine (feat. Cherry Lena) [IMANU Remix]” by
Apashe & High Klassified. These catalog IDs and the first track's MusicKit
artwork URL are account-specific library references, not portable public
catalog URLs. Missing artwork, preview, and external URLs remain `null`; no
catalog links were invented and no metadata was fetched. The destructive reset
seed was not run to capture this data.

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

`src/db/seeds/development-shared-album.ts` adds six of those bundled garden
wedding photos to the root event's shared gallery. Their source credits and alt
text refer to the existing cover catalog, and their fixture dates are fixed.
Attribution is split evenly across the three active root planners: Alex Morgan
(host), Jordan Lee (co-host), and Maya Chen (contributor). The updater verifies
each exact fixture account, active event role and permission, root sync membership,
and matching archive participant before adding that person's photos. The name,
account ID, media uploader, and sync actor all refer to the same participant.
The image command previews/applies both the 21 covers and six gallery photos;
it only fills missing fixture media and preserves existing or deleted records.
Changing contributor assignments applies only to missing stable photo IDs; it
does not rewrite existing album photos or their authors.

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

The cover and gallery updaters verify the local database, exact seed
owner/workspace/scope, and the `gatherory-private-dev` bucket. They upload
immutable private objects, verify their metadata, then write ready media assets
and typed placements. The cover updater updates bootstrap snapshots, native
workspace/entity payloads, versions, and change-log records together in one
database transaction. The gallery updater atomically adds moments to the root
archive snapshot and writes their individual moment create entities and change
records. It emits no workspace entity change, which could overwrite current root
fields from a stale baseline. Neither updater creates mutation
receipts/notifications.

## Explore Blueprint covers

Every production and development Blueprint root, child event, and idea has an
explicit licensed image assignment: 334 searchable targets across 25 Blueprints.
The private cottage adds 8 targets, applied to both its published template and
editable draft. Missing assignments, revision mismatches, and changed local
source files fail validation before a reset starts.

The same checked-in image registry is used by the additive production
`pnpm blueprints:seed` command, which inserts only the 17 production starters.
It does not include development templates or reset existing data. Images are
served from Gatherory's public CDN, with originals and photographer/license
records retained in this repository. Creating an event imports assigned images
into the user's private media storage and preserves explicit image removal or
replacement.

Run `pnpm blueprints:images` for an offline asset check, or add
`-- --verify-public` to verify public delivery. See
[Blueprint seed images](../architecture/blueprint-seed-images.md) for publication
and verification instructions and [source credits](seed-image-sources.md).
An interrupted storage/transaction attempt may leave an unplaced object; a retry
reuses its verified immutable key rather than overwriting it.

Missing account portraits have a separate fill-only command:

```sh
pnpm db:seed:portraits
pnpm db:seed:portraits --apply
```

### Fresh database seed (includes photos)

```sh
pnpm db:seed
```

This command is **destructive**. It checks both image catalogs, bundled
files, local database target, and private development storage configuration
before resetting. The seed restores the archived venue and Apple Music data,
creates the regular fixtures and portraits, and fills the event/idea/registry
covers plus shared gallery. For an existing database, use the fill-only commands
above.

An intentional database-only reset and seed is available separately:

```sh
pnpm db:seed -- --without-images
```

It uses the previous database-only seed behavior and does not upload or place
event images. It is still destructive. Use it when private development storage
is unavailable and you deliberately want fixtures without photos.

### Command consolidation

There are four seed entry points in `package.json`: the full development seed,
fill-only images, fill-only portraits, and the additive curated catalog seed.
The redundant `db:seed:with-images` alias and separate database-only alias were
removed. The database-only mode is now an option on the default command. Direct
script callers may still pass legacy `--with-images`; image uploads are already
the default. Duplicate, conflicting, and unknown flags fail before the reset.
No reset or seed was performed as part of this command cleanup.

These tools target the local fictional App Review account, not the credentials
or database used for a live App Store review. They reject production targets.

On October 21, 2026, the fill-only updater added all 21 covers to the existing
`localhost:5438/gatherory` fixture and verified them in `gatherory-private-dev`.
A second apply reported zero candidates and writes. All 21 private signed reads
returned the expected bytes. A before/after comparison found no changes in the
44 non-media tables or the non-image content of native snapshots/entities.
The eight account portraits were already populated; no database reset ran.

For the shared-gallery addition, an October 21, 2026 dry run found all 21 covers
preserved and six album candidates. Typecheck passed. No apply, reset, or uploads
were run.

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
