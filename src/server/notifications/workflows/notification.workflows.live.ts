import { Effect } from 'effect'
import { NotificationDomainLive } from '../notification.layers.live'
import { NotificationService } from '../services/notification.service'
import type { NotificationDispatchScope } from '../contracts/notification.contracts'
import {
  detachNotificationInstallation as detach,
  dispatchPendingNotifications as dispatch,
  dispatchNotificationsOnce as dispatchOnce,
  registerNotificationInstallation as register,
} from './notification.workflows'

export const registerNotificationInstallation = (
  input: Parameters<NotificationService['Service']['register']>[0]
) =>
  Effect.flatMap(NotificationService, (service) => register(service, input)).pipe(
    Effect.provide(NotificationDomainLive)
  )

export const detachNotificationInstallation = (
  input: Parameters<NotificationService['Service']['detach']>[0]
) =>
  Effect.flatMap(NotificationService, (service) => detach(service, input)).pipe(
    Effect.provide(NotificationDomainLive)
  )

export const dispatchPendingNotifications = (limit?: number) =>
  Effect.flatMap(NotificationService, (service) => dispatch(service, limit)).pipe(
    Effect.provide(NotificationDomainLive)
  )

export const dispatchNotificationsOnce = (scope: NotificationDispatchScope) =>
  Effect.flatMap(NotificationService, (service) => dispatchOnce(service, scope)).pipe(
    Effect.provide(NotificationDomainLive)
  )
