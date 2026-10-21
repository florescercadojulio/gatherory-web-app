import { expect, it } from '@effect/vitest'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect } from 'effect'
import { beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sync: vi.fn(),
  announcement: vi.fn(),
  dispatch: vi.fn(),
  construct: vi.fn(),
}))
vi.mock('@/db', () => {
  throw new Error('Production workflow bindings must not create a database runtime')
})
vi.mock('@/server/sync/repos/native-sync.repo.live', async () => {
  const { Layer } = await import('effect')
  const { NativeSyncRepo } = await import('@/server/sync/repos/native-sync.repo')
  return { NativeSyncRepoLive: Layer.mock(NativeSyncRepo, { applyMutations: mocks.sync }) }
})
vi.mock('@/server/announcements/repos/announcement.repo.live', async () => {
  const { Layer } = await import('effect')
  const { AnnouncementRepository } =
    await import('@/server/announcements/repos/announcement.repo.contract')
  return {
    AnnouncementRepositoryLive: Layer.mock(AnnouncementRepository, { send: mocks.announcement }),
  }
})
vi.mock('@/server/notifications/notification.layers.live', async () => {
  const { Effect, Layer } = await import('effect')
  const { PgClient } = await import('@effect/sql-pg/PgClient')
  const { NotificationService } =
    await import('@/server/notifications/services/notification.service')
  return {
    NotificationDomainLive: Layer.effect(
      NotificationService,
      Effect.gen(function* () {
        const pg = yield* PgClient
        yield* mocks.construct()
        return {
          register: () => Effect.die('unused'),
          detach: () => Effect.die('unused'),
          dispatchPending: () => Effect.die('unused'),
          dispatchOnce: (scope) => mocks.dispatch(scope, pg),
        }
      })
    ),
  }
})

const testPg = new Proxy({} as PgClient, {
  get() {
    throw new Error('Tests must not access a SQL driver')
  },
})
beforeEach(() => {
  vi.resetAllMocks()
  mocks.construct.mockReturnValue(Effect.void)
  mocks.dispatch.mockReturnValue(
    Effect.succeed({ claimed: 0, delivered: 0, pending: 0, discarded: 0 })
  )
})

it.effect(
  'sync binding commits first, uses the caller PgClient only for accepted receipts, and preserves response',
  () =>
    Effect.gen(function* () {
      const { pushNativeSync } = yield* Effect.promise(
        () => import('@/server/sync/workflows/native-sync.workflows.live')
      )
      let committed = false
      const canonical = {
        results: [
          {
            mutationID: 'accepted-mutation',
            disposition: 'applied' as const,
            serverVersion: 2,
            failureCode: null,
          },
          {
            mutationID: 'duplicate-mutation',
            disposition: 'duplicate' as const,
            serverVersion: 2,
            failureCode: null,
          },
        ],
      }
      mocks.sync.mockImplementation(() =>
        Effect.sync(() => {
          committed = true
          return canonical
        })
      )
      mocks.construct.mockImplementation(() =>
        Effect.sync(() => {
          expect(committed).toBe(true)
        })
      )
      expect(
        yield* pushNativeSync({
          userId: 'actor',
          mutations: [],
          supportsBlueprintGuides: true,
        }).pipe(Effect.provideService(PgClient, testPg))
      ).toBe(canonical)
      expect(mocks.dispatch).toHaveBeenCalledTimes(1)
      expect(mocks.dispatch.mock.calls[0]![0]).toEqual({
        kind: 'mutations',
        mutationIds: ['accepted-mutation'],
      })
      expect(mocks.dispatch.mock.calls[0]![1]).toBe(testPg)
    })
)

it.effect('duplicate-only sync never initializes notifications', () =>
  Effect.gen(function* () {
    const { pushNativeSync } = yield* Effect.promise(
      () => import('@/server/sync/workflows/native-sync.workflows.live')
    )
    const canonical = {
      results: [
        {
          mutationID: 'duplicate-mutation',
          disposition: 'duplicate' as const,
          serverVersion: 2,
          failureCode: null,
        },
      ],
    }
    mocks.sync.mockReturnValue(Effect.succeed(canonical))
    expect(
      yield* pushNativeSync({ userId: 'actor', mutations: [], supportsBlueprintGuides: true }).pipe(
        Effect.provideService(PgClient, testPg)
      )
    ).toBe(canonical)
    expect(mocks.construct).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalled()
  })
)

it.effect(
  'announcement binding tolerates postcommit graph failure and retains its canonical row',
  () =>
    Effect.gen(function* () {
      const { sendAnnouncementWorkflow } = yield* Effect.promise(
        () => import('@/server/announcements/workflows/announcement.workflows.live')
      )
      const canonical = {
        id: 'canonical-id',
        eventId: '7bcc6c2a-cc96-42cc-aab2-305771a2ce37',
        message: 'Saved',
        audience: 'planning' as const,
        authorName: 'Planning Team' as const,
        createdAt: '2026-10-21T12:00:00Z',
      }
      let committed = false
      mocks.announcement.mockImplementation(() =>
        Effect.sync(() => {
          committed = true
          return canonical
        })
      )
      mocks.construct.mockImplementation(() =>
        Effect.sync(() => {
          expect(committed).toBe(true)
        }).pipe(Effect.andThen(Effect.fail(new Error('notification graph unavailable'))))
      )
      const result = yield* sendAnnouncementWorkflow({
        eventId: canonical.eventId,
        userId: 'actor',
        requestId: 'b2027174-07b7-49ae-b55a-f89993decb16',
        message: canonical.message,
        audience: canonical.audience,
      }).pipe(Effect.provideService(PgClient, testPg))
      expect(result).toBe(canonical)
      expect(mocks.dispatch).not.toHaveBeenCalled()
    })
)

it.effect('announcement retries target the same canonical notification entity', () =>
  Effect.gen(function* () {
    const { sendAnnouncementWorkflow } = yield* Effect.promise(
      () => import('@/server/announcements/workflows/announcement.workflows.live')
    )
    const canonical = {
      id: 'canonical-id',
      eventId: '7bcc6c2a-cc96-42cc-aab2-305771a2ce37',
      message: 'Saved',
      audience: 'all' as const,
      authorName: 'Host' as const,
      createdAt: '2026-10-21T12:00:00Z',
    }
    mocks.announcement.mockReturnValue(Effect.succeed(canonical))
    const input = {
      eventId: canonical.eventId,
      userId: 'actor',
      requestId: 'b2027174-07b7-49ae-b55a-f89993decb16',
      message: canonical.message,
    }
    for (let attempt = 0; attempt < 2; attempt += 1)
      expect(
        yield* sendAnnouncementWorkflow(input).pipe(Effect.provideService(PgClient, testPg))
      ).toBe(canonical)
    expect(mocks.dispatch).toHaveBeenCalledTimes(2)
    for (const [scope, pg] of mocks.dispatch.mock.calls) {
      expect(scope).toEqual({ kind: 'announcement', announcementId: canonical.id })
      expect(pg).toBe(testPg)
    }
  })
)
