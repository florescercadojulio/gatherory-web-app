import { createHash } from 'node:crypto'
import path from 'node:path'
import { Pool } from 'pg'

import { MediaKeys } from '@/server/media/media.keys'
import {
  decodePayload,
  defaultReadAsset,
  deterministicUUID,
  encodePayload,
  isJPEG,
  localStorage,
  preflightDevelopmentEventImages,
} from './development-event-images-update'
import type {
  DevelopmentEventImageObjectHead,
  DevelopmentEventImageStorage,
  DevelopmentEventImageUpdateInput,
} from './development-event-images-update'
import {
  developmentSharedAlbumContributors,
  type DevelopmentSharedAlbumContributor,
  type DevelopmentSharedAlbumImage,
} from './development-shared-album'

const DEVELOPMENT_BUCKET = 'gatherory-private-dev'
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const FIXTURE_OWNER_EMAIL = 'planner@gatherory.test'
const FIXTURE_OWNER_NAME = 'Alex Morgan'
const FIXTURE_SCOPE_ID = '10000000-0000-4000-8000-000000000001'
const FIXTURE_WORKSPACE_TITLES = new Set(["Alex & Jordan's Gatherory", "Alex & Jordan's Wedding"])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export type DevelopmentSharedAlbumUpdateInput = Omit<DevelopmentEventImageUpdateInput, 'assets'> & {
  assets?: readonly DevelopmentSharedAlbumImage[]
}

export type DevelopmentSharedAlbumUpdateCounts = {
  mode: 'dry-run' | 'applied'
  candidates: number
  insertedAssets: number
  insertedPlacements: number
  snapshots: number
  syncEntities: number
  syncChanges: number
  preserved: number
}

type PreparedAsset = {
  catalog: DevelopmentSharedAlbumImage
  bytes: Buffer
  checksum: string
  sha256: string
  mediaAssetId: string
  storageKey: string
  contributorUserId?: string
  momentPayload: Record<string, unknown>
}

