import { expect, it } from '@effect/vitest'
import { Deferred, Effect, Fiber, Layer } from 'effect'
import { TestClock } from 'effect/testing'
import { PersistenceError } from '@/lib/domain-errors'
import {
  NotificationConnector,
  NotificationConnectorFailure,
  type NotificationConnectorShape,
} from '@/server/notifications/connectors/notification.con'
import {
  NotificationRepository,
  type NotificationRepositoryShape,
} from '@/server/notifications/repos/notification.repo.contract'
import type {
  ClaimedNotification,
  EventChangeKind,
  NotificationDispatchScope,
} from '@/server/notifications/contracts/notification.contracts'
import { NotificationService } from '@/server/notifications/services/notification.service'
import {
  createNotificationService,
  eventChangeNotificationBody,
  NotificationServiceLive,
} from '@/server/notifications/services/notification.service.live'

function fixture() {
  const item: ClaimedNotification = {
    id: 'outbox-1',
    eventId: 'event-1',
    entityId: 'todo-1',
    recipient: { kind: 'user', id: 'user-1' },
    type: 'assignment_changed',
    leaseKey: 'lease-1',
    acceptedInstallationIds: [],
    installations: ['first', 'second'].map((id) => ({
      id,
      generation: 1,
      revision: 1,
      tokenHash: id.repeat(16),
      locale: 'en',
      token: `${id}-token`,
    })),
  }
  const queue = [item]
  const calls = {
    claims: [] as number[],
    sent: [] as string[],
    deliveryIds: [] as (string | undefined)[],
    accepted: [] as string[],
    delivered: [] as string[],
    disabled: [] as string[],
    retries: [] as Array<{ id: string; reason: string; discard?: boolean; retryAfterMs?: number }>,
    order: [] as string[],
    scopes: [] as NotificationDispatchScope[],
    freshClaims: [] as unknown[],
  }
  let time = 0
  const repo: {
    -readonly [K in keyof NotificationRepositoryShape]: NotificationRepositoryShape[K]
  } = {
    register: (input) =>
      Effect.succeed({
        installationId: input.id,
        bindingGeneration: 1,
        revision: input.revision,
        accepted: true,
      }),
    detach: () => Effect.succeed({ detached: true, revision: 2, accepted: true }),
    claimPending: (limit, options) =>
      Effect.sync(() => {
        calls.claims.push(limit ?? 0)
        if (options) calls.freshClaims.push(options)
        return queue.splice(0, 1)
      }),
    discardFresh: (scope) =>
      Effect.sync(() => {
        calls.scopes.push(scope)
        return queue.splice(0).length
      }),
    isStillBound: () => Effect.succeed(true),
    delivered: (item) =>
      Effect.sync(() => {
        calls.delivered.push(item.id)
      }),
    retry: (item, reason, discard, retryAfterMs) =>
      Effect.sync(() => {
        calls.retries.push({ id: item.id, reason, discard, retryAfterMs })
      }),
    markInstallationAccepted: (item, id) =>
      Effect.sync(() => {
        calls.order.push(`checkpoint:${id}`)
        calls.accepted.push(id)
        item.acceptedInstallationIds.push(id)
      }),
    disableInstallation: (installation) =>
      Effect.sync(() => {
        calls.disabled.push(installation.id)
      }),
  }
  const connector: {
    -readonly [K in keyof NotificationConnectorShape]: NotificationConnectorShape[K]
  } = {
    isConfigured: true,
    send: (input) =>
      Effect.sync(() => {
        calls.order.push(`send:${input.token}`)
        calls.sent.push(input.token)
        calls.deliveryIds.push(input.deliveryId)
      }),
  }
  return {
    item,
    queue,
    calls,
    repo,
    connector,
    setTime: (value: number) => {
      time = value
    },
    service: () => createNotificationService(repo, connector, () => time),
  }
}

