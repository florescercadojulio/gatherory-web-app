import { expect, it } from '@effect/vitest'
import { Deferred, Effect, Fiber, Result } from 'effect'
import { vi } from 'vitest'
import type { NativePushResult } from '@/server/sync/contracts/native-sync.contracts'
import {
  announcementNotificationScope,
  nativePushNotificationScope,
  notifyAfterCommit,
} from '@/server/notifications/workflows/postcommit-notifications.workflow'

vi.mock('@/db', () => {
  throw new Error('Postcommit coordination must not import a production database')
})
vi.mock('@/env', () => {
  throw new Error('Postcommit coordination must not import production configuration')
})

const receipt = (
  mutationID: string,
  disposition: NativePushResult['disposition']
): NativePushResult => ({ mutationID, disposition, serverVersion: 1, failureCode: null })

it.effect('awaits the committed save before dispatch and returns the exact canonical result', () =>
  Effect.gen(function* () {
    const order: string[] = []
    const canonical = { results: [receipt('accepted', 'applied')] }
    const returned = yield* notifyAfterCommit(
      Effect.sync(() => {
        order.push('committed')
        return canonical
      }),
      nativePushNotificationScope,
      (scope) =>
        Effect.sync(() => {
          expect(order).toEqual(['committed'])
          order.push('dispatched')
          expect(scope).toEqual({ kind: 'mutations', mutationIds: ['accepted'] })
        })
    )
    expect(returned).toBe(canonical)
    expect(order).toEqual(['committed', 'dispatched'])
  })
)

it.effect('awaits delivery completion without starting detached work', () =>
  Effect.gen(function* () {
    const canonical = { id: 'saved-announcement' }
    const entered = yield* Deferred.make<void>()
    const released = yield* Deferred.make<void>()
    let returned = false
    const pending = yield* notifyAfterCommit(
      Effect.succeed(canonical),
      announcementNotificationScope,
      () =>
        Effect.gen(function* () {
          yield* Deferred.succeed(entered, undefined)
          yield* Deferred.await(released)
        })
    ).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          returned = true
        })
      ),
      Effect.forkChild
    )
    yield* Deferred.await(entered)
    expect(returned).toBe(false)
    yield* Deferred.succeed(released, undefined)
    expect(yield* Fiber.join(pending)).toBe(canonical)
    expect(returned).toBe(true)
  })
)

it.effect(
  'selects applied receipts only and deduplicates IDs without consulting mutation payloads',
  () =>
    Effect.gen(function* () {
      const canonical = {
        results: [
          receipt('applied-1', 'applied'),
          receipt('duplicate', 'duplicate'),
          receipt('conflict', 'conflict'),
          receipt('rejected', 'rejected'),
          receipt('applied-2', 'applied'),
          receipt('applied-1', 'applied'),
        ],
      }
      const scopes: unknown[] = []
      yield* notifyAfterCommit(Effect.succeed(canonical), nativePushNotificationScope, (scope) =>
        Effect.sync(() => {
          scopes.push(scope)
        })
      )
      expect(scopes).toEqual([{ kind: 'mutations', mutationIds: ['applied-1', 'applied-2'] }])
    })
)

it.effect('duplicate/rejected/conflicted or empty pushes do not construct a delivery graph', () =>
  Effect.gen(function* () {
    let constructed = false
    for (const results of [
      [],
      [
        receipt('duplicate', 'duplicate'),
        receipt('conflict', 'conflict'),
        receipt('rejected', 'rejected'),
      ],
    ]) {
      const canonical = { results }
      expect(
        yield* notifyAfterCommit(Effect.succeed(canonical), nativePushNotificationScope, () => {
          constructed = true
          return Effect.void
        })
      ).toBe(canonical)
    }
    expect(constructed).toBe(false)
  })
)

it.effect('failed canonical writes never attempt delivery and retain the original failure', () =>
  Effect.gen(function* () {
    const failure = new Error('canonical write failed')
    let dispatched = false
    const result = yield* Effect.result(
      notifyAfterCommit(
        Effect.fail(failure),
        () => ({ kind: 'announcement', announcementId: 'never-committed' }),
        () => {
          dispatched = true
          return Effect.void
        }
      )
    )
    expect(Result.isFailure(result)).toBe(true)
    if (Result.isFailure(result)) expect(result.failure).toBe(failure)
    expect(dispatched).toBe(false)
  })
)

for (const failure of ['typed', 'defect', 'construction'] as const) {
  it.effect(`postcommit ${failure} notification failure cannot change a saved announcement`, () =>
    Effect.gen(function* () {
      const canonical = {
        id: 'canonical-announcement-id',
        requestId: 'request-receipt',
        message: 'Saved announcement',
      }
      let committed = false
      const returned = yield* notifyAfterCommit(
        Effect.sync(() => {
          committed = true
          return canonical
        }),
        announcementNotificationScope,
        (scope) => {
          expect(committed).toBe(true)
          expect(scope).toEqual({ kind: 'announcement', announcementId: canonical.id })
          if (failure === 'construction') throw new Error('notification layer construction failed')
          return failure === 'typed'
            ? Effect.fail(new Error('provider failed'))
            : Effect.die(new Error('provider defect'))
        }
      )
      expect(returned).toBe(canonical)
    })
  )
}

it.effect(
  'announcement replay stays scoped to the canonical ID for repository attempt deduplication',
  () =>
    Effect.gen(function* () {
      const canonical = { id: 'same-announcement-id' }
      const scopes: unknown[] = []
      for (let attempt = 0; attempt < 2; attempt += 1)
        yield* notifyAfterCommit(
          Effect.succeed(canonical),
          announcementNotificationScope,
          (scope) =>
            Effect.sync(() => {
              scopes.push(scope)
            })
        )
      expect(scopes).toEqual([
        { kind: 'announcement', announcementId: canonical.id },
        { kind: 'announcement', announcementId: canonical.id },
      ])
    })
)
