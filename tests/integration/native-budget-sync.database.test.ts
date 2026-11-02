import { expect, test } from 'vitest'

const enabled = process.env.RUN_NATIVE_BUDGET_DB_TESTS === '1'

function assertDisposableDatabase() {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for native budget database tests')
  const url = new URL(value)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Native budget database tests require a loopback database')
  if (!url.pathname.replace(/^\//, '').startsWith('gatherory_budget_test'))
    throw new Error('Native budget database tests require a gatherory_budget_test database name')
}

function archive(input: {
  rootId: string
  title: string
  workspaceCap: number | null
  mainAllocation: number | null
  children: Array<{ id: string; title: string; budgetCap: number | null }>
}) {
  return Buffer.from(
    JSON.stringify({
      mainEventID: input.rootId,
      title: input.title,
      mainEventStartsAt: 820_000_000,
      mainEventIsAllDay: false,
      mainEventTimeZoneIdentifier: 'America/Detroit',
      venueName: '',
      location: '',
      dressCode: '',
      eventMessage: '',
      planningMode: 'openToIdeas',
      members: [],
      mainEventParticipantIDs: [],
      ideas: [],
      timeline: input.children,
      eventExpenses: [],
      notes: [],
      mainEventStatus: 'draft',
      eventMoments: [],
      isMainEventDeleted: false,
      registry: [],
      workspaceBudgetCap: input.workspaceCap,
      mainEventBudgetCap: input.mainAllocation,
      isRegistryShared: false,
      isCollaboratorLinkEnabled: true,
      requiresCollaboratorApproval: true,
      defaultCollaboratorPermission: 'contribute',
    })
  ).toString('base64')
}

async function createFixture() {
  assertDisposableDatabase()
  const { db } = await import('@/db')
  const { user, organization } = await import('@/db/schema/auth.schema')
  const { event, eventParticipant, workspacePerson } = await import('@/db/schema/event.schema')
  const { eventExpense, idea, workspacePlanningSettings } =
    await import('@/db/schema/planning.schema')
  const { nativeSyncMutationReceipt, nativeWorkspaceSnapshot, nativeSyncEntity, nativeSyncChange } =
    await import('@/db/schema/sync.schema')
  const { and, eq, inArray } = await import('drizzle-orm')

  const rootId = crypto.randomUUID()
  const childA = crypto.randomUUID()
  const childB = crypto.randomUUID()
  const userSuffix = crypto.randomUUID()
  const hostId = `budget-host-${userSuffix}`
  const managerId = `budget-manager-${userSuffix}`
  const contributorId = `budget-contributor-${userSuffix}`
  const rootOnlyManagerId = `budget-root-manager-${userSuffix}`
  const userIds = [hostId, managerId, contributorId, rootOnlyManagerId]
  const organizationId = `budget-${rootId}`
  const personIds = userIds.map(() => crypto.randomUUID())
  const startsAt = new Date('2031-07-01T16:00:00.000Z')
  const initialPayload = archive({
    rootId,
    title: 'Budget test event',
    workspaceCap: 1000,
    mainAllocation: 800,
    children: [
      { id: childA, title: 'First child', budgetCap: null },
      { id: childB, title: 'Second child', budgetCap: null },
    ],
  })

  try {
    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
      }))
    )
    await db.insert(organization).values({
      id: organizationId,
      name: 'Native budget database fixture',
      slug: `budget-${rootId}`,
      createdAt: new Date(),
      workspaceType: 'event',
    })
    await db.insert(event).values([
      {
        id: rootId,
        organizationId,
        title: 'Budget test event',
        status: 'draft',
        timeZone: 'America/Detroit',
        startsAt,
        budgetCap: '800.00',
        createdByUserId: hostId,
      },
      ...[
        { id: childA, title: 'First child' },
        { id: childB, title: 'Second child' },
      ].map(({ id, title }) => ({
        id,
        organizationId,
        parentEventId: rootId,
        title,
        purpose: 'planning_scouting' as const,
        category: 'other' as const,
        planningStatus: 'draft' as const,
        timeZone: 'America/Detroit',
        startsAt,
        createdByUserId: hostId,
      })),
    ])
    await db.insert(workspacePerson).values(
      userIds.map((userId, index) => ({
        id: personIds[index]!,
        organizationId,
        userId,
        displayName: userId,
        email: `${userId}@example.test`,
      }))
    )
    await db.insert(eventParticipant).values([
      {
        eventId: rootId,
        personId: personIds[0]!,
        role: 'host',
        planningPermission: 'manage',
        attendanceStatus: 'going',
      },
      {
        eventId: rootId,
        personId: personIds[1]!,
        role: 'collaborator',
        planningPermission: 'manage',
        attendanceStatus: 'going',
      },
      {
        eventId: rootId,
        personId: personIds[2]!,
        role: 'collaborator',
        planningPermission: 'contribute',
        attendanceStatus: 'going',
      },
      {
        eventId: rootId,
        personId: personIds[3]!,
        role: 'collaborator',
        planningPermission: 'manage',
        attendanceStatus: 'going',
      },
      ...[childA, childB].flatMap((eventId) => [
        {
          eventId,
          personId: personIds[0]!,
          role: 'collaborator' as const,
          planningPermission: 'manage' as const,
          attendanceStatus: 'going' as const,
        },
        {
          eventId,
          personId: personIds[1]!,
          role: 'collaborator' as const,
          planningPermission: 'manage' as const,
          attendanceStatus: 'going' as const,
        },
        ...(eventId === childA
          ? [
              {
                eventId,
                personId: personIds[2]!,
                role: 'collaborator' as const,
                planningPermission: 'contribute' as const,
                attendanceStatus: 'going' as const,
              },
            ]
          : []),
      ]),
    ])
    await db.insert(workspacePlanningSettings).values({
      organizationId,
      budgetCap: '1000.00',
      currencyCode: 'USD',
    })
    await db.insert(nativeWorkspaceSnapshot).values({
      scopeId: rootId,
      ownerUserId: hostId,
      organizationId,
      payload: initialPayload,
      serverVersion: 1,
      isDeleted: false,
    })

    return {
      db,
      rootId,
      childA,
      childB,
      hostId,
      managerId,
      contributorId,
      rootOnlyManagerId,
      userIds,
      organizationId,
      initialPayload,
      event,
      organization,
      user,
      workspacePlanningSettings,
      eventExpense,
      idea,
      nativeSyncMutationReceipt,
      nativeWorkspaceSnapshot,
      nativeSyncEntity,
      nativeSyncChange,
      eq,
      and,
      inArray,
    }
  } catch (error) {
    await db.delete(organization).where(eq(organization.id, organizationId))
    await db.delete(user).where(inArray(user.id, userIds))
    throw error
  }
}