const eventChangeBodies: Array<[EventChangeKind | null, 'en' | 'es', string]> = [
  ['schedule', 'en', 'Event date or time changed.'],
  ['schedule', 'es', 'Cambió la fecha o la hora del evento.'],
  ['location', 'en', 'Event location changed.'],
  ['location', 'es', 'Cambió la ubicación del evento.'],
  ['schedule_and_location', 'en', 'Event schedule and location changed.'],
  ['schedule_and_location', 'es', 'Cambiaron el horario y la ubicación del evento.'],
  ['cancelled', 'en', 'Event cancelled.'],
  ['cancelled', 'es', 'Evento cancelado.'],
  ['reopened', 'en', 'Event is back on.'],
  ['reopened', 'es', 'El evento vuelve a estar en pie.'],
  [null, 'en', 'Event details changed.'],
  [null, 'es', 'Se actualizaron los detalles del evento.'],
  ['legacy_unknown' as EventChangeKind, 'en', 'Event details changed.'],
  ['legacy_unknown' as EventChangeKind, 'es', 'Se actualizaron los detalles del evento.'],
  ['constructor' as EventChangeKind, 'en', 'Event details changed.'],
  ['__proto__' as EventChangeKind, 'es', 'Se actualizaron los detalles del evento.'],
]

for (const [kind, locale, body] of eventChangeBodies) {
  it.effect(
    `sends ${kind ?? 'legacy'} event-change copy in ${locale} without private content`,
    () => {
      const f = fixture()
      f.item.type = 'event_changed'
      f.item.eventChangeKind = kind
      f.item.installations.forEach((installation) => {
        installation.locale = locale
      })
      const payloads: unknown[] = []
      f.connector.send = (input) =>
        Effect.sync(() => {
          payloads.push(input.payload)
        })
      return Effect.gen(function* () {
        expect(eventChangeNotificationBody(kind, locale)).toBe(body)
        expect((yield* f.service().dispatchPending()).delivered).toBe(1)
        expect(payloads).toHaveLength(2)
        expect(payloads[0]).toEqual({
          type: 'event_changed',
          eventId: 'event-1',
          entityId: 'todo-1',
          recipientKind: 'user',
          recipientId: 'user-1',
          title: 'Gatherory',
          body,
        })
        expect(Object.keys(payloads[0] as object).sort()).toEqual([
          'body',
          'entityId',
          'eventId',
          'recipientId',
          'recipientKind',
          'title',
          'type',
        ])
      })
    }
  )
}

for (const [locale, body] of [
  ['en', 'There’s a new event update.'],
  ['es', 'Hay una nueva actualización del evento.'],
] as const) {
  it.effect(`delivers generic ${locale} announcement alerts with an opaque delivery ID`, () => {
    const f = fixture()
    f.item.type = 'event_announcement'
    f.item.entityId = 'announcement-1'
    f.item.installations.forEach((installation) => {
      installation.locale = locale
    })
    const payloads: unknown[] = []
    f.connector.send = (input) =>
      Effect.sync(() => {
        payloads.push(input)
      })
    const layer = NotificationServiceLive.pipe(
      Layer.provide(
        Layer.mergeAll(
          Layer.succeed(NotificationRepository, f.repo),
          Layer.succeed(NotificationConnector, f.connector)
        )
      )
    )
    return Effect.gen(function* () {
      const service = yield* NotificationService
      yield* service.dispatchPending()
      expect(payloads).toHaveLength(2)
      expect(payloads[0]).toMatchObject({
        deliveryId: 'outbox-1',
        payload: {
          type: 'event_announcement',
          entityId: 'announcement-1',
          body,
          recipientKind: 'user',
          recipientId: 'user-1',
        },
      })
    }).pipe(Effect.provide(layer))
  })
}

it.effect(
  'rechecks the exact installation binding before sending and checkpoints before further sends',
  () => {
    const f = fixture()
    f.repo.isStillBound = (_item, installation) => Effect.succeed(installation.id === 'second')
    return Effect.gen(function* () {
      const result = yield* f.service().dispatchPending()
      expect(f.calls.sent).toEqual(['second-token'])
      expect(f.calls.accepted).toEqual(['second'])
      expect(f.calls.deliveryIds).toEqual(['outbox-1'])
      expect(result).toEqual({ claimed: 1, delivered: 0, pending: 1, discarded: 0 })
      expect(f.calls.claims).toEqual([1, 1])
    })
  }
)

it.effect('retries a partial delivery without resending its durably accepted installation', () => {
  const f = fixture()
  const send = f.connector.send
  let failing = true
  f.connector.send = (input) =>
    input.token === 'second-token' && failing
      ? Effect.fail(new NotificationConnectorFailure('transient', 'offline'))
      : send(input)
  return Effect.gen(function* () {
    expect((yield* f.service().dispatchPending()).pending).toBe(1)
    expect(f.calls.order).toEqual(['send:first-token', 'checkpoint:first'])
    failing = false
    f.queue.push(f.item)
    expect((yield* f.service().dispatchPending()).delivered).toBe(1)
    expect(f.calls.sent).toEqual(['first-token', 'second-token'])
    expect(f.calls.order).toEqual([
      'send:first-token',
      'checkpoint:first',
      'send:second-token',
      'checkpoint:second',
    ])
  })
})

