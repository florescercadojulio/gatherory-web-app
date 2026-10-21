import { importPKCS8, SignJWT } from 'jose'
import { Effect } from 'effect'
import { NotificationConnectorFailure, type NotificationConnectorShape } from './notification.con'

const oauthUrl = 'https://oauth2.googleapis.com/token'
const scope = 'https://www.googleapis.com/auth/firebase.messaging'

function failure(
  kind: NotificationConnectorFailure['kind'],
  message: string,
  retryAfterMs?: number
): NotificationConnectorFailure {
  return new NotificationConnectorFailure(kind, message, retryAfterMs)
}

export type FcmConfiguration = {
  projectId: string
  clientEmail: string
  privateKey: string
}

export function createFcmNotificationConnector(
  configuration: FcmConfiguration | undefined,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now
) {
  let cachedAccessToken: { value: string; expiresAt: number } | undefined
  const retryAfter = (response: Response): number | undefined => {
    if (response.status !== 429 && response.status !== 503) return undefined
    const value = response.headers.get('retry-after')
    if (!value) return response.status === 429 ? 60_000 : undefined
    const seconds = /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : undefined
    const delay = seconds === undefined ? Date.parse(value) - now() : seconds * 1000
    return Number.isFinite(delay) && delay >= 0 ? delay : undefined
  }
  const accessToken = async (signal: AbortSignal) => {
    if (!configuration) throw failure('disabled', 'FCM is not configured.')
    if (cachedAccessToken && cachedAccessToken.expiresAt > now() + 60_000)
      return cachedAccessToken.value
    const key = await importPKCS8(configuration.privateKey.replaceAll('\\n', '\n'), 'RS256').catch(
      () => {
        throw failure('credentials', 'FCM service private key is invalid.')
      }
    )
    signal.throwIfAborted()
    const assertion = await new SignJWT({ scope })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(configuration.clientEmail)
      .setSubject(configuration.clientEmail)
      .setAudience(oauthUrl)
      .setIssuedAt(Math.floor(now() / 1000))
      .setExpirationTime(Math.floor(now() / 1000) + 3600)
      .sign(key)
      .catch(() => {
        throw failure('credentials', 'FCM service credentials are invalid.')
      })
    signal.throwIfAborted()
    const response = await fetcher(oauthUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
      redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    })
    if (!response.ok) {
      throw failure(
        response.status === 429 || response.status >= 500 ? 'transient' : 'credentials',
        'FCM OAuth token request failed.',
        retryAfter(response)
      )
    }
    const body = (await response.json().catch(() => undefined)) as
      { access_token?: string } | undefined
    if (typeof body?.access_token !== 'string' || !body.access_token)
      throw failure('credentials', 'FCM OAuth token response was invalid.')
    cachedAccessToken = { value: body.access_token, expiresAt: now() + 3_000_000 }
    return body.access_token
  }

  return {
    isConfigured: Boolean(configuration),
    send: (input: Parameters<NotificationConnectorShape['send']>[0]) =>
      Effect.tryPromise({
        try: async (signal) => {
          if (!configuration) throw failure('disabled', 'FCM is not configured.')
          const token = await accessToken(signal)
          signal.throwIfAborted()
          const response = await fetcher(
            `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(configuration.projectId)}/messages:send`,
            {
              method: 'POST',
              headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
              body: JSON.stringify({
                message: {
                  token: input.token,
                  notification: { title: input.payload.title, body: input.payload.body },
                  data: {
                    type: input.payload.type,
                    eventId: input.payload.eventId,
                    entityId: input.payload.entityId,
                    recipientKind: input.payload.recipientKind,
                    recipientId: input.payload.recipientId,
                    ...(input.deliveryId ? { notificationId: input.deliveryId } : {}),
                  },
                  ...(input.deliveryId
                    ? {
                        apns: { headers: { 'apns-collapse-id': input.deliveryId } },
                        android: { collapse_key: input.deliveryId },
                      }
                    : {}),
                },
              }),
              redirect: 'error',
              signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
            }
          )
          if (response.ok) return
          if (response.status === 404 || response.status === 400) {
            const body = (await response.json().catch(() => ({}))) as {
              error?: { status?: string; details?: Array<{ errorCode?: string }> }
            } | null
            const details = Array.isArray(body?.error?.details) ? body.error.details : []
            const invalidToken = details.some((item) => item?.errorCode === 'UNREGISTERED')
            if (invalidToken) throw failure('invalid_registration', 'FCM registration is invalid.')
            if (
              body?.error?.status === 'SENDER_ID_MISMATCH' ||
              details.some((item) => item?.errorCode === 'SENDER_ID_MISMATCH')
            )
              throw failure('credentials', 'FCM sender configuration is invalid.')
            if (response.status === 400)
              throw failure('invalid_payload', 'FCM notification payload is invalid.')
            throw failure('credentials', 'FCM project configuration is invalid.')
          }
          if (response.status === 401 || response.status === 403) {
            cachedAccessToken = undefined
            throw failure('credentials', 'FCM rejected service credentials.')
          }
          throw failure(
            'transient',
            `FCM request failed with status ${response.status}.`,
            retryAfter(response)
          )
        },
        catch: (cause) =>
          cause instanceof NotificationConnectorFailure
            ? cause
            : failure('transient', 'FCM request failed.'),
      }),
  } satisfies NotificationConnectorShape
}
