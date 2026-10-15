import { Effect, Exit, Layer } from 'effect'
import { expect, test } from 'vitest'
import type {
  BlueprintInstallCheckpoint,
  BlueprintRepo,
} from '@/server/blueprints/contracts/blueprint-runtime.contracts'
import type { BlueprintAuthoringRepo } from '@/server/blueprints/repos/blueprint-authoring.repo'
import type { BlueprintCaptureRepo } from '@/server/blueprints/repos/blueprint-capture.repo'
import type { BlueprintLinkManagementRepo } from '@/server/blueprints/repos/blueprint-link-management.repo'
import type { BlueprintNativeCreationRepo } from '@/server/blueprints/repos/blueprint-native-creation.repo'
import type { BlueprintSharingRepo } from '@/server/blueprints/repos/blueprint-sharing.repo'
import type { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'native templates publish to public discovery under personal ownership and install independently',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in public discovery database test'
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
      authoringRepo,
      captureRepo,
      nativeCreationRepo,
      blueprintRepo,
      runtimeContracts,
      sharingRepo,
      linkManagementRepo,
      nativeWorkflow,
      authoringWorkflow,
      installWorkflow,
      scheduleWorkflow,
      sharingWorkflow,
      linkManagementWorkflow,
      authContracts,
      nativeContracts,
      discovery,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/server/blueprints/repos/blueprint-authoring.repo.live'),
      import('@/server/blueprints/repos/blueprint-capture.repo.live'),
      import('@/server/blueprints/repos/blueprint-native-creation.repo.live'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/server/blueprints/repos/blueprint-sharing.repo.live'),
      import('@/server/blueprints/repos/blueprint-link-management.repo.live'),
      import('@/server/blueprints/workflows/blueprint-native-creation.workflow'),
      import('@/server/blueprints/workflows/blueprint-authoring.workflow'),
      import('@/server/blueprints/workflows/install-blueprint.workflow'),
      import('@/server/blueprints/workflows/schedule-blueprint.workflow'),
      import('@/server/blueprints/workflows/blueprint-sharing.workflow'),
      import('@/server/blueprints/workflows/blueprint-link-management.workflow'),
      import('@/server/workspaces/connectors/better-auth.con'),
      import('@/contracts/blueprint-native-creation.contracts'),
      import('@/server/blueprints/services/blueprint-discovery'),
    ])
    const { db, PgClientLive } = database
    const { user, organization, member, event, workspacePerson, eventParticipant } = schema
    const { blueprintTemplate } = blueprintSchema
    const { and, eq, inArray } = await import('drizzle-orm')
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ids = {
      owner: `public-blueprint-owner-${suffix}`,
      installer: `public-blueprint-installer-${suffix}`,
      sourceOrganization: `public-blueprint-source-${suffix}`,
      sourceEvent: crypto.randomUUID(),
      sourcePerson: crypto.randomUUID(),
    }
    const users = [ids.owner, ids.installer].map((id) => ({
      id,
      name: id,
      email: `${id}@example.test`,
      emailVerified: true,
    }))
    const fixtureOrganizationIds = new Set([ids.sourceOrganization])
    const now = new Date()

    const authoringLayer = authoringRepo.BlueprintAuthoringRepoLive.pipe(
      Layer.provide(PgClientLive)
    )
    const captureLayer = captureRepo.BlueprintCaptureRepoLive.pipe(
      Layer.provide(Layer.mergeAll(authoringLayer, PgClientLive))
    )
    const nativeCreationLayer = nativeCreationRepo.BlueprintNativeCreationRepoLive.pipe(
      Layer.provide(Layer.mergeAll(authoringLayer, captureLayer, PgClientLive))
    )
    const checkpointLayer = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
      afterProjection: () => Effect.void,
    })
    const runtimeLayer = blueprintRepo.BlueprintRepoLive.pipe(
      Layer.provide(Layer.mergeAll(PgClientLive, checkpointLayer))
    )
    const sharingLayer = sharingRepo.BlueprintSharingRepoLive.pipe(Layer.provide(PgClientLive))
    const linkManagementLayer = linkManagementRepo.BlueprintLinkManagementRepoLive.pipe(
      Layer.provide(PgClientLive)
    )
    const fakeAuth = Layer.succeed(authContracts.BetterAuthWorkspaceCon, {
      listOrganizations: () => Effect.succeed([]),
      createOrganization: (input) =>
        Effect.tryPromise({
          try: async () => {
            const id = `public-blueprint-workspace-${crypto.randomUUID()}`
            const createdAt = new Date()
            await db.insert(organization).values({
              id,
              name: input.name,
              slug: input.slug,
              createdAt,
              workspaceType: 'event',
            })
            await db.insert(member).values({
              id: `public-blueprint-membership-${crypto.randomUUID()}`,
              organizationId: id,
              userId: input.userId!,
              role: 'owner',
              createdAt,
            })
            fixtureOrganizationIds.add(id)
            return { id, name: input.name, slug: input.slug, workspaceType: 'event' }
          },
          catch: (cause) =>
            new authContracts.BetterAuthWorkspaceError({
              category: 'external',
              code: 'PUBLIC_BLUEPRINT_TEST_AUTH_FAILURE',
              userMessageKey: 'serverErrors.SYSTEM',
              cause,
            }),
        }),
      setActiveOrganization: () => Effect.die('blueprint workflows must not switch workspaces'),
      listTeams: () => Effect.succeed([]),
      createTeam: () => Effect.die('unexpected team creation'),
      addTeamMember: () => Effect.die('unexpected team membership'),
      setActiveTeam: () => Effect.die('unexpected active team'),
    })
    const layer = Layer.mergeAll(
      authoringLayer,
      captureLayer,
      nativeCreationLayer,
      runtimeLayer,
      checkpointLayer,
      sharingLayer,
      linkManagementLayer,
      fakeAuth
    )
    type Dependencies =
      | BlueprintRepo
      | BlueprintInstallCheckpoint
      | BlueprintAuthoringRepo
      | BlueprintCaptureRepo
      | BlueprintNativeCreationRepo
      | BlueprintSharingRepo
      | BlueprintLinkManagementRepo
      | BetterAuthWorkspaceCon
    const run = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const runExit = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(Effect.exit(program.pipe(Effect.provide(layer))))
    const actor = (id: string) => ({ id, name: id, email: `${id}@example.test` })
    const callNative = (input: unknown) =>
      run(nativeWorkflow.blueprintNativeCreationWorkflow(actor(ids.owner), input))
    const catalogFor = (actorId: string) =>
      run(
        Effect.gen(function* () {
          const repo = yield* runtimeContracts.BlueprintRepo
          return discovery.buildBlueprintCatalog(yield* repo.catalog(actorId))
        })
      )
    const revisionFor = (catalogKey: string, revision: number, shareToken?: string) =>
      Effect.gen(function* () {
        const repo = yield* runtimeContracts.BlueprintRepo
        return yield* repo.revision(catalogKey, revision, ids.installer, shareToken)
      })
    const installInput = (
      catalogKey: string,
      revision: number,
      contentHash: string,
      requestId: string,
      name: string
    ) => ({
      requestId,
      catalogKey,
      revision,
      contentHash,
      mainEvent: {
        name,
        startsAt: '2030-06-15T19:00:00.000Z',
        timeZone: 'America/Detroit',
      },
      selectedChildren: [],
      selectedIdeaKeys: [],
      capabilities: [
        'event.children_v1',
        'planning.ideas_v2',
        'planning.instructions_v1',
        'planning.portable_idea_config_v1',
      ],
    })

    let phase = 'fixture setup'
    try {
      await db.insert(user).values(users)
      await db.insert(organization).values({
        id: ids.sourceOrganization,
        name: 'Public discovery source business',
        slug: `public-source-${suffix}`,
        createdAt: now,
        workspaceType: 'event',
      })
      // The source owner has an existing business workspace. Native publication
      // must still choose the separately provisioned personal authoring workspace.
      await db.insert(member).values({
        id: `public-source-owner-${suffix}`,
        organizationId: ids.sourceOrganization,
        userId: ids.owner,
        role: 'owner',
        createdAt: now,
      })
      await db.insert(workspacePerson).values({
        id: ids.sourcePerson,
        organizationId: ids.sourceOrganization,
        userId: ids.owner,
        displayName: 'Public discovery source host',
      })
      await db.insert(event).values({
        id: ids.sourceEvent,
        organizationId: ids.sourceOrganization,
        title: 'Source Event Must Stay Private',
        status: 'draft',
        startsAt: new Date('2030-06-15T19:00:00.000Z'),
        timeZone: 'America/Detroit',
        createdByUserId: ids.owner,
      })
      await db.insert(eventParticipant).values({
        id: crypto.randomUUID(),
        eventId: ids.sourceEvent,
        personId: ids.sourcePerson,
        role: 'host',
        planningPermission: 'manage',
      })

      phase = 'source review and automatic personal ownership'
      const selection = {
        childIds: [],
        ideaIds: [],
        instructionIds: [],
        includeIdeaNotes: false,
      }
      const source = nativeContracts.BlueprintNativeCreationSourceResponseSchema.parse(
        await callNative({ action: 'source', eventId: ids.sourceEvent })
      )
      const privateReview = nativeContracts.BlueprintNativeCreationReviewResponseSchema.parse(
        await callNative({
          action: 'review',
          eventId: ids.sourceEvent,
          selection,
          expectedSourceHash: source.sourceHash,
          name: `Public garden celebration ${suffix}`,
          discoverable: false,
        })
      )
      const publicReview = nativeContracts.BlueprintNativeCreationReviewResponseSchema.parse(
        await callNative({
          action: 'review',
          eventId: ids.sourceEvent,
          selection,
          expectedSourceHash: source.sourceHash,
          name: `Public garden celebration ${suffix}`,
          discoverable: true,
        })
      )
      expect(publicReview.discoverable).toBe(true)
      expect(publicReview.reviewHash).toBe(privateReview.reviewHash)

      const createRequestId = crypto.randomUUID()
      const createInput = {
        action: 'create' as const,
        eventId: ids.sourceEvent,
        selection,
        expectedSourceHash: source.sourceHash,
        name: publicReview.content.name,
        requestId: createRequestId,
        expectedReviewHash: publicReview.reviewHash,
        discoverable: true,
      }
      const created = nativeContracts.BlueprintNativeCreationResultResponseSchema.parse(
        await callNative(createInput)
      )
      expect(
        Exit.isFailure(
          await runExit(
            nativeWorkflow.blueprintNativeCreationWorkflow(actor(ids.owner), {
              ...createInput,
              discoverable: false,
            })
          )
        )
      ).toBe(true)
      const [template] = await db
        .select()
        .from(blueprintTemplate)
        .where(eq(blueprintTemplate.id, created.templateId))
      expect(template).toMatchObject({
        createdByUserId: ids.owner,
        publishedRevision: 1,
        listedRevision: 1,
        source: expect.objectContaining({ nativeCreationRequestHash: expect.any(String) }),
      })
      const [ownerWorkspace] = await db
        .select({ id: organization.id, slug: organization.slug })
        .from(organization)
        .where(eq(organization.id, template!.organizationId))
      expect(ownerWorkspace).toEqual({
        id: template!.organizationId,
        slug: `personal-${ids.owner.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
      })
      expect(template!.organizationId).not.toBe(ids.sourceOrganization)
      fixtureOrganizationIds.add(template!.organizationId)

      phase = 'unlisted published and draft templates stay private'
      const ownerContext = await run(
        authoringWorkflow.getBlueprintAuthoringContextWorkflow(ids.owner)
      )
      const personalWorkspace = ownerContext.workspaces.find(({ personal }) => personal)
      expect(personalWorkspace?.id).toBe(template!.organizationId)
      const privateDraft = await run(
        authoringWorkflow.createBlueprintDraftWorkflow(ids.owner, {
          requestId: crypto.randomUUID(),
          organizationId: personalWorkspace!.id,
          content: { ...publicReview.content, name: `Private published ${suffix}` },
        })
      )
      const privatePublication = await run(
        authoringWorkflow.publishBlueprintDraftWorkflow(ids.owner, {
          id: privateDraft.id,
          expectedVersion: privateDraft.draftVersion,
        })
      )
      const unpublishedDraft = await run(
        authoringWorkflow.createBlueprintDraftWorkflow(ids.owner, {
          requestId: crypto.randomUUID(),
          organizationId: personalWorkspace!.id,
          content: { ...publicReview.content, name: `Unpublished draft ${suffix}` },
        })
      )
      const [privatePublishedRow] = await db
        .select()
        .from(blueprintTemplate)
        .where(eq(blueprintTemplate.id, privatePublication.id))
      expect(privatePublishedRow?.listedRevision).toBe(null)
      const [unpublishedRow] = await db
        .select()
        .from(blueprintTemplate)
        .where(eq(blueprintTemplate.id, unpublishedDraft.id))
      expect(unpublishedRow).toMatchObject({ publishedRevision: null, listedRevision: null })

      const installerMemberships = await db
        .select({ organizationId: member.organizationId })
        .from(member)
        .where(eq(member.userId, ids.installer))
      expect(installerMemberships).toEqual([])
      const initialCatalog = (await catalogFor(ids.installer)).entries
      const searchMatches = initialCatalog.filter(({ definition }) =>
        definition.blueprint.name.toLowerCase().includes('public garden celebration')
      )
      expect(searchMatches).toHaveLength(1)
      const publicEntry = searchMatches[0]!
      expect(publicEntry).toMatchObject({
        catalogKey: template!.catalogKey,
        revision: 1,
        discovery: { categories: ['events'], tags: [], summary: '' },
      })
      expect(initialCatalog).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            catalogKey: template!.catalogKey,
            revision: 1,
            definition: expect.objectContaining({
              blueprint: expect.objectContaining({ name: publicReview.content.name }),
            }),
            discovery: expect.objectContaining({ categories: ['events'] }),
          }),
        ])
      )
      expect(JSON.stringify(initialCatalog)).not.toContain('Source Event Must Stay Private')
      expect(initialCatalog.map(({ catalogKey }) => catalogKey)).not.toContain(
        privateDraft.catalogKey
      )
      expect(initialCatalog.map(({ catalogKey }) => catalogKey)).not.toContain(
        unpublishedDraft.catalogKey
      )

      phase = 'public preview, scheduling and two independent installations'
      const firstInput = installInput(
        template!.catalogKey,
        1,
        publicEntry.contentHash,
        crypto.randomUUID(),
        'First public copy'
      )
      const preview = await run(installWorkflow.previewBlueprintWorkflow(firstInput, ids.installer))
      expect(preview.plan.main.name).toBe('First public copy')
      const schedule = await run(
        scheduleWorkflow.scheduleBlueprintWorkflow(
          {
            catalogKey: template!.catalogKey,
            revision: 1,
            contentHash: publicEntry.contentHash,
            mainEvent: {
              startsAt: firstInput.mainEvent.startsAt,
              timeZone: firstInput.mainEvent.timeZone,
            },
          },
          ids.installer
        )
      )
      expect(schedule.suggestions).toEqual([])
      const firstCopy = await run(
        installWorkflow.installBlueprintWorkflow(actor(ids.installer), firstInput)
      )
      const secondInput = installInput(
        template!.catalogKey,
        1,
        publicEntry.contentHash,
        crypto.randomUUID(),
        'Second public copy'
      )
      const secondCopy = await run(
        installWorkflow.installBlueprintWorkflow(actor(ids.installer), secondInput)
      )
      expect(firstCopy.organizationID).not.toBe(secondCopy.organizationID)
      expect(firstCopy.scopeID).not.toBe(secondCopy.scopeID)
      expect(firstCopy.installationID).not.toBe(secondCopy.installationID)
      fixtureOrganizationIds.add(firstCopy.organizationID)
      fixtureOrganizationIds.add(secondCopy.organizationID)
      const sourceBeforeEdits = await db
        .select({ id: event.id, title: event.title, organizationId: event.organizationId })
        .from(event)
        .where(eq(event.id, ids.sourceEvent))
      await db
        .update(event)
        .set({ title: 'Edited first public copy only' })
        .where(eq(event.id, firstCopy.scopeID))
      const publicCopies = await db
        .select({ id: event.id, title: event.title, organizationId: event.organizationId })
        .from(event)
        .where(inArray(event.id, [firstCopy.scopeID, secondCopy.scopeID]))
      expect(publicCopies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: firstCopy.scopeID,
            title: 'Edited first public copy only',
          }),
          expect.objectContaining({ id: secondCopy.scopeID, title: 'Second public copy' }),
        ])
      )
      expect(
        await db
          .select({ id: event.id, title: event.title, organizationId: event.organizationId })
          .from(event)
          .where(eq(event.id, ids.sourceEvent))
      ).toEqual(sourceBeforeEdits)
      expect(
        await db
          .select({ id: eventParticipant.id })
          .from(eventParticipant)
          .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
          .where(
            and(
              eq(eventParticipant.eventId, ids.sourceEvent),
              eq(workspacePerson.userId, ids.installer)
            )
          )
      ).toEqual([])
      expect(
        await db
          .select({ organizationId: member.organizationId })
          .from(member)
          .where(
            and(
              eq(member.userId, ids.installer),
              inArray(member.organizationId, [ids.sourceOrganization, template!.organizationId])
            )
          )
      ).toEqual([])

      phase = 'only the exact listed immutable revision is public'
      const changedContent = { ...publicReview.content, name: `Private revision two ${suffix}` }
      const changedDraft = await run(
        authoringWorkflow.saveBlueprintDraftWorkflow(ids.owner, {
          id: created.templateId,
          expectedVersion: 1,
          content: changedContent,
        })
      )
      const secondPublication = await run(
        authoringWorkflow.publishBlueprintDraftWorkflow(ids.owner, {
          id: created.templateId,
          expectedVersion: changedDraft.draftVersion,
        })
      )
      expect(secondPublication.publication.revision).toBe(2)
      const stillPinned = await catalogFor(ids.installer)
      expect(
        stillPinned.entries.map(({ catalogKey, revision }) => [catalogKey, revision])
      ).toContainEqual([template!.catalogKey, 1])
      expect(Exit.isFailure(await runExit(revisionFor(template!.catalogKey, 2)))).toBe(true)

      const listedSecond = await run(
        linkManagementWorkflow.manageBlueprintLinksWorkflow(ids.owner, {
          action: 'listing',
          eventId: ids.sourceEvent,
          templateId: created.templateId,
          revision: 2,
        })
      )
      expect(listedSecond).toEqual({ listedRevision: 2 })
      expect(Exit.isFailure(await runExit(revisionFor(template!.catalogKey, 1)))).toBe(true)
      const revisionTwoCatalog = await catalogFor(ids.installer)
      expect(
        revisionTwoCatalog.entries.map(({ catalogKey, revision }) => [catalogKey, revision])
      ).toContainEqual([template!.catalogKey, 2])
      expect(revisionTwoCatalog.entries.map(({ catalogKey }) => catalogKey)).not.toContain(
        privateDraft.catalogKey
      )
      expect(revisionTwoCatalog.entries.map(({ catalogKey }) => catalogKey)).not.toContain(
        unpublishedDraft.catalogKey
      )
      const secondHash = revisionTwoCatalog.entries.find(
        ({ catalogKey }) => catalogKey === template!.catalogKey
      )!.contentHash
      expect((await run(revisionFor(template!.catalogKey, 2))).contentHash).toBe(secondHash)

      phase = 'revoked bearer token remains denied while the publication is public'
      const share = await run(
        sharingWorkflow.createBlueprintShareLinkWorkflow(ids.owner, {
          templateId: created.templateId,
          revision: 2,
        })
      )
      await run(
        sharingWorkflow.revokeBlueprintShareLinkWorkflow(ids.owner, {
          templateId: created.templateId,
          linkId: share.id,
        })
      )
      expect(Exit.isFailure(await runExit(revisionFor(template!.catalogKey, 2, share.token)))).toBe(
        true
      )
      expect((await run(revisionFor(template!.catalogKey, 2))).revision).toBe(2)

      phase = 'unlisting blocks new installs while completed receipts remain recoverable'
      expect(
        await run(
          linkManagementWorkflow.manageBlueprintLinksWorkflow(ids.owner, {
            action: 'listing',
            eventId: ids.sourceEvent,
            templateId: created.templateId,
            revision: null,
          })
        )
      ).toEqual({ listedRevision: null })
      expect(
        (await catalogFor(ids.installer)).entries.map(({ catalogKey }) => catalogKey)
      ).not.toContain(template!.catalogKey)
      const newAfterUnlist = installInput(
        template!.catalogKey,
        2,
        secondHash,
        crypto.randomUUID(),
        'Must not install after unlisting'
      )
      expect(
        Exit.isFailure(
          await runExit(
            installWorkflow.installBlueprintWorkflow(actor(ids.installer), newAfterUnlist)
          )
        )
      ).toBe(true)
      expect(
        await run(installWorkflow.installBlueprintWorkflow(actor(ids.installer), firstInput))
      ).toEqual(firstCopy)
      expect(
        await run(installWorkflow.blueprintStatusWorkflow(ids.installer, firstInput.requestId))
      ).toMatchObject({ state: 'completed', result: firstCopy })
    } catch (error) {
      throw new Error(`Public blueprint discovery integration failed during ${phase}`, {
        cause: error,
      })
    } finally {
      await db.delete(event).where(eq(event.id, ids.sourceEvent))
      await db.delete(organization).where(inArray(organization.id, [...fixtureOrganizationIds]))
      await db.delete(user).where(
        inArray(
          user.id,
          users.map(({ id }) => id)
        )
      )
      await database.pool.end()
    }
  }
)
