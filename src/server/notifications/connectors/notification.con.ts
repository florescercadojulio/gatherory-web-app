import { Context, type Effect } from 'effect'
import type { NativeNotificationPayload } from '../contracts/notification.contracts'

export class NotificationConnectorFailure extends Error {
  readonly _tag = 'NotificationConnectorFailure'
  constructor(
    readonly kind:
      'disabled' | 'transient' | 'invalid_registration' | 'invalid_payload' | 'credentials',
    message: string,
    readonly retryAfterMs?: number
  ) {
    super(message)
    this.name = 'NotificationConnectorFailure'
  }
}

export type NotificationConnectorShape = {
  readonly isConfigured: boolean
  readonly send: (input: {
    token: string
    payload: NativeNotificationPayload
    /** Stable opaque outbox ID, reused across ambiguous delivery retries. */
    deliveryId?: string
  }) => Effect.Effect<void, NotificationConnectorFailure>
}

export class NotificationConnector extends Context.Service<
  NotificationConnector,
  NotificationConnectorShape
>()('NotificationConnector') {}
