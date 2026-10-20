import { expect, test } from 'vitest'
import { Effect, Exit, Layer } from 'effect'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)('unlisted blueprint links stay scoped, pinned, and revocable', async () => {
  const databaseUrl = process.env.DATABASE_URL
  expect(databaseUrl, 'DATABASE_URL is required for the opt-in sharing database test').toBeTruthy()
  const databaseHost = new URL(databaseUrl!).hostname
  expect(
    ['localhost', '127.0.0.1', '[::1]'],
    `Refusing non-local database host ${databaseHost}`
  ).toContain(databaseHost)

  const [
    database,
    schema,
    blueprintSchema,
    runtimeContracts,
    sharingRepoTag,
    sharingRepoModule,
    blueprintRepoModule,
    installWorkflow,
    scheduleWorkflow,
    catalogMapper,
    cottageSeed,
    hashing,
    shareTokenTools,
    authContracts,
  ] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
    import('@/db/schema/blueprint.schema'),
    import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
    import('@/server/blueprints/repos/blueprint-sharing.repo'),
    import('@/server/blueprints/repos/blueprint-sharing.repo.live'),
    import('@/server/blueprints/repos/blueprint.repo.live'),
    import('@/server/blueprints/workflows/install-blueprint.workflow'),
    import('@/server/blueprints/workflows/schedule-blueprint.workflow'),
    import('@/server/blueprints/services/blueprint-discovery'),
    import('@/db/seeds/cottage-template'),
    import('@/server/blueprints/planning/blueprint-hash'),
    import('@/server/blueprints/planning/blueprint-share-token.server'),
    import('@/server/workspaces/connectors/better-auth.con'),
  ])
  const { db, PgClientLive } = database
  const { user, organization, member, event, workspacePerson, eventParticipant } = schema
  const statusWorkflow = installWorkflow
  const { blueprintTemplate, blueprintRevision, blueprintInstallation } = blueprintSchema
  const { BlueprintRepo } = runtimeContracts
  const { BlueprintSharingRepo } = sharingRepoTag
  const { and, eq, inArray } = await import('drizzle-orm')
  const suffix = crypto.randomUUID().replaceAll('-', '')
  const ids = {
    owner: `share-owner-${suffix}`,
    installer: `share-installer-${suffix}`,
    unrelated: `share-unrelated-${suffix}`,
    organization: `share-owner-workspace-${suffix}`,
    templateA: crypto.randomUUID(),
    templateB: crypto.randomUUID(),
    sourceEvent: crypto.randomUUID(),
    sourceOwnerPerson: crypto.randomUUID(),
  }
  const users = [ids.owner, ids.installer, ids.unrelated].map((id) => ({
    id,
    name: id,
    email: `${id}@example.test`,
  }))
  const fixtureOrganizations = new Set<string>([ids.organization])
  const fixtureUsers = users.map(({ id }) => id)
  const now = new Date()
  const definition = (catalogKey: string, revision: number, name: string) => {
    const document = structuredClone(cottageSeed.cottageBlueprintDefinition)
    document.blueprint.id = catalogKey
    document.blueprint.revision = revision
    document.blueprint.name = name
    return document
  }
  const catalogKeyA = `share_a_${suffix}`
  const catalogKeyB = `share_b_${suffix}`
  const definitionA1 = definition(catalogKeyA, 1, 'Private Cottage Template')
  const definitionA2 = definition(catalogKeyA, 2, 'Updated Private Cottage Template')
  const definitionB1 = definition(catalogKeyB, 1, 'Separate Private Template')
  const contentA = structuredClone(cottageSeed.cottageDraftContent)
  const contentB = { ...structuredClone(contentA), name: 'Separate private draft' }
  const hashA1 = hashing.blueprintHash(definitionA1)
  const hashA2 = hashing.blueprintHash(definitionA2)
  const hashB1 = hashing.blueprintHash(definitionB1)
  const shareRepo = sharingRepoModule.BlueprintSharingRepoLive.pipe(Layer.provide(PgClientLive))
  let holdNextCompletion = false
  let signalCompletionStarted!: () => void
  let resumeCompletion!: () => void
  const completionStarted = new Promise<void>((resolve) => {
    signalCompletionStarted = resolve
  })
  const completionGate = new Promise<void>((resolve) => {
    resumeCompletion = resolve
  })
  const installCheckpoint = Layer.succeed(runtimeContracts.BlueprintInstallCheckpoint, {
    afterProjection: () => {
      if (!holdNextCompletion) return Effect.void
      holdNextCompletion = false
      return Effect.promise(async () => {
        signalCompletionStarted()
        await completionGate
      })
    },
  })
  const blueprintRepo = blueprintRepoModule.BlueprintRepoLive.pipe(
    Layer.provide(Layer.mergeAll(PgClientLive, installCheckpoint))
  )

  let pauseProvisioning = false
  let pendingInstall: Promise<unknown> | undefined
  let completionRaceInstall: Promise<unknown> | undefined
  let completionRevocationFinished = false
  let provisionStarted!: () => void
  let allowProvisionToFinish!: () => void
  const provisioningStarted = new Promise<void>((resolve) => {
    provisionStarted = resolve
  })
  const provisioningGate = new Promise<void>((resolve) => {
    allowProvisionToFinish = resolve
  })
  const fakeAuth = Layer.succeed(authContracts.BetterAuthWorkspaceCon, {
    listOrganizations: () => Effect.succeed([]),
    createOrganization: (input) =>
      Effect.tryPromise({
        try: async () => {
          const id = `shared-copy-${crypto.randomUUID()}`
          const createdAt = new Date()
          await db.insert(organization).values({
            id,
            name: input.name,
            slug: input.slug,
            createdAt,
            workspaceType: 'event',
          })
          await db.insert(member).values({
            id: `shared-copy-member-${crypto.randomUUID()}`,
            organizationId: id,
            userId: input.userId!,
            role: 'owner',
            createdAt,
          })
          fixtureOrganizations.add(id)
          if (pauseProvisioning) {
            pauseProvisioning = false
            provisionStarted()
            await provisioningGate
          }
          return { id, name: input.name, slug: input.slug, workspaceType: 'event' }
        },
        catch: (cause) =>
          new authContracts.BetterAuthWorkspaceError({
            category: 'external',
            code: 'SHARING_TEST_AUTH_FAILURE',
            userMessageKey: 'serverErrors.SYSTEM',
            cause,
          }),
      }),
    setActiveOrganization: () => Effect.die('shared blueprint install must not switch workspaces'),
    listTeams: () => Effect.succeed([]),
    createTeam: () => Effect.die('unexpected team creation'),
    addTeamMember: () => Effect.die('unexpected team membership'),
    setActiveTeam: () => Effect.die('unexpected active team'),
  })
  const layer = Layer.mergeAll(shareRepo, blueprintRepo, fakeAuth)
  type Dependencies = Layer.Success<typeof layer>
  const run = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
    Effect.runPromise(program.pipe(Effect.provide(layer)))
  const runExit = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
    Effect.runPromise(Effect.exit(program.pipe(Effect.provide(layer))))
  const createLink = (actorId: string, input: { templateId: string; revision: number }) =>
    run(
      Effect.gen(function* () {
        const repo = yield* BlueprintSharingRepo
        return yield* repo.create(actorId, input)
      })
    )
  const listLinks = (actorId: string, templateId: string) =>
    run(
      Effect.gen(function* () {
        const repo = yield* BlueprintSharingRepo
        return yield* repo.list(actorId, templateId)
      })
    )
  const revokeLink = (actorId: string, input: { templateId: string; linkId: string }) =>
    run(
      Effect.gen(function* () {
        const repo = yield* BlueprintSharingRepo
        return yield* repo.revoke(actorId, input)
      })
    )
  const resolveLink = (token: string) =>
    run(
      Effect.gen(function* () {
        const repo = yield* BlueprintSharingRepo
        return yield* repo.resolve(token)
      })
    )
  const getRevision = (
    catalogKey: string,
    revision: number,
    actorId: string,
    shareToken?: string
  ) =>
    Effect.gen(function* () {
      const repo = yield* BlueprintRepo
      return yield* repo.revision(catalogKey, revision, actorId, shareToken)
    })
  const insertTemplate = async (
    templateId: string,
    key: string,
    content: typeof contentA,
    revisions: Array<{ revision: number; document: typeof definitionA1; contentHash: string }>
  ) => {
    await db.insert(blueprintTemplate).values({
      id: templateId,
      catalogKey: key,
      organizationId: ids.organization,
      createdByUserId: ids.owner,
      createRequestId: crypto.randomUUID(),
      createRequestHash: hashing.blueprintHash({ templateId, key }),
      content,
      draftVersion: revisions.length,
      publishedRevision: Math.max(...revisions.map(({ revision }) => revision)),
      publishedDraftVersion: revisions.length,
      source: {
        kind: 'event',
        eventId: ids.sourceEvent,
        selection: {
          childIds: [],
          ideaIds: [],
          instructionIds: [],
          todoIds: [],
          includeIdeaNotes: false,
        },
        capturedContent: content,
      },
      createdAt: now,
      updatedAt: now,
    })
    await db.insert(blueprintRevision).values(
      revisions.map(({ revision, document, contentHash }) => ({
        templateId,
        draftVersion: revision,
        description: `Private description for ${key} revision ${revision}`,
        catalogKey: key,
        revision,
        contentHash,
        document,
        createdAt: now,
      }))
    )
  }
  const makeInstallInput = (
    catalogKey: string,
    revision: number,
    contentHash: string,
    requestId: string,
    name: string,
    shareToken: string
  ) => ({
    requestId,
    catalogKey,
    revision,
    contentHash,
    shareToken,
    mainEvent: {
      name,
      startsAt: '2030-08-17T15:00:00.000Z',
      timeZone: 'America/Detroit',
    },
    selectedChildren: [
      { key: 'arrival', startsAt: '2030-08-17T15:00:00.000Z' },
      { key: 'shared_day', startsAt: '2030-08-18T14:00:00.000Z' },
    ],
    selectedIdeaKeys: ['meals', 'local_outings'],
    capabilities: [
      'event.children_v1',
      'planning.ideas_v2',
      'planning.instructions_v1',
      'planning.portable_idea_config_v1',
    ],
  })
  let phase = 'fixture setup'

  try {
    await db.insert(user).values(users.map((item) => ({ ...item, emailVerified: true })))
    await db.insert(organization).values({
      id: ids.organization,
      name: 'Unlisted link fixture owner workspace',
      slug: `share-owner-${suffix}`,
      createdAt: now,
      workspaceType: 'event',
    })
    await db.insert(member).values({
      id: `share-owner-membership-${suffix}`,
      organizationId: ids.organization,
      userId: ids.owner,
      role: 'owner',
      createdAt: now,
    })
    await db.insert(workspacePerson).values({
      id: ids.sourceOwnerPerson,
      organizationId: ids.organization,
      userId: ids.owner,
      displayName: 'Private source event host',
    })
    await db.insert(event).values({
      id: ids.sourceEvent,
      organizationId: ids.organization,
      title: 'Private source event',
      status: 'draft',
      startsAt: new Date('2030-08-17T15:00:00.000Z'),
      timeZone: 'America/Detroit',
      createdByUserId: ids.owner,
    })
    await db.insert(eventParticipant).values({
      id: crypto.randomUUID(),
      eventId: ids.sourceEvent,
      personId: ids.sourceOwnerPerson,
      role: 'host',
      planningPermission: 'manage',
    })
    await insertTemplate(ids.templateA, catalogKeyA, contentA, [
      { revision: 1, document: definitionA1, contentHash: hashA1 },
      { revision: 2, document: definitionA2, contentHash: hashA2 },
    ])
    await insertTemplate(ids.templateB, catalogKeyB, contentB, [
      { revision: 1, document: definitionB1, contentHash: hashB1 },
    ])

    phase = 'owner-only create, list, and anonymous-safe resolution'
    const linkA1 = await createLink(ids.owner, { templateId: ids.templateA, revision: 1 })
    const linkA2 = await createLink(ids.owner, { templateId: ids.templateA, revision: 2 })
    const linkB1 = await createLink(ids.owner, { templateId: ids.templateB, revision: 1 })
    const linkBRetirement = await createLink(ids.owner, { templateId: ids.templateB, revision: 1 })
    expect(linkA1).toMatchObject({
      id: expect.any(String),
      revision: 1,
      createdAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
      revokedAt: null,
      token: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(await listLinks(ids.owner, ids.templateA)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: linkA1.id, revision: 1, revokedAt: null }),
        expect.objectContaining({ id: linkA2.id, revision: 2, revokedAt: null }),
      ])
    )
    expect(JSON.stringify(await listLinks(ids.owner, ids.templateA))).not.toContain(linkA1.token)
    expect(
      Exit.isFailure(
        await runExit(
          Effect.gen(function* () {
            const repo = yield* BlueprintSharingRepo
            return yield* repo.create(ids.installer, { templateId: ids.templateA, revision: 1 })
          })
        )
      )
    ).toBe(true)
    expect(
      Exit.isFailure(
        await runExit(
          Effect.gen(function* () {
            const repo = yield* BlueprintSharingRepo
            return yield* repo.list(ids.installer, ids.templateA)
          })
        )
      )
    ).toBe(true)
    expect(
      Exit.isFailure(
        await runExit(
          Effect.gen(function* () {
            const repo = yield* BlueprintSharingRepo
            return yield* repo.revoke(ids.installer, {
              templateId: ids.templateA,
              linkId: linkA1.id,
            })
          })
        )
      )
    ).toBe(true)

    const resolvedA1 = await resolveLink(linkA1.token)
    expect(resolvedA1).toMatchObject({
      id: expect.any(String),
      catalogKey: catalogKeyA,
      revision: 1,
      contentHash: hashA1,
      description: 'Private description for ' + catalogKeyA + ' revision 1',
    })
    expect(Object.keys(resolvedA1).sort()).toEqual(
      ['id', 'catalogKey', 'revision', 'contentHash', 'definition', 'description'].sort()
    )
    const anonymousCatalog = catalogMapper.buildBlueprintCatalog([resolvedA1])
    expect(anonymousCatalog.entries).toHaveLength(1)
    expect(anonymousCatalog.entries[0]).toMatchObject({ catalogKey: catalogKeyA, revision: 1 })
    expect(Object.keys(anonymousCatalog.entries[0]!).sort()).toEqual(
      ['catalogKey', 'revision', 'contentHash', 'definition', 'discovery'].sort()
    )
    const installerCatalog = await run(
      Effect.gen(function* () {
        const repo = yield* BlueprintRepo
        return yield* repo.catalog(ids.installer)
      })
    )
    expect(installerCatalog.map(({ catalogKey }) => catalogKey)).not.toContain(catalogKeyA)
    expect(installerCatalog.map(({ catalogKey }) => catalogKey)).not.toContain(catalogKeyB)
    const ownerCatalog = await run(
      Effect.gen(function* () {
        const repo = yield* BlueprintRepo
        return yield* repo.catalog(ids.owner)
      })
    )
    expect(ownerCatalog.map(({ catalogKey }) => catalogKey)).not.toContain(catalogKeyA)
    expect(ownerCatalog.map(({ catalogKey }) => catalogKey)).not.toContain(catalogKeyB)
    expect(Exit.isFailure(await runExit(getRevision(catalogKeyA, 1, ids.installer)))).toBe(true)

    phase = 'link grants only its pinned revision to preview and scheduling'
    expect(await run(getRevision(catalogKeyA, 1, ids.installer, linkA1.token))).toMatchObject({
      catalogKey: catalogKeyA,
      revision: 1,
      contentHash: hashA1,
    })
    expect(
      Exit.isFailure(await runExit(getRevision(catalogKeyA, 2, ids.installer, linkA1.token)))
    ).toBe(true)
    const installInput1 = makeInstallInput(
      catalogKeyA,
      1,
      hashA1,
      crypto.randomUUID(),
      'First independent cottage copy',
      linkA1.token
    )
    const preview = await run(
      installWorkflow.previewBlueprintWorkflow(installInput1, ids.installer)
    )
    expect(preview.plan.main.name).toBe('First independent cottage copy')
    const schedule = await run(
      scheduleWorkflow.scheduleBlueprintWorkflow(
        {
          catalogKey: catalogKeyA,
          revision: 1,
          contentHash: hashA1,
          shareToken: linkA1.token,
          mainEvent: { startsAt: installInput1.mainEvent.startsAt, timeZone: 'America/Detroit' },
        },
        ids.installer
      )
    )
    expect(schedule.suggestions.length).toBeGreaterThan(0)
    expect(
      Exit.isFailure(
        await runExit(
          installWorkflow.previewBlueprintWorkflow(
            { ...installInput1, catalogKey: catalogKeyB, revision: 1, contentHash: hashB1 },
            ids.installer
          )
        )
      )
    ).toBe(true)

    phase = 'independent installs and completed receipt retry after revocation'
    const firstResult = await run(
      installWorkflow.installBlueprintWorkflow(
        { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
        installInput1
      )
    )
    const installInput2 = makeInstallInput(
      catalogKeyA,
      1,
      hashA1,
      crypto.randomUUID(),
      'Second independent cottage copy',
      linkA1.token
    )
    const secondResult = await run(
      installWorkflow.installBlueprintWorkflow(
        { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
        installInput2
      )
    )
    expect(firstResult.organizationID).not.toBe(secondResult.organizationID)
    expect(firstResult.scopeID).not.toBe(secondResult.scopeID)
    const copies = await db
      .select({ id: event.id, organizationId: event.organizationId, title: event.title })
      .from(event)
      .where(inArray(event.id, [firstResult.scopeID, secondResult.scopeID]))
    expect(copies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'First independent cottage copy' }),
        expect.objectContaining({ title: 'Second independent cottage copy' }),
      ])
    )
    await db
      .update(event)
      .set({ title: 'Edited first copy only' })
      .where(eq(event.id, firstResult.scopeID))
    const independentlyEditedCopies = await db
      .select({ id: event.id, title: event.title })
      .from(event)
      .where(inArray(event.id, [firstResult.scopeID, secondResult.scopeID]))
    expect(independentlyEditedCopies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstResult.scopeID, title: 'Edited first copy only' }),
        expect.objectContaining({
          id: secondResult.scopeID,
          title: 'Second independent cottage copy',
        }),
      ])
    )
    expect(
      await db
        .select()
        .from(member)
        .where(and(eq(member.organizationId, ids.organization), eq(member.userId, ids.installer)))
    ).toHaveLength(0)
    const sourceParticipation = await db
      .select({ id: eventParticipant.id })
      .from(eventParticipant)
      .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
      .where(
        and(
          eq(eventParticipant.eventId, ids.sourceEvent),
          eq(workspacePerson.userId, ids.installer)
        )
      )
    expect(sourceParticipation).toEqual([])
    expect(
      await db
        .select({ id: eventParticipant.id })
        .from(eventParticipant)
        .where(eq(eventParticipant.eventId, ids.sourceEvent))
    ).toHaveLength(1)

    phase = 'revocation waits for in-flight completion after provider returns'
    const postProviderInput = makeInstallInput(
      catalogKeyB,
      1,
      hashB1,
      crypto.randomUUID(),
      'Completion wins a concurrent revocation',
      linkB1.token
    )
    holdNextCompletion = true
    const completionResultPromise = run(
      installWorkflow.installBlueprintWorkflow(
        { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
        postProviderInput
      )
    )
    completionRaceInstall = completionResultPromise
    await completionStarted
    const provisionedReceipt = await db
      .select()
      .from(blueprintInstallation)
      .where(
        and(
          eq(blueprintInstallation.actorUserId, ids.installer),
          eq(blueprintInstallation.requestId, postProviderInput.requestId)
        )
      )
    expect(provisionedReceipt).toHaveLength(1)
    expect(provisionedReceipt[0]).toMatchObject({
      state: 'provisioned',
      organizationId: expect.any(String),
    })
    const revokeDuringCompletion = revokeLink(ids.owner, {
      templateId: ids.templateB,
      linkId: linkB1.id,
    }).then(() => {
      completionRevocationFinished = true
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(completionRevocationFinished).toBe(false)
    resumeCompletion()
    const postProviderResult = await completionResultPromise
    await revokeDuringCompletion
    expect(postProviderResult.organizationID).toBeTruthy()
    expect(completionRevocationFinished).toBe(true)
    expect(
      await run(statusWorkflow.blueprintStatusWorkflow(ids.installer, postProviderInput.requestId))
    ).toMatchObject({ state: 'completed', result: postProviderResult })

    const installedReceipt = await db
      .select()
      .from(blueprintInstallation)
      .where(
        and(
          eq(blueprintInstallation.actorUserId, ids.installer),
          eq(blueprintInstallation.requestId, installInput1.requestId)
        )
      )
    expect(installedReceipt).toHaveLength(1)
    expect(installedReceipt[0]?.shareTokenHash).toBe(
      shareTokenTools.hashBlueprintShareToken(linkA1.token)
    )

    await revokeLink(ids.owner, { templateId: ids.templateA, linkId: linkA1.id })
    expect(await listLinks(ids.owner, ids.templateA)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: linkA1.id, revision: 1, revokedAt: expect.any(String) }),
      ])
    )
    expect(
      Exit.isFailure(
        await runExit(
          Effect.gen(function* () {
            const repo = yield* BlueprintSharingRepo
            return yield* repo.resolve(linkA1.token)
          })
        )
      )
    ).toBe(true)
    expect(
      Exit.isFailure(
        await runExit(installWorkflow.previewBlueprintWorkflow(installInput1, ids.installer))
      )
    ).toBe(true)
    expect(
      Exit.isFailure(
        await runExit(
          scheduleWorkflow.scheduleBlueprintWorkflow(
            {
              catalogKey: catalogKeyA,
              revision: 1,
              contentHash: hashA1,
              shareToken: linkA1.token,
              mainEvent: {
                startsAt: installInput1.mainEvent.startsAt,
                timeZone: 'America/Detroit',
              },
            },
            ids.installer
          )
        )
      )
    ).toBe(true)
    expect(
      await run(
        installWorkflow.installBlueprintWorkflow(
          { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
          installInput1
        )
      )
    ).toEqual(firstResult)
    expect(
      await run(statusWorkflow.blueprintStatusWorkflow(ids.installer, installInput1.requestId))
    ).toMatchObject({ state: 'completed', result: firstResult })
    const installAfterRevocation = makeInstallInput(
      catalogKeyA,
      1,
      hashA1,
      crypto.randomUUID(),
      'Should not be installed',
      linkA1.token
    )
    expect(
      Exit.isFailure(
        await runExit(
          installWorkflow.installBlueprintWorkflow(
            { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
            installAfterRevocation
          )
        )
      )
    ).toBe(true)

    phase = 'pending install loses access when its link is revoked before completion'
    const pendingInput = makeInstallInput(
      catalogKeyA,
      2,
      hashA2,
      crypto.randomUUID(),
      'Revoked while provisioning',
      linkA2.token
    )
    pauseProvisioning = true
    pendingInstall = run(
      installWorkflow.installBlueprintWorkflow(
        { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
        pendingInput
      )
    )
    await provisioningStarted
    const pendingRows = await db
      .select()
      .from(blueprintInstallation)
      .where(
        and(
          eq(blueprintInstallation.actorUserId, ids.installer),
          eq(blueprintInstallation.requestId, pendingInput.requestId)
        )
      )
    expect(pendingRows).toHaveLength(1)
    expect(pendingRows[0]?.state).not.toBe('completed')
    await revokeLink(ids.owner, { templateId: ids.templateA, linkId: linkA2.id })
    allowProvisionToFinish()
    await expect(pendingInstall).rejects.toBeDefined()
    const revokedPending = await db
      .select()
      .from(blueprintInstallation)
      .where(eq(blueprintInstallation.id, pendingRows[0]!.id))
    expect(revokedPending[0]?.state).not.toBe('completed')
    if (revokedPending[0]?.mainEventId) {
      expect(
        await db.select().from(event).where(eq(event.id, revokedPending[0].mainEventId))
      ).toEqual([])
    }

    phase = 'cross-template token is denied'
    expect(
      Exit.isFailure(
        await runExit(
          installWorkflow.previewBlueprintWorkflow(
            makeInstallInput(
              catalogKeyB,
              1,
              hashB1,
              crypto.randomUUID(),
              'Cross-template attempt',
              linkA1.token
            ),
            ids.installer
          )
        )
      )
    ).toBe(true)

    phase = 'completed receipts and installed copies survive source retirement and deletion'
    const durableCopyInput = makeInstallInput(
      catalogKeyB,
      1,
      hashB1,
      crypto.randomUUID(),
      'Independent copy survives source removal',
      linkBRetirement.token
    )
    const durableCopyResult = await run(
      installWorkflow.installBlueprintWorkflow(
        { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
        durableCopyInput
      )
    )
    await db
      .update(blueprintRevision)
      .set({ retiredAt: new Date() })
      .where(and(eq(blueprintRevision.catalogKey, catalogKeyB), eq(blueprintRevision.revision, 1)))
    await db
      .update(blueprintTemplate)
      .set({ retiredAt: new Date() })
      .where(eq(blueprintTemplate.id, ids.templateB))
    expect(
      Exit.isFailure(
        await runExit(
          Effect.gen(function* () {
            const repo = yield* BlueprintSharingRepo
            return yield* repo.resolve(linkBRetirement.token)
          })
        )
      )
    ).toBe(true)
    expect(
      await run(statusWorkflow.blueprintStatusWorkflow(ids.installer, durableCopyInput.requestId))
    ).toMatchObject({ state: 'completed', result: durableCopyResult })
    expect(
      await run(
        installWorkflow.installBlueprintWorkflow(
          { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
          durableCopyInput
        )
      )
    ).toEqual(durableCopyResult)

    await db.delete(blueprintTemplate).where(eq(blueprintTemplate.id, ids.templateB))
    const completedAfterSourceDelete = await db
      .select()
      .from(blueprintInstallation)
      .where(
        and(
          eq(blueprintInstallation.actorUserId, ids.installer),
          eq(blueprintInstallation.requestId, durableCopyInput.requestId)
        )
      )
    expect(completedAfterSourceDelete).toHaveLength(1)
    expect(completedAfterSourceDelete[0]).toMatchObject({
      revisionId: null,
      state: 'completed',
      result: durableCopyResult,
    })
    expect(
      await db
        .select({ id: event.id, title: event.title, organizationId: event.organizationId })
        .from(event)
        .where(eq(event.id, durableCopyResult.scopeID))
    ).toEqual([
      expect.objectContaining({
        id: durableCopyResult.scopeID,
        title: 'Independent copy survives source removal',
        organizationId: durableCopyResult.organizationID,
      }),
    ])
    expect(
      await run(statusWorkflow.blueprintStatusWorkflow(ids.installer, durableCopyInput.requestId))
    ).toMatchObject({ state: 'completed', result: durableCopyResult })
    expect(
      await run(
        installWorkflow.installBlueprintWorkflow(
          { id: ids.installer, name: 'Installer', email: `${ids.installer}@example.test` },
          durableCopyInput
        )
      )
    ).toEqual(durableCopyResult)
  } catch (error) {
    throw new Error(`Blueprint sharing integration failed during ${phase}`, { cause: error })
  } finally {
    resumeCompletion()
    allowProvisionToFinish()
    await pendingInstall?.catch(() => undefined)
    await completionRaceInstall?.catch(() => undefined)
    await db.delete(organization).where(inArray(organization.id, [...fixtureOrganizations]))
    await db.delete(user).where(inArray(user.id, fixtureUsers))
    await database.pool.end()
  }
})
