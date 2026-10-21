import { Effect, Layer } from 'effect'
import { PgClient } from '@effect/sql-pg/PgClient'
import { FcmNotificationConnectorLive } from './connectors/fcm-notification.layer.live'
import { NotificationRepository } from './repos/notification.repo.contract'
import { notificationRepo } from './repos/notification.repo.live'
import { NotificationServiceLive } from './services/notification.service.live'

const NotificationRepositoryLive = Layer.effect(
  NotificationRepository,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      register: (input: Parameters<typeof notificationRepo.register>[0]) =>
        notificationRepo.register(input).pipe(Effect.provideService(PgClient, pg)),
      detach: (input: Parameters<typeof notificationRepo.detach>[0]) =>
        notificationRepo.detach(input).pipe(Effect.provideService(PgClient, pg)),
      claimPending: (...args: Parameters<typeof notificationRepo.claimPending>) =>
        notificationRepo.claimPending(...args).pipe(Effect.provideService(PgClient, pg)),
      discardFresh: (scope: Parameters<typeof notificationRepo.discardFresh>[0]) =>
        notificationRepo.discardFresh(scope).pipe(Effect.provideService(PgClient, pg)),
      isStillBound: (...args: Parameters<typeof notificationRepo.isStillBound>) =>
        notificationRepo.isStillBound(...args).pipe(Effect.provideService(PgClient, pg)),
      delivered: (...args: Parameters<typeof notificationRepo.delivered>) =>
        notificationRepo.delivered(...args).pipe(Effect.provideService(PgClient, pg)),
      retry: (...args: Parameters<typeof notificationRepo.retry>) =>
        notificationRepo.retry(...args).pipe(Effect.provideService(PgClient, pg)),
      markInstallationAccepted: (
        ...args: Parameters<typeof notificationRepo.markInstallationAccepted>
      ) =>
        notificationRepo
          .markInstallationAccepted(...args)
          .pipe(Effect.provideService(PgClient, pg)),
      disableInstallation: (...args: Parameters<typeof notificationRepo.disableInstallation>) =>
        notificationRepo.disableInstallation(...args).pipe(Effect.provideService(PgClient, pg)),
    }
  })
)
export const NotificationDomainLive = NotificationServiceLive.pipe(
  Layer.provide(Layer.mergeAll(NotificationRepositoryLive, FcmNotificationConnectorLive))
)
