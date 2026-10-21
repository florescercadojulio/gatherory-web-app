import { Effect } from 'effect'
import {
  notificationDispatchSummary,
  type NotificationDispatchConfiguration,
  type NotificationDispatchSummary,
} from './notification-dispatch.configuration'

export const NOTIFICATION_WORKER_INTERVAL_MS = 60_000

/** One awaited dispatch followed by one interruptible delay; runs never overlap. */
export function notificationWorkerLoop<E, R>(options: {
  dispatch: Effect.Effect<NotificationDispatchSummary, E, R>
  intervalMs?: number
  sleep?: (milliseconds: number) => Effect.Effect<void>
  onResult?: (summary: NotificationDispatchSummary) => Effect.Effect<void>
  onFailure?: () => Effect.Effect<void>
}) {
  const interval = options.intervalMs ?? NOTIFICATION_WORKER_INTERVAL_MS
  if (!Number.isFinite(interval) || interval <= 0)
    return Effect.die(new Error('Invalid notification worker interval.'))
  return Effect.forever(
    Effect.gen(function* () {
      yield* options.dispatch.pipe(
        Effect.matchEffect({
          onSuccess: (summary) =>
            options.onResult?.(notificationDispatchSummary(summary)) ?? Effect.void,
          onFailure: () => options.onFailure?.() ?? Effect.void,
        })
      )
      yield* (options.sleep ?? Effect.sleep)(interval)
    })
  )
}

type WorkerSignal = 'SIGINT' | 'SIGTERM'
export type NotificationWorkerEvent =
  | { type: 'started' | 'stopped' | 'dispatch_failed' | 'configuration_invalid' | 'worker_failed' }
  | { type: 'dispatched'; summary: NotificationDispatchSummary }

/** Import-safe CLI main with injectable signals, delivery and reporting. */
export async function notificationWorkerMain(dependencies: {
  configuration: NotificationDispatchConfiguration
  dispatch: (signal: AbortSignal) => Promise<NotificationDispatchSummary>
  signals: {
    on: (event: WorkerSignal, listener: () => void) => unknown
    off: (event: WorkerSignal, listener: () => void) => unknown
  }
  report: (event: NotificationWorkerEvent) => void
  intervalMs?: number
}) {
  if (!dependencies.configuration.enabled || !dependencies.configuration.fcmConfigured) {
    dependencies.report({ type: 'configuration_invalid' })
    return 1
  }
  const controller = new AbortController()
  const stop = () => controller.abort()
  dependencies.signals.on('SIGINT', stop)
  dependencies.signals.on('SIGTERM', stop)
  try {
    dependencies.report({ type: 'started' })
    await Effect.runPromise(
      notificationWorkerLoop({
        dispatch: Effect.tryPromise({
          try: (signal) => dependencies.dispatch(signal),
          catch: () => undefined,
        }),
        intervalMs: dependencies.intervalMs,
        onResult: (summary) =>
          Effect.sync(() => dependencies.report({ type: 'dispatched', summary })),
        onFailure: () => Effect.sync(() => dependencies.report({ type: 'dispatch_failed' })),
      }),
      { signal: controller.signal }
    )
    return 0
  } catch {
    if (!controller.signal.aborted) {
      dependencies.report({ type: 'worker_failed' })
      return 1
    }
    return 0
  } finally {
    dependencies.signals.off('SIGINT', stop)
    dependencies.signals.off('SIGTERM', stop)
    dependencies.report({ type: 'stopped' })
  }
}
