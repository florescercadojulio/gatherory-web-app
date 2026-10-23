export type WaitlistConfig = {
  allowedOrigins: ReadonlySet<string>
  adminEmails: ReadonlySet<string>
  rateSecret: string
  trustedVercelProxy: boolean
}

/** Read on each request, server-side only; no automatic staff or workspace grants. */
export function waitlistConfig(env: NodeJS.ProcessEnv = process.env): WaitlistConfig {
  const origins = new Set(['https://gatherory.com', 'https://www.gatherory.com'])
  for (const value of [env.BETTER_AUTH_URL, ...(env.WAITLIST_ALLOWED_ORIGINS ?? '').split(',')]) {
    if (!value?.trim()) continue
    try {
      const url = new URL(value.trim())
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      if (
        url.protocol === 'https:' ||
        (env.NODE_ENV !== 'production' && local && url.protocol === 'http:')
      ) {
        origins.add(url.origin)
      }
    } catch {
      /* Invalid configuration cannot broaden access. */
    }
  }
  if (env.NODE_ENV !== 'production') {
    origins.add('http://localhost:4321')
    origins.add('http://localhost:3003')
  }
  return {
    allowedOrigins: origins,
    adminEmails: new Set(
      (env.WAITLIST_ADMIN_EMAILS ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    ),
    rateSecret: env.WAITLIST_RATE_SECRET?.trim() || env.BETTER_AUTH_SECRET?.trim() || '',
    trustedVercelProxy: env.VERCEL === '1',
  }
}