async function withFixture(
  run: (fixture: Awaited<ReturnType<typeof createFixture>>) => Promise<void>
) {
  const fixture = await createFixture()
  try {
    await run(fixture)
  } finally {
    await fixture.db
      .delete(fixture.nativeSyncMutationReceipt)
      .where(fixture.inArray(fixture.nativeSyncMutationReceipt.ownerUserId, fixture.userIds))
    await fixture.db
      .delete(fixture.organization)
      .where(fixture.eq(fixture.organization.id, fixture.organizationId))
    await fixture.db.delete(fixture.user).where(fixture.inArray(fixture.user.id, fixture.userIds))
  }
}

function budgetMutation(input: {
  rootId: string
  id?: string
  expectedBudgetVersion: number
  workspaceCapCents: number | null
  allocations: Array<{ eventID: string; amountCents: number | null }>
}) {
  const payload = {
    expectedBudgetVersion: input.expectedBudgetVersion,
    operation: 'replace_budget',
    workspaceCapCents: input.workspaceCapCents,
    allocations: input.allocations,
  }
  return {
    id: input.id ?? crypto.randomUUID(),
    scopeID: input.rootId,
    entityType: 'budget_transfer' as const,
    entityID: input.rootId,
    operation: 'update' as const,
    payloadSchemaVersion: 1 as const,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    baseVersion: input.expectedBudgetVersion,
    payload: Buffer.from(JSON.stringify(payload)).toString('base64'),
  }
}

async function push(userId: string, mutation: ReturnType<typeof budgetMutation>) {
  const { applyNativeMutations } = await import('@/server/sync/native-sync')
  return (
    await applyNativeMutations({
      userId,
      mutations: [mutation],
      supportsBudgetAtomic: true,
    })
  ).results[0]!
}

test.skipIf(!enabled)(
  'budget replacements require an editable root and editable changed child targets',
  async () => {
    await withFixture(async (fixture) => {
      for (const rootStatus of ['finished', 'cancelled'] as const) {
        await fixture.db
          .update(fixture.event)
          .set({ status: rootStatus })
          .where(fixture.eq(fixture.event.id, fixture.rootId))
        const result = await push(
          fixture.managerId,
          budgetMutation({
            rootId: fixture.rootId,
            expectedBudgetVersion: 0,
            workspaceCapCents: 100_000,
            allocations: [
              { eventID: fixture.rootId, amountCents: 70_000 },
              { eventID: fixture.childA, amountCents: 10_000 },
              { eventID: fixture.childB, amountCents: null },
            ],
          })
        )
        expect(result.failureCode).toBe('BUDGET_MANAGER_REQUIRED')
      }
      await fixture.db
        .update(fixture.event)
        .set({ status: 'draft' })
        .where(fixture.eq(fixture.event.id, fixture.rootId))

      for (const childStatus of ['archived', 'cancelled'] as const) {
        await fixture.db
          .update(fixture.event)
          .set({ planningStatus: childStatus, completionStatus: 'upcoming' })
          .where(fixture.eq(fixture.event.id, fixture.childA))
        const result = await push(
          fixture.managerId,
          budgetMutation({
            rootId: fixture.rootId,
            expectedBudgetVersion: 0,
            workspaceCapCents: 100_000,
            allocations: [
              { eventID: fixture.rootId, amountCents: 70_000 },
              { eventID: fixture.childA, amountCents: 10_000 },
              { eventID: fixture.childB, amountCents: null },
            ],
          })
        )
        expect(result.failureCode).toBe('BUDGET_TARGET_MANAGER_REQUIRED')
      }
      await fixture.db
        .update(fixture.event)
        .set({ planningStatus: 'draft', completionStatus: 'complete' })
        .where(fixture.eq(fixture.event.id, fixture.childA))
      const completedChild = await push(
        fixture.managerId,
        budgetMutation({
          rootId: fixture.rootId,
          expectedBudgetVersion: 0,
          workspaceCapCents: 100_000,
          allocations: [
            { eventID: fixture.rootId, amountCents: 70_000 },
            { eventID: fixture.childA, amountCents: 10_000 },
            { eventID: fixture.childB, amountCents: null },
          ],
        })
      )
      expect(completedChild.failureCode).toBe('BUDGET_TARGET_MANAGER_REQUIRED')
    })
  }
)

