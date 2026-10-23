import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { Effect, Layer, Context } from 'effect'
import { expect, it, vi } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

it.skipIf(!enabled)(
  'copies a curated Explore cover privately, installs it, honors removal, and retries without CDN access',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the blueprint cover integration test'
    ).toBeTruthy()
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${new URL(databaseUrl!).hostname}`
    ).toContain(new URL(databaseUrl!).hostname)

    const imageBytes = await (
      await import('sharp')
    )
      .default({
        create: { width: 2, height: 2, channels: 3, background: '#ce9472' },
      })
      .jpeg()
      .toBuffer()
    const imageHash = createHash('sha256').update(imageBytes).digest('hex')
    const imagePrefix = `https://cdn.gatherory.com/explore/covers/cover-fixture/${imageHash}/`
    const manifest = {
      schemaVersion: 1,
      label: 'Database fixture cover',
      source: { width: 2, height: 2, checksum: imageHash },
      bucket: 'gatherory-public',
      processingVersion: 'explore-cover-jpeg-v1',
      variants: (['thumbnail', 'card', 'hero'] as const).map((name) => ({
        name,
        width: 2,
        height: 2,
        checksum: imageHash,
        bucket: 'gatherory-public',
        key: `explore/covers/cover-fixture/${imageHash}/${name}.jpg`,
        url: `${imagePrefix}${name}.jpg`,
      })),
    }
    vi.doMock('@/server/blueprints/catalog/explore-cover-manifests.json', () => ({
      default: { wedding: manifest },
    }))
    vi.doMock('@/server/blueprints/catalog/explore-cover-images.json', () => ({
      default: { wedding: `${imagePrefix}card.jpg` },
    }))
    vi.doMock('@/server/blueprints/catalog/seed-image-assets.json', () => ({
      default: {
        fixture: {
          manifest,
          license: {
            name: 'Unsplash License',
            url: 'https://unsplash.com/license',
            sourceURL: 'https://unsplash.com/photos/fixture',
            photographer: 'Fixture photographer',
            photoID: 'fixture',
            checkedAt: '2026-10-22T12:00:00Z',
          },
          file: 'scripts/seed/blueprint-assets/fixture.jpg',
          fileChecksum: imageHash,
        },
      },
    }))
    const { blueprintStarters: fixtureStarters } =
      await import('@/server/blueprints/catalog/starters')
    const weddingFixture = fixtureStarters.find((starter) => starter.catalogKey === 'wedding')!
    vi.doMock('@/server/blueprints/catalog/seed-image-assignments.json', () => ({
      default: {
        wedding: {
          revision: weddingFixture.revision,
          contentHash: weddingFixture.contentHash,
          root: 'fixture',
          children: { rehearsal: 'fixture' },
          ideas: { flowers: 'fixture' },
        },
      },
    }))

    const objects = new Map<string, Buffer>()
    const storage = {
      bucket: 'private-test-bucket',
      createUploadUrl: () => Effect.die('unused'),
      inspect: () => Effect.die('unused'),
      readBytes: ({ key }: { key: string }) => {
        const bytes = objects.get(key)
        return bytes ? Effect.succeed(bytes) : Effect.die(`missing test object ${key}`)
      },
      putBytes: (input: { key: string; bytes: Buffer }) => {
        objects.set(input.key, input.bytes)
        return Effect.void
      },
      createReadUrl: () => Effect.die('unused'),
      delete: () => Effect.void,
    }
    class TestCoverStorage extends Context.Service<TestCoverStorage, typeof storage>()(
      'BlueprintCoverStorage'
    ) {}
    vi.doMock('@/server/blueprint-media/blueprint-cover.storage.live', () => ({
      BlueprintCoverStorage: TestCoverStorage,
      BlueprintCoverStorageLive: Layer.succeed(TestCoverStorage, storage),
    }))

    const fetchMock = vi.fn(
      async () => new Response(imageBytes, { headers: { 'content-type': 'image/jpeg' } })
    )
    vi.stubGlobal('fetch', fetchMock)

    const [
      database,
      schema,
      mediaSchema,
      blueprintMediaSchema,
      blueprintSchema,
      personalRepoModule,
      personalRepoLive,
      blueprintRepoModule,
      coverStorageModule,
      runtimeContracts,
      installWorkflow,
      authContracts,
      catalogSeed,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/media.schema'),
      import('@/db/schema/blueprint-media.schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/server/blueprints/repos/blueprint-personal.repo'),
      import('@/server/blueprints/repos/blueprint-personal.repo.live'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprint-media/blueprint-cover.storage.live'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/server/blueprints/workflows/install-blueprint.workflow'),
      import('@/server/workspaces/connectors/better-auth.con'),
      import('@/server/blueprints/repos/seed-blueprint-catalog'),
    ])
    const { db, PgClientLive } = database
    const { user, organization, member, event, idea } = schema
    const { eventMedia, ideaMedia, mediaAsset } = mediaSchema
    const { blueprintCoverAsset } = blueprintMediaSchema
    const { blueprintTemplate, blueprintRevision, blueprintInstallation } = blueprintSchema
    const { blueprintAttributionAcquisition, blueprintQualifiedAdoption } =
      await import('@/db/schema/blueprint-attribution.schema')
    const { blueprintDiscoveryExposure, blueprintDiscoverySignal, blueprintMeasurementSetting } =
      await import('@/db/schema/blueprint-discovery.schema')
    const { nativeWorkspaceSnapshot } = await import('@/db/schema/sync.schema')
    const { BlueprintPersonalRepo } = personalRepoModule
    const { BlueprintInstallCheckpoint } = runtimeContracts
    const { BetterAuthWorkspaceCon } = authContracts
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorId = `curated-cover-${suffix}`
    const personalOrganizationId = `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
    const externalOrganizationIds = new Set<string>()
    const nativeBridge = JSON.parse(
      readFileSync('tests/fixtures/blueprint-native-copy-snapshots.v1.json', 'utf8')
    ) as {
      cases: Array<{
        label: string
        source: { catalogKey: string; revision: number; contentHash: string }
        content: Record<string, unknown>
      }>
    }
    const nativeWedding = nativeBridge.cases.find((item) => item.label === 'curated:wedding')!
    const authoringContracts = await import('@/contracts/blueprint-authoring.contracts')
    const nativeWeddingContent = authoringContracts.BlueprintDraftContentSchema.parse(
      nativeWedding.content
    )
    const run = <A, E, R, LE>(program: Effect.Effect<A, E, R>, layer: Layer.Layer<R, LE, never>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const personalLayer = personalRepoLive.BlueprintPersonalRepoLive.pipe(
      Layer.provide(PgClientLive)
    )
    const checkpointLayer = Layer.succeed(BlueprintInstallCheckpoint, {
      afterProjection: () => Effect.void,
    })
    const blueprintLayer = blueprintRepoModule.BlueprintRepoLive.pipe(
      Layer.provide(
        Layer.mergeAll(PgClientLive, checkpointLayer, coverStorageModule.BlueprintCoverStorageLive)
      )
    )
    const authLayer = Layer.succeed(BetterAuthWorkspaceCon, {
      listOrganizations: () => Effect.succeed([]),
      createOrganization: (input) =>
        Effect.tryPromise({
          try: async () => {
            const id = `curated-cover-org-${crypto.randomUUID()}`
            const createdAt = new Date()
            await db.insert(organization).values({
              id,
              name: input.name,
              slug: input.slug,
              createdAt,
            })
            await db.insert(member).values({
              id: `curated-cover-member-${crypto.randomUUID()}`,
              organizationId: id,
              userId: actorId,
              role: 'owner',
              createdAt,
            })
            externalOrganizationIds.add(id)
            return { id, name: input.name, slug: input.slug, workspaceType: 'event' as const }
          },
          catch: (cause) =>
            new authContracts.BetterAuthWorkspaceError({
              category: 'external',
              code: 'BLUEPRINT_TEST_AUTH_PROVIDER_FAILURE',
              userMessageKey: 'serverErrors.SYSTEM',
              cause,
            }),
        }),
      setActiveOrganization: () => Effect.void,
      listTeams: () => Effect.succeed([]),
      createTeam: () => Effect.die('unused'),
      addTeamMember: () => Effect.die('unused'),
      setActiveTeam: () => Effect.void,
    })
    const installLayer = Layer.mergeAll(blueprintLayer, authLayer)
    const copy = (
      requestId: string,
      content: Record<string, unknown>,
      source: { catalogKey: string; revision: number; discoveryExposureId?: string } = {
        catalogKey: 'wedding',
        revision: 1,
      }
    ) =>
      run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.copy(actorId, {
            requestId,
            source,
            content: content as never,
          })
        }),
        personalLayer
      )
    const install = (
      copied: Awaited<ReturnType<typeof copy>>,
      requestId: string,
      remove = false,
      includeAll = false
    ) =>
      run(
        installWorkflow.installBlueprintWorkflow(
          { id: actorId, name: 'Curated cover fixture', email: `${actorId}@example.test` },
          {
            requestId,
            catalogKey: copied.catalogEntry.catalogKey,
            revision: copied.catalogEntry.revision,
            contentHash: copied.catalogEntry.contentHash,
            mainEvent: {
              name: 'Curated cover install',
              startsAt: '2030-08-17T15:00:00.000Z',
              timeZone: 'America/Detroit',
            },
            selectedChildren: includeAll
              ? ((nativeWeddingContent.children as Array<{ key: string }>).map((child, index) => ({
                  key: child.key,
                  startsAt: new Date(
                    Date.parse('2030-08-17T16:00:00.000Z') + index * 3_600_000
                  ).toISOString(),
                })) ?? [])
              : [],
            selectedIdeaKeys: includeAll
              ? ((nativeWeddingContent.ideas as Array<{ key: string }>).map((item) => item.key) ??
                [])
              : [],
            capabilities: [
              'event.children_v1',
              'planning.ideas_v2',
              'planning.instructions_v1',
              'planning.portable_idea_config_v1',
              'planning.todos_v1',
            ],
            ...(remove
              ? { customizations: { version: 1, coverAssetId: null, children: [], ideas: [] } }
              : {}),
          }
        ),
        installLayer
      )
    const installPublic = (requestId: string, removeRootCover = false) =>
      run(
        installWorkflow.installBlueprintWorkflow(
          { id: actorId, name: 'Curated cover fixture', email: `${actorId}@example.test` },
          {
            requestId,
            catalogKey: 'wedding',
            revision: 1,
            contentHash: weddingFixture.contentHash,
            mainEvent: {
              name: 'Direct public install',
              startsAt: '2030-08-17T15:00:00.000Z',
              timeZone: 'America/Detroit',
            },
            selectedChildren: [{ key: 'rehearsal', startsAt: '2030-08-17T15:00:00.000Z' }],
            selectedIdeaKeys: ['flowers'],
            capabilities: [
              'event.children_v1',
              'planning.ideas_v2',
              'planning.instructions_v1',
              'planning.portable_idea_config_v1',
              'planning.todos_v1',
            ],
            ...(removeRootCover
              ? { customizations: { version: 1, coverAssetId: null, children: [], ideas: [] } }
              : {}),
          }
        ),
        installLayer
      )

    try {
      await db.insert(user).values({
        id: actorId,
        name: 'Curated cover fixture',
        email: `${actorId}@example.test`,
        emailVerified: true,
      })
      await db.insert(organization).values({
        id: personalOrganizationId,
        name: 'Curated cover fixture personal workspace',
        slug: personalOrganizationId,
        workspaceType: 'event',
        createdAt: new Date(),
      })
      await db.insert(member).values({
        id: `curated-cover-member-${crypto.randomUUID()}`,
        organizationId: personalOrganizationId,
        userId: actorId,
        role: 'owner',
        createdAt: new Date(),
      })
      await run(catalogSeed.seedBlueprintCatalog, PgClientLive)

      const seededWeddingRevision = await db
        .select()
        .from(blueprintRevision)
        .where((await import('drizzle-orm')).eq(blueprintRevision.catalogKey, 'wedding'))
      expect(seededWeddingRevision[0]?.contentHash).toBe(nativeWedding.source.contentHash)
      await db.insert(blueprintMeasurementSetting).values({ actorUserId: actorId, enabled: true })

      const directRequestId = crypto.randomUUID()
      const directInstalled = await installPublic(directRequestId)
      const { or, eq, inArray } = await import('drizzle-orm')
      const directEvents = await db
        .select({ id: event.id })
        .from(event)
        .where(
          or(
            eq(event.id, directInstalled.scopeID),
            eq(event.parentEventId, directInstalled.scopeID)
          )
        )
      expect(directEvents).toHaveLength(2)
      const directEventMedia = await db
        .select()
        .from(eventMedia)
        .where(
          inArray(
            eventMedia.eventId,
            directEvents.map(({ id }) => id)
          )
        )
      expect(directEventMedia).toHaveLength(2)
      const directIdeas = await db
        .select()
        .from(idea)
        .where(eq(idea.organizationId, directInstalled.organizationID))
      expect(directIdeas).toHaveLength(1)
      expect(
        await db.select().from(ideaMedia).where(eq(ideaMedia.ideaId, directIdeas[0]!.id))
      ).toHaveLength(1)
      const fetchesAfterDirectInstall = fetchMock.mock.calls.length
      expect(fetchesAfterDirectInstall).toBe(3)
      const disabledDirectFetch = vi.fn(() =>
        Promise.reject(new Error('completed install retry fetched CDN'))
      )
      vi.stubGlobal('fetch', disabledDirectFetch)
      expect(await installPublic(directRequestId)).toEqual(directInstalled)
      expect(disabledDirectFetch).not.toHaveBeenCalled()
      vi.stubGlobal('fetch', fetchMock)

      // The selected child shares the root's image key. Its import must not
      // restore a root image that the request explicitly removed.
      const removedRootRequestId = crypto.randomUUID()
      const removedRootInstall = await installPublic(removedRootRequestId, true)
      const [removedRootReceipt] = await db
        .select()
        .from(blueprintInstallation)
        .where(eq(blueprintInstallation.requestId, removedRootRequestId))
      expect(
        (removedRootReceipt!.plan as { main: { coverAssetId: string | null } }).main.coverAssetId
      ).toBeNull()
      expect(
        await db.select().from(eventMedia).where(eq(eventMedia.eventId, removedRootInstall.scopeID))
      ).toHaveLength(0)
      const [removedRootChild] = await db
        .select()
        .from(event)
        .where(eq(event.parentEventId, removedRootInstall.scopeID))
      expect(
        await db.select().from(eventMedia).where(eq(eventMedia.eventId, removedRootChild!.id))
      ).toHaveLength(1)

      const baseContent = {
        name: 'Curated default fixture',
        description: '',
        experienceType: 'custom',
        children: [
          { key: 'rehearsal', title: 'Rehearsal', purpose: 'part_of_event', category: 'rehearsal' },
        ],
        ideas: [
          {
            key: 'flowers',
            title: 'Flowers',
            category: 'flowers',
            notes: '',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
        ],
        instructions: [],
        todos: [],
      }
      const requestId = crypto.randomUUID()
      const fetchCountBeforeCopy = fetchMock.mock.calls.length
      const copied = await copy(requestId, baseContent)
      expect(copied.catalogEntry.definition).toMatchObject({
        presentation: { coverAssetId: expect.any(String) },
      })
      expect(copied.catalogEntry.definition).toMatchObject({
        modules: expect.arrayContaining([
          expect.objectContaining({
            type: 'experience_tree',
            config: expect.objectContaining({
              children: expect.arrayContaining([
                expect.objectContaining({ key: 'rehearsal', coverAssetId: expect.any(String) }),
              ]),
            }),
          }),
          expect.objectContaining({
            type: 'ideas',
            config: expect.objectContaining({
              ideas: expect.arrayContaining([
                expect.objectContaining({ key: 'flowers', coverAssetId: expect.any(String) }),
              ]),
            }),
          }),
        ]),
      })
      const savedCopy = await db
        .select()
        .from(blueprintTemplate)
        .where((await import('drizzle-orm')).eq(blueprintTemplate.id, copied.id))
      const coverId = (savedCopy[0]?.content as { coverAssetId?: string }).coverAssetId
      expect(coverId).toEqual(expect.any(String))
      expect(
        await db
          .select()
          .from(blueprintCoverAsset)
          .where((await import('drizzle-orm')).eq(blueprintCoverAsset.id, coverId!))
      ).toMatchObject([
        {
          ownerUserId: actorId,
          status: 'ready',
          bucket: 'private-test-bucket',
          checksum: imageHash,
        },
      ])
      expect(fetchMock).toHaveBeenCalledTimes(fetchCountBeforeCopy + 3)
      const coverService = await import('@/server/blueprint-media/blueprint-cover.service')
      const { blueprintStarters } = await import('@/server/blueprints/catalog/starters')
      const weddingContentHash = blueprintStarters.find(
        (starter) => starter.catalogKey === 'wedding'
      )!.contentHash
      const reusedAssetId = await Effect.runPromise(
        coverService
          .materializeCuratedExploreCover({
            actorUserId: actorId,
            requestId,
            catalogKey: 'wedding',
            revision: 1,
            contentHash: weddingContentHash,
          })
          .pipe(
            Effect.provideService(coverStorageModule.BlueprintCoverStorage, storage),
            Effect.provide(PgClientLive)
          )
      )
      expect(reusedAssetId).toBe(coverId)
      expect(fetchMock).toHaveBeenCalledTimes(fetchCountBeforeCopy + 3)

      // This copy uses the exact full content emitted by the native resolver.
      // The copy operation materializes the real fixture covers into private
      // assets, so its own published hash must differ from the curated source.
      const exposureId = crypto.randomUUID()
      const issuedAt = new Date()
      await db.insert(blueprintDiscoveryExposure).values({
        exposureId,
        actorUserId: actorId,
        catalogKey: nativeWedding.source.catalogKey,
        sourceRevision: nativeWedding.source.revision,
        contentHash: nativeWedding.source.contentHash,
        surface: 'browse',
        rank: 1,
        issuedAt,
        expiresAt: new Date(issuedAt.getTime() + 30 * 60 * 1000),
      })
      await db.insert(blueprintDiscoverySignal).values({
        actorUserId: actorId,
        exposureId,
        catalogKey: nativeWedding.source.catalogKey,
        signalDate: issuedAt.toISOString().slice(0, 10),
        requestId: crypto.randomUUID(),
        requestHash: 'b'.repeat(64),
        kind: 'open',
        acceptedAt: new Date(issuedAt.getTime() + 1_000),
        rankEligible: false,
      })
      vi.stubGlobal('fetch', fetchMock)
      const nativeCopy = await copy(crypto.randomUUID(), nativeWeddingContent, {
        catalogKey: nativeWedding.source.catalogKey,
        revision: nativeWedding.source.revision,
        discoveryExposureId: exposureId,
      })
      expect(nativeCopy.catalogEntry.contentHash).not.toBe(nativeWedding.source.contentHash)
      expect(nativeCopy.catalogEntry.definition).toMatchObject({
        presentation: { coverAssetId: expect.any(String) },
      })
      const [nativeAcquisition] = await db
        .select()
        .from(blueprintAttributionAcquisition)
        .where(
          (await import('drizzle-orm')).eq(
            blueprintAttributionAcquisition.copyTemplateId,
            nativeCopy.id
          )
        )
      expect(nativeAcquisition).toMatchObject({
        actorUserId: actorId,
        exposureId,
        sourceCatalogKey: nativeWedding.source.catalogKey,
        sourceRevision: nativeWedding.source.revision,
        sourceContentHash: nativeWedding.source.contentHash,
        copyContentHash: nativeCopy.catalogEntry.contentHash,
      })
      const nativeInstall = await install(nativeCopy, crypto.randomUUID(), false, true)
      expect(nativeInstall.installationID).toBeTruthy()
      const nativeAdoption = await db
        .select()
        .from(blueprintQualifiedAdoption)
        .where(
          (await import('drizzle-orm')).eq(
            blueprintQualifiedAdoption.acquisitionId,
            nativeAcquisition!.id
          )
        )
      expect(nativeAdoption).toMatchObject([
        {
          actorUserId: actorId,
          sourceCatalogKey: nativeWedding.source.catalogKey,
          sourceRevision: nativeWedding.source.revision,
          sourceContentHash: nativeWedding.source.contentHash,
        },
      ])

      const objectsBeforeBadChecksum = objects.size
      const assetsBeforeBadChecksum = await db.select().from(blueprintCoverAsset)
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(Buffer.from('wrong bytes'), { headers: { 'content-type': 'image/jpeg' } })
        )
      )
      await expect(
        Effect.runPromise(
          coverService
            .materializeCuratedExploreCover({
              actorUserId: actorId,
              requestId: crypto.randomUUID(),
              catalogKey: 'wedding',
              revision: 1,
              contentHash: weddingContentHash,
            })
            .pipe(
              Effect.provideService(coverStorageModule.BlueprintCoverStorage, storage),
              Effect.provide(PgClientLive)
            )
        )
      ).rejects.toMatchObject({ code: 'BLUEPRINT_CURATED_COVER_IMPORT_FAILED' })
      expect(objects.size).toBe(objectsBeforeBadChecksum)
      expect(await db.select().from(blueprintCoverAsset)).toHaveLength(
        assetsBeforeBadChecksum.length
      )

      const disabledFetch = vi.fn(() =>
        Promise.reject(new Error('CDN must not be needed on a replay'))
      )
      vi.stubGlobal('fetch', disabledFetch)
      expect(await copy(requestId, baseContent)).toEqual(copied)

      const objectCountBeforeOverrides = objects.size
      const fetchCountBeforeOverrides = disabledFetch.mock.calls.length
      const removedAtCopy = await copy(crypto.randomUUID(), {
        ...baseContent,
        coverAssetId: null,
        children: baseContent.children.map((item) => ({ ...item, coverAssetId: null })),
        ideas: baseContent.ideas.map((item) => ({ ...item, coverAssetId: null })),
      })
      expect(
        (removedAtCopy.catalogEntry.definition as { presentation?: { coverAssetId?: string } })
          .presentation?.coverAssetId
      ).toBeNull()
      expect(objects.size).toBe(objectCountBeforeOverrides)
      expect(disabledFetch).toHaveBeenCalledTimes(fetchCountBeforeOverrides)

      const [starterRevision] = await db
        .select()
        .from(blueprintRevision)
        .where((await import('drizzle-orm')).eq(blueprintRevision.catalogKey, 'wedding'))
      await db
        .update(blueprintRevision)
        .set({ retiredAt: new Date() })
        .where((await import('drizzle-orm')).eq(blueprintRevision.id, starterRevision!.id))
      try {
        const retiredCopy = await copy(crypto.randomUUID(), baseContent)
        expect(
          (retiredCopy.catalogEntry.definition as { presentation?: { coverAssetId?: string } })
            .presentation?.coverAssetId
        ).toBeUndefined()
        expect(disabledFetch).toHaveBeenCalledTimes(fetchCountBeforeOverrides)
      } finally {
        await db
          .update(blueprintRevision)
          .set({ retiredAt: null })
          .where((await import('drizzle-orm')).eq(blueprintRevision.id, starterRevision!.id))
      }

      const installed = await install(copied, crypto.randomUUID())
      expect(
        await db
          .select()
          .from(mediaAsset)
          .where(
            (await import('drizzle-orm')).eq(mediaAsset.organizationId, installed.organizationID)
          )
      ).toMatchObject([{ status: 'ready', visibility: 'private', checksum: imageHash }])
      const defaultPlacement = await db
        .select()
        .from(eventMedia)
        .where((await import('drizzle-orm')).eq(eventMedia.eventId, installed.scopeID))
      expect(defaultPlacement).toHaveLength(1)
      const [snapshot] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where((await import('drizzle-orm')).eq(nativeWorkspaceSnapshot.scopeId, installed.scopeID))
      const nativeArchive = JSON.parse(Buffer.from(snapshot!.payload, 'base64').toString('utf8'))
      expect(nativeArchive.mainEventMediaAssetID).toBe(defaultPlacement[0]!.mediaAssetId)

      const removed = await install(copied, crypto.randomUUID(), true)
      expect(
        await db
          .select()
          .from(eventMedia)
          .where((await import('drizzle-orm')).eq(eventMedia.eventId, removed.scopeID))
      ).toHaveLength(0)

      const replacementBytes = await (
        await import('sharp')
      )
        .default({
          create: { width: 2, height: 2, channels: 3, background: '#327b91' },
        })
        .jpeg()
        .toBuffer()
      const replacementHash = createHash('sha256').update(replacementBytes).digest('hex')
      const replacementId = crypto.randomUUID()
      const replacementVariants = Object.fromEntries(
        (['thumbnail', 'card', 'hero'] as const).map((variant) => [
          variant,
          {
            storageKey: `blueprint-covers/users/${actorId}/${replacementId}/${variant}.jpg`,
            width: 2,
            height: 2,
          },
        ])
      )
      const replacementOriginalKey = `blueprint-covers/users/${actorId}/${replacementId}/original.jpg`
      await db.insert(blueprintCoverAsset).values({
        id: replacementId,
        ownerUserId: actorId,
        status: 'ready',
        bucket: 'private-test-bucket',
        originalStorageKey: replacementOriginalKey,
        uploadStorageKey: `temporary/blueprint-covers/users/${actorId}/${replacementId}/upload.jpg`,
        variantStorageKeys: replacementVariants as never,
        originalFilename: 'replacement.jpg',
        contentType: 'image/jpeg',
        byteSize: replacementBytes.byteLength,
        width: 2,
        height: 2,
        checksum: replacementHash,
      })
      objects.set(replacementOriginalKey, replacementBytes)
      for (const variant of ['thumbnail', 'card', 'hero'] as const) {
        objects.set(replacementVariants[variant].storageKey, replacementBytes)
      }
      const replacedDraft = {
        ...baseContent,
        coverAssetId: replacementId,
        children: [
          {
            key: 'rehearsal',
            title: 'Rehearsal',
            purpose: 'part_of_event',
            category: 'rehearsal',
            coverAssetId: replacementId,
          },
        ],
      }
      await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.save(actorId, {
            id: copied.id,
            expectedVersion: 1,
            content: replacedDraft as never,
          })
        }),
        personalLayer
      )
      const replacementBlueprint = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.publish(actorId, { id: copied.id, expectedVersion: 2 })
        }),
        personalLayer
      )
      const privateCopyRequestId = crypto.randomUUID()
      const privateSource = {
        catalogKey: replacementBlueprint.catalogEntry.catalogKey,
        revision: replacementBlueprint.catalogEntry.revision,
      }
      const privateCopied = await copy(privateCopyRequestId, replacedDraft, privateSource)
      const objectCountAfterPrivateCopy = objects.size
      expect(await copy(privateCopyRequestId, replacedDraft, privateSource)).toEqual(privateCopied)
      expect(objects.size).toBe(objectCountAfterPrivateCopy)
      expect(disabledFetch).not.toHaveBeenCalled()
      await expect(
        copy(privateCopyRequestId, { ...replacedDraft, name: 'Different copy body' }, privateSource)
      ).rejects.toMatchObject({ code: 'BLUEPRINT_COPY_REQUEST_CONFLICT' })
      expect(objects.size).toBe(objectCountAfterPrivateCopy)

      const replacementInstall = await install(replacementBlueprint, crypto.randomUUID())
      const replacementPlacement = await db
        .select()
        .from(eventMedia)
        .where((await import('drizzle-orm')).eq(eventMedia.eventId, replacementInstall.scopeID))
      const replacementMedia = await db
        .select()
        .from(mediaAsset)
        .where(
          (await import('drizzle-orm')).eq(mediaAsset.id, replacementPlacement[0]!.mediaAssetId)
        )
      expect(replacementMedia).toMatchObject([
        { status: 'ready', visibility: 'private', checksum: replacementHash },
      ])
      expect(externalOrganizationIds.has(installed.organizationID)).toBe(true)
    } finally {
      const { inArray, eq } = await import('drizzle-orm')
      if (externalOrganizationIds.size) {
        await db.delete(organization).where(inArray(organization.id, [...externalOrganizationIds]))
      }
      await db.delete(organization).where(eq(organization.id, personalOrganizationId))
      await db.delete(user).where(eq(user.id, actorId))
      vi.unstubAllGlobals()
      vi.doUnmock('@/server/blueprints/catalog/explore-cover-manifests.json')
      vi.doUnmock('@/server/blueprints/catalog/explore-cover-images.json')
      vi.doUnmock('@/server/blueprints/catalog/seed-image-assets.json')
      vi.doUnmock('@/server/blueprints/catalog/seed-image-assignments.json')
      vi.doUnmock('@/server/blueprint-media/blueprint-cover.storage.live')
    }
  }
)
