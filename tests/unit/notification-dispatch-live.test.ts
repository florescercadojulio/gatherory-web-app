import { afterEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'

const mocks = vi.hoisted(() => ({ dispatch: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/notifications/workflows/notification.workflows.live', () => ({
  dispatchPendingNotifications: mocks.dispatch,
}))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

const secret = 'scheduler-test-secret-at-least-32-characters'
function configure() {
  vi.stubEnv('CRON_SECRET', secret)
  vi.stubEnv('NOTIFICATION_DISPATCH_ENABLED', 'true')
  vi.stubEnv('FCM_PROJECT_ID', 'test-project')
  vi.stubEnv('FCM_CLIENT_EMAIL', 'test@example.test')
  vi.stubEnv('FCM_PRIVATE_KEY', 'test-key-never-used')
}

test('live scheduler adapter fixes the server batch limit at 20 and keeps only aggregate output', async () => {
  configure()
  const summary = { claimed: 1, delivered: 1, pending: 0, discarded: 0 }
  mocks.dispatch.mockReturnValue(Effect.succeed(summary))
  const { scheduledNotificationDispatchResponse } =
    await import('@/server/notifications/scheduler/notification-dispatch.adapter.live')
  const response = await scheduledNotificationDispatchResponse(
    new Request(
      'https://example.test/api/internal/notifications/dispatch?limit=1000&recipientId=not-authorized',
      { headers: { authorization: `Bearer ${secret}` } }
    )
  )
  expect(mocks.dispatch).toHaveBeenCalledExactlyOnceWith(20)
  expect(await response.json()).toEqual({ ok: true, data: summary })
})

test('request cancellation interrupts the live dispatch Effect rather than leaving a detached run', async () => {
  configure()
  let finalized = false
  let started!: () => void
  const active = new Promise<void>((resolve) => {
    started = resolve
  })
  mocks.dispatch.mockReturnValue(
    Effect.gen(function* () {
      started()
      yield* Effect.never
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          finalized = true
        })
      )
    )
  )
  const { scheduledNotificationDispatchResponse } =
    await import('@/server/notifications/scheduler/notification-dispatch.adapter.live')
  const controller = new AbortController()
  const pending = scheduledNotificationDispatchResponse(
    new Request('https://example.test/api/internal/notifications/dispatch', {
      signal: controller.signal,
      headers: { authorization: `Bearer ${secret}` },
    })
  )
  await active
  controller.abort()
  expect((await pending).status).toBe(503)
  expect(finalized).toBe(true)
})
