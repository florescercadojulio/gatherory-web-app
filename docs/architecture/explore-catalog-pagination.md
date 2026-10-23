# Explore catalog pagination

October 22, 2026. Additive API for the iPhone Explore feed and its native ad
placements. Ads are loaded by the iPhone directly from Google; the catalog
endpoint returns organic blueprints only.

`GET /api/blueprints/catalog` without paging/filter parameters preserves its
legacy full-catalog behavior. Providing any of `limit`, `cursor`, `category`,
or `q` opts into the paged response. Authentication and published-catalog
visibility are unchanged.

- `limit`: integer 1–40, default 20.
- `category`: one of the existing eighteen Explore category slugs.
- `q`: up to 128 characters, trimmed and case/diacritic folded. Whole-word and
  known phrase concepts match the public Blueprint name/summary, supported event
  titles and idea titles/notes. Explicit English/Spanish aliases and a bounded
  outdoors-related map expand retrieval. Every separate concept needs evidence
  in the same Blueprint; category/key/tag metadata is supporting fallback.
  Category search retains current English/Spanish labels. Nonblank queries with
  no searchable words return no results.
- `cursor`: opaque URL-safe value, at most 2,048 characters. Clients must return
  it unchanged and keep the same query, category, and page size.
- Response: `entries`, `availableCategories`, and optional `nextCursor`.
  Creator metadata is explicitly validated and preserved. No cursor means end.

The versioned cursor binds the page size, filters, last key, and authorized
catalog snapshot digest. Paged requests also bind the account; another account
cannot reuse its continuation. Not interested is applied before paging for
browse/category feeds, and changed suppression restarts the snapshot. Explicit
search remains inclusive. A malformed cursor returns validation error 400;
a changed catalog or mismatched scope returns conflict 409. Clients can restart
from the first page after a conflict. Cursors confer no access: every request
loads the current authorized catalog before applying the cursor.

The service deduplicates latest revisions. Empty-query and legacy full-catalog
ordering retain deterministic catalog-key order; query results use content
relevance with catalog-key ties. The digest covers revisions, hashes, author/art,
structured searchable content, matching-rule version and actual alias/related
maps. Pre-content-search cursors restart with the existing stale-409 response.
The [content-search slice](../roadmaps/blueprint-ranking-roadmap/02-content-search-and-related-terms.md)
records exact matching tiers, bilingual limits and current verification. This first slice pages an already-authorized in-memory catalog; it
reduces response size and native rendering work but still materializes the
catalog in the repository on each request. It is not database-level keyset
pagination. No migration, shared cache, or catalog authorization rewrite was
introduced.

Native integration and privacy details:
[Explore advertising](../../../ios-apps/gatherory/docs/explore-advertising.md).
No deployment was performed. Original pagination typechecking and generated
contract checks passed without new tests; the subsequent content-search slice
adds matching, relevance, scope and cursor fixtures and records its full web and
focused native verification separately.

## Blueprint actions and opt-in contexts

Entries add optional account-specific `viewerState` and, when measurement is
explicitly enabled, a short-lived `discoveryContext`. Exposure metadata uses the
global organic result position and a hashed snapshot/scope; raw queries and
encoded cursors are not persisted as telemetry. Fetching a page creates no
impression. The full-catalog compatibility path carries preferences, preserves
its complete list and issues no exposure contexts. Do not cache these responses
across accounts. [Actions and measurement](../roadmaps/blueprint-ranking-roadmap/03-actions-and-measurement.md)
owns signal validation, privacy, retention, migration and verification details.

## Recommendation baseline capability

