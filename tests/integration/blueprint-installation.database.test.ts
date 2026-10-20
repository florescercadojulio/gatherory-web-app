import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Layer } from 'effect'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

async function verifyBlueprintInstallationDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  expect(
    databaseUrl,
    'DATABASE_URL is required for the opt-in database integration test'
  ).toBeTruthy()
  const databaseHost = new URL(databaseUrl!).hostname
  expect(
    ['localhost', '127.0.0.1', '[::1]'].includes(databaseHost),
    `Refusing to run blueprint integration fixtures against non-local host ${databaseHost}`
  ).toBe(true)

  const [
    database,
    authContracts,
    blueprintContracts,
    runtimeContracts,
    installWorkflow,
    blueprintRepoModule,
    catalog,
    hashing,
    sync,
  ] = await Promise.all([
    import('@/db'),
    import('@/server/workspaces/connectors/better-auth.con'),
    import('@/contracts/blueprint-install.contracts'),
    import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
    import('@/server/blueprints/workflows/install-blueprint.workflow'),
    import('@/server/blueprints/repos/blueprint.repo.live'),
    import('@/server/blueprints/catalog/wedding.v1'),
    import('@/server/blueprints/planning/blueprint-hash'),
    import('@/server/sync/native-sync'),
  ])
  const { db, PgClientLive } = database
  const { user, organization, member, event, eventParticipant, workspacePerson, idea, eventTodo } =
    await import('@/db/schema')
  const {
    blueprintInstallation,
    blueprintRevision,
    eventExperienceConfiguration,
    eventGuideSection,
  } = await import('@/db/schema/blueprint.schema')
  const {
    nativeWorkspaceSnapshot,
    nativeSyncScopeMember,
    nativeSyncMutationReceipt,
    nativeSyncEntity,
    nativeSyncChange,
  } = await import('@/db/schema/sync.schema')
  const { eq, and, isNull, like } = await import('drizzle-orm')
  const suffix = crypto.randomUUID().replaceAll('-', '')
  const fixtureUserPrefix = `blueprint-proof-${suffix}`
  const actor = {
    id: `${fixtureUserPrefix}-owner`,
    name: 'Blueprint DB fixture owner',
    email: `${fixtureUserPrefix}-owner@example.test`,
  }
  const otherActor = {
    id: `${fixtureUserPrefix}-other`,
    name: 'Blueprint DB fixture other',
    email: `${fixtureUserPrefix}-other@example.test`,
  }
  const guest = {
    id: `${fixtureUserPrefix}-guest`,
    name: 'Blueprint DB fixture guest',
    email: `${fixtureUserPrefix}-guest@example.test`,
  }
  const childPlanner = {
    id: `${fixtureUserPrefix}-child-planner`,
    name: 'Blueprint DB fixture child planner',
    email: `${fixtureUserPrefix}-child-planner@example.test`,
  }
  const externalOrganizationIds = new Set<string>()
  const revisionIds = new Set<string>()
  const checkpointState = { failures: 0 }
  let loseNextProviderResponse = false
  let afterProviderCommit: ((slug: string, organizationId: string) => Promise<void>) | undefined

  const checkpoint = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
    afterProjection: () =>
      Effect.suspend(() => {
        if (checkpointState.failures > 0) {
          checkpointState.failures -= 1
          return Effect.fail(
            new authContracts.BetterAuthWorkspaceError({
              category: 'system',
              code: 'BLUEPRINT_TEST_CHECKPOINT_FAILURE',
              userMessageKey: 'serverErrors.SYSTEM',
            })
          )
        }
        return Effect.void
      }),
  })
  const baseDependencies = Layer.mergeAll(PgClientLive, checkpoint)
  const repo = blueprintRepoModule.BlueprintRepoLive.pipe(Layer.provide(baseDependencies))
  const providerCalls = new Map<string, number>()
  const fakeAuth = Layer.succeed(authContracts.BetterAuthWorkspaceCon, {
    listOrganizations: () => Effect.succeed([]),
    createOrganization: (input) =>
      Effect.tryPromise({
        try: async () => {
          providerCalls.set(input.slug, (providerCalls.get(input.slug) ?? 0) + 1)
          const organizationId = `blueprint-org-${crypto.randomUUID()}`
          const timestamp = new Date()
          // The connector simulates Better Auth: it commits through the ordinary
          // Promise/Drizzle pool, independently of BlueprintRepoLive's transaction.
          await db.insert(organization).values({
            id: organizationId,
            name: input.name,
            slug: input.slug,
            createdAt: timestamp,
          })
          await db.insert(member).values({
            id: `blueprint-member-${crypto.randomUUID()}`,
            organizationId,
            userId: input.userId!,
            role: 'owner',
            createdAt: timestamp,
          })
          externalOrganizationIds.add(organizationId)
          await afterProviderCommit?.(input.slug, organizationId)
          if (loseNextProviderResponse) {
            loseNextProviderResponse = false
            throw new Error('Simulated lost Better Auth response after commit')
          }
          return {
            id: organizationId,
            name: input.name,
            slug: input.slug,
            workspaceType: 'event',
          }
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
    createTeam: () => Effect.succeed({ id: 'unused', name: 'unused' }),
    addTeamMember: () => Effect.void,
    setActiveTeam: () => Effect.void,
  })
  const workflowLayer = Layer.mergeAll(repo, fakeAuth)
  const install = (forActor: typeof actor, input: unknown) =>
    installWorkflow.installBlueprintWorkflow(forActor, input).pipe(Effect.provide(workflowLayer))
  const seedLayer = PgClientLive
  let customCatalogKey: string | undefined

  try {
    await db.insert(user).values(
      [actor, otherActor, guest, childPlanner].map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        emailVerified: true,
      }))
    )

    // The deployment seed remains immutable and repeatable under concurrent runs.
    const seed = await import('@/server/blueprints/repos/seed-blueprint-catalog')
    const runSeed = () =>
      Effect.runPromise(seed.seedBlueprintCatalog.pipe(Effect.provide(seedLayer)))
    await runSeed()
    expect(await runSeed()).toEqual({ inserted: 0 })
    expect(await Promise.all([runSeed(), runSeed(), runSeed()])).toEqual([
      { inserted: 0 },
      { inserted: 0 },
      { inserted: 0 },
    ])
    const seededRows = await db
      .select()
      .from(blueprintRevision)
      .where(and(eq(blueprintRevision.catalogKey, 'wedding'), eq(blueprintRevision.revision, 1)))
    expect(seededRows).toHaveLength(1)
    expect(seededRows[0]?.contentHash).toBe(catalog.weddingBlueprintV1.contentHash)

    const { blueprintStarters } = await import('@/server/blueprints/catalog/starters')
    for (const starter of blueprintStarters) {
      const rows = await db
        .select()
        .from(blueprintRevision)
        .where(
          and(
            eq(blueprintRevision.catalogKey, starter.catalogKey),
            eq(blueprintRevision.revision, starter.revision)
          )
        )
      expect(rows).toHaveLength(1)
      expect(rows[0]?.contentHash).toBe(starter.contentHash)
    }

    // A private test revision lets retirement checks run without mutating the
    // shared, deployment-managed wedding starter.
    customCatalogKey = `fixture_${suffix}`
    const customDefinition = blueprintContracts.BlueprintCatalogDefinitionSchema.parse({
      ...catalog.weddingBlueprintV1.definition,
      blueprint: {
        ...catalog.weddingBlueprintV1.definition.blueprint,
        id: customCatalogKey,
        name: 'Blueprint database fixture',
      },
      modules: [
        ...catalog.weddingBlueprintV1.definition.modules,
        {
          key: 'starter_todos',
          type: 'todos',
          version: 1,
          required: false,
          config: {
            todos: [
              {
                key: 'todo_pack',
                title: 'Pack your bags',
                websiteURL: 'https://example.test/packing',
                target: { kind: 'main' },
              },
              {
                key: 'todo_ceremony',
                title: 'Confirm ceremony setup',
                target: { kind: 'child', key: 'ceremony' },
              },
            ],
          },
        },
      ],
    })
    const customHash = hashing.blueprintHash(customDefinition)
    const [customRevision] = await db
      .insert(blueprintRevision)
      .values({
        catalogKey: customCatalogKey,
        revision: 1,
        contentHash: customHash,
        document: customDefinition,
      })
      .returning()
    revisionIds.add(customRevision!.id)

    const supportedCapabilities = [
      'event.children_v1',
      'planning.ideas_v2',
      'planning.instructions_v1',
      'planning.portable_idea_config_v1',
      'planning.todos_v1',
    ]
    const makeInput = (
      requestId = crypto.randomUUID(),
      overrides: Record<string, unknown> = {},
      capabilities = supportedCapabilities
    ) => ({
      requestId,
      catalogKey: customCatalogKey,
      revision: 1,
      contentHash: customHash,
      mainEvent: {
        name: 'Fixture celebration',
        startsAt: '2030-08-17T15:00:00.000Z',
        timeZone: 'America/Detroit',
      },
      selectedChildren: [
        { key: 'ceremony', startsAt: '2030-08-17T15:00:00.000Z' },
        { key: 'reception', startsAt: '2030-08-17T18:00:00.000Z' },
      ],
      selectedIdeaKeys: ['venue', 'attire'],
      capabilities,
      ...overrides,
    })
    const getReceipt = async (userId: string, requestId: string) => {
      const [receipt] = await db
        .select()
        .from(blueprintInstallation)
        .where(
          and(
            eq(blueprintInstallation.actorUserId, userId),
            eq(blueprintInstallation.requestId, requestId)
          )
        )
      return receipt
    }

    // Force a failure after canonical/native projection writes. PostgreSQL must
    // roll those writes and the completion receipt update back together.
    const retryRequestId = crypto.randomUUID()
    const retryInput = makeInput(retryRequestId)
    checkpointState.failures = 1
    const failedProjection = await Effect.runPromise(Effect.exit(install(actor, retryInput)))
    expect(Exit.isFailure(failedProjection)).toBe(true)
    const failedReceipt = await getReceipt(actor.id, retryRequestId)
    expect(failedReceipt).toMatchObject({
      state: 'failed',
      organizationId: expect.any(String),
      mainEventId: null,
      result: null,
    })
    const retainedOrgId = failedReceipt!.organizationId!
    expect(externalOrganizationIds.has(retainedOrgId)).toBe(true)
    expect(
      await db.select().from(event).where(eq(event.organizationId, retainedOrgId))
    ).toHaveLength(0)
    expect(await db.select().from(idea).where(eq(idea.organizationId, retainedOrgId))).toHaveLength(
      0
    )
    expect(
      await db.select().from(eventTodo).where(eq(eventTodo.organizationId, retainedOrgId))
    ).toEqual([])
    expect(
      await db
        .select()
        .from(eventExperienceConfiguration)
        .where(eq(eventExperienceConfiguration.organizationId, retainedOrgId))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(eventGuideSection)
        .where(eq(eventGuideSection.organizationId, retainedOrgId))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.organizationId, retainedOrgId))
    ).toHaveLength(0)
    expect(
      await db.select().from(nativeSyncEntity).where(eq(nativeSyncEntity.ownerUserId, actor.id))
    ).toHaveLength(0)
    expect(
      await db.select().from(nativeSyncChange).where(eq(nativeSyncChange.ownerUserId, actor.id))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(eq(nativeSyncEntity.ownerUserId, actor.id), eq(nativeSyncEntity.entityType, 'todo'))
        )
    ).toEqual([])

    const retry = await Effect.runPromise(Effect.exit(install(actor, retryInput)))
    expect(Exit.isSuccess(retry)).toBe(true)
    if (Exit.isFailure(retry)) throw new Error(Cause.pretty(retry.cause))
    const retryResult = retry.value
    expect(retryResult.organizationID).toBe(retainedOrgId)
    expect(providerCalls.get(failedReceipt!.provisioningSlug)).toBe(1)
    const completedReceipt = await getReceipt(actor.id, retryRequestId)
    expect(completedReceipt).toMatchObject({
      state: 'completed',
      mainEventId: retryResult.scopeID,
      result: retryResult,
    })
    expect(
      await db.select().from(event).where(eq(event.organizationId, retainedOrgId))
    ).toHaveLength(3)
    expect(await db.select().from(idea).where(eq(idea.organizationId, retainedOrgId))).toHaveLength(
      2
    )

    const installedTodoIDs = Object.values(retryResult.manifest.todos ?? {})
    expect(installedTodoIDs).toHaveLength(2)
    expect(new Set(installedTodoIDs).size).toBe(2)
    expect(installedTodoIDs).not.toContain('todo_pack')
    expect(installedTodoIDs).not.toContain('todo_ceremony')
    const installedTodos = await db
      .select()
      .from(eventTodo)
      .where(eq(eventTodo.organizationId, retainedOrgId))
    expect(installedTodos).toHaveLength(2)
    expect(
      installedTodos.map(
        ({ id, eventId, title, websiteUrl, dueDate, assigneePersonId, isCompleted }) => ({
          id,
          eventId,
          title,
          websiteUrl,
          dueDate,
          assigneePersonId,
          isCompleted,
        })
      )
    ).toEqual([
      {
        id: retryResult.manifest.todos!.todo_pack,
        eventId: retryResult.scopeID,
        title: 'Pack your bags',
        websiteUrl: 'https://example.test/packing',
        dueDate: null,
        assigneePersonId: null,
        isCompleted: false,
      },
      {
        id: retryResult.manifest.todos!.todo_ceremony,
        eventId: retryResult.manifest.events.ceremony,
        title: 'Confirm ceremony setup',
        websiteUrl: null,
        dueDate: null,
        assigneePersonId: null,
        isCompleted: false,
      },
    ])

    const ceremonyScopeID = retryResult.manifest.events.ceremony
    const [childPlannerPerson] = await db
      .insert(workspacePerson)
      .values({
        organizationId: retainedOrgId,
        userId: childPlanner.id,
        displayName: childPlanner.name,
        email: childPlanner.email,
      })
      .returning()
    await db.insert(eventParticipant).values({
      eventId: ceremonyScopeID,
      personId: childPlannerPerson!.id,
      role: 'collaborator',
      planningPermission: 'contribute',
      attendanceStatus: 'pending',
    })

    // Old clients are rejected before bootstrap backfill, pull cursor effects,
    // or push receipts can change.
    await db
      .delete(nativeSyncScopeMember)
      .where(
        and(
          eq(nativeSyncScopeMember.scopeId, retryResult.scopeID),
          eq(nativeSyncScopeMember.userId, actor.id)
        )
      )
    const expectCompatibilityRejection = async (
      operation: Promise<unknown>,
      expectedCode = 'blueprint_client_upgrade_required'
    ) => {
      try {
        await operation
      } catch (error) {
        expect(JSON.stringify(error)).toContain(expectedCode)
        return
      }
      throw new Error('Expected the legacy client to be rejected for this blueprint scope')
    }
    await expectCompatibilityRejection(
      sync.listNativeWorkspaceSnapshots({ userId: actor.id, supportsBlueprintGuides: false })
    )
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(
          and(
            eq(nativeSyncScopeMember.scopeId, retryResult.scopeID),
            eq(nativeSyncScopeMember.userId, actor.id)
          )
        )
    ).toHaveLength(0)
    await expectCompatibilityRejection(
      sync.listNativeWorkspaceSnapshots({
        userId: childPlanner.id,
        supportsBlueprintGuides: false,
        supportsTodos: true,
      })
    )
    await expectCompatibilityRejection(
      sync.pullNativeChanges({
        userId: childPlanner.id,
        scopeId: retryResult.manifest.events.ceremony,
        after: 0,
        supportsBlueprintGuides: false,
        supportsTodos: true,
      })
    )
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(eq(nativeSyncScopeMember.userId, childPlanner.id))
    ).toHaveLength(0)
    const changeCountBeforeLegacyPull = await db
      .select()
      .from(nativeSyncChange)
      .where(eq(nativeSyncChange.scopeId, retryResult.scopeID))
    await expectCompatibilityRejection(
      sync.pullNativeChanges({
        userId: actor.id,
        scopeId: retryResult.scopeID,
        after: 0,
        supportsBlueprintGuides: false,
        supportsTodos: true,
      })
    )
    const legacyPushId = crypto.randomUUID()
    await expectCompatibilityRejection(
      sync.applyNativeMutations({
        userId: actor.id,
        supportsBlueprintGuides: false,
        supportsTodos: true,
        mutations: [
          {
            id: legacyPushId,
            scopeID: retryResult.scopeID,
            payloadSchemaVersion: 1,
            entityType: 'idea',
            entityID: retryResult.manifest.ideas.venue,
            operation: 'update',
            payload: Buffer.from('{}').toString('base64'),
            createdAt: new Date().toISOString(),
            attemptCount: 0,
          },
        ],
      })
    )
    expect(
      await db
        .select()
        .from(nativeSyncMutationReceipt)
        .where(eq(nativeSyncMutationReceipt.mutationId, legacyPushId))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(nativeSyncChange)
        .where(eq(nativeSyncChange.scopeId, retryResult.scopeID))
    ).toHaveLength(changeCountBeforeLegacyPull.length)

    // The upgraded bootstrap backfills access only after the compatibility
    // check and reconstructs canonical guides from their relational rows.
    const snapshots = await sync.listNativeWorkspaceSnapshots({
      userId: actor.id,
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(
          and(
            eq(nativeSyncScopeMember.scopeId, retryResult.scopeID),
            eq(nativeSyncScopeMember.userId, actor.id)
          )
        )
    ).toHaveLength(1)
    const snapshot = snapshots.snapshots.find((item) => item.scopeID === retryResult.scopeID)
    expect(snapshot).toBeDefined()
    const archive = JSON.parse(Buffer.from(snapshot!.payload, 'base64').toString('utf8'))
    expect(archive.todos).toHaveLength(2)
    expect([...archive.todos].sort((left, right) => left.title.localeCompare(right.title))).toEqual(
      [
        {
          id: retryResult.manifest.todos!.todo_ceremony,
          eventID: retryResult.manifest.events.ceremony,
          title: 'Confirm ceremony setup',
          dueDate: null,
          websiteURL: null,
          assigneePersonID: null,
          isCompleted: false,
          createdAt: expect.any(Number),
        },
        {
          id: retryResult.manifest.todos!.todo_pack,
          eventID: retryResult.scopeID,
          title: 'Pack your bags',
          dueDate: null,
          websiteURL: 'https://example.test/packing',
          assigneePersonID: null,
          isCompleted: false,
          createdAt: expect.any(Number),
        },
      ]
    )
    const todoEntities = await db
      .select()
      .from(nativeSyncEntity)
      .where(
        and(
          eq(nativeSyncEntity.scopeId, retryResult.scopeID),
          eq(nativeSyncEntity.entityType, 'todo')
        )
      )
    expect(todoEntities).toHaveLength(2)
    expect(todoEntities.map((entity) => entity.serverVersion)).toEqual([1, 1])
    expect(
      todoEntities
        .map((entity) => JSON.parse(Buffer.from(entity.payload, 'base64').toString('utf8')))
        .sort((left, right) => left.title.localeCompare(right.title))
    ).toEqual([...archive.todos].sort((left, right) => left.title.localeCompare(right.title)))
    const todoCreates = await db
      .select()
      .from(nativeSyncChange)
      .where(
        and(
          eq(nativeSyncChange.scopeId, retryResult.scopeID),
          eq(nativeSyncChange.entityType, 'todo')
        )
      )
    expect(todoCreates).toHaveLength(2)
    expect(todoCreates.map(({ operation }) => operation)).toEqual(['create', 'create'])
    expect(JSON.stringify(archive.todos)).not.toMatch(/todo_pack|todo_ceremony|2027-06-/)
    const canonicalIdeas = await db
      .select()
      .from(idea)
      .where(eq(idea.organizationId, retainedOrgId))
    for (const item of canonicalIdeas) {
      const native = archive.ideas.find((value: { id: string }) => value.id === item.id)
      expect(native.invitationVisibility).toBe(
        item.guestVisibility === 'shown_to_guests' ? 'shownToGuests' : 'planningOnly'
      )
    }
    expect(canonicalIdeas.find((item) => item.category === 'attire')?.guestVisibility).toBe(
      'shown_to_guests'
    )

    // A second installation creates independent task identities and resets all
    // task state even though the source definitions are identical.
    const secondInstall = await Effect.runPromise(
      Effect.exit(install(actor, makeInput(crypto.randomUUID())))
    )
    expect(Exit.isSuccess(secondInstall)).toBe(true)
    if (Exit.isFailure(secondInstall)) throw new Error(Cause.pretty(secondInstall.cause))
    const secondTodoIDs = Object.values(secondInstall.value.manifest.todos ?? {})
    expect(secondTodoIDs).toHaveLength(2)
    expect(secondTodoIDs.every((id) => !installedTodoIDs.includes(id))).toBe(true)
    const secondTodos = await db
      .select()
      .from(eventTodo)
      .where(eq(eventTodo.organizationId, secondInstall.value.organizationID))
    expect(secondTodos).toHaveLength(2)
    expect(
      secondTodos.every(
        (todo) => todo.dueDate === null && todo.assigneePersonId === null && !todo.isCompleted
      )
    ).toBe(true)

    // A client that predates the optional module cannot accidentally install
    // its task data. The persisted plan records omission and creates no rows.
    const legacyRequestId = crypto.randomUUID()
    const legacyInstall = await Effect.runPromise(
      Effect.exit(
        install(
          actor,
          makeInput(
            legacyRequestId,
            {},
            supportedCapabilities.filter((capability) => capability !== 'planning.todos_v1')
          )
        )
      )
    )
    expect(Exit.isSuccess(legacyInstall)).toBe(true)
    if (Exit.isFailure(legacyInstall)) throw new Error(Cause.pretty(legacyInstall.cause))
    const [legacyReceipt] = await db
      .select()
      .from(blueprintInstallation)
      .where(eq(blueprintInstallation.requestId, legacyRequestId))
    const legacyPlan = blueprintContracts.BlueprintExpandedPlanSchema.parse(legacyReceipt?.plan)
    expect(legacyPlan.todos).toEqual([])
    expect(legacyPlan.omissions).toContainEqual({
      sourceKey: 'todo_pack',
      reason: 'unsupported_optional_capability',
    })
    expect(Object.keys(legacyInstall.value.manifest.todos ?? {})).toEqual([])
    expect(
      await db
        .select()
        .from(eventTodo)
        .where(eq(eventTodo.organizationId, legacyInstall.value.organizationID))
    ).toEqual([])
    const legacySnapshot = await sync.listNativeWorkspaceSnapshots({
      userId: actor.id,
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    const legacyRoot = legacySnapshot.snapshots.find(
      (item) => item.scopeID === legacyInstall.value.scopeID
    )
    expect(JSON.parse(Buffer.from(legacyRoot!.payload, 'base64').toString('utf8')).todos).toEqual(
      []
    )

    // Even a current client is rejected from todo-bearing sync scopes when it
    // omits the todo capability.
    await expectCompatibilityRejection(
      sync.listNativeWorkspaceSnapshots({ userId: actor.id, supportsBlueprintGuides: true }),
      'todos_client_upgrade_required'
    )
    const canonicalGuides = await db
      .select()
      .from(eventGuideSection)
      .where(eq(eventGuideSection.organizationId, retainedOrgId))
    expect(archive.guides).toHaveLength(canonicalGuides.length)
    expect(archive.guides.map((guide: { id: string }) => guide.id).sort()).toEqual(
      canonicalGuides.map((guide) => guide.id).sort()
    )
    const childPlannerBootstrap = await sync.listNativeWorkspaceSnapshots({
      userId: childPlanner.id,
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    const ceremonySnapshot = childPlannerBootstrap.snapshots.find(
      (item) => item.scopeID === ceremonyScopeID
    )
    expect(ceremonySnapshot).toBeDefined()
    expect(childPlannerBootstrap.snapshots).toHaveLength(1)
    expect(await db.select().from(member).where(eq(member.userId, childPlanner.id))).toHaveLength(0)
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(eq(nativeSyncScopeMember.userId, childPlanner.id))
    ).toHaveLength(0)
    const ceremonyArchive = JSON.parse(
      Buffer.from(ceremonySnapshot!.payload, 'base64').toString('utf8')
    )
    expect(ceremonyArchive.guides.map((guide: { eventID: string }) => guide.eventID)).toEqual([
      ceremonyScopeID,
    ])
    expect(ceremonyArchive.guides.map((guide: { key: string }) => guide.key)).toEqual([
      'ceremony_guidance',
    ])

    // Guests receive only participant-visible guide sections from the
    // invitation projection, without Better Auth or native scope membership.
    const [guestPerson] = await db
      .insert(workspacePerson)
      .values({
        organizationId: retainedOrgId,
        userId: guest.id,
        displayName: guest.name,
        email: guest.email,
      })
      .returning()
    await db.insert(eventParticipant).values(
      Object.values(retryResult.manifest.events).map((eventId) => ({
        eventId,
        personId: guestPerson!.id,
        role: 'guest' as const,
        planningPermission: 'view_only' as const,
        attendanceStatus: 'pending' as const,
      }))
    )
    const { listGuestEventInvitationProjections } =
      await import('@/server/events/repos/guest-invitation.repo.persistence')
    const guestInvitations = await Effect.runPromise(
      listGuestEventInvitationProjections(guest.id).pipe(Effect.provide(PgClientLive))
    )
    const guestRoot = guestInvitations.find((invitation) => invitation.id === retryResult.scopeID)
    const guestCeremony = guestInvitations.find((invitation) => invitation.id === ceremonyScopeID)
    expect(guestRoot?.guides).toEqual([])
    expect(guestCeremony?.guides.map((guide) => guide.key)).toEqual(['ceremony_guidance'])
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(eq(nativeSyncScopeMember.userId, guest.id))
    ).toHaveLength(0)

    const installedIdeaId = retryResult.manifest.ideas.venue
    expect(archive.ideas.some((item: { id: string }) => item.id === installedIdeaId)).toBe(true)
    const initialPull = await sync.pullNativeChanges({
      userId: actor.id,
      scopeId: retryResult.scopeID,
      after: 0,
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    expect(
      initialPull?.changes.some(
        (change) => change.entityType === 'idea' && change.entityID === installedIdeaId
      )
    ).toBe(true)
    const editMutationId = crypto.randomUUID()
    const nativeEdit = {
      id: editMutationId,
      scopeID: retryResult.scopeID,
      payloadSchemaVersion: 1 as const,
      entityType: 'idea' as const,
      entityID: installedIdeaId,
      operation: 'update' as const,
      payload: Buffer.from(
        JSON.stringify({
          id: installedIdeaId,
          eventID: retryResult.scopeID,
          category: 'venue',
          status: 'new',
          title: 'Edited through native sync',
          note: 'Same stable idea identity',
        })
      ).toString('base64'),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      baseVersion: 1,
    }
    const nativeEditResult = await sync.applyNativeMutations({
      userId: actor.id,
      mutations: [nativeEdit],
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    expect(nativeEditResult.results[0]?.disposition).toBe('applied')
    const [canonicalEditedIdea] = await db.select().from(idea).where(eq(idea.id, installedIdeaId))
    expect(canonicalEditedIdea?.title).toBe('Edited through native sync')

    // Workspace writes may update editable archive fields but cannot replace
    // canonical guide metadata or create duplicate native entities.
    const editedArchive = { ...archive, title: 'Native workspace title edit', guides: [] }
    const workspaceMutationId = crypto.randomUUID()
    const workspaceWrite = await sync.applyNativeMutations({
      userId: actor.id,
      supportsBlueprintGuides: true,
      supportsTodos: true,
      mutations: [
        {
          id: workspaceMutationId,
          scopeID: retryResult.scopeID,
          payloadSchemaVersion: 1,
          entityType: 'workspace',
          entityID: retryResult.scopeID,
          operation: 'update',
          payload: Buffer.from(JSON.stringify(editedArchive)).toString('base64'),
          createdAt: new Date().toISOString(),
          attemptCount: 0,
          baseVersion: 1,
        },
      ],
    })
    expect(workspaceWrite.results[0]?.disposition).toBe('applied')
    const [storedSnapshot] = await db
      .select()
      .from(nativeWorkspaceSnapshot)
      .where(eq(nativeWorkspaceSnapshot.scopeId, retryResult.scopeID))
    const storedArchive = JSON.parse(
      Buffer.from(storedSnapshot!.payload, 'base64').toString('utf8')
    )
    expect(storedArchive.guides).toHaveLength(canonicalGuides.length)
    expect(storedArchive.guides.map((guide: { id: string }) => guide.id).sort()).toEqual(
      canonicalGuides.map((guide) => guide.id).sort()
    )
    expect(
      storedArchive.guides.map(
        (guide: {
          id: string
          eventID: string
          key: string
          title: string
          body: string
          sortOrder: number
          visibility: string
        }) => ({
          id: guide.id,
          eventID: guide.eventID,
          key: guide.key,
          title: guide.title,
          body: guide.body,
          sortOrder: guide.sortOrder,
          visibility: guide.visibility,
        })
      )
    ).toEqual(
      canonicalGuides
        .map((guide) => ({
          id: guide.id,
          eventID: guide.eventId,
          key: guide.key,
          title: guide.title,
          body: guide.body,
          sortOrder: guide.sortOrder,
          visibility: guide.visibility,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    )
    expect(
      await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, retryResult.scopeID),
            eq(nativeSyncEntity.entityType, 'idea'),
            eq(nativeSyncEntity.entityId, installedIdeaId)
          )
        )
    ).toHaveLength(1)
    const afterEditPull = await sync.pullNativeChanges({
      userId: actor.id,
      scopeId: retryResult.scopeID,
      after: Number(initialPull?.nextCursor ?? 0),
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    expect(
      afterEditPull?.changes.filter(
        (change) => change.entityType === 'idea' && change.entityID === installedIdeaId
      )
    ).toHaveLength(1)
    expect(
      await db
        .select()
        .from(idea)
        .where(and(eq(idea.organizationId, retainedOrgId), eq(idea.id, installedIdeaId)))
    ).toHaveLength(1)

    // A completed installation is private to its actor, and replays are
    // re-authorized against current event participation.
    const otherStatus = await Effect.runPromise(
      Effect.exit(
        installWorkflow
          .blueprintStatusWorkflow(otherActor.id, retryRequestId)
          .pipe(Effect.provide(repo))
      )
    )
    expect(Exit.isFailure(otherStatus)).toBe(true)
    if (Exit.isFailure(otherStatus))
      expect(JSON.stringify(otherStatus.cause)).toContain('BLUEPRINT_INSTALLATION_NOT_FOUND')
    const changedPayload = await Effect.runPromise(
      Effect.exit(install(actor, makeInput(retryRequestId, { selectedIdeaKeys: ['venue'] })))
    )
    expect(Exit.isFailure(changedPayload)).toBe(true)
    if (Exit.isFailure(changedPayload))
      expect(JSON.stringify(changedPayload.cause)).toContain('BLUEPRINT_REQUEST_CONFLICT')
    await db.delete(eventParticipant).where(eq(eventParticipant.eventId, retryResult.scopeID))
    const revokedReplay = await Effect.runPromise(Effect.exit(install(actor, retryInput)))
    expect(Exit.isFailure(revokedReplay)).toBe(true)
    if (Exit.isFailure(revokedReplay))
      expect(JSON.stringify(revokedReplay.cause)).toContain('BLUEPRINT_INSTALLATION_FORBIDDEN')

    // Provider committed the organization and owner membership but lost its
    // response. The workflow finds that same slug and never provisions twice.
    const lostResponseRequestId = crypto.randomUUID()
    const lostResponseInput = makeInput(lostResponseRequestId)
    loseNextProviderResponse = true
    const lostResponse = await Effect.runPromise(Effect.exit(install(actor, lostResponseInput)))
    expect(Exit.isSuccess(lostResponse)).toBe(true)
    if (Exit.isFailure(lostResponse)) throw new Error(Cause.pretty(lostResponse.cause))
    const lostReceipt = await getReceipt(actor.id, lostResponseRequestId)
    expect(providerCalls.get(lostReceipt!.provisioningSlug)).toBe(1)
    expect(lostReceipt?.state).toBe('completed')
    const [recoveredOrganization] = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, lostReceipt!.provisioningSlug))
    expect(recoveredOrganization?.id).toBe(lostReceipt?.organizationId)

    // Scope compatibility is derived from durable canonical experience data,
    // not the installation audit receipt. Deleting just this receipt must not
    // make an old native client see a workspace it cannot decode.
    await db.delete(blueprintInstallation).where(eq(blueprintInstallation.id, lostReceipt!.id))
    expect(
      await db
        .select()
        .from(eventExperienceConfiguration)
        .where(eq(eventExperienceConfiguration.eventId, lostResponse.value.scopeID))
    ).toHaveLength(1)
    await expectCompatibilityRejection(
      sync.listNativeWorkspaceSnapshots({ userId: actor.id, supportsBlueprintGuides: false })
    )
    const afterReceiptDeletion = await sync.listNativeWorkspaceSnapshots({
      userId: actor.id,
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    const receiptlessSnapshot = afterReceiptDeletion.snapshots.find(
      (item) => item.scopeID === lostResponse.value.scopeID
    )
    expect(receiptlessSnapshot).toBeDefined()
    expect(
      JSON.parse(Buffer.from(receiptlessSnapshot!.payload, 'base64').toString('utf8')).guides
    ).not.toHaveLength(0)
    expect(await getReceipt(actor.id, lostResponseRequestId)).toBeUndefined()

    // Concurrent requests with one idempotency key can create only one root.
    const concurrentRequestId = crypto.randomUUID()
    const concurrentInput = makeInput(concurrentRequestId)
    const concurrentOutcomes = await Promise.all([
      Effect.runPromise(Effect.exit(install(actor, concurrentInput))),
      Effect.runPromise(Effect.exit(install(actor, concurrentInput))),
    ])
    // A slower second caller may observe completion and replay successfully.
    // Both schedules must still produce the same manifest and one provider call.
    const concurrentSuccesses = concurrentOutcomes.filter(Exit.isSuccess)
    expect(concurrentSuccesses.length).toBeGreaterThanOrEqual(1)
    for (const outcome of concurrentOutcomes) {
      if (Exit.isSuccess(outcome)) expect(outcome.value).toEqual(concurrentSuccesses[0]!.value)
      else expect(JSON.stringify(outcome.cause)).toContain('BLUEPRINT_INSTALLATION_IN_PROGRESS')
    }
    const concurrentReceipt = await getReceipt(actor.id, concurrentRequestId)
    expect(
      await db
        .select()
        .from(event)
        .where(
          and(
            eq(event.organizationId, concurrentReceipt!.organizationId!),
            isNull(event.parentEventId)
          )
        )
    ).toHaveLength(1)
    expect(providerCalls.get(concurrentReceipt!.provisioningSlug)).toBe(1)

    // Retiring a source after external provisioning but before commit blocks
    // canonical/native materialization while preserving the auth transaction.
    const retirementRequestId = crypto.randomUUID()
    const retirementInput = makeInput(retirementRequestId)
    afterProviderCommit = async () => {
      await db
        .update(blueprintRevision)
        .set({ retiredAt: new Date() })
        .where(eq(blueprintRevision.id, customRevision!.id))
    }
    const retirementOutcome = await Effect.runPromise(Effect.exit(install(actor, retirementInput)))
    afterProviderCommit = undefined
    expect(Exit.isFailure(retirementOutcome)).toBe(true)
    if (Exit.isFailure(retirementOutcome))
      expect(JSON.stringify(retirementOutcome.cause)).toContain('BLUEPRINT_NOT_FOUND')
    const retiredReceipt = await getReceipt(actor.id, retirementRequestId)
    expect(retiredReceipt).toMatchObject({ state: 'failed', mainEventId: null, result: null })
    expect(
      await db.select().from(event).where(eq(event.organizationId, retiredReceipt!.organizationId!))
    ).toHaveLength(0)

    // Run successful additional installs after the empty-account rollback proof.
    const { buildCuratedStarterFixtures } = await import('../helpers/blueprint-starter-fixtures')
    for (const sample of buildCuratedStarterFixtures().samples) {
      const input = { ...sample.input, requestId: crypto.randomUUID() }
      const result = await Effect.runPromise(install(actor, input))
      expect(await Effect.runPromise(install(actor, input))).toEqual(result)
      const installedEvents = await db
        .select()
        .from(event)
        .where(eq(event.organizationId, result.organizationID))
      expect(installedEvents).toHaveLength(1 + input.selectedChildren.length)
      expect(installedEvents.find((item) => item.id === result.scopeID)?.parentEventId).toBeNull()
      const [snapshot] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, result.scopeID))
      const archive = JSON.parse(Buffer.from(snapshot!.payload, 'base64').toString('utf8'))
      expect(archive.experienceConfiguration.experienceType).toBe(
        sample.preview.plan.experienceType
      )
      expect(archive.timeline).toHaveLength(input.selectedChildren.length)
      expect(
        archive.timeline.every(
          (item: { parentEventID: string }) => item.parentEventID === result.scopeID
        )
      ).toBe(true)
      for (const child of input.selectedChildren) {
        const stored = archive.timeline.find(
          (item: { id: string }) => item.id === result.manifest.events[child.key]
        )
        expect(stored.scheduledAt).toBe(Date.parse(child.startsAt) / 1000 - 978307200)
      }
      expect(archive.ideas).toHaveLength(sample.preview.plan.ideas.length)
      expect(archive.ideas.every((item: { status: string }) => item.status === 'new')).toBe(true)
      expect(archive.ideaResponses).toEqual([])
      expect(archive.members).toHaveLength(1)
      expect(archive.guides).toHaveLength(sample.preview.plan.instructions.length)
    }
  } finally {
    // Delete only rows created under this test's user ID prefix and tracked provider
    // organizations. The deployment catalog seed and all unrelated fixtures stay.
    const fixtureReceipts = await db
      .select({ organizationId: blueprintInstallation.organizationId })
      .from(blueprintInstallation)
      .where(like(blueprintInstallation.actorUserId, `${fixtureUserPrefix}%`))
    for (const receipt of fixtureReceipts)
      if (receipt.organizationId) externalOrganizationIds.add(receipt.organizationId)
    await db.delete(user).where(like(user.id, `${fixtureUserPrefix}%`))
    for (const organizationId of externalOrganizationIds) {
      await db.delete(organization).where(eq(organization.id, organizationId))
    }
    for (const revisionId of revisionIds)
      await db.delete(blueprintRevision).where(eq(blueprintRevision.id, revisionId))
  }
}

it.live(
  'blueprint installation persists atomically, recovers external provisioning, and remains native-sync compatible',
  () => Effect.promise(verifyBlueprintInstallationDatabase),
  { skip: !enabled, timeout: 60_000 }
)
