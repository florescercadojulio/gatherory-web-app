import { Cause, Effect, Exit, Layer } from 'effect'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'saved blueprint copies stay independent after source retirement or deletion',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the blueprint copy database test'
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
      contentContracts,
      seed,
      authoringRepoModule,
      authoringRepoLive,
      personalRepoModule,
      personalRepoLive,
      copyWorkflow,
      authContracts,
      runtimeContracts,
      blueprintRepoLive,
      previewWorkflow,
      scheduleWorkflow,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/contracts/blueprint-authoring.contracts'),
      import('@/db/seeds/cottage-template'),
      import('@/server/blueprints/repos/blueprint-authoring.repo'),
      import('@/server/blueprints/repos/blueprint-authoring.repo.live'),
      import('@/server/blueprints/repos/blueprint-personal.repo'),
      import('@/server/blueprints/repos/blueprint-personal.repo.live'),
      import('@/server/blueprints/workflows/blueprint-copy.workflow'),
      import('@/server/workspaces/connectors/better-auth.con'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprints/workflows/install-blueprint.workflow'),
      import('@/server/blueprints/workflows/schedule-blueprint.workflow'),
    ])

    const { db, PgClientLive } = database
    const { user, organization, member } = schema
    const { blueprintTemplate, blueprintRevision } = blueprintSchema
    const { BlueprintAuthoringRepo } = authoringRepoModule
    const { BlueprintPersonalRepo } = personalRepoModule
    const { BetterAuthWorkspaceCon } = authContracts
    const { BlueprintRepo } = runtimeContracts
    const { eq } = await import('drizzle-orm')
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ownerId = `copy-owner-${suffix}`
    const recipientId = `copy-recipient-${suffix}`
    const sourceOrgId = `copy-source-org-${suffix}`
    const recipientOrgId = `personal-${recipientId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
    const sourceTemplateId = crypto.randomUUID()
    const requestId = crypto.randomUUID()
    const sourceCatalogKey = `copy_source_${suffix}`
    const content = contentContracts.BlueprintDraftContentSchema.parse(
      structuredClone(seed.cottageDraftContent)
    )
    const copyLayer = authoringRepoLive.BlueprintAuthoringRepoLive.pipe(Layer.provide(PgClientLive))
    const personalLayer = personalRepoLive.BlueprintPersonalRepoLive.pipe(
      Layer.provide(PgClientLive)
    )
    const checkpoint = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
      afterProjection: () => Effect.void,
    })
    const runtimeLayer = blueprintRepoLive.BlueprintRepoLive.pipe(
      Layer.provide(Layer.mergeAll(PgClientLive, checkpoint))
    )
    const fakeAuth = Layer.succeed(BetterAuthWorkspaceCon, {
      listOrganizations: () => Effect.succeed([]),
      createOrganization: () => Effect.die('fixture personal organization must already exist'),
      setActiveOrganization: () => Effect.die('copy workflow must not switch workspaces'),
      listTeams: () => Effect.succeed([]),
      createTeam: () => Effect.die('copy workflow must not create teams'),
      addTeamMember: () => Effect.die('copy workflow must not change team membership'),
      setActiveTeam: () => Effect.die('copy workflow must not switch teams'),
    })
    const copyDependencies = Layer.mergeAll(copyLayer, personalLayer, fakeAuth)
    const run = <A, E, R, LE>(program: Effect.Effect<A, E, R>, layer: Layer.Layer<R, LE, never>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))

    try {
      await db.insert(user).values([
        {
          id: ownerId,
          name: 'Copy source owner',
          email: `${ownerId}@example.test`,
          emailVerified: true,
        },
        {
          id: recipientId,
          name: 'Copy recipient',
          email: `${recipientId}@example.test`,
          emailVerified: true,
        },
      ])
      await db.insert(organization).values([
        {
          id: sourceOrgId,
          name: 'Blueprint copy source fixture',
          slug: `copy-source-${suffix}`,
          workspaceType: 'event',
          createdAt: new Date(),
        },
        {
          id: recipientOrgId,
          name: 'Blueprint copy recipient fixture',
          slug: recipientOrgId,
          workspaceType: 'event',
          createdAt: new Date(),
        },
      ])
      await db.insert(member).values([
        {
          id: crypto.randomUUID(),
          organizationId: sourceOrgId,
          userId: ownerId,
          role: 'owner',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          organizationId: recipientOrgId,
          userId: recipientId,
          role: 'owner',
          createdAt: new Date(),
        },
      ])

      const sourceDefinition = contentContracts.draftDefinition(content, sourceCatalogKey, 1)
      await db.insert(blueprintTemplate).values({
        id: sourceTemplateId,
        catalogKey: sourceCatalogKey,
        organizationId: sourceOrgId,
        createdByUserId: ownerId,
        createRequestId: crypto.randomUUID(),
        createRequestHash: 'a'.repeat(64),
        content,
        creatorName: 'Source Host',
        draftVersion: 1,
        publishedRevision: 1,
        publishedDraftVersion: 1,
      })
      await db.insert(blueprintRevision).values({
        templateId: sourceTemplateId,
        draftVersion: 1,
        catalogKey: sourceCatalogKey,
        revision: 1,
        document: sourceDefinition,
        contentHash: (await import('@/server/blueprints/planning/blueprint-hash')).blueprintHash(
          sourceDefinition
        ),
        description: content.description,
      })

      // Withdraw the authoring source before the recipient submits their
      // already-saved content snapshot.
      await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintAuthoringRepo
          return yield* repo.retire(ownerId, sourceTemplateId)
        }),
        copyLayer
      )
      const withdrawnLookup = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const repo = yield* BlueprintRepo
          return yield* repo.revision(sourceCatalogKey, 1, ownerId)
        }).pipe(Effect.provide(runtimeLayer))
      )
      expect(
        Exit.match(withdrawnLookup, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })

      const actor = { id: recipientId, name: 'Copy recipient' }
      const copied = await run(
        copyWorkflow.createBlueprintCopyWorkflow(actor, { requestId, content }),
        copyDependencies
      )
      expect(copied).toMatchObject({
        draftVersion: 1,
        publishedRevision: 1,
        listedRevision: null,
        creatorName: null,
        activeShareLinkCount: 0,
        catalogEntry: { revision: 1, definition: { blueprint: { name: content.name } } },
      })
      expect(copied.catalogEntry.catalogKey).not.toBe(sourceCatalogKey)
      expect(copied.catalogEntry.creator).toBeUndefined()

      const repeated = await run(
        copyWorkflow.createBlueprintCopyWorkflow(actor, { requestId, content }),
        copyDependencies
      )
      expect(repeated).toEqual(copied)
      const differentContent = { ...content, name: `${content.name} changed` }
      const conflictingReplay = await Effect.runPromiseExit(
        copyWorkflow
          .createBlueprintCopyWorkflow(actor, { requestId, content: differentContent })
          .pipe(Effect.provide(copyDependencies))
      )
      expect(
        Exit.match(conflictingReplay, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_COPY_REQUEST_CONFLICT' })

      const listed = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.list(recipientId)
        }),
        personalLayer
      )
      expect(listed.templates.some((template) => template.id === copied.id)).toBe(false)

      const published = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintPersonalRepo
          return yield* repo.publish(recipientId, { id: copied.id, expectedVersion: 1 })
        }),
        personalLayer
      )
      expect(published).toMatchObject({
        id: copied.id,
        publishedRevision: 1,
        listedRevision: 1,
        catalogEntry: { definition: copied.catalogEntry.definition },
      })

      // Recipient-side preview, schedule, and revision resolution all use the
      // generated private key and work without any live source template.
      const revision = await run(
        Effect.gen(function* () {
          const repo = yield* BlueprintRepo
          return yield* repo.revision(
            copied.catalogEntry.catalogKey,
            copied.catalogEntry.revision,
            recipientId
          )
        }),
        runtimeLayer
      )
      expect(revision.contentHash).toBe(copied.catalogEntry.contentHash)
      expect(revision.definition).toEqual(copied.catalogEntry.definition)

      const childStart = '2027-06-11T16:00:00.000Z'
      const installInput = {
        requestId: crypto.randomUUID(),
        catalogKey: copied.catalogEntry.catalogKey,
        revision: copied.catalogEntry.revision,
        contentHash: copied.catalogEntry.contentHash,
        selectedChildren: content.children.map(({ key }) => ({ key, startsAt: childStart })),
        selectedIdeaKeys: content.ideas.map(({ key }) => key),
        mainEvent: {
          name: 'Recipient copy preview',
          startsAt: '2027-06-12T16:00:00.000Z',
          timeZone: 'America/Detroit',
        },
        capabilities: [
          'event.children_v1',
          'planning.ideas_v2',
          'planning.instructions_v1',
          'planning.portable_idea_config_v1',
        ],
      }
      const preview = await run(
        previewWorkflow.previewBlueprintWorkflow(installInput, recipientId),
        runtimeLayer
      )
      expect(preview.contentHash).toBe(copied.catalogEntry.contentHash)
      const scheduled = await run(
        scheduleWorkflow.scheduleBlueprintWorkflow(
          {
            catalogKey: copied.catalogEntry.catalogKey,
            revision: copied.catalogEntry.revision,
            contentHash: copied.catalogEntry.contentHash,
            mainEvent: {
              startsAt: installInput.mainEvent.startsAt,
              timeZone: installInput.mainEvent.timeZone,
            },
          },
          recipientId
        ),
        runtimeLayer
      )
      expect(scheduled.suggestions.length).toBeGreaterThan(0)

      const [sourceAfter, copyAfter] = await Promise.all([
        db.select().from(blueprintTemplate).where(eq(blueprintTemplate.id, sourceTemplateId)),
        db.select().from(blueprintTemplate).where(eq(blueprintTemplate.id, copied.id)),
      ])
      expect(sourceAfter).toHaveLength(1)
      expect(sourceAfter[0]?.retiredAt).toBeInstanceOf(Date)
      expect(copyAfter[0]).toMatchObject({
        createdByUserId: recipientId,
        organizationId: recipientOrgId,
        content,
        listedRevision: 1,
      })
    } finally {
      await db.delete(organization).where(eq(organization.id, sourceOrgId))
      await db.delete(organization).where(eq(organization.id, recipientOrgId))
      await db.delete(user).where(eq(user.id, ownerId))
      await db.delete(user).where(eq(user.id, recipientId))
    }
  }
)
