import { Effect } from 'effect'
import type { NativePushResult } from '@/server/sync/contracts/native-sync.contracts'
import type { NotificationDispatchScope } from '../contracts/notification.contracts'

/** Receipt dispositions, never request payloads, select the committed sync work. */
export function nativePushNotificationScope(result: {
  results: NativePushResult[]
}): NotificationDispatchScope | undefined {
  const mutationIds = [
    ...new Set(
      result.results.filter((item) => item.disposition === 'applied').map((item) => item.mutationID)
    ),
  ]
  return mutationIds.length > 0 ? { kind: 'mutations', mutationIds } : undefined
}

export function announcementNotificationScope(result: { id: string }): NotificationDispatchScope {
  return { kind: 'announcement', announcementId: result.id }
}

/** Await a best-effort attempt only after the canonical operation has committed. */
export function notifyAfterCommit<A, E, R, NotificationError, NotificationServices>(
  commit: Effect.Effect<A, E, R>,
  scopeForResult: (result: A) => NotificationDispatchScope | undefined,
  dispatch: (
    scope: NotificationDispatchScope
  ) => Effect.Effect<unknown, NotificationError, NotificationServices>
) {
  return Effect.gen(function* () {
    const result = yield* commit
    // Include scope derivation and layer acquisition in the best-effort boundary.
    yield* Effect.gen(function* () {
      const scope = scopeForResult(result)
      if (scope) yield* dispatch(scope)
    }).pipe(Effect.catchCause(() => Effect.void))
    return result
  })
}
