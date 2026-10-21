import { Context, type Effect } from 'effect'
import type { NotificationRepositoryFailure } from '../repos/notification.repo.contract'
import type { NotificationIdentity } from '../contracts/notification.contracts'
import { NotificationConnectorFailure } from '../connectors/notification.con'

export type NotificationServiceShape = {
  readonly register: (input: {
    id: string
    secret: string
    revision: number
    recipient: NotificationIdentity
    platform: 'ios' | 'android'
    locale: 'en' | 'es'
    token: string
    enabled: boolean
  }) => Effect.Effect<
    { installationId: string; bindingGeneration: number; revision: number; accepted: boolean },
    NotificationRepositoryFailure
  >
  readonly detach: (input: {
    id: string
    secret: string
    revision: number
  }) => Effect.Effect<
    { detached: boolean; revision: number; accepted: boolean },
    NotificationRepositoryFailure
  >
  readonly dispatchPending: (
    limit?: number
  ) => Effect.Effect<
    { claimed: number; delivered: number; pending: number; discarded: number },
    NotificationRepositoryFailure | NotificationConnectorFailure
  >
}

export class NotificationService extends Context.Service<
  NotificationService,
  NotificationServiceShape
>()('NotificationService') {}

export function isNotificationConnectorFailure(
  cause: unknown
): cause is NotificationConnectorFailure {
  return cause instanceof NotificationConnectorFailure
}
