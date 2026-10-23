import { Effect, Layer } from 'effect'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'blueprint preferences and measurement enforce account, replay, consent, and signal boundaries',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in discovery actions test'
    ).toBeTruthy()
    const host = new URL(databaseUrl!).hostname
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${host}`
    ).toContain(host)

    const [
      database,
      authSchema,
      blueprintSchema,
      discoverySchema,
      repoContract,
      repoLive,
      workflows,
      orm,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema/auth.schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/blueprint-discovery.schema'),
      import('@/server/blueprints/repos/blueprint-discovery-actions.repo'),
      import('@/server/blueprints/repos/blueprint-discovery-actions.repo.live'),
      import('@/server/blueprints/workflows/blueprint-discovery-actions.workflows.live'),
      import('drizzle-orm'),
    ])
    const { db, PgClientLive } = database
    const { user } = authSchema
    const { blueprintRevision } = blueprintSchema
    const {
      blueprintDiscoveryExposure,
      blueprintDiscoverySignal,
      blueprintDiscoveryServingDaily,
      blueprintPreference,
      blueprintPreferenceMutation,
    } = discoverySchema
    const { BlueprintDiscoveryActionsRepo } = repoContract
    const layer = repoLive.BlueprintDiscoveryActionsRepoLive.pipe(Layer.provide(PgClientLive))
    const run = <A, E>(
      operation: (repo: typeof BlueprintDiscoveryActionsRepo.Service) => Effect.Effect<A, E>
    ) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* BlueprintDiscoveryActionsRepo
          return yield* operation(repo)
        }).pipe(Effect.provide(layer))
      )

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorId = `discovery-actions-${suffix}`
    const otherActorId = `discovery-actions-other-${suffix}`
    const quotaActorId = `discovery-actions-quota-${suffix}`
    const catalogKey = `actions_fixture_${suffix}`
    const lateCatalogKey = `actions_late_fixture_${suffix}`
    const hiddenCatalogKey = `hidden_fixture_${suffix}`
    const contentHash = 'a'.repeat(64)
    const hiddenContentHash = 'b'.repeat(64)
    const exposureInput = {
      catalogKey,
      revision: 1,
      contentHash,
      surface: 'browse' as const,
      rank: 1,
      snapshotId: `cursor-${suffix}-must-not-be-stored`,
    }

    try {
      await db.insert(user).values(
        [actorId, otherActorId, quotaActorId].map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(blueprintRevision).values({
        templateId: null,
        draftVersion: null,
        catalogKey,
        revision: 1,
        contentHash,
        document: { blueprint: { name: 'Private fixture title' } },
        description: '',
      })
      await db.insert(blueprintRevision).values({
        templateId: null,
        draftVersion: null,
        catalogKey: lateCatalogKey,
        revision: 1,
        contentHash: 'c'.repeat(64),
        document: { blueprint: { name: 'Late signal fixture' } },
        description: '',
      })
      await db.insert(blueprintRevision).values({
        templateId: null,
        draftVersion: null,
        catalogKey: hiddenCatalogKey,
        revision: 1,
        contentHash: hiddenContentHash,
        document: { blueprint: { name: 'Current public hidden title' } },
        description: '',
      })

      const enableSettings = { requestId: crypto.randomUUID(), enabled: true }
      await run((repo) => repo.updateMeasurementSettings(actorId, enableSettings))

      const likeRequest = {
        requestId: crypto.randomUUID(),
        catalogKey,
        revision: 1,
        contentHash,
        kind: 'like' as const,
        enabled: true,
      }
      const bookmarkRequest = {
        ...likeRequest,
        requestId: crypto.randomUUID(),
        kind: 'bookmark' as const,
      }
      await Promise.all([
        run((repo) => repo.updatePreference(actorId, likeRequest)),
        run((repo) => repo.updatePreference(actorId, bookmarkRequest)),
      ])
      expect(await run((repo) => repo.getPreferenceStates(actorId, [catalogKey]))).toMatchObject({
        [catalogKey]: {
          liked: true,
          bookmarked: true,
          likeRevision: 1,
          likeContentHash: contentHash,
        },
      })

      const removeLike = { ...likeRequest, requestId: crypto.randomUUID(), enabled: false }
      await run((repo) => repo.updatePreference(actorId, removeLike))
      const replayedLike = await run((repo) => repo.updatePreference(actorId, likeRequest))
      expect(replayedLike).toMatchObject({
        requestId: likeRequest.requestId,
        catalogKey,
        revision: likeRequest.revision,
        contentHash: likeRequest.contentHash,
        liked: false,
        bookmarked: true,
      })

      const unavailable = await Effect.runPromise(
        workflows
          .listBlueprintPreferences(actorId, { limit: 50 }, [])
          .pipe(Effect.provide(PgClientLive))
      )
      expect(unavailable.items[0]).toMatchObject({
        catalogKey,
        bookmarked: true,
        bookmarkRevision: 1,
        bookmarkContentHash: contentHash,
        bookmarkAvailability: 'unavailable',
        likeAvailability: 'unavailable',
      })
      expect(unavailable.items[0]).not.toHaveProperty('entry')
      expect(JSON.stringify(unavailable)).not.toContain('Private fixture title')

      const { blueprintStarters } = await import('@/server/blueprints/catalog/starters')
      const starterDefinition = blueprintStarters[0]!.definition
      const currentPublicEntry = {
        ...blueprintStarters[0]!,
        catalogKey: hiddenCatalogKey,
        revision: 1,
        contentHash: hiddenContentHash,
        definition: {
          ...starterDefinition,
          blueprint: {
            ...starterDefinition.blueprint,
            id: hiddenCatalogKey,
            revision: 1,
          },
        },
      }
      const hiddenOnlyRequest = {
        requestId: crypto.randomUUID(),
        catalogKey: currentPublicEntry.catalogKey,
        revision: currentPublicEntry.revision,
        contentHash: currentPublicEntry.contentHash,
        kind: 'notInterested' as const,
        enabled: true,
      }
      await run((repo) => repo.updatePreference(actorId, hiddenOnlyRequest))
      const rowsWithHiddenMetadata = await Effect.runPromise(
        workflows
          .listBlueprintPreferences(actorId, { limit: 50 }, [currentPublicEntry])
          .pipe(Effect.provide(PgClientLive))
      )
      expect(
        rowsWithHiddenMetadata.items.find(
          (item) => item.catalogKey === currentPublicEntry.catalogKey
        )
      ).toMatchObject({
        notInterested: true,
        bookmarkAvailability: 'available',
        notInterestedRevision: 1,
        notInterestedContentHash: hiddenContentHash,
        entry: { name: currentPublicEntry.definition.blueprint.name },
      })
      expect(
        rowsWithHiddenMetadata.items.find(
          (item) => item.catalogKey === currentPublicEntry.catalogKey
        )
      ).toMatchObject({
        likeRevision: null,
        bookmarkRevision: null,
        notInterestedAvailability: 'available',
      })

      const issued = await run((repo) =>
        repo.issueExposures(actorId, [
          exposureInput,
          { ...exposureInput, rank: 2 },
          { ...exposureInput, rank: 3 },
        ])
      )
      expect(issued).toHaveLength(3)
      const [initialServingDiagnostics] = await db
        .select()
        .from(blueprintDiscoveryServingDaily)
        .where(orm.eq(blueprintDiscoveryServingDaily.actorUserId, actorId))
      expect(initialServingDiagnostics).toMatchObject({
        requestedItemAttempts: 3,
        eligibleItems: 3,
        issuedExposures: 3,
        reusedExposures: 0,
        quotaDeniedItems: 0,
        sourceIneligibleItems: 0,
      })
      expect(issued[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 60 * 1000)
      expect(issued[0]!.expiresAt.getTime()).toBeLessThan(Date.now() + 31 * 60 * 1000)
      const [storedExposure] = await db
        .select()
        .from(blueprintDiscoveryExposure)
        .where(orm.eq(blueprintDiscoveryExposure.exposureId, issued[0]!.exposureId))
      expect(storedExposure?.snapshotId).toMatch(/^[a-f0-9]{64}$/)
      expect(storedExposure?.snapshotId).not.toBe(exposureInput.snapshotId)
      const repeatedPage = await run((repo) => repo.issueExposures(actorId, [exposureInput]))
      expect(repeatedPage).toMatchObject([{ exposureId: issued[0]!.exposureId }])
      const [reusedServingDiagnostics] = await db
        .select()
        .from(blueprintDiscoveryServingDaily)
        .where(orm.eq(blueprintDiscoveryServingDaily.actorUserId, actorId))
      expect(reusedServingDiagnostics).toMatchObject({
        requestedItemAttempts: 4,
        eligibleItems: 4,
        issuedExposures: 3,
        reusedExposures: 1,
      })
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(orm.eq(blueprintDiscoveryExposure.actorUserId, actorId))
      ).toHaveLength(3)

      const notInterested = {
        ...likeRequest,
        requestId: crypto.randomUUID(),
        kind: 'notInterested' as const,
        enabled: true,
      }
      await run((repo) => repo.updatePreference(actorId, notInterested))
      const preferenceState = await run((repo) => repo.getPreferenceStates(actorId, [catalogKey]))
      const { applyBlueprintViewerPreferences } =
        await import('@/server/blueprints/services/blueprint-discovery')
      const visibilityEntries = [{ catalogKey }, { catalogKey: 'another_fixture' }]
      expect(applyBlueprintViewerPreferences(visibilityEntries, preferenceState, true)).toEqual([
        {
          catalogKey: 'another_fixture',
          viewerState: { liked: false, bookmarked: false, notInterested: false },
        },
      ])
      expect(
        applyBlueprintViewerPreferences(visibilityEntries, preferenceState, false)[0]
      ).toMatchObject({
        catalogKey,
        viewerState: { notInterested: true },
      })

      const acceptedOpen = {
        requestId: crypto.randomUUID(),
        exposureId: issued[0]!.exposureId,
        kind: 'open' as const,
      }
      for (const exposure of issued.slice(0, 2)) {
        await run((repo) =>
          repo.recordSignal(actorId, {
            requestId: crypto.randomUUID(),
            exposureId: exposure!.exposureId,
            kind: 'impression',
          })
        )
        await run((repo) =>
          repo.recordSignal(
            actorId,
            exposure === issued[0]
              ? acceptedOpen
              : {
                  requestId: crypto.randomUUID(),
                  exposureId: exposure!.exposureId,
                  kind: 'open',
                }
          )
        )
      }
      await run((repo) => repo.recordSignal(actorId, acceptedOpen))
      const duplicateOpen = {
        requestId: crypto.randomUUID(),
        exposureId: issued[0]!.exposureId,
        kind: 'open' as const,
      }
      await run((repo) => repo.recordSignal(actorId, duplicateOpen))
      expect(
        await db
          .select()
          .from(blueprintPreferenceMutation)
          .where(
            orm.and(
              orm.eq(blueprintPreferenceMutation.actorUserId, actorId),
              orm.eq(blueprintPreferenceMutation.requestId, duplicateOpen.requestId)
            )
          )
      ).toHaveLength(0)
      await run((repo) =>
        repo.recordSignal(otherActorId, {
          requestId: crypto.randomUUID(),
          exposureId: issued[0]!.exposureId,
          kind: 'open',
        })
      )
      expect(
        await db
          .select()
          .from(blueprintDiscoverySignal)
          .where(orm.eq(blueprintDiscoverySignal.actorUserId, otherActorId))
      ).toHaveLength(0)
      const signals = await db
        .select()
        .from(blueprintDiscoverySignal)
        .where(orm.eq(blueprintDiscoverySignal.actorUserId, actorId))
      expect(signals.filter((signal) => signal.kind === 'impression')).toHaveLength(2)
      expect(
        signals.filter((signal) => signal.kind === 'impression' && signal.rankEligible)
      ).toHaveLength(1)
      expect(signals.filter((signal) => signal.kind === 'open')).toHaveLength(2)
      expect(
        signals.filter((signal) => signal.kind === 'open' && signal.rankEligible)
      ).toHaveLength(1)
      expect(signals.every((signal) => signal.actorUserId === actorId)).toBe(true)
      const orderedSignals = signals.toSorted((left, right) =>
        left.acceptedSequence < right.acceptedSequence ? -1 : 1
      )
      expect(
        orderedSignals.every(
          (signal, index) =>
            index === 0 || signal.acceptedSequence > orderedSignals[index - 1]!.acceptedSequence
        )
      ).toBe(true)
      expect(
        signals.every(
          (signal) => signal.signalDate === signal.acceptedAt.toISOString().slice(0, 10)
        )
      ).toBe(true)
      for (const signal of signals.filter((row) => row.kind === 'open')) {
        const matchedImpression = signals.find((row) => row.id === signal.matchedImpressionId)
        expect(matchedImpression).toMatchObject({
          actorUserId: actorId,
          exposureId: signal.exposureId,
          catalogKey: signal.catalogKey,
          kind: 'impression',
        })
        expect(matchedImpression!.acceptedSequence).toBeLessThan(signal.acceptedSequence)
      }

      const lateExposures = await run((repo) =>
        repo.issueExposures(actorId, [
          { ...exposureInput, catalogKey: lateCatalogKey, contentHash: 'c'.repeat(64), rank: 1 },
          {
            ...exposureInput,
            catalogKey: lateCatalogKey,
            contentHash: 'c'.repeat(64),
            surface: 'category',
            rank: 2,
          },
        ])
      )
      await run((repo) =>
        repo.recordSignal(actorId, {
          requestId: crypto.randomUUID(),
          exposureId: lateExposures[0]!.exposureId,
          kind: 'open',
        })
      )
      let signalLockAcquired!: () => void
      let releaseSignalLock!: () => void
      const locked = new Promise<void>((resolve) => (signalLockAcquired = resolve))
      const held = new Promise<void>((resolve) => (releaseSignalLock = resolve))
      const signalLock = db.transaction(async (tx) => {
        await tx.execute(
          orm.sql`select pg_advisory_xact_lock(hashtext(${`blueprint-measurement:${actorId}`}))`
        )
        signalLockAcquired()
        await held
      })
      await locked
      const blockedImpression = run((repo) =>
        repo.recordSignal(actorId, {
          requestId: crypto.randomUUID(),
          exposureId: lateExposures[0]!.exposureId,
          kind: 'impression',
        })
      )
      let lockWaitObserved = false
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const [waiters] = await db
          .select({ count: orm.sql<number>`count(*)::int` })
          .from(orm.sql`pg_locks`)
          .where(
            orm.sql`locktype = 'advisory' and not granted and objid = hashtext(${`blueprint-measurement:${actorId}`})::oid`
          )
        if ((waiters?.count ?? 0) > 0) {
          lockWaitObserved = true
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      if (!lockWaitObserved) {
        releaseSignalLock()
        await Promise.all([signalLock, blockedImpression])
      }
      const [lockReleaseTime] = await db
        .select({ now: orm.sql<Date>`clock_timestamp()` })
        .from(orm.sql`(select 1) as signal_lock_clock`)
        .limit(1)
      releaseSignalLock()
      await Promise.all([signalLock, blockedImpression])
      expect(lockWaitObserved).toBe(true)
      expect(lockReleaseTime).toBeDefined()
      await run((repo) =>
        repo.recordSignal(actorId, {
          requestId: crypto.randomUUID(),
          exposureId: lateExposures[1]!.exposureId,
          kind: 'impression',
        })
      )
      await run((repo) =>
        repo.recordSignal(actorId, {
          requestId: crypto.randomUUID(),
          exposureId: lateExposures[1]!.exposureId,
          kind: 'open',
        })
      )
      const lateSignals = await db
        .select()
        .from(blueprintDiscoverySignal)
        .where(orm.eq(blueprintDiscoverySignal.catalogKey, lateCatalogKey))
      const lateOpen = lateSignals.find(
        (signal) => signal.exposureId === lateExposures[0]!.exposureId && signal.kind === 'open'
      )!
      const lateImpression = lateSignals.find(
        (signal) =>
          signal.exposureId === lateExposures[0]!.exposureId && signal.kind === 'impression'
      )!
      const pairedOpen = lateSignals.find(
        (signal) => signal.exposureId === lateExposures[1]!.exposureId && signal.kind === 'open'
      )!
      const pairedImpression = lateSignals.find(
        (signal) =>
          signal.exposureId === lateExposures[1]!.exposureId && signal.kind === 'impression'
      )!
      const lockReleasedAt = new Date(String(lockReleaseTime!.now))
      expect(lateOpen.matchedImpressionId).toBeNull()
      expect(lateOpen.acceptedSequence).toBeLessThan(lateImpression.acceptedSequence)
      expect(lateImpression.acceptedAt.getTime()).toBeGreaterThan(lockReleasedAt.getTime())
      expect(lateImpression.createdAt.getTime()).toBeLessThanOrEqual(lockReleasedAt.getTime())
      expect(lateImpression.rankEligible).toBe(true)
      expect(pairedImpression.rankEligible).toBe(false)
      expect(pairedOpen.matchedImpressionId).toBe(pairedImpression.id)
      expect(pairedOpen.rankEligible).toBe(false)
      expect(lateOpen.rankEligible).toBe(true)

      await run((repo) =>
        repo.updateMeasurementSettings(quotaActorId, {
          requestId: crypto.randomUUID(),
          enabled: true,
        })
      )
      const quotaPage = (firstRank: number) =>
        Array.from({ length: 40 }, (_, offset) => ({
          ...exposureInput,
          rank: firstRank + offset,
          snapshotId: 'quota-page-snapshot',
        }))
      const firstQuotaWindow = await Promise.all(
        [1, 41, 81].map((firstRank) =>
          run((repo) => repo.issueExposures(quotaActorId, quotaPage(firstRank)))
        )
      )
      expect(firstQuotaWindow.flat()).toHaveLength(120)
      expect(await run((repo) => repo.issueExposures(quotaActorId, quotaPage(121)))).toHaveLength(0)
      await db
        .update(blueprintDiscoveryExposure)
        .set({ issuedAt: new Date(Date.now() - 2 * 60 * 1000) })
        .where(orm.eq(blueprintDiscoveryExposure.actorUserId, quotaActorId))
      let dailyIssued = 120
      for (let firstRank = 121; firstRank <= 1000; firstRank += 40) {
        dailyIssued += (
          await run((repo) => repo.issueExposures(quotaActorId, quotaPage(firstRank)))
        ).length
        // Advance this fixture's issuance timestamps past the rolling minute
        // while keeping them inside the same UTC day to exercise the daily cap.
        await db
          .update(blueprintDiscoveryExposure)
          .set({ issuedAt: new Date(Date.now() - 2 * 60 * 1000) })
          .where(orm.eq(blueprintDiscoveryExposure.actorUserId, quotaActorId))
      }
      expect(dailyIssued).toBe(1000)
      expect(
        await run((repo) => repo.issueExposures(quotaActorId, [{ ...exposureInput, rank: 1001 }]))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(orm.eq(blueprintDiscoveryExposure.actorUserId, quotaActorId))
      ).toHaveLength(1000)
      const [quotaDiagnostics] = await db
        .select()
        .from(blueprintDiscoveryServingDaily)
        .where(orm.eq(blueprintDiscoveryServingDaily.actorUserId, quotaActorId))
      expect(quotaDiagnostics).toMatchObject({
        requestedItemAttempts: 1041,
        eligibleItems: 1041,
        issuedExposures: 1000,
        quotaDeniedItems: 41,
      })

      const expiredExposure = issued[2]!
      const expiredAt = new Date(Date.now() - 1000)
      await db
        .update(blueprintDiscoveryExposure)
        .set({
          issuedAt: new Date(expiredAt.getTime() - 60 * 60 * 1000),
          expiresAt: expiredAt,
        })
        .where(orm.eq(blueprintDiscoveryExposure.exposureId, expiredExposure.exposureId))
      await run((repo) =>
        repo.recordSignal(actorId, {
          requestId: crypto.randomUUID(),
          exposureId: expiredExposure.exposureId,
          kind: 'open',
        })
      )
      const expiredSignals = await db
        .select()
        .from(blueprintDiscoverySignal)
        .where(orm.eq(blueprintDiscoverySignal.exposureId, expiredExposure.exposureId))
      expect(expiredSignals).toHaveLength(0)

      // A forged exposure for a source revision that is not currently public earns no credit.
      const [invalidSourceExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: actorId,
          catalogKey,
          sourceRevision: 2,
          contentHash,
          surface: 'browse',
          rank: 2,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        })
        .returning({ exposureId: blueprintDiscoveryExposure.exposureId })
      await run((repo) =>
        repo.recordSignal(actorId, {
          requestId: crypto.randomUUID(),
          exposureId: invalidSourceExposure!.exposureId,
          kind: 'open',
        })
      )
      expect(
        await db
          .select()
          .from(blueprintDiscoverySignal)
          .where(orm.eq(blueprintDiscoverySignal.exposureId, invalidSourceExposure!.exposureId))
      ).toHaveLength(0)

      const retentionExposures = await run((repo) =>
        repo.issueExposures(actorId, [
          { ...exposureInput, rank: 4 },
          { ...exposureInput, rank: 5 },
          { ...exposureInput, rank: 6 },
        ])
      )
      expect(retentionExposures).toHaveLength(3)
      await db
        .update(blueprintDiscoveryExposure)
        .set({
          issuedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        })
        .where(orm.eq(blueprintDiscoveryExposure.exposureId, retentionExposures[0]!.exposureId))
      const firstStaleIssuedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
      await db
        .update(blueprintDiscoveryExposure)
        .set({
          issuedAt: firstStaleIssuedAt,
          expiresAt: new Date(firstStaleIssuedAt.getTime() + 30 * 60 * 1000),
        })
        .where(orm.eq(blueprintDiscoveryExposure.exposureId, retentionExposures[1]!.exposureId))
      await db
        .update(blueprintDiscoveryExposure)
        .set({
          issuedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        })
        .where(orm.eq(blueprintDiscoveryExposure.exposureId, retentionExposures[2]!.exposureId))
      const [staleImpression] = await db
        .insert(blueprintDiscoverySignal)
        .values({
          actorUserId: actorId,
          exposureId: retentionExposures[1]!.exposureId,
          catalogKey,
          signalDate: firstStaleIssuedAt.toISOString().slice(0, 10),
          requestId: crypto.randomUUID(),
          requestHash: 'd'.repeat(64),
          kind: 'impression',
          rankEligible: true,
          acceptedAt: new Date(firstStaleIssuedAt.getTime() + 1_000),
        })
        .returning({ id: blueprintDiscoverySignal.id })
      await db.insert(blueprintDiscoverySignal).values({
        actorUserId: actorId,
        exposureId: retentionExposures[1]!.exposureId,
        matchedImpressionId: staleImpression!.id,
        catalogKey,
        signalDate: firstStaleIssuedAt.toISOString().slice(0, 10),
        requestId: crypto.randomUUID(),
        requestHash: 'e'.repeat(64),
        kind: 'open',
        rankEligible: true,
        acceptedAt: new Date(firstStaleIssuedAt.getTime() + 2_000),
      })
      expect(await run((repo) => repo.cleanupExpiredMeasurement(1))).toEqual({ deleted: 1 })
      const remainingExpired = await db
        .select({ exposureId: blueprintDiscoveryExposure.exposureId })
        .from(blueprintDiscoveryExposure)
        .where(
          orm.and(
            orm.eq(blueprintDiscoveryExposure.actorUserId, actorId),
            orm.lt(
              blueprintDiscoveryExposure.issuedAt,
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            )
          )
        )
      expect(remainingExpired).toHaveLength(2)
      expect(
        await db
          .select()
          .from(blueprintDiscoverySignal)
          .where(orm.eq(blueprintDiscoverySignal.exposureId, retentionExposures[1]!.exposureId))
      ).toHaveLength(1)
      expect(
        (
          await db
            .select()
            .from(blueprintDiscoverySignal)
            .where(orm.eq(blueprintDiscoverySignal.exposureId, retentionExposures[1]!.exposureId))
        )[0]?.kind
      ).toBe('impression')
      await run((repo) => repo.cleanupExpiredMeasurement(10))
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(orm.eq(blueprintDiscoveryExposure.exposureId, retentionExposures[0]!.exposureId))
      ).toHaveLength(1)
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(orm.eq(blueprintDiscoveryExposure.exposureId, retentionExposures[1]!.exposureId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(orm.eq(blueprintDiscoveryExposure.exposureId, retentionExposures[2]!.exposureId))
      ).toHaveLength(0)

      const disableSettings = { requestId: crypto.randomUUID(), enabled: false }
      await Promise.all([
        run((repo) => repo.issueExposures(actorId, [{ ...exposureInput, rank: 3 }])),
        run((repo) => repo.updateMeasurementSettings(actorId, disableSettings)),
      ])
      const replayedEnable = await run((repo) =>
        repo.updateMeasurementSettings(actorId, enableSettings)
      )
      expect(replayedEnable.enabled).toBe(false)
      expect(await run((repo) => repo.getMeasurementSettings(actorId))).toEqual({ enabled: false })
      expect(
        await db
          .select()
          .from(blueprintDiscoveryExposure)
          .where(orm.eq(blueprintDiscoveryExposure.actorUserId, actorId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintDiscoverySignal)
          .where(orm.eq(blueprintDiscoverySignal.actorUserId, actorId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintDiscoveryServingDaily)
          .where(orm.eq(blueprintDiscoveryServingDaily.actorUserId, actorId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(blueprintPreferenceMutation)
          .where(
            orm.and(
              orm.eq(blueprintPreferenceMutation.actorUserId, actorId),
              orm.eq(blueprintPreferenceMutation.kind, 'signal')
            )
          )
      ).toHaveLength(0)

      expect(await run((repo) => repo.getPreferenceStates(actorId, [catalogKey]))).toMatchObject({
        [catalogKey]: { notInterested: true },
      })
      expect(
        await db
          .select()
          .from(blueprintPreference)
          .where(orm.eq(blueprintPreference.actorUserId, actorId))
      ).toHaveLength(2)
    } finally {
      await db
        .delete(blueprintRevision)
        .where(
          orm.inArray(blueprintRevision.catalogKey, [catalogKey, hiddenCatalogKey, lateCatalogKey])
        )
      await db.delete(user).where(orm.inArray(user.id, [actorId, otherActorId, quotaActorId]))
    }
  }
)