it.effect('stops all further network work when an acceptance checkpoint fails', () => {
  const f = fixture()
  const failure = new PersistenceError({ category: 'system', debugMessage: 'checkpoint failed' })
  f.repo.markInstallationAccepted = () => Effect.fail(failure)
  return Effect.gen(function* () {
    const error = yield* Effect.flip(f.service().dispatchPending())
    expect(error).toBe(failure)
    expect(f.calls.sent).toEqual(['first-token'])
    expect(f.calls.claims).toEqual([1])
    expect(f.calls.retries).toEqual([])
  })
})

it.effect('leaves rows and attempt counters untouched while the provider is disabled', () => {
  const f = fixture()
  f.connector.isConfigured = false
  return Effect.gen(function* () {
    expect(yield* f.service().dispatchPending()).toEqual({
      claimed: 0,
      delivered: 0,
      pending: 0,
      discarded: 0,
    })
    expect(f.calls.claims).toEqual([])
    expect(f.calls.retries).toEqual([])
  })
})

it.effect(
  'checkpoints accepted devices and retries the remainder when its deadline is reached',
  () => {
    const f = fixture()
    const send = f.connector.send
    f.connector.send = (input) =>
      send(input).pipe(Effect.tap(() => Effect.sync(() => f.setTime(25_000))))
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchPending()).toEqual({
        claimed: 1,
        delivered: 0,
        pending: 1,
        discarded: 0,
      })
      expect(f.calls.sent).toEqual(['first-token'])
      expect(f.calls.accepted).toEqual(['first'])
      expect(f.calls.retries[0]?.reason).toBe('dispatch_budget')
      expect(f.calls.claims).toEqual([1])
      f.connector.send = send
      f.queue.push(f.item)
      yield* f.service().dispatchPending()
      expect(f.calls.sent).toEqual(['first-token', 'second-token'])
    })
  }
)

it.effect(
  'checks the remaining deadline after binding authorization and before network access',
  () => {
    const f = fixture()
    f.repo.isStillBound = () =>
      Effect.sync(() => {
        f.setTime(25_000)
        return true
      })
    return Effect.gen(function* () {
      yield* f.service().dispatchPending()
      expect(f.calls.sent).toEqual([])
      expect(f.calls.retries[0]?.reason).toBe('dispatch_budget')
    })
  }
)

it.effect('disables only a confirmed invalid token and continues with other devices', () => {
  const f = fixture()
  const send = f.connector.send
  f.connector.send = (input) =>
    input.token === 'first-token'
      ? Effect.fail(new NotificationConnectorFailure('invalid_registration', 'invalid'))
      : send(input)
  return Effect.gen(function* () {
    expect((yield* f.service().dispatchPending()).delivered).toBe(1)
    expect(f.calls.disabled).toEqual(['first'])
    expect(f.calls.sent).toEqual(['second-token'])
  })
})

it.effect('discards malformed payloads without disabling a token or blocking later intents', () => {
  const f = fixture()
  f.queue.push({ ...f.item, id: 'outbox-2', acceptedInstallationIds: [] })
  const send = f.connector.send
  f.connector.send = (input) =>
    input.deliveryId === 'outbox-1'
      ? Effect.fail(new NotificationConnectorFailure('invalid_payload', 'bad payload'))
      : send(input)
  return Effect.gen(function* () {
    expect(yield* f.service().dispatchPending()).toEqual({
      claimed: 2,
      delivered: 1,
      pending: 0,
      discarded: 1,
    })
    expect(f.calls.disabled).toEqual([])
    expect(f.calls.retries[0]).toMatchObject({ reason: 'invalid_payload', discard: true })
  })
})

it.effect('does not let a transient item failure block subsequent queued intents', () => {
  const f = fixture()
  f.queue.push({ ...f.item, id: 'outbox-2', acceptedInstallationIds: [] })
  const send = f.connector.send
  f.connector.send = (input) =>
    input.deliveryId === 'outbox-1'
      ? Effect.fail(new NotificationConnectorFailure('transient', 'offline', 7_200_000))
      : send(input)
  return Effect.gen(function* () {
    expect(yield* f.service().dispatchPending()).toEqual({
      claimed: 2,
      delivered: 1,
      pending: 1,
      discarded: 0,
    })
    expect(f.calls.retries[0]?.retryAfterMs).toBe(7_200_000)
  })
})

