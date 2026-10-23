---
name: gatherory-explore-images
description: Upload licensed Gatherory Explore blueprint, child-event, and idea cover photos to public R2, preserve provenance, and maintain complete seed image coverage. Use when adding or replacing curated Explore artwork.
---

# Gatherory Explore images

Use the repository's uploader; do not reinvent image processing or manually build
object URLs. The web/server checkout owns the scripts and the curated registry.
Default checkout: `/Users/nexus/Documents/gatherory/gatherory-web-app`; use the
active checkout if it has moved. Follow its `AGENTS.md` before editing files.

## Upload

Use the image supplied by the user, or an explicitly chosen bundled curated
photo with known provenance. A request to upload it authorizes publishing that
image. Public images are accessible without sign-in; event/guest/album uploads
continue to use the private media flow.

Prefer the authenticated Cloudflare plugin when available: prepare the image and
use the connector recipe in [references/cloudflare-upload.md](references/cloudflare-upload.md).
It does not require local S3 credentials or permission to create API tokens.

With existing bucket-scoped S3 credentials, run from the web/server root:

```sh
pnpm blueprints:cover -- --file '/path/to/photo.jpg' --slug garden-wedding \
  --label 'Photographer / source or user-owned photo' \
  --output src/server/blueprints/catalog/cover-manifests/garden-wedding.json \
  --upload
```

Create the manifest's parent folder first if needed. Omit `--upload` for a local
preparation request. Use a descriptive lowercase hyphenated slug. Sources may be
JPEG, PNG, WebP, AVIF, HEIF, or TIFF if the installed Sharp decoder supports them;
animated/multipage sources are rejected. No crop UI or external image editing is
required.

The command normalizes orientation, strips metadata, and preserves proportions in
320-, 960-, and 1600-pixel thumbnail/card/hero JPEGs without enlargement. Objects
use content-addressed `explore/covers/<slug>/<hash>/<variant>.jpg` keys, conditional
create-only writes, and immutable cache headers. It never replaces an existing
different image or makes a private object public. Changing processing settings
requires a new processing version in the script.

Configuration comes from existing environment variables and `.env.local`:
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`,
`CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_PUBLIC_BUCKET_NAME=gatherory-public`,
and `VITE_PUBLIC_ASSET_URL=https://cdn.gatherory.com`. Do not print credentials or
put them in the skill, manifests, or Git. Public uploads require R2 Object Read &
Write for `gatherory-public`; private-bucket credentials may not grant this.

If S3 upload returns Access Denied, stop retrying that credential and use the
Cloudflare connector recipe when available. Do not widen private bucket access,
disable authentication, or claim the prepared manifest was uploaded. A successful
S3 command also checks all three public variants. Repeating the same authorized
command reuses identical objects safely.

## Attach to Explore

Seeded blueprints use `seed-image-assets.json` and
`seed-image-assignments.json` under `src/server/blueprints/catalog/`. Read
`docs/architecture/blueprint-seed-images.md` when updating those mappings.
Every seeded root, child event, and idea needs an explicit, suitable image.
Keep the licensed original in the repository and record its raw file checksum,
photographer, source page, license URL, verification date, and variant manifest
in the asset registry. Reusing a suitable photo is allowed; unrelated placeholder
photos do not satisfy coverage. Never use an unverified search-result image.

Map image keys to the exact catalog key, revision, content hash, and stable
target keys without changing the immutable definition. Check all targets and
regenerated variants with `pnpm blueprints:images`; after publishing, run
`pnpm blueprints:images -- --verify-public`. Prepare a whole pool for the
Cloudflare connector with `--connector-plan /tmp/gatherory-blueprint-images`.
Keep encoded upload plans outside Git. Refresh affected wire fixtures and run
seed coverage tests after changing discovery metadata.

For a curated root that is not managed by the seed image assignments, the legacy
single-cover attachment command remains available:

```sh
pnpm blueprints:cover:attach -- --list
pnpm blueprints:cover:attach -- --catalog-key wedding \
  --manifest src/server/blueprints/catalog/cover-manifests/garden-wedding.json
```

This verifies all three public variants (checksums and decoded dimensions) and
updates both `src/server/blueprints/catalog/explore-cover-images.json` and
`explore-cover-manifests.json`. The second registry embeds the manifest needed
to import the curated image when a user creates an event. Choose the exact
existing catalog key; do not guess from a display title. Add a new curated
blueprint to the catalog before attaching its cover. Preserve source/license
details in the manifest label or owning catalog documentation.

The registry drives the optional discovery `coverImageURL`; never place a URL in
`coverAssetId`. Server deployment and the updated native app are needed for the
new discovery field to appear on a phone. During event creation, the server
imports the exact curated revision's verified image into a private, user-owned
Blueprint cover, then uses the existing private `coverAssetId` copy/install path.
A user's replacement or explicit removal takes priority. Existing completed
copies and installed events retain their artwork. Do not run a database reset
or rewrite an immutable catalog revision to change a discovery cover.

Return the manifest path and public card/hero URLs from its `variants` array,
whether the catalog mapping changed, and any deployment or access limitation.
If any upload or verification failed, report that explicitly rather than
presenting the URLs as live assets.
