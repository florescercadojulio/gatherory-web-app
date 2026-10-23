# Gatherory Media System

Gatherory treats visual media as part of the event experience rather than as a
generic file attachment. This design adapts the proven attachment patterns from
Guide Systems Procurement while keeping images reusable across event covers,
invitation backgrounds, galleries, ideas, registry items, and future templates.

## Current implementation

The first media slice includes:

- Cloudflare R2 through its S3-compatible API;
- private-by-default storage and short-lived signed URLs;
- direct client uploads through a signed `PUT` URL;
- immutable, workspace-scoped object keys;
- `media_asset` storage metadata separated from `event_media` presentation;
- event-participant authorization for preparing, finalizing, and reading media;
- server-side verification of uploaded size, content type, and media ID; and
- a generated Drizzle migration for the media tables and enums.

Idea, registry-item, and template placement tables are added with those domain
schemas. Do not replace them with a polymorphic `entityType`/`entityId` pair;
typed association tables preserve foreign keys and workspace isolation.

## Vocabulary

- **Media asset** — one immutable object plus its storage and processing
  metadata.
- **Media placement** — how an asset is presented by another domain record.
- **Role** — the placement purpose, such as `cover`, `background`, or `gallery`.
- **Attachment** — optional user-facing language for future PDFs or documents;
  it is not the core image model.

```text
media_asset
  -> event_media
  -> idea_media             (when the idea schema lands)
  -> registry_item_media    (when the registry schema lands)
  -> template_media         (future professional ecosystem)
```

## Immutable storage keys

All keys come from `src/server/media/media.keys.ts`:

```text
workspaces/{workspaceId}/media/{mediaAssetId}/original.{extension}
```

Root-workspace keys do not contain an event or idea ID. Scoped native child
uploads instead use `workspaces/{workspaceId}/events/{eventId}/media/{mediaAssetId}/original.{extension}`.
This retains the upload's event boundary before a canonical placement exists.
A child planner can read their own upload in that scope or a ready asset placed
on that exact event, one of its ideas, or one of its registry items. Organization
ownership alone never grants child planners access to other assets.

A stored asset may be reused or presented differently after authorization
without an R2 copy-and-delete operation.
Filename changes, labels, alt text, ordering, and roles are database updates.

Object keys are useful for organization but are never authorization. Every
media operation resolves the event participant record and required capability.

## Upload lifecycle

```text
Select image
  -> preview locally
  -> prepareEventMediaUpload
      -> authorize event capability
      -> generate immutable key
      -> create short-lived signed PUT URL
      -> insert pending asset and placement
  -> client uploads directly to R2
  -> finalizeEventMediaUpload
      -> authorize again
      -> inspect the R2 object
      -> verify media ID, content type, and exact byte size
      -> mark ready and return a short-lived read URL
```

Never send the R2 access key to a browser or the iOS app. Do not proxy normal
phone-image uploads through a TanStack server function. Both web and iOS use
the same prepare/upload/finalize contract.

The client must send **every** header returned in `requiredHeaders` with the
signed `PUT`: `Content-Type`, `Cache-Control`, and `x-amz-meta-mediaassetid`.
The asset ID must remain an actual signed header, not a query parameter: R2
does not persist hoisted metadata from a presigned URL. A pending upload is not
displayable until finalization succeeds. Finalization is idempotent for an
already-ready asset. Native failed transfers can prepare again with the same
asset UUID, uploader, organization, bucket, and key; ready/deleted assets cannot
be reopened. There is no need to reset the app's local photos or transfer queue.

## Authorization

Media permissions are event-scoped:

- `media.read` — view ready media for an accessible event;
- `media.upload` — add gallery media; and
- `media.manage` — change prominent event media such as covers/backgrounds.

Hosts receive manager capabilities. Collaborators with `contribute` may upload
gallery media. Guests currently receive read access only. A future event
setting may permit guest gallery uploads, but that must be explicit and must
not grant broader planning permissions.

Private read URLs are issued only after resolving a current participant record.
A workspace slug, object key, asset ID, or previously signed URL is not durable
proof of access.

## Storage visibility

Use one public delivery bucket and separate private buckets for development and
production:

| Bucket                   | Environment            | Intended content                                                 | Delivery                                                  |
| ------------------------ | ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `gatherory-private-dev`  | Development            | Event, idea, registry, invitation, and guest media               | Authorized short-lived URLs issued by the local app       |
| `gatherory-private-prod` | Production             | Event, idea, registry, invitation, and guest media               | Authorized short-lived URLs issued by `app.gatherory.com` |
| `gatherory-public`       | Shared public delivery | Explicitly published creator images and curated Explore covers | `https://cdn.gatherory.com`                               |

Publishing does not silently change an existing private asset's storage
contract. If a future template needs a public derivative, create a separately
tracked public asset or an explicit publication record.

Curated Explore artwork uses a public derivative manifest and a checked-in
catalog cover registry. The [Explore image skill](../../.agents/skills/gatherory-explore-images/SKILL.md)
uploads through the authenticated Cloudflare plugin or bucket-scoped S3
credentials. See [Blueprint cover images](blueprint-cover-images.md) for the
commands and rollout status. New personal copies import curated covers into
private Blueprint assets before ordinary event media installation. Explicit
cover replacement/removal takes priority. User event/idea media remains private.

