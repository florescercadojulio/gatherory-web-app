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
No media uploads, sync mutation receipts, moderation staff grants, or simulated
outbox acknowledgements are created.

Run the DB-free regression checks with:

```sh
pnpm exec vitest run tests/unit/development-workspace-seed.test.ts tests/unit/review-workspace-fixture.test.ts tests/unit/scoped-event-projection.test.ts
pnpm exec vitest run tests/unit/development-blueprints-seed.test.ts tests/unit/development-catalog-seed-wiring.test.ts tests/unit/seed-modules.test.ts tests/unit/private-templates-seed.test.ts
pnpm typecheck
```

These checks cover fixture consistency, scoped projection, and seed write wiring;
they do not execute a database reset or certify an end-to-end device sync.
