import { expect, test } from 'vitest'
import { Effect, Exit, Layer } from 'effect'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)('private blueprint authoring and independent durable installs', async () => {
  const databaseUrl = process.env.DATABASE_URL
  expect(
    databaseUrl,
    'DATABASE_URL is required for the opt-in authoring database test'
  ).toBeTruthy()
  const databaseHost = new URL(databaseUrl!).hostname
  expect(
    ['localhost', '127.0.0.1', '[::1]'],
    `Refusing non-local database host ${databaseHost}`
  ).toContain(databaseHost)

  const [
    database,
    schema,
    blueprintSchema,
    authContracts,
    authoringRepoModule,
    authoringWorkflow,
    runtimeContracts,
    blueprintRepoModule,
    installWorkflow,
    scheduleWorkflow,
    seedModule,
    cottageSeed,
    syncSchema,
  ] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
    import('@/db/schema/blueprint.schema'),
    import('@/server/workspaces/connectors/better-auth.con'),
    import('@/server/blueprints/repos/blueprint-authoring.repo.live'),
    import('@/server/blueprints/workflows/blueprint-authoring.workflow'),
    import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
    import('@/server/blueprints/repos/blueprint.repo.live'),
    import('@/server/blueprints/workflows/install-blueprint.workflow'),
    import('@/server/blueprints/workflows/schedule-blueprint.workflow'),
    import('@/server/blueprints/repos/seed-blueprint-catalog'),
    import('@/db/seeds/cottage-template'),
    import('@/db/schema/sync.schema'),
  ])
  const { db, PgClientLive } = database
  const { user, organization, member, session, workspacePerson, eventParticipant, event, idea } =
    schema
  const {
    blueprintRevision,
    blueprintInstallation,
    eventGuideSection,
    eventExperienceConfiguration,
  } = blueprintSchema
  const { nativeWorkspaceSnapshot, nativeSyncEntity } = syncSchema
  const { and, eq, inArray } = await import('drizzle-orm')
  const suffix = crypto.randomUUID().replaceAll('-', '')
  const actor = {
    id: `author-${suffix}`,
    name: 'Author fixture',
    email: `author-${suffix}@example.test`,
  }
  const guest = {
    id: `guest-${suffix}`,
    name: 'Guest fixture',
    email: `guest-${suffix}@example.test`,
  }
  const unrelated = {
    id: `other-${suffix}`,
    name: 'Unrelated fixture',
    email: `other-${suffix}@example.test`,
  }
  const sourceCoOwner = {
    id: `coowner-${suffix}`,
    name: 'Source workspace co-owner',
    email: `coowner-${suffix}@example.test`,
  }
  const ownerOrgId = `author-workspace-${suffix}`
  const activeOrgId = `active-workspace-${suffix}`
  const externalOrgIds = new Set<string>()
  const fixtureOrgIds = new Set([ownerOrgId, activeOrgId])
  const fixtureUserIds = [actor.id, guest.id, unrelated.id, sourceCoOwner.id]
  const checkpointState = { failNext: false }
  let afterProviderCommit: (() => Promise<void>) | undefined
  const checkpoint = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
    afterProjection: () =>
      Effect.suspend(() => {
        if (!checkpointState.failNext) return Effect.void
        checkpointState.failNext = false
        return Effect.fail(
          new authContracts.BetterAuthWorkspaceError({
            category: 'system',
            code: 'BLUEPRINT_AUTHORING_CHECKPOINT_FAILURE',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      }),
  })
  const base = Layer.mergeAll(PgClientLive, checkpoint)
  const authoringRepo = authoringRepoModule.BlueprintAuthoringRepoLive.pipe(
    Layer.provide(PgClientLive)
  )
  const blueprintRepo = blueprintRepoModule.BlueprintRepoLive.pipe(Layer.provide(base))
  const providerCalls = new Map<string, number>()
  const fakeAuth = Layer.succeed(authContracts.BetterAuthWorkspaceCon, {
    listOrganizations: () => Effect.succeed([]),
    createOrganization: (input) =>
      Effect.tryPromise({
        try: async () => {
          providerCalls.set(input.slug, (providerCalls.get(input.slug) ?? 0) + 1)
          const id = `installed-${crypto.randomUUID()}`
          const now = new Date()
          await db.insert(organization).values({
            id,
            name: input.name,
            slug: input.slug,
            createdAt: now,
            workspaceType: 'event',
          })
          await db.insert(member).values({
            id: `installed-member-${crypto.randomUUID()}`,
            organizationId: id,
            userId: input.userId!,
            role: 'owner',
            createdAt: now,
          })
          externalOrgIds.add(id)
          fixtureOrgIds.add(id)
          await afterProviderCommit?.()
          return { id, name: input.name, slug: input.slug, workspaceType: 'event' }
        },
        catch: (cause) =>
          new authContracts.BetterAuthWorkspaceError({
            category: 'external',
            code: 'TEST_AUTH_FAILURE',
            userMessageKey: 'serverErrors.SYSTEM',
            cause,
          }),
      }),
    setActiveOrganization: () =>
      Effect.die('authoring/install must never change the active organization'),
    listTeams: () => Effect.succeed([]),
    createTeam: () => Effect.die('unexpected team creation'),
    addTeamMember: () => Effect.die('unexpected team membership'),
    setActiveTeam: () => Effect.die('unexpected active team'),
  })
  const layer = Layer.mergeAll(authoringRepo, blueprintRepo, fakeAuth)
  type Dependencies = Layer.Success<typeof layer>
  const withAuthoring = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
    program.pipe(Effect.provide(layer))
  const runAuthoring = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
    Effect.runPromise(withAuthoring(program))
  const installAs = (forActor: typeof actor, input: unknown) =>
    installWorkflow.installBlueprintWorkflow(forActor, input).pipe(Effect.provide(layer))
  const install = (input: unknown) => installAs(actor, input)
  const content = structuredClone(cottageSeed.cottageDraftContent)
  let phase = 'fixture setup'

  try {
    await db
      .insert(user)
      .values(
        [actor, guest, unrelated, sourceCoOwner].map((item) => ({ ...item, emailVerified: true }))
      )
    const now = new Date()
    await db.insert(organization).values([
      {
        id: ownerOrgId,
        name: 'Fixture owner workspace',
        slug: `owner-${suffix}`,
        createdAt: now,
        workspaceType: 'event',
      },
      {
        id: activeOrgId,
        name: 'Active but not owner workspace',
        slug: `active-${suffix}`,
        createdAt: now,
        workspaceType: 'event',
      },
    ])
    await db.insert(member).values([
      {
        id: `owner-membership-${suffix}`,
        organizationId: ownerOrgId,
        userId: actor.id,
        role: 'owner',
        createdAt: now,
      },
      {
        id: `active-membership-${suffix}`,
        organizationId: activeOrgId,
        userId: actor.id,
        role: 'member',
        createdAt: now,
      },
      {
        id: `unrelated-membership-${suffix}`,
        organizationId: ownerOrgId,
        userId: unrelated.id,
        role: 'member',
        createdAt: now,
      },
      {
        id: `coowner-membership-${suffix}`,
        organizationId: ownerOrgId,
        userId: sourceCoOwner.id,
        role: 'owner',
        createdAt: now,
      },
    ])
    await db.insert(session).values({
      id: `session-${suffix}`,
      token: `token-${suffix}`,
      userId: actor.id,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: now,
      updatedAt: now,
      activeOrganizationId: activeOrgId,
    })
    await Effect.runPromise(seedModule.seedBlueprintCatalog.pipe(Effect.provide(PgClientLive)))

    phase = 'owner context and draft create/copy'
    const context = await runAuthoring(
      authoringWorkflow.getBlueprintAuthoringContextWorkflow(actor.id)
    )
    expect(context.workspaces).toEqual([
      { id: ownerOrgId, name: 'Fixture owner workspace', personal: false },
    ])
    const requestId = crypto.randomUUID()
    const createInput = {
      requestId,
      organizationId: ownerOrgId,
      content,
      source: { catalogKey: 'wedding', revision: 1 },
    }
    phase = 'create from curated source'
    const draft = await runAuthoring(
      authoringWorkflow.createBlueprintDraftWorkflow(actor.id, createInput)
    )
    phase = 'retry create idempotency'
    expect(
      await runAuthoring(authoringWorkflow.createBlueprintDraftWorkflow(actor.id, createInput))
    ).toEqual(draft)
    expect(draft).toMatchObject({
      organizationId: ownerOrgId,
      draftVersion: 1,
      source: createInput.source,
      content,
    })
    const activeSessions = await db
      .select()
      .from(session)
      .where(eq(session.id, `session-${suffix}`))
    expect(activeSessions[0]?.activeOrganizationId).toBe(activeOrgId)

    phase = 'load curated starter for copy'
    const copyContent = await runAuthoring(
      authoringWorkflow.getBlueprintStarterWorkflow(actor.id, createInput.source)
    )
    phase = 'create copied draft'
    const copy = await runAuthoring(
      authoringWorkflow.createBlueprintDraftWorkflow(actor.id, {
        requestId: crypto.randomUUID(),
        organizationId: ownerOrgId,
        content: copyContent,
        source: createInput.source,
      })
    )
    expect(copy.source).toEqual(createInput.source)

    const ownerDraftsFirstPage = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'private',
        status: 'draft',
        query: '',
        limit: 1,
        offset: 0,
      })
    )
    const ownerDraftsSecondPage = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'private',
        status: 'draft',
        query: '',
        limit: 1,
        offset: 1,
      })
    )
    expect(ownerDraftsFirstPage.data).toHaveLength(1)
    expect(ownerDraftsFirstPage.hasNextPage).toBe(true)
    expect(ownerDraftsSecondPage.data).toHaveLength(1)
    expect(ownerDraftsSecondPage.hasNextPage).toBe(false)
    const privateNoMatch = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'private',
        status: 'draft',
        query: 'no matching name',
        limit: 20,
        offset: 0,
      })
    )
    expect(privateNoMatch.data).toHaveLength(0)
    const guestPrivateList = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(guest.id, {
        source: 'private',
        status: 'all',
        query: '',
        limit: 20,
        offset: 0,
      })
    )
    expect(guestPrivateList.data).toHaveLength(0)
    const unrelatedPrivateList = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(unrelated.id, {
        source: 'private',
        status: 'all',
        query: '',
        limit: 20,
        offset: 0,
      })
    )
    expect(unrelatedPrivateList.data).toHaveLength(0)
    const curatedRows = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'curated',
        status: 'published',
        query: '',
        limit: 20,
        offset: 0,
      })
    )
    expect(curatedRows.data).toHaveLength(3)
    expect(curatedRows.data.every((row) => row.source === 'curated')).toBe(true)
    const curatedFirstPage = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'curated',
        status: 'published',
        query: '',
        limit: 1,
        offset: 0,
      })
    )
    const curatedLastPage = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'curated',
        status: 'published',
        query: '',
        limit: 1,
        offset: 2,
      })
    )
    expect(curatedFirstPage.data).toHaveLength(1)
    expect(curatedFirstPage.hasNextPage).toBe(true)
    expect(curatedLastPage.data).toHaveLength(1)
    expect(curatedLastPage.hasNextPage).toBe(false)
    const curatedMatch = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'curated',
        status: 'published',
        query: 'wedding',
        limit: 20,
        offset: 0,
      })
    )
    expect(curatedMatch.data).toHaveLength(1)
    expect(curatedMatch.data[0]?.catalogKey).toBe('wedding')

    const deletedDraft = await runAuthoring(
      authoringWorkflow.deleteBlueprintDraftWorkflow(actor.id, { id: copy.id })
    )
    expect(deletedDraft).toEqual({ deleted: true })
    const deletedDraftRead = await Effect.runPromise(
      Effect.exit(
        authoringWorkflow
          .getBlueprintDraftWorkflow(actor.id, { id: copy.id })
          .pipe(Effect.provide(layer))
      )
    )
    expect(Exit.isFailure(deletedDraftRead)).toBe(true)

    const denied = async (operation: Effect.Effect<unknown, unknown, Dependencies>) => {
      const result = await Effect.runPromise(Effect.exit(operation.pipe(Effect.provide(layer))))
      expect(Exit.isFailure(result)).toBe(true)
    }
    await denied(authoringWorkflow.getBlueprintDraftWorkflow(unrelated.id, { id: draft.id }))

    phase = 'optimistic save and immutable publication'
    const editedA = { ...content, name: 'Family Cottage Stay A' }
    const editedB = { ...content, name: 'Family Cottage Stay B' }
    const saves = await Promise.all([
      Effect.runPromise(
        Effect.exit(
          withAuthoring(
            authoringWorkflow.saveBlueprintDraftWorkflow(actor.id, {
              id: draft.id,
              expectedVersion: 1,
              content: editedA,
            })
          )
        )
      ),
      Effect.runPromise(
        Effect.exit(
          withAuthoring(
            authoringWorkflow.saveBlueprintDraftWorkflow(actor.id, {
              id: draft.id,
              expectedVersion: 1,
              content: editedB,
            })
          )
        )
      ),
    ])
    expect(saves.filter(Exit.isSuccess)).toHaveLength(1)
    expect(saves.filter(Exit.isFailure)).toHaveLength(1)
    const savedV2 = await runAuthoring(
      authoringWorkflow.getBlueprintDraftWorkflow(actor.id, { id: draft.id })
    )
    expect(savedV2.draftVersion).toBe(2)
    const v2content = savedV2.content

    const publishV1 = await Promise.all([
      runAuthoring(
        authoringWorkflow.publishBlueprintDraftWorkflow(actor.id, {
          id: draft.id,
          expectedVersion: 2,
        })
      ),
      runAuthoring(
        authoringWorkflow.publishBlueprintDraftWorkflow(actor.id, {
          id: draft.id,
          expectedVersion: 2,
        })
      ),
    ])
    expect(publishV1[0]).toEqual(publishV1[1])
    expect(publishV1[0].publishedRevision).toBe(1)
    expect(publishV1[0].publication).toMatchObject({
      revision: 1,
      draftVersion: 2,
      contentHash: expect.any(String),
    })
    const publishedDraftDelete = await Effect.runPromise(
      Effect.exit(
        withAuthoring(authoringWorkflow.deleteBlueprintDraftWorkflow(actor.id, { id: draft.id }))
      )
    )
    expect(Exit.isFailure(publishedDraftDelete)).toBe(true)
    const [privateV1] = await db
      .select()
      .from(blueprintRevision)
      .where(and(eq(blueprintRevision.templateId, draft.id), eq(blueprintRevision.revision, 1)))
    expect(privateV1?.document).toMatchObject({ blueprint: { revision: 1, name: v2content.name } })
    expect(privateV1?.draftVersion).toBe(2)

    const newContent = { ...v2content, name: 'Revised Family Cottage Stay' }
    await runAuthoring(
      authoringWorkflow.saveBlueprintDraftWorkflow(actor.id, {
        id: draft.id,
        expectedVersion: 2,
        content: newContent,
      })
    )
    const publishedV2 = await runAuthoring(
      authoringWorkflow.publishBlueprintDraftWorkflow(actor.id, {
        id: draft.id,
        expectedVersion: 3,
      })
    )
    expect(publishedV2.publishedRevision).toBe(2)
    expect(publishedV2.publication).toMatchObject({
      revision: 2,
      draftVersion: 3,
      contentHash: expect.any(String),
    })
    const [unchangedV1] = await db
      .select()
      .from(blueprintRevision)
      .where(eq(blueprintRevision.id, privateV1!.id))
    expect(unchangedV1).toEqual(privateV1)
    const [privateV2] = await db
      .select()
      .from(blueprintRevision)
      .where(and(eq(blueprintRevision.templateId, draft.id), eq(blueprintRevision.revision, 2)))
    expect(privateV2?.document).toMatchObject({ blueprint: { revision: 2, name: newContent.name } })
    expect(privateV2?.document).not.toEqual(privateV1?.document)
    expect(
      await runAuthoring(
        authoringWorkflow.publishBlueprintDraftWorkflow(actor.id, {
          id: draft.id,
          expectedVersion: 3,
        })
      )
    ).toEqual(publishedV2)
    const replayedV1AfterV2 = await runAuthoring(
      authoringWorkflow.publishBlueprintDraftWorkflow(actor.id, {
        id: draft.id,
        expectedVersion: 2,
      })
    )
    expect(replayedV1AfterV2.publishedRevision).toBe(2)
    expect(replayedV1AfterV2.publication).toMatchObject({
      revision: 1,
      draftVersion: 2,
      contentHash: privateV1!.contentHash,
    })

    phase = 'second source-workspace owner copies the private revision'
    const privateStarter = await runAuthoring(
      authoringWorkflow.getBlueprintStarterWorkflow(sourceCoOwner.id, {
        catalogKey: draft.catalogKey,
        revision: 1,
      })
    )
    const coOwnerCopy = await runAuthoring(
      authoringWorkflow.createBlueprintDraftWorkflow(sourceCoOwner.id, {
        requestId: crypto.randomUUID(),
        organizationId: ownerOrgId,
        content: privateStarter,
        source: { catalogKey: draft.catalogKey, revision: 1 },
      })
    )
    expect(coOwnerCopy.source).toEqual({ catalogKey: draft.catalogKey, revision: 1 })

    const privateCatalog = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* runtimeContracts.BlueprintRepo).catalog(actor.id)
      }).pipe(Effect.provide(layer))
    )
    expect(
      privateCatalog.some((item) => item.catalogKey === draft.catalogKey && item.revision === 1)
    ).toBe(true)
    expect(
      privateCatalog.some((item) => item.catalogKey === draft.catalogKey && item.revision === 2)
    ).toBe(true)
    const notVisible = await Effect.runPromise(
      Effect.exit(
        Effect.gen(function* () {
          return yield* (yield* runtimeContracts.BlueprintRepo).revision(
            draft.catalogKey,
            1,
            unrelated.id
          )
        }).pipe(Effect.provide(layer))
      )
    )
    expect(Exit.isFailure(notVisible)).toBe(true)

    phase = 'private preview, schedule, and cottage installs'
    const preview = await runAuthoring(
      authoringWorkflow.previewBlueprintDraftWorkflow(actor.id, {
        id: draft.id,
        expectedVersion: 3,
      })
    )
    expect(preview.previewOnly).toBe(true)
    expect(preview.plan.main.name).toBe(newContent.name)
    const published = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* runtimeContracts.BlueprintRepo).revision(
          draft.catalogKey,
          1,
          actor.id
        )
      }).pipe(Effect.provide(layer))
    )
    const installInput = (id: string) => ({
      requestId: id,
      catalogKey: draft.catalogKey,
      revision: 1,
      contentHash: published.contentHash,
      mainEvent: {
        name: 'Cottage copy',
        startsAt: '2027-07-08T16:00:00.000Z',
        timeZone: 'America/Detroit',
      },
      selectedChildren: content.children.map((child, index) => ({
        key: child.key,
        startsAt: `2027-07-${String(8 + index).padStart(2, '0')}T18:00:00.000Z`,
      })),
      selectedIdeaKeys: content.ideas.map((idea) => idea.key),
      capabilities: [
        'event.children_v1',
        'planning.ideas_v2',
        'planning.instructions_v1',
        'planning.portable_idea_config_v1',
      ],
    })
    const scheduled = await Effect.runPromise(
      scheduleWorkflow
        .scheduleBlueprintWorkflow(
          {
            catalogKey: draft.catalogKey,
            revision: 1,
            contentHash: published.contentHash,
            mainEvent: { startsAt: '2027-07-08T16:00:00.000Z', timeZone: 'America/Detroit' },
          },
          actor.id
        )
        .pipe(Effect.provide(layer))
    )
    expect(scheduled.suggestions.length).toBeGreaterThan(0)

    const install1Input = installInput(crypto.randomUUID())
    const first = await Effect.runPromise(install(install1Input))
    expect(await Effect.runPromise(install(install1Input))).toEqual(first)
    const second = await Effect.runPromise(install(installInput(crypto.randomUUID())))
    expect(first.organizationID).not.toBe(second.organizationID)
    expect(first.scopeID).not.toBe(second.scopeID)
    expect(Object.values(first.manifest.events)).not.toEqual(Object.values(second.manifest.events))
    expect(Object.values(first.manifest.ideas)).not.toEqual(Object.values(second.manifest.ideas))
    expect(Object.values(first.manifest.guides)).not.toEqual(Object.values(second.manifest.guides))
    for (const result of [first, second]) {
      const [snapshot] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, result.scopeID))
      expect(snapshot).toBeDefined()
      expect(
        await db.select().from(nativeSyncEntity).where(eq(nativeSyncEntity.scopeId, result.scopeID))
      ).not.toHaveLength(0)
    }

    const coOwnerInstall = await Effect.runPromise(
      installAs(sourceCoOwner, installInput(crypto.randomUUID()))
    )
    expect(coOwnerInstall.organizationID).not.toBe(first.organizationID)
    expect(
      await db
        .select()
        .from(member)
        .where(
          and(eq(member.organizationId, coOwnerInstall.organizationID), eq(member.userId, actor.id))
        )
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(member)
        .where(
          and(
            eq(member.organizationId, coOwnerInstall.organizationID),
            eq(member.userId, sourceCoOwner.id)
          )
        )
    ).toHaveLength(1)
    expect(
      await db
        .select()
        .from(workspacePerson)
        .where(
          and(
            eq(workspacePerson.organizationId, coOwnerInstall.organizationID),
            eq(workspacePerson.userId, actor.id)
          )
        )
    ).toHaveLength(0)
    expect(
      await db
        .select({ id: eventParticipant.id })
        .from(eventParticipant)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(
          and(
            eq(eventParticipant.eventId, coOwnerInstall.scopeID),
            eq(workspacePerson.userId, actor.id)
          )
        )
    ).toHaveLength(0)
    const { nativeSyncScopeMember } = syncSchema
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(
          and(
            eq(nativeSyncScopeMember.scopeId, coOwnerInstall.scopeID),
            eq(nativeSyncScopeMember.userId, actor.id)
          )
        )
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(nativeSyncScopeMember)
        .where(
          and(
            eq(nativeSyncScopeMember.scopeId, coOwnerInstall.scopeID),
            eq(nativeSyncScopeMember.userId, sourceCoOwner.id)
          )
        )
    ).toHaveLength(1)

    const sync = await import('@/server/sync/native-sync')
    const firstIdeaId = first.manifest.ideas.meals!
    const secondIdeaId = second.manifest.ideas.meals!
    const [secondIdeaBefore] = await db.select().from(idea).where(eq(idea.id, secondIdeaId))
    const [secondSnapshotBefore] = await db
      .select()
      .from(nativeWorkspaceSnapshot)
      .where(eq(nativeWorkspaceSnapshot.scopeId, second.scopeID))
    const editId = crypto.randomUUID()
    const edited = await sync.applyNativeMutations({
      userId: actor.id,
      supportsBlueprintGuides: true,
      mutations: [
        {
          id: editId,
          scopeID: first.scopeID,
          payloadSchemaVersion: 1,
          entityType: 'idea',
          entityID: firstIdeaId,
          operation: 'update',
          payload: Buffer.from(
            JSON.stringify({
              id: firstIdeaId,
              eventID: first.scopeID,
              category: 'food',
              status: 'new',
              title: 'Meals edited in copy one',
              note: 'Only this installation changes',
            })
          ).toString('base64'),
          createdAt: new Date().toISOString(),
          attemptCount: 0,
          baseVersion: 1,
        },
      ],
    })
    expect(edited.results[0]?.disposition).toBe('applied')
    const [firstIdeaAfter] = await db.select().from(idea).where(eq(idea.id, firstIdeaId))
    const [secondIdeaAfter] = await db.select().from(idea).where(eq(idea.id, secondIdeaId))
    const [secondSnapshotAfter] = await db
      .select()
      .from(nativeWorkspaceSnapshot)
      .where(eq(nativeWorkspaceSnapshot.scopeId, second.scopeID))
    expect(firstIdeaAfter?.title).toBe('Meals edited in copy one')
    expect(secondIdeaAfter).toEqual(secondIdeaBefore)
    expect(secondSnapshotAfter).toEqual(secondSnapshotBefore)

    const [guestPerson] = await db
      .insert(workspacePerson)
      .values({
        organizationId: first.organizationID,
        userId: guest.id,
        displayName: guest.name,
        email: guest.email,
      })
      .returning()
    await db.insert(eventParticipant).values({
      eventId: first.scopeID,
      personId: guestPerson!.id,
      role: 'guest',
      planningPermission: 'view_only',
      attendanceStatus: 'pending',
    })
    const guestDraftRead = await Effect.runPromise(
      Effect.exit(
        authoringWorkflow
          .getBlueprintDraftWorkflow(guest.id, { id: draft.id })
          .pipe(Effect.provide(layer))
      )
    )
    expect(Exit.isFailure(guestDraftRead)).toBe(true)

    phase = 'projection checkpoint rollback/retry'
    const failedInput = installInput(crypto.randomUUID())
    checkpointState.failNext = true
    const failedInstall = await Effect.runPromise(Effect.exit(install(failedInput)))
    expect(Exit.isFailure(failedInstall)).toBe(true)
    const [failedReceipt] = await db
      .select()
      .from(blueprintInstallation)
      .where(
        and(
          eq(blueprintInstallation.actorUserId, actor.id),
          eq(blueprintInstallation.requestId, failedInput.requestId)
        )
      )
    expect(failedReceipt).toMatchObject({
      state: 'failed',
      organizationId: expect.any(String),
      mainEventId: null,
      result: null,
    })
    expect(externalOrgIds.has(failedReceipt!.organizationId!)).toBe(true)
    expect(
      await db.select().from(event).where(eq(event.organizationId, failedReceipt!.organizationId!))
    ).toHaveLength(0)
    expect(
      await db.select().from(idea).where(eq(idea.organizationId, failedReceipt!.organizationId!))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(eventExperienceConfiguration)
        .where(eq(eventExperienceConfiguration.organizationId, failedReceipt!.organizationId!))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(eventGuideSection)
        .where(eq(eventGuideSection.organizationId, failedReceipt!.organizationId!))
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.organizationId, failedReceipt!.organizationId!))
    ).toHaveLength(0)
    const recovered = await Effect.runPromise(install(failedInput))
    expect(recovered.organizationID).toBe(failedReceipt!.organizationId)
    expect(providerCalls.get(failedReceipt!.provisioningSlug)).toBe(1)

    phase = 'source revocation during pending installation'
    const revokedDuringProvisionInput = installInput(crypto.randomUUID())
    const revokedDuringProvision = installAs(sourceCoOwner, revokedDuringProvisionInput)
    afterProviderCommit = async () => {
      await db
        .update(member)
        .set({ role: 'member' })
        .where(and(eq(member.organizationId, ownerOrgId), eq(member.userId, sourceCoOwner.id)))
    }
    const revokedAttempt = await Effect.runPromise(Effect.exit(revokedDuringProvision))
    afterProviderCommit = undefined
    expect(Exit.isFailure(revokedAttempt)).toBe(true)
    const [revokedReceipt] = await db
      .select()
      .from(blueprintInstallation)
      .where(
        and(
          eq(blueprintInstallation.actorUserId, sourceCoOwner.id),
          eq(blueprintInstallation.requestId, revokedDuringProvisionInput.requestId)
        )
      )
    expect(revokedReceipt).toMatchObject({
      state: 'failed',
      organizationId: expect.any(String),
      mainEventId: null,
      result: null,
    })
    const revokedRetry = await Effect.runPromise(
      Effect.exit(installAs(sourceCoOwner, revokedDuringProvisionInput))
    )
    expect(Exit.isFailure(revokedRetry)).toBe(true)
    expect(providerCalls.get(revokedReceipt!.provisioningSlug)).toBe(1)

    phase = 'retirement and completed-install replay after access loss'
    const installedOrgIds = [
      first.organizationID,
      second.organizationID,
      coOwnerInstall.organizationID,
      recovered.organizationID,
    ]
    const beforeRetirementEvents = await db
      .select()
      .from(event)
      .where(inArray(event.organizationId, installedOrgIds))
    const beforeRetirementGuides = await db
      .select()
      .from(eventGuideSection)
      .where(inArray(eventGuideSection.organizationId, installedOrgIds))
    const retired = await runAuthoring(
      authoringWorkflow.retireBlueprintTemplateWorkflow(actor.id, { id: draft.id })
    )
    expect(retired.retired).toBe(true)
    const retiredPrivateRows = await runAuthoring(
      authoringWorkflow.listBlueprintTemplatesWorkflow(actor.id, {
        source: 'private',
        status: 'retired',
        query: '',
        limit: 20,
        offset: 0,
      })
    )
    expect(retiredPrivateRows.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: draft.id, status: 'retired' })])
    )
    await db
      .delete(member)
      .where(and(eq(member.organizationId, ownerOrgId), eq(member.userId, actor.id)))
    const lostAuthorAccess = await Effect.runPromise(
      Effect.exit(
        authoringWorkflow
          .getBlueprintDraftWorkflow(actor.id, { id: draft.id })
          .pipe(Effect.provide(layer))
      )
    )
    expect(Exit.isFailure(lostAuthorAccess)).toBe(true)
    const hiddenPrivateRevision = await Effect.runPromise(
      Effect.exit(
        Effect.gen(function* () {
          return yield* (yield* runtimeContracts.BlueprintRepo).revision(
            draft.catalogKey,
            1,
            actor.id
          )
        }).pipe(Effect.provide(layer))
      )
    )
    expect(Exit.isFailure(hiddenPrivateRevision)).toBe(true)
    expect(await Effect.runPromise(install(install1Input))).toEqual(first)
    const futureInstall = await Effect.runPromise(
      Effect.exit(install(installInput(crypto.randomUUID())))
    )
    expect(Exit.isFailure(futureInstall)).toBe(true)
    expect(
      await db.select().from(event).where(inArray(event.organizationId, installedOrgIds))
    ).toEqual(beforeRetirementEvents)
    expect(
      await db
        .select()
        .from(eventGuideSection)
        .where(inArray(eventGuideSection.organizationId, installedOrgIds))
    ).toEqual(beforeRetirementGuides)
  } catch (error) {
    throw new Error(`Blueprint authoring integration failed during ${phase}`, { cause: error })
  } finally {
    if (fixtureOrgIds.size)
      await db.delete(organization).where(inArray(organization.id, [...fixtureOrgIds]))
    await db.delete(user).where(inArray(user.id, fixtureUserIds))
    await database.pool.end()
  }
})
