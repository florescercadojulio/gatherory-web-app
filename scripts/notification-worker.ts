import { config } from 'dotenv'
import { pathToFileURL } from 'node:url'
import { readNotificationDispatchConfiguration } from '@/server/notifications/scheduler/notification-dispatch.configuration'
import { dispatchNotificationsLive } from '@/server/notifications/scheduler/notification-dispatch.adapter.live'
import { notificationWorkerMain } from '@/server/notifications/scheduler/notification-worker'

export async function main() {
  config({ path: ['.env.local', '.env'], quiet: true })
  return notificationWorkerMain({
    configuration: readNotificationDispatchConfiguration(process.env),
    dispatch: dispatchNotificationsLive,
    signals: process,
    report: (event) => console.info(JSON.stringify(event)),
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exitCode = await main()