test.skipIf(!enabled)(
  'paid expenses retain canonical amount and status through stale edits, archive omission, deletion, and rehome',
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations, listNativeWorkspaceSnapshots } =
        await import('@/server/sync/native-sync')
      const expenseId = crypto.randomUUID()
      const ideaId = crypto.randomUUID()
      const now = new Date()
      await fixture.db.insert(fixture.idea).values({
        id: ideaId,
        organizationId: fixture.organizationId,
        eventId: fixture.childA,
        category: 'other',
        title: 'Expense source idea',
        configuration: { version: 1 },
        submittedByUserId: fixture.hostId,
      })
      await fixture.db.insert(fixture.eventExpense).values({
        id: expenseId,
        organizationId: fixture.organizationId,
        eventId: fixture.childA,
        sourceIdeaId: ideaId,
        title: 'Original paid expense',
        amount: '250.00',
        category: 'other',
        status: 'paid',
        createdByUserId: fixture.hostId,
        createdAt: now,
        updatedAt: now,
      })

      const ideaDeleteResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [
          {
            id: crypto.randomUUID(),
            scopeID: fixture.rootId,
            entityType: 'idea',
            entityID: ideaId,
            operation: 'delete',
            payloadSchemaVersion: 1,
            createdAt: new Date().toISOString(),
            attemptCount: 0,
            baseVersion: null,
            payload: '',
          },
        ],
      })
      expect(ideaDeleteResult.results[0]?.disposition).toBe('applied')
      const [afterIdeaDelete] = await fixture.db
        .select()
        .from(fixture.eventExpense)
        .where(fixture.eq(fixture.eventExpense.id, expenseId))
      expect(afterIdeaDelete).toMatchObject({
        amount: '250.00',
        status: 'paid',
        sourceIdeaId: null,
      })

      const expensePayload = (input: {
        eventID: string
        title: string
        amount: number
        status: string
      }) =>
        Buffer.from(
          JSON.stringify({
            id: expenseId,
            ...input,
            sourceIdeaID: null,
            category: 'other',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })
        ).toString('base64')
      const staleExpenseUpdate = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'expense' as const,
        entityID: expenseId,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        payload: expensePayload({
          eventID: fixture.childA,
          title: 'Updated expense title',
          amount: 1,
          status: 'committed',
        }),
      }
      const staleResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [staleExpenseUpdate],
      })
      expect(staleResult.results[0]?.disposition).toBe('applied')
      const [afterStaleUpdate] = await fixture.db
        .select()
        .from(fixture.eventExpense)
        .where(fixture.eq(fixture.eventExpense.id, expenseId))
      expect(afterStaleUpdate).toMatchObject({
        amount: '250.00',
        status: 'paid',
        title: 'Updated expense title',
      })
      const omittedAmountStatusResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [
          {
            ...staleExpenseUpdate,
            id: crypto.randomUUID(),
            baseVersion: 1,
            payload: Buffer.from(
              JSON.stringify({
                id: expenseId,
                eventID: fixture.childA,
                sourceIdeaID: null,
                title: 'Title edit with omitted settlement fields',
                category: 'other',
              })
            ).toString('base64'),
          },
        ],
      })
      expect(omittedAmountStatusResult.results[0]?.disposition).toBe('applied')
      const [afterOmittedFields] = await fixture.db
        .select()
        .from(fixture.eventExpense)
        .where(fixture.eq(fixture.eventExpense.id, expenseId))
      expect(afterOmittedFields).toMatchObject({ amount: '250.00', status: 'paid' })
      const [expenseEntity] = await fixture.db
        .select()
        .from(fixture.nativeSyncEntity)
        .where(
          fixture.and(
            fixture.eq(fixture.nativeSyncEntity.entityType, 'expense'),
            fixture.eq(fixture.nativeSyncEntity.entityId, expenseId)
          )
        )
      const entityPayload = JSON.parse(
        Buffer.from(expenseEntity!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      expect(typeof entityPayload.amount).toBe('number')
      expect(entityPayload.amount).toBe(250)
      expect(entityPayload.status).toBe('paid')

      const childDelete = (id: string) => ({
        id,
        scopeID: fixture.rootId,
        entityType: 'event' as const,
        entityID: fixture.childA,
        operation: 'delete' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        payload: '',
      })
      const protectedChildDelete = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [childDelete(crypto.randomUUID())],
      })
      expect(protectedChildDelete.results[0]?.failureCode).toBe('PAID_EXPENSE_REHOME_REQUIRED')

      const staleArchive = JSON.parse(
        Buffer.from(
          archive({
            rootId: fixture.rootId,
            title: 'Archive edit',
            workspaceCap: 1000,
            mainAllocation: 800,
            children: [
              { id: fixture.childA, title: 'First child', budgetCap: null },
              { id: fixture.childB, title: 'Second child', budgetCap: null },
            ],
          }),
          'base64'
        ).toString('utf8')
      ) as Record<string, unknown>
      staleArchive.eventExpenses = [
        {
          id: expenseId,
          eventID: fixture.childA,
          sourceIdeaID: null,
          title: 'Archive title edit',
          amount: 2,
          category: 'other',
          status: 'committed',
        },
      ]
      const archiveMutation = (input: {
        id: string
        baseVersion: number
        payload: Record<string, unknown>
      }) => ({
        id: input.id,
        scopeID: fixture.rootId,
        entityType: 'workspace' as const,
        entityID: fixture.rootId,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        baseVersion: input.baseVersion,
        payload: Buffer.from(JSON.stringify(input.payload)).toString('base64'),
      })
      const staleArchiveResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [
          archiveMutation({
            id: crypto.randomUUID(),
            baseVersion: 1,
            payload: staleArchive,
          }),
        ],
      })
      expect(staleArchiveResult.results[0]?.disposition).toBe('applied')
      const [snapshotWithStaleExpense] = await fixture.db
        .select({ payload: fixture.nativeWorkspaceSnapshot.payload })
        .from(fixture.nativeWorkspaceSnapshot)
        .where(fixture.eq(fixture.nativeWorkspaceSnapshot.scopeId, fixture.rootId))
      const staleStoredArchive = JSON.parse(
        Buffer.from(snapshotWithStaleExpense!.payload, 'base64').toString('utf8')
      ) as { eventExpenses: Array<Record<string, unknown>> }
      expect(staleStoredArchive.eventExpenses[0]).toMatchObject({
        amount: 250,
        status: 'paid',
        title: 'Archive title edit',
      })

      const omittedArchive = { ...staleArchive }
      delete omittedArchive.eventExpenses
      const omittedResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [
          archiveMutation({
            id: crypto.randomUUID(),
            baseVersion: 2,
            payload: omittedArchive,
          }),
        ],
      })
      expect(omittedResult.results[0]?.disposition).toBe('applied')
      const [snapshotWithOmittedExpense] = await fixture.db
        .select({ payload: fixture.nativeWorkspaceSnapshot.payload })
        .from(fixture.nativeWorkspaceSnapshot)
        .where(fixture.eq(fixture.nativeWorkspaceSnapshot.scopeId, fixture.rootId))
      const omittedStoredArchive = JSON.parse(
        Buffer.from(snapshotWithOmittedExpense!.payload, 'base64').toString('utf8')
      ) as { eventExpenses: Array<Record<string, unknown>> }
      expect(omittedStoredArchive.eventExpenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expenseId,
            amount: 250,
            status: 'paid',
          }),
        ])
      )
      const bootstrap = await listNativeWorkspaceSnapshots({
        userId: fixture.managerId,
        supportsBudgetAtomic: true,
      })
      const bootstrapArchive = JSON.parse(
        Buffer.from(bootstrap.snapshots[0]!.payload, 'base64').toString('utf8')
      ) as { eventExpenses: Array<Record<string, unknown>> }
      expect(bootstrapArchive.eventExpenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: expenseId, amount: 250, status: 'paid' }),
        ])
      )

      const rehomeResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [
          {
            ...staleExpenseUpdate,
            id: crypto.randomUUID(),
            baseVersion: expenseEntity!.serverVersion,
            payload: expensePayload({
              eventID: fixture.childB,
              title: 'Rehomed paid expense',
              amount: 5,
              status: 'estimated',
            }),
          },
        ],
      })
      expect(rehomeResult.results[0]?.disposition).toBe('applied')
      const [rehomeRow] = await fixture.db
        .select()
        .from(fixture.eventExpense)
        .where(fixture.eq(fixture.eventExpense.id, expenseId))
      expect(rehomeRow).toMatchObject({
        eventId: fixture.childB,
        amount: '250.00',
        status: 'paid',
      })
      const { scopedEventSnapshot } =
        await import('@/server/sync/repos/scoped-event-sync.persistence')
      const priorChildSnapshot = await fixture.db.transaction((transaction) =>
        scopedEventSnapshot(transaction, fixture.childA, fixture.managerId)
      )
      expect(priorChildSnapshot).not.toBeNull()
      const priorChildArchive = JSON.parse(
        Buffer.from(priorChildSnapshot!.payload, 'base64').toString('utf8')
      ) as { eventExpenses: Array<Record<string, unknown>> }
      expect(priorChildArchive.eventExpenses).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: expenseId })])
      )
      const rehomedChildDelete = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [childDelete(crypto.randomUUID())],
      })
      expect(rehomedChildDelete.results[0]?.disposition).toBe('applied')

      const deleteResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [
          {
            ...staleExpenseUpdate,
            id: crypto.randomUUID(),
            operation: 'delete' as const,
            baseVersion: expenseEntity!.serverVersion + 1,
            payload: '',
          },
        ],
      })
      expect(deleteResult.results[0]?.failureCode).toBe('PAID_EXPENSE_PROTECTED')
      const [afterDeleteAttempt] = await fixture.db
        .select()
        .from(fixture.eventExpense)
        .where(fixture.eq(fixture.eventExpense.id, expenseId))
      expect(afterDeleteAttempt).toMatchObject({ amount: '250.00', status: 'paid' })
    })
  }
)

