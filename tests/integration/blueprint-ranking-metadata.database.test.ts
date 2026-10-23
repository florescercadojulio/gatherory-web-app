import { Effect, Layer } from 'effect'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'public catalog ranking metadata stays bound to its publication owner and history',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in ranking metadata database test'
    ).toBeTruthy()
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${new URL(databaseUrl!).hostname}`
    ).toContain(new URL(databaseUrl!).hostname)

    const [
      database,
      schema,
      blueprintSchema,
      blueprintDiscoverySchema,
      repoModule,
      runtimeContracts,
      authoringContracts,
      seed,
      coverStorage,
      discoveryWorkflow,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/blueprint-discovery.schema'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/contracts/blueprint-authoring.contracts'),
      import('@/db/seeds/cottage-template'),
      import('@/server/blueprint-media/blueprint-cover.storage.live'),
      import('@/server/blueprints/workflows/blueprint-discovery-actions.workflows.live'),
    ])
    const { db, PgClientLive } = database
    const { user, organization } = schema
    const { blueprintTemplate, blueprintRevision } = blueprintSchema
    const { blueprintDiscoveryExposure, blueprintMeasurementSetting } = blueprintDiscoverySchema
    const { and, eq, inArray } = await import('drizzle-orm')
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ids = {
      owners: [
        `ranking-owner-a-${suffix}`,
        `ranking-owner-b-${suffix}`,
        `ranking-owner-private-${suffix}`,
        `ranking-owner-unlisted-${suffix}`,
        `ranking-owner-retired-${suffix}`,
      ],
      organizations: [
        `ranking-org-a-${suffix}`,
        `ranking-org-b-${suffix}`,
        `ranking-org-private-${suffix}`,
        `ranking-org-unlisted-${suffix}`,
        `ranking-org-retired-${suffix}`,
      ],
      templates: Array.from({ length: 5 }, () => crypto.randomUUID()),
      curatedKey: `ranking_curated_${suffix}`,
    }
    const fixtureNames = ['same-display-name', 'same-display-name', null, null, null]
    const keys = ids.templates.map((id) => `ranking_${id.replaceAll('-', '')}`)
    const contents = seed.cottageDraftContent
    const now = new Date()
    const start = new Date('2020-01-01T00:00:00.000Z')
    const definition = (key: string, revision: number) =>
      authoringContracts.draftDefinition(contents, key, revision)
    const checkpointLayer = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
      afterProjection: () => Effect.void,
    })
    const runtimeLayer = repoModule.BlueprintRepoLive.pipe(
      Layer.provide(
        Layer.mergeAll(
          PgClientLive,
          checkpointLayer,
          Layer.succeed(coverStorage.BlueprintCoverStorage, {
            bucket: 'unused',
            createUploadUrl: () => Effect.die('unused'),
            inspect: () => Effect.die('unused'),
            readBytes: () => Effect.die('unused'),
            putBytes: () => Effect.die('unused'),
            createReadUrl: () => Effect.die('unused'),
            delete: () => Effect.die('unused'),
          })
        )
      )
    )

    try {
      await db.insert(user).values(
        ids.owners.map((id) => ({
          id,
          name: 'Same real name',
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(blueprintMeasurementSetting).values({
        actorUserId: ids.owners[0]!,
        enabled: true,
      })
      await db.insert(organization).values(
        ids.organizations.map((id) => ({
          id,
          name: 'Ranking metadata fixture',
          slug: id,
          workspaceType: 'event' as const,
          createdAt: now,
        }))
      )
      await db.insert(blueprintTemplate).values(
        ids.templates.map((id, index) => ({
          id,
          catalogKey: keys[index]!,
          organizationId: ids.organizations[index]!,
          createdByUserId: ids.owners[index]!,
          createRequestId: crypto.randomUUID(),
          createRequestHash: 'c'.repeat(64),
          content: contents,
          creatorName: fixtureNames[index],
          draftVersion: 2,
          publishedRevision: index === 0 ? 2 : index === 2 ? null : 1,
          listedRevision: index < 2 ? (index === 0 ? 2 : 1) : index === 4 ? 1 : null,
          publishedDraftVersion: index === 2 ? null : 2,
          retiredAt: index === 4 ? now : null,
        }))
      )
      await db.insert(blueprintRevision).values([
        {
          templateId: ids.templates[0]!,
          draftVersion: 1,
          catalogKey: keys[0]!,
          revision: 1,
          document: definition(keys[0]!, 1),
          contentHash: '1'.repeat(64),
          createdAt: start,
        },
        {
          templateId: ids.templates[0]!,
          draftVersion: 2,
          catalogKey: keys[0]!,
          revision: 2,
          document: definition(keys[0]!, 2),
          contentHash: '2'.repeat(64),
          createdAt: new Date('2022-02-03T00:00:00.000Z'),
        },
        {
          templateId: ids.templates[1]!,
          draftVersion: 1,
          catalogKey: keys[1]!,
          revision: 1,
          document: definition(keys[1]!, 1),
          contentHash: '3'.repeat(64),
          createdAt: new Date('2021-03-04T00:00:00.000Z'),
        },
        {
          templateId: ids.templates[2]!,
          draftVersion: 1,
          catalogKey: keys[2]!,
          revision: 1,
          document: definition(keys[2]!, 1),
          contentHash: '4'.repeat(64),
          createdAt: start,
        },
        {
          templateId: ids.templates[3]!,
          draftVersion: 1,
          catalogKey: keys[3]!,
          revision: 1,
          document: definition(keys[3]!, 1),
          contentHash: '5'.repeat(64),
          createdAt: start,
        },
        {
          templateId: ids.templates[4]!,
          draftVersion: 1,
          catalogKey: keys[4]!,
          revision: 1,
          document: definition(keys[4]!, 1),
          contentHash: '7'.repeat(64),
          createdAt: start,
        },
        {
          templateId: null,
          draftVersion: null,
          catalogKey: ids.curatedKey,
          revision: 1,
          document: definition(ids.curatedKey, 1),
          contentHash: '6'.repeat(64),
          createdAt: start,
        },
      ])

      const catalog = await Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* runtimeContracts.BlueprintRepo
          return yield* repo.catalog(ids.owners[0]!)
        }).pipe(Effect.provide(runtimeLayer))
      )
      const byKey = new Map(catalog.map((entry) => [entry.catalogKey, entry]))
      expect(byKey.get(keys[0]!)?.rankingMetadata).toEqual({
        creatorKey: ids.owners[0],
        firstPublishedAt: start.toISOString(),
      })
      expect(byKey.get(keys[1]!)?.rankingMetadata).toEqual({
        creatorKey: ids.owners[1],
        firstPublishedAt: '2021-03-04T00:00:00.000Z',
      })
      expect(byKey.get(keys[0]!)?.creator?.displayName).toBe(
        byKey.get(keys[1]!)?.creator?.displayName
      )
      expect(byKey.get(keys[0]!)?.rankingMetadata?.creatorKey).not.toBe(
        byKey.get(keys[1]!)?.rankingMetadata?.creatorKey
      )
      expect(byKey.get(ids.curatedKey)?.rankingMetadata).toEqual({
        creatorKey: null,
        firstPublishedAt: null,
      })
      expect(byKey.has(keys[2]!)).toBe(false)
      expect(byKey.has(keys[3]!)).toBe(false)
      expect(byKey.has(keys[4]!)).toBe(false)
      expect(byKey.get(keys[0]!)?.revision).toBe(2)

      const fixtureCatalog = catalog.filter(
        (entry) =>
          entry.catalogKey === ids.curatedKey || keys.slice(0, 2).includes(entry.catalogKey)
      )
      const priorRankingSetting = process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED
      const priorPersonalLikeSetting = process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED
      process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED = 'true'
      // This suite validates the shared baseline metadata contract. Personal Like
      // metadata and cursor behavior are covered by its focused integration test.
      process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED = 'false'
      try {
        const page = (input: { cursor?: string }, ranked = true) =>
          Effect.runPromise(
            discoveryWorkflow
              .enrichBlueprintCatalogPage(ids.owners[0]!, fixtureCatalog, {
                limit: 1,
                q: '',
                ...(ranked ? { ranking: 'baseline_v1' as const } : {}),
                ...input,
              })
              .pipe(Effect.provide(PgClientLive))
          )

        const firstPage = await page({})
        expect(firstPage.ok).toBe(true)
        if (!firstPage.ok) throw new Error(`Unexpected ranked-page result: ${firstPage.reason}`)
        expect(firstPage.page.ranking).toMatchObject({ mode: 'baseline_v1' })
        expect(firstPage.page.entries[0]?.viewerState).toEqual({
          liked: false,
          bookmarked: false,
          notInterested: false,
        })
        expect(firstPage.page.entries[0]).not.toHaveProperty('rankingMetadata')
        expect(JSON.stringify(firstPage.page)).not.toContain(ids.owners[0]!)
        expect(JSON.stringify(firstPage.page)).not.toContain(ids.owners[1]!)

        const pagedKeys = new Set(firstPage.page.entries.map((entry) => entry.catalogKey))
        const continuationCursor = firstPage.page.nextCursor
        expect(continuationCursor).toBeDefined()
        let cursor = continuationCursor
        while (cursor) {
          const nextPage = await page({ cursor })
          expect(nextPage.ok).toBe(true)
          if (!nextPage.ok) throw new Error(`Unexpected ranked-page result: ${nextPage.reason}`)
          expect(nextPage.page.ranking).toMatchObject({ mode: 'baseline_v1' })
          for (const entry of nextPage.page.entries) {
            expect(entry).not.toHaveProperty('rankingMetadata')
            pagedKeys.add(entry.catalogKey)
          }
          for (const ownerId of ids.owners.slice(0, 2))
            expect(JSON.stringify(nextPage.page)).not.toContain(ownerId)
          cursor = nextPage.page.nextCursor
        }
        expect(pagedKeys).toEqual(new Set([...keys.slice(0, 2), ids.curatedKey]))

        const firstLegacyPage = await page({}, false)
        expect(firstLegacyPage.ok).toBe(true)
        if (!firstLegacyPage.ok)
          throw new Error(`Unexpected legacy-page result: ${firstLegacyPage.reason}`)
        expect(firstLegacyPage.page.ranking).toBeUndefined()
        let legacyCursor = firstLegacyPage.page.nextCursor
        while (legacyCursor) {
          const nextLegacyPage = await page({ cursor: legacyCursor }, false)
          expect(nextLegacyPage.ok).toBe(true)
          if (!nextLegacyPage.ok)
            throw new Error(`Unexpected legacy-page result: ${nextLegacyPage.reason}`)
          expect(nextLegacyPage.page.ranking).toBeUndefined()
          legacyCursor = nextLegacyPage.page.nextCursor
        }

        const exposures = await db
          .select({
            actorUserId: blueprintDiscoveryExposure.actorUserId,
            catalogKey: blueprintDiscoveryExposure.catalogKey,
            snapshotId: blueprintDiscoveryExposure.snapshotId,
            rankingContext: blueprintDiscoveryExposure.rankingContext,
          })
          .from(blueprintDiscoveryExposure)
          .where(
            and(
              eq(blueprintDiscoveryExposure.actorUserId, ids.owners[0]!),
              inArray(blueprintDiscoveryExposure.catalogKey, [...keys.slice(0, 2), ids.curatedKey])
            )
          )
        const rankedExposures = exposures.filter((exposure) => exposure.rankingContext !== null)
        const legacyExposures = exposures.filter((exposure) => exposure.rankingContext === null)
        expect(rankedExposures.map((exposure) => exposure.catalogKey).sort()).toEqual(
          [keys[1]!, ids.curatedKey].sort()
        )
        expect(legacyExposures.map((exposure) => exposure.catalogKey).sort()).toEqual(
          [keys[1]!, ids.curatedKey].sort()
        )
        const publicRanking = firstPage.page.ranking!
        expect(publicRanking.algorithmVersion).toBe('blueprint-baseline-v2')
        expect(publicRanking.configurationVersion).toBe('blueprint-baseline-v2')
        for (const exposure of rankedExposures) {
          expect(exposure.actorUserId).toBe(ids.owners[0])
          expect(exposure.rankingContext).toMatchObject({
            mode: 'baseline_v1',
            algorithmVersion: publicRanking.algorithmVersion,
            configurationVersion: publicRanking.configurationVersion,
            asOf: publicRanking.asOf,
          })
          expect(exposure.rankingContext?.configurationDigest).toMatch(/^[a-f0-9]{64}$/)
          expect(exposure.rankingContext).not.toHaveProperty('query')
          expect(JSON.stringify(exposure.rankingContext)).not.toContain(ids.owners[0]!)
          expect(JSON.stringify(exposure.rankingContext)).not.toContain(ids.owners[1]!)
        }
        expect(legacyExposures.every((exposure) => exposure.rankingContext === null)).toBe(true)

        await db
          .update(blueprintTemplate)
          .set({ listedRevision: null })
          .where(eq(blueprintTemplate.id, ids.templates[0]!))
        const afterWithdrawal = await Effect.runPromise(
          Effect.gen(function* () {
            const repo = yield* runtimeContracts.BlueprintRepo
            return yield* repo.catalog(ids.owners[0]!)
          }).pipe(Effect.provide(runtimeLayer))
        )
        const scopedAfterWithdrawal = afterWithdrawal.filter(
          (entry) =>
            entry.catalogKey === ids.curatedKey || keys.slice(0, 2).includes(entry.catalogKey)
        )
        const stale = await Effect.runPromise(
          discoveryWorkflow
            .enrichBlueprintCatalogPage(ids.owners[0]!, scopedAfterWithdrawal, {
              limit: 1,
              q: '',
              ranking: 'baseline_v1',
              cursor: continuationCursor,
            })
            .pipe(Effect.provide(PgClientLive))
        )
        expect(stale).toEqual({ ok: false, reason: 'stale_cursor' })
        expect(JSON.stringify(stale)).not.toContain(ids.owners[0]!)
        expect(JSON.stringify(stale)).not.toContain(ids.owners[1]!)
      } finally {
        if (priorRankingSetting === undefined) {
          delete process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED
        } else {
          process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED = priorRankingSetting
        }
        if (priorPersonalLikeSetting === undefined) {
          delete process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED
        } else {
          process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED = priorPersonalLikeSetting
        }
      }
    } finally {
      await db.delete(blueprintTemplate).where(inArray(blueprintTemplate.id, ids.templates))
      await db.delete(blueprintRevision).where(eq(blueprintRevision.catalogKey, ids.curatedKey))
      await db.delete(organization).where(inArray(organization.id, ids.organizations))
      await db.delete(user).where(inArray(user.id, ids.owners))
    }
  }
)