function assertAlbumCatalog(assets: readonly DevelopmentSharedAlbumImage[]) {
  if (assets.length !== 6) throw new Error('The wedding album catalog must contain six photos.')
  const seen = new Set<string>()
  for (const [index, asset] of assets.entries()) {
    const expectedId = `83000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
    if (
      asset.id !== expectedId ||
      !UUID_PATTERN.test(asset.id) ||
      seen.has(asset.id) ||
      !asset.title.trim() ||
      !asset.file.trim() ||
      !asset.altText.trim() ||
      !asset.photographer.trim() ||
      !asset.photoID.trim() ||
      !asset.sourceURL.startsWith('https://') ||
      !(asset.contributor in developmentSharedAlbumContributors) ||
      !Number.isFinite(asset.addedAt) ||
      asset.addedAt <= 0
    )
      throw new Error('Shared album catalog does not match the known wedding fixture.')
    seen.add(asset.id)
  }
  for (const contributor of Object.keys(developmentSharedAlbumContributors)) {
    if (assets.filter((asset) => asset.contributor === contributor).length !== 2)
      throw new Error('Each seeded wedding contributor must have exactly two album photos.')
  }
}

function imageDigest(bytes: Buffer) {
  return {
    checksum: createHash('md5').update(bytes).digest('hex'),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

function makeMomentPayload(
  asset: DevelopmentSharedAlbumImage,
  mediaAssetId: string,
  contributorUserId: string
) {
  return {
    id: asset.id,
    eventID: FIXTURE_SCOPE_ID,
    mediaAssetID: mediaAssetId,
    imageData: '',
    addedBy: developmentSharedAlbumContributors[asset.contributor].name,
    addedByUserID: contributorUserId,
    addedAt: asset.addedAt,
  }
}

function validStoredObject(head: DevelopmentEventImageObjectHead | null, target: PreparedAsset) {
  return Boolean(
    head &&
    head.mediaAssetId === target.mediaAssetId &&
    head.contentType === 'image/jpeg' &&
    head.byteSize === target.bytes.byteLength &&
    head.checksum?.toLowerCase() === target.checksum &&
    head.sha256 === target.sha256 &&
    head.etag?.replaceAll('"', '').toLowerCase() === target.checksum
  )
}

async function ensureStoredObject(target: PreparedAsset, storage: DevelopmentEventImageStorage) {
  const existing = await storage.head(DEVELOPMENT_BUCKET, target.storageKey)
  if (existing) {
    if (!validStoredObject(existing, target))
      throw new Error('An immutable album object key already contains different data.')
    return
  }
  try {
    await storage.put({
      bucket: DEVELOPMENT_BUCKET,
      key: target.storageKey,
      body: target.bytes,
      contentType: 'image/jpeg',
      mediaAssetId: target.mediaAssetId,
      checksumSha256: target.sha256,
    })
  } catch {
    // A racing retry is accepted only after the immutable object verifies below.
  }
  const uploaded = await storage.head(DEVELOPMENT_BUCKET, target.storageKey)
  if (!validStoredObject(uploaded, target))
    throw new Error('Uploaded album image failed private object verification.')
}

function hasMomentID(value: Record<string, any>, id: string) {
  return (
    Array.isArray(value.eventMoments) &&
    value.eventMoments.some(
      (moment: Record<string, unknown>) =>
        typeof moment?.id === 'string' && moment.id.toLowerCase() === id.toLowerCase()
    )
  )
}

function identityMatches(archive: Record<string, any>, ownerUserId: string) {
  return (
    Array.isArray(archive.members) &&
    archive.members.some(
      (member: Record<string, unknown>) =>
        member?.userID === ownerUserId &&
        member.email === FIXTURE_OWNER_EMAIL &&
        member.name === FIXTURE_OWNER_NAME
    )
  )
}

async function resolveActiveContributor(
  client: PoolClientLike,
  organizationId: string,
  archive: Record<string, any>,
  contributorKey: DevelopmentSharedAlbumContributor
) {
  const contributor = developmentSharedAlbumContributors[contributorKey]
  const account = await client.query<{ id: string }>(
    'SELECT id FROM "user" WHERE email = $1 AND name = $2 FOR UPDATE',
    [contributor.email, contributor.name]
  )
  const userId = account.rows[0]?.id
  if (!userId)
    throw new Error('A seeded shared album contributor account did not match its fixture identity.')

  const participation = await client.query<{ person_id: string }>(
    'SELECT ep.person_id FROM event_participant ep INNER JOIN workspace_person wp ON wp.id = ep.person_id INNER JOIN event e ON e.id = ep.event_id WHERE ep.event_id = $1 AND e.organization_id = $2 AND wp.organization_id = $2 AND wp.user_id = $3 AND wp.display_name = $4 AND wp.email = $5 AND ep.role = $6 AND ep.planning_permission = $7 FOR UPDATE OF ep, wp',
    [
      FIXTURE_SCOPE_ID,
      organizationId,
      userId,
      contributor.name,
      contributor.email,
      contributor.role,
      contributor.planningPermission,
    ]
  )
  const personId = participation.rows[0]?.person_id
  if (!personId)
    throw new Error(
      'A seeded shared album contributor no longer has the required root-event access.'
    )

  const scopeRole = contributor.role === 'host' ? 'owner' : 'editor'
  const scopeMembership = await client.query<{ role: string }>(
    'SELECT role FROM native_sync_scope_member WHERE scope_id = $1 AND user_id = $2 FOR UPDATE',
    [FIXTURE_SCOPE_ID, userId]
  )
  if (scopeMembership.rows[0]?.role !== scopeRole)
    throw new Error('A seeded shared album contributor lacks the matching root sync membership.')

  const member = Array.isArray(archive.members)
    ? archive.members.find(
        (record: Record<string, unknown>) =>
          record?.id === personId &&
          record.userID === userId &&
          record.email === contributor.email &&
          record.name === contributor.name &&
          record.participantRole === contributor.role &&
          record.planningPermission === contributor.planningPermission &&
          record.invitationStatus === 'active'
      )
    : undefined
  const archivedParticipation = Array.isArray(archive.eventParticipations)
    ? archive.eventParticipations.find(
        (record: Record<string, unknown>) =>
          record?.eventID === FIXTURE_SCOPE_ID &&
          record.memberID === personId &&
          record.role === contributor.role &&
          record.planningPermission === contributor.planningPermission &&
          record.invitationStatus === 'active'
      )
    : undefined
  if (!member || !archivedParticipation)
    throw new Error('A seeded shared album contributor did not match the root archive membership.')
  return userId
}

async function inspectFixture(
  client: PoolClientLike,
  expectedDatabase: string,
  assets: readonly DevelopmentSharedAlbumImage[],
  preparedByID: ReadonlyMap<string, PreparedAsset>
) {
  const database = await client.query<{ name: string }>('SELECT current_database() AS name')
  if (database.rows[0]?.name !== expectedDatabase)
    throw new Error('Connected database differs from the allowlisted local target.')

  const owner = await client.query<{ id: string }>(
    'SELECT id FROM "user" WHERE email = $1 AND name = $2 FOR UPDATE',
    [FIXTURE_OWNER_EMAIL, FIXTURE_OWNER_NAME]
  )
  const ownerUserId = owner.rows[0]?.id
  if (!ownerUserId) throw new Error('Known development fixture owner was not found.')

  const organization = await client.query<{ id: string }>(
    "SELECT o.id FROM organization o INNER JOIN member m ON m.organization_id = o.id AND m.user_id = $2 AND m.role = 'owner' WHERE o.slug = $1 FOR UPDATE OF o",
    [`personal-${ownerUserId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`, ownerUserId]
  )
  const organizationId = organization.rows[0]?.id
  if (!organizationId)
    throw new Error('Known development fixture workspace ownership did not match.')

  const snapshots = await client.query<{
    scope_id: string
    payload: string
    server_version: number
    owner_user_id: string
  }>(
    'SELECT scope_id, payload, server_version, owner_user_id FROM native_workspace_snapshot WHERE organization_id = $1 AND owner_user_id = $2 AND NOT is_deleted FOR UPDATE',
    [organizationId, ownerUserId]
  )
  const snapshot = snapshots.rows.find((row) => row.scope_id === FIXTURE_SCOPE_ID)
  if (!snapshot) throw new Error('Known development fixture sync scope was not found.')
  const archive = decodePayload(snapshot.payload)
  if (
    archive.mainEventID !== FIXTURE_SCOPE_ID ||
    !FIXTURE_WORKSPACE_TITLES.has(archive.title) ||
    archive.isMainEventDeleted === true ||
    !identityMatches(archive, ownerUserId) ||
    !Array.isArray(archive.eventMoments)
  )
    throw new Error('Main event snapshot does not match the expected local wedding fixture.')

  const rootEvent = await client.query<{
    id: string
    organization_id: string
    parent_event_id: string | null
    created_by_user_id: string | null
  }>(
    'SELECT id, organization_id, parent_event_id, created_by_user_id FROM event WHERE id = $1 AND organization_id = $2 FOR UPDATE',
    [FIXTURE_SCOPE_ID, organizationId]
  )
  const event = rootEvent.rows[0]
  if (!event || event.parent_event_id !== null || event.created_by_user_id !== ownerUserId)
    throw new Error('Main event identity differs from the seeded root event.')

  const workspaceRows = await client.query<{
    payload: string
    server_version: number
    owner_user_id: string
    is_deleted: boolean
  }>(
    "SELECT payload, server_version, owner_user_id, is_deleted FROM native_sync_entity WHERE scope_id = $1 AND entity_type = 'workspace' AND entity_id = $1 FOR UPDATE",
    [FIXTURE_SCOPE_ID]
  )
  const workspaceEntity = workspaceRows.rows[0]
  if (
    !workspaceEntity ||
    workspaceEntity.is_deleted ||
    workspaceEntity.owner_user_id !== ownerUserId
  )
    throw new Error('Main event native workspace record did not match the fixture owner.')
  const workspaceArchive = decodePayload(workspaceEntity.payload)

  const candidateIDs = assets.map((asset) => asset.id)
  const existingEntities = await client.query<{
    entity_id: string
    owner_user_id: string
    is_deleted: boolean
  }>(
    "SELECT entity_id, owner_user_id, is_deleted FROM native_sync_entity WHERE scope_id = $1 AND entity_type = 'moment' AND entity_id = ANY($2::uuid[]) FOR UPDATE",
    [FIXTURE_SCOPE_ID, candidateIDs]
  )
  const existingChanges = await client.query<{ entity_id: string; operation: string }>(
    "SELECT entity_id, operation FROM native_sync_change WHERE scope_id = $1 AND entity_type = 'moment' AND entity_id = ANY($2::uuid[])",
    [FIXTURE_SCOPE_ID, candidateIDs]
  )
  const existingPlacements = await client.query<{
    id: string
    media_asset_id: string
    role: string
  }>(
    'SELECT id, media_asset_id, role FROM event_media WHERE id = ANY($1::uuid[]) OR media_asset_id = ANY($2::uuid[]) FOR UPDATE',
    [candidateIDs, assets.map((asset) => preparedByID.get(asset.id)!.mediaAssetId)]
  )
  const existingAssets = await client.query<{
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
    'SELECT id, organization_id, uploaded_by_user_id, status, visibility, bucket, storage_key, content_type, byte_size, checksum, moderation_hidden_at, deleted_at FROM media_asset WHERE id = ANY($1::uuid[]) OR storage_key = ANY($2::text[]) FOR UPDATE',
    [
      assets.map((asset) => preparedByID.get(asset.id)!.mediaAssetId),
      assets.map((asset) =>
        MediaKeys.scopedOriginal({
          workspaceId: organizationId,
          scopeId: FIXTURE_SCOPE_ID,
          mediaAssetId: preparedByID.get(asset.id)!.mediaAssetId,
          contentType: 'image/jpeg',
        })
      ),
    ]
  )

  const entityByID = new Map(existingEntities.rows.map((row) => [row.entity_id, row]))
  const changesByID = new Map<string, string[]>()
  for (const row of existingChanges.rows) {
    const operations = changesByID.get(row.entity_id) ?? []
    operations.push(row.operation)
    changesByID.set(row.entity_id, operations)
  }
  const placementByMomentID = new Map(existingPlacements.rows.map((row) => [row.id, row]))
  const placedAssetIDs = new Set(existingPlacements.rows.map((row) => row.media_asset_id))
  const assetsByID = new Map(existingAssets.rows.map((row) => [row.id, row]))
  const existingStorageKeys = new Set(existingAssets.rows.map((row) => row.storage_key))

  const candidates: PreparedAsset[] = []
  let preserved = 0
  const contributorIDs = new Map<DevelopmentSharedAlbumContributor, string>()
  for (const asset of assets) {
    const target = preparedByID.get(asset.id)!
    const priorEntity = entityByID.get(asset.id)
    const priorPlacement = placementByMomentID.get(asset.id)
    const hasChange = changesByID.has(asset.id)
    const wasInArchive = hasMomentID(archive, asset.id) || hasMomentID(workspaceArchive, asset.id)
    const assetRecord = assetsByID.get(target.mediaAssetId)
    const alreadyPlacedAsset = placedAssetIDs.has(target.mediaAssetId)
    const storageKeyConflict = existingStorageKeys.has(target.storageKey)

    if (
      wasInArchive ||
      priorEntity ||
      hasChange ||
      priorPlacement ||
      assetRecord ||
      alreadyPlacedAsset ||
      storageKeyConflict
    ) {
      // Any prior identity, placement, asset, or change is user-owned state or
      // an interrupted/conflicting attempt. Never repair it by replacing it.
      preserved++
      continue
    }
    let contributorUserId = contributorIDs.get(asset.contributor)
    if (!contributorUserId) {
      contributorUserId = await resolveActiveContributor(
        client,
        organizationId,
        archive,
        asset.contributor
      )
      contributorIDs.set(asset.contributor, contributorUserId)
    }
    candidates.push({
      ...target,
      contributorUserId,
      storageKey: MediaKeys.scopedOriginal({
        workspaceId: organizationId,
        scopeId: FIXTURE_SCOPE_ID,
        mediaAssetId: target.mediaAssetId,
        contentType: 'image/jpeg',
      }),
      momentPayload: makeMomentPayload(asset, target.mediaAssetId, contributorUserId),
    })
  }

  return {
    organizationId,
    ownerUserId,
    snapshot,
    archive,
    candidates,
    preserved,
  }
}

async function runTransaction<T>(pool: PoolLike, task: (client: PoolClientLike) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SET LOCAL statement_timeout = '15s'")
    await client.query("SET LOCAL lock_timeout = '5s'")
    const result = await task(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function preflightDevelopmentSharedAlbum(input: DevelopmentSharedAlbumUpdateInput) {
  // Reuse the existing explicit local-database, bucket and credential guards.
  // Its cover catalog is intentionally empty: album media has a separate role.
  const common: Omit<DevelopmentEventImageUpdateInput, 'assets'> = {
    databaseUrl: input.databaseUrl,
    nodeEnv: input.nodeEnv,
    apply: input.apply,
    privateBucket: input.privateBucket,
    pool: input.pool,
    readAsset: input.readAsset,
    storage: input.storage,
    webRoot: input.webRoot,
  }
  await preflightDevelopmentEventImages({
    ...common,
    assets: [],
    requireR2Credentials: input.apply === true && !input.storage,
  })
  const assets =
    input.assets ?? (await import('./development-shared-album')).developmentSharedAlbumImages
  assertAlbumCatalog(assets)
  const webRoot = path.resolve(input.webRoot ?? process.cwd())
  const read = input.readAsset ?? ((file: string) => defaultReadAsset(file, webRoot))
  for (const asset of assets) {
    const bytes = await read(asset.file)
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES || !isJPEG(bytes))
      throw new Error('Shared album catalog entry is not a supported JPEG fixture image.')
  }
  return {
    images: assets.length,
    mode: input.apply === true ? ('apply' as const) : ('dry-run' as const),
  }
}

export async function runDevelopmentSharedAlbumUpdate(
  input: DevelopmentSharedAlbumUpdateInput
): Promise<DevelopmentSharedAlbumUpdateCounts> {
  const apply = input.apply === true
  await preflightDevelopmentSharedAlbum(input)
  const assets =
    input.assets ?? (await import('./development-shared-album')).developmentSharedAlbumImages
  const webRoot = path.resolve(input.webRoot ?? process.cwd())
  const read = input.readAsset ?? ((file: string) => defaultReadAsset(file, webRoot))
  const prepared: PreparedAsset[] = []
  for (const catalog of assets) {
    const bytes = await read(catalog.file)
    const { checksum, sha256 } = imageDigest(bytes)
    const mediaAssetId = deterministicUUID(
      `development-shared-album:${FIXTURE_SCOPE_ID}:${catalog.id}:${catalog.photoID}:${sha256}`
    )
    prepared.push({
      catalog,
      bytes,
      checksum,
      sha256,
      mediaAssetId,
      storageKey: '',
      momentPayload: {},
    })
  }

  const pool = (input.pool ??
    new Pool({
      connectionString: input.databaseUrl,
      connectionTimeoutMillis: 5000,
    })) as unknown as PoolLike
  const ownsPool = !input.pool
  try {
    const expectedDatabase = new URL(input.databaseUrl).pathname.slice(1)
    const candidatesBeforeUpload = await runTransaction(pool, async (client) =>
      inspectFixture(
        client,
        expectedDatabase,
        assets,
        new Map(prepared.map((target) => [target.catalog.id, target]))
      )
    )
    let storage = input.storage
    if (apply && !storage) {
      storage = await localStorage({
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
      })
    }
    if (apply && storage) {
      // The first database pass verifies all stable IDs and tombstones before
      // any object is written. A second pass rechecks them before DB placement.
      for (const target of candidatesBeforeUpload.candidates)
        await ensureStoredObject(target, storage)
    }

    const counts: DevelopmentSharedAlbumUpdateCounts = {
      mode: apply ? 'applied' : 'dry-run',
      candidates: 0,
      insertedAssets: 0,
      insertedPlacements: 0,
      snapshots: 0,
      syncEntities: 0,
      syncChanges: 0,
      preserved: candidatesBeforeUpload.preserved,
    }
    await runTransaction(pool, async (client) => {
      const state = await inspectFixture(
        client,
        expectedDatabase,
        assets,
        new Map(prepared.map((target) => [target.catalog.id, target]))
      )
      counts.preserved = state.preserved
      counts.candidates = state.candidates.length
      if (!apply || !state.candidates.length) return
      if (!storage) throw new Error('Private development storage is required in apply mode.')

      const moments = [...state.archive.eventMoments]
      const createdAt = new Date()
      const galleryOrder = await client.query<{ max: number | null }>(
        "SELECT max(sort_order) AS max FROM event_media WHERE organization_id = $1 AND event_id = $2 AND role = 'gallery'",
        [state.organizationId, FIXTURE_SCOPE_ID]
      )
      const firstSortOrder = (galleryOrder.rows[0]?.max ?? -1) + 1
      for (const target of state.candidates) {
        const storedObject = await storage.head(DEVELOPMENT_BUCKET, target.storageKey)
        if (!validStoredObject(storedObject, target))
          throw new Error('Verified album object changed before database placement.')
        await client.query(
          `INSERT INTO media_asset (id, organization_id, uploaded_by_user_id, kind, status, visibility, bucket, storage_key, original_filename, display_name, alt_text, content_type, byte_size, checksum, created_at, updated_at) VALUES ($1, $2, $3, 'image', 'ready', 'private', $4, $5, $6, $7, $8, 'image/jpeg', $9, $10, $11, $11)`,
          [
            target.mediaAssetId,
            state.organizationId,
            target.contributorUserId,
            DEVELOPMENT_BUCKET,
            target.storageKey,
            path.basename(target.catalog.file),
            target.catalog.title,
            target.catalog.altText,
            target.bytes.byteLength,
            target.checksum,
            createdAt,
          ]
        )
        await client.query(
          `INSERT INTO event_media (id, organization_id, event_id, media_asset_id, role, sort_order, created_at) VALUES ($1, $2, $3, $4, 'gallery', $5, $6)`,
          [
            target.catalog.id,
            state.organizationId,
            FIXTURE_SCOPE_ID,
            target.mediaAssetId,
            firstSortOrder + counts.insertedPlacements,
            createdAt,
          ]
        )
        const payload = encodePayload(target.momentPayload)
        await client.query(
          "INSERT INTO native_sync_entity (scope_id, entity_type, entity_id, owner_user_id, payload, server_version, is_deleted, created_at, updated_at) VALUES ($1, 'moment', $2, $3, $4, 1, false, $5, $5)",
          [FIXTURE_SCOPE_ID, target.catalog.id, target.contributorUserId, payload, createdAt]
        )
        await client.query(
          "INSERT INTO native_sync_change (owner_user_id, scope_id, entity_type, entity_id, operation, payload, server_version) VALUES ($1, $2, 'moment', $3, 'create', $4, 1)",
          [target.contributorUserId, FIXTURE_SCOPE_ID, target.catalog.id, payload]
        )
        moments.push(target.momentPayload)
        counts.insertedAssets++
        counts.insertedPlacements++
        counts.syncEntities++
        counts.syncChanges++
      }

      state.archive.eventMoments = moments
      const snapshotPayload = encodePayload(state.archive)
      await client.query(
        'UPDATE native_workspace_snapshot SET payload = $1, server_version = server_version + 1, updated_at = now() WHERE scope_id = $2',
        [snapshotPayload, FIXTURE_SCOPE_ID]
      )
      counts.snapshots = 1
    })
    return counts
  } finally {
    if (ownsPool) await pool.end?.()
  }
}