test.skipIf(!enabled)(
  'pushes a paid expense rehome, child deletion, and post-deletion budget vector in dependency order',
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations, listNativeWorkspaceSnapshots, pullNativeChanges } =
        await import('@/server/sync/native-sync')
      const expenseId = crypto.randomUUID()
      const now = new Date()
      await fixture.db.insert(fixture.eventExpense).values({
        id: expenseId,
        organizationId: fixture.organizationId,
        eventId: fixture.childA,
        sourceIdeaId: null,
        title: 'Paid child expense',
        amount: '250.00',
        category: 'food_and_drink',
        status: 'paid',
        createdByUserId: fixture.hostId,
        createdAt: now,
        updatedAt: now,
      })
      await fixture.db.insert(fixture.nativeSyncEntity).values({
        scopeId: fixture.rootId,
        entityType: 'event',
        entityId: fixture.childB,
        ownerUserId: fixture.hostId,
        payload: Buffer.from(
          JSON.stringify({ id: fixture.childB, title: 'Second child', budgetCap: null })
        ).toString('base64'),
        serverVersion: 1,
        isDeleted: false,
      })

      const expenseRehome = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'expense' as const,
        entityID: expenseId,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: now.toISOString(),
        attemptCount: 0,
        payload: Buffer.from(
          JSON.stringify({
            id: expenseId,
            eventID: fixture.rootId,
            sourceIdeaID: null,
            title: 'Paid expense rehomed to root',
            amount: 1,
            category: 'foodAndDrink',
            status: 'estimated',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })
        ).toString('base64'),
      }
      const deleteChild = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'event' as const,
        entityID: fixture.childA,
        operation: 'delete' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: now.toISOString(),
        attemptCount: 0,
        payload: '',
      }
      const postDeleteBudget = budgetMutation({
        rootId: fixture.rootId,
        expectedBudgetVersion: 0,
        workspaceCapCents: 100_000,
        allocations: [
          { eventID: fixture.rootId, amountCents: 80_000 },
          { eventID: fixture.childB, amountCents: 20_000 },
        ],
      })

      const result = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [postDeleteBudget, deleteChild, expenseRehome],
        supportsBudgetAtomic: true,
      })
      expect(result.results.map((item) => item.disposition)).toEqual([
        'applied',
        'applied',
        'applied',
      ])

      const [paidExpense] = await fixture.db
        .select()
        .from(fixture.eventExpense)
        .where(fixture.eq(fixture.eventExpense.id, expenseId))
      expect(paidExpense).toMatchObject({
        eventId: fixture.rootId,
        sourceIdeaId: null,
        amount: '250.00',
        category: 'food_and_drink',
        status: 'paid',
      })
      const [deletedChild] = await fixture.db
        .select({ id: fixture.event.id })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, fixture.childA))
      expect(deletedChild).toBeUndefined()

      const bootstrap = await listNativeWorkspaceSnapshots({
        userId: fixture.managerId,
        supportsBudgetAtomic: true,
      })
      const currentArchive = JSON.parse(
        Buffer.from(bootstrap.snapshots[0]!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      const currentTimeline = currentArchive.timeline as Array<Record<string, unknown>>
      expect(typeof currentArchive.workspaceBudgetCap).toBe('number')
      expect(currentArchive.workspaceBudgetCap).toBe(1000)
      expect(typeof currentArchive.mainEventBudgetCap).toBe('number')
      expect(currentArchive.mainEventBudgetCap).toBe(800)
      expect(currentTimeline).toHaveLength(1)
      expect(currentTimeline[0]).toMatchObject({ id: fixture.childB, budgetCap: 200 })
      expect(typeof currentTimeline[0]?.budgetCap).toBe('number')
      const paidArchiveExpense = (
        currentArchive.eventExpenses as Array<Record<string, unknown>>
      ).find((expense) => expense.id === expenseId)
      expect(paidArchiveExpense).toMatchObject({
        eventID: fixture.rootId,
        sourceIdeaID: null,
        amount: 250,
        category: 'foodAndDrink',
        status: 'paid',
      })
      expect(typeof paidArchiveExpense?.amount).toBe('number')

      const [versionedChild] = await fixture.db
        .select({ payload: fixture.nativeSyncEntity.payload })
        .from(fixture.nativeSyncEntity)
        .where(
          fixture.and(
            fixture.eq(fixture.nativeSyncEntity.entityType, 'event'),
            fixture.eq(fixture.nativeSyncEntity.entityId, fixture.childB)
          )
        )
      const versionedChildArchive = JSON.parse(
        Buffer.from(versionedChild!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      expect(typeof versionedChildArchive.budgetCap).toBe('number')
      expect(versionedChildArchive.budgetCap).toBe(200)

      const sharedBudgetPull = await pullNativeChanges({
        userId: fixture.managerId,
        scopeId: fixture.rootId,
        after: 0,
        supportsBudgetAtomic: true,
      })
      expect(sharedBudgetPull).not.toBeNull()
      const pulledEvent = sharedBudgetPull!.changes.find(
        (change) => change.entityType === 'event' && change.entityID === fixture.childB
      )
      expect(pulledEvent).toBeDefined()
      const pulledEventArchive = JSON.parse(
        Buffer.from(pulledEvent!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      expect(typeof pulledEventArchive.budgetCap).toBe('number')
      expect(pulledEventArchive.budgetCap).toBe(200)
    })
  }
)

test.skipIf(!enabled)(
  'new workspace snapshots cannot bootstrap an over-allocated budget before a budget version exists',
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations } = await import('@/server/sync/native-sync')
      await fixture.db
        .delete(fixture.nativeWorkspaceSnapshot)
        .where(fixture.eq(fixture.nativeWorkspaceSnapshot.scopeId, fixture.rootId))
      const invalidArchive = archive({
        rootId: fixture.rootId,
        title: 'Invalid initial budget',
        workspaceCap: 100,
        mainAllocation: 101,
        children: [
          { id: fixture.childA, title: 'First child', budgetCap: null },
          { id: fixture.childB, title: 'Second child', budgetCap: null },
        ],
      })
      const result = await applyNativeMutations({
        userId: fixture.hostId,
        mutations: [
          {
            id: crypto.randomUUID(),
            scopeID: fixture.rootId,
            entityType: 'workspace',
            entityID: fixture.rootId,
            operation: 'create',
            payloadSchemaVersion: 1,
            createdAt: new Date().toISOString(),
            attemptCount: 0,
            baseVersion: 0,
            payload: invalidArchive,
          },
        ],
      })
      expect(result.results[0]?.failureCode).toBe('BUDGET_CONSERVATION_INVALID')
      const [settings] = await fixture.db
        .select({ budgetCap: fixture.workspacePlanningSettings.budgetCap })
        .from(fixture.workspacePlanningSettings)
        .where(fixture.eq(fixture.workspacePlanningSettings.organizationId, fixture.organizationId))
      expect(settings?.budgetCap).toBe('1000.00')
      const [snapshot] = await fixture.db
        .select()
        .from(fixture.nativeWorkspaceSnapshot)
        .where(fixture.eq(fixture.nativeWorkspaceSnapshot.scopeId, fixture.rootId))
      expect(snapshot).toBeUndefined()
    })
  }
)

