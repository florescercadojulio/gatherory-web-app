import { expect, test, vi } from 'vitest'
import { createNotificationDispatchHandler } from '@/server/notifications/scheduler/notification-dispatch.handler'
import {
  NotificationCronSecretSchema,
  NotificationDispatchEnabledSchema,
  readNotificationDispatchConfiguration,
} from '@/server/notifications/scheduler/notification-dispatch.configuration'

const secret = 'notification-cron-secret-for-tests-only-123456'
const summary = { claimed: 2, delivered: 1, pending: 1, discarded: 0 }
const request = (authorization = `Bearer ${secret}`, method = 'GET') =>
  new Request(
    'https://example.test/api/internal/notifications/dispatch?limit=100&recipientId=other',
    { method, headers: { authorization, cookie: 'session=owner' } }
  )

test.each([undefined, '', 'false', 'true', 'yes', '0'])(
  'dispatch enablement parses %s explicitly',
  (value) => {
    const config = readNotificationDispatchConfiguration({ NOTIFICATION_DISPATCH_ENABLED: value })
    expect(config.enabled).toBe(value === 'true')
  }
)

test('application env schema accepts only explicit boolean strings and a sufficiently long cron secret', () => {
  expect(NotificationDispatchEnabledSchema.parse(undefined)).toBe(false)
  expect(NotificationDispatchEnabledSchema.parse('false')).toBe(false)
  expect(NotificationDispatchEnabledSchema.parse('true')).toBe(true)
  expect(NotificationDispatchEnabledSchema.safeParse('yes').success).toBe(false)
  expect(NotificationCronSecretSchema.safeParse('short').success).toBe(false)
  expect(NotificationCronSecretSchema.safeParse(secret).success).toBe(true)
})

test.each([undefined, '', 'short'])(
  'missing or short configured cron secret fails closed (%s)',
  async (cronSecret) => {
    const dispatch = vi.fn().mockResolvedValue(summary)
    const response = await createNotificationDispatchHandler({
      configuration: { enabled: true, cronSecret, fcmConfigured: true },
      dispatch,
    })(request(`Bearer ${cronSecret ?? ''}`))
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(dispatch).not.toHaveBeenCalled()
  }
)

test.each(['', 'Bearer wrong', `Basic ${secret}`, `bearer ${secret}`])(
  'cookies or alternate authorization cannot dispatch (%s)',
  async (authorization) => {
    const dispatch = vi.fn().mockResolvedValue(summary)
    const response = await createNotificationDispatchHandler({
      configuration: { enabled: true, cronSecret: secret, fcmConfigured: true },
      dispatch,
    })(request(authorization))
    expect(response.status).toBe(401)
    expect(dispatch).not.toHaveBeenCalled()
  }
)

test('authorized disabled dispatch is a no-op and missing FCM never claims work', async () => {
  const dispatch = vi.fn().mockResolvedValue(summary)
  const disabled = await createNotificationDispatchHandler({
    configuration: { enabled: false, cronSecret: secret, fcmConfigured: false },
    dispatch,
  })(request())
  expect(await disabled.json()).toEqual({ ok: true, data: { disabled: true } })
  const unavailable = await createNotificationDispatchHandler({
    configuration: { enabled: true, cronSecret: secret, fcmConfigured: false },
    dispatch,
  })(request())
  expect(unavailable.status).toBe(503)
  expect(unavailable.headers.get('cache-control')).toBe('private, no-store')
  expect(dispatch).not.toHaveBeenCalled()
  expect(
    readNotificationDispatchConfiguration({
      FCM_PROJECT_ID: 'project',
      FCM_CLIENT_EMAIL: 'email@example.test',
      FCM_PRIVATE_KEY: ' ',
    }).fcmConfigured
  ).toBe(false)
})

test('dispatch ignores query and payload controls, passes cancellation, and returns aggregate counts only', async () => {
  const dispatch = vi.fn().mockResolvedValue({
    ...summary,
    secret,
    eventId: 'private-event',
    installationId: 'private-installation',
  })
  const incoming = request()
  const response = await createNotificationDispatchHandler({
    configuration: { enabled: true, cronSecret: secret, fcmConfigured: true },
    dispatch,
  })(incoming)
  expect(dispatch).toHaveBeenCalledExactlyOnceWith(incoming.signal)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(await response.json()).toEqual({ ok: true, data: summary })
  const method = await createNotificationDispatchHandler({
    configuration: { enabled: true, cronSecret: secret, fcmConfigured: true },
    dispatch,
  })(request(`Bearer ${secret}`, 'POST'))
  expect(method.status).toBe(405)
  expect(method.headers.get('cache-control')).toBe('private, no-store')
  expect(dispatch).toHaveBeenCalledTimes(1)
})

test('dispatch failures are sanitized without credentials or provider details', async () => {
  const dispatch = vi
    .fn()
    .mockRejectedValue(new Error(`${secret}: token=private-installation, event=private-event`))
  const response = await createNotificationDispatchHandler({
    configuration: { enabled: true, cronSecret: secret, fcmConfigured: true },
    dispatch,
  })(request())
  expect(response.status).toBe(503)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(await response.json()).toEqual({ ok: false, error: 'NOTIFICATION_DISPATCH_FAILED' })
})
