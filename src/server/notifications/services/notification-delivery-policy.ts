/** Bounds shared by durable outbox claims and retry scheduling. */
export const NOTIFICATION_LEASE_MS = 2 * 60_000
export const NOTIFICATION_MAX_ATTEMPTS = 8
export const NOTIFICATION_MAX_AGE_MS = 24 * 60 * 60_000
export const NOTIFICATION_MAX_RETRY_MS = 60 * 60_000

export function validNotificationClaimLimit(limit: number) {
  return Number.isInteger(limit) && limit >= 1 && limit <= 100
}

export function notificationIntentExpired(createdAt: Date, attempts: number, now: Date) {
  return (
    attempts >= NOTIFICATION_MAX_ATTEMPTS ||
    now.getTime() >= createdAt.getTime() + NOTIFICATION_MAX_AGE_MS
  )
}

/** Positive jitter avoids synchronized retries while retaining a one-minute minimum. */
export function notificationRetryDelayMs(attempts: number, random = Math.random) {
  const base = 60_000 * 2 ** Math.min(Math.max(attempts - 1, 0), 6)
  const sample = random()
  const jitter = Number.isFinite(sample) ? Math.min(Math.max(sample, 0), 1) : 0
  return Math.min(NOTIFICATION_MAX_RETRY_MS, Math.round(base * (1 + 0.2 * jitter)))
}

export function notificationRetryAt(
  createdAt: Date,
  attempts: number,
  now: Date,
  retryAfterMs = 0,
  random = Math.random
) {
  const providerDelay = Number.isFinite(retryAfterMs) ? Math.max(retryAfterMs, 0) : 0
  return new Date(
    Math.min(
      createdAt.getTime() + NOTIFICATION_MAX_AGE_MS,
      now.getTime() + Math.max(notificationRetryDelayMs(attempts, random), providerDelay)
    )
  )
}

/** Persist failure codes, never provider response bodies or device credentials. */
export function sanitizeNotificationFailure(reason: string) {
  return /^[a-z][a-z0-9_]{0,63}$/.test(reason) ? reason : 'delivery_failed'
}
