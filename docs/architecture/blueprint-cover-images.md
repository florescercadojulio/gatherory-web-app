# Blueprint cover images

## Curated public Explore artwork

Public curated artwork has a separate publishing path from the private
`coverAssetId` lifecycle below. The reusable
[gatherory-explore-images skill](../../.agents/skills/gatherory-explore-images/SKILL.md)
prepares photos using `scripts/upload-public-explore-cover.ts`. The existing
`gatherory-public` bucket serves them at `https://cdn.gatherory.com`.

The uploader strips metadata, normalizes orientation, preserves proportions, and
produces thumbnail/card/hero JPEGs bounded to 320/960/1600 pixels without
enlargement. Content-addressed keys under `explore/covers/` keep URLs stable and
allow different images to coexist. The durable manifest records provenance,
dimensions, checksums, keys, and URLs without credentials or local source paths.

Two upload modes are supported:

- `pnpm blueprints:cover -- --file <photo> --slug <slug> --output <manifest> --upload`
  uses configured S3 credentials with public-bucket Object Read & Write access.
  It uses conditional create-only writes and immutable cache headers.
- `--connector-plan <temporary-file>` replaces `--upload` when using the
  authenticated Cloudflare plugin. The temporary plan contains prepared image
  bytes for direct binary API writes. See the skill's connector reference for
  the object-list/checksum checks, exact URL verification, and narrowly scoped
  cached-404 recovery. This endpoint does not expose the S3 mode's conditional
  or Cache-Control headers.

`pnpm blueprints:cover:attach -- --catalog-key <key> --manifest <manifest>` checks
the live card's SHA-256 and updates the checked-in
`src/server/blueprints/catalog/explore-cover-images.json` registry. `--list`
shows known curated catalog keys. Attachment verifies all three variants'
checksums and decoded JPEG dimensions, and updates both the URL registry and
`explore-cover-manifests.json`. The latter embeds each upload manifest for the
private import path. The server emits optional
`discovery.coverImageURL` only for exact checked-in curated revisions (matching
catalog key, revision, and content hash). The public URL is restricted to the
canonical CDN's immutable card paths. Discovery pagination includes this URL in
its snapshot digest.

Native Explore reads the optional field with a bounded, cancellable background
download and image decode, retaining the existing image cache, cover fallback,
progressive blur, and aspect-ratio callback. It refuses redirects and keeps
private authorized covers as the preferred source. The public URL stays outside
the immutable installation document. For a new saved copy of an exact curated
revision, the server imports the manifest-verified variants into a private,
user-owned `blueprint_cover_asset`, then the existing copy/install lifecycle
below creates the event's private media asset. User replacements and explicit
removal override that default. Completed copies and existing events retain
their original artwork.

### October 22 publication and rollout

The garden-wedding cover (Jen Vazquez, Unsplash `uOO5D8UPuMw`, from the native
bundled curated covers) was uploaded through the Cloudflare plugin. All three
canonical CDN URLs returned HTTP 200 JPEG bytes matching their manifest hashes.
The manifest is in `catalog/cover-manifests/garden-wedding.json`, and the local
registry assigns its card to `wedding`. A cached missing-card response was purged
for that single URL after upload; no bucket access or domain settings changed.

The local R2 S3 credentials returned Access Denied for `gatherory-public`. The
Cloudflare plugin can write bucket objects, but its connection cannot manage
account API tokens. No credential was created, exposed, or replaced.

Web TypeScript checking and the iPhone Duo simulator Debug build passed. No test
suite was added or run. The bundled skill validator passed after its PyYAML
dependency was installed under `/tmp` for validation, without adding a project
dependency. The skill and scripts received a separate read-only agent review. No server
deployment, database migration/reset, phone installation, or installed-event
public-cover support was performed for this path. Public discovery covers need
the server deployment and updated native app; they do not need the private-cover
database migrations.

