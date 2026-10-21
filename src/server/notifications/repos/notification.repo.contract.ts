import { Context, type Effect } from 'effect'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import type { DomainError } from '@/lib/domain-errors'
import type { ClaimedNotification, NotificationIdentity } from '../contracts/notification.contracts'

export type NotificationRepositoryShape = {
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
  readonly claimPending: (
    limit?: number
  ) => Effect.Effect<ClaimedNotification[], NotificationRepositoryFailure>
  readonly isStillBound: (
    item: ClaimedNotification,
    installation: ClaimedNotification['installations'][number]
  ) => Effect.Effect<boolean, NotificationRepositoryFailure>
  readonly delivered: (
    item: ClaimedNotification
  ) => Effect.Effect<void, NotificationRepositoryFailure>
  readonly retry: (
    item: ClaimedNotification,
    reason: string,
    discard?: boolean
  ) => Effect.Effect<void, NotificationRepositoryFailure>
  readonly markInstallationAccepted: (
    item: ClaimedNotification,
    installationId: string
  ) => Effect.Effect<void, NotificationRepositoryFailure>
  readonly disableInstallation: (
    installation: ClaimedNotification['installations'][number]
  ) => Effect.Effect<void, NotificationRepositoryFailure>
}

export type NotificationRepositoryFailure = DomainError | EffectDrizzleQueryError | SqlError

export class NotificationRepository extends Context.Service<
  NotificationRepository,
  NotificationRepositoryShape
>()('NotificationRepository') {}