`ranking=baseline_v1` opts into the [implemented baseline](../roadmaps/blueprint-ranking-roadmap/04-recommendation-baseline.md).
The nonpersonal baseline control uses internal algorithm/configuration
`blueprint-baseline-v2`; the
wire capability name remains `baseline_v1`. The [promotion-only policy](../roadmaps/blueprint-ranking-roadmap/07-measurement-cleanup-and-new-item-opportunities.md)
counts naturally emitted recent items toward global cumulative milestones and
never demotes a recent item relative to ordinary editorial/diversity order.
The [personal Like rule](../roadmaps/blueprint-ranking-roadmap/08-personal-like-ranking.md)
is enabled by default for authenticated capable pages, with internal policy
`blueprint-personal-likes-v2`. It uses own current exact public Likes and compares
bounded content affinity after editorial priority inside identical relevance
groups, before creator diversity/recent promotion. No usable Like keeps baseline
ordering. The [v2 precision policy](../roadmaps/blueprint-ranking-roadmap/09-personal-like-precision.md)
keeps public field roles separate, requires shared title evidence corroborated by
non-notes text and uses commonness-adjusted weighted Jaccard. Role vectors and
scores stay private. Its policy/configuration fingerprint invalidates v1 cursors
even when page order is identical. The request capability remains unchanged.
`BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED=false` selects baseline v2.
Private profile fingerprints bind ranked cursors even when order is unchanged;
only combined snapshot digests leave the server. Bookmark-only updates do not
invalidate personal cursors. The iOS feed replaces the old stream with page one
once on a typed stale continuation error, preserving active query/category and
account generation; unrelated errors retain explicit retry behavior.
The parameter also opts into paging when supplied alone. Requests without it
retain the version-1 cursor and ordering. Baseline pages use version 2 and add an
optional `ranking` summary (`mode`, algorithm/configuration version, frozen
`asOf`, snapshot digest). Content relevance remains primary; category filtering
precedes editorial priority, creator diversity and recent-authored opportunity.

Continuations freeze the initial time for up to 24 hours and bind configuration,
actual mode, internal publication metadata and ordered keys in addition to
existing actor/catalog/filter scope. Public listing or hide changes produce a
409 restart; the implementation does not retain an old snapshot and skip rows.
`BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED=false`, invalid configuration or policy
failure selects the legacy content-relevance/key fallback with `mode=catalog`.
Switching modes requires restart. One additive migration labels existing
exposure rows with nullable private policy context; no aggregate job is added.

Cursor contents are validated base64url JSON, neither encrypted nor signed;
clients must pass them unchanged, and they grant no access. Exposure telemetry
receives the hashed snapshot, global organic position and optional version/configuration
label, never raw queries,
cursors or internal creator IDs. Full-catalog serialization now explicitly uses
the public schema to strip internal ranking metadata. Native paged consumers
request the capability and preserve the returned order; history keeps its
separate full-catalog path.

## Unseen-first browse sessions — October 23

Ranked native browse requests can additionally carry the optional
`X-Gatherory-Discovery-Context` header. Its validated JSON freezes a session UUID,
start time and at most 200 exact keys with last-view timestamps, bounded to
16,384 UTF-8 bytes and 30 days of history. This device-local personalization
context is separate from opt-in exposure telemetry and is not stored as a
measurement signal. Do not add raw header values to logs, URLs or shared caches.

An eligible browse session ranks unseen keys before cooled seen keys and then
recently seen keys. The repeat cooldown is 24 hours; ties use existing ranking,
creator variety and a stable session seed. Context/policy fingerprints bind the
cursor; continuations must retain the original history snapshot while live
history grows on the phone. Initial `asOf` uses the frozen session start.
Ranking metadata identifies `blueprint-unseen-first-v1` or the combined
`blueprint-personal-likes-unseen-first-v1` policy. The existing ranking kill switch
and catalog fallback preserve legacy behavior.

Nonblank typed queries ignore this header entirely, including malformed values.
Public eligibility and Not interested still apply independently of client input.
The [freshness slice](../roadmaps/blueprint-ranking-roadmap/16-unseen-first-discovery.md)
records native session renewal, paging recovery, evaluation and limits.