Blueprint cover uploads use a separate asset lifecycle from event and idea
media. A draft can receive an image before its Blueprint belongs to a published
revision or a workspace event, so upload ownership is the signed-in user. The
asset row and all stored objects remain private. A Blueprint document stores a
`coverAssetId` reference; server writes validate that the actor owns a ready
asset or that the exact authorized source revision contains the reference.

## Upload and delivery

`POST /api/blueprints/media/prepare` accepts a client UUID, JPEG content type,
byte size, and filename. It creates or resumes the actor's pending asset and
returns the signed `PUT` URL, required headers, and expiration. The signed URL
writes to a temporary key. A ready cover's normalized objects use separate
immutable keys, so an upload URL that remains valid briefly cannot overwrite
the image that the application serves.

`POST /api/blueprints/media/finalize` verifies the R2 object metadata and
declared byte size, then streams at most 20 MiB into memory. Sharp verifies the
JPEG signature and dimensions, applies orientation, strips metadata, and writes
a normalized private original plus thumbnail, card, and hero JPEG variants.
The decoder caps images at 40 million pixels; client variants are bounded to
320, 960, and 1600 pixels on their longest edge, including tall images. The
private normalized original may retain a larger dimension within the 40 million
pixel bound. Processing uses a compare-and-set claim with a lease token; an
expired processing claim can be recovered after ten minutes. Each attempt
writes versioned output keys, and only the current lease can publish those keys
as ready.

`POST /api/blueprints/media/url` returns a five-minute signed URL for the
requested `thumbnail`, `card`, or `hero` variant. The owner can read their own
ready cover while authenticated. An anonymous catalog read must identify the
exact catalog key and revision; a shared read must provide the active share
token. In both cases the resolved immutable revision must contain the requested
asset ID. Arbitrary asset IDs do not grant read access.

## Ownership and installation

`blueprint_cover_asset` stores user ownership, processing state, private R2
keys, dimensions, byte size, and checksum. It is intentionally separate from
`media_asset`, whose assets belong to a workspace and are attached through
typed event or idea placement rows.

When an authorized Blueprint is copied or installed, the server resolves the
exact source revision and clones each referenced cover to a fresh deterministic
destination ID. A copy into another user's Blueprint becomes a new user-owned
cover. An install becomes a private workspace `media_asset`; the installation
workflow attaches that ID to its event or idea placement and native projection.
Retries reuse the destination IDs and verify existing asset metadata. Failed
copy/install operations retain any private clone rows or objects written before
the failure, so a concurrent retry cannot have its deterministic output deleted
by the earlier attempt. There is no clone garbage collector yet; add one that
checks Blueprint references and install receipts before removing abandoned
clones. There is also no scheduled cleanup for abandoned pending uploads, so
temporary uploads currently remain until account deletion or a future cleanup
path removes them.

Blueprint covers do not replace the existing event and idea upload path. Those
images continue to use native media preparation and finalization, the
organization-scoped `media_asset` table, and `event_media` / `idea_media`
placements. No crop editor is included in this first slice; the server applies
orientation and bounded resizing to the uploaded JPEG.

Account deletion removes each owned cover's normalized original, temporary
upload object, and generated variants from the private bucket before the
database transaction cascades the owner rows. If an object deletion fails, the
cover rows remain so a retry can repeat the idempotent storage deletes. There
is not yet a scheduled cleanup path for abandoned pending uploads.

## Deployment

Apply the generated Blueprint cover migrations before deploying code that uses
the new schema. The migration sequence creates `blueprint_cover_asset`, then
adds the temporary upload key and processing lease token. The service uses the
existing private R2 bucket and existing upload CORS metadata header. It needs no
public bucket or public CDN configuration. Do not run the migration against a
live database as part of local feature work; deploy it through the normal
database release process.

## October 22: curated-cover carryover