test.skipIf(!enabled)(
  'native budget replacement serializes competing managers and deduplicates retries',
  async () => {
    await withFixture(async (fixture) => {
      const allocations = (child: string) => [
        { eventID: fixture.rootId, amountCents: 65_000 },
        { eventID: fixture.childA, amountCents: child === fixture.childA ? 15_000 : null },
        { eventID: fixture.childB, amountCents: child === fixture.childB ? 15_000 : null },
      ]
      const left = budgetMutation({
        rootId: fixture.rootId,
        expectedBudgetVersion: 0,
        workspaceCapCents: 100_000,
        allocations: allocations(fixture.childA),
      })
      const right = budgetMutation({
        rootId: fixture.rootId,
        expectedBudgetVersion: 0,
        workspaceCapCents: 100_000,
        allocations: allocations(fixture.childB),
      })

      const { applyNativeMutations, listNativeWorkspaceSnapshots, pullNativeChanges } =
        await import('@/server/sync/native-sync')
      await expect(
        applyNativeMutations({
          userId: fixture.managerId,
          mutations: [left],
          supportsBudgetAtomic: false,
        })
      ).rejects.toMatchObject({ code: 'budget_client_upgrade_required' })

      const results = await Promise.all([
        push(fixture.managerId, left),
        push(fixture.hostId, right),
      ])
      expect(results.map((result) => result.disposition).sort()).toEqual(['applied', 'conflict'])
      const conflict = results.find((result) => result.disposition === 'conflict')!
      expect(conflict.failureCode).toBe('BUDGET_VERSION_CONFLICT')
      expect(conflict.serverVersion).toBe(1)

      const winningUser = results[0]?.disposition === 'applied' ? fixture.managerId : fixture.hostId
      const winningMutation = results[0]?.disposition === 'applied' ? left : right
      expect((await push(winningUser, winningMutation)).disposition).toBe('duplicate')

      const [root] = await fixture.db
        .select({ budgetCap: fixture.event.budgetCap })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, fixture.rootId))
      const [childA] = await fixture.db
        .select({ budgetCap: fixture.event.budgetCap })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, fixture.childA))
      const [childB] = await fixture.db
        .select({ budgetCap: fixture.event.budgetCap })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, fixture.childB))
      const childTotal = Number(childA?.budgetCap ?? 0) + Number(childB?.budgetCap ?? 0)
      expect(Number(root?.budgetCap ?? 0) + childTotal).toBe(800)

      const [revision] = await fixture.db
        .select({ serverVersion: fixture.nativeSyncEntity.serverVersion })
        .from(fixture.nativeSyncEntity)
        .where(
          fixture.and(
            fixture.eq(fixture.nativeSyncEntity.scopeId, fixture.rootId),
            fixture.eq(fixture.nativeSyncEntity.entityType, 'budget_transfer'),
            fixture.eq(fixture.nativeSyncEntity.entityId, fixture.rootId)
          )
        )
      expect(revision?.serverVersion).toBe(1)
      await expect(
        listNativeWorkspaceSnapshots({ userId: fixture.managerId, supportsTodos: true })
      ).rejects.toMatchObject({ code: 'budget_client_upgrade_required' })
      await expect(
        pullNativeChanges({
          userId: fixture.managerId,
          scopeId: fixture.rootId,
          after: 0,
          supportsTodos: true,
        })
      ).rejects.toMatchObject({ code: 'budget_client_upgrade_required' })
    })
  }
)

