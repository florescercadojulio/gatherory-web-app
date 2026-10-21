import { Effect, Layer } from 'effect'
import type { NativeNotificationPayload } from '../contracts/notification.contracts'
import { NotificationConnector } from '../connectors/notification.con'
import { NotificationRepository } from '../repos/notification.repo.contract'
import { NotificationService, isNotificationConnectorFailure } from './notification.service'

export const NotificationServiceLive = Layer.effect(
  NotificationService,
  Effect.gen(function* () {
    const repo = yield* NotificationRepository
    const connector = yield* NotificationConnector
    return {
      register: (input) => repo.register(input),
      detach: (input) => repo.detach(input),
      dispatchPending: (limit = 20) =>
        Effect.gen(function* () {
          const items = yield* repo.claimPending(limit)
          let delivered = 0
          let pending = 0
          let discarded = 0
          for (const item of items) {
            if (!connector.isConfigured) {
              yield* repo.retry(item, 'disabled')
              pending += 1
              continue
            }
            let accepted = false
            let retry = false
            for (const installation of item.installations) {
              if (item.acceptedInstallationIds.includes(installation.id)) continue
              const stillBound = yield* repo.isStillBound(item, installation)
              if (!stillBound) continue
              const payload: NativeNotificationPayload = {
                type: item.type,
                eventId: item.eventId,
                entityId: item.entityId,
                recipientKind: item.recipient.kind,
                recipientId: item.recipient.id,
                title: 'Gatherory',
                body:
                  item.type === 'assignment_changed'
                    ? installation.locale === 'es'
                      ? 'Se te asignó una tarea.'
                      : 'A task was assigned to you.'
                    : item.type === 'event_announcement'
                      ? installation.locale === 'es'
                        ? 'Hay una nueva actualización del evento.'
                        : 'There’s a new event update.'
                      : installation.locale === 'es'
                        ? 'Se actualizaron los detalles del evento.'
                        : 'Event details changed.',
              }
              const result = yield* Effect.matchEffect(
                connector.send({ token: installation.token, payload }),
                {
                  onSuccess: () =>
                    repo
                      .markInstallationAccepted(item, installation.id)
                      .pipe(Effect.as({ accepted: true as const })),
                  onFailure: (failure) => Effect.succeed({ accepted: false as const, failure }),
                }
              )
              if (result.accepted) {
                accepted = true
              } else if (isNotificationConnectorFailure(result.failure)) {
                if (result.failure.kind === 'invalid_registration') {
                  yield* repo.disableInstallation(installation)
                } else {
                  retry = true
                }
              } else {
                retry = true
              }
            }
            if (retry) {
              yield* repo.retry(item, 'provider_failure')
              pending += 1
            } else if (
              accepted ||
              item.acceptedInstallationIds.length > 0 ||
              item.installations.length === 0
            ) {
              if (item.installations.length === 0) {
                yield* repo.retry(item, 'no_installation')
                pending += 1
              } else {
                yield* repo.delivered(item)
                delivered += 1
              }
            } else {
              yield* repo.retry(item, 'no_active_binding', true)
              discarded += 1
            }
          }
          return { claimed: items.length, delivered, pending, discarded }
        }),
    }
  })
)
