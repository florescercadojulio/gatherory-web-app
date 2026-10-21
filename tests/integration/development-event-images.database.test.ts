import { createHash } from 'node:crypto'
import { Pool } from 'pg'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_DEVELOPMENT_EVENT_IMAGES_DB_TESTS === '1'

function testDatabaseUrl() {
  const value = process.env.DEVELOPMENT_EVENT_IMAGES_TEST_DATABASE_URL
  if (!value) throw new Error('DEVELOPMENT_EVENT_IMAGES_TEST_DATABASE_URL is required')
  const url = new URL(value)
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !/^\/gatherory_seed_images_test_[a-z0-9_]+$/i.test(url.pathname)
  ) {
    throw new Error(
      'Development event image integration tests require the dedicated local test database'
    )
  }
  return value
}

function decoded(payload: string) {
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as Record<string, any>
}

function encoded(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

function fixtureUser(id: string, name: string, email: string) {
  return { id, name, email }
}

test(
  'development event image update seeds every matching media placement atomically and remains idempotent',
  { skip: !enabled, timeout: 120_000 },
  async () => {
    const databaseUrl = testDatabaseUrl()
    const testPool = new Pool({
      connectionString: databaseUrl,
      max: 4,
      connectionTimeoutMillis: 5000,
    })
    const fixtureBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x47, 0x41, 0x54, 0x45, 0xff, 0xd9,
    ])
    const objects = new Map<
      string,
      {
        mediaAssetId: string
        contentType: string
        byteSize: number
        checksum: string
        sha256: string
        etag: string
      }
    >()
    const storageCalls = { put: 0 }
    let triggerInstalled = false
    let organizationID = ''
    let ownerID = ''
    const otherOrganizationID = `seed-image-outside-${crypto.randomUUID()}`
    const otherOwnerID = `seed-image-outside-owner-${crypto.randomUUID()}`
    const otherScopeID = crypto.randomUUID()
    const suffix = crypto.randomUUID()

    const fakeStorage = {
      async head(bucket: string, key: string) {
        return objects.get(`${bucket}/${key}`) ?? null
      },
      async put(input: {
        bucket: string
        key: string
        body: Buffer
        contentType: 'image/jpeg'
        mediaAssetId: string
        checksumSha256: string
      }) {
        storageCalls.put++
        const etag = createHash('md5').update(input.body).digest('hex')
        objects.set(`${input.bucket}/${input.key}`, {
          mediaAssetId: input.mediaAssetId,
          contentType: input.contentType,
          byteSize: input.body.byteLength,
          checksum: etag,
          sha256: input.checksumSha256,
          etag,
        })
      },
    }

    try {
      const [
        { drizzle },
        { databaseRelations },
        schema,
        { developmentEventImages },
        { createDevelopmentWorkspaceSeed },
        { materializeNativeMutation },
        { developmentUsers },
        { encodeNativeWorkspaceSnapshot, reviewWorkspaceIds },
      ] = await Promise.all([
        import('drizzle-orm/node-postgres'),
        import('@/db/relations'),
        import('@/db/schema'),
        import('@/db/seeds/development-event-images'),
        import('@/db/development-workspace-seed'),
        import('@/server/sync/repos/native-materializer.persistence'),
        import('../../scripts/seed/development-users'),
        import('@/db/review-workspace-fixture'),
      ])
      const db = drizzle({ client: testPool, relations: databaseRelations })
      const {
        account,
        event,
        eventJoinRequest,
        eventMedia,
        eventShareLink,
        mediaAsset,
        member,
        nativeSyncEntity,
        nativeSyncScopeMember,
        nativeWorkspaceSnapshot,
        organization,
        user,
      } = schema

      ownerID = `seed-image-owner-${suffix}`
      const accountIDs = [
        ownerID,
        `seed-image-jordan-${suffix}`,
        `seed-image-maya-${suffix}`,
        `seed-image-sam-${suffix}`,
        `seed-image-reviewer-${suffix}`,
        `seed-image-taylor-${suffix}`,
        `seed-image-casey-${suffix}`,
        `seed-image-riley-${suffix}`,
      ]
      const userRows = developmentUsers.map((fixture, index) => ({
        id: accountIDs[index],
        name: fixture.name,
        email: fixture.email,
        emailVerified: true,
        image: null,
      }))
      const baseOrgSlug = `personal-${ownerID.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
      organizationID = `seed-image-org-${suffix}`
      const createdAt = new Date('2026-10-21T12:00:00.000Z')
      await db.insert(user).values([
        ...userRows,
        {
          id: otherOwnerID,
          name: 'Out of scope account',
          email: `out-of-scope-${suffix}@gatherory.test`,
          emailVerified: true,
        },
      ])
      await db.insert(account).values(
        userRows.map((row, index) => ({
          id: `seed-image-auth-${suffix}-${index}`,
          accountId: `provider-account-${suffix}-${index}`,
          providerId: 'credential',
          userId: row.id,
        }))
      )
      await db.insert(organization).values([
        {
          id: organizationID,
          name: "Alex & Jordan's Gatherory",
          slug: baseOrgSlug,
          workspaceType: 'event',
          createdAt,
        },
        {
          id: otherOrganizationID,
          name: 'Out of scope organization',
          slug: `out-of-scope-${suffix}`,
          workspaceType: 'event',
          createdAt,
        },
      ])
      await db.insert(member).values([
        {
          id: `seed-image-owner-membership-${suffix}`,
          organizationId: organizationID,
          userId: ownerID,
          role: 'owner',
          createdAt,
        },
        {
          id: `seed-image-other-membership-${suffix}`,
          organizationId: otherOrganizationID,
          userId: otherOwnerID,
          role: 'owner',
          createdAt,
        },
      ])

      const fixtureUsers = userRows
        .slice(0, 5)
        .map((row) => fixtureUser(row.id, row.name, row.email)) as [
        ReturnType<typeof fixtureUser>,
        ReturnType<typeof fixtureUser>,
        ReturnType<typeof fixtureUser>,
        ReturnType<typeof fixtureUser>,
        ReturnType<typeof fixtureUser>,
      ]
      const seed = createDevelopmentWorkspaceSeed({
        workspaceId: organizationID,
        users: fixtureUsers,
        receptionPlanner: fixtureUser(userRows[5]!.id, userRows[5]!.name, userRows[5]!.email),
        pendingCollaborators: [
          fixtureUser(userRows[6]!.id, userRows[6]!.name, userRows[6]!.email),
          fixtureUser(userRows[7]!.id, userRows[7]!.name, userRows[7]!.email),
        ],
        now: createdAt,
      })
      expect(
        (
          await testPool.query(
            "SELECT o.id FROM organization o INNER JOIN member m ON m.organization_id = o.id AND m.user_id = $2 AND m.role = 'owner' WHERE o.slug = $1 AND o.name = $3",
            [baseOrgSlug, ownerID, "Alex & Jordan's Gatherory"]
          )
        ).rows
      ).toHaveLength(1)
      expect(developmentEventImages).toHaveLength(21)
      expect(
        seed.records.filter(({ mutation }) =>
          ['workspace', 'event', 'idea', 'registry_item'].includes(mutation.entityType)
        )
      ).toHaveLength(21)
      await db.transaction(async (transaction) => {
        await transaction.insert(nativeWorkspaceSnapshot).values({
          scopeId: seed.archive.mainEventID,
          ownerUserId: seed.ownerUserId,
          organizationId: organizationID,
          payload: encodeNativeWorkspaceSnapshot(seed.archive),
          serverVersion: 1,
          isDeleted: false,
        })
        for (const record of seed.records) {
          await materializeNativeMutation(
            transaction as unknown as Parameters<typeof materializeNativeMutation>[0],
            {
              ...record,
              organizationId: organizationID,
            }
          )
          await transaction.insert(nativeSyncEntity).values({
            scopeId: record.mutation.scopeID,
            entityType: record.mutation.entityType,
            entityId: record.mutation.entityID,
            ownerUserId: record.userId,
            payload: record.mutation.payload,
            serverVersion: 1,
            isDeleted: false,
          })
        }
        await transaction.insert(nativeSyncScopeMember).values(seed.scopeMembers)
        await transaction.insert(eventShareLink).values(seed.shareLinks)
        await transaction.insert(eventJoinRequest).values(seed.joinRequests)
      })

      const rootScopeID = reviewWorkspaceIds.events.main
      const [rootSnapshotBefore] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where((await import('drizzle-orm')).eq(nativeWorkspaceSnapshot.scopeId, rootScopeID))
      const snapshotArchive = decoded(rootSnapshotBefore!.payload)
      const venueCover = developmentEventImages.find(
        (asset) => asset.key === 'review-venue-tour-event'
      )!
      const inlineImage = developmentEventImages.find(
        (asset) => asset.key === 'review-tasting-event'
      )!
      const tombstone = developmentEventImages.find(
        (asset) => asset.key === 'review-rehearsal-dinner-event'
      )!
      const mismatch = developmentEventImages.find(
        (asset) => asset.key === 'review-reception-event'
      )!
      const tombstoneEntity = seed.records.find(
        ({ mutation }) =>
          mutation.entityID === tombstone.entityID && mutation.entityType === 'event'
      )!
      const mismatchEntity = seed.records.find(
        ({ mutation }) => mutation.entityID === mismatch.entityID && mutation.entityType === 'event'
      )!

      const venueAssetID = crypto.randomUUID()
      await db.insert(mediaAsset).values({
        id: venueAssetID,
        organizationId: organizationID,
        uploadedByUserId: ownerID,
        kind: 'image',
        status: 'ready',
        visibility: 'private',
        bucket: 'gatherory-private-dev',
        storageKey: `fixtures/${suffix}/custom-venue-cover.jpg`,
        originalFilename: 'custom-venue-cover.jpg',
        displayName: 'Custom venue cover',
        altText: 'A user-selected cover that the seed must preserve.',
        contentType: 'image/jpeg',
        byteSize: fixtureBytes.byteLength,
      })
      await db.insert(eventMedia).values({
        organizationId: organizationID,
        eventId: venueCover.entityID,
        mediaAssetId: venueAssetID,
        role: 'cover',
      })

      const inlineRecord = (snapshotArchive.timeline as Array<Record<string, any>>).find(
        (item) => item.id === inlineImage.entityID
      )!
      inlineRecord.imageData = 'native-inline-image-must-survive'
      const updatedSnapshotPayload = encoded(snapshotArchive)
      await testPool.query(
        'UPDATE native_workspace_snapshot SET payload = $1 WHERE scope_id = $2',
        [updatedSnapshotPayload, rootScopeID]
      )
      const inlineSync = seed.records.find(
        ({ mutation }) =>
          mutation.entityID === inlineImage.entityID && mutation.entityType === 'event'
      )!
      const inlineEntityPayload = decoded(inlineSync.mutation.payload)
      inlineEntityPayload.imageData = 'native-inline-image-must-survive'
      await testPool.query(
        'UPDATE native_sync_entity SET payload = $1 WHERE scope_id = $2 AND entity_type = $3 AND entity_id = $4',
        [encoded(inlineEntityPayload), rootScopeID, 'event', inlineImage.entityID]
      )
      await testPool.query(
        'UPDATE native_sync_entity SET is_deleted = true WHERE scope_id = $1 AND entity_type = $2 AND entity_id = $3',
        [rootScopeID, 'event', tombstoneEntity.mutation.entityID]
      )
      const mismatchPayload = decoded(mismatchEntity.mutation.payload)
      mismatchPayload.parentEventID = crypto.randomUUID()
      await testPool.query(
        'UPDATE native_sync_entity SET payload = $1 WHERE scope_id = $2 AND entity_type = $3 AND entity_id = $4',
        [encoded(mismatchPayload), rootScopeID, 'event', mismatchEntity.mutation.entityID]
      )

      const outOfScopePayload = encoded({
        mainEventID: otherScopeID,
        title: 'Untouched other account',
        mainEventImageData: null,
        mainEventMediaAssetID: null,
      })
      await db.insert(event).values({
        id: otherScopeID,
        organizationId: otherOrganizationID,
        title: 'Untouched other account',
        status: 'draft',
        startsAt: createdAt,
        timeZone: 'America/Detroit',
      })
      await db.insert(nativeWorkspaceSnapshot).values({
        scopeId: otherScopeID,
        ownerUserId: otherOwnerID,
        organizationId: otherOrganizationID,
        payload: outOfScopePayload,
        serverVersion: 7,
      })
      await db.insert(nativeSyncEntity).values({
        scopeId: otherScopeID,
        entityType: 'workspace',
        entityId: otherScopeID,
        ownerUserId: otherOwnerID,
        payload: outOfScopePayload,
        serverVersion: 4,
      })

      const beforeState = {
        snapshot: (
          await testPool.query(
            'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
            [rootScopeID]
          )
        ).rows[0],
        entities: (
          await testPool.query(
            'SELECT entity_type, entity_id, owner_user_id, payload, server_version, is_deleted FROM native_sync_entity WHERE scope_id = $1 ORDER BY entity_type, entity_id',
            [rootScopeID]
          )
        ).rows,
        changes: (
          await testPool.query(
            'SELECT cursor FROM native_sync_change WHERE scope_id = $1 ORDER BY cursor',
            [rootScopeID]
          )
        ).rows,
        outsideSnapshot: (
          await testPool.query(
            'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
            [otherScopeID]
          )
        ).rows[0],
        outsideEntity: (
          await testPool.query(
            'SELECT payload, server_version FROM native_sync_entity WHERE scope_id = $1',
            [otherScopeID]
          )
        ).rows[0],
        accounts: (
          await testPool.query(
            'SELECT id, account_id, provider_id, user_id FROM account WHERE user_id = ANY($1::text[]) ORDER BY user_id',
            [accountIDs]
          )
        ).rows,
        memberships: (
          await testPool.query(
            'SELECT id, organization_id, user_id, role FROM member WHERE organization_id = ANY($1::text[]) ORDER BY organization_id, user_id',
            [[organizationID, otherOrganizationID]]
          )
        ).rows,
        scopeMembers: (
          await testPool.query(
            'SELECT scope_id, user_id, role FROM native_sync_scope_member WHERE scope_id = $1 ORDER BY user_id',
            [rootScopeID]
          )
        ).rows,
      }

      // Fail after storage succeeds and the transaction has inserted its asset,
      // but before it can publish a placement or sync record.
      await testPool.query(
        `CREATE FUNCTION fail_seed_image_cover() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.event_id = '${rootScopeID}' AND NEW.role = 'cover' THEN RAISE EXCEPTION 'injected cover placement failure'; END IF; RETURN NEW; END $$`
      )
      await testPool.query(
        'CREATE TRIGGER fail_seed_image_cover_trigger BEFORE INSERT ON event_media FOR EACH ROW EXECUTE FUNCTION fail_seed_image_cover()'
      )
      triggerInstalled = true
      const { runDevelopmentEventImageUpdate } =
        await import('@/db/seeds/development-event-images-update')
      const workspaceImage = developmentEventImages.find(
        (asset) => asset.entityType === 'workspace'
      )!
      await expect(
        runDevelopmentEventImageUpdate({
          databaseUrl,
          nodeEnv: 'test',
          apply: true,
          privateBucket: 'gatherory-private-dev',
          pool: testPool,
          assets: [workspaceImage],
          readAsset: async () => fixtureBytes,
          storage: fakeStorage,
        })
      ).rejects.toThrow()
      await testPool.query('DROP TRIGGER fail_seed_image_cover_trigger ON event_media')
      await testPool.query('DROP FUNCTION fail_seed_image_cover()')
      triggerInstalled = false
      expect(
        (
          await testPool.query(
            'SELECT id FROM media_asset WHERE organization_id = $1 AND id <> $2',
            [organizationID, venueAssetID]
          )
        ).rows
      ).toHaveLength(0)
      expect(
        (
          await testPool.query('SELECT id FROM event_media WHERE event_id = $1 AND role = $2', [
            rootScopeID,
            'cover',
          ])
        ).rows
      ).toHaveLength(0)
      expect(
        (
          await testPool.query(
            'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
            [rootScopeID]
          )
        ).rows[0]
      ).toEqual(beforeState.snapshot)
      expect(
        (
          await testPool.query(
            'SELECT cursor FROM native_sync_change WHERE scope_id = $1 ORDER BY cursor',
            [rootScopeID]
          )
        ).rows
      ).toEqual(beforeState.changes)

      const first = await runDevelopmentEventImageUpdate({
        databaseUrl,
        nodeEnv: 'test',
        apply: true,
        privateBucket: 'gatherory-private-dev',
        pool: testPool,
        assets: developmentEventImages,
        readAsset: async () => fixtureBytes,
        storage: fakeStorage,
      })
      expect(first).toMatchObject({
        mode: 'applied',
        candidates: 17,
        preserved: 4,
        insertedAssets: 17,
        insertedPlacements: 17,
        snapshots: 17,
      })
      const preservedKeys = new Set<string>([
        venueCover.key,
        inlineImage.key,
        tombstone.key,
        mismatch.key,
      ])
      const updatedAssets = developmentEventImages.filter((asset) => !preservedKeys.has(asset.key))
      expect(updatedAssets).toHaveLength(17)

      const afterSnapshotRow = (
        await testPool.query(
          'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
          [rootScopeID]
        )
      ).rows[0]
      const afterArchive = decoded(afterSnapshotRow.payload)
      expect(afterSnapshotRow.server_version).toBe(
        beforeState.snapshot.server_version + updatedAssets.length
      )
      expect(
        (afterArchive.timeline as Array<Record<string, any>>).find(
          (item) => item.id === inlineImage.entityID
        )?.imageData
      ).toBe('native-inline-image-must-survive')
      expect(
        (
          await testPool.query(
            'SELECT media_asset_id FROM event_media WHERE event_id = $1 AND role = $2',
            [venueCover.entityID, 'cover']
          )
        ).rows[0].media_asset_id
      ).toBe(venueAssetID)

      const placedCount = await testPool.query(
        `SELECT
           (SELECT count(*) FROM event_media WHERE organization_id = $1 AND role = 'cover' AND event_id = ANY($2::uuid[])) +
           (SELECT count(*) FROM idea_media WHERE organization_id = $1 AND role = 'cover' AND idea_id = ANY($3::uuid[])) +
           (SELECT count(*) FROM registry_item_media WHERE organization_id = $1 AND role = 'cover' AND registry_item_id = ANY($4::uuid[])) AS count`,
        [
          organizationID,
          updatedAssets
            .filter((asset) => asset.entityType === 'workspace' || asset.entityType === 'event')
            .map((asset) => asset.entityID),
          updatedAssets
            .filter((asset) => asset.entityType === 'idea')
            .map((asset) => asset.entityID),
          updatedAssets
            .filter((asset) => asset.entityType === 'registry_item')
            .map((asset) => asset.entityID),
        ]
      )
      expect(Number(placedCount.rows[0].count)).toBe(17)

      const changedRows = (
        await testPool.query(
          'SELECT entity_type, entity_id, payload, server_version FROM native_sync_change WHERE scope_id = $1 ORDER BY cursor',
          [rootScopeID]
        )
      ).rows
      const expectedChangeCount = 2 * updatedAssets.length - 1
      expect(changedRows).toHaveLength(expectedChangeCount)
      expect(
        new Set(
          changedRows.map((row) => `${row.entity_type}:${row.entity_id}:${row.server_version}`)
        ).size
      ).toBe(changedRows.length)
      const currentEntities = (
        await testPool.query(
          'SELECT entity_type, entity_id, owner_user_id, payload, server_version, is_deleted FROM native_sync_entity WHERE scope_id = $1',
          [rootScopeID]
        )
      ).rows
      for (const change of changedRows) {
        const current = currentEntities.find(
          (entity) =>
            entity.entity_type === change.entity_type && entity.entity_id === change.entity_id
        )
        expect(current).toBeDefined()
        expect(Number(change.server_version)).toBeLessThanOrEqual(Number(current!.server_version))
      }
      for (const current of currentEntities) {
        const history = changedRows.filter(
          (change) =>
            change.entity_type === current.entity_type && change.entity_id === current.entity_id
        )
        if (history.length === 0) continue
        const latest = history.at(-1)!
        expect(Number(latest.server_version)).toBe(Number(current.server_version))
        expect(latest.payload).toBe(current.payload)
      }
      const priorWorkspaceEntity = beforeState.entities.find(
        (entity) => entity.entity_type === 'workspace' && entity.entity_id === rootScopeID
      )!
      const currentWorkspaceEntity = currentEntities.find(
        (entity) => entity.entity_type === 'workspace' && entity.entity_id === rootScopeID
      )!
      expect(Number(currentWorkspaceEntity.server_version)).toBe(
        Number(priorWorkspaceEntity.server_version) + updatedAssets.length
      )
      for (const asset of updatedAssets) {
        const table =
          asset.entityType === 'workspace' || asset.entityType === 'event'
            ? 'event_media'
            : asset.entityType === 'idea'
              ? 'idea_media'
              : 'registry_item_media'
        const entityColumn =
          asset.entityType === 'workspace' || asset.entityType === 'event'
            ? 'event_id'
            : asset.entityType === 'idea'
              ? 'idea_id'
              : 'registry_item_id'
        const targetId = asset.entityType === 'workspace' ? asset.eventID : asset.entityID
        const placement = (
          await testPool.query(
            `SELECT media_asset_id FROM ${table} WHERE organization_id = $1 AND ${entityColumn} = $2 AND role = 'cover'`,
            [organizationID, targetId]
          )
        ).rows[0]
        expect(placement).toBeDefined()
        const [metadata] = (
          await testPool.query(
            'SELECT status, visibility, bucket, content_type, byte_size, checksum FROM media_asset WHERE id = $1',
            [placement.media_asset_id]
          )
        ).rows
        expect(metadata).toMatchObject({
          status: 'ready',
          visibility: 'private',
          bucket: 'gatherory-private-dev',
          content_type: 'image/jpeg',
        })
        expect(Number(metadata.byte_size)).toBe(fixtureBytes.byteLength)
        expect(metadata.checksum).toBe(createHash('md5').update(fixtureBytes).digest('hex'))

        const rowType = asset.entityType === 'workspace' ? 'workspace' : asset.entityType
        const syncEntity = currentEntities.find(
          (entity) => entity.entity_type === rowType && entity.entity_id === asset.entityID
        )!
        if (asset.entityType !== 'workspace') {
          const prior = beforeState.entities.find(
            (entity) => entity.entity_type === rowType && entity.entity_id === asset.entityID
          )!
          expect(Number(syncEntity.server_version)).toBe(Number(prior.server_version) + 1)
        }
        const payload = decoded(syncEntity.payload)
        if (asset.entityType === 'workspace')
          expect(payload.mainEventMediaAssetID).toBe(placement.media_asset_id)
        else expect(payload.mediaAssetID).toBe(placement.media_asset_id)
        const archiveRecord =
          asset.entityType === 'workspace'
            ? afterArchive
            : (asset.entityType === 'event'
                ? afterArchive.timeline
                : asset.entityType === 'idea'
                  ? afterArchive.ideas
                  : afterArchive.registry
              ).find((item: Record<string, any>) => item.id === asset.entityID)
        if (asset.entityType === 'workspace')
          expect(archiveRecord.mainEventMediaAssetID).toBe(placement.media_asset_id)
        else expect(archiveRecord.mediaAssetID).toBe(placement.media_asset_id)
      }

      for (const preserved of [inlineImage, tombstone, mismatch]) {
        const prior = beforeState.entities.find(
          (entity) =>
            entity.entity_type === preserved.entityType && entity.entity_id === preserved.entityID
        )!
        const current = currentEntities.find(
          (entity) =>
            entity.entity_type === preserved.entityType && entity.entity_id === preserved.entityID
        )!
        expect(current).toEqual(prior)
      }

      expect(
        (
          await testPool.query(
            'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
            [otherScopeID]
          )
        ).rows[0]
      ).toEqual(beforeState.outsideSnapshot)
      expect(
        (
          await testPool.query(
            'SELECT payload, server_version FROM native_sync_entity WHERE scope_id = $1',
            [otherScopeID]
          )
        ).rows[0]
      ).toEqual(beforeState.outsideEntity)
      expect(
        (
          await testPool.query(
            'SELECT id, account_id, provider_id, user_id FROM account WHERE user_id = ANY($1::text[]) ORDER BY user_id',
            [accountIDs]
          )
        ).rows
      ).toEqual(beforeState.accounts)
      expect(
        (
          await testPool.query(
            'SELECT id, organization_id, user_id, role FROM member WHERE organization_id = ANY($1::text[]) ORDER BY organization_id, user_id',
            [[organizationID, otherOrganizationID]]
          )
        ).rows
      ).toEqual(beforeState.memberships)
      expect(
        (
          await testPool.query(
            'SELECT scope_id, user_id, role FROM native_sync_scope_member WHERE scope_id = $1 ORDER BY user_id',
            [rootScopeID]
          )
        ).rows
      ).toEqual(beforeState.scopeMembers)

      const putCountAfterFirstRun = storageCalls.put
      const stableSnapshot = (
        await testPool.query(
          'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
          [rootScopeID]
        )
      ).rows[0]
      const stableEntities = (
        await testPool.query(
          'SELECT entity_type, entity_id, payload, server_version, is_deleted FROM native_sync_entity WHERE scope_id = $1 ORDER BY entity_type, entity_id',
          [rootScopeID]
        )
      ).rows
      const stableChanges = (
        await testPool.query(
          'SELECT cursor, payload, server_version FROM native_sync_change WHERE scope_id = $1 ORDER BY cursor',
          [rootScopeID]
        )
      ).rows
      const second = await runDevelopmentEventImageUpdate({
        databaseUrl,
        nodeEnv: 'test',
        apply: true,
        privateBucket: 'gatherory-private-dev',
        pool: testPool,
        assets: developmentEventImages,
        readAsset: async () => fixtureBytes,
        storage: fakeStorage,
      })
      expect(second).toMatchObject({
        mode: 'applied',
        candidates: 0,
        preserved: 21,
        insertedAssets: 0,
        insertedPlacements: 0,
        snapshots: 0,
        syncEntities: 0,
        syncChanges: 0,
      })
      expect(storageCalls.put).toBe(putCountAfterFirstRun)
      expect(
        (
          await testPool.query(
            'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
            [rootScopeID]
          )
        ).rows[0]
      ).toEqual(stableSnapshot)
      expect(
        (
          await testPool.query(
            'SELECT entity_type, entity_id, payload, server_version, is_deleted FROM native_sync_entity WHERE scope_id = $1 ORDER BY entity_type, entity_id',
            [rootScopeID]
          )
        ).rows
      ).toEqual(stableEntities)
      expect(
        (
          await testPool.query(
            'SELECT cursor, payload, server_version FROM native_sync_change WHERE scope_id = $1 ORDER BY cursor',
            [rootScopeID]
          )
        ).rows
      ).toEqual(stableChanges)
      expect(
        (
          await testPool.query(
            'SELECT payload, server_version FROM native_workspace_snapshot WHERE scope_id = $1',
            [otherScopeID]
          )
        ).rows[0]
      ).toEqual(beforeState.outsideSnapshot)
    } finally {
      if (triggerInstalled) {
        await testPool
          .query('DROP TRIGGER IF EXISTS fail_seed_image_cover_trigger ON event_media')
          .catch(() => undefined)
        await testPool
          .query('DROP FUNCTION IF EXISTS fail_seed_image_cover()')
          .catch(() => undefined)
      }
      if (organizationID)
        await testPool
          .query('DELETE FROM organization WHERE id = $1', [organizationID])
          .catch(() => undefined)
      if (otherOrganizationID)
        await testPool
          .query('DELETE FROM organization WHERE id = $1', [otherOrganizationID])
          .catch(() => undefined)
      if (ownerID)
        await testPool
          .query('DELETE FROM "user" WHERE id LIKE $1', [`seed-image-%-${suffix}`])
          .catch(() => undefined)
      await testPool
        .query('DELETE FROM "user" WHERE id = $1', [otherOwnerID])
        .catch(() => undefined)
      await testPool.end()
    }
  }
)
