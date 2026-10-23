import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'personal Like ranking is account-scoped, functional while measurement is off, and bound to current source state',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl, 'DATABASE_URL is required for the personal Like ranking test').toBeTruthy()
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(databaseUrl!).hostname)

    const [database, authSchema, blueprintSchema, discoverySchema, workflow] = await Promise.all([
      import('@/db'),
      import('@/db/schema/auth.schema'),
      import('@/db/schema/blueprint.schema'),
      import('@/db/schema/blueprint-discovery.schema'),
      import('@/server/blueprints/workflows/blueprint-discovery-actions.workflows.live'),
    ])
    const { db, PgClientLive } = database
    const { user } = authSchema
    const { blueprintRevision } = blueprintSchema
    const { blueprintPreference, blueprintPreferenceMutation, blueprintMeasurementSetting } =
      discoverySchema
    const { eq, inArray } = await import('drizzle-orm')

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorA = `personal_like_a_${suffix}`
    const actorB = `personal_like_b_${suffix}`
    const seedKey = `personal_seed_${suffix}`
    const firstKey = `personal_candidate_a_${suffix}`
    const affinityKey = `personal_candidate_z_${suffix}`
    const seedHash = 'a'.repeat(64)
    const firstHash = 'b'.repeat(64)
    const affinityHash = 'c'.repeat(64)
    const revisionTwoHash = 'd'.repeat(64)
    const priorPersonalSwitch = process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED
    const priorBaselineSwitch = process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED

    const makeEntry = (
      catalogKey: string,
      name: string,
      revision = 1,
      contentHash = catalogKey === seedKey
        ? seedHash
        : catalogKey === firstKey
          ? firstHash
          : affinityHash
    ) => {
      const source = structuredClone(weddingBlueprintV1)
      source.catalogKey = catalogKey
      source.revision = revision
      source.contentHash = contentHash
      source.definition.blueprint.id = catalogKey
      source.definition.blueprint.revision = revision
      source.definition.blueprint.name = name
      source.definition.experienceDefaults.type = 'custom'
      for (const module of source.definition.modules) {
        if (module.type === 'experience_tree') {
          module.config.children = []
          module.config.mainEventType = 'custom'
        }
        if (module.type === 'ideas') module.config.ideas = []
        if (module.type === 'instructions') module.config.sections = []
      }
      return source
    }
    const catalog = [
      makeEntry(seedKey, 'Cottage lantern camp'),
      makeEntry(firstKey, 'Garden invitation'),
      makeEntry(affinityKey, 'Cottage lantern invitation'),
    ]
    const revisionTwoSeed = makeEntry(seedKey, 'Cottage lantern camp', 2, revisionTwoHash)
    const run = <A, E>(effect: Effect.Effect<A, E, import('@effect/sql-pg').PgClient.PgClient>) =>
      Effect.runPromise(effect.pipe(Effect.provide(PgClientLive)))
    const preference = (
      actorId: string,
      catalogKey: string,
      contentHash: string,
      enabled: boolean,
      requestId = crypto.randomUUID()
    ) =>
      run(
        workflow.updateBlueprintPreference(actorId, {
          requestId,
          catalogKey,
          revision: 1,
          contentHash,
          kind: 'like',
          enabled,
        })
      )
    const page = (actorId: string, entries = catalog, cursor?: string) =>
      run(
        workflow.enrichBlueprintCatalogPage(actorId, entries, {
          limit: 1,
          q: 'invitation',
          ranking: 'baseline_v1',
          ...(cursor ? { cursor } : {}),
        })
      )
    const ids = [actorA, actorB]
    const keys = [seedKey, firstKey, affinityKey]

    try {
      process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED = 'true'
      process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED = 'true'
      await db.insert(user).values(
        ids.map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(blueprintRevision).values(
        [...catalog, revisionTwoSeed].map((entry) => ({
          templateId: null,
          draftVersion: null,
          catalogKey: entry.catalogKey,
          revision: entry.revision,
          contentHash: entry.contentHash,
          document: entry.definition,
          description: '',
        }))
      )

      // No measurement setting is created: the functional Like still personalizes.
      const actorBPageBefore = await page(actorB)
      expect(actorBPageBefore.ok && actorBPageBefore.page.entries[0]?.catalogKey).toBe(firstKey)
      await preference(actorA, seedKey, seedHash, true)
      const actorBPageAfter = await page(actorB)
      expect(actorBPageAfter.ok && actorBPageAfter.page.entries[0]?.catalogKey).toBe(firstKey)

      // Different preference kinds retain independent revision/hash slots.
      await run(
        workflow.updateBlueprintPreference(actorA, {
          requestId: crypto.randomUUID(),
          catalogKey: seedKey,
          revision: 2,
          contentHash: revisionTwoHash,
          kind: 'bookmark',
          enabled: true,
        })
      )
      const [storedPreference] = await db
        .select()
        .from(blueprintPreference)
        .where(eq(blueprintPreference.catalogKey, seedKey))
      expect(storedPreference).toMatchObject({
        liked: true,
        bookmarked: true,
        likeRevision: 1,
        likeContentHash: seedHash,
        bookmarkRevision: 2,
        bookmarkContentHash: revisionTwoHash,
      })

      const personalized = await page(actorA)
      expect(personalized.ok && personalized.page.entries[0]?.catalogKey).toBe(affinityKey)
      expect(personalized.ok && personalized.page.ranking).toMatchObject({
        mode: 'baseline_v1',
        algorithmVersion: 'blueprint-personal-likes-v2',
        configurationVersion: 'blueprint-personal-likes-v2',
      })
      expect(JSON.stringify(personalized)).not.toContain('likeRevision')
      expect(JSON.stringify(personalized)).not.toContain(seedHash)
      const cursor = personalized.ok ? personalized.page.nextCursor : undefined
      expect(cursor).toBeDefined()

      // Functional personalization does not require analytics opt-in.
      const [measurementSetting] = await db
        .select()
        .from(blueprintMeasurementSetting)
        .where(eq(blueprintMeasurementSetting.actorUserId, actorA))
      expect(measurementSetting).toBeUndefined()

      await preference(actorA, seedKey, seedHash, false)
      const afterUnlike = await page(actorA)
      expect(afterUnlike.ok && afterUnlike.page.entries[0]?.catalogKey).toBe(firstKey)
      expect(await page(actorA, catalog, cursor)).toEqual({ ok: false, reason: 'stale_cursor' })

      await preference(actorA, seedKey, seedHash, true)
      const beforeRevisionChange = await page(actorA)
      const revisionChangeCursor = beforeRevisionChange.ok
        ? beforeRevisionChange.page.nextCursor
        : undefined
      const revisionTwo = [revisionTwoSeed, catalog[1]!, catalog[2]!]
      const afterRevisionChange = await page(actorA, revisionTwo, revisionChangeCursor)
      expect(afterRevisionChange).toEqual({ ok: false, reason: 'stale_cursor' })
      const afterRevisionPage = await page(actorA, revisionTwo)
      expect(afterRevisionPage.ok && afterRevisionPage.page.entries[0]?.catalogKey).toBe(firstKey)

      // The runtime kill switch keeps the established baseline order.
      process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED = 'false'
      const disabled = await page(actorA)
      expect(disabled.ok && disabled.page.entries[0]?.catalogKey).toBe(firstKey)
      expect(disabled.ok && disabled.page.ranking?.algorithmVersion).toBe('blueprint-baseline-v2')
    } finally {
      if (priorPersonalSwitch === undefined)
        delete process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED
      else process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED = priorPersonalSwitch
      if (priorBaselineSwitch === undefined)
        delete process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED
      else process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED = priorBaselineSwitch
      await db
        .delete(blueprintPreferenceMutation)
        .where(inArray(blueprintPreferenceMutation.actorUserId, ids))
      await db.delete(blueprintPreference).where(inArray(blueprintPreference.actorUserId, ids))
      await db.delete(user).where(inArray(user.id, ids))
      await db.delete(blueprintRevision).where(inArray(blueprintRevision.catalogKey, keys))
    }
  }
)