Required configuration:

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_PRIVATE_BUCKET_NAME=gatherory-private-dev
CLOUDFLARE_R2_PUBLIC_BUCKET_NAME=gatherory-public
VITE_PUBLIC_ASSET_URL=https://cdn.gatherory.com
```

Production overrides `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME` with
`gatherory-private-prod`. The R2 token should have object read/write permissions
only for the configured buckets. Keep public development URLs and custom
domains disabled on both private buckets. `app.gatherory.com` authorizes the
request and returns a short-lived signed R2 URL; it is not an R2 public custom
domain.

## CORS

The private bucket must allow direct uploads only from known web origins. A
development policy should allow `http://localhost:3003`; production should
allow only the Gatherory application origins. Permit `PUT`, `GET`, and `HEAD`
with the `Content-Type`, `Cache-Control`, and `x-amz-meta-mediaassetid` headers.
Native iOS requests do not rely on browser CORS,
but they use the same signed URL and required headers.

The checked-in policies are in `infra/cloudflare/r2-cors.dev.json` and
`infra/cloudflare/r2-cors.prod.json`. Apply them with:

```sh
npx wrangler r2 bucket cors set gatherory-private-dev \
  --file infra/cloudflare/r2-cors.dev.json --force
npx wrangler r2 bucket cors set gatherory-private-prod \
  --file infra/cloudflare/r2-cors.prod.json --force
```

The public bucket does not need browser `PUT` CORS until Gatherory supports an
explicit direct-to-public publishing flow. Public derivatives should initially
be written by a trusted server-side worker.

## Local native upload regression

With the existing local API running on port 3003, run `pnpm test:media:r2`.
This opt-in test requires a local database and exactly `gatherory-private-dev`.
It uses a tiny PNG and temporary local accounts to test signed headers, R2 HEAD
metadata, native finalize, download bytes, failed-upload retry, invalid-size
rejection, and authorization. It deletes only its exact temporary R2 keys and
fixture rows. It never logs credentials or signed URLs and does not use the
production or public bucket.

## Preflight before deployment

Run the storage smoke check with the credentials for the environment being
deployed:

```sh
# Development
pnpm media:check

# Production (run with production environment variables loaded)
pnpm media:check -- --origin=https://app.gatherory.com
```

The check uploads a uniquely named text canary, reads it back, and removes it
from each configured bucket. For the private bucket it also performs the same
CORS preflight a browser sends before a signed `PUT`. It never prints access
keys or signed URLs.

The production server must set all of the following in its production
environment. Store credential values as secrets rather than public variables:

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_PRIVATE_BUCKET_NAME=gatherory-private-prod
CLOUDFLARE_R2_PUBLIC_BUCKET_NAME=gatherory-public
VITE_PUBLIC_ASSET_URL=https://cdn.gatherory.com
```

Use a separate production R2 access key restricted to
`gatherory-private-prod` and `gatherory-public`. Do not reuse the development
key or grant it access to the production bucket. The application rejects a
private bucket containing `dev` when the production server starts.

## Validation and limits

The current image contract accepts JPEG, PNG, WebP, HEIC, and HEIF up to 20 MiB.
The server validates declared metadata before signing and inspects the stored
object during finalization. Content type and filename alone are not sufficient
for permanent trust; the processing slice must also inspect file signatures,
decode the image, remove sensitive EXIF location data, and record dimensions.

Future video and audio support use the same `media_asset` table but receive
separate contracts, upload limits, and processing workflows. Do not widen the
image contract to accept arbitrary media.

## Image delivery and processing

The initial connector stores originals and returns private signed URLs. Before
shipping large galleries, add a durable processing worker that:

1. validates image bytes and dimensions;
2. applies orientation and strips private EXIF metadata;
3. creates thumbnail, card, and hero renditions or integrates signed Cloudflare
   image delivery;
4. records width, height, checksum, and processing state; and
5. moves the asset from `uploaded`/`processing` to `ready`.

Do not perform CPU-heavy image processing inside the request that finalizes an
upload. The immutable original remains the source for future renditions.

## Deletion and cleanup

Deleting a placement does not automatically delete a reusable asset. Delete the
underlying object only when no active placement references it and the retention
policy permits removal. Mark records deleted before asynchronous object cleanup
so application reads stop immediately.

Configure R2 lifecycle rules to abort incomplete multipart uploads and remove
objects in a future temporary-upload prefix. A scheduled cleanup workflow should
reconcile old `pending` and unreferenced assets; lifecycle rules do not know the
database state.

## UI upload pattern

Reuse the procurement system's **Select → Preview → Confirm** interaction:

1. select from Photos, Camera, Files, or Image Playground where supported;
2. render a local preview without uploading;
3. let the person confirm framing, label, and applicable role;
4. upload with progress and cancellation; and
5. replace the local preview only after finalization returns ready media.

The UI calls only media handlers. Components never import the R2 connector,
Drizzle schema, repositories, or storage credentials.
