import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import {
  NotificationConnector,
  NotificationConnectorFailure,
  type NotificationConnectorShape,
} from '@/server/notifications/connectors/notification.con'
import {
  NotificationRepository,
  type NotificationRepositoryShape,
} from '@/server/notifications/repos/notification.repo.contract'
import type { ClaimedNotification } from '@/server/notifications/contracts/notification.contracts'
import { NotificationService } from '@/server/notifications/services/notification.service'
import { NotificationServiceLive } from '@/server/notifications/services/notification.service.live'

function fixture(
  overrides: Partial<NotificationRepositoryShape> = {},
  send?: NotificationConnectorShape['send']
) {
  const item: ClaimedNotification = {
    id: 'outbox-1',
    eventId: 'event-1',
    entityId: 'todo-1',
    recipient: { kind: 'user', id: 'user-1' },
    type: 'assignment_changed',
    leaseKey: 'lease-1',
    acceptedInstallationIds: [],
    installations: [
      {
        id: 'old-installation',
        generation: 1,
        revision: 1,
        tokenHash: 'a'.repeat(64),
        locale: 'en',
        token: 'old-token',
      },
      {
        id: 'current-installation',
        generation: 4,
        revision: 4,
        tokenHash: 'b'.repeat(64),
        locale: 'en',
        token: 'current-token',
      },
    ],
  }
  const calls = {
    sent: [] as string[],
    accepted: [] as string[],
    delivered: 0,
    retried: [] as string[],
    discarded: 0,
  }
  const repo: NotificationRepositoryShape = {
    register: (input) =>
      Effect.succeed({
        installationId: input.id,
        bindingGeneration: 1,
        revision: input.revision,
        accepted: true,
      }),
    detach: () => Effect.succeed({ detached: true, revision: 2, accepted: true }),
    claimPending: () => Effect.succeed([item]),
    isStillBound: (_item, installation) =>
      Effect.succeed(installation.id === 'current-installation'),
    delivered: () =>
      Effect.sync(() => {
        calls.delivered += 1
      }),
    retry: (_item, reason, discard) =>
      Effect.sync(() => {
        calls.retried.push(reason)
        if (discard) calls.discarded += 1
      }),
    markInstallationAccepted: (_item, id) =>
      Effect.sync(() => {
        calls.accepted.push(id)
        item.acceptedInstallationIds.push(id)
      }),
    disableInstallation: () => Effect.void,
    ...overrides,
  }
  const connector: NotificationConnectorShape = {
    isConfigured: true,
    send:
      send ??
      ((input) =>
        Effect.sync(() => {
          calls.sent.push(input.token)
        })),
  }
  const layer = NotificationServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(NotificationRepository, repo),
        Layer.succeed(NotificationConnector, connector)
      )
    )
  )
  return { layer, calls, item }
}

for (const [locale, body] of [
  ['en', 'There’s a new event update.'],
  ['es', 'Hay una nueva actualización del evento.'],
] as const) {
  it.effect(`delivers generic ${locale} announcement alerts without private text`, () => {
    const payloads: Array<{ body: string; entityId: string; type: string }> = []
    const { layer, item } = fixture({}, (input) =>
      Effect.sync(() => {
        payloads.push(input.payload)
      })
    )
    item.type = 'event_announcement'
    item.entityId = 'announcement-1'
    item.installations[1]!.locale = locale
    return Effect.gen(function* () {
      const service = yield* NotificationService
      yield* service.dispatchPending()
      expect(payloads).toHaveLength(1)
      expect(payloads[0]).toMatchObject({
        type: 'event_announcement',
        entityId: 'announcement-1',
        body,
      })
    }).pipe(Effect.provide(layer))
  })
}

it.effect(
  'rechecks exact binding and records provider acceptance before completing the outbox item',
  () => {
    const { layer, calls } = fixture()
    return Effect.gen(function* () {
      const service = yield* NotificationService
      const result = yield* service.dispatchPending()
      expect(calls.sent).toEqual(['current-token'])
      expect(calls.accepted).toEqual(['current-installation'])
      expect(calls.delivered).toBe(1)
      expect(result).toMatchObject({ claimed: 1, delivered: 1, pending: 0 })
    }).pipe(Effect.provide(layer))
  }
)

it.effect(
  'retains transient failures and skips installations with a recorded receipt on retry',
  () => {
    const failure = new NotificationConnectorFailure('transient', 'offline')
    const { layer, calls, item } = fixture({}, () => Effect.fail(failure))
    item.acceptedInstallationIds.push('old-installation')
    return Effect.gen(function* () {
      const service = yield* NotificationService
      const result = yield* service.dispatchPending()
      expect(calls.retried).toEqual(['provider_failure'])
      expect(calls.sent).toEqual([])
      expect(result.pending).toBe(1)
    }).pipe(Effect.provide(layer))
  }
)

it.effect('keeps outbox pending while the provider is disabled', () => {
  const { calls, layer: base } = fixture()
  const layer = NotificationServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(NotificationRepository, {
          register: (input) =>
            Effect.succeed({
              installationId: input.id,
              bindingGeneration: 1,
              revision: input.revision,
              accepted: true,
            }),
          detach: () => Effect.succeed({ detached: true, revision: 1, accepted: true }),
          claimPending: () =>
            Effect.succeed([
              {
                id: 'outbox-1',
                eventId: 'event-1',
                entityId: 'entity-1',
                recipient: { kind: 'user', id: 'user-1' },
                type: 'event_changed',
                leaseKey: 'lease-1',
                acceptedInstallationIds: [],
                installations: [],
              },
            ]),
          isStillBound: () => Effect.succeed(false),
          delivered: () => Effect.void,
          retry: (_item, reason) =>
            Effect.sync(() => {
              calls.retried.push(reason)
            }),
          markInstallationAccepted: () => Effect.void,
          disableInstallation: () => Effect.void,
        }),
        Layer.succeed(NotificationConnector, { isConfigured: false, send: () => Effect.void })
      )
    )
  )
  void base
  return Effect.gen(function* () {
    const service = yield* NotificationService
    const result = yield* service.dispatchPending()
    expect(calls.retried).toEqual(['disabled'])
    expect(result.pending).toBe(1)
  }).pipe(Effect.provide(layer))
})
