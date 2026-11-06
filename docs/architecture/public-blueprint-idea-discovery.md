# Public Blueprint idea discovery

**Status:** Server contract and implementation are local; no deployment has
occurred. The curated catalog source also includes Movie Night (`movie_night`,
revision 1); its explicit dev catalog seed remains pending. This is the backend
for the V1 native Explore Ideas surface.

## Product boundary

Explore remains Blueprint-led. The native Explore filter offers **All**,
**Blueprints**, and **Ideas**. Ideas are individual suggestions extracted from
currently public Blueprint publications; they are not independently published
or saved as public objects. **Add to Event** copies an idea into the selected
event's local planning data. Scheduling a related event remains a separate,
explicit action. The complete Blueprint and its events remain available through
the Blueprint preview and setup flow.

The server endpoint is `GET /api/blueprints/ideas?q=&cursor=&limit=`. It uses the
same authenticated account requirement as Blueprint catalog reads. Anonymous
requests are rejected before the catalog is read.

## Response and matching

The response is `{ ideas, nextCursor? }`. Each item has a stable ID composed from
the public Blueprint ID, immutable published revision, and idea key; the source
Blueprint ID/version/title; optional public creator display name; and a strict
idea projection containing key, title, category, notes, target, and the currently
portable configuration. A published idea's UUID `coverAssetId` is returned as a
top-level source reference when present so native can request and copy its
image. Native media download must use the exact `sourceBlueprintId` and
`sourceVersion`; the media endpoint authorizes the reference against that
published source. A curated immutable public cover URL is optional and preferred.

Search ranks each idea independently using the Blueprint search phrase rules,
bounded English/Spanish aliases, related terms, and unique one-edit typo
correction. Idea titles and notes provide match evidence. The containing
Blueprint title does not independently match every idea in that Blueprint.
Results are deterministic and paged with a default of 30 and maximum of 60.
Continuation cursors bind the normalized query and ordered result snapshot;
changed snapshots, query reuse, malformed cursors, and out-of-range offsets are
rejected.

The handler reads the complete public catalog and extracts ideas from it, rather
than treating a page of Blueprint cards as the idea corpus. The repository's
catalog query includes only non-retired revisions of curated starters and the
exact currently listed revision of an authored template. Private drafts,
unlisted templates, owner-only revisions, retired templates, and saved private
copies do not enter this read path.

The strict projection keeps only the validated published idea `coverAssetId` at
item level. It omits that ID from the portable idea object, plus storage keys,
signed storage URLs, and configuration fields the installer does not
understand. UUIDs are references, not media credentials; source-scoped media
authorization remains required. Public image URLs are emitted only from the
catalog's validated immutable Explore cover registry.
There is no idea-level publish, moderation, preference, ranking, or persistence
model in this V1 endpoint; publication and visibility remain owned by the source
Blueprint.

The shared Blueprint catalog query does not filter a viewer's blocked-author
list: the existing public Blueprint catalog treats a currently listed
publication as public for every signed-in viewer. User blocks are applied to
event guest-contribution feeds and ordinary media reads, not to the public
Blueprint catalog. Blueprint cover assets use their own table and source-bound
published-revision authorization; they do not have the regular event-media
moderation-hidden status or text-report state. A product decision to hide
blocked creators' public Blueprints or add Blueprint text/image review would
need a shared catalog/cover policy change, rather than an idea-only filter.

## Verification and acceptance limits

The installed `drizzle-orm@1.0.0-rc.4` effect entrypoint expected the removed
`effect/Schema` API `TaggedErrorClass`, while the installed Effect 4.1.1 exposes
`TaggedError`. The reproducible, narrowly scoped compatibility patch is recorded
in `patches/drizzle-orm@1.0.0-rc.4.patch` and applied through pnpm's
`patchedDependencies`; it updates the four generated ESM/CJS runtime files
without changing package versions. A bare entrypoint import now succeeds.
Upstream Drizzle `1.0.0-rc.5` contains the rename fix but also has unrelated
breaking changes, so this project has not upgraded to it.

Verification after the patch: `pnpm contracts:check`, `pnpm typecheck`, and
`pnpm vitest run` passed. Vitest reported 169 files passed and 46 skipped,
comprising 1,012 passing tests and 74 skipped. The direct import check
`pnpm exec tsx -e "import * as PgDrizzle from 'drizzle-orm/effect-postgres'; console.log(typeof PgDrizzle.make)"`
printed `function`. The historical isolated PostgreSQL 18 attempt below predates
the patch and failed during module import before assertions; it has not been
rerun. No database writes or deployment were performed.

Movie Night is registered in the source catalog and shared JSON fixture. To make
it visible in a development database, run the explicit `pnpm blueprints:seed`
command against that intended dev database; source registration does not seed
on import or on requests. No development or production seed was run here.

Native All/Blueprints/Ideas and Add to Event are implemented locally. The
Light/Dark add-and-find UI journey passed in 67.019 seconds; the full native unit
run passed 1,182 registered tests / 163 suites (1,181 executed, one opt-in live
test skipped). English/Spanish localization coverage passed for 1,792 strings.
See the [native implementation and acceptance record](../../../ios-apps/gatherory/docs/explore-idea-discovery.md).
Physical-device acceptance with a deployed authenticated endpoint, actual CDN/R2
copying, destination media upload, and a second collaborator remains open. No
deployment occurred. See the [Blueprint-led discovery decision](blueprint-led-discovery.md)
and the [ranking roadmap](../roadmaps/blueprint-ranking-roadmap/README.md).