it.effect(
  'halts the cycle after rejected credentials so other rows do not consume attempts',
  () => {
    const f = fixture()
    f.queue.push({ ...f.item, id: 'outbox-2' })
    let sends = 0
    f.connector.send = () => {
      sends += 1
      return Effect.fail(new NotificationConnectorFailure('credentials', 'invalid credentials'))
    }
    return Effect.gen(function* () {
      expect((yield* f.service().dispatchPending()).pending).toBe(1)
      expect(sends).toBe(1)
      expect(f.calls.claims).toEqual([1])
      expect(f.queue).toHaveLength(1)
      expect(f.calls.disabled).toEqual([])
    })
  }
)

it.effect('retries absent installations and inconclusive binding or lease checks', () => {
  const f = fixture()
  f.queue.push({ ...f.item, id: 'outbox-2', installations: [] })
  f.repo.isStillBound = () => Effect.succeed(false)
  return Effect.gen(function* () {
    expect(yield* f.service().dispatchPending()).toEqual({
      claimed: 2,
      delivered: 0,
      pending: 2,
      discarded: 0,
    })
    expect(f.calls.sent).toEqual([])
    expect(f.calls.retries.every((entry) => entry.discard !== true)).toBe(true)
    expect(f.calls.retries.map((entry) => entry.reason)).toEqual([
      'provider_failure',
      'no_installation',
    ])
  })
})

it.effect(
  'validates limits before claiming and bounds each invocation to its requested item count',
  () => {
    const f = fixture()
    f.repo.claimPending = (limit) =>
      Effect.sync(() => {
        f.calls.claims.push(limit ?? 0)
        return [{ ...f.item, installations: [] }]
      })
    return Effect.gen(function* () {
      for (const limit of [0, -1, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(yield* Effect.flip(f.service().dispatchPending(limit))).toMatchObject({
          code: 'INVALID_NOTIFICATION_DISPATCH_LIMIT',
        })
      }
      expect(f.calls.claims).toEqual([])
      expect((yield* f.service().dispatchPending()).claimed).toBe(20)
      expect(f.calls.claims.every((limit) => limit === 1)).toBe(true)
      expect((yield* f.service().dispatchPending(100)).claimed).toBe(100)
    })
  }
)

it.effect(
  'interrupts a send at the invocation deadline and releases remaining work for retry',
  () => {
    const f = fixture()
    return Effect.gen(function* () {
      const started = yield* Deferred.make<void>()
      let interrupted = false
      f.connector.send = () =>
        Deferred.succeed(started, undefined).pipe(
          Effect.andThen(Effect.never),
          Effect.ensuring(
            Effect.sync(() => {
              interrupted = true
            })
          )
        )
      const fiber = yield* Effect.forkChild(f.service().dispatchPending())
      yield* Deferred.await(started)
      f.setTime(25_000)
      yield* TestClock.adjust('25 seconds')
      const result = yield* Fiber.join(fiber)
      expect(interrupted).toBe(true)
      expect(result.pending).toBe(1)
      expect(f.calls.claims).toEqual([1])
      expect(f.calls.retries[0]?.reason).toBe('dispatch_budget')
    })
  }
)

it.effect(
  'settles a durable prior acceptance even after its installation leaves the registry',
  () => {
    const f = fixture()
    f.item.acceptedInstallationIds.push('previous-installation')
    f.item.installations = []
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchPending()).toEqual({
        claimed: 1,
        delivered: 1,
        pending: 0,
        discarded: 0,
      })
      expect(f.calls.delivered).toEqual(['outbox-1'])
      expect(f.calls.retries).toEqual([])
      expect(f.calls.sent).toEqual([])
    })
  }
)

it.effect('finishes the acceptance checkpoint before honoring cancellation', () => {
  const f = fixture()
  return Effect.gen(function* () {
    const checkpointStarted = yield* Deferred.make<void>()
    const finishCheckpoint = yield* Deferred.make<void>()
    const checkpoint = f.repo.markInstallationAccepted
    f.repo.markInstallationAccepted = (item, id) =>
      Deferred.succeed(checkpointStarted, undefined).pipe(
        Effect.andThen(Deferred.await(finishCheckpoint)),
        Effect.andThen(checkpoint(item, id))
      )
    const fiber = yield* Effect.forkChild(f.service().dispatchPending())
    yield* Deferred.await(checkpointStarted)
    const interruption = yield* Effect.forkChild(Fiber.interrupt(fiber))
    yield* Effect.yieldNow
    yield* Deferred.succeed(finishCheckpoint, undefined)
    yield* Fiber.join(interruption)
    expect(f.calls.sent).toEqual(['first-token'])
    expect(f.calls.accepted).toEqual(['first'])
    expect(f.calls.claims).toEqual([1])
  })
})

