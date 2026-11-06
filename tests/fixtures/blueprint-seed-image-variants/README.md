# Blueprint seed image variants

These JPEGs are exact CDN variant bytes for the seed and Explore cover assets
defined in the repository's Blueprint catalog manifests. The manifests remain
the source of truth for each image's source, license, URL, dimensions, and
expected variant checksum.

Each filename is the variant's SHA-256 checksum followed by `.jpg`. Variants
with identical checksums share one file, so URLs and manifests can alias the
same bytes without duplicating the fixture.

To refresh fixtures after an intentional catalog asset or manifest update,
obtain the canonical CDN variant bytes for each changed manifest checksum and
save them under that checksum filename. Verify the file's SHA-256 against the
manifest before adding it. Do not regenerate CDN variants with `sharp` or
another encoder: encoder and platform differences can change bytes and break
the checked-in checksum. Tests read these local files only and make no network
requests at runtime.
