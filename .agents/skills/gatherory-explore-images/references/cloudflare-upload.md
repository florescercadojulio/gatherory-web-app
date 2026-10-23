# Upload through the Cloudflare plugin

Use this when the authenticated Cloudflare connector is available, particularly
when local R2 S3 credentials have access only to private buckets.

## Prepare

From the web/server root, choose the user's image, slug, provenance label, and
manifest path. Add `--connector-plan /tmp/gatherory-explore-cover-plan.json` and
omit `--upload`. The plan contains the JPEG bytes encoded as base64 plus their
checksums, keys, URLs, and configured account ID. Keep this bulky plan out of Git;
the separate small manifest is the durable publication record.

## Publish the prepared variants

Discover the enabled Cloudflare `search` and `execute` tools and read their tool
schemas. Search the API spec before using these endpoints:

- `GET /accounts/{account_id}/r2/buckets/{bucket_name}/domains/custom`
- `GET /accounts/{account_id}/r2/buckets/{bucket_name}/objects`
- `PUT /accounts/{account_id}/r2/buckets/{bucket_name}/objects/{object_key}`

Confirm that `cdn.gatherory.com` is enabled on `gatherory-public` in the plan's
account. No API-token creation or bucket exposure changes are necessary.

Read the plan with local file tools. Avoid printing its base64 data into the
conversation; process one variant at a time through tool orchestration if large.
For each variant:

1. List R2 objects using its exact key as `prefix`; compare returned keys exactly.
   If present, fetch its public URL and compare SHA-256 against the manifest;
   reuse matching bytes. If absent, upload without first requesting the missing
   public URL: a cached 404 can otherwise outlive a successful upload. Stop on a
   mismatched checksum, authentication error, or unexpected status rather than
   overwriting unknown content. If a confirmed existing object has a cached CDN
   404, use the exact-URL purge-and-retry procedure below before deciding whether
   it matches; do not upload over it to repair the cache.
2. Invoke the Cloudflare execute tool with the plan's account ID. Its JavaScript
   creates the binary body as a `Uint8Array`, **not** the base64 text. For example,
   inject the variant object with `JSON.stringify` into this function:

```js
async () => {
  const variant = /* injected plan variant */;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const numbers = [];
  let bits = 0, value = 0;
  for (const character of variant.bodyBase64) {
    if (character === '=') break;
    const digit = alphabet.indexOf(character);
    if (digit < 0) throw new Error('Invalid image encoding');
    value = (value << 6) | digit;
    bits += 6;
    if (bits >= 8) { bits -= 8; numbers.push((value >> bits) & 255); }
  }
  return cloudflare.request({
    method: 'PUT',
    path: `/accounts/${accountId}/r2/buckets/gatherory-public/objects/${variant.key}`,
    contentType: 'image/jpeg',
    rawBody: true,
    body: new Uint8Array(numbers),
  });
}
```

3. Fetch the exact CDN URL again, requiring HTTP 200, JPEG content type, and the
   expected SHA-256. Report success only when all three variants match. Retain
   confirmed objects after a partial failure so rerunning can finish the set.

If R2 confirms the upload but the canonical URL returns a cached 404, discover
`POST /zones/{zone_id}/purge_cache` and purge only that image URL using `files`.
The custom-domain settings include the zone ID. Fetch the canonical URL again;
do not replace the catalog URL with a cache-busting query or purge the zone.

Use bounded downloads (30 seconds, at most 20 MiB) for verification. The connector
object endpoint accepts raw image bytes and Content-Type; it does not expose the
S3 command's conditional-write or Cache-Control headers. Its read-before-write
step is not atomic; immutable content-addressed keys and checksum verification
are essential. Do not use this recipe to replace mutable object keys.

After verification, run the attachment command from the main skill if the user
requested a catalog mapping. Delete only the temporary local connector plan;
retain the manifest and public objects. No database or application deployment is
performed by this recipe.

## Current environment

October 22, 2026: the connector uploaded all three garden-wedding variants to the
existing public bucket successfully. The local S3 credentials returned Access
Denied for that bucket. The connector can write R2 objects but is not authorized
to create account API tokens. Do not treat that token-management limitation as an
R2 object-upload failure.

References: [Cloudflare public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/),
[R2 authentication](https://developers.cloudflare.com/r2/api/tokens/), and
[R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/).
