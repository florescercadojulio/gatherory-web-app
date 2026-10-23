import { Effect, Layer } from 'effect'
import { eq, inArray, sql } from 'drizzle-orm'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'measurement readiness uses one read-only retained snapshot and keeps withdrawn sources visible as status',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in measurement readiness test'
    ).toBeTruthy()
    const parsed = new URL(databaseUrl!)
    expect(['localhost', '127.0.0.1', '::1', '[::1]']).toContain(parsed.hostname)

    const [
      database,
      authSchema,
      blueprintSchema,
      discoverySchema,
      repoContract,
      repoLive,
      reportService,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema/auth.schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/blueprint-discovery.schema'),
      import('@/server/blueprints/repos/blueprint-measurement-readiness.repo'),
      import('@/server/blueprints/repos/blueprint-measurement-readiness.repo.live'),
      import('@/server/blueprints/services/blueprint-measurement-readiness'),
    ])
    const { db, PgClientLive } = database
    const { user } = authSchema
    const { blueprintRevision } = blueprintSchema
    const {
      blueprintDiscoveryExposure,
      blueprintDiscoveryServingDaily,
      blueprintDiscoverySignal,
      blueprintMeasurementSetting,
    } = discoverySchema
    const { BlueprintMeasurementReadinessRepo } = repoContract
    const layer = repoLive.BlueprintMeasurementReadinessRepoLive.pipe(Layer.provide(PgClientLive))
    const runRead = (window: { cohortStart: string; cohortEnd: string; asOf: string }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* BlueprintMeasurementReadinessRepo
          return yield* repo.read(window)
        }).pipe(Effect.provide(layer))
      )

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const optedInActor = `measurement-ready-${suffix}`
    const optedOutActor = `measurement-ready-optout-${suffix}`
    const withdrawnKey = `measurement_withdrawn_${suffix}`
    const currentKey = `measurement_current_${suffix}`
    const withdrawnHash = 'a'.repeat(64)
    const currentHash = 'b'.repeat(64)
    const issuedAt = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
    const cohortStartDate = new Date(issuedAt)
    cohortStartDate.setUTCHours(0, 0, 0, 0)
    const cohortEndDate = new Date(cohortStartDate.getTime() + 24 * 60 * 60 * 1000)
    const cohortStart = cohortStartDate.toISOString()
    const cohortEnd = cohortEndDate.toISOString()
    const asOf = new Date(cohortEndDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString()
    const expiry = new Date(issuedAt.getTime() + 30 * 60 * 1000)

    try {
      await db.insert(user).values(
        [optedInActor, optedOutActor].map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(blueprintRevision).values([
        {
          templateId: null,
          draftVersion: null,
          catalogKey: withdrawnKey,
          revision: 1,
          contentHash: withdrawnHash,
          document: { blueprint: { id: withdrawnKey, revision: 1, name: 'not exported' } },
          description: '',
          retiredAt: new Date(issuedAt.getTime() + 1_000),
        },
        {
          templateId: null,
          draftVersion: null,
          catalogKey: currentKey,
          revision: 1,
          contentHash: currentHash,
          document: { blueprint: { id: currentKey, revision: 1, name: 'not exported' } },
          description: '',
        },
      ])
      await db.insert(blueprintMeasurementSetting).values([
        { actorUserId: optedInActor, enabled: true },
        { actorUserId: optedOutActor, enabled: false },
      ])
      const policyDigest = 'c'.repeat(64)
      await db.insert(blueprintDiscoveryServingDaily).values([
        {
          actorUserId: optedInActor,
          signalDate: cohortStartDate.toISOString().slice(0, 10),
          surface: 'browse',
          policyMode: 'baseline_v1',
          algorithmVersion: 'baseline_v1',
          configurationVersion: '1',
          configurationDigest: policyDigest,
          requestedItemAttempts: 7,
          eligibleItems: 5,
          issuedExposures: 2,
          reusedExposures: 1,
          quotaDeniedItems: 2,
          sourceIneligibleItems: 2,
          lastAcceptedAt: new Date(cohortStartDate.getTime() + 12 * 60 * 60 * 1000),
        },
        {
          actorUserId: optedOutActor,
          signalDate: cohortStartDate.toISOString().slice(0, 10),
          surface: 'search',
          policyMode: 'catalog',
          algorithmVersion: 'catalog_v1',
          configurationVersion: '1',
          configurationDigest: policyDigest,
          requestedItemAttempts: 99,
          eligibleItems: 99,
          issuedExposures: 99,
          reusedExposures: 0,
          quotaDeniedItems: 0,
          sourceIneligibleItems: 0,
          lastAcceptedAt: new Date(cohortStartDate.getTime() + 13 * 60 * 60 * 1000),
        },
      ])
      const exposures = await db
        .insert(blueprintDiscoveryExposure)
        .values([
          {
            actorUserId: optedInActor,
            catalogKey: withdrawnKey,
            sourceRevision: 1,
            contentHash: withdrawnHash,
            surface: 'browse',
            rank: 1,
            issuedAt,
            expiresAt: expiry,
          },
          {
            actorUserId: optedOutActor,
            catalogKey: currentKey,
            sourceRevision: 1,
            contentHash: currentHash,
            surface: 'search',
            rank: 11,
            issuedAt,
            expiresAt: expiry,
          },
        ])
        .returning({ exposureId: blueprintDiscoveryExposure.exposureId })
      const actorIds = [optedInActor, optedOutActor]
      const exposureBefore = await db
        .select({ exposureId: blueprintDiscoveryExposure.exposureId })
        .from(blueprintDiscoveryExposure)
        .where(inArray(blueprintDiscoveryExposure.actorUserId, actorIds))
      const signalBefore = await db
        .select({ id: blueprintDiscoverySignal.id })
        .from(blueprintDiscoverySignal)
        .where(inArray(blueprintDiscoverySignal.actorUserId, actorIds))

      const input = await runRead({ cohortStart, cohortEnd, asOf })
      const report = reportService.buildBlueprintMeasurementReadinessReport(input)

      expect(input.exposures.filter((row) => actorIds.includes(row.actorId))).toHaveLength(2)
      expect(
        input.exposures.find((row) => row.catalogKey === withdrawnKey)?.exactSourceStatus
      ).toBe('withdrawn')
      expect(input.exposures.find((row) => row.actorId === optedOutActor)?.consent).toBe(
        'withdrawn'
      )
      expect(report.counts.servedExposures).toBe(1)
      expect(report.counts.excludedConsentExposures).toBe(1)
      expect(report.servingDiagnostics).toMatchObject({
        scope: 'measured_full_utc_days',
        requestedItemAttempts: 7,
        eligibleItems: 5,
        issuedExposures: 2,
        reusedExposures: 1,
        quotaDeniedItems: 2,
        sourceIneligibleItems: 2,
        contributingActorCount: 1,
      })
      expect(JSON.stringify(report)).not.toContain(optedInActor)
      expect(JSON.stringify(report)).not.toContain(withdrawnKey)
      expect(JSON.stringify(report)).not.toContain('not exported')

      const exposureAfter = await db
        .select({ exposureId: blueprintDiscoveryExposure.exposureId })
        .from(blueprintDiscoveryExposure)
        .where(inArray(blueprintDiscoveryExposure.actorUserId, actorIds))
      const signalAfter = await db
        .select({ id: blueprintDiscoverySignal.id })
        .from(blueprintDiscoverySignal)
        .where(inArray(blueprintDiscoverySignal.actorUserId, actorIds))
      expect(exposureAfter).toEqual(exposureBefore)
      expect(signalAfter).toEqual(signalBefore)

      // Exposures are deliberately retained on source withdrawal for historical
      // evaluation; current withdrawal is a status, not silent denominator loss.
      expect(
        input.exposures
          .filter((row) => actorIds.includes(row.actorId))
          .map((row) => row.exposureId)
          .sort()
      ).toEqual(exposures.map((row) => row.exposureId).sort())
    } finally {
      await db
        .delete(blueprintDiscoveryExposure)
        .where(inArray(blueprintDiscoveryExposure.actorUserId, [optedInActor, optedOutActor]))
      await db
        .delete(blueprintMeasurementSetting)
        .where(inArray(blueprintMeasurementSetting.actorUserId, [optedInActor, optedOutActor]))
      await db
        .delete(blueprintRevision)
        .where(inArray(blueprintRevision.catalogKey, [withdrawnKey, currentKey]))
      await db.delete(user).where(inArray(user.id, [optedInActor, optedOutActor]))
    }
  }
)

