import type { NotificationServiceShape } from '../services/notification.service'
import type { NotificationDispatchScope } from '../contracts/notification.contracts'

export const registerNotificationInstallation = (
  service: NotificationServiceShape,
  input: Parameters<NotificationServiceShape['register']>[0]
) => service.register(input)

export const detachNotificationInstallation = (
  service: NotificationServiceShape,
  input: Parameters<NotificationServiceShape['detach']>[0]
) => service.detach(input)

export const dispatchPendingNotifications = (service: NotificationServiceShape, limit?: number) =>
  service.dispatchPending(limit)

export const dispatchNotificationsOnce = (
  service: NotificationServiceShape,
  scope: NotificationDispatchScope
) => service.dispatchOnce(scope)
