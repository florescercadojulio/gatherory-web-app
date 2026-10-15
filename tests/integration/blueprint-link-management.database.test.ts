import { Cause, Effect, Exit, Layer } from 'effect'
import { expect, test } from 'vitest'
import type { BlueprintCaptureMetadata } from '@/contracts/blueprint-capture.contracts'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

test.skipIf(!enabled)(
  'native template link management enforces event and ownership scope',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in link-management database test'
    ).toBeTruthy()
    const databaseHost = new URL(databaseUrl!).hostname
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${databaseHost}`
    ).toContain(databaseHost)

    const [database, schema, blueprintSchema, managementRepo, workflow, contract, cottage] =
      await Promise.all([
        import('@/db'),
        import('@/db/schema'),
        import('@/db/schema/blueprint.schema'),
        import('@/server/blueprints/repos/blueprint-link-management.repo.live'),
        import('@/server/blueprints/workflows/blueprint-link-management.workflow'),
        import('@/contracts/blueprint-link-management.contracts'),
        import('@/db/seeds/cottage-template'),
      ])
    const { db, PgClientLive } = database
    const { user, organization, member, event, workspacePerson, eventParticipant, eventDeparture } =
      schema
    const { blueprintTemplate, blueprintRevision, blueprintShareLink } = blueprintSchema
    const { eq, inArray } = await import('drizzle-orm')
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ids = {
      sourceOrg: `link-source-org-${suffix}`,
      unrelatedOrg: `link-unrelated-org-${suffix}`,
      ownerOrg: `link-owner-org-${suffix}`,
      childOwnerOrg: `link-child-owner-org-${suffix}`,
      eventOwner: `link-event-owner-${suffix}`,
      childManager: `link-child-manager-${suffix}`,
      managerWithoutOwnership: `link-manager-no-owner-${suffix}`,
      ownerWithoutEventGrant: `link-owner-no-event-${suffix}`,
      root: crypto.randomUUID(),
      child: crypto.randomUUID(),
      sibling: crypto.randomUUID(),
      unrelatedEvent: crypto.randomUUID(),
      rootPerson: crypto.randomUUID(),
      childPerson: crypto.randomUUID(),
      managerPerson: crypto.randomUUID(),
      unrelatedPerson: crypto.randomUUID(),
      published: crypto.randomUUID(),
      draft: crypto.randomUUID(),
      retired: crypto.randomUUID(),
      installed: crypto.randomUUID(),
      unrelated: crypto.randomUUID(),
      childOwnedRoot: crypto.randomUUID(),
      childOwnedChild: crypto.randomUUID(),
      childOwnedSibling: crypto.randomUUID(),
    }
    const users = [
      ids.eventOwner,
      ids.childManager,
      ids.managerWithoutOwnership,
      ids.ownerWithoutEventGrant,
    ].map((id) => ({ id, name: id, email: `${id}@example.test`, emailVerified: true }))
    const fixtureUserIds = users.map(({ id }) => id)
    const fixtureOrganizationIds = [
      ids.sourceOrg,
      ids.unrelatedOrg,
      ids.ownerOrg,
      ids.childOwnerOrg,
    ]
    const fixtureEventIds = [ids.root, ids.child, ids.sibling, ids.unrelatedEvent]
    const now = new Date()
    const catalogKey = (label: string) => `link_${label}_${suffix}`
    const templateRows = [
      {
        id: ids.published,
        key: catalogKey('published'),
        organizationId: ids.ownerOrg,
        sourceEventId: ids.root,
        status: 'published',
      },
      {
        id: ids.draft,
        key: catalogKey('draft'),
        organizationId: ids.ownerOrg,
        sourceEventId: ids.root,
        status: 'draft',
      },
      {
        id: ids.retired,
        key: catalogKey('retired'),
        organizationId: ids.ownerOrg,
        sourceEventId: ids.root,
        status: 'published',
      },
      {
        id: ids.installed,
        key: catalogKey('installed'),
        organizationId: ids.ownerOrg,
        sourceEventId: null,
        status: 'installed',
      },
      {
        id: ids.unrelated,
        key: catalogKey('unrelated'),
        organizationId: ids.ownerOrg,
        sourceEventId: ids.unrelatedEvent,
        status: 'published',
      },
      {
        id: ids.childOwnedRoot,
        key: catalogKey('child_root'),
        organizationId: ids.childOwnerOrg,
        sourceEventId: ids.root,
        status: 'published',
      },
      {
        id: ids.childOwnedChild,
        key: catalogKey('child_child'),
        organizationId: ids.childOwnerOrg,
        sourceEventId: ids.child,
        status: 'published',
      },
      {
        id: ids.childOwnedSibling,
        key: catalogKey('child_sibling'),
        organizationId: ids.childOwnerOrg,
        sourceEventId: ids.sibling,
        status: 'published',
      },
    ] as const
    const hashFor = (key: string, revision: number) => `${key}:${revision}:integration-hash`
    const contentFor = (key: string) => ({
      ...cottage.cottageDraftContent,
      name: `Template ${key}`,
    })
    const definitionFor = (key: string, revision: number) => ({
      ...structuredClone(cottage.cottageBlueprintDefinition),
      blueprint: { ...cottage.cottageBlueprintDefinition.blueprint, id: key, revision },
    })

    const layer = managementRepo.BlueprintLinkManagementRepoLive.pipe(Layer.provide(PgClientLive))
    type Dependencies = Layer.Success<typeof layer>
    const run = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const runExit = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(Effect.exit(program.pipe(Effect.provide(layer))))
    const manage = (actorId: string, input: unknown) =>
      workflow.manageBlueprintLinksWorkflow(actorId, input)
    const denied = async (
      actorId: string,
      input: unknown,
      expectedCode = 'BLUEPRINT_SHARING_FORBIDDEN'
    ) => {
      const result = await runExit(manage(actorId, input))
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const failure = result.cause.reasons.find(Cause.isFailReason)
        expect(failure?.error).toMatchObject({ code: expectedCode })
      }
    }
    const insertTemplate = async (row: (typeof templateRows)[number]) => {
      const content = contentFor(row.key)
      const source = row.sourceEventId
        ? ({
            kind: 'event',
            // Stored capture metadata can contain an uppercase UUID. The SQL
            // association comparison must normalize it before matching.
            eventId: row.id === ids.published ? row.sourceEventId.toUpperCase() : row.sourceEventId,
            selection: {
              childIds: [],
              ideaIds: [],
              instructionIds: [],
              includeIdeaNotes: false,
            },
            capturedContent: content,
          } satisfies BlueprintCaptureMetadata)
        : { catalogKey: 'wedding', revision: 1 }
      await db.insert(blueprintTemplate).values({
        id: row.id,
        catalogKey: row.key,
        organizationId: row.organizationId,
        createdByUserId: ids.eventOwner,
        createRequestId: crypto.randomUUID(),
        createRequestHash: `request:${row.key}`,
        content,
        draftVersion: 1,
        publishedRevision: row.status === 'draft' ? null : 1,
        publishedDraftVersion: row.status === 'draft' ? null : 1,
        source,
        retiredAt: null,
        createdAt: now,
        updatedAt: now,
      })
      if (row.status !== 'draft') {
        await db.insert(blueprintRevision).values({
          id: crypto.randomUUID(),
          templateId: row.id,
          draftVersion: 1,
          description: `Description ${row.key}`,
          catalogKey: row.key,
          revision: 1,
          contentHash: hashFor(row.key, 1),
          document: definitionFor(row.key, 1),
          retiredAt: null,
          createdAt: now,
        })
      }
    }

    let phase = 'fixture setup'
    try {
      await db.insert(user).values(users)
      await db.insert(organization).values(
        fixtureOrganizationIds.map((id) => ({
          id,
          name: id,
          slug: id,
          createdAt: now,
          workspaceType: 'event' as const,
        }))
      )
      await db.insert(member).values([
        {
          id: `owner-member-${suffix}`,
          organizationId: ids.ownerOrg,
          userId: ids.eventOwner,
          role: 'owner',
          createdAt: now,
        },
        {
          id: `owner-no-event-member-${suffix}`,
          organizationId: ids.ownerOrg,
          userId: ids.ownerWithoutEventGrant,
          role: 'owner',
          createdAt: now,
        },
        {
          id: `child-owner-member-${suffix}`,
          organizationId: ids.childOwnerOrg,
          userId: ids.childManager,
          role: 'owner',
          createdAt: now,
        },
      ])
      await db.insert(workspacePerson).values([
        {
          id: ids.rootPerson,
          organizationId: ids.sourceOrg,
          userId: ids.eventOwner,
          displayName: 'Event host',
        },
        {
          id: ids.childPerson,
          organizationId: ids.sourceOrg,
          userId: ids.childManager,
          displayName: 'Child manager',
        },
        {
          id: ids.managerPerson,
          organizationId: ids.sourceOrg,
          userId: ids.managerWithoutOwnership,
          displayName: 'Event manager',
        },
        {
          id: ids.unrelatedPerson,
          organizationId: ids.sourceOrg,
          userId: ids.ownerWithoutEventGrant,
          displayName: 'Unrelated owner',
        },
      ])
      await db.insert(event).values([
        {
          id: ids.root,
          organizationId: ids.sourceOrg,
          title: 'Main event',
          status: 'draft',
          startsAt: now,
          timeZone: 'America/Detroit',
          createdByUserId: ids.eventOwner,
        },
        {
          id: ids.child,
          organizationId: ids.sourceOrg,
          parentEventId: ids.root,
          title: 'Child event',
          purpose: 'part_of_event',
          category: 'ceremony',
          planningStatus: 'draft',
          startsAt: now,
          timeZone: 'America/Detroit',
          createdByUserId: ids.eventOwner,
        },
        {
          id: ids.sibling,
          organizationId: ids.sourceOrg,
          parentEventId: ids.root,
          title: 'Sibling event',
          purpose: 'part_of_event',
          category: 'reception',
          planningStatus: 'draft',
          startsAt: now,
          timeZone: 'America/Detroit',
          createdByUserId: ids.eventOwner,
        },
        {
          id: ids.unrelatedEvent,
          organizationId: ids.unrelatedOrg,
          title: 'Unrelated event',
          status: 'draft',
          startsAt: now,
          timeZone: 'America/Detroit',
          createdByUserId: ids.eventOwner,
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
          eventId: ids.root,
          personId: ids.managerPerson,
          role: 'collaborator',
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
          personId: ids.unrelatedPerson,
          role: 'guest',
          planningPermission: 'view_only',
        },
      ])
      for (const row of templateRows) await insertTemplate(row)

      phase = 'event manager and destination owner grants'
      const rootTemplates = await run(
        manage(ids.eventOwner, { action: 'templates', eventId: ids.root })
      )
      const parsedRootTemplates =
        contract.BlueprintLinkManagementResponseSchema.parse(rootTemplates)
      expect('templates' in parsedRootTemplates).toBe(true)
      if (!('templates' in parsedRootTemplates)) throw new Error('Expected templates response')
      expect(rootTemplates).toMatchObject({
        templates: expect.arrayContaining([
          expect.objectContaining({
            id: ids.published,
            publishedRevision: 1,
            listedRevision: null,
            retired: false,
          }),
          expect.objectContaining({ id: ids.draft, publishedRevision: null, retired: false }),
          expect.objectContaining({ id: ids.retired, retired: false }),
        ]),
      })
      const listedIds = parsedRootTemplates.templates.map(({ id }) => id)
      expect(listedIds).not.toContain(ids.installed)
      expect(listedIds).not.toContain(ids.unrelated)

      const created = await run(
        manage(ids.eventOwner, {
          action: 'create',
          eventId: ids.root,
          templateId: ids.published,
          revision: 1,
        })
      )
      const parsedCreated = contract.BlueprintLinkManagementResponseSchema.parse(created)
      expect('link' in parsedCreated).toBe(true)
      if (!('link' in parsedCreated)) throw new Error('Expected created link response')
      expect(created).toMatchObject({
        link: { id: expect.any(String), revision: 1, revokedAt: null },
        token: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
      const linkId = parsedCreated.link.id
      const rawToken = parsedCreated.token
      const linkList = await run(
        manage(ids.eventOwner, { action: 'list', eventId: ids.root, templateId: ids.published })
      )
      const parsedLinkList = contract.BlueprintLinkManagementResponseSchema.parse(linkList)
      expect('links' in parsedLinkList).toBe(true)
      if (!('links' in parsedLinkList)) throw new Error('Expected links response')
      expect(linkList).toMatchObject({
        links: [expect.objectContaining({ id: linkId, revision: 1 })],
      })
      expect(JSON.stringify(linkList)).not.toContain(rawToken)
      const [persistedLink] = await db
        .select()
        .from(blueprintShareLink)
        .where(eq(blueprintShareLink.id, linkId))
      expect(persistedLink?.tokenHash).not.toBe(rawToken)
      expect(persistedLink?.tokenHash).toMatch(/^[a-f0-9]{64}$/)

      phase = 'owner listing pins and clears an exact publication'
      expect(
        await run(
          manage(ids.eventOwner, {
            action: 'listing',
            eventId: ids.root,
            templateId: ids.published,
            revision: 1,
          })
        )
      ).toEqual({ listedRevision: 1 })
      const [listedTemplate] = await db
        .select()
        .from(blueprintTemplate)
        .where(eq(blueprintTemplate.id, ids.published))
      expect(listedTemplate?.listedRevision).toBe(1)
      expect(
        await run(
          manage(ids.eventOwner, {
            action: 'listing',
            eventId: ids.root,
            templateId: ids.published,
            revision: null,
          })
        )
      ).toEqual({ listedRevision: null })
      await denied(
        ids.eventOwner,
        { action: 'listing', eventId: ids.root, templateId: ids.draft, revision: 1 },
        'BLUEPRINT_LISTING_REVISION_UNAVAILABLE'
      )

      phase = 'event manager without template ownership'
      expect(
        await run(manage(ids.managerWithoutOwnership, { action: 'templates', eventId: ids.root }))
      ).toEqual({ templates: [] })
      await denied(ids.managerWithoutOwnership, {
        action: 'list',
        eventId: ids.root,
        templateId: ids.published,
      })
      await denied(ids.managerWithoutOwnership, {
        action: 'create',
        eventId: ids.root,
        templateId: ids.published,
        revision: 1,
      })
      await denied(ids.managerWithoutOwnership, {
        action: 'listing',
        eventId: ids.root,
        templateId: ids.published,
        revision: 1,
      })
      await denied(ids.managerWithoutOwnership, {
        action: 'revoke',
        eventId: ids.root,
        templateId: ids.published,
        linkId,
      })

      phase = 'template owner without active source-event grant'
      await denied(ids.ownerWithoutEventGrant, { action: 'templates', eventId: ids.root })
      await denied(ids.ownerWithoutEventGrant, {
        action: 'list',
        eventId: ids.root,
        templateId: ids.published,
      })
      await denied(ids.ownerWithoutEventGrant, {
        action: 'create',
        eventId: ids.root,
        templateId: ids.published,
        revision: 1,
      })
      await denied(ids.ownerWithoutEventGrant, {
        action: 'listing',
        eventId: ids.root,
        templateId: ids.published,
        revision: 1,
      })
      await denied(ids.ownerWithoutEventGrant, {
        action: 'revoke',
        eventId: ids.root,
        templateId: ids.published,
        linkId,
      })

      phase = 'child-only scope and cross-organization template ownership'
      const childTemplates = await run(
        manage(ids.childManager, { action: 'templates', eventId: ids.child })
      )
      const parsedChildTemplates =
        contract.BlueprintLinkManagementResponseSchema.parse(childTemplates)
      expect('templates' in parsedChildTemplates).toBe(true)
      if (!('templates' in parsedChildTemplates)) throw new Error('Expected templates response')
      expect(parsedChildTemplates.templates.map(({ id }) => id)).toEqual([ids.childOwnedChild])
      const childLink = await run(
        manage(ids.childManager, {
          action: 'create',
          eventId: ids.child,
          templateId: ids.childOwnedChild,
          revision: 1,
        })
      )
      const parsedChildLink = contract.BlueprintLinkManagementResponseSchema.parse(childLink)
      expect('link' in parsedChildLink).toBe(true)
      if (!('link' in parsedChildLink)) throw new Error('Expected created link response')
      expect(childLink).toMatchObject({ link: { revision: 1 }, token: expect.any(String) })
      for (const templateId of [ids.childOwnedRoot, ids.childOwnedSibling]) {
        await denied(ids.childManager, { action: 'list', eventId: ids.child, templateId })
        await denied(ids.childManager, {
          action: 'create',
          eventId: ids.child,
          templateId,
          revision: 1,
        })
        await denied(ids.childManager, {
          action: 'revoke',
          eventId: ids.child,
          templateId,
          linkId: crypto.randomUUID(),
        })
      }
      await denied(ids.childManager, {
        action: 'list',
        eventId: ids.root,
        templateId: ids.childOwnedChild,
      })

      phase = 'draft, installed-provenance, and unrelated-source constraints'
      await denied(
        ids.eventOwner,
        {
          action: 'create',
          eventId: ids.root,
          templateId: ids.draft,
          revision: 1,
        },
        'BLUEPRINT_LINK_UNAVAILABLE'
      )
      await denied(ids.eventOwner, {
        action: 'create',
        eventId: ids.root,
        templateId: ids.installed,
        revision: 1,
      })
      await denied(ids.eventOwner, {
        action: 'create',
        eventId: ids.root,
        templateId: ids.unrelated,
        revision: 1,
      })

      phase = 'retired template remains manageable for revocation'
      const retiredLink = await run(
        manage(ids.eventOwner, {
          action: 'create',
          eventId: ids.root,
          templateId: ids.retired,
          revision: 1,
        })
      )
      const parsedRetiredLink = contract.BlueprintLinkManagementResponseSchema.parse(retiredLink)
      expect('link' in parsedRetiredLink).toBe(true)
      if (!('link' in parsedRetiredLink)) throw new Error('Expected created link response')
      await db
        .update(blueprintTemplate)
        .set({ retiredAt: now })
        .where(eq(blueprintTemplate.id, ids.retired))
      expect(
        await run(
          manage(ids.eventOwner, {
            action: 'listing',
            eventId: ids.root,
            templateId: ids.retired,
            revision: null,
          })
        )
      ).toEqual({ listedRevision: null })
      await denied(
        ids.eventOwner,
        { action: 'listing', eventId: ids.root, templateId: ids.retired, revision: 1 },
        'BLUEPRINT_SHARING_FORBIDDEN'
      )
      const retiredTemplates = await run(
        manage(ids.eventOwner, { action: 'templates', eventId: ids.root })
      )
      const parsedRetiredTemplates =
        contract.BlueprintLinkManagementResponseSchema.parse(retiredTemplates)
      expect('templates' in parsedRetiredTemplates).toBe(true)
      if (!('templates' in parsedRetiredTemplates)) throw new Error('Expected templates response')
      expect(parsedRetiredTemplates.templates).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: ids.retired, retired: true })])
      )
      const retiredLinks = await run(
        manage(ids.eventOwner, { action: 'list', eventId: ids.root, templateId: ids.retired })
      )
      const parsedRetiredLinks = contract.BlueprintLinkManagementResponseSchema.parse(retiredLinks)
      expect('links' in parsedRetiredLinks).toBe(true)
      if (!('links' in parsedRetiredLinks)) throw new Error('Expected links response')
      expect(parsedRetiredLinks.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: parsedRetiredLink.link.id, revokedAt: null }),
        ])
      )
      await run(
        manage(ids.eventOwner, {
          action: 'revoke',
          eventId: ids.root,
          templateId: ids.retired,
          linkId: parsedRetiredLink.link.id,
        })
      )
      const revokedLinks = await run(
        manage(ids.eventOwner, { action: 'list', eventId: ids.root, templateId: ids.retired })
      )
      const parsedRevokedLinks = contract.BlueprintLinkManagementResponseSchema.parse(revokedLinks)
      expect('links' in parsedRevokedLinks).toBe(true)
      if (!('links' in parsedRevokedLinks)) throw new Error('Expected links response')
      expect(parsedRevokedLinks.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: parsedRetiredLink.link.id, revokedAt: expect.any(String) }),
        ])
      )
      await denied(
        ids.eventOwner,
        {
          action: 'create',
          eventId: ids.root,
          templateId: ids.retired,
          revision: 1,
        },
        'BLUEPRINT_LINK_UNAVAILABLE'
      )

      phase = 'departed host no longer manages source event'
      await db.insert(eventDeparture).values({ eventId: ids.root, userId: ids.eventOwner })
      await denied(ids.eventOwner, { action: 'templates', eventId: ids.root })
    } catch (error) {
      throw new Error(`Blueprint link management integration failed during ${phase}`, {
        cause: error,
      })
    } finally {
      await db.delete(event).where(inArray(event.id, fixtureEventIds))
      await db.delete(organization).where(inArray(organization.id, fixtureOrganizationIds))
      await db.delete(user).where(inArray(user.id, fixtureUserIds))
      await database.pool.end()
    }
  }
)