test.skipIf(!enabled)(
  'measurement readiness fails closed when a source row set exceeds its hard cap',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in measurement readiness test'
    ).toBeTruthy()
    expect(['localhost', '127.0.0.1', '::1', '[::1]']).toContain(new URL(databaseUrl!).hostname)
    const [database, authSchema, discoverySchema, repoContract, repoLive] = await Promise.all([
      import('@/db'),
      import('@/db/schema/auth.schema'),
      import('@/db/schema/blueprint-discovery.schema'),
      import('@/server/blueprints/repos/blueprint-measurement-readiness.repo'),
      import('@/server/blueprints/repos/blueprint-measurement-readiness.repo.live'),
    ])
    const { db, PgClientLive } = database
    const { user } = authSchema
    const { blueprintMeasurementSetting } = discoverySchema
    const { BlueprintMeasurementReadinessRepo } = repoContract
    const layer = repoLive.BlueprintMeasurementReadinessRepoLive.pipe(Layer.provide(PgClientLive))
    const runRead = (window: { cohortStart: string; cohortEnd: string; asOf: string }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* BlueprintMeasurementReadinessRepo
          return yield* repo.read(window)
        }).pipe(Effect.provide(layer))
      )
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorId = `readiness-cap-${suffix}`
    const now = Date.now()
    const cohortStart = new Date(now - 10 * 24 * 60 * 60 * 1000)
    const cohortEnd = new Date(now - 9 * 24 * 60 * 60 * 1000)
    const asOf = new Date(now - 60_000)
    const issueAt = new Date(cohortStart.getTime() + 30 * 60_000)
    try {
      await db.insert(user).values({
        id: actorId,
        name: actorId,
        email: `${actorId}@example.test`,
        emailVerified: true,
      })
      await db.insert(blueprintMeasurementSetting).values({ actorUserId: actorId, enabled: true })
      await db.execute(sql`
      insert into blueprint_discovery_exposure
        (exposure_id, actor_user_id, catalog_key, source_revision, content_hash, surface, rank, issued_at, expires_at)
      select (md5(${actorId} || row_number::text))::uuid, ${actorId}, ${`readiness_cap_${suffix}`}, 1,
        ${'a'.repeat(64)}, 'browse', 1, ${issueAt}::timestamptz,
        ${new Date(issueAt.getTime() + 30 * 60 * 1000)}::timestamptz
      from generate_series(1, 20001) as rows(row_number)
    `)
      await expect(
        runRead({
          cohortStart: cohortStart.toISOString(),
          cohortEnd: cohortEnd.toISOString(),
          asOf: asOf.toISOString(),
        })
      ).rejects.toThrow('bounded row limit')
    } finally {
      await db.delete(user).where(eq(user.id, actorId))
    }
  }
)

