import { Context, Effect, Layer } from 'effect'
import { expect, it } from '@effect/vitest'
import { readFileSync } from 'node:fs'
import { vi } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

it.skipIf(!enabled)(
  'records only verified, unchanged organic setup-copy acquisitions',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl, 'DATABASE_URL is required for the attribution database test').toBeTruthy()
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(databaseUrl!).hostname)

    const storage = {
      bucket: 'unused-test-bucket',
      createUploadUrl: () => Effect.die('unused'),
      inspect: () => Effect.die('unused'),
      readBytes: () => Effect.die('unused'),
      putBytes: () => Effect.die('unused'),
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

    const [
      database,
      personalRepoModule,
      personalRepoLive,
      authoringContracts,
      installContracts,
      hashing,
      blueprintRepoModule,
      runtimeContracts,
      installWorkflow,
      authContracts,
      discoveryActionsWorkflow,
    ] = await Promise.all([
      import('@/db'),
      import('@/server/blueprints/repos/blueprint-personal.repo'),
      import('@/server/blueprints/repos/blueprint-personal.repo.live'),
      import('@/contracts/blueprint-authoring.contracts'),
      import('@/contracts/blueprint-install.contracts'),
      import('@/server/blueprints/planning/blueprint-hash'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/server/blueprints/workflows/install-blueprint.workflow'),
      import('@/server/workspaces/connectors/better-auth.con'),
      import('@/server/blueprints/workflows/blueprint-discovery-actions.workflows.live'),
    ])
    const { db, PgClientLive } = database
    const { user, organization, member, event, idea, eventTodo } = await import('@/db/schema')
    const {
      blueprintInstallation,
      blueprintTemplate,
      blueprintRevision,
      eventExperienceConfiguration,
      eventGuideSection,
    } = await import('@/db/schema/blueprint.schema')
    const { blueprintDiscoveryExposure, blueprintDiscoverySignal, blueprintMeasurementSetting } =
      await import('@/db/schema/blueprint-discovery.schema')
    const { blueprintAttributionAcquisition, blueprintQualifiedAdoption } =
      await import('@/db/schema/blueprint-attribution.schema')
    const { eq, sql } = await import('drizzle-orm')
    const { BlueprintPersonalRepo } = personalRepoModule
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorId = `attribution-${suffix}`
    const otherActorId = `attribution-other-${suffix}`
    const organizationId = `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
    const otherOrganizationId = `personal-${otherActorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
    const nativeBridge = JSON.parse(
      readFileSync('tests/fixtures/blueprint-native-copy-snapshots.v1.json', 'utf8')
    ) as {
      cases: Array<{
        label: string
        source: {
          catalogKey: string
          revision: number
          contentHash: string
          definition: unknown
          description?: string
        }
        content: unknown
      }>
    }
    const nativeContent = (label: string) => {
      const item = nativeBridge.cases.find((candidate) => candidate.label === label)
      expect(item, `captured native bridge case ${label}`).toBeDefined()
      return authoringContracts.BlueprintDraftContentSchema.parse(item!.content)
    }
    const content = nativeContent('authored:authored_single_native_bridge')
    const nativeCapabilitySnapshot = nativeContent('authored:authored_capability_native_bridge')
    // The DB attribution test does not seed real cover asset rows and object bytes.
    // Keep covers in the native round-trip fixture, and exercise DB copy/install
    // with the same captured capability content after removing only those media IDs.
    const capabilityContent = authoringContracts.BlueprintDraftContentSchema.parse({
      ...nativeCapabilitySnapshot,
      coverAssetId: null,
      children: nativeCapabilitySnapshot.children.map((child) => ({
        ...child,
        coverAssetId: null,
      })),
      ideas: nativeCapabilitySnapshot.ideas.map((idea) => ({ ...idea, coverAssetId: null })),
    })
    const installableCapabilityContent = capabilityContent
    const run = <A, E, R, LE>(program: Effect.Effect<A, E, R>, layer: Layer.Layer<R, LE, never>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const { BlueprintCoverStorage } =
      await import('@/server/blueprint-media/blueprint-cover.storage.live')
    const personalLayer = Layer.mergeAll(
      personalRepoLive.BlueprintPersonalRepoLive.pipe(Layer.provide(PgClientLive)),
      Layer.succeed(BlueprintCoverStorage, storage)
    )
    const externalOrganizationIds = new Set<string>()
    const { BlueprintInstallCheckpoint } = runtimeContracts
    const { BetterAuthWorkspaceCon, BetterAuthWorkspaceError } = authContracts
    const checkpointLayer = Layer.succeed(BlueprintInstallCheckpoint, {
      afterProjection: () => Effect.void,
    })
    const blueprintLayer = blueprintRepoModule.BlueprintRepoLive.pipe(
      Layer.provide(Layer.mergeAll(PgClientLive, checkpointLayer))
    )
    const authLayer = Layer.succeed(BetterAuthWorkspaceCon, {
      listOrganizations: () => Effect.succeed([]),
      createOrganization: (input) =>
        Effect.tryPromise({
          try: async () => {
            const id = `attribution-event-org-${crypto.randomUUID()}`
            const createdAt = new Date()
            await db.insert(organization).values({
              id,
              name: input.name,
              slug: input.slug,
              workspaceType: 'event',
              createdAt,
            })
            await db.insert(member).values({
              id: `attribution-member-${crypto.randomUUID()}`,
              organizationId: id,
              userId: input.userId!,
              role: 'owner',
              createdAt,
            })
            externalOrganizationIds.add(id)
            return { id, name: input.name, slug: input.slug, workspaceType: 'event' as const }
          },
          catch: (cause) =>
            new BetterAuthWorkspaceError({
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
      setActiveTeam: () => Effect.die('unused'),
    })
    const installLayer = Layer.mergeAll(blueprintLayer, authLayer)
    const sourceKey = `attribution_fixture_${suffix}`
    const sourceDefinition = installContracts.BlueprintCatalogDefinitionSchema.parse(
      authoringContracts.draftDefinition(content, sourceKey, 1)
    )
    const sourceHash = hashing.blueprintHash(sourceDefinition)
    const sourceCatalogKeys = new Set([sourceKey])
    const expectedQualifiedSourceKeys = new Set([sourceKey])
    const createdTemplateIds = new Set<string>()
    let completionFailureTrigger: { triggerName: string; functionName: string } | undefined
    const now = new Date()
    const caseRows: Array<{
      name: string
      exposureId?: string
      sourceKey?: string
      content?: typeof content
    }> = []

    try {
      await db.insert(user).values(
        [actorId, otherActorId].map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      for (const [id, orgId] of [
        [actorId, organizationId],
        [otherActorId, otherOrganizationId],
      ]) {
        await db.insert(organization).values({
          id: orgId,
          name: id,
          slug: orgId,
          workspaceType: 'event',
          createdAt: now,
        })
        await db.insert(member).values({
          id: crypto.randomUUID(),
          organizationId: orgId,
          userId: id,
          role: 'owner',
          createdAt: now,
        })
      }
      await db.insert(blueprintRevision).values({
        templateId: null,
        draftVersion: null,
        catalogKey: sourceKey,
        revision: 1,
        contentHash: sourceHash,
        document: sourceDefinition,
        description: '',
      })
      const addAuthoredSource = async (
        catalogKey: string,
        creatorId: string,
        listed: boolean,
        sourceContent = content
      ) => {
        const id = crypto.randomUUID()
        createdTemplateIds.add(id)
        sourceCatalogKeys.add(catalogKey)
        const requestId = crypto.randomUUID()
        const definition = installContracts.BlueprintCatalogDefinitionSchema.parse(
          authoringContracts.draftDefinition(sourceContent, catalogKey, 1)
        )
        const contentHash = hashing.blueprintHash(definition)
        await db.insert(blueprintTemplate).values({
          id,
          catalogKey,
          organizationId: creatorId === actorId ? organizationId : otherOrganizationId,
          createdByUserId: creatorId,
          createRequestId: requestId,
          createRequestHash: hashing.blueprintDraftContentHash(sourceContent),
          content: sourceContent,
          creatorName: 'Fixture creator',
          draftVersion: 1,
          publishedRevision: 1,
          publishedDraftVersion: 1,
          listedRevision: listed ? 1 : null,
        })
        await db.insert(blueprintRevision).values({
          templateId: id,
          draftVersion: 1,
          catalogKey,
          revision: 1,
          contentHash,
          document: definition,
          description: '',
        })
        return id
      }
      const unlistedKey = `attribution_unlisted_${suffix}`
      const selfAuthoredKey = `attribution_self_${suffix}`
      const capabilitySourceKey = `attribution_native_capability_${suffix}`
      const capabilityInstallSourceKey = `attribution_native_install_${suffix}`
      const unlistAfterCopySourceKey = `attribution_native_unlist_${suffix}`
      const atomicFailureSourceKey = `attribution_native_atomic_failure_${suffix}`
      const authoredSourceHash = (catalogKey: string) =>
        hashing.blueprintHash(
          installContracts.BlueprintCatalogDefinitionSchema.parse(
            authoringContracts.draftDefinition(content, catalogKey, 1)
          )
        )
      expectedQualifiedSourceKeys.add(capabilitySourceKey)
      expectedQualifiedSourceKeys.add(capabilityInstallSourceKey)
      expectedQualifiedSourceKeys.add(unlistAfterCopySourceKey)
      expectedQualifiedSourceKeys.add(atomicFailureSourceKey)
      await addAuthoredSource(unlistedKey, otherActorId, false)
      await addAuthoredSource(selfAuthoredKey, actorId, true)
      await addAuthoredSource(capabilitySourceKey, otherActorId, true, capabilityContent)
      await addAuthoredSource(
        capabilityInstallSourceKey,
        otherActorId,
        true,
        installableCapabilityContent
      )
      const unlistAfterCopyTemplateId = await addAuthoredSource(
        unlistAfterCopySourceKey,
        otherActorId,
        true
      )
      await addAuthoredSource(atomicFailureSourceKey, otherActorId, true)
      const capabilityDefinition = installContracts.BlueprintCatalogDefinitionSchema.parse(
        authoringContracts.draftDefinition(capabilityContent, capabilitySourceKey, 1)
      )
      const capabilityHash = hashing.blueprintHash(capabilityDefinition)
      const capabilityInstallDefinition = installContracts.BlueprintCatalogDefinitionSchema.parse(
        authoringContracts.draftDefinition(
          installableCapabilityContent,
          capabilityInstallSourceKey,
          1
        )
      )
      const capabilityInstallHash = hashing.blueprintHash(capabilityInstallDefinition)
      await db.insert(blueprintMeasurementSetting).values({ actorUserId: actorId, enabled: true })

      const addExposure = async (options: {
        actor?: string
        catalogKey?: string
        revision?: number
        contentHash?: string
        expiresAt?: Date
        opened?: boolean
      }) => {
        const exposureId = crypto.randomUUID()
        const issuedAt = new Date(now.getTime() - 60_000)
        const catalogKey = options.catalogKey ?? sourceKey
        const contentHash = options.contentHash ?? sourceHash
        await db.insert(blueprintDiscoveryExposure).values({
          exposureId,
          actorUserId: options.actor ?? actorId,
          catalogKey,
          sourceRevision: options.revision ?? 1,
          contentHash,
          surface: 'browse',
          rank: 1,
          issuedAt,
          expiresAt: options.expiresAt ?? new Date(now.getTime() + 60_000),
        })
        if (options.opened !== false)
          await db.insert(blueprintDiscoverySignal).values({
            actorUserId: options.actor ?? actorId,
            exposureId,
            catalogKey,
            signalDate: issuedAt.toISOString().slice(0, 10),
            // Attribution needs the recorded open, not a second daily ranking credit.
            rankEligible: false,
            requestId: crypto.randomUUID(),
            requestHash: 'a'.repeat(64),
            kind: 'open',
            acceptedAt: new Date(issuedAt.getTime() + 1_000),
          })
        return exposureId
      }
      const validExposure = await addExposure({})
      caseRows.push({ name: 'verified', exposureId: validExposure })
      caseRows.push({ name: 'forged', exposureId: crypto.randomUUID() })
      caseRows.push({ name: 'other actor', exposureId: await addExposure({ actor: otherActorId }) })
      caseRows.push({
        name: 'unlisted source',
        exposureId: await addExposure({ catalogKey: unlistedKey }),
        sourceKey: unlistedKey,
      })
      caseRows.push({
        name: 'self authored source',
        exposureId: await addExposure({ catalogKey: selfAuthoredKey }),
        sourceKey: selfAuthoredKey,
      })
      caseRows.push({
        name: 'stale source hash',
        exposureId: await addExposure({ contentHash: 'b'.repeat(64) }),
      })
      caseRows.push({
        name: 'expired exposure',
        exposureId: await addExposure({ expiresAt: new Date(now.getTime() - 1) }),
      })
      caseRows.push({ name: 'not opened', exposureId: await addExposure({ opened: false }) })
      const curatedCases = nativeBridge.cases.filter((item) => item.label.startsWith('curated:'))
      expect(curatedCases).toHaveLength(17)
      for (const item of curatedCases) {
        const content = authoringContracts.BlueprintDraftContentSchema.parse(item.content)
        const catalogKey = `attribution_${item.source.catalogKey}_${suffix}`
        sourceCatalogKeys.add(catalogKey)
        expectedQualifiedSourceKeys.add(catalogKey)
        const definition = installContracts.BlueprintCatalogDefinitionSchema.parse(
          authoringContracts.draftDefinition(content, catalogKey, item.source.revision)
        )
        const contentHash = hashing.blueprintHash(definition)
        await db.insert(blueprintRevision).values({
          templateId: null,
          draftVersion: null,
          catalogKey,
          revision: item.source.revision,
          contentHash,
          document: definition,
          description: item.source.description ?? '',
        })
        caseRows.push({
          name: `native curated ${item.source.catalogKey}`,
          sourceKey: catalogKey,
          content,
          exposureId: await addExposure({
            catalogKey,
            contentHash,
            revision: item.source.revision,
          }),
        })
      }
      caseRows.push({
        name: 'edited copy',
        exposureId: await addExposure({}),
        content: { ...content, name: 'Edited plan' },
      })
      caseRows.push({
        name: 'source unlisted after copy',
        exposureId: await addExposure({
          catalogKey: unlistAfterCopySourceKey,
          contentHash: authoredSourceHash(unlistAfterCopySourceKey),
        }),
        sourceKey: unlistAfterCopySourceKey,
      })
      caseRows.push({
        name: 'atomic completion failure',
        exposureId: await addExposure({
          catalogKey: atomicFailureSourceKey,
          contentHash: authoredSourceHash(atomicFailureSourceKey),
        }),
        sourceKey: atomicFailureSourceKey,
      })

      const makeCopy = async (item: (typeof caseRows)[number]) => {
        const copied = await run(
          Effect.gen(function* () {
            const repo = yield* BlueprintPersonalRepo
            return yield* repo.copy(actorId, {
              requestId: crypto.randomUUID(),
              content: item.content ?? content,
              source: {
                catalogKey: item.sourceKey ?? sourceKey,
                revision: 1,
                ...(item.exposureId ? { discoveryExposureId: item.exposureId } : {}),
              },
            })
          }),
          personalLayer
        )
        createdTemplateIds.add(copied.id)
        return copied
      }
      const caseCopies = new Map<string, Awaited<ReturnType<typeof makeCopy>>>()
      for (const item of caseRows) caseCopies.set(item.name, await makeCopy(item))
      const unlistAfterCopyCopy = caseCopies.get('source unlisted after copy')!
      const atomicFailureCopy = caseCopies.get('atomic completion failure')!
      await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.unlist(otherActorId, {
            id: unlistAfterCopyTemplateId,
            expectedVersion: 1,
            expectedListedRevision: 1,
          })
        }),
        personalLayer
      )
      const capabilityExposure = await addExposure({
        catalogKey: capabilitySourceKey,
        contentHash: capabilityHash,
      })
      const capabilityCopy = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.copy(actorId, {
            requestId: crypto.randomUUID(),
            content: capabilityContent,
            source: {
              catalogKey: capabilitySourceKey,
              revision: 1,
              discoveryExposureId: capabilityExposure,
            },
          })
        }),
        personalLayer
      )
      createdTemplateIds.add(capabilityCopy.id)
      const [persistedCapabilityCopy] = await db
        .select()
        .from(blueprintTemplate)
        .where((await import('drizzle-orm')).eq(blueprintTemplate.id, capabilityCopy.id))
      expect(persistedCapabilityCopy?.content).toEqual(capabilityContent)
      const capabilityInstallExposure = await addExposure({
        catalogKey: capabilityInstallSourceKey,
        contentHash: capabilityInstallHash,
      })
      const capabilityInstallCopy = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.copy(actorId, {
            requestId: crypto.randomUUID(),
            content: installableCapabilityContent,
            source: {
              catalogKey: capabilityInstallSourceKey,
              revision: 1,
              discoveryExposureId: capabilityInstallExposure,
            },
          })
        }),
        personalLayer
      )
      createdTemplateIds.add(capabilityInstallCopy.id)
      const [persistedInstallCopy] = await db
        .select()
        .from(blueprintTemplate)
        .where((await import('drizzle-orm')).eq(blueprintTemplate.id, capabilityInstallCopy.id))
      expect(persistedInstallCopy?.content).toEqual(installableCapabilityContent)
      const acquisitions = await db
        .select()
        .from(blueprintAttributionAcquisition)
        .where(
          (await import('drizzle-orm')).eq(blueprintAttributionAcquisition.actorUserId, actorId)
        )
      expect(new Set(acquisitions.map((row) => row.sourceCatalogKey))).toEqual(
        expectedQualifiedSourceKeys
      )
      expect(acquisitions).toHaveLength(22)
      expect(acquisitions).toContainEqual(
        expect.objectContaining({
          actorUserId: actorId,
          exposureId: validExposure,
          sourceCatalogKey: sourceKey,
          sourceRevision: 1,
          sourceContentHash: sourceHash,
        })
      )
      expect(acquisitions).toContainEqual(
        expect.objectContaining({
          actorUserId: actorId,
          exposureId: capabilityInstallExposure,
          sourceCatalogKey: capabilityInstallSourceKey,
          sourceRevision: 1,
          sourceContentHash: capabilityInstallHash,
        })
      )
      expect(acquisitions).toContainEqual(
        expect.objectContaining({
          actorUserId: actorId,
          exposureId: capabilityExposure,
          sourceCatalogKey: capabilitySourceKey,
          sourceRevision: 1,
          sourceContentHash: capabilityHash,
        })
      )
      const [verifiedExposure] = await db
        .select()
        .from(blueprintDiscoveryExposure)
        .where(eq(blueprintDiscoveryExposure.exposureId, validExposure))
      const verifiedAcquisition = acquisitions.find((row) => row.exposureId === validExposure)
      expect(verifiedAcquisition!.expiresAt.getTime()).toBe(
        verifiedExposure!.issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000
      )
      await db
        .update(blueprintMeasurementSetting)
        .set({ enabled: false })
        .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
      const optOutExposure = await addExposure({})
      const optedOutCopy = await makeCopy({ name: 'opted out', exposureId: optOutExposure })
      await db
        .update(blueprintMeasurementSetting)
        .set({ enabled: true })
        .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
      expect(
        await db
          .select()
          .from(blueprintAttributionAcquisition)
          .where(eq(blueprintAttributionAcquisition.actorUserId, actorId))
      ).toHaveLength(22)

      const duplicateRequestId = crypto.randomUUID()
      const duplicateInput = {
        requestId: duplicateRequestId,
        content,
        source: { catalogKey: sourceKey, revision: 1, discoveryExposureId: validExposure },
      }
      const first = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.copy(actorId, duplicateInput)
        }),
        personalLayer
      )
      createdTemplateIds.add(first.id)
      const expiredAcquisitionCopy = await makeCopy({
        name: 'expired acquisition',
        exposureId: await addExposure({}),
      })
      const [expiredAcquisition] = await db
        .select()
        .from(blueprintAttributionAcquisition)
        .where(eq(blueprintAttributionAcquisition.copyTemplateId, expiredAcquisitionCopy.id))
      const expiredAt = new Date(Date.now() - 1)
      await db
        .update(blueprintAttributionAcquisition)
        .set({
          acquiredAt: new Date(expiredAt.getTime() - 24 * 60 * 60 * 1000),
          expiresAt: expiredAt,
        })
        .where(eq(blueprintAttributionAcquisition.id, expiredAcquisition!.id))
      const installEffect = (
        copied: Awaited<ReturnType<typeof makeCopy>>,
        requestId: string,
        options: {
          eventName?: string
          selectedChildren?: Array<{ key: string; startsAt: string }>
          selectedIdeaKeys?: string[]
        } = {}
      ) =>
        installWorkflow.installBlueprintWorkflow(
          { id: actorId, name: 'Attribution fixture', email: `${actorId}@example.test` },
          {
            requestId,
            catalogKey: copied.catalogEntry.catalogKey,
            revision: copied.catalogEntry.revision,
            contentHash: copied.catalogEntry.contentHash,
            mainEvent: {
              name: options.eventName ?? 'Attribution fixture event',
              startsAt: '2030-08-17T15:00:00.000Z',
              timeZone: 'America/Detroit',
            },
            selectedChildren: options.selectedChildren ?? [],
            selectedIdeaKeys: options.selectedIdeaKeys ?? [],
            capabilities: [
              'event.children_v1',
              'planning.ideas_v2',
              'planning.instructions_v1',
              'planning.portable_idea_config_v1',
              'planning.todos_v1',
            ],
          }
        )
      const installCopy = (
        copied: Awaited<ReturnType<typeof makeCopy>>,
        requestId: string,
        options?: Parameters<typeof installEffect>[2]
      ) => run(installEffect(copied, requestId, options), installLayer)
      const editedAfterCopy = await makeCopy({
        name: 'edited after acquisition',
        exposureId: await addExposure({}),
      })
      await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.save(actorId, {
            id: editedAfterCopy.id,
            expectedVersion: editedAfterCopy.draftVersion,
            content: { ...content, name: 'Edited after acquisition' },
          })
        }),
        personalLayer
      )
      await installCopy(editedAfterCopy, crypto.randomUUID())
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(0)
      const replay = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.copy(actorId, duplicateInput)
        }),
        personalLayer
      )
      expect(replay.id).toBe(first.id)
      expect(
        await db
          .select()
          .from(blueprintAttributionAcquisition)
          .where(eq(blueprintAttributionAcquisition.actorUserId, actorId))
      ).toHaveLength(25)
      expect(
        await db
          .select()
          .from(blueprintAttributionAcquisition)
          .where(
            (await import('drizzle-orm')).eq(
              blueprintAttributionAcquisition.copyTemplateId,
              first.id
            )
          )
      ).toHaveLength(1)

      const installRequestId = crypto.randomUUID()
      const installed = await installCopy(first, installRequestId)
      expect(installed.installationID).toBeTruthy()
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(1)

      const capabilityInstallRequestId = crypto.randomUUID()
      const capabilityInstallResult = await installCopy(
        capabilityInstallCopy,
        capabilityInstallRequestId,
        {
          eventName: 'Native multi-event capability install',
          selectedChildren: installableCapabilityContent.children.map((child, index) => ({
            key: child.key,
            startsAt: new Date(
              Date.parse('2030-08-17T16:00:00.000Z') + index * 3_600_000
            ).toISOString(),
          })),
          selectedIdeaKeys: installableCapabilityContent.ideas.map((item) => item.key),
        }
      )
      expect(capabilityInstallResult.installationID).toBeTruthy()
      expect(
        await installCopy(capabilityInstallCopy, capabilityInstallRequestId, {
          eventName: 'Native multi-event capability install',
          selectedChildren: installableCapabilityContent.children.map((child, index) => ({
            key: child.key,
            startsAt: new Date(
              Date.parse('2030-08-17T16:00:00.000Z') + index * 3_600_000
            ).toISOString(),
          })),
          selectedIdeaKeys: installableCapabilityContent.ideas.map((item) => item.key),
        })
      ).toEqual(capabilityInstallResult)
      expect(capabilityInstallCopy.catalogEntry.definition).toEqual(
        authoringContracts.draftDefinition(
          installableCapabilityContent,
          capabilityInstallCopy.catalogEntry.catalogKey,
          capabilityInstallCopy.catalogEntry.revision
        )
      )
      const [installationReceipt] = await db
        .select()
        .from(blueprintInstallation)
        .where(eq(blueprintInstallation.id, capabilityInstallResult.installationID))
      expect(installationReceipt?.sourceSnapshot).toEqual(
        capabilityInstallCopy.catalogEntry.definition
      )
      const installedChildren = await db
        .select()
        .from(event)
        .where(eq(event.organizationId, capabilityInstallResult.organizationID))
      expect(
        installedChildren.find((item) => item.id === capabilityInstallResult.scopeID)
      ).toMatchObject({
        title: 'Native multi-event capability install',
        startsAt: new Date('2030-08-17T15:00:00.000Z'),
        timeZone: 'America/Detroit',
      })
      expect(installedChildren.filter((item) => item.parentEventId !== null)).toHaveLength(
        installableCapabilityContent.children.length
      )
      const childrenByTitle = new Map(
        installedChildren
          .filter((item) => item.parentEventId !== null)
          .map((item) => [item.title, item])
      )
      for (const child of installableCapabilityContent.children) {
        expect(childrenByTitle.get(child.title)).toMatchObject({
          category: child.category,
          purpose: child.purpose,
          parentEventId: capabilityInstallResult.scopeID,
          startsAt: new Date(
            Date.parse('2030-08-17T16:00:00.000Z') +
              installableCapabilityContent.children.findIndex(
                (candidate) => candidate.key === child.key
              ) *
                3_600_000
          ),
        })
      }
      expect(
        await db
          .select()
          .from(idea)
          .where(eq(idea.organizationId, capabilityInstallResult.organizationID))
      ).toHaveLength(installableCapabilityContent.ideas.length)
      const installedIdeas = await db
        .select()
        .from(idea)
        .where(eq(idea.organizationId, capabilityInstallResult.organizationID))
      const nativeConfigurationByCategory: Record<string, unknown> = {
        venue: { venue: { _0: { setting: 'indoor', capacity: null, area: '' } } },
        attire: { attire: { _0: { style: 'any', restrictions: '' } } },
        food: { food: { _0: { type: 'meal', servings: null, dietaryNotes: '' } } },
        flowers: { flowers: { _0: { focus: 'bouquet', palette: '' } } },
        photography: {
          photography: {
            _0: { style: 'documentary', coverageHours: null, priorities: '' },
          },
        },
      }
      for (const sourceIdea of installableCapabilityContent.ideas) {
        expect(
          installedIdeas.find(
            (item) => item.id === capabilityInstallResult.manifest.ideas[sourceIdea.key]
          )
        ).toMatchObject({
          title: sourceIdea.title,
          note: sourceIdea.notes,
          category: sourceIdea.category,
          configuration: {
            version: 1,
            native: nativeConfigurationByCategory[sourceIdea.category],
          },
        })
      }
      const installedTodos = await db
        .select()
        .from(eventTodo)
        .where(eq(eventTodo.organizationId, capabilityInstallResult.organizationID))
      expect(installedTodos).toHaveLength(installableCapabilityContent.todos.length)
      for (const todo of installableCapabilityContent.todos) {
        const eventId =
          todo.target.kind === 'main'
            ? capabilityInstallResult.scopeID
            : capabilityInstallResult.manifest.events[todo.target.key]
        expect(
          installedTodos.find(
            (item) => item.id === capabilityInstallResult.manifest.todos![todo.key]
          )
        ).toMatchObject({
          eventId,
          title: todo.title,
          websiteUrl: todo.websiteURL ?? null,
          dueDate: null,
          assigneePersonId: null,
          isCompleted: false,
        })
      }
      const installedGuides = await db
        .select()
        .from(eventGuideSection)
        .where(eq(eventGuideSection.organizationId, capabilityInstallResult.organizationID))
      expect(installedGuides).toHaveLength(installableCapabilityContent.instructions.length)
      for (const instruction of installableCapabilityContent.instructions) {
        const eventId =
          instruction.target.kind === 'main'
            ? capabilityInstallResult.scopeID
            : capabilityInstallResult.manifest.events[instruction.target.key]
        expect(installedGuides.find((item) => item.key === instruction.key)).toMatchObject({
          eventId,
          title: instruction.title,
          body: instruction.body,
          visibility: instruction.audience,
        })
      }
      const [experienceConfiguration] = await db
        .select()
        .from(eventExperienceConfiguration)
        .where(eq(eventExperienceConfiguration.eventId, capabilityInstallResult.scopeID))
      expect(experienceConfiguration).toMatchObject({
        experienceType: installableCapabilityContent.experienceType,
        categoryOrder: installableCapabilityContent.ideas.map(({ category }) => category),
      })
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(2)
      expect(
        (await installCopy(expiredAcquisitionCopy, crypto.randomUUID())).installationID
      ).toBeTruthy()
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(2)
      expect(
        (await installCopy(unlistAfterCopyCopy, crypto.randomUUID())).installationID
      ).toBeTruthy()
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(2)
      expect(await installCopy(first, installRequestId)).toEqual(installed)
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(2)

      const failedRequestId = crypto.randomUUID()
      const triggerName = `blueprint_attribution_fail_${suffix}`
      const functionName = `blueprint_attribution_fail_fn_${suffix}`
      completionFailureTrigger = { triggerName, functionName }
      await db.execute(
        sql.raw(`
          CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            IF NEW.request_id = '${failedRequestId}'::uuid AND NEW.state = 'completed' THEN
              RAISE EXCEPTION 'forced attribution completion failure';
            END IF;
            RETURN NEW;
          END;
          $$
        `)
      )
      await db.execute(
        sql.raw(
          `CREATE TRIGGER ${triggerName} BEFORE UPDATE OF state ON blueprint_installation ` +
            `FOR EACH ROW EXECUTE FUNCTION ${functionName}()`
        )
      )
      const failedInstall = await Effect.runPromiseExit(
        installEffect(atomicFailureCopy, failedRequestId).pipe(Effect.provide(installLayer))
      )
      await db.execute(sql.raw(`DROP TRIGGER ${triggerName} ON blueprint_installation`))
      await db.execute(sql.raw(`DROP FUNCTION ${functionName}()`))
      completionFailureTrigger = undefined
      expect(failedInstall._tag).toBe('Failure')
      const [failedReceipt] = await db
        .select()
        .from(blueprintInstallation)
        .where(eq(blueprintInstallation.requestId, failedRequestId))
      expect(failedReceipt?.state).toBe('failed')
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.sourceCatalogKey, atomicFailureSourceKey))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(2)

      expect((await installCopy(optedOutCopy, crypto.randomUUID())).installationID).toBeTruthy()
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(2)

      await Effect.runPromise(
        discoveryActionsWorkflow
          .updateBlueprintMeasurementSettings(actorId, {
            requestId: crypto.randomUUID(),
            enabled: false,
          })
          .pipe(Effect.provide(PgClientLive))
      )
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(eq(blueprintDiscoveryExposure.actorUserId, actorId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintAttributionAcquisition)
          .where(eq(blueprintAttributionAcquisition.actorUserId, actorId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintQualifiedAdoption)
          .where(eq(blueprintQualifiedAdoption.actorUserId, actorId))
      ).toHaveLength(0)
    } finally {
      if (completionFailureTrigger) {
        await db.execute(
          sql.raw(
            `DROP TRIGGER IF EXISTS ${completionFailureTrigger.triggerName} ON blueprint_installation`
          )
        )
        await db.execute(
          sql.raw(`DROP FUNCTION IF EXISTS ${completionFailureTrigger.functionName}()`)
        )
      }
      const { inArray } = await import('drizzle-orm')
      if (createdTemplateIds.size)
        await db
          .delete(blueprintTemplate)
          .where(inArray(blueprintTemplate.id, [...createdTemplateIds]))
      await db
        .delete(organization)
        .where(
          inArray(organization.id, [
            organizationId,
            otherOrganizationId,
            ...externalOrganizationIds,
          ])
        )
      await db
        .delete(blueprintRevision)
        .where(inArray(blueprintRevision.catalogKey, [...sourceCatalogKeys]))
      await db
        .delete(user)
        .where((await import('drizzle-orm')).inArray(user.id, [actorId, otherActorId]))
      vi.doUnmock('@/server/blueprint-media/blueprint-cover.storage.live')
    }
  }
)
