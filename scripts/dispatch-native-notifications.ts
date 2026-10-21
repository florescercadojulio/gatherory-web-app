import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { dispatchPendingNotifications } from '@/server/notifications/workflows/notification.workflows.live'

const result = await Effect.runPromise(
  dispatchPendingNotifications().pipe(Effect.provide(PgClientLive))
)
console.info(JSON.stringify(result))
