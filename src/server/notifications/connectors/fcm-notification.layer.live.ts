import { Layer } from 'effect'
import { env } from '@/env'
import { NotificationConnector } from './notification.con'
import { createFcmNotificationConnector } from './fcm-notification.con.live'

const configuration =
  env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY
    ? {
        projectId: env.FCM_PROJECT_ID,
        clientEmail: env.FCM_CLIENT_EMAIL,
        privateKey: env.FCM_PRIVATE_KEY,
      }
    : undefined

export const FcmNotificationConnectorLive = Layer.succeed(
  NotificationConnector,
  createFcmNotificationConnector(configuration)
)