it.effect(
  'keeps partial delivery pending when another device binding check is inconclusive',
  () => {
    const f = fixture()
    f.repo.isStillBound = (_item, installation) => Effect.succeed(installation.id === 'first')
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchPending()).toEqual({
        claimed: 1,
        delivered: 0,
        pending: 1,
        discarded: 0,
      })
      expect(f.calls.accepted).toEqual(['first'])
      expect(f.calls.delivered).toEqual([])
      f.repo.isStillBound = () => Effect.succeed(true)
      f.queue.push(f.item)
      expect((yield* f.service().dispatchPending()).delivered).toBe(1)
      expect(f.calls.sent).toEqual(['first-token', 'second-token'])
    })
  }
)

const mutationScope: NotificationDispatchScope = {
  kind: 'mutations',
  mutationIds: ['committed-mutation'],
}

it.effect(
  'one-time dispatch checkpoints partial acceptance and permanently retires a failed remainder',
  () => {
    const f = fixture()
    const send = f.connector.send
    f.connector.send = (input) =>
      input.token === 'second-token'
        ? Effect.fail(new NotificationConnectorFailure('transient', 'offline', 60_000))
        : send(input)
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchOnce(mutationScope)).toEqual({
        claimed: 1,
        delivered: 0,
        pending: 0,
        discarded: 1,
      })
      expect(f.calls.accepted).toEqual(['first'])
      expect(f.calls.retries).toEqual([
        { id: 'outbox-1', reason: 'provider_failure', discard: true, retryAfterMs: undefined },
      ])
      expect(
        f.calls.freshClaims.every(
          (value) =>
            JSON.stringify(value) === JSON.stringify({ scope: mutationScope, freshOnly: true })
        )
      ).toBe(true)
      yield* f.service().dispatchOnce(mutationScope)
      expect(f.calls.sent).toEqual(['first-token'])
      expect(f.calls.accepted).toEqual(['first'])
    })
  }
)

it.effect(
  'one-time disabled dispatch retires only its fresh scope without claiming or sending',
  () => {
    const f = fixture()
    const scope: NotificationDispatchScope = {
      kind: 'announcement',
      announcementId: 'committed-announcement',
    }
    f.connector.isConfigured = false
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchOnce(scope)).toEqual({
        claimed: 0,
        delivered: 0,
        pending: 0,
        discarded: 1,
      })
      expect(f.calls.claims).toEqual([])
      expect(f.calls.sent).toEqual([])
      expect(f.calls.scopes).toEqual([scope])
      yield* f.service().dispatchOnce(scope)
      expect(f.calls.sent).toEqual([])
    })
  }
)

it.effect(
  'one-time deadline retires both the partially attempted item and fresh scope leftovers',
  () => {
    const f = fixture()
    f.queue.push({ ...f.item, id: 'unattempted', acceptedInstallationIds: [] })
    const send = f.connector.send
    f.connector.send = (input) =>
      send(input).pipe(Effect.tap(() => Effect.sync(() => f.setTime(25_000))))
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchOnce(mutationScope)).toEqual({
        claimed: 1,
        delivered: 0,
        pending: 0,
        discarded: 2,
      })
      expect(f.calls.claims).toEqual([1])
      expect(f.calls.sent).toEqual(['first-token'])
      expect(f.calls.retries[0]).toMatchObject({ reason: 'dispatch_budget', discard: true })
      expect(f.queue).toEqual([])
    })
  }
)

it.effect(
  'one-time dispatch permanently retires no-installation and inconclusive binding outcomes',
  () => {
    const f = fixture()
    f.queue.push({ ...f.item, id: 'no-devices', installations: [] })
    f.repo.isStillBound = () => Effect.succeed(false)
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchOnce(mutationScope)).toEqual({
        claimed: 2,
        delivered: 0,
        pending: 0,
        discarded: 2,
      })
      expect(f.calls.sent).toEqual([])
      expect(f.calls.retries.every((entry) => entry.discard === true)).toBe(true)
    })
  }
)

