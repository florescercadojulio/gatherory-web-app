import { Effect } from 'effect'
import { createNotificationDispatchHandler } from './notification-dispatch.handler'
import {
  readNotificationDispatchConfiguration,
  type NotificationDispatchSummary,
} from './notification-dispatch.configuration'

/** Called only after the scheduler/worker passes its configuration gates. */
export async function dispatchNotificationsLive(
  signal: AbortSignal
): Promise<NotificationDispatchSummary> {
  const [{ PgClientLive }, { dispatchPendingNotifications }] = await Promise.all([
    import('@/db'),
    import('../workflows/notification.workflows.live'),
  ])
  return Effect.runPromise(dispatchPendingNotifications(20).pipe(Effect.provide(PgClientLive)), {
    signal,
  })
}

/** Read dedicated scheduler configuration per request; unauthorized calls never load production. */
export function scheduledNotificationDispatchResponse(request: Request) {
  return createNotificationDispatchHandler({
    configuration: readNotificationDispatchConfiguration(process.env),
    dispatch: dispatchNotificationsLive,
  })(request)
}
