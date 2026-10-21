import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Pool } from 'pg'

import { MediaKeys } from '@/server/media/media.keys'
import type { DevelopmentEventImage } from './development-event-images'

const DEVELOPMENT_BUCKET = 'gatherory-private-dev'
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const FIXTURE_OWNER_EMAIL = 'planner@gatherory.test'
const FIXTURE_AUTHOR_IDENTITIES = [
  { email: 'planner@gatherory.test', name: 'Alex Morgan' },
  { email: 'jordan@gatherory.test', name: 'Jordan Lee' },
  { email: 'coordinator@gatherory.test', name: 'Maya Chen' },
  { email: 'guest@gatherory.test', name: 'Sam Rivera' },
  { email: 'appreview@gatherory.test', name: 'Gatherory App Review' },
] as const
const FIXTURE_SCOPE_ID = '10000000-0000-4000-8000-000000000001'

type QueryResult<Row = Record<string, unknown>> = { rows: Row[]; rowCount: number | null }
type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[]
  ) => Promise<QueryResult<Row>>
}
type PoolLike = {
  connect: () => Promise<PoolClientLike>
  end?: () => Promise<void>
}
type PoolClientLike = Queryable & { release: () => void }

export type DevelopmentEventImageObjectHead = {
  mediaAssetId: string | null
  contentType: string | null
  byteSize: number | null
  checksum: string | null
  sha256: string | null
  etag: string | null
}

export type DevelopmentEventImageStorage = {
  head: (bucket: string, key: string) => Promise<DevelopmentEventImageObjectHead | null>
  put: (input: {
    bucket: string
    key: string
    body: Buffer
    contentType: 'image/jpeg'
    mediaAssetId: string
    checksumSha256: string
  }) => Promise<void>
}

export type DevelopmentEventImageUpdateInput = {
  databaseUrl: string
  nodeEnv?: string
  apply?: boolean
  privateBucket?: string
  pool?: PoolLike
  assets?: readonly DevelopmentEventImage[]
  readAsset?: (file: string) => Promise<Buffer>
  storage?: DevelopmentEventImageStorage
  /** Tests may provide a fixed root while production reads relative to web root. */
  webRoot?: string
}

export type DevelopmentEventImageUpdateCounts = {
  mode: 'dry-run' | 'applied'
  candidates: number
  insertedAssets: number
  insertedPlacements: number
  snapshots: number
  syncEntities: number
  syncChanges: number
  preserved: number
}

type Target = {
  asset: DevelopmentEventImage
  organizationId: string
  ownerUserId: string
  scopeId: string
  mediaAssetId: string
  storageKey: string
  bytes: Buffer
  checksum: string
  sha256: string
}

