import { Effect, Layer } from 'effect'
import { InvalidInputError } from '@/lib/domain-errors'
import type {
  ClaimedNotification,
  NativeNotificationPayload,
  NotificationDispatchScope,
} from '../contracts/notification.contracts'
import {
  NotificationConnector,
  NotificationConnectorFailure,
  type NotificationConnectorShape,
} from '../connectors/notification.con'
import {
  NotificationRepository,
  type NotificationRepositoryShape,
} from '../repos/notification.repo.contract'
import { NotificationService, type NotificationServiceShape } from './notification.service'

export const NOTIFICATION_DISPATCH_BUDGET_MS = 25_000

export function createNotificationService(
  repo: NotificationRepositoryShape,
  connector: NotificationConnectorShape,
  now: () => number = Date.now
): NotificationServiceShape {
  const dispatch = (limit = 20, scope?: NotificationDispatchScope) =>
    Effect.suspend(() => {
      let current: ClaimedNotification | undefined
      const result = { claimed: 0, delivered: 0, pending: 0, discarded: 0 }
      return Effect.gen(function* () {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
          return yield* Effect.fail(
            new InvalidInputError({
              category: 'validation',
              code: 'INVALID_NOTIFICATION_DISPATCH_LIMIT',
              debugMessage: 'Notification dispatch limit must be an integer between 1 and 100.',
            })
          )
        }
        // The one-shot finalizer retires disabled work; ordinary pending dispatch leaves it alone.
        if (!connector.isConfigured) return result
        const deadline = now() + NOTIFICATION_DISPATCH_BUDGET_MS
        while (result.claimed < limit && now() < deadline) {
          // Claim only work that this invocation is about to attempt.
          const [item] = yield* repo.claimPending(1, scope ? { scope, freshOnly: true } : undefined)
          if (!item) break
          result.claimed += 1
          current = item
          let accepted = item.acceptedInstallationIds.length > 0
          let retry = false
          let invalidPayload = false
          let budgetExhausted = false
          let stopDispatch = false
          let retryAfterMs: number | undefined
          for (const installation of item.installations) {
            if (item.acceptedInstallationIds.includes(installation.id)) continue
            if (now() >= deadline) {
              budgetExhausted = true
              break
            }
            const stillBound = yield* repo.isStillBound(item, installation)
            if (!stillBound) {
              // This can mean lock contention or lease expiry as well as revocation.
              retry = true
              continue
            }
            const remaining = deadline - now()
            if (remaining <= 0) {
              budgetExhausted = true
              break
            }
            const payload: NativeNotificationPayload = {
              type: item.type,
              eventId: item.eventId,
              entityId: item.entityId,
              recipientKind: item.recipient.kind,
              recipientId: item.recipient.id,
              title: 'Gatherory',
              body:
                item.type === 'assignment_changed'
                  ? installation.locale === 'es'
                    ? 'Se te asignó una tarea.'
                    : 'A task was assigned to you.'
                  : item.type === 'event_announcement'
                    ? installation.locale === 'es'
                      ? 'Hay una nueva actualización del evento.'
                      : 'There’s a new event update.'
                    : installation.locale === 'es'
                      ? 'Se actualizaron los detalles del evento.'
                      : 'Event details changed.',
            }
            const sent = yield* Effect.uninterruptibleMask((restore) =>
              restore(
                connector.send({ token: installation.token, payload, deliveryId: item.id }).pipe(
                  Effect.timeoutOrElse({
                    duration: remaining,
                    orElse: () =>
                      Effect.fail(
                        new NotificationConnectorFailure(
                          'transient',
                          'Notification dispatch timed out.'
                        )
                      ),
                  })
                )
              ).pipe(
                Effect.matchEffect({
                  // Once acceptance is known, finish its receipt even if cancellation arrives.
                  // A failed receipt propagates before any other network send.
                  onSuccess: () =>
                    repo
                      .markInstallationAccepted(item, installation.id)
                      .pipe(Effect.as({ accepted: true as const })),
                  onFailure: (failure) => Effect.succeed({ accepted: false as const, failure }),
                })
              )
            )
            if (sent.accepted) {
              accepted = true
            } else if (sent.failure.kind === 'invalid_registration') {
              yield* repo.disableInstallation(installation)
            } else if (sent.failure.kind === 'invalid_payload') {
              invalidPayload = true
              break
            } else {
              retry = true
              if (sent.failure.retryAfterMs !== undefined) {
                retryAfterMs = Math.max(retryAfterMs ?? 0, sent.failure.retryAfterMs)
              }
              if (sent.failure.kind === 'credentials' || sent.failure.kind === 'disabled') {
                stopDispatch = true
                break
              }
            }
          }
          if (invalidPayload) {
            yield* repo.retry(item, 'invalid_payload', true)
            result.discarded += 1
          } else if (budgetExhausted || retry) {
            yield* repo.retry(
              item,
              budgetExhausted ? 'dispatch_budget' : 'provider_failure',
              Boolean(scope),
              scope ? undefined : retryAfterMs
            )
            if (scope) result.discarded += 1
            else result.pending += 1
          } else if (accepted) {
            yield* repo.delivered(item)
            result.delivered += 1
          } else if (item.installations.length === 0) {
            yield* repo.retry(item, 'no_installation', Boolean(scope))
            if (scope) result.discarded += 1
            else result.pending += 1
          } else {
            // A false check can also mean a temporarily locked or expired lease.
            // Claim-time authorization and retry bounds decide terminal outcomes.
            yield* repo.retry(item, 'no_active_binding', Boolean(scope))
            if (scope) result.discarded += 1
            else result.pending += 1
          }
          current = undefined
          if (budgetExhausted || stopDispatch) break
        }
        return result
      }).pipe(
        Effect.onExit(() =>
          scope
            ? Effect.suspend(() => {
                const discardFresh = repo.discardFresh(scope).pipe(
                  Effect.tap((count) =>
                    Effect.sync(() => {
                      result.discarded += count
                    })
                  ),
                  Effect.asVoid
                )
                // Attempt fresh cleanup even when settling an interrupted item also fails.
                return current
                  ? repo
                      .retry(current, 'best_effort_finished', true)
                      .pipe(Effect.onExit(() => discardFresh))
                  : discardFresh
              })
            : Effect.void
        )
      )
    })
  return {
    register: (input) => repo.register(input),
    detach: (input) => repo.detach(input),
    dispatchPending: (limit) => dispatch(limit),
    dispatchOnce: (scope) => dispatch(20, scope),
  }
}

export const NotificationServiceLive = Layer.effect(
  NotificationService,
  Effect.gen(function* () {
    return createNotificationService(yield* NotificationRepository, yield* NotificationConnector)
  })
)
