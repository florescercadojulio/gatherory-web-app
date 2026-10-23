# Blueprint seed images

Seed image bytes, attribution, and target assignments live in checked-in files:

- `src/server/blueprints/catalog/seed-image-assets.json` owns each image's raw
  source path and SHA-256, public variant manifest, and license provenance.
- `src/server/blueprints/catalog/seed-image-assignments.json` maps an exact
  catalog revision and content hash to root, child, and idea image keys.

The immutable Blueprint definition stays unchanged. Discovery resolves the
optional public card artwork from the exact pinned revision. When someone copies
the Blueprint, the server verifies and imports each unique assigned image into
that person's private media storage. Installations then use the existing private
image clone path. Runtime requests never fetch from Unsplash or another source
photo site.

The pool currently contains 36 photos licensed for commercial use under the
[Unsplash License](https://unsplash.com/license) or
[Pexels License](https://www.pexels.com/license/). Their exact source pages,
photographers, license URLs, and verification dates are recorded per asset.
There are 334 searchable targets (25 roots, 114 child events, 195 ideas) and 8
private cottage targets. Both the published cottage and its separate editable
draft receive those eight covers. Relevant images may be reused across targets.

For seeded entries, update the asset and assignment registries together; they
take precedence over the legacy single-root Explore registries. The legacy
attachment CLI rejects seeded keys rather than writing an unused override.

## Check local seed images

From the repository root, run:

```sh
pnpm blueprints:images
```

This is read-only and makes no network or database calls. It checks each raw
source file against `fileChecksum`, then invokes the existing cover preparation
pipeline in dry-run mode to verify the normalized manifest, variant dimensions,
and JPEG hashes against the checked-in data. It validates all unique image
assets; Blueprint seed commands separately fail when any seeded root, child, or
idea lacks an assignment.

To prepare plans for the authenticated Cloudflare connector, use a temporary
directory outside the repository:

```sh
pnpm blueprints:images -- --connector-plan /tmp/gatherory-blueprint-images
```

The command writes one JSON plan per unique image. Each plan includes the
encoded variant bytes and exact keys, URLs, and checksums. Keep that directory
private and remove it after the connector upload. This mode reads only the
Cloudflare account ID from `.env.local` when it is not already set in the
environment; it fixes the plan destination to the public Gatherory bucket and
does not upload or change the database.

To verify that all 108 public variants are already available and match their
manifests, add `--verify-public`:

```sh
pnpm blueprints:images -- --verify-public
```

This performs read-only HTTPS requests to `cdn.gatherory.com`, with four
requests in flight at a time. It checks response type, decoded JPEG dimensions,
and SHA-256. Use it after an authorized upload and before a production seed.
Production and development starter reset commands both use the same checked-in
asset pool and validate the assignment scope before writing their seed rows.

The image preparation command never resets a database, publishes assets, or
calls the original photographer's photo site. Uploading remains a separate,
explicit Cloudflare connector operation.
