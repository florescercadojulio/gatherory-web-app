import { expect, test } from 'vitest'
import { Effect, Exit, Layer } from 'effect'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'event blueprint capture authorizes, scopes, and saves canonical source data',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in capture database test'
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
      eventSchema,
      syncSchema,
      authoringRepoModule,
      captureRepoModule,
      captureWorkflow,
      authoringWorkflow,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/event.schema'),
      import('@/db/schema/sync.schema'),
      import('@/server/blueprints/repos/blueprint-authoring.repo.live'),
      import('@/server/blueprints/repos/blueprint-capture.repo.live'),
      import('@/server/blueprints/workflows/blueprint-capture.workflow'),
      import('@/server/blueprints/workflows/blueprint-authoring.workflow'),
    ])
    const { db, PgClientLive } = database
    const {
      user,
      organization,
      member,
      workspacePerson,
      eventParticipant,
      event,
      idea,
      eventExpense,
    } = schema
    const { blueprintRevision, eventExperienceConfiguration, eventGuideSection } = blueprintSchema
    const { eventDeparture } = eventSchema
    const {
      nativeWorkspaceSnapshot,
      nativeSyncEntity,
      nativeSyncChange,
      nativeSyncMutationReceipt,
    } = syncSchema
    const { and, eq, inArray } = await import('drizzle-orm')

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ids = {
      owner: `capture-owner-${suffix}`,
      childManager: `capture-child-manager-${suffix}`,
      guest: `capture-guest-${suffix}`,
      contributor: `capture-contributor-${suffix}`,
      organization: `capture-workspace-${suffix}`,
      root: crypto.randomUUID(),
      child: crypto.randomUUID(),
      sibling: crypto.randomUUID(),
      rootPerson: crypto.randomUUID(),
      childPerson: crypto.randomUUID(),
      guestPerson: crypto.randomUUID(),
      contributorPerson: crypto.randomUUID(),
      rootIdea: crypto.randomUUID(),
      childIdea: crypto.randomUUID(),
      musicIdea: crypto.randomUUID(),
      siblingIdea: crypto.randomUUID(),
      childGuide: crypto.randomUUID(),
      siblingGuide: crypto.randomUUID(),
    }
    const users = [
      { id: ids.owner, name: 'Capture Owner', email: `${ids.owner}@example.test` },
      { id: ids.childManager, name: 'Child Manager', email: `${ids.childManager}@example.test` },
      { id: ids.guest, name: 'Capture Guest', email: `${ids.guest}@example.test` },
      {
        id: ids.contributor,
        name: 'Capture Contributor',
        email: `${ids.contributor}@example.test`,
      },
    ]
    const fixtureOrgIds = [ids.organization]
    const fixtureUserIds = users.map(({ id }) => id)
    const now = new Date()
    const ownerAuthoring = authoringRepoModule.BlueprintAuthoringRepoLive.pipe(
      Layer.provide(PgClientLive)
    )
    const captureRepo = captureRepoModule.BlueprintCaptureRepoLive.pipe(
      Layer.provide(Layer.mergeAll(ownerAuthoring, PgClientLive))
    )
    const layer = Layer.mergeAll(ownerAuthoring, captureRepo, PgClientLive)
    type Dependencies = Layer.Success<typeof layer>
    const run = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const denied = async (program: Effect.Effect<unknown, unknown, Dependencies>) => {
      const result = await Effect.runPromise(Effect.exit(program.pipe(Effect.provide(layer))))
      expect(Exit.isFailure(result)).toBe(true)
      return result
    }
    const requestId = () => crypto.randomUUID()
    const selection = {
      childIds: [ids.child],
      ideaIds: [ids.childIdea],
      instructionIds: [ids.childGuide],
      includeIdeaNotes: false,
    }
    let phase = 'fixture setup'

    try {
      await db.insert(user).values(users.map((item) => ({ ...item, emailVerified: true })))
      await db.insert(organization).values({
        id: ids.organization,
        name: 'Capture fixture workspace',
        slug: `capture-${suffix}`,
        createdAt: now,
        workspaceType: 'event',
      })
      await db.insert(member).values({
        id: `capture-owner-membership-${suffix}`,
        organizationId: ids.organization,
        userId: ids.owner,
        role: 'owner',
        createdAt: now,
      })
      await db.insert(workspacePerson).values([
        {
          id: ids.rootPerson,
          organizationId: ids.organization,
          userId: ids.owner,
          displayName: 'Owner Person',
        },
        {
          id: ids.childPerson,
          organizationId: ids.organization,
          userId: ids.childManager,
          displayName: 'Child Manager Person',
        },
        {
          id: ids.guestPerson,
          organizationId: ids.organization,
          userId: ids.guest,
          displayName: 'Guest Secret Name',
        },
        {
          id: ids.contributorPerson,
          organizationId: ids.organization,
          userId: ids.contributor,
          displayName: 'Contributor Person',
        },
      ])
      await db.insert(event).values([
        {
          id: ids.root,
          organizationId: ids.organization,
          title: 'Capture Main Event',
          status: 'draft',
          startsAt: new Date('2027-06-15T19:00:00.000Z'),
          timeZone: 'America/Detroit',
          createdByUserId: ids.owner,
        },
        {
          id: ids.child,
          organizationId: ids.organization,
          parentEventId: ids.root,
          title: 'Capture Child Event',
          purpose: 'part_of_event',
          category: 'ceremony',
          planningStatus: 'draft',
          startsAt: new Date('2027-06-16T14:00:00.000Z'),
          timeZone: 'America/Detroit',
          createdByUserId: ids.owner,
        },
        {
          id: ids.sibling,
          organizationId: ids.organization,
          parentEventId: ids.root,
          title: 'Unrelated Sibling Secret',
          purpose: 'part_of_event',
          category: 'reception',
          planningStatus: 'draft',
          startsAt: new Date('2027-06-16T22:00:00.000Z'),
          timeZone: 'America/Detroit',
          createdByUserId: ids.owner,
        },
      ])
      await db.insert(eventParticipant).values([
        { eventId: ids.root, personId: ids.rootPerson, role: 'host', planningPermission: 'manage' },
        {
          eventId: ids.child,
          personId: ids.rootPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.sibling,
          personId: ids.rootPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.child,
          personId: ids.childPerson,
          role: 'collaborator',
          planningPermission: 'manage',
        },
        {
          eventId: ids.root,
          personId: ids.guestPerson,
          role: 'guest',
          planningPermission: 'view_only',
        },
        {
          eventId: ids.root,
          personId: ids.contributorPerson,
          role: 'collaborator',
          planningPermission: 'contribute',
        },
      ])
      await db.insert(eventExperienceConfiguration).values({
        eventId: ids.child,
        organizationId: ids.organization,
        experienceType: 'holiday',
        categoryOrder: ['private-configuration-secret'],
      })
      await db.insert(idea).values([
        {
          id: ids.rootIdea,
          organizationId: ids.organization,
          eventId: ids.root,
          category: 'other',
          title: 'Root Only Idea',
          note: 'Root private note',
          estimatedCost: '900.00',
          configuration: { version: 1, password: 'idea-config-secret' },
        },
        {
          id: ids.childIdea,
          organizationId: ids.organization,
          eventId: ids.child,
          category: 'flowers',
          title: 'Child Flowers',
          note: 'Child idea note',
          estimatedCost: '125.00',
          configuration: { version: 1, supplierSecret: 'idea-config-secret' },
        },
        {
          id: ids.musicIdea,
          organizationId: ids.organization,
          eventId: ids.child,
          category: 'music',
          title: 'Music Secret',
          note: 'Do not capture music',
          configuration: { version: 1 },
        },
        {
          id: ids.siblingIdea,
          organizationId: ids.organization,
          eventId: ids.sibling,
          category: 'decor',
          title: 'Sibling Idea Secret',
          note: 'Sibling private note',
          configuration: { version: 1 },
        },
      ])
      await db.insert(eventExpense).values({
        organizationId: ids.organization,
        eventId: ids.child,
        title: 'Private Expense Secret',
        amount: '321.00',
        category: 'other',
      })
      await db.insert(eventGuideSection).values([
        {
          id: ids.childGuide,
          organizationId: ids.organization,
          eventId: ids.child,
          key: 'arrival',
          title: 'Child Arrival',
          body: 'Arrive at the garden gate.',
          sortOrder: 0,
          visibility: 'event_participants',
        },
        {
          id: ids.siblingGuide,
          organizationId: ids.organization,
          eventId: ids.sibling,
          key: 'sibling-secret',
          title: 'Sibling Guide Secret',
          body: 'Private sibling instructions.',
          sortOrder: 0,
          visibility: 'planning_only',
        },
      ])

      phase = 'child scoped source reads and authorization'
      const childSource = await run(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.childManager, { eventId: ids.child })
      )
      expect(childSource.source.event).toMatchObject({
        id: ids.child,
        title: 'Capture Child Event',
      })
      expect(childSource.source.children).toEqual([])
      expect(childSource.source.ideas.map(({ title }) => title)).toEqual(['Child Flowers'])
      expect(childSource.source.instructions.map(({ title }) => title)).toEqual(['Child Arrival'])
      const childSerialized = JSON.stringify(childSource.source)
      for (const secret of [
        ids.root,
        ids.sibling,
        'Capture Main Event',
        'Unrelated Sibling Secret',
        'Root Only Idea',
        'Sibling Idea Secret',
        'Music Secret',
        'Private Expense Secret',
        'Guest Secret Name',
        'private-configuration-secret',
        'idea-config-secret',
      ])
        expect(childSerialized).not.toContain(secret)
      expect(childSource.source.ideas[0]).not.toHaveProperty('estimatedCost')
      expect(childSource.source.ideas[0]).not.toHaveProperty('configuration')

      const guestRead = await denied(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.guest, { eventId: ids.root })
      )
      expect(guestRead).toMatchObject({ _tag: 'Failure' })
      await denied(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.contributor, { eventId: ids.root })
      )
      await db.insert(eventDeparture).values({ eventId: ids.child, userId: ids.childManager })
      await denied(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.childManager, { eventId: ids.child })
      )
      await db
        .delete(eventDeparture)
        .where(
          and(eq(eventDeparture.eventId, ids.child), eq(eventDeparture.userId, ids.childManager))
        )

      phase = 'owner create and exact creation replay after source changes'
      const initialSource = await run(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.owner, { eventId: ids.root })
      )
      const createInput = {
        eventId: ids.root,
        organizationId: ids.organization,
        requestId: requestId(),
        selection: {
          ...selection,
          childIds: [ids.child],
          ideaIds: [ids.rootIdea, ids.childIdea],
          instructionIds: [ids.childGuide],
        },
        expectedSourceHash: initialSource.sourceHash,
      }
      const created = await run(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, createInput)
      )
      expect(created).toMatchObject({ organizationId: ids.organization, draftVersion: 1 })
      expect(created.source).toMatchObject({
        kind: 'event',
        eventId: ids.root,
        requestId: createInput.requestId,
      })
      expect(created.content.ideas).toHaveLength(2)

      await db
        .update(event)
        .set({ title: 'Main Event Changed After Capture' })
        .where(eq(event.id, ids.root))
      await db
        .update(idea)
        .set({ title: 'Root Idea Changed After Capture' })
        .where(eq(idea.id, ids.rootIdea))
      const exactCreationReplay = await run(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, createInput)
      )
      expect(exactCreationReplay).toEqual(created)
      const mismatchedCreateReplay = await denied(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, {
          ...createInput,
          selection: { ...createInput.selection, includeIdeaNotes: true },
        })
      )
      expect(mismatchedCreateReplay).toMatchObject({ _tag: 'Failure' })
      await denied(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.childManager, {
          eventId: ids.child,
          organizationId: ids.organization,
          requestId: requestId(),
          selection: { childIds: [], ideaIds: [], instructionIds: [] },
          expectedSourceHash: childSource.sourceHash,
        })
      )

      phase = 'mismatched source hash and foreign selection rejection'
      await denied(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, {
          ...createInput,
          requestId: requestId(),
          expectedSourceHash: '0'.repeat(64),
        })
      )
      const currentSource = await run(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.owner, { eventId: ids.root })
      )
      await denied(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, {
          ...createInput,
          requestId: requestId(),
          expectedSourceHash: currentSource.sourceHash,
          selection: {
            ...createInput.selection,
            ideaIds: [...createInput.selection.ideaIds, crypto.randomUUID()],
          },
        })
      )

      phase = 'manual edit preservation and refresh'
      const manualContent = structuredClone(created.content)
      manualContent.description = 'Manual author description'
      if (manualContent.children[0]) manualContent.children[0].title = 'Manual ceremony title'
      const manuallySaved = await run(
        authoringWorkflow.saveBlueprintDraftWorkflow(ids.owner, {
          id: created.id,
          expectedVersion: 1,
          content: manualContent,
        })
      )
      const refreshedSource = await run(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.owner, { eventId: ids.root })
      )
      const refreshInput = {
        eventId: ids.root,
        organizationId: ids.organization,
        templateId: created.id,
        expectedVersion: manuallySaved.draftVersion,
        requestId: requestId(),
        selection: createInput.selection,
        expectedSourceHash: refreshedSource.sourceHash,
      }
      const refreshed = await run(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, refreshInput)
      )
      expect(refreshed.draftVersion).toBe(manuallySaved.draftVersion + 1)
      expect(refreshed.content.description).toBe('Manual author description')
      expect(refreshed.content.children[0]?.title).toBe('Manual ceremony title')

      phase = 'concurrent capture draft compare and swap'
      const canonicalEventsBeforeRace = await db
        .select()
        .from(event)
        .where(inArray(event.id, [ids.root, ids.child, ids.sibling]))
      const canonicalIdeasBeforeRace = await db
        .select()
        .from(idea)
        .where(inArray(idea.id, [ids.rootIdea, ids.childIdea, ids.musicIdea, ids.siblingIdea]))
      const nativeSnapshotsBeforeRace = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.organizationId, ids.organization))
      const snapshotScopeIds = nativeSnapshotsBeforeRace.map(({ scopeId }) => scopeId)
      const nativeEntitiesBeforeRace = snapshotScopeIds.length
        ? await db
            .select()
            .from(nativeSyncEntity)
            .where(inArray(nativeSyncEntity.scopeId, snapshotScopeIds))
        : []
      const nativeChangesBeforeRace = snapshotScopeIds.length
        ? await db
            .select()
            .from(nativeSyncChange)
            .where(inArray(nativeSyncChange.scopeId, snapshotScopeIds))
        : []
      const nativeReceiptsBeforeRace = snapshotScopeIds.length
        ? await db
            .select()
            .from(nativeSyncMutationReceipt)
            .where(inArray(nativeSyncMutationReceipt.scopeId, snapshotScopeIds))
        : []
      const raceInputs = [requestId(), requestId()].map((id) => ({
        ...refreshInput,
        requestId: id,
        expectedVersion: refreshed.draftVersion,
      }))
      const raceResults = await Promise.all(
        raceInputs.map((input) =>
          Effect.runPromise(
            Effect.exit(
              captureWorkflow
                .saveBlueprintCaptureWorkflow(ids.owner, input)
                .pipe(Effect.provide(layer))
            )
          )
        )
      )
      expect(raceResults.filter(Exit.isSuccess)).toHaveLength(1)
      expect(raceResults.filter(Exit.isFailure)).toHaveLength(1)
      const raceWinnerIndex = raceResults.findIndex(Exit.isSuccess)
      const raceWinner = (raceResults[raceWinnerIndex] as Exit.Success<typeof refreshed>).value
      expect(raceWinner.draftVersion).toBe(refreshed.draftVersion + 1)
      const exactUpdateReplay = await run(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, raceInputs[raceWinnerIndex]!)
      )
      expect(exactUpdateReplay).toEqual(raceWinner)
      expect(
        await db
          .select()
          .from(event)
          .where(inArray(event.id, [ids.root, ids.child, ids.sibling]))
      ).toEqual(canonicalEventsBeforeRace)
      expect(
        await db
          .select()
          .from(idea)
          .where(inArray(idea.id, [ids.rootIdea, ids.childIdea, ids.musicIdea, ids.siblingIdea]))
      ).toEqual(canonicalIdeasBeforeRace)

      phase = 'published revision immutability across a later refresh'
      const published = await run(
        authoringWorkflow.publishBlueprintDraftWorkflow(ids.owner, {
          id: created.id,
          expectedVersion: raceWinner.draftVersion,
        })
      )
      const [publishedRevisionBefore] = await db
        .select()
        .from(blueprintRevision)
        .where(
          and(
            eq(blueprintRevision.templateId, created.id),
            eq(blueprintRevision.revision, published.publishedRevision!)
          )
        )
      expect(publishedRevisionBefore).toBeDefined()
      await db
        .update(event)
        .set({ title: 'Main Event Changed Before Post Publish Refresh' })
        .where(eq(event.id, ids.root))
      const postPublishSource = await run(
        captureWorkflow.getBlueprintCaptureSourceWorkflow(ids.owner, { eventId: ids.root })
      )
      const canonicalEventsBeforePostPublishRefresh = await db
        .select()
        .from(event)
        .where(inArray(event.id, [ids.root, ids.child, ids.sibling]))
      const canonicalIdeasBeforePostPublishRefresh = await db
        .select()
        .from(idea)
        .where(inArray(idea.id, [ids.rootIdea, ids.childIdea, ids.musicIdea, ids.siblingIdea]))
      const postPublishInput = {
        ...refreshInput,
        expectedVersion: raceWinner.draftVersion,
        requestId: requestId(),
        expectedSourceHash: postPublishSource.sourceHash,
      }
      const postPublishRefresh = await run(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, postPublishInput)
      )
      expect(postPublishRefresh.draftVersion).toBe(raceWinner.draftVersion + 1)
      const exactPostPublishReplay = await run(
        captureWorkflow.saveBlueprintCaptureWorkflow(ids.owner, postPublishInput)
      )
      expect(exactPostPublishReplay).toEqual(postPublishRefresh)
      const [publishedRevisionAfter] = await db
        .select()
        .from(blueprintRevision)
        .where(eq(blueprintRevision.id, publishedRevisionBefore!.id))
      expect(publishedRevisionAfter).toEqual(publishedRevisionBefore)

      phase = 'capture source and native sync mutation absence'
      expect(
        await db
          .select()
          .from(event)
          .where(inArray(event.id, [ids.root, ids.child, ids.sibling]))
      ).toEqual(canonicalEventsBeforePostPublishRefresh)
      expect(
        await db
          .select()
          .from(idea)
          .where(inArray(idea.id, [ids.rootIdea, ids.childIdea, ids.musicIdea, ids.siblingIdea]))
      ).toEqual(canonicalIdeasBeforePostPublishRefresh)
      expect(
        await db
          .select()
          .from(nativeWorkspaceSnapshot)
          .where(eq(nativeWorkspaceSnapshot.organizationId, ids.organization))
      ).toEqual(nativeSnapshotsBeforeRace)
      if (snapshotScopeIds.length) {
        expect(
          await db
            .select()
            .from(nativeSyncEntity)
            .where(inArray(nativeSyncEntity.scopeId, snapshotScopeIds))
        ).toEqual(nativeEntitiesBeforeRace)
        expect(
          await db
            .select()
            .from(nativeSyncChange)
            .where(inArray(nativeSyncChange.scopeId, snapshotScopeIds))
        ).toEqual(nativeChangesBeforeRace)
        expect(
          await db
            .select()
            .from(nativeSyncMutationReceipt)
            .where(inArray(nativeSyncMutationReceipt.scopeId, snapshotScopeIds))
        ).toEqual(nativeReceiptsBeforeRace)
      }
    } catch (error) {
      throw new Error(`Blueprint capture integration failed during ${phase}`, { cause: error })
    } finally {
      await db.delete(organization).where(inArray(organization.id, fixtureOrgIds))
      await db.delete(user).where(inArray(user.id, fixtureUserIds))
      await database.pool.end()
    }
  }
)