function deterministicUUID(value: string) {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function assertLocalDevelopmentEventImageTarget(databaseUrl: string, nodeEnv?: string) {
  let target: URL
  try {
    target = new URL(databaseUrl)
  } catch {
    throw new Error('Development event image updates require an allowlisted local database.')
  }
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
  const permittedDatabase =
    target.pathname === '/gatherory' ||
    (nodeEnv === 'test' && /^\/gatherory_seed_images_test_[a-z0-9_]+$/i.test(target.pathname))
  if (
    nodeEnv === 'production' ||
    !['postgres:', 'postgresql:'].includes(target.protocol) ||
    !localHost ||
    !permittedDatabase
  )
    throw new Error(
      'Development event image updates require an allowlisted local gatherory database.'
    )
}

function decodePayload(payload: string) {
  const json = Buffer.from(payload, 'base64').toString('utf8')
  const value: unknown = JSON.parse(json)
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Fixture sync payload has an unsupported shape.')
  return value as Record<string, any>
}

function encodePayload(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

function hasExistingImage(value: Record<string, any>, asset: DevelopmentEventImage) {
  const imageData = asset.entityType === 'workspace' ? value.mainEventImageData : value.imageData
  const mediaAssetId =
    asset.entityType === 'workspace' ? value.mainEventMediaAssetID : value.mediaAssetID
  const hasImageData =
    typeof imageData === 'string'
      ? imageData.trim().length > 0
      : imageData !== null && imageData !== undefined
  const hasMediaAssetId =
    typeof mediaAssetId === 'string'
      ? mediaAssetId.trim().length > 0
      : mediaAssetId !== null && mediaAssetId !== undefined
  return hasImageData || hasMediaAssetId
}

function targetCollection(
  root: Record<string, any>,
  entityType: DevelopmentEventImage['entityType']
) {
  if (entityType === 'workspace') return [root]
  if (entityType === 'event') return Array.isArray(root.timeline) ? root.timeline : []
  if (entityType === 'idea') return Array.isArray(root.ideas) ? root.ideas : []
  return Array.isArray(root.registry) ? root.registry : []
}

function findFixtureRecord(root: Record<string, any>, asset: DevelopmentEventImage) {
  if (asset.entityType === 'workspace')
    return root.isMainEventDeleted !== true &&
      root.mainEventID === asset.entityID &&
      root.title === asset.title
      ? root
      : undefined
  return targetCollection(root, asset.entityType).find(
    (record: Record<string, any>) =>
      record.id === asset.entityID &&
      record.title === asset.title &&
      (asset.entityType === 'event'
        ? asset.eventID === asset.entityID &&
          (!record.parentEventID || record.parentEventID === FIXTURE_SCOPE_ID)
        : record.eventID === asset.eventID)
  ) as Record<string, any> | undefined
}

function setFixtureImage(
  value: Record<string, any>,
  asset: DevelopmentEventImage,
  mediaAssetId: string
) {
  if (asset.entityType === 'workspace') {
    value.mainEventImageData = null
    value.mainEventMediaAssetID = mediaAssetId
  } else {
    value.imageData = null
    value.mediaAssetID = mediaAssetId
  }
}

function isJPEG(bytes: Buffer) {
  return (
    bytes.length >= 6 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes.lastIndexOf(Buffer.from([0xff, 0xd9])) > 2
  )
}

function expectedTitleForEntry(asset: DevelopmentEventImage) {
  // Stable IDs bound the catalog to the synthetic review workspace. Exact
  // titles are rechecked against normalized and native records before writing.
  const allowed: Record<DevelopmentEventImage['entityType'], ReadonlySet<string>> = {
    workspace: new Set(['10000000-0000-4000-8000-000000000001']),
    event: new Set([
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000006',
      '10000000-0000-4000-8000-000000000007',
    ]),
    idea: new Set(
      Array.from(
        { length: 13 },
        (_, index) => `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
      )
    ),
    registry_item: new Set(['60000000-0000-4000-8000-000000000001']),
  }
  return allowed[asset.entityType].has(asset.entityID) && asset.title.trim().length > 0
}

function expectedEntityIdForEntry(asset: DevelopmentEventImage) {
  return expectedTitleForEntry(asset)
}

function assertCatalogEntry(asset: DevelopmentEventImage) {
  if (!expectedEntityIdForEntry(asset))
    throw new Error('Image catalog contains an entity outside the known development fixture.')
  if (asset.entityType === 'event' && asset.eventID !== asset.entityID)
    throw new Error('Image catalog event identity differs from the known development fixture.')
  if (
    asset.entityType !== 'workspace' &&
    asset.entityType !== 'event' &&
    asset.eventID !== FIXTURE_SCOPE_ID
  ) {
    // All ideas and registry records in this seed are attached to the root event
    // except the explicitly scheduled reception decor idea.
    if (!(
      asset.entityType === 'idea' &&
      asset.entityID === '20000000-0000-4000-8000-000000000010' &&
      asset.eventID === '10000000-0000-4000-8000-000000000006'
    ))
      throw new Error('Image catalog event scope differs from the known development fixture.')
  }
  if (asset.entityType === 'workspace' && asset.entityID !== FIXTURE_SCOPE_ID)
    throw new Error('Image catalog workspace scope differs from the known development fixture.')
}

function placementTable(entityType: DevelopmentEventImage['entityType']) {
  if (entityType === 'workspace' || entityType === 'event')
    return { table: 'event_media', entityColumn: 'event_id', role: 'cover' }
  if (entityType === 'idea') return { table: 'idea_media', entityColumn: 'idea_id', role: 'cover' }
  return { table: 'registry_item_media', entityColumn: 'registry_item_id', role: 'cover' }
}

async function defaultReadAsset(file: string, webRoot: string) {
  const root = path.resolve(webRoot)
  const target = path.resolve(root, file)
  if (!target.startsWith(`${root}${path.sep}`))
    throw new Error('Image catalog path escapes the web root.')
  return readFile(target)
}

export async function preflightDevelopmentEventImages(input: {
  databaseUrl: string
  nodeEnv?: string
  apply?: boolean
  privateBucket?: string
  assets?: readonly DevelopmentEventImage[]
  readAsset?: (file: string) => Promise<Buffer>
  webRoot?: string
  requireR2Credentials?: boolean
}) {
  const apply = input.apply === true
  assertLocalDevelopmentEventImageTarget(input.databaseUrl, input.nodeEnv)
  if (apply) {
    if (
      (input.privateBucket ?? process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME) !== DEVELOPMENT_BUCKET
    )
      throw new Error('Apply mode requires the private development bucket.')
    if (
      input.requireR2Credentials !== false &&
      [
        process.env.CLOUDFLARE_ACCOUNT_ID,
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      ].some((value) => !value)
    )
      throw new Error('Apply mode requires configured private R2 credentials.')
  }
  const catalog =
    input.assets ?? (await import('./development-event-images')).developmentEventImages
  for (const asset of catalog) assertCatalogEntry(asset)
  const webRoot = path.resolve(input.webRoot ?? process.cwd())
  const read = input.readAsset ?? ((file: string) => defaultReadAsset(file, webRoot))
  for (const asset of catalog) {
    const bytes = await read(asset.file)
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES || !isJPEG(bytes))
      throw new Error('Image catalog entry is not a supported JPEG fixture image.')
  }
  return { images: catalog.length, mode: apply ? ('apply' as const) : ('dry-run' as const) }
}

async function localStorage(configuration: {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
}): Promise<DevelopmentEventImageStorage> {
  const { HeadObjectCommand, PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${configuration.accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey,
    },
  })
  return {
    async head(bucket, key) {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        return {
          mediaAssetId: result.Metadata?.mediaassetid ?? null,
          contentType: result.ContentType ?? null,
          byteSize: result.ContentLength ?? null,
          checksum: result.ETag?.replaceAll('"', '') ?? null,
          sha256: result.Metadata?.checksumsha256 ?? null,
          etag: result.ETag ?? null,
        }
      } catch (error) {
        if (
          (error as { name?: string }).name === 'NotFound' ||
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
        )
          return null
        throw error
      }
    },
    async put(input) {
      await client.send(
        new PutObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          CacheControl: 'private, max-age=31536000, immutable',
          Metadata: { mediaassetid: input.mediaAssetId, checksumsha256: input.checksumSha256 },
          IfNoneMatch: '*',
        })
      )
    },
  }
}

async function ensureStoredObject(
  target: Target,
  bucket: string,
  storage: DevelopmentEventImageStorage
) {
  const md5 = createHash('md5').update(target.bytes).digest('hex')
  const validHead = (head: DevelopmentEventImageObjectHead | null) =>
    Boolean(
      head &&
      head.mediaAssetId === target.mediaAssetId &&
      head.contentType === 'image/jpeg' &&
      head.byteSize === target.bytes.byteLength &&
      head.checksum?.toLowerCase() === target.checksum &&
      head.sha256 === target.sha256 &&
      head.etag?.replaceAll('"', '').toLowerCase() === md5
    )
  const existing = await storage.head(bucket, target.storageKey)
  if (existing) {
    if (!validHead(existing))
      throw new Error('An immutable image object key already contains different data.')
    return
  }
  try {
    await storage.put({
      bucket,
      key: target.storageKey,
      body: target.bytes,
      contentType: 'image/jpeg',
      mediaAssetId: target.mediaAssetId,
      checksumSha256: target.sha256,
    })
  } catch {
    // A racing retry may have created the immutable object after our HEAD.
    // Accept only a byte-for-byte metadata match; never overwrite it.
  }
  const stored = await storage.head(bucket, target.storageKey)
  if (!validHead(stored)) throw new Error('Uploaded image failed private object verification.')
}

async function applyTarget(
  client: PoolClientLike,
  target: Target,
  bucket: string,
  storage?: DevelopmentEventImageStorage,
  dryRun = false
) {
  const asset = target.asset
  const fixture = await client.query<{
    title: string
    event_id: string | null
    organization_id: string
    image_url: string | null
    authored_by: string | null
  }>(
    asset.entityType === 'event' || asset.entityType === 'workspace'
      ? 'SELECT id, title, parent_event_id AS event_id, organization_id, image_url, created_by_user_id AS authored_by FROM event WHERE id = $1 AND organization_id = $2 FOR UPDATE'
      : asset.entityType === 'idea'
        ? 'SELECT id, title, event_id, organization_id, NULL::text AS image_url, submitted_by_user_id AS authored_by FROM idea WHERE id = $1 AND organization_id = $2 FOR UPDATE'
        : 'SELECT id, title, event_id, organization_id, NULL::text AS image_url, created_by_user_id AS authored_by FROM registry_item WHERE id = $1 AND organization_id = $2 FOR UPDATE',
    [asset.entityID, target.organizationId]
  )
  const row = fixture.rows[0]
  if (
    !row ||
    row.title !== asset.title ||
    ((asset.entityType === 'idea' || asset.entityType === 'registry_item') &&
      row.event_id !== asset.eventID) ||
    (asset.entityType === 'event' && asset.eventID !== asset.entityID) ||
    (asset.entityType === 'event' && row.event_id !== null && row.event_id !== FIXTURE_SCOPE_ID) ||
    (asset.entityType === 'workspace' && row.event_id !== null)
  )
    return 'preserved' as const
  if (
    (asset.entityType === 'workspace' || asset.entityType === 'event') &&
    row.authored_by !== target.ownerUserId
  )
    return 'preserved' as const
  const expectedEntityOwnerId = asset.entityType === 'idea' ? row.authored_by : target.ownerUserId
  if (!expectedEntityOwnerId) return 'preserved' as const
  const fixtureAuthor = await client.query<{ id: string; email: string; name: string }>(
    'SELECT id, email, name FROM "user" WHERE id = $1 FOR UPDATE',
    [expectedEntityOwnerId]
  )
  if (
    !fixtureAuthor.rows[0] ||
    !FIXTURE_AUTHOR_IDENTITIES.some(
      (identity) =>
        identity.email === fixtureAuthor.rows[0].email &&
        identity.name === fixtureAuthor.rows[0].name
    )
  )
    return 'preserved' as const

  const placement = placementTable(asset.entityType)
  const currentPlacement = await client.query<{ media_asset_id: string }>(
    `SELECT media_asset_id FROM ${placement.table} WHERE organization_id = $1 AND ${placement.entityColumn} = $2 AND role = $3 FOR UPDATE`,
    [
      target.organizationId,
      asset.entityType === 'workspace' ? asset.eventID : asset.entityID,
      placement.role,
    ]
  )
  if (currentPlacement.rows.length) {
    if (currentPlacement.rows.some((item) => item.media_asset_id === target.mediaAssetId)) {
      const currentAsset = await client.query<{
        organization_id: string
        uploaded_by_user_id: string | null
        status: string
        visibility: string
        bucket: string
        storage_key: string
        content_type: string
        byte_size: number
        checksum: string | null
        moderation_hidden_at: unknown
        deleted_at: unknown
      }>(
        'SELECT organization_id, uploaded_by_user_id, status, visibility, bucket, storage_key, content_type, byte_size, checksum, moderation_hidden_at, deleted_at FROM media_asset WHERE id = $1 FOR UPDATE',
        [target.mediaAssetId]
      )
      const row = currentAsset.rows[0]
      if (
        !row ||
        row.organization_id !== target.organizationId ||
        row.uploaded_by_user_id !== expectedEntityOwnerId ||
        row.status !== 'ready' ||
        row.visibility !== 'private' ||
        row.bucket !== bucket ||
        row.storage_key !== target.storageKey ||
        row.content_type !== 'image/jpeg' ||
        Number(row.byte_size) !== target.bytes.byteLength ||
        row.checksum !== target.checksum ||
        row.moderation_hidden_at ||
        row.deleted_at
      )
        throw new Error('Existing media asset does not match the validated fixture image.')
      if (!dryRun && storage) {
        const stored = await storage.head(bucket, target.storageKey)
        const md5 = createHash('md5').update(target.bytes).digest('hex')
        if (
          !stored ||
          stored.mediaAssetId !== target.mediaAssetId ||
          stored.contentType !== 'image/jpeg' ||
          stored.byteSize !== target.bytes.byteLength ||
          stored.checksum?.toLowerCase() !== target.checksum ||
          stored.sha256 !== target.sha256 ||
          stored.etag?.replaceAll('"', '').toLowerCase() !== md5
        )
          throw new Error('Existing private image object failed verification.')
      }
    }
    return 'preserved' as const
  }
  if (asset.entityType === 'event' || asset.entityType === 'workspace') {
    if (row.image_url?.trim()) return 'preserved' as const
  }

  const snapshotResult = await client.query<{
    scope_id: string
    payload: string
    server_version: number
  }>(
    'SELECT scope_id, payload, server_version FROM native_workspace_snapshot WHERE organization_id = $1 AND owner_user_id = $2 AND NOT is_deleted FOR UPDATE',
    [target.organizationId, target.ownerUserId]
  )
  const snapshot = snapshotResult.rows.find((candidate) => candidate.scope_id === target.scopeId)
  if (!snapshot) return 'preserved' as const
  const root = decodePayload(snapshot.payload)
  const snapshotRecord = findFixtureRecord(root, asset)
  if (!snapshotRecord || hasExistingImage(snapshotRecord, asset)) return 'preserved' as const

  const entitiesResult = await client.query<{
    entity_type: string
    entity_id: string
    owner_user_id: string
    payload: string
    server_version: number
    is_deleted: boolean
  }>(
    'SELECT entity_type, entity_id, owner_user_id, payload, server_version, is_deleted FROM native_sync_entity WHERE scope_id = $1 AND NOT is_deleted AND entity_type = $2 AND entity_id = $3 FOR UPDATE',
    [
      target.scopeId,
      asset.entityType === 'workspace' ? 'workspace' : asset.entityType,
      asset.entityID,
    ]
  )
  const syncEntity = entitiesResult.rows[0]
  if (!syncEntity || syncEntity.owner_user_id !== expectedEntityOwnerId) return 'preserved' as const
  const entityPayload = decodePayload(syncEntity.payload)
  const entityRecord = entityPayload
  if (hasExistingImage(entityRecord, asset)) return 'preserved' as const
  if (asset.entityType === 'workspace') {
    if (!findFixtureRecord(entityPayload, asset)) return 'preserved' as const
  } else if (entityPayload.id !== asset.entityID || entityPayload.title !== asset.title) {
    return 'preserved' as const
  } else if (asset.entityType === 'event') {
    if (entityPayload.parentEventID !== FIXTURE_SCOPE_ID) return 'preserved' as const
  } else if (entityPayload.eventID !== asset.eventID) {
    return 'preserved' as const
  }

  const workspaceResult = await client.query<{
    payload: string
    server_version: number
    owner_user_id: string
    is_deleted: boolean
  }>(
    "SELECT payload, server_version, owner_user_id, is_deleted FROM native_sync_entity WHERE scope_id = $1 AND entity_type = 'workspace' AND entity_id = $1 FOR UPDATE",
    [target.scopeId]
  )
  const workspaceEntity = workspaceResult.rows[0]
  if (
    !workspaceEntity ||
    workspaceEntity.is_deleted ||
    workspaceEntity.owner_user_id !== target.ownerUserId
  )
    return 'preserved' as const
  const workspacePayload = decodePayload(workspaceEntity.payload)
  const workspaceRecord = findFixtureRecord(workspacePayload, asset)
  if (!workspaceRecord || hasExistingImage(workspaceRecord, asset)) return 'preserved' as const

  if (!dryRun) {
    if (!storage) throw new Error('Private development image storage is required in apply mode.')
    await ensureStoredObject(target, bucket, storage)
    await client.query(
      `INSERT INTO media_asset (id, organization_id, uploaded_by_user_id, kind, status, visibility, bucket, storage_key, original_filename, display_name, alt_text, content_type, byte_size, checksum, created_at, updated_at) VALUES ($1, $2, $3, 'image', 'ready', 'private', $4, $5, $6, $7, $8, 'image/jpeg', $9, $10, now(), now()) ON CONFLICT (id) DO NOTHING`,
      [
        target.mediaAssetId,
        target.organizationId,
        expectedEntityOwnerId,
        bucket,
        target.storageKey,
        path.basename(asset.file),
        asset.title,
        asset.altText,
        target.bytes.byteLength,
        target.checksum,
      ]
    )
    const assetRow = await client.query<{
      id: string
      organization_id: string
      uploaded_by_user_id: string | null
      status: string
      visibility: string
      bucket: string
      storage_key: string
      content_type: string
      byte_size: number
      checksum: string | null
      moderation_hidden_at: unknown
      deleted_at: unknown
    }>(
      'SELECT id, organization_id, uploaded_by_user_id, status, visibility, bucket, storage_key, content_type, byte_size, checksum, moderation_hidden_at, deleted_at FROM media_asset WHERE id = $1 FOR UPDATE',
      [target.mediaAssetId]
    )
    const storedAsset = assetRow.rows[0]
    if (
      !storedAsset ||
      storedAsset.organization_id !== target.organizationId ||
      storedAsset.uploaded_by_user_id !== expectedEntityOwnerId ||
      storedAsset.status !== 'ready' ||
      storedAsset.visibility !== 'private' ||
      storedAsset.bucket !== bucket ||
      storedAsset.storage_key !== target.storageKey ||
      storedAsset.content_type !== 'image/jpeg' ||
      Number(storedAsset.byte_size) !== target.bytes.byteLength ||
      storedAsset.checksum !== target.checksum ||
      storedAsset.moderation_hidden_at ||
      storedAsset.deleted_at
    )
      throw new Error('Existing media asset does not match the validated fixture image.')
    await client.query(
      `INSERT INTO ${placement.table} (organization_id, ${placement.entityColumn}, media_asset_id, role, sort_order) VALUES ($1, $2, $3, 'cover', 0) ON CONFLICT DO NOTHING`,
      [
        target.organizationId,
        asset.entityType === 'workspace' ? asset.eventID : asset.entityID,
        target.mediaAssetId,
      ]
    )
  }

  setFixtureImage(snapshotRecord, asset, target.mediaAssetId)
  setFixtureImage(entityRecord, asset, target.mediaAssetId)
  setFixtureImage(workspaceRecord, asset, target.mediaAssetId)
  const updatedSnapshot = encodePayload(root)
  const updatedEntity = encodePayload(entityPayload)
  const updatedWorkspace = encodePayload(workspacePayload)
  if (!dryRun) {
    await client.query(
      'UPDATE native_workspace_snapshot SET payload = $1, server_version = server_version + 1, updated_at = now() WHERE scope_id = $2',
      [updatedSnapshot, snapshot.scope_id]
    )
    if (asset.entityType === 'workspace') {
      const workspaceVersion = workspaceEntity.server_version + 1
      await client.query(
        "UPDATE native_sync_entity SET payload = $1, server_version = $2, updated_at = now() WHERE scope_id = $3 AND entity_type = 'workspace' AND entity_id = $3",
        [updatedWorkspace, workspaceVersion, target.scopeId]
      )
      await client.query(
        "INSERT INTO native_sync_change (owner_user_id, scope_id, entity_type, entity_id, operation, payload, server_version) VALUES ($1, $2, 'workspace', $3, 'update', $4, $5)",
        [
          workspaceEntity.owner_user_id,
          target.scopeId,
          target.scopeId,
          updatedWorkspace,
          workspaceVersion,
        ]
      )
    } else {
      const version = syncEntity.server_version + 1
      await client.query(
        'UPDATE native_sync_entity SET payload = $1, server_version = $2, updated_at = now() WHERE scope_id = $3 AND entity_type = $4 AND entity_id = $5',
        [updatedEntity, version, target.scopeId, syncEntity.entity_type, syncEntity.entity_id]
      )
      await client.query(
        "INSERT INTO native_sync_change (owner_user_id, scope_id, entity_type, entity_id, operation, payload, server_version) VALUES ($1, $2, $3, $4, 'update', $5, $6)",
        [
          syncEntity.owner_user_id,
          target.scopeId,
          syncEntity.entity_type,
          syncEntity.entity_id,
          updatedEntity,
          version,
        ]
      )
      const workspaceVersion = workspaceEntity.server_version + 1
      await client.query(
        "UPDATE native_sync_entity SET payload = $1, server_version = $2, updated_at = now() WHERE scope_id = $3 AND entity_type = 'workspace' AND entity_id = $3",
        [updatedWorkspace, workspaceVersion, target.scopeId]
      )
      await client.query(
        "INSERT INTO native_sync_change (owner_user_id, scope_id, entity_type, entity_id, operation, payload, server_version) VALUES ($1, $2, 'workspace', $3, 'update', $4, $5)",
        [
          workspaceEntity.owner_user_id,
          target.scopeId,
          target.scopeId,
          updatedWorkspace,
          workspaceVersion,
        ]
      )
    }
  }
  return dryRun ? ('candidate' as const) : ('updated' as const)
}

export async function runDevelopmentEventImageUpdate(
  input: DevelopmentEventImageUpdateInput
): Promise<DevelopmentEventImageUpdateCounts> {
  const apply = input.apply === true
  await preflightDevelopmentEventImages({ ...input, requireR2Credentials: apply && !input.storage })
  const catalog =
    input.assets ?? (await import('./development-event-images')).developmentEventImages
  const webRoot = path.resolve(input.webRoot ?? process.cwd())
  const read = input.readAsset ?? ((file: string) => defaultReadAsset(file, webRoot))
  const prepared: Array<{
    asset: DevelopmentEventImage
    bytes: Buffer
    checksum: string
    sha256: string
  }> = []
  for (const asset of catalog) {
    const bytes = await read(asset.file)
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES || !isJPEG(bytes))
      throw new Error('Image catalog entry is not a supported JPEG fixture image.')
    const checksum = createHash('md5').update(bytes).digest('hex')
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    prepared.push({ asset, bytes, checksum, sha256 })
  }

  let storage = input.storage
  if (apply && !storage) {
    const configuration = {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
    }
    storage = await localStorage(configuration)
  }
  const pool = (input.pool ??
    new Pool({
      connectionString: input.databaseUrl,
      connectionTimeoutMillis: 5000,
    })) as unknown as PoolLike
  const client = await pool.connect()
  const counts: DevelopmentEventImageUpdateCounts = {
    mode: apply ? 'applied' : 'dry-run',
    candidates: 0,
    insertedAssets: 0,
    insertedPlacements: 0,
    snapshots: 0,
    syncEntities: 0,
    syncChanges: 0,
    preserved: 0,
  }
  try {
    await client.query('BEGIN')
    await client.query("SET LOCAL statement_timeout = '15s'")
    await client.query("SET LOCAL lock_timeout = '5s'")
    const database = await client.query<{ name: string }>('SELECT current_database() AS name')
    if (database.rows[0]?.name !== new URL(input.databaseUrl).pathname.slice(1))
      throw new Error('Connected database differs from the allowlisted local target.')
    const owner = await client.query<{ id: string }>(
      'SELECT id FROM "user" WHERE email = $1 AND name = $2 FOR UPDATE',
      [FIXTURE_OWNER_EMAIL, 'Alex Morgan']
    )
    const ownerId = owner.rows[0]?.id
    if (!ownerId) throw new Error('Known development fixture owner was not found.')
    const org = await client.query<{ id: string }>(
      "SELECT o.id FROM organization o INNER JOIN member m ON m.organization_id = o.id AND m.user_id = $2 AND m.role = 'owner' WHERE o.slug = $1 FOR UPDATE OF o",
      [`personal-${ownerId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`, ownerId]
    )
    const organizationId = org.rows[0]?.id
    if (!organizationId)
      throw new Error('Known development fixture workspace ownership did not match.')
    const snapshot = await client.query<{ scope_id: string; owner_user_id: string }>(
      'SELECT scope_id, owner_user_id FROM native_workspace_snapshot WHERE organization_id = $1 AND owner_user_id = $2 AND NOT is_deleted FOR UPDATE',
      [organizationId, ownerId]
    )
    if (!snapshot.rows.some((row) => row.scope_id === FIXTURE_SCOPE_ID))
      throw new Error('Known development fixture sync scope was not found.')
    for (const item of prepared) {
      const mediaAssetId = deterministicUUID(
        `${organizationId}:${item.asset.entityType}:${item.asset.entityID}:${item.asset.photoID}:${item.sha256}`
      )
      const actualKey = MediaKeys.scopedOriginal({
        workspaceId: organizationId,
        scopeId: item.asset.eventID,
        mediaAssetId,
        contentType: 'image/jpeg',
      })
      const result = await applyTarget(
        client,
        {
          ...item,
          organizationId,
          ownerUserId: ownerId,
          scopeId: FIXTURE_SCOPE_ID,
          mediaAssetId,
          storageKey: actualKey,
        },
        DEVELOPMENT_BUCKET,
        storage,
        !apply
      )
      if (result === 'preserved') counts.preserved++
      else {
        counts.candidates++
        if (apply && result === 'updated') {
          counts.insertedAssets++
          counts.insertedPlacements++
          counts.snapshots++
          counts.syncEntities += item.asset.entityType === 'workspace' ? 1 : 2
          counts.syncChanges += item.asset.entityType === 'workspace' ? 1 : 2
        }
      }
    }
    await client.query(apply ? 'COMMIT' : 'ROLLBACK')
    return counts
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    if (!input.pool) await pool.end?.()
  }
}
