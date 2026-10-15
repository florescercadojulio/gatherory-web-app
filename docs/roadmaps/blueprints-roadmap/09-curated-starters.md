# Birthday Party and Thanksgiving starters

Implemented October 15, 2026. The curated catalog now contains Wedding,
Birthday Party, and Thanksgiving. This adds content to the existing engine;
private authoring, guide editing, durable pre-install drafts, and billing remain
separate work.

## Content and discovery

- Birthday Party (`birthday`, revision 1): optional setup, games/activities,
  and cake/treats; starter ideas for the gathering, food, invitations, decor,
  and activities. Explore categorizes it under Birthdays.
- Thanksgiving (`thanksgiving`, revision 1; experience type `holiday`): optional
  preparation, time together, and a shared meal; ideas for the gathering, food,
  invitations, activities, and the table/shared space. Explore categorizes it
  under Holidays and search includes Friendsgiving and potluck.
- Both include planning-only guidance and participant-facing child guidance.
  Omitting a child also omits content targeting that child; review explains it.
- All child dates are proposals relative to the host's main date and named zone.
  Thanksgiving does not choose a country's holiday date or require November.
  Confirmation and user-edit preservation use the existing Temporal setup flow.
- Ideas start undecided. No guests, attendance answers, expenses, accepted
  ideas, or active music playlists are invented. Generic child activities use
  the existing `other` category rather than wedding-specific labels.

## Integration and rollout

`catalog/starters.ts` registers the three immutable revisions. The explicit
`blueprints:seed` command inserts missing revisions under the existing single
transaction/advisory lock. Identical reruns/concurrent runs are no-ops; changed
content at an existing key/revision is rejected. Wedding's definition/hash is
unchanged. There is no new schema migration or native runtime branch.

Deployment must already have the blueprint tables and Node 26+ runtime. Run
the explicit seed against the intended environment to make the new starters
available. No development/production seeding or deployment was performed as
part of this implementation. Existing installations remain independent.

## Verification

`contracts/examples/curated-starters.v1.json` and the matching iOS fixture contain
the real catalog, date suggestions, reviewed plans, and native archives for both
new starters. Vitest regenerates the expected values in memory. Native tests
decode them, exercise category/search behavior, import through real bootstrap,
verify one workspace with children and host controls, and save/reopen actual
SwiftData stores. No-op saves produce no outbox entries; a real edit persists
with one pending mutation. Deliberately edited dates are retained.

The opt-in PostgreSQL installation test also seeds all three revisions, checks
repeat/concurrent seeding, installs each new starter, retries the same request,
and verifies canonical/native identity and date agreement. Existing rollback,
provider recovery, scoped visibility, and post-install sync checks remain intact.

October 15 results: TypeScript and generated-contract checks passed; Vitest
passed 299 tests (14 environment/opt-in cases skipped). The separate PostgreSQL
18 integration test passed in a freshly migrated disposable container. The full
non-UI native suite passed 375 tests / 449 executions on iPhone 17 / iOS 27 with
zero failures/skips. Shared fixtures match byte-for-byte. The disposable database
and volume were removed after verification; development/production were untouched.

UI tests are excluded. Physical-device usability, actual iOS 26 execution, and
deployed two-account invitation validation remain release gates. Next work is
durable pre-install setup recovery and editable live guides; this content slice
does not mark the whole blueprint roadmap or paid launch complete.
