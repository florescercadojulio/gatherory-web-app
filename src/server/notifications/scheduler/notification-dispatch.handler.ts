import { createHash, timingSafeEqual } from 'node:crypto'
import type {
  NotificationDispatchConfiguration,
  NotificationDispatchSummary,
} from './notification-dispatch.configuration'
import { notificationDispatchSummary } from './notification-dispatch.configuration'

const digest = (value: string) => createHash('sha256').update(value).digest()
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })

export function createNotificationDispatchHandler(dependencies: {
  configuration: NotificationDispatchConfiguration
  dispatch: (signal: AbortSignal) => Promise<NotificationDispatchSummary>
}) {
  return async (request: Request): Promise<Response> => {
    const { configuration } = dependencies
    const secret = configuration.cronSecret
    // Compare fixed-size digests. Cookies, sessions and URL parameters confer no authority.
    const authorized = timingSafeEqual(
      digest(request.headers.get('authorization') ?? ''),
      digest(`Bearer ${secret ?? ''}`)
    )
    if (!secret || secret.length < 32 || !authorized)
      return json({ ok: false, error: 'UNAUTHORIZED' }, 401)
    if (request.method !== 'GET') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
    if (!configuration.enabled) return json({ ok: true, data: { disabled: true } })
    if (!configuration.fcmConfigured)
      return json({ ok: false, error: 'NOTIFICATION_DISPATCH_UNAVAILABLE' }, 503)
    try {
      const summary = await dependencies.dispatch(request.signal)
      return json({ ok: true, data: notificationDispatchSummary(summary) })
    } catch {
      return json({ ok: false, error: 'NOTIFICATION_DISPATCH_FAILED' }, 503)
    }
  }
}
