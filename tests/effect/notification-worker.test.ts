import { EventEmitter } from 'node:events'
import { expect, it } from '@effect/vitest'
import { test } from 'vitest'
import { Effect, Fiber } from 'effect'
import { TestClock } from 'effect/testing'
import {
  notificationWorkerLoop,
  notificationWorkerMain,
  type NotificationWorkerEvent,
} from '@/server/notifications/scheduler/notification-worker'

const summary = { claimed: 1, delivered: 1, pending: 0, discarded: 0 }

it.effect('waits for each bounded dispatch and then 60 seconds, without overlap', () =>
  Effect.gen(function* () {
    let started = 0,
      active = 0,
      peak = 0
    const dispatch = Effect.acquireUseRelease(
      Effect.sync(() => {
        started += 1
        active += 1
        peak = Math.max(peak, active)
      }),
      () => Effect.sleep(25_000).pipe(Effect.as(summary)),
      () =>
        Effect.sync(() => {
          active -= 1
        })
    )
    const fiber = yield* notificationWorkerLoop({ dispatch }).pipe(Effect.forkChild)
    yield* TestClock.adjust(24_000)
    expect(started).toBe(1)
    expect(active).toBe(1)
    yield* TestClock.adjust(1_000)
    expect(active).toBe(0)
    yield* TestClock.adjust(59_999)
    expect(started).toBe(1)
    yield* TestClock.adjust(1)
    expect(started).toBe(2)
    expect(peak).toBe(1)
    yield* Fiber.interrupt(fiber)
    expect(active).toBe(0)
  })
)

it.effect(
  'uses an injected delay and recovers from a failed dispatch without retrying immediately',
  () =>
    Effect.gen(function* () {
      const delays: number[] = []
      let attempts = 0,
        failures = 0
      const fiber = yield* notificationWorkerLoop({
        dispatch: Effect.suspend(() => {
          attempts += 1
          return Effect.fail(new Error('private provider failure'))
        }),
        intervalMs: 1234,
        sleep: (milliseconds) =>
          Effect.gen(function* () {
            delays.push(milliseconds)
            yield* Effect.sleep(milliseconds)
          }),
        onFailure: () =>
          Effect.sync(() => {
            failures += 1
          }),
      }).pipe(Effect.forkChild)
      yield* TestClock.adjust(1233)
      expect(attempts).toBe(1)
      expect(delays).toEqual([1234])
      yield* TestClock.adjust(1)
      expect(attempts).toBe(2)
      expect(failures).toBe(2)
      yield* Fiber.interrupt(fiber)
      yield* TestClock.adjust(10_000)
      expect(attempts).toBe(2)
    })
)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test(`worker main interrupts in-flight dispatch on ${signal} and removes signal listeners`, async () => {
    const signals = new EventEmitter()
    const events: NotificationWorkerEvent[] = []
    let deliverySignal: AbortSignal | undefined
    let started!: () => void
    const dispatchStarted = new Promise<void>((resolve) => {
      started = resolve
    })
    const running = notificationWorkerMain({
      configuration: { enabled: true, fcmConfigured: true },
      signals,
      report: (event) => events.push(event),
      dispatch: (abort) => {
        deliverySignal = abort
        started()
        return new Promise(() => {})
      },
    })
    await dispatchStarted
    signals.emit(signal)
    expect(await running).toBe(0)
    expect(deliverySignal?.aborted).toBe(true)
    expect(signals.listenerCount('SIGINT')).toBe(0)
    expect(signals.listenerCount('SIGTERM')).toBe(0)
    expect(events).toEqual([{ type: 'started' }, { type: 'stopped' }])
  })
}

test('worker refuses to start without explicit enablement and complete FCM configuration', async () => {
  for (const configuration of [
    { enabled: false, fcmConfigured: true },
    { enabled: true, fcmConfigured: false },
  ]) {
    const events: NotificationWorkerEvent[] = []
    const signals = new EventEmitter()
    let dispatched = false
    const status = await notificationWorkerMain({
      configuration,
      signals,
      report: (event) => events.push(event),
      dispatch: async () => {
        dispatched = true
        return summary
      },
    })
    expect(status).toBe(1)
    expect(dispatched).toBe(false)
    expect(events).toEqual([{ type: 'configuration_invalid' }])
    expect(signals.eventNames()).toEqual([])
  }
})
