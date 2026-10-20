import { expect, test } from 'vitest'
import { Cause, Effect, Exit, Layer } from 'effect'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'personal blueprint save and withdrawal preserve publication history',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the personal blueprint database test'
    ).toBeTruthy()
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${new URL(databaseUrl!).hostname}`
    ).toContain(new URL(databaseUrl!).hostname)

    const [
      database,
      schema,
      blueprintSchema,
      authoring,
      blueprintRuntime,
      blueprintRepo,
      personalRepoModule,
      sharing,
      contentContracts,
      hashModule,
      planning,
      seed,
      installationFixtures,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/server/blueprints/repos/blueprint-personal.repo.live'),
      import('@/server/blueprints/contracts/blueprint-runtime.contracts'),
      import('@/server/blueprints/repos/blueprint.repo.live'),
      import('@/server/blueprints/repos/blueprint-personal.repo'),
      import('@/server/blueprints/planning/blueprint-share-token.server'),
      import('@/contracts/blueprint-authoring.contracts'),
      import('@/server/blueprints/planning/blueprint-hash'),
      import('@/server/blueprints/planning/plan-blueprint-installation'),
      import('@/db/seeds/cottage-template'),
      import('../helpers/cottage-installation-fixtures'),
    ])
    const { db, PgClientLive } = database
    const { user, organization, member } = schema
    const { blueprintTemplate, blueprintRevision, blueprintShareLink, blueprintInstallation } =
      blueprintSchema
    const actorId = `personal-${crypto.randomUUID()}`
    const recipientId = `recipient-${crypto.randomUUID()}`
    const strangerId = `stranger-${crypto.randomUUID()}`
    const orgId = `personal-org-${crypto.randomUUID()}`
    const slug = `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
    const templateId = crypto.randomUUID()
    const linkToken = crypto.randomUUID().replaceAll('-', '').padEnd(64, 'a')
    const linkTokenHash = sharing.hashBlueprintShareToken(linkToken)
    const catalogKey = `private_${templateId.replaceAll('-', '')}`
    const content = contentContracts.BlueprintDraftContentSchema.parse(seed.cottageDraftContent)
    const fixtureInstall = installationFixtures.buildCottageInstallationFixtures().installations[0]!
    const fixtureDefinition = contentContracts.draftDefinition(
      content,
      fixtureInstall.input.catalogKey,
      fixtureInstall.input.revision
    )
    const fixtureContentHash = hashModule.blueprintHash(fixtureDefinition)
    const pinnedPlan = planning.expandBlueprintInstallation(
      { ...fixtureInstall.input, contentHash: fixtureContentHash },
      {
        catalogKey: fixtureInstall.input.catalogKey,
        revision: fixtureInstall.input.revision,
        contentHash: fixtureContentHash,
        definition: fixtureDefinition,
      }
    )
    const createTemplate = async (listed: boolean) => {
      const id = listed ? templateId : crypto.randomUUID()
      const key = listed ? catalogKey : `private_${id.replaceAll('-', '')}`
      const definition = contentContracts.draftDefinition(content, key, 1)
      await db.insert(blueprintTemplate).values({
        id,
        catalogKey: key,
        organizationId: orgId,
        createdByUserId: actorId,
        createRequestId: crypto.randomUUID(),
        createRequestHash: 'b'.repeat(64),
        content,
        creatorName: listed ? 'Garden Hosts' : null,
        draftVersion: 1,
        publishedRevision: 1,
        listedRevision: listed ? 1 : null,
        publishedDraftVersion: 1,
      })
      const [revision] = await db
        .insert(blueprintRevision)
        .values({
          templateId: id,
          draftVersion: 1,
          catalogKey: key,
          revision: 1,
          document: definition,
          contentHash: hashModule.blueprintHash(definition),
          description: content.description,
        })
        .returning()
      return revision!
    }

    try {
      await db.insert(user).values({
        id: actorId,
        name: 'Personal blueprint fixture',
        email: `${actorId}@example.test`,
        emailVerified: true,
      })
      await db.insert(user).values({
        id: strangerId,
        name: 'Blueprint stranger fixture',
        email: `${strangerId}@example.test`,
        emailVerified: true,
      })
      await db.insert(user).values({
        id: recipientId,
        name: 'Blueprint recipient fixture',
        email: `${recipientId}@example.test`,
        emailVerified: true,
      })
      await db.insert(organization).values({
        id: orgId,
        name: 'Personal fixture',
        slug,
        workspaceType: 'event',
        createdAt: new Date(),
      })
      await db.insert(member).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: actorId,
        role: 'owner',
        createdAt: new Date(),
      })
      const unlistedRevision = await createTemplate(false)
      await createTemplate(true)

      const live = authoring.BlueprintPersonalRepoLive.pipe(Layer.provide(PgClientLive))
      const unchangedPrivate = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.save(actorId, {
            id: unlistedRevision.templateId!,
            expectedVersion: 1,
            content,
          })
        }).pipe(Effect.provide(live))
      )
      expect(unchangedPrivate).toMatchObject({
        draftVersion: 1,
        publishedRevision: 1,
        listedRevision: null,
      })
      const privateRowsBeforeEdit = await db
        .select()
        .from(blueprintRevision)
        .where(
          (await import('drizzle-orm')).eq(
            blueprintRevision.templateId,
            unlistedRevision.templateId!
          )
        )
      expect(privateRowsBeforeEdit).toHaveLength(1)
      const updatedPrivate = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.save(actorId, {
            id: unlistedRevision.templateId!,
            expectedVersion: 1,
            content: { ...content, name: 'Private edited' },
          })
        }).pipe(Effect.provide(live))
      )
      expect(updatedPrivate).toMatchObject({
        publishedRevision: 2,
        listedRevision: null,
        catalogEntry: { revision: 2 },
      })
      expect(updatedPrivate.catalogEntry.contentHash).toBe(
        hashModule.blueprintHash(updatedPrivate.catalogEntry.definition)
      )
      expect(updatedPrivate.catalogEntry.definition).toMatchObject({
        blueprint: { id: unlistedRevision.catalogKey, revision: 2, name: 'Private edited' },
      })
      const versionConflict = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.save(actorId, {
            id: unlistedRevision.templateId!,
            expectedVersion: 1,
            content: { ...content, name: 'Stale edit' },
          })
        }).pipe(Effect.provide(live))
      )
      expect(
        Exit.match(versionConflict, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_DRAFT_VERSION_CONFLICT' })

      const uploaded = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.publish(actorId, {
            id: unlistedRevision.templateId!,
            expectedVersion: 2,
            creatorName: 'Garden Hosts',
          })
        }).pipe(Effect.provide(live))
      )
      expect(uploaded).toMatchObject({
        id: unlistedRevision.templateId,
        draftVersion: 2,
        publishedRevision: 2,
        listedRevision: 2,
        creatorName: 'Garden Hosts',
        activeShareLinkCount: 0,
        catalogEntry: { catalogKey: unlistedRevision.catalogKey, revision: 2 },
      })
      expect(uploaded.catalogEntry.creator).toEqual({ displayName: 'Garden Hosts' })
      const uploadedAgain = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.publish(actorId, {
            id: unlistedRevision.templateId!,
            expectedVersion: 2,
          })
        }).pipe(Effect.provide(live))
      )
      expect(uploadedAgain).toEqual(uploaded)
      const personalTemplates = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.list(actorId)
        }).pipe(Effect.provide(live))
      )
      expect(personalTemplates.templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: unlistedRevision.templateId,
            creatorName: 'Garden Hosts',
            activeShareLinkCount: 0,
          }),
          expect.objectContaining({
            id: templateId,
            creatorName: 'Garden Hosts',
            activeShareLinkCount: 0,
          }),
        ])
      )
      const uploadedRows = await db
        .select()
        .from(blueprintRevision)
        .where(
          (await import('drizzle-orm')).eq(
            blueprintRevision.templateId,
            unlistedRevision.templateId!
          )
        )
      expect(uploadedRows).toHaveLength(2)

      const checkpoint = Layer.succeed(blueprintRuntime.BlueprintInstallCheckpoint, {
        afterProjection: () => Effect.void,
      })
      const blueprintDependencies = Layer.mergeAll(PgClientLive, checkpoint)
      const catalogLayer = blueprintRepo.BlueprintRepoLive.pipe(
        Layer.provide(blueprintDependencies)
      )
      const ownerNativeRevision = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(unlistedRevision.catalogKey, 2, actorId)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(ownerNativeRevision.contentHash).toBe(updatedPrivate.catalogEntry.contentHash)

      const updatedListed = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.save(actorId, {
            id: templateId,
            expectedVersion: 1,
            content: { ...content, name: 'Listed edited' },
          })
        }).pipe(Effect.provide(live))
      )
      expect(updatedListed).toMatchObject({
        publishedRevision: 2,
        listedRevision: 2,
        catalogEntry: { revision: 2 },
      })
      const [listedV2] = await db
        .select()
        .from(blueprintRevision)
        .where(
          (await import('drizzle-orm')).and(
            (await import('drizzle-orm')).eq(blueprintRevision.templateId, templateId),
            (await import('drizzle-orm')).eq(blueprintRevision.revision, 2)
          )
        )
      await db.insert(blueprintShareLink).values({
        id: crypto.randomUUID(),
        revisionId: listedV2!.id,
        tokenHash: linkTokenHash,
        createdByUserId: actorId,
      })
      const personalTemplatesWithLink = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.list(actorId)
        }).pipe(Effect.provide(live))
      )
      expect(personalTemplatesWithLink.templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: templateId,
            creatorName: 'Garden Hosts',
            activeShareLinkCount: 1,
          }),
        ])
      )

      const unauthorizedUnlist = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.unlist(strangerId, {
            id: templateId,
            expectedVersion: 2,
            expectedListedRevision: 2,
          })
        }).pipe(Effect.provide(live))
      )
      expect(
        Exit.match(unauthorizedUnlist, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })

      const staleUnlistVersion = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.unlist(actorId, {
            id: templateId,
            expectedVersion: 1,
            expectedListedRevision: 2,
          })
        }).pipe(Effect.provide(live))
      )
      expect(
        Exit.match(staleUnlistVersion, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_DRAFT_VERSION_CONFLICT' })

      const staleListedRevision = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.unlist(actorId, {
            id: templateId,
            expectedVersion: 2,
            expectedListedRevision: 1,
          })
        }).pipe(Effect.provide(live))
      )
      expect(
        Exit.match(staleListedRevision, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_LISTED_REVISION_CONFLICT' })

      const unlisted = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.unlist(actorId, {
            id: templateId,
            expectedVersion: 2,
            expectedListedRevision: 2,
          })
        }).pipe(Effect.provide(live))
      )
      expect(unlisted).toMatchObject({
        id: templateId,
        draftVersion: 2,
        publishedRevision: 2,
        listedRevision: null,
        creatorName: 'Garden Hosts',
        activeShareLinkCount: 1,
        catalogEntry: { catalogKey, revision: 2, creator: { displayName: 'Garden Hosts' } },
      })
      const unlistRetry = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.unlist(actorId, {
            id: templateId,
            expectedVersion: 2,
            expectedListedRevision: 2,
          })
        }).pipe(Effect.provide(live))
      )
      expect(unlistRetry).toEqual(unlisted)
      const [linkAfterUnlist] = await db
        .select()
        .from(blueprintShareLink)
        .where((await import('drizzle-orm')).eq(blueprintShareLink.revisionId, listedV2!.id))
      expect(linkAfterUnlist?.revokedAt).toBe(null)

      const linkedPreviewAfterUnlist = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(catalogKey, 2, recipientId, linkToken)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(linkedPreviewAfterUnlist.contentHash).toBe(updatedListed.catalogEntry.contentHash)
      const unlistedCatalogs = await Promise.all(
        [actorId, recipientId].map((userId) =>
          Effect.runPromise(
            Effect.gen(function* () {
              const service = yield* blueprintRuntime.BlueprintRepo
              return yield* service.catalog(userId)
            }).pipe(Effect.provide(catalogLayer))
          )
        )
      )
      expect(
        unlistedCatalogs.every((entries) =>
          entries.every(({ catalogKey: key }) => key !== catalogKey)
        )
      ).toBe(true)

      const recipientRevisionWithoutLink = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(catalogKey, 2, recipientId)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(Exit.isFailure(recipientRevisionWithoutLink)).toBe(true)
      const deniedOwnerOperation = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.delete(recipientId, templateId)
        }).pipe(Effect.provide(live))
      )
      expect(
        Exit.match(deniedOwnerOperation, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })

      await db.insert(blueprintInstallation).values({
        actorUserId: recipientId,
        requestId: crypto.randomUUID(),
        requestHash: 'c'.repeat(64),
        revisionId: (
          await db
            .select()
            .from(blueprintRevision)
            .where(
              (await import('drizzle-orm')).and(
                (await import('drizzle-orm')).eq(blueprintRevision.templateId, templateId),
                (await import('drizzle-orm')).eq(blueprintRevision.revision, 2)
              )
            )
        )[0]!.id,
        plan: pinnedPlan,
        sourceSnapshot: updatedListed.catalogEntry.definition,
        provisioningSlug: `personal-install-${crypto.randomUUID()}`,
        state: 'completed',
        result: { preserved: true },
      })

      await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* personalRepoModule.BlueprintPersonalRepo
          return yield* service.delete(actorId, templateId)
        }).pipe(Effect.provide(live))
      )
      const rows = await db
        .select()
        .from(blueprintRevision)
        .where((await import('drizzle-orm')).eq(blueprintRevision.templateId, templateId))
      expect(rows.map((row) => [row.revision, row.retiredAt])).toEqual([
        [1, null],
        [2, null],
      ])
      const [link] = await db
        .select()
        .from(blueprintShareLink)
        .where((await import('drizzle-orm')).eq(blueprintShareLink.revisionId, listedV2!.id))
      expect(link?.revokedAt).toBeInstanceOf(Date)
      const [install] = await db
        .select()
        .from(blueprintInstallation)
        .where((await import('drizzle-orm')).eq(blueprintInstallation.actorUserId, recipientId))
      expect(install).toMatchObject({ state: 'completed', result: { preserved: true } })
      const detachedRequestId = crypto.randomUUID()
      await db.insert(blueprintInstallation).values({
        actorUserId: recipientId,
        requestId: detachedRequestId,
        requestHash: 'd'.repeat(64),
        revisionId: listedV2!.id,
        plan: pinnedPlan,
        sourceSnapshot: updatedListed.catalogEntry.definition,
        provisioningSlug: `detached-install-${crypto.randomUUID()}`,
        state: 'pending',
      })
      const detachedReceipt = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.acquire(
            recipientId,
            detachedRequestId,
            'd'.repeat(64),
            crypto.randomUUID()
          )
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(detachedReceipt.id).toBeTruthy()

      const revokedTokenRequestId = crypto.randomUUID()
      await db.insert(blueprintInstallation).values({
        actorUserId: recipientId,
        requestId: revokedTokenRequestId,
        requestHash: 'e'.repeat(64),
        shareTokenHash: linkTokenHash,
        revisionId: listedV2!.id,
        plan: pinnedPlan,
        sourceSnapshot: updatedListed.catalogEntry.definition,
        provisioningSlug: `revoked-link-install-${crypto.randomUUID()}`,
        state: 'pending',
      })
      const revokedTokenReceipt = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.acquire(
            recipientId,
            revokedTokenRequestId,
            'e'.repeat(64),
            crypto.randomUUID()
          )
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(
        Exit.match(revokedTokenReceipt, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })
      const recipientPinnedRevision = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(catalogKey, 2, recipientId)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(recipientPinnedRevision.contentHash).toBe(updatedListed.catalogEntry.contentHash)
      const strangerLookup = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(catalogKey, 2, strangerId)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(
        Exit.match(strangerLookup, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })
      const revokedLinkLookup = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(catalogKey, 2, strangerId, linkToken)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(
        Exit.match(revokedLinkLookup, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })
      const catalogAfterWithdrawal = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.catalog(recipientId)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(catalogAfterWithdrawal.some((entry) => entry.catalogKey === catalogKey)).toBe(false)
      const oldOwnerRevision = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const service = yield* blueprintRuntime.BlueprintRepo
          return yield* service.revision(catalogKey, 1, actorId)
        }).pipe(Effect.provide(catalogLayer))
      )
      expect(
        Exit.match(oldOwnerRevision, {
          onFailure: (cause) => Cause.squash(cause),
          onSuccess: () => null,
        })
      ).toMatchObject({ code: 'BLUEPRINT_NOT_FOUND' })
    } finally {
      await db.delete(organization).where((await import('drizzle-orm')).eq(organization.id, orgId))
      await db.delete(user).where((await import('drizzle-orm')).eq(user.id, actorId))
      await db.delete(user).where((await import('drizzle-orm')).eq(user.id, recipientId))
      await db.delete(user).where((await import('drizzle-orm')).eq(user.id, strangerId))
    }
  }
)
