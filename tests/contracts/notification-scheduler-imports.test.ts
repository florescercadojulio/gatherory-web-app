import { afterEach, expect, test, vi } from 'vitest'

const production = vi.hoisted(() => ({ database: vi.fn(), workflow: vi.fn(), env: vi.fn() }))
vi.mock('@/db', () => {
  production.database()
  throw new Error('Scheduler imported DB before authorization')
})
vi.mock('@/env', () => {
  production.env()
  throw new Error('Scheduler imported production env before authorization')
})
vi.mock('@/server/notifications/workflows/notification.workflows.live', () => {
  production.workflow()
  throw new Error('Scheduler imported production graph before authorization')
})
afterEach(() => vi.unstubAllEnvs())

test('scheduler, worker main, and CLI can be imported without production dependencies or network work', async () => {
  const modules = await Promise.all([
    import('@/server/notifications/scheduler/notification-dispatch.handler'),
    import('@/server/notifications/scheduler/notification-dispatch.adapter.live'),
    import('@/server/notifications/scheduler/notification-worker'),
    import('../../scripts/notification-worker'),
  ])
  expect(modules.every((module) => Object.keys(module).length > 0)).toBe(true)
  expect(production.database).not.toHaveBeenCalled()
  expect(production.workflow).not.toHaveBeenCalled()
  expect(production.env).not.toHaveBeenCalled()
})

test('live route rejects credentials and disabled/unconfigured requests before loading production', async () => {
  const { scheduledNotificationDispatchResponse } =
    await import('@/server/notifications/scheduler/notification-dispatch.adapter.live')
  const secret = 'scheduler-test-secret-at-least-32-characters'
  vi.stubEnv('CRON_SECRET', secret)
  vi.stubEnv('NOTIFICATION_DISPATCH_ENABLED', 'true')
  const denied = await scheduledNotificationDispatchResponse(
    new Request('https://example.test/api/internal/notifications/dispatch', {
      headers: { authorization: 'Bearer wrong' },
    })
  )
  expect(denied.status).toBe(401)
  vi.stubEnv('CRON_SECRET', 'short')
  const short = await scheduledNotificationDispatchResponse(
    new Request('https://example.test/api/internal/notifications/dispatch', {
      headers: { authorization: 'Bearer short' },
    })
  )
  expect(short.status).toBe(401)
  vi.stubEnv('CRON_SECRET', secret)
  vi.stubEnv('NOTIFICATION_DISPATCH_ENABLED', 'false')
  const enabledRequest = new Request('https://example.test/api/internal/notifications/dispatch', {
    headers: { authorization: `Bearer ${secret}` },
  })
  expect((await scheduledNotificationDispatchResponse(enabledRequest)).status).toBe(200)
  vi.stubEnv('NOTIFICATION_DISPATCH_ENABLED', 'true')
  vi.stubEnv('FCM_PRIVATE_KEY', '')
  expect((await scheduledNotificationDispatchResponse(enabledRequest)).status).toBe(503)
  expect(production.database).not.toHaveBeenCalled()
  expect(production.workflow).not.toHaveBeenCalled()
  expect(production.env).not.toHaveBeenCalled()
})