test.skipIf(!enabled)(
  'measurement readiness maps acquisition and adoption joins, retained prior credit, expiry, and opt-out retraction',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in measurement readiness test'
    ).toBeTruthy()
    expect(['localhost', '127.0.0.1', '::1', '[::1]']).toContain(new URL(databaseUrl!).hostname)
    const [
      database,
      authSchema,
      blueprintSchema,
      discoverySchema,
      attributionSchema,
      reportService,
      repoContract,
      repoLive,
    ] = await Promise.all([
      import('@/db'),
      import('@/db/schema/auth.schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/blueprint-discovery.schema'),
      import('@/db/schema/blueprint-attribution.schema'),
      import('@/server/blueprints/services/blueprint-measurement-readiness'),
      import('@/server/blueprints/repos/blueprint-measurement-readiness.repo'),
      import('@/server/blueprints/repos/blueprint-measurement-readiness.repo.live'),
    ])
    const { db, PgClientLive } = database
    const { user, organization } = authSchema
    const { blueprintRevision, blueprintTemplate, blueprintInstallation } = blueprintSchema
    const { blueprintDiscoveryExposure, blueprintDiscoverySignal, blueprintMeasurementSetting } =
      discoverySchema
    const { blueprintAttributionAcquisition, blueprintQualifiedAdoption } = attributionSchema
    const { BlueprintMeasurementReadinessRepo } = repoContract
    const layer = repoLive.BlueprintMeasurementReadinessRepoLive.pipe(Layer.provide(PgClientLive))
    const runRead = (window: { cohortStart: string; cohortEnd: string; asOf: string }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* BlueprintMeasurementReadinessRepo
          return yield* repo.read(window)
        }).pipe(Effect.provide(layer))
      )

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorId = `readiness-chain-${suffix}`
    const priorActorId = `readiness-prior-${suffix}`
    const brokenActorId = `readiness-broken-${suffix}`
    const invalidPriorActorId = `readiness-invalid-prior-${suffix}`
    const catalogKey = `readiness_source_${suffix}`
    const sourceHash = 'c'.repeat(64)
    const wrongCopyHash = 'd'.repeat(64)
    const organizationIds = [
      `personal-${actorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
      `personal-${priorActorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
      `personal-${brokenActorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
      `personal-${invalidPriorActorId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
    ]
    const cohortExposureAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const cohortStartDate = new Date(cohortExposureAt.getTime() - 60_000)
    const cohortEndDate = new Date(cohortExposureAt.getTime() + 1 * 60 * 60 * 1000)
    const asOfDate = new Date(cohortExposureAt.getTime() + 9 * 24 * 60 * 60 * 1000)
    const tokenExpiry = (issuedAt: Date) => new Date(issuedAt.getTime() + 30 * 60 * 1000)

    const insertSignal = async (
      actorUserId: string,
      exposureId: string,
      kind: 'impression' | 'open',
      createdAt: Date,
      rankEligible: boolean,
      matchedImpressionId: string | null = null
    ) =>
      db
        .insert(blueprintDiscoverySignal)
        .values({
          actorUserId,
          exposureId,
          catalogKey,
          signalDate: createdAt.toISOString().slice(0, 10),
          requestId: crypto.randomUUID(),
          requestHash: crypto.randomUUID().replaceAll('-', '').padEnd(64, 'e').slice(0, 64),
          kind,
          rankEligible,
          acceptedAt: createdAt,
          matchedImpressionId,
          createdAt,
        })
        .returning({ id: blueprintDiscoverySignal.id })

    const insertCopyChain = async (input: {
      actorUserId: string
      exposureId: string
      sourceCatalogKey: string
      sourceContentHash: string
      copyContentHash: string
      revisionContentHash?: string
      acquiredAt: Date
      qualifiedAt?: Date
      install?: boolean
      snapshotMismatch?: boolean
    }) => {
      const templateId = crypto.randomUUID()
      const revisionId = crypto.randomUUID()
      const installationId = crypto.randomUUID()
      const copyKey = `readiness_copy_${crypto.randomUUID().replaceAll('-', '')}`
      const copyDocument = { blueprint: { id: copyKey, revision: 1, name: 'diagnostic fixture' } }
      const templateOrganization =
        organizationIds[
          input.actorUserId === actorId
            ? 0
            : input.actorUserId === priorActorId
              ? 1
              : input.actorUserId === brokenActorId
                ? 2
                : 3
        ]!
      await db.insert(blueprintTemplate).values({
        id: templateId,
        catalogKey: copyKey,
        organizationId: templateOrganization,
        createdByUserId: input.actorUserId,
        createRequestId: crypto.randomUUID(),
        createRequestHash: 'e'.repeat(64),
        content: { name: 'diagnostic fixture' },
        draftVersion: 1,
        publishedRevision: 1,
        publishedDraftVersion: 1,
      })
      await db.insert(blueprintRevision).values({
        id: revisionId,
        templateId,
        draftVersion: 1,
        catalogKey: copyKey,
        revision: 1,
        contentHash: input.revisionContentHash ?? input.copyContentHash,
        document: copyDocument,
      })
      const acquiredExpiry = new Date(input.acquiredAt.getTime() + 29 * 24 * 60 * 60 * 1000)
      const [acquisition] = await db
        .insert(blueprintAttributionAcquisition)
        .values({
          actorUserId: input.actorUserId,
          exposureId: input.exposureId,
          copyTemplateId: templateId,
          copyRevisionId: revisionId,
          copyContentHash: input.copyContentHash,
          sourceCatalogKey: input.sourceCatalogKey,
          sourceRevision: 1,
          sourceContentHash: input.sourceContentHash,
          acquiredAt: input.acquiredAt,
          expiresAt: acquiredExpiry,
        })
        .returning({ id: blueprintAttributionAcquisition.id })
      if (input.install !== false) {
        await db.insert(blueprintInstallation).values({
          id: installationId,
          actorUserId: input.actorUserId,
          requestId: crypto.randomUUID(),
          requestHash: 'f'.repeat(64),
          revisionId,
          plan: {},
          sourceSnapshot: input.snapshotMismatch
            ? { blueprint: { id: 'mismatched-copy' } }
            : copyDocument,
          provisioningSlug: `readiness-${crypto.randomUUID()}`,
          state: 'completed',
        })
        if (input.qualifiedAt) {
          await db.insert(blueprintQualifiedAdoption).values({
            actorUserId: input.actorUserId,
            acquisitionId: acquisition!.id,
            installationId,
            sourceCatalogKey: input.sourceCatalogKey,
            sourceRevision: 1,
            sourceContentHash: input.sourceContentHash,
            qualifiedAt: input.qualifiedAt,
          })
        }
      }
      return acquisition!.id
    }

    try {
      await db.insert(user).values(
        [actorId, priorActorId, brokenActorId, invalidPriorActorId].map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(organization).values(
        organizationIds.map((id) => ({
          id,
          name: id,
          slug: id,
          workspaceType: 'personal' as const,
          createdAt: new Date(),
        }))
      )
      await db.insert(blueprintRevision).values({
        templateId: null,
        draftVersion: null,
        catalogKey,
        revision: 1,
        contentHash: sourceHash,
        document: { blueprint: { id: catalogKey, revision: 1, name: 'not exported' } },
        description: '',
      })
      await db.insert(blueprintMeasurementSetting).values([
        { actorUserId: actorId, enabled: true },
        { actorUserId: priorActorId, enabled: true },
        { actorUserId: brokenActorId, enabled: true },
        { actorUserId: invalidPriorActorId, enabled: true },
      ])

      const [mainExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: actorId,
          catalogKey,
          sourceRevision: 1,
          contentHash: sourceHash,
          surface: 'browse',
          rank: 2,
          issuedAt: cohortExposureAt,
          expiresAt: tokenExpiry(cohortExposureAt),
          rankingContext: {
            mode: 'baseline_v1',
            algorithmVersion: 'baseline_v1',
            configurationVersion: '1',
            configurationDigest: sourceHash,
            asOf: cohortExposureAt.toISOString(),
          },
        })
        .returning({
          exposureId: blueprintDiscoveryExposure.exposureId,
          issuedAt: blueprintDiscoveryExposure.issuedAt,
        })
      const [priorActorExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: priorActorId,
          catalogKey,
          sourceRevision: 1,
          contentHash: sourceHash,
          surface: 'category',
          rank: 11,
          issuedAt: new Date(cohortExposureAt.getTime() + 30 * 60_000),
          expiresAt: tokenExpiry(new Date(cohortExposureAt.getTime() + 30 * 60_000)),
        })
        .returning({
          exposureId: blueprintDiscoveryExposure.exposureId,
          issuedAt: blueprintDiscoveryExposure.issuedAt,
        })
      const [brokenActorExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: brokenActorId,
          catalogKey,
          sourceRevision: 1,
          contentHash: sourceHash,
          surface: 'search',
          rank: 4,
          issuedAt: new Date(cohortExposureAt.getTime() + 40 * 60_000),
          expiresAt: tokenExpiry(new Date(cohortExposureAt.getTime() + 40 * 60_000)),
        })
        .returning({
          exposureId: blueprintDiscoveryExposure.exposureId,
          issuedAt: blueprintDiscoveryExposure.issuedAt,
        })
      const priorIssuedAt = new Date(cohortExposureAt.getTime() - 24 * 60 * 60 * 1000)
      const [priorCreditExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: priorActorId,
          catalogKey,
          sourceRevision: 1,
          contentHash: sourceHash,
          surface: 'browse',
          rank: 1,
          issuedAt: priorIssuedAt,
          expiresAt: tokenExpiry(priorIssuedAt),
        })
        .returning({ exposureId: blueprintDiscoveryExposure.exposureId })

      // Valid paired organic engagement for the current cohort actor/source.
      const [mainImpression] = await insertSignal(
        actorId,
        mainExposure!.exposureId,
        'impression',
        new Date(cohortExposureAt.getTime() + 10 * 60_000),
        true
      )
      await insertSignal(
        actorId,
        mainExposure!.exposureId,
        'open',
        new Date(cohortExposureAt.getTime() + 11 * 60_000),
        true,
        mainImpression!.id
      )
      // A second exposure carries a raw rank-ineligible open. It remains exact
      // exposure attribution evidence; this fixture intentionally has no chain for it.
      const [falseCreditExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: actorId,
          catalogKey,
          sourceRevision: 1,
          contentHash: sourceHash,
          surface: 'search',
          rank: 4,
          issuedAt: new Date(cohortExposureAt.getTime() + 30 * 60_000),
          expiresAt: tokenExpiry(new Date(cohortExposureAt.getTime() + 30 * 60_000)),
        })
        .returning({ exposureId: blueprintDiscoveryExposure.exposureId })
      await insertSignal(
        actorId,
        falseCreditExposure!.exposureId,
        'open',
        new Date(cohortExposureAt.getTime() + 31 * 60_000),
        false
      )
      // A retained pre-cohort adoption qualifies after cohortStart but before
      // this actor/source's earliest cohort exposure anchor.
      await insertSignal(
        priorActorId,
        priorCreditExposure!.exposureId,
        'open',
        new Date(priorIssuedAt.getTime() + 10 * 60_000),
        true
      )
      await insertSignal(
        priorActorId,
        priorActorExposure!.exposureId,
        'open',
        new Date(priorActorExposure!.issuedAt.getTime() + 10 * 60_000),
        true
      )
      const [brokenImpression] = await insertSignal(
        brokenActorId,
        brokenActorExposure!.exposureId,
        'impression',
        new Date(brokenActorExposure!.issuedAt.getTime() + 9 * 60_000),
        true
      )
      await insertSignal(
        brokenActorId,
        brokenActorExposure!.exposureId,
        'open',
        new Date(brokenActorExposure!.issuedAt.getTime() + 10 * 60_000),
        true,
        brokenImpression!.id
      )

      await insertCopyChain({
        actorUserId: actorId,
        exposureId: mainExposure!.exposureId,
        sourceCatalogKey: catalogKey,
        sourceContentHash: sourceHash,
        copyContentHash: wrongCopyHash,
        acquiredAt: new Date(cohortExposureAt.getTime() + 12 * 60_000),
        qualifiedAt: new Date(cohortExposureAt.getTime() + 13 * 60_000),
      })
      await insertCopyChain({
        actorUserId: actorId,
        exposureId: mainExposure!.exposureId,
        sourceCatalogKey: catalogKey,
        sourceContentHash: sourceHash,
        copyContentHash: wrongCopyHash,
        revisionContentHash: sourceHash,
        acquiredAt: new Date(cohortExposureAt.getTime() + 14 * 60_000),
        install: false,
      })
      await insertCopyChain({
        actorUserId: priorActorId,
        exposureId: priorCreditExposure!.exposureId,
        sourceCatalogKey: catalogKey,
        sourceContentHash: sourceHash,
        copyContentHash: sourceHash,
        acquiredAt: new Date(priorIssuedAt.getTime() + 20 * 60_000),
        qualifiedAt: new Date(cohortExposureAt.getTime() + 10 * 60_000),
      })
      await insertCopyChain({
        actorUserId: brokenActorId,
        exposureId: brokenActorExposure!.exposureId,
        sourceCatalogKey: catalogKey,
        sourceContentHash: sourceHash,
        copyContentHash: wrongCopyHash,
        acquiredAt: new Date(brokenActorExposure!.issuedAt.getTime() + 12 * 60_000),
        qualifiedAt: new Date(brokenActorExposure!.issuedAt.getTime() + 13 * 60_000),
        snapshotMismatch: true,
      })
      const invalidPriorIssuedAt = new Date(cohortExposureAt.getTime() - 12 * 60 * 60_000)
      const [invalidPriorExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: invalidPriorActorId,
          catalogKey,
          sourceRevision: 1,
          contentHash: sourceHash,
          surface: 'browse',
          rank: 7,
          issuedAt: invalidPriorIssuedAt,
          expiresAt: tokenExpiry(invalidPriorIssuedAt),
        })
        .returning({ exposureId: blueprintDiscoveryExposure.exposureId })
      // A structurally complete prior installation without a matching open
      // must not suppress this actor/source's later organic opportunity.
      await insertCopyChain({
        actorUserId: invalidPriorActorId,
        exposureId: invalidPriorExposure!.exposureId,
        sourceCatalogKey: catalogKey,
        sourceContentHash: sourceHash,
        copyContentHash: wrongCopyHash,
        acquiredAt: new Date(invalidPriorIssuedAt.getTime() + 20 * 60_000),
        qualifiedAt: new Date(cohortExposureAt.getTime() + 5 * 60_000),
      })

      const [expiredExposure] = await db
        .insert(blueprintDiscoveryExposure)
        .values({
          actorUserId: actorId,
          catalogKey: `expired_${suffix}`,
          sourceRevision: 1,
          contentHash: 'a'.repeat(64),
          surface: 'search',
          rank: 99,
          issuedAt: new Date(cohortExposureAt.getTime() - 31 * 24 * 60 * 60 * 1000),
          expiresAt: tokenExpiry(new Date(cohortExposureAt.getTime() - 31 * 24 * 60 * 60 * 1000)),
        })
        .returning({ exposureId: blueprintDiscoveryExposure.exposureId })

      const input = await runRead({
        cohortStart: cohortStartDate.toISOString(),
        cohortEnd: cohortEndDate.toISOString(),
        asOf: asOfDate.toISOString(),
      })
      const report = reportService.buildBlueprintMeasurementReadinessReport(input)
      expect(input.exposures.some((row) => row.exposureId === expiredExposure!.exposureId)).toBe(
        false
      )
      expect(report.adoption.validAcquisitionChains).toBe(3)
      expect(report.adoption.invalidOrOrphanChains).toBeGreaterThanOrEqual(1)
      expect(report.adoption.validQualifiedAdoptionChains).toBe(2)
      expect(report.adoption.priorCreditedActorSourceCount).toBe(1)
      expect(report.adoption.invalidPriorCreditRows).toBeGreaterThanOrEqual(1)
      expect(report.adoption.cohortOpenOpportunities).toBe(2)
      expect(report.openPairing.matchedOpens).toBe(2)
      expect(report.openPairing.orderingField).toBe('acceptedSequence (server acceptance order)')
      expect(report.counts.rawFalseCreditOpens).toBe(1)

      await db
        .update(blueprintMeasurementSetting)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
      const afterOptOut = reportService.buildBlueprintMeasurementReadinessReport(
        await runRead({
          cohortStart: cohortStartDate.toISOString(),
          cohortEnd: cohortEndDate.toISOString(),
          asOf: asOfDate.toISOString(),
        })
      )
      expect(afterOptOut.counts.servedExposures).toBe(2)

      await db.delete(user).where(eq(user.id, actorId))
      const afterDeletion = await runRead({
        cohortStart: cohortStartDate.toISOString(),
        cohortEnd: cohortEndDate.toISOString(),
        asOf: asOfDate.toISOString(),
      })
      expect(afterDeletion.exposures.some((row) => row.actorId === actorId)).toBe(false)
    } finally {
      await db
        .delete(user)
        .where(inArray(user.id, [actorId, priorActorId, brokenActorId, invalidPriorActorId]))
      await db.delete(organization).where(inArray(organization.id, organizationIds))
      await db.delete(blueprintRevision).where(eq(blueprintRevision.catalogKey, catalogKey))
    }
  }
)