test.skipIf(!enabled)(
  'native budget replacement applies cap and all allocations together and rejects over-allocation',
  async () => {
    await withFixture(async (fixture) => {
      await fixture.db.insert(fixture.nativeSyncEntity).values({
        scopeId: fixture.rootId,
        entityType: 'event',
        entityId: fixture.childA,
        ownerUserId: fixture.hostId,
        payload: Buffer.from(
          JSON.stringify({ id: fixture.childA, title: 'First child', budgetCap: null })
        ).toString('base64'),
        serverVersion: 1,
        isDeleted: false,
      })
      const accepted = budgetMutation({
        rootId: fixture.rootId,
        expectedBudgetVersion: 0,
        workspaceCapCents: 110_000,
        allocations: [
          { eventID: fixture.rootId, amountCents: 90_000 },
          { eventID: fixture.childA, amountCents: 10_000 },
          { eventID: fixture.childB, amountCents: 10_000 },
        ],
      })
      expect((await push(fixture.managerId, accepted)).disposition).toBe('applied')
      const { listNativeWorkspaceSnapshots, pullNativeChanges } =
        await import('@/server/sync/native-sync')
      const [settings] = await fixture.db
        .select({ budgetCap: fixture.workspacePlanningSettings.budgetCap })
        .from(fixture.workspacePlanningSettings)
        .where(fixture.eq(fixture.workspacePlanningSettings.organizationId, fixture.organizationId))
      expect(settings?.budgetCap).toBe('1100.00')

      const bootstrap = await listNativeWorkspaceSnapshots({
        userId: fixture.managerId,
        supportsBudgetAtomic: true,
      })
      const snapshotArchive = JSON.parse(
        Buffer.from(bootstrap.snapshots[0]!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      const snapshotTimeline = snapshotArchive.timeline as Array<Record<string, unknown>>
      expect(typeof snapshotArchive.workspaceBudgetCap).toBe('number')
      expect(snapshotArchive.workspaceBudgetCap).toBe(1100)
      expect(typeof snapshotArchive.mainEventBudgetCap).toBe('number')
      expect(snapshotArchive.mainEventBudgetCap).toBe(900)
      expect(typeof snapshotTimeline[0]?.budgetCap).toBe('number')
      expect(snapshotTimeline[0]?.budgetCap).toBe(100)

      const [versionedEvent] = await fixture.db
        .select({ payload: fixture.nativeSyncEntity.payload })
        .from(fixture.nativeSyncEntity)
        .where(
          fixture.and(
            fixture.eq(fixture.nativeSyncEntity.entityType, 'event'),
            fixture.eq(fixture.nativeSyncEntity.entityId, fixture.childA)
          )
        )
      const versionedEventArchive = JSON.parse(
        Buffer.from(versionedEvent!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      expect(typeof versionedEventArchive.budgetCap).toBe('number')
      expect(versionedEventArchive.budgetCap).toBe(100)

      const sharedBudgetPull = await pullNativeChanges({
        userId: fixture.managerId,
        scopeId: fixture.rootId,
        after: 0,
        supportsBudgetAtomic: true,
      })
      expect(sharedBudgetPull).not.toBeNull()
      const pulledEvent = sharedBudgetPull!.changes.find(
        (change) => change.entityType === 'event' && change.entityID === fixture.childA
      )
      expect(pulledEvent).toBeDefined()
      const pulledEventArchive = JSON.parse(
        Buffer.from(pulledEvent!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      expect(typeof pulledEventArchive.budgetCap).toBe('number')
      expect(pulledEventArchive.budgetCap).toBe(100)

      const overAllocated = budgetMutation({
        rootId: fixture.rootId,
        expectedBudgetVersion: 1,
        workspaceCapCents: 110_000,
        allocations: [
          { eventID: fixture.rootId, amountCents: 90_000 },
          { eventID: fixture.childA, amountCents: 20_000 },
          { eventID: fixture.childB, amountCents: 10_000 },
        ],
      })
      const rejected = await push(fixture.managerId, overAllocated)
      expect(rejected.disposition).toBe('rejected')
      expect(rejected.failureCode).toBe('BUDGET_ALLOCATION_EXCEEDS_CAP')
      const [unchanged] = await fixture.db
        .select({ budgetCap: fixture.event.budgetCap })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, fixture.childA))
      expect(unchanged?.budgetCap).toBe('100.00')
    })
  }
)

test.skipIf(!enabled)('root managers need authority on each changed child allocation', async () => {
  await withFixture(async (fixture) => {
    const capOnly = budgetMutation({
      rootId: fixture.rootId,
      expectedBudgetVersion: 0,
      workspaceCapCents: 120_000,
      allocations: [
        { eventID: fixture.rootId, amountCents: 80_000 },
        { eventID: fixture.childA, amountCents: null },
        { eventID: fixture.childB, amountCents: null },
      ],
    })
    expect((await push(fixture.rootOnlyManagerId, capOnly)).disposition).toBe('applied')

    const managerAllocation = budgetMutation({
      rootId: fixture.rootId,
      expectedBudgetVersion: 1,
      workspaceCapCents: 120_000,
      allocations: [
        { eventID: fixture.rootId, amountCents: 70_000 },
        { eventID: fixture.childA, amountCents: null },
        { eventID: fixture.childB, amountCents: 10_000 },
      ],
    })
    expect((await push(fixture.managerId, managerAllocation)).disposition).toBe('applied')

    const unauthorizedChildChange = budgetMutation({
      rootId: fixture.rootId,
      expectedBudgetVersion: 2,
      workspaceCapCents: 120_000,
      allocations: [
        { eventID: fixture.rootId, amountCents: 75_000 },
        { eventID: fixture.childA, amountCents: null },
        { eventID: fixture.childB, amountCents: 5_000 },
      ],
    })
    const rejectedChild = await push(fixture.rootOnlyManagerId, unauthorizedChildChange)
    expect(rejectedChild.failureCode).toBe('BUDGET_TARGET_MANAGER_REQUIRED')

    const unauthorizedDisable = budgetMutation({
      rootId: fixture.rootId,
      expectedBudgetVersion: 2,
      workspaceCapCents: null,
      allocations: [
        { eventID: fixture.rootId, amountCents: 70_000 },
        { eventID: fixture.childA, amountCents: null },
        { eventID: fixture.childB, amountCents: 10_000 },
      ],
    })
    const rejectedDisable = await push(fixture.rootOnlyManagerId, unauthorizedDisable)
    expect(rejectedDisable.failureCode).toBe('BUDGET_TARGET_MANAGER_REQUIRED')

    const unclearedDisable = budgetMutation({
      rootId: fixture.rootId,
      expectedBudgetVersion: 2,
      workspaceCapCents: null,
      allocations: [
        { eventID: fixture.rootId, amountCents: 70_000 },
        { eventID: fixture.childA, amountCents: null },
        { eventID: fixture.childB, amountCents: 10_000 },
      ],
    })
    const rejectedUnclearedDisable = await push(fixture.managerId, unclearedDisable)
    expect(rejectedUnclearedDisable.failureCode).toBe('BUDGET_CAP_REQUIRED_FOR_ALLOCATIONS')

    const authorizedDisable = budgetMutation({
      rootId: fixture.rootId,
      expectedBudgetVersion: 2,
      workspaceCapCents: null,
      allocations: [
        { eventID: fixture.rootId, amountCents: null },
        { eventID: fixture.childA, amountCents: null },
        { eventID: fixture.childB, amountCents: null },
      ],
    })
    expect((await push(fixture.managerId, authorizedDisable)).disposition).toBe('applied')

    const [childB] = await fixture.db
      .select({ budgetCap: fixture.event.budgetCap })
      .from(fixture.event)
      .where(fixture.eq(fixture.event.id, fixture.childB))
    const [settings] = await fixture.db
      .select({ budgetCap: fixture.workspacePlanningSettings.budgetCap })
      .from(fixture.workspacePlanningSettings)
      .where(fixture.eq(fixture.workspacePlanningSettings.organizationId, fixture.organizationId))
    expect(childB?.budgetCap).toBeNull()
    expect(settings?.budgetCap).toBeNull()
  })
})

test.skipIf(!enabled)(
  'contributors cannot write budget fields through legacy snapshots or event entities',
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations, listNativeWorkspaceSnapshots } =
        await import('@/server/sync/native-sync')
      const unchangedBudgetMutation = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'workspace' as const,
        entityID: fixture.rootId,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        baseVersion: 1,
        payload: archive({
          rootId: fixture.rootId,
          title: 'Contributor changed ordinary event content',
          workspaceCap: 1000,
          mainAllocation: 800,
          children: [
            { id: fixture.childA, title: 'First child', budgetCap: null },
            { id: fixture.childB, title: 'Second child', budgetCap: null },
          ],
        }),
      }
      const ordinaryArchive = JSON.parse(
        Buffer.from(unchangedBudgetMutation.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      delete ordinaryArchive.workspaceBudgetCap
      delete ordinaryArchive.mainEventBudgetCap
      ordinaryArchive.timeline = (ordinaryArchive.timeline as Record<string, unknown>[]).map(
        (event) => {
          const { budgetCap: _budgetCap, ...withoutBudget } = event
          return withoutBudget
        }
      )
      unchangedBudgetMutation.payload = Buffer.from(JSON.stringify(ordinaryArchive)).toString(
        'base64'
      )
      expect(
        (
          await applyNativeMutations({
            userId: fixture.contributorId,
            mutations: [unchangedBudgetMutation],
          })
        ).results[0]?.disposition
      ).toBe('applied')

      const [preservedSettings] = await fixture.db
        .select({ budgetCap: fixture.workspacePlanningSettings.budgetCap })
        .from(fixture.workspacePlanningSettings)
        .where(fixture.eq(fixture.workspacePlanningSettings.organizationId, fixture.organizationId))
      const [preservedMainEvent] = await fixture.db
        .select({ budgetCap: fixture.event.budgetCap })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, fixture.rootId))
      expect(preservedSettings?.budgetCap).toBe('1000.00')
      expect(preservedMainEvent?.budgetCap).toBe('800.00')

      const snapshotMutation = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'workspace' as const,
        entityID: fixture.rootId,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        baseVersion: 2,
        payload: archive({
          rootId: fixture.rootId,
          title: 'Contributor changed the cap',
          workspaceCap: 1200,
          mainAllocation: 800,
          children: [
            { id: fixture.childA, title: 'First child', budgetCap: null },
            { id: fixture.childB, title: 'Second child', budgetCap: null },
          ],
        }),
      }
      const snapshotResult = await applyNativeMutations({
        userId: fixture.contributorId,
        mutations: [snapshotMutation],
      })
      expect(snapshotResult.results[0]?.failureCode).toBe('BUDGET_MANAGER_REQUIRED')
      const managerDirectBudgetWrite = {
        ...snapshotMutation,
        id: crypto.randomUUID(),
      }
      const managerResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [managerDirectBudgetWrite],
      })
      expect(managerResult.results[0]?.failureCode).toBe('BUDGET_COMMAND_REQUIRED')

      const eventMutation = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'event' as const,
        entityID: fixture.childA,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        payload: Buffer.from(
          JSON.stringify({
            id: fixture.childA,
            title: 'First child',
            category: 'other',
            purpose: 'planning',
            status: 'draft',
            scheduledAt: 820_000_000,
            schedulingState: 'scheduled',
            timeZoneIdentifier: 'America/Detroit',
            budgetCap: 50,
          })
        ).toString('base64'),
      }
      const eventResult = await applyNativeMutations({
        userId: fixture.contributorId,
        mutations: [eventMutation],
      })
      expect(eventResult.results[0]?.failureCode).toBe('BUDGET_MANAGER_REQUIRED')

      const createdChildID = crypto.randomUUID()
      const createWithAllocation = {
        ...eventMutation,
        id: crypto.randomUUID(),
        entityID: createdChildID,
        operation: 'create' as const,
        payload: Buffer.from(
          JSON.stringify({
            id: createdChildID,
            parentEventID: fixture.rootId,
            title: 'Unfunded child draft',
            category: 'other',
            purpose: 'planning',
            status: 'draft',
            scheduledAt: 820_000_000,
            schedulingState: 'scheduled',
            timeZoneIdentifier: 'America/Detroit',
            budgetCap: 50,
          })
        ).toString('base64'),
      }
      const createResult = await applyNativeMutations({
        userId: fixture.contributorId,
        mutations: [createWithAllocation],
      })
      expect(createResult.results[0]?.failureCode).toBe('BUDGET_MANAGER_REQUIRED')
      const [uncreatedChild] = await fixture.db
        .select({ id: fixture.event.id })
        .from(fixture.event)
        .where(fixture.eq(fixture.event.id, createdChildID))
      expect(uncreatedChild).toBeUndefined()

      const scopedEventPayload = JSON.parse(
        Buffer.from(eventMutation.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      const scopedBudgetMutation = {
        ...eventMutation,
        id: crypto.randomUUID(),
        scopeID: fixture.childA,
        entityID: fixture.childA,
        payload: Buffer.from(JSON.stringify(scopedEventPayload)).toString('base64'),
      }
      const scopedManagerResult = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [scopedBudgetMutation],
      })
      expect(scopedManagerResult.results[0]?.failureCode).toBe('BUDGET_COMMAND_REQUIRED')
      const scopedContributorResult = await applyNativeMutations({
        userId: fixture.contributorId,
        mutations: [{ ...scopedBudgetMutation, id: crypto.randomUUID() }],
      })
      expect(scopedContributorResult.results[0]?.failureCode).toBe('EVENT_SCOPE_FORBIDDEN')
      const [snapshot] = await fixture.db
        .select({ payload: fixture.nativeWorkspaceSnapshot.payload })
        .from(fixture.nativeWorkspaceSnapshot)
        .where(fixture.eq(fixture.nativeWorkspaceSnapshot.scopeId, fixture.rootId))
      expect(snapshot?.payload).not.toBe(fixture.initialPayload)
      expect(Buffer.from(snapshot!.payload, 'base64').toString('utf8')).toContain(
        'Contributor changed ordinary event content'
      )

      const samePushWorkspace = {
        id: crypto.randomUUID(),
        scopeID: fixture.rootId,
        entityType: 'workspace' as const,
        entityID: fixture.rootId,
        operation: 'update' as const,
        payloadSchemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        baseVersion: 2,
        payload: archive({
          rootId: fixture.rootId,
          title: 'Manager saved content with budget',
          workspaceCap: 1000,
          mainAllocation: 800,
          children: [
            { id: fixture.childA, title: 'First child', budgetCap: null },
            { id: fixture.childB, title: 'Second child', budgetCap: null },
          ],
        }),
      }
      const samePushPayload = JSON.parse(
        Buffer.from(samePushWorkspace.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      delete samePushPayload.workspaceBudgetCap
      delete samePushPayload.mainEventBudgetCap
      samePushPayload.timeline = (samePushPayload.timeline as Record<string, unknown>[]).map(
        (event) => {
          const { budgetCap: _budgetCap, ...withoutBudget } = event
          return withoutBudget
        }
      )
      samePushWorkspace.payload = Buffer.from(JSON.stringify(samePushPayload)).toString('base64')
      const combinedBudgetMutation = budgetMutation({
        rootId: fixture.rootId,
        expectedBudgetVersion: 0,
        workspaceCapCents: 100_000,
        allocations: [
          { eventID: fixture.rootId, amountCents: 80_000 },
          { eventID: fixture.childA, amountCents: 10_000 },
          { eventID: fixture.childB, amountCents: null },
        ],
      })
      const combined = await applyNativeMutations({
        userId: fixture.managerId,
        mutations: [combinedBudgetMutation, samePushWorkspace],
        supportsBudgetAtomic: true,
        supportsTodos: true,
      })
      expect(combined.results.map((result) => result.disposition)).toEqual(['applied', 'applied'])
      expect(
        combined.results.find((result) => result.mutationID === combinedBudgetMutation.id)
      ).toMatchObject({ serverVersion: 1, workspaceServerVersion: 4 })

      const ordinaryAfterBudget = {
        ...samePushWorkspace,
        id: crypto.randomUUID(),
        baseVersion: 4,
        payload: Buffer.from(
          JSON.stringify({ ...samePushPayload, title: 'Unrelated edit after budget save' })
        ).toString('base64'),
      }
      const ordinaryAfterBudgetResult = await applyNativeMutations({
        userId: fixture.contributorId,
        mutations: [ordinaryAfterBudget],
      })
      expect(ordinaryAfterBudgetResult.results[0]?.disposition).toBe('applied')

      const bootstrap = await listNativeWorkspaceSnapshots({
        userId: fixture.managerId,
        supportsTodos: true,
        supportsBudgetAtomic: true,
      })
      const bootstrapArchive = JSON.parse(
        Buffer.from(bootstrap.snapshots[0]!.payload, 'base64').toString('utf8')
      ) as Record<string, unknown>
      expect(typeof bootstrapArchive.workspaceBudgetCap).toBe('number')
      expect(bootstrapArchive.workspaceBudgetCap).toBe(1000)
      expect(typeof bootstrapArchive.mainEventBudgetCap).toBe('number')
      expect(bootstrapArchive.mainEventBudgetCap).toBe(800)
      expect(typeof (bootstrapArchive.timeline as Record<string, unknown>[])[0]?.budgetCap).toBe(
        'number'
      )
      expect((bootstrapArchive.timeline as Record<string, unknown>[])[0]?.budgetCap).toBe(100)
      expect(
        bootstrap.entities.some(
          (entity) => entity.entityType === 'budget_transfer' && entity.serverVersion === 1
        )
      ).toBe(true)
    })
  }
)
