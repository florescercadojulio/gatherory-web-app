import { Cause, Effect, Exit, Layer } from 'effect'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'native event capture creates one immutable published template under source and destination grants',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in native-creation database test'
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
      syncSchema,
      authoringRepo,
      captureRepo,
      nativeCreationRepo,
      sharingRepo,
      runtimeContracts,
      blueprintRepoModule,
      workflow,
      sharingWorkflow,
      authContracts,
      contract,
      drizzle,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/sync.schema'),
      import('@/server/blueprints/repos/blueprint-authoring.repo.live'),
      import('@/server/blueprints/repos/blueprint-capture.repo.live'),
      import('@/server/blueprints/repos/blueprint-native-creation.repo.live'),
      import('@/server/blueprints/repos/blueprint-sharing.repo.live'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprints/workflows/blueprint-native-creation.workflow'),
      import('@/server/blueprints/workflows/blueprint-sharing.workflow'),
      import('@/server/workspaces/connectors/better-auth.con'),
      import('@/contracts/blueprint-native-creation.contracts'),
      import('drizzle-orm'),
    ])
    const { db, PgClientLive } = database
    const {
      user,
      organization,
      member,
      event,
      workspacePerson,
      eventParticipant,
      eventDeparture,
      idea,
    } = schema
    const { blueprintTemplate, blueprintRevision } = blueprintSchema
    const { eventGuideSection } = blueprintSchema
    const {
      nativeWorkspaceSnapshot,
      nativeSyncEntity,
      nativeSyncChange,
      nativeSyncMutationReceipt,
    } = syncSchema
    const { and, eq, inArray, sql } = drizzle
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ids = {
      host: `native-create-host-${suffix}`,
      secondHost: `native-create-second-host-${suffix}`,
      childPlanner: `native-create-child-${suffix}`,
      guest: `native-create-guest-${suffix}`,
      contributor: `native-create-contributor-${suffix}`,
      destinationOnly: `native-create-destination-only-${suffix}`,
      sourceOrganization: `native-create-source-${suffix}`,
      destinationOrganization: `native-create-destination-${suffix}`,
      otherDestination: `native-create-other-destination-${suffix}`,
      root: crypto.randomUUID(),
      child: crypto.randomUUID(),
      sibling: crypto.randomUUID(),
      hostPerson: crypto.randomUUID(),
      secondHostPerson: crypto.randomUUID(),
      childPlannerPerson: crypto.randomUUID(),
      guestPerson: crypto.randomUUID(),
      contributorPerson: crypto.randomUUID(),
      rootIdea: crypto.randomUUID(),
      childIdea: crypto.randomUUID(),
      unselectedChildIdea: crypto.randomUUID(),
      siblingIdea: crypto.randomUUID(),
      childGuide: crypto.randomUUID(),
      unselectedRootGuide: crypto.randomUUID(),
    }
    const users = [
      ids.host,
      ids.secondHost,
      ids.childPlanner,
      ids.guest,
      ids.contributor,
      ids.destinationOnly,
    ].map((id) => ({ id, name: id, email: `${id}@example.test`, emailVerified: true }))
    const fixtureUserIds = users.map(({ id }) => id)
    const fixtureOrganizationIds = [
      ids.sourceOrganization,
      ids.destinationOrganization,
      ids.otherDestination,
    ]
    const fixtureEventIds = [ids.root, ids.child, ids.sibling]
    const now = new Date()
    const selection = {
      childIds: [ids.child],
      ideaIds: [ids.rootIdea, ids.childIdea],
      instructionIds: [ids.childGuide],
      includeIdeaNotes: false,
    }

    const authoringLayer = authoringRepo.BlueprintAuthoringRepoLive.pipe(
      Layer.provide(PgClientLive)
    )
    const captureLayer = captureRepo.BlueprintCaptureRepoLive.pipe(
      Layer.provide(Layer.mergeAll(authoringLayer, PgClientLive))
    )
    const creationLayer = nativeCreationRepo.BlueprintNativeCreationRepoLive.pipe(
      Layer.provide(Layer.mergeAll(authoringLayer, captureLayer, PgClientLive))
    )
    const sharingLayer = sharingRepo.BlueprintSharingRepoLive.pipe(Layer.provide(PgClientLive))
    const installCheckpoint = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
      afterProjection: () => Effect.void,
    })
    const blueprintLayer = blueprintRepoModule.BlueprintRepoLive.pipe(
      Layer.provide(Layer.mergeAll(PgClientLive, installCheckpoint))
    )
    const noExternalWorkspaceProvisioning = Layer.succeed(authContracts.BetterAuthWorkspaceCon, {
      listOrganizations: () => Effect.succeed([]),
      createOrganization: () => Effect.die('unexpected workspace provisioning'),
      setActiveOrganization: () => Effect.die('unexpected active organization change'),
      listTeams: () => Effect.succeed([]),
      createTeam: () => Effect.die('unexpected team creation'),
      addTeamMember: () => Effect.die('unexpected team membership'),
      setActiveTeam: () => Effect.die('unexpected active team'),
    })
    const layer = Layer.mergeAll(
      authoringLayer,
      captureLayer,
      creationLayer,
      sharingLayer,
      blueprintLayer,
      noExternalWorkspaceProvisioning
    )
    type Dependencies = Layer.Success<typeof layer>
    const run = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const runExit = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(Effect.exit(program.pipe(Effect.provide(layer))))
    const actor = (id: string) => ({ id, name: id })
    const call = (actorId: string, input: unknown) =>
      workflow.blueprintNativeCreationWorkflow(actor(actorId), input)
    const denied = async (actorId: string, input: unknown) => {
      const result = await runExit(call(actorId, input))
      expect(Exit.isFailure(result)).toBe(true)
      return result
    }
    const failureCode = (exit: Exit.Exit<unknown, unknown>) => {
      if (Exit.isFailure(exit)) {
        const failure = exit.cause.reasons.find(Cause.isFailReason)
        return (failure?.error as { code?: string } | undefined)?.code
      }
      return undefined
    }
    const readSource = (actorId: string, eventId = ids.root) =>
      run(call(actorId, { action: 'source', eventId }))
    const makeReview = async (
      actorId: string,
      eventId: string,
      expectedSourceHash: string,
      name: string,
      chosenSelection = selection
    ) =>
      run(
        call(actorId, {
          action: 'review',
          eventId,
          selection: chosenSelection,
          expectedSourceHash,
          name,
          discoverable: false,
        })
      )
    const rawMigrationObjects = {
      functionName: `native_create_fail_revision_${suffix}`,
      triggerName: `native_create_fail_revision_${suffix}`,
    }
    let injectedTriggerInstalled = false
    let phase = 'fixture setup'

    try {
      await db.insert(user).values(users)
      await db.insert(organization).values([
        {
          id: ids.sourceOrganization,
          name: 'Native creation source fixture',
          slug: `native-source-${suffix}`,
          createdAt: now,
          workspaceType: 'event',
        },
        {
          id: ids.destinationOrganization,
          name: 'Native creation destination fixture',
          slug: `native-destination-${suffix}`,
          createdAt: now,
          workspaceType: 'event',
        },
        {
          id: ids.otherDestination,
          name: 'Native creation other destination fixture',
          slug: `native-other-destination-${suffix}`,
          createdAt: now,
          workspaceType: 'event',
        },
      ])
      await db.insert(member).values([
        ...[ids.host, ids.secondHost, ids.childPlanner, ids.guest, ids.contributor].map(
          (userId) => ({
            id: `native-destination-member-${suffix}-${userId}`,
            organizationId: ids.destinationOrganization,
            userId,
            role: 'owner' as const,
            createdAt: now,
          })
        ),
        {
          id: `native-other-destination-member-${suffix}`,
          organizationId: ids.otherDestination,
          userId: ids.destinationOnly,
          role: 'owner',
          createdAt: now,
        },
      ])
      await db.insert(workspacePerson).values([
        {
          id: ids.hostPerson,
          organizationId: ids.sourceOrganization,
          userId: ids.host,
          displayName: 'Native creation host',
        },
        {
          id: ids.secondHostPerson,
          organizationId: ids.sourceOrganization,
          userId: ids.secondHost,
          displayName: 'Second source host',
        },
        {
          id: ids.childPlannerPerson,
          organizationId: ids.sourceOrganization,
          userId: ids.childPlanner,
          displayName: 'Child scoped planner',
        },
        {
          id: ids.guestPerson,
          organizationId: ids.sourceOrganization,
          userId: ids.guest,
          displayName: 'Native creation guest',
        },
        {
          id: ids.contributorPerson,
          organizationId: ids.sourceOrganization,
          userId: ids.contributor,
          displayName: 'Native creation contributor',
        },
      ])
      await db.insert(event).values([
        {
          id: ids.root,
          organizationId: ids.sourceOrganization,
          title: 'Native Root Event',
          status: 'draft',
          startsAt: new Date('2027-06-15T19:00:00.000Z'),
          timeZone: 'America/Detroit',
          createdByUserId: ids.host,
        },
        {
          id: ids.child,
          organizationId: ids.sourceOrganization,
          parentEventId: ids.root,
          title: 'Selected Ceremony',
          purpose: 'part_of_event',
          category: 'ceremony',
          planningStatus: 'draft',
          startsAt: new Date('2027-06-16T14:00:00.000Z'),
          timeZone: 'America/Detroit',
          createdByUserId: ids.host,
        },
        {
          id: ids.sibling,
          organizationId: ids.sourceOrganization,
          parentEventId: ids.root,
          title: 'Sibling Secret Reception',
          purpose: 'part_of_event',
          category: 'reception',
          planningStatus: 'draft',
          startsAt: new Date('2027-06-16T22:00:00.000Z'),
          timeZone: 'America/Detroit',
          createdByUserId: ids.host,
        },
      ])
      await db.insert(eventParticipant).values([
        { eventId: ids.root, personId: ids.hostPerson, role: 'host', planningPermission: 'manage' },
        {
          eventId: ids.child,
          personId: ids.hostPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.sibling,
          personId: ids.hostPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.root,
          personId: ids.secondHostPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.child,
          personId: ids.secondHostPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.sibling,
          personId: ids.secondHostPerson,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          eventId: ids.child,
          personId: ids.childPlannerPerson,
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
      await db.insert(idea).values([
        {
          id: ids.rootIdea,
          organizationId: ids.sourceOrganization,
          eventId: ids.root,
          category: 'other',
          title: 'Selected Root Idea',
          note: 'Explicitly included root idea note',
          estimatedCost: '900.00',
          configuration: { version: 1, private: 'must not copy' },
        },
        {
          id: ids.childIdea,
          organizationId: ids.sourceOrganization,
          eventId: ids.child,
          category: 'flowers',
          title: 'Selected Child Flowers',
          note: 'Explicitly included child idea note',
          estimatedCost: '125.00',
          configuration: { version: 1, supplierSecret: 'must not copy' },
        },
        {
          id: ids.unselectedChildIdea,
          organizationId: ids.sourceOrganization,
          eventId: ids.child,
          category: 'music',
          title: 'Unselected Music Secret',
          note: 'Unselected private note',
          configuration: { version: 1 },
        },
        {
          id: ids.siblingIdea,
          organizationId: ids.sourceOrganization,
          eventId: ids.sibling,
          category: 'decor',
          title: 'Sibling Idea Secret',
          note: 'Sibling private note',
          configuration: { version: 1 },
        },
      ])
      await db.insert(eventGuideSection).values([
        {
          id: ids.childGuide,
          organizationId: ids.sourceOrganization,
          eventId: ids.child,
          key: 'ceremony-arrival',
          title: 'Selected Ceremony Arrival',
          body: 'Arrive at the garden gate.',
          sortOrder: 0,
          visibility: 'event_participants',
        },
        {
          id: ids.unselectedRootGuide,
          organizationId: ids.sourceOrganization,
          eventId: ids.root,
          key: 'private-root-guide',
          title: 'Unselected Root Guide Secret',
          body: 'Do not include this guide.',
          sortOrder: 0,
          visibility: 'planning_only',
        },
      ])

      const sourceRowsBefore = async () => ({
        events: await db.select().from(event).where(inArray(event.id, fixtureEventIds)),
        ideas: await db
          .select()
          .from(idea)
          .where(
            inArray(idea.id, [
              ids.rootIdea,
              ids.childIdea,
              ids.unselectedChildIdea,
              ids.siblingIdea,
            ])
          ),
        instructions: await db
          .select()
          .from(eventGuideSection)
          .where(inArray(eventGuideSection.id, [ids.childGuide, ids.unselectedRootGuide])),
        snapshots: await db
          .select()
          .from(nativeWorkspaceSnapshot)
          .where(eq(nativeWorkspaceSnapshot.organizationId, ids.sourceOrganization)),
      })
      const nativeRowsBefore = await sourceRowsBefore()

      phase = 'source, workspace and reviewed selection actions'
      const sourceResult = contract.BlueprintNativeCreationSourceResponseSchema.parse(
        await readSource(ids.host)
      )
      expect(sourceResult.source.event.id).toBe(ids.root)
      expect(sourceResult.workspaces).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: ids.destinationOrganization, personal: false }),
        ])
      )
      const workspaceResult = contract.BlueprintNativeCreationWorkspaceResponseSchema.parse(
        await run(call(ids.host, { action: 'workspace', eventId: ids.root }))
      )
      expect(workspaceResult.workspaces.map(({ id }) => id)).toContain(ids.destinationOrganization)

      const name = 'Reviewed Native Garden Wedding'
      const review = contract.BlueprintNativeCreationReviewResponseSchema.parse(
        await makeReview(ids.host, ids.root, sourceResult.sourceHash, name)
      )
      expect(review).toMatchObject({ sourceHash: sourceResult.sourceHash })
      expect(review.content.name).toBe(name)
      expect(review.content.children.map(({ title }) => title)).toEqual(['Selected Ceremony'])
      expect(review.content.ideas.map(({ title }) => title)).toEqual(
        expect.arrayContaining(['Selected Root Idea', 'Selected Child Flowers'])
      )
      expect(review.content.instructions.map(({ title }) => title)).toEqual([
        'Selected Ceremony Arrival',
      ])
      expect(review.content.ideas.every((entry) => !('notes' in entry))).toBe(true)
      const notesReview = contract.BlueprintNativeCreationReviewResponseSchema.parse(
        await makeReview(ids.host, ids.root, sourceResult.sourceHash, name, {
          ...selection,
          includeIdeaNotes: true,
        })
      )
      expect(notesReview.content.ideas.map(({ notes }) => notes)).toEqual(
        expect.arrayContaining([
          'Explicitly included root idea note',
          'Explicitly included child idea note',
        ])
      )
      expect(notesReview.reviewHash).not.toBe(review.reviewHash)
      const serializedReview = JSON.stringify(review.content)
      for (const excluded of [
        'Sibling Secret Reception',
        'Unselected Music Secret',
        'Sibling Idea Secret',
        'Unselected Root Guide Secret',
        'Explicitly included root idea note',
        'Explicitly included child idea note',
        '900.00',
        '125.00',
        'supplierSecret',
      ])
        expect(serializedReview).not.toContain(excluded)

      phase = 'source and destination grants stay independent'
      const sourceHashForUnauthorized = sourceResult.sourceHash
      await denied(ids.destinationOnly, { action: 'source', eventId: ids.root })
      await denied(ids.destinationOnly, {
        action: 'create',
        eventId: ids.root,
        selection,
        expectedSourceHash: sourceHashForUnauthorized,
        name,
        organizationId: ids.otherDestination,
        requestId: crypto.randomUUID(),
        expectedReviewHash: review.reviewHash,
      })
      await denied(ids.guest, { action: 'source', eventId: ids.root })
      await denied(ids.contributor, { action: 'source', eventId: ids.root })
      for (const actorId of [ids.guest, ids.contributor]) {
        await denied(actorId, {
          action: 'create',
          eventId: ids.root,
          selection,
          expectedSourceHash: sourceHashForUnauthorized,
          name,
          organizationId: ids.destinationOrganization,
          requestId: crypto.randomUUID(),
          expectedReviewHash: review.reviewHash,
        })
      }
      const childSource = contract.BlueprintNativeCreationSourceResponseSchema.parse(
        await readSource(ids.childPlanner, ids.child)
      )
      expect(childSource.source.event.id).toBe(ids.child)
      expect(childSource.source.children).toEqual([])
      expect(childSource.source.ideas.map(({ title }) => title)).toEqual(['Selected Child Flowers'])
      for (const inaccessibleEventId of [ids.root, ids.sibling]) {
        await denied(ids.childPlanner, { action: 'source', eventId: inaccessibleEventId })
        await denied(ids.childPlanner, {
          action: 'create',
          eventId: inaccessibleEventId,
          selection,
          expectedSourceHash: sourceHashForUnauthorized,
          name,
          organizationId: ids.destinationOrganization,
          requestId: crypto.randomUUID(),
          expectedReviewHash: review.reviewHash,
        })
      }
      const childReview = contract.BlueprintNativeCreationReviewResponseSchema.parse(
        await makeReview(
          ids.childPlanner,
          ids.child,
          childSource.sourceHash,
          'Child Scoped Template',
          {
            childIds: [],
            ideaIds: [ids.childIdea],
            instructionIds: [ids.childGuide],
            includeIdeaNotes: false,
          }
        )
      )
      expect(childReview.content.children).toEqual([])
      expect(childReview.content.ideas.map(({ title }) => title)).toEqual([
        'Selected Child Flowers',
      ])

      phase = 'concurrent idempotent publication and source-independent replay'
      const requestId = crypto.randomUUID()
      const createInput = {
        action: 'create' as const,
        eventId: ids.root,
        selection,
        expectedSourceHash: sourceResult.sourceHash,
        name,
        organizationId: ids.destinationOrganization,
        requestId,
        expectedReviewHash: review.reviewHash,
        discoverable: false,
      }
      const [first, concurrentRetry] = await Promise.all([
        run(call(ids.host, createInput)),
        run(call(ids.host, createInput)),
      ])
      const created = contract.BlueprintNativeCreationResultResponseSchema.parse(first)
      expect(concurrentRetry).toEqual(created)
      expect(created.revision).toBe(1)
      const createdRows = await db
        .select()
        .from(blueprintTemplate)
        .where(
          and(
            eq(blueprintTemplate.createdByUserId, ids.host),
            eq(blueprintTemplate.createRequestId, requestId)
          )
        )
      expect(createdRows).toHaveLength(1)
      expect(createdRows[0]).toMatchObject({
        id: created.templateId,
        draftVersion: 1,
        publishedRevision: 1,
        publishedDraftVersion: 1,
        listedRevision: null,
        content: review.content,
      })
      const publishedRowsBefore = await db
        .select()
        .from(blueprintRevision)
        .where(eq(blueprintRevision.templateId, created.templateId))
      expect(publishedRowsBefore).toHaveLength(1)
      expect(publishedRowsBefore[0]).toMatchObject({ revision: 1, draftVersion: 1 })
      expect(await sourceRowsBefore()).toEqual(nativeRowsBefore)

      await db
        .update(event)
        .set({ title: 'Changed source title after publication' })
        .where(eq(event.id, ids.root))
      await db
        .update(idea)
        .set({ title: 'Changed selected idea after publication' })
        .where(eq(idea.id, ids.childIdea))
      const sourceRowsAfterExplicitEdits = await sourceRowsBefore()
      expect(await run(call(ids.host, createInput))).toEqual(created)
      for (const changedInput of [
        { ...createInput, name: `${name} changed` },
        { ...createInput, expectedSourceHash: '0'.repeat(64) },
        { ...createInput, expectedReviewHash: '1'.repeat(64) },
        {
          ...createInput,
          selection: { ...selection, includeIdeaNotes: true },
        },
      ]) {
        const conflict = await denied(ids.host, changedInput)
        expect(failureCode(conflict)).toMatch(/CONFLICT|CHANGED/)
      }
      expect(
        await db
          .select()
          .from(blueprintTemplate)
          .where(
            and(
              eq(blueprintTemplate.createdByUserId, ids.host),
              eq(blueprintTemplate.createRequestId, requestId)
            )
          )
      ).toHaveLength(1)
      expect(
        await db
          .select()
          .from(blueprintRevision)
          .where(eq(blueprintRevision.templateId, created.templateId))
      ).toEqual(publishedRowsBefore)

      phase = 'link resolves to the immutable selected publication'
      const sharingLink = await run(
        sharingWorkflow.createBlueprintShareLinkWorkflow(ids.host, {
          templateId: created.templateId,
          revision: created.revision,
        })
      )
      const ownerCatalogAfterFirstLink = await run(
        Effect.gen(function* () {
          const repo = yield* runtimeContracts.BlueprintRepo
          return yield* repo.catalog(ids.host)
        })
      )
      const viewerCatalogAfterFirstLink = await run(
        Effect.gen(function* () {
          const repo = yield* runtimeContracts.BlueprintRepo
          return yield* repo.catalog(ids.guest)
        })
      )
      expect(ownerCatalogAfterFirstLink.map(({ catalogKey }) => catalogKey)).not.toContain(
        createdRows[0]!.catalogKey
      )
      expect(viewerCatalogAfterFirstLink.map(({ catalogKey }) => catalogKey)).not.toContain(
        createdRows[0]!.catalogKey
      )
      const resolved = await run(
        sharingWorkflow.resolveBlueprintShareLinkWorkflow({ token: sharingLink.token })
      )
      expect(resolved).toMatchObject({
        catalogKey: createdRows[0]!.catalogKey,
        revision: created.revision,
        contentHash: publishedRowsBefore[0]!.contentHash,
      })
      expect(resolved.definition.blueprint.name).toBe(name)
      const resolvedTree = resolved.definition.modules.find(({ key }) => key === 'event_tree')
      const resolvedIdeas = resolved.definition.modules.find(({ key }) => key === 'starter_ideas')
      const resolvedInstructions = resolved.definition.modules.find(
        ({ key }) => key === 'guest_guidance'
      )
      expect(resolvedTree).toMatchObject({ config: { children: review.content.children } })
      expect(resolvedIdeas).toMatchObject({ config: { ideas: review.content.ideas } })
      expect(resolvedInstructions).toMatchObject({
        config: { sections: review.content.instructions },
      })
      const publishedText = JSON.stringify(resolved.definition)
      for (const excluded of [
        'Sibling Secret Reception',
        'Unselected Music Secret',
        'Sibling Idea Secret',
        'Unselected Root Guide Secret',
        'Explicitly included root idea note',
        'Explicitly included child idea note',
        'supplierSecret',
      ])
        expect(publishedText).not.toContain(excluded)

      phase = 'child scoped reviewer can publish only its child projection'
      const currentChildSource = contract.BlueprintNativeCreationSourceResponseSchema.parse(
        await readSource(ids.childPlanner, ids.child)
      )
      const currentChildReview = contract.BlueprintNativeCreationReviewResponseSchema.parse(
        await makeReview(
          ids.childPlanner,
          ids.child,
          currentChildSource.sourceHash,
          'Child Scoped Template',
          {
            childIds: [],
            ideaIds: [ids.childIdea],
            instructionIds: [ids.childGuide],
            includeIdeaNotes: false,
          }
        )
      )
      const childCreateInput = {
        action: 'create' as const,
        eventId: ids.child,
        selection: {
          childIds: [],
          ideaIds: [ids.childIdea],
          instructionIds: [ids.childGuide],
          includeIdeaNotes: false,
        },
        expectedSourceHash: currentChildSource.sourceHash,
        name: 'Child Scoped Template',
        organizationId: ids.destinationOrganization,
        requestId: crypto.randomUUID(),
        expectedReviewHash: currentChildReview.reviewHash,
        discoverable: false,
      }
      const childCreated = contract.BlueprintNativeCreationResultResponseSchema.parse(
        await run(call(ids.childPlanner, childCreateInput))
      )
      const childTemplate = await db
        .select()
        .from(blueprintTemplate)
        .where(eq(blueprintTemplate.id, childCreated.templateId))
      expect(JSON.stringify(childTemplate[0]?.content)).not.toContain('Sibling')
      expect(JSON.stringify(childTemplate[0]?.content)).not.toContain('Native Root Event')

      phase = 'publication failure rolls back the newly captured draft'
      const failureName = `Injected publication failure ${suffix}`
      const currentSource = contract.BlueprintNativeCreationSourceResponseSchema.parse(
        await readSource(ids.host)
      )
      const failureReview = contract.BlueprintNativeCreationReviewResponseSchema.parse(
        await makeReview(ids.host, ids.root, currentSource.sourceHash, failureName)
      )
      const failureRequestId = crypto.randomUUID()
      await db.execute(
        sql.raw(`CREATE FUNCTION ${rawMigrationObjects.functionName}() RETURNS trigger
          LANGUAGE plpgsql AS $$ BEGIN
            IF NEW.document #>> '{blueprint,name}' = '${failureName}' THEN
              RAISE EXCEPTION 'injected native creation publication failure';
            END IF;
            RETURN NEW;
          END; $$`)
      )
      await db.execute(
        sql.raw(
          `CREATE TRIGGER ${rawMigrationObjects.triggerName} BEFORE INSERT ON blueprint_revision
           FOR EACH ROW EXECUTE FUNCTION ${rawMigrationObjects.functionName}()`
        )
      )
      injectedTriggerInstalled = true
      const publicationFailure = await denied(ids.host, {
        action: 'create',
        eventId: ids.root,
        selection,
        expectedSourceHash: currentSource.sourceHash,
        name: failureName,
        organizationId: ids.destinationOrganization,
        requestId: failureRequestId,
        expectedReviewHash: failureReview.reviewHash,
      })
      expect(Exit.isFailure(publicationFailure)).toBe(true)
      expect(
        await db
          .select()
          .from(blueprintTemplate)
          .where(
            and(
              eq(blueprintTemplate.createdByUserId, ids.host),
              eq(blueprintTemplate.createRequestId, failureRequestId)
            )
          )
      ).toEqual([])
      expect(
        await db
          .select()
          .from(blueprintRevision)
          .where(sql`${blueprintRevision.document} #>> '{blueprint,name}' = ${failureName}`)
      ).toEqual([])
      await db.execute(
        sql.raw(`DROP TRIGGER ${rawMigrationObjects.triggerName} ON blueprint_revision`)
      )
      await db.execute(sql.raw(`DROP FUNCTION ${rawMigrationObjects.functionName}()`))
      injectedTriggerInstalled = false

      phase = 'grant revocation and event departure prevent successful replay'
      const secondReview = contract.BlueprintNativeCreationReviewResponseSchema.parse(
        await makeReview(ids.secondHost, ids.root, currentSource.sourceHash, 'Second Host Template')
      )
      const secondCreateInput = {
        action: 'create' as const,
        eventId: ids.root,
        selection,
        expectedSourceHash: currentSource.sourceHash,
        name: 'Second Host Template',
        organizationId: ids.destinationOrganization,
        requestId: crypto.randomUUID(),
        expectedReviewHash: secondReview.reviewHash,
        discoverable: false,
      }
      await run(call(ids.secondHost, secondCreateInput))
      await db
        .delete(member)
        .where(
          and(
            eq(member.organizationId, ids.destinationOrganization),
            eq(member.userId, ids.secondHost)
          )
        )
      const destinationGrantReplay = await denied(ids.secondHost, secondCreateInput)
      expect(failureCode(destinationGrantReplay)).toBe('BLUEPRINT_CAPTURE_FORBIDDEN')

      await db.insert(eventDeparture).values({ eventId: ids.root, userId: ids.host })
      const departureReplay = await denied(ids.host, createInput)
      expect(failureCode(departureReplay)).toBe('BLUEPRINT_CAPTURE_FORBIDDEN')

      phase = 'capture and publication leave canonical source and native sync untouched'
      const sourceRowsAfter = await sourceRowsBefore()
      expect(sourceRowsAfter.events).toEqual(sourceRowsAfterExplicitEdits.events)
      expect(sourceRowsAfter.ideas).toEqual(sourceRowsAfterExplicitEdits.ideas)
      expect(sourceRowsAfter.instructions).toEqual(nativeRowsBefore.instructions)
      expect(sourceRowsAfter.snapshots).toEqual(nativeRowsBefore.snapshots)
      const sourceScopeIds = sourceRowsAfter.snapshots.map(({ scopeId }) => scopeId)
      const [sourceEntitiesAfter, sourceChangesAfter, sourceReceiptsAfter] = sourceScopeIds.length
        ? await Promise.all([
            db
              .select()
              .from(nativeSyncEntity)
              .where(inArray(nativeSyncEntity.scopeId, sourceScopeIds)),
            db
              .select()
              .from(nativeSyncChange)
              .where(inArray(nativeSyncChange.scopeId, sourceScopeIds)),
            db
              .select()
              .from(nativeSyncMutationReceipt)
              .where(inArray(nativeSyncMutationReceipt.scopeId, sourceScopeIds)),
          ])
        : [[], [], []]
      expect(sourceEntitiesAfter).toEqual([])
      expect(sourceChangesAfter).toEqual([])
      expect(sourceReceiptsAfter).toEqual([])
      expect(sourceRowsAfter.events).toHaveLength(nativeRowsBefore.events.length)
      expect(sourceRowsAfter.ideas).toHaveLength(nativeRowsBefore.ideas.length)
    } catch (error) {
      throw new Error(`Native blueprint creation integration failed during ${phase}`, {
        cause: error,
      })
    } finally {
      if (injectedTriggerInstalled) {
        await db.execute(
          sql.raw(`DROP TRIGGER IF EXISTS ${rawMigrationObjects.triggerName} ON blueprint_revision`)
        )
        await db.execute(sql.raw(`DROP FUNCTION IF EXISTS ${rawMigrationObjects.functionName}()`))
      }
      await db.delete(event).where(inArray(event.id, fixtureEventIds))
      await db.delete(organization).where(inArray(organization.id, fixtureOrganizationIds))
      await db.delete(user).where(inArray(user.id, fixtureUserIds))
      await database.pool.end()
    }
  }
)
