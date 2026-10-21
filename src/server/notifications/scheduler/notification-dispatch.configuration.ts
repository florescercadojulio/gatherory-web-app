import { z } from 'zod'

/** Explicit values prevent the string "false" from becoming truthy. */
export const NotificationDispatchEnabledSchema = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true')
export const NotificationCronSecretSchema = z.string().min(32).optional()

export type NotificationDispatchConfiguration = {
  enabled: boolean
  cronSecret?: string
  fcmConfigured: boolean
}

/** Safe before application configuration, auth, providers, or database imports. */
export function readNotificationDispatchConfiguration(
  values: Record<string, string | undefined>
): NotificationDispatchConfiguration {
  return {
    enabled:
      NotificationDispatchEnabledSchema.safeParse(values.NOTIFICATION_DISPATCH_ENABLED).data ===
      true,
    cronSecret: values.CRON_SECRET,
    fcmConfigured: [values.FCM_PROJECT_ID, values.FCM_CLIENT_EMAIL, values.FCM_PRIVATE_KEY].every(
      (value) => Boolean(value?.trim())
    ),
  }
}

export type NotificationDispatchSummary = {
  claimed: number
  delivered: number
  pending: number
  discarded: number
}

export function notificationDispatchSummary(
  summary: NotificationDispatchSummary
): NotificationDispatchSummary {
  return {
    claimed: summary.claimed,
    delivered: summary.delivered,
    pending: summary.pending,
    discarded: summary.discarded,
  }
}