The personal-copy step now enriches an omitted main cover only for an exact
checked-in curated starter revision and content hash backed by an active,
non-template catalog row. The manifest must match the registered discovery URL.
Only canonical immutable CDN variants are fetched, with redirects refused,
time and total-byte limits, SHA-256 verification, and JPEG/dimension checks.
No client URL or digest is accepted as import authority.

The imported cover uses an actor/request/source/digest-scoped deterministic ID,
private owner storage, and verified ready-row reuse. Variant metadata comparison
is structural, so PostgreSQL JSONB key order cannot invalidate a valid retry.
Completed copy retries return their original publication before any new image
fetch; a reused request with changed content remains a conflict. Creation never
rewrites an immutable catalog source or backfills completed copies.

Native preview Home, detail, and the main event editor display the source public
cover until a private cover is available. Removing a public default records an
explicit nil override even when the original asset ID is nil, and immediately
hides the preview. Copy response validation permits only the expected curated
main-cover enrichment; child/idea cover validation remains strict. Final event
installation uses the ordinary private `media_asset`, `event_media`, and native
snapshot references, preserving the existing media permissions and retry paths.

Rollout requires the updated server and native app plus the already-generated
private cover migrations. This change adds no database migration and performs
no production deployment or event/image backfill.

### Carryover verification

- **289 server tests in 36 files passed**, including Blueprint unit, Effect
  workflow, HTTP/contract checks, manifest validation, and the new curated-cover
  PostgreSQL integration. The integration ran against a fresh disposable
  PostgreSQL 18 container, with generated JPEG/CDN fixtures and in-memory private
  storage; it made no real R2 writes. It verifies private Blueprint import,
  event media placement/native snapshot IDs, explicit removal and replacement,
  JSONB key-order-safe reuse, no-CDN completed retries, private main/child copy
  replay, changed-body conflicts, retired sources, and checksum rejection.
- **272 native tests in 40 Blueprint suites passed**, including public-cover
  projection, source validation, explicit nil removal persistence and install
  request encoding, plus existing install/save/recovery coverage. Result:
  `/tmp/gatherory-event-qr-derived/Logs/Test/Test-Gatherory-2026.10.22_12-13-13--0400.xcresult`.
- TypeScript checking, generated contract consistency, production web build,
  iPhone Duo simulator build, English/Spanish localization (1,638 strings), and
  diff checks passed. The image skill's validator passed.
- The attachment command successfully revalidated the existing garden-wedding
  thumbnail/card/hero from the live CDN against checksums and decoded dimensions,
  then refreshed only the local registries. No public image upload or application
  deployment was performed.

Server log: `/tmp/gatherory-cover-carryover-server-tests.log`. Web build log:
`/tmp/gatherory-cover-carryover-web-build.log`. Native build log:
`/tmp/gatherory-cover-carryover-native-build.log`. Physical-device visual and
production end-to-end acceptance remain rollout checks.

### Seeded roots, children, and ideas

Seeded Blueprint artwork is registered outside immutable install documents in
`seed-image-assets.json` and `seed-image-assignments.json`. Assignments bind a
catalog key, revision, and content hash to stable root, child, and idea keys.
Each asset record keeps its checked-in upload manifest, local source path, and
license provenance. Seed preflight verifies complete target coverage and rejects
unknown targets or missing manifests before writing catalog rows.

Catalog discovery returns canonical public card URLs in optional
`discovery.coverImages.children` and `discovery.coverImages.ideas` maps, while
the existing `discovery.coverImageURL` continues to represent the root. These
URLs are display metadata and never installation authority. When a user copies
an exact registered seed revision, omitted root, child, and idea covers are
materialized as actor-owned private Blueprint covers. Explicit nulls and
user-provided cover IDs take priority. Unique source images are verified and
imported with at most three concurrent manifest downloads; completed copy
retries reuse their saved private IDs without CDN requests. Installation then
uses the existing private workspace media clone and placement lifecycle.
