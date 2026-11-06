const WINDOW_MS = 60_000
const MAX_REQUESTS = 30
const MAX_BUCKETS = 10_000
const buckets = new Map<string, { startedAt: number; count: number }>()

export function hasBrowserGuestSameOrigin(request: Request, expectedOrigin: string) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const canonicalOrigin = new URL(origin).origin
    return origin === canonicalOrigin && canonicalOrigin === new URL(expectedOrigin).origin
  } catch {
    return false
  }
}

export function consumeBrowserGuestRateLimit(
  request: Request,
  now = Date.now(),
  limits = { maxRequests: MAX_REQUESTS, windowMs: WINDOW_MS }
) {
  const forwarded =
    request.headers.get('cf-connecting-ip') ??
    // The hosting proxy must append its address to this chain; never trust the
    // first, caller-controlled entry supplied by the browser.
    request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
  const key = forwarded || 'unknown'
  const current = buckets.get(key)
  if (!current || now - current.startedAt >= limits.windowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      const first = buckets.keys().next().value
      if (first !== undefined) buckets.delete(first)
    }
    buckets.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (current.count >= limits.maxRequests) return false
  current.count += 1
  return true
}

/** Per-process guard only; multi-instance deployments still need shared storage. */
export function allowBrowserGuestPost(request: Request, expectedOrigin: string, now = Date.now()) {
  return (
    hasBrowserGuestSameOrigin(request, expectedOrigin) && consumeBrowserGuestRateLimit(request, now)
  )
}

export function resetBrowserGuestRateLimitForTests() {
  buckets.clear()
}