it.effect('one-time credential failure stops sending and retires unattempted scoped rows', () => {
  const f = fixture()
  f.queue.push({ ...f.item, id: 'unattempted' })
  let sends = 0
  f.connector.send = () =>
    Effect.sync(() => {
      sends += 1
    }).pipe(Effect.andThen(Effect.fail(new NotificationConnectorFailure('credentials', 'invalid'))))
  return Effect.gen(function* () {
    expect(yield* f.service().dispatchOnce(mutationScope)).toEqual({
      claimed: 1,
      delivered: 0,
      pending: 0,
      discarded: 2,
    })
    expect(sends).toBe(1)
    expect(f.calls.retries[0]?.discard).toBe(true)
    expect(f.queue).toEqual([])
  })
})

it.effect(
  'one-time checkpoint failure propagates without more network work and retires the scope',
  () => {
    const f = fixture()
    f.queue.push({ ...f.item, id: 'unattempted' })
    const failure = new PersistenceError({ category: 'system', debugMessage: 'checkpoint failed' })
    f.repo.markInstallationAccepted = () => Effect.fail(failure)
    return Effect.gen(function* () {
      expect(yield* Effect.flip(f.service().dispatchOnce(mutationScope))).toBe(failure)
      expect(f.calls.sent).toEqual(['first-token'])
      expect(f.calls.retries[0]).toMatchObject({ reason: 'best_effort_finished', discard: true })
      expect(f.calls.scopes).toEqual([mutationScope])
      expect(f.queue).toEqual([])
    })
  }
)

it.effect(
  'one-time cancellation retires the active intent and all remaining fresh scoped work',
  () => {
    const f = fixture()
    f.queue.push({ ...f.item, id: 'unattempted' })
    return Effect.gen(function* () {
      const started = yield* Deferred.make<void>()
      f.connector.send = () =>
        Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never))
      const fiber = yield* Effect.forkChild(f.service().dispatchOnce(mutationScope))
      yield* Deferred.await(started)
      yield* Fiber.interrupt(fiber)
      expect(f.calls.retries[0]).toMatchObject({ reason: 'best_effort_finished', discard: true })
      expect(f.calls.scopes).toEqual([mutationScope])
      expect(f.queue).toEqual([])
    })
  }
)

it.effect(
  'one-time dispatch bounds attempts at twenty intents and retires excess scoped recipients',
  () => {
    const f = fixture()
    f.item.installations = []
    f.queue.push(
      ...Array.from({ length: 24 }, (_, index) => ({ ...f.item, id: `outbox-${index + 2}` }))
    )
    return Effect.gen(function* () {
      expect(yield* f.service().dispatchOnce(mutationScope)).toEqual({
        claimed: 20,
        delivered: 0,
        pending: 0,
        discarded: 25,
      })
      expect(f.calls.claims).toHaveLength(20)
      expect(f.queue).toEqual([])
    })
  }
)

for (const once of [false, true]) {
  it.effect(
    `allocates fresh invocation state when reusing a ${once ? 'one-time' : 'pending'} dispatch Effect`,
    () => {
      const f = fixture()
      const service = f.service()
      const dispatch = once ? service.dispatchOnce(mutationScope) : service.dispatchPending()
      return Effect.gen(function* () {
        const first = yield* dispatch
        f.queue.push({ ...f.item, id: 'next-item', acceptedInstallationIds: [] })
        const second = yield* dispatch
        expect(first).toEqual({ claimed: 1, delivered: 1, pending: 0, discarded: 0 })
        expect(second).toEqual({ claimed: 1, delivered: 1, pending: 0, discarded: 0 })
        expect(first).not.toBe(second)
        expect(f.calls.sent).toEqual(['first-token', 'second-token', 'first-token', 'second-token'])
      })
    }
  )
}

it.effect('still attempts scoped fresh cleanup when active intent settlement fails', () => {
  const f = fixture()
  f.queue.push({ ...f.item, id: 'unattempted' })
  const failure = new PersistenceError({
    category: 'system',
    debugMessage: 'persistence unavailable',
  })
  f.repo.markInstallationAccepted = () => Effect.fail(failure)
  f.repo.retry = () => Effect.fail(failure)
  return Effect.gen(function* () {
    yield* Effect.exit(f.service().dispatchOnce(mutationScope))
    expect(f.calls.sent).toEqual(['first-token'])
    expect(f.calls.scopes).toEqual([mutationScope])
    expect(f.queue).toEqual([])
  })
})
