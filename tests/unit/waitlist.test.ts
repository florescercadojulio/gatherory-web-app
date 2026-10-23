import { Effect, Layer } from 'effect'
import { beforeEach, expect, test, vi } from 'vitest'
import { PersistenceError, type DomainError } from '@/lib/domain-errors'
import { createWaitlistHandlers } from '@/server/waitlist/handlers/waitlist-api.handler'
import { signupToWaitlist } from '@/server/waitlist/services/waitlist.service'
import { listWaitlist, unsubscribeWaitlist } from '@/server/waitlist/workflows/waitlist.workflow'
import { WaitlistRepo } from '@/server/waitlist/repos/waitlist.repo'
import { waitlistConfig } from '@/server/waitlist/waitlist.config'
import { waitlistCsv } from '@/server/waitlist/contracts/waitlist-csv'
import { isWaitlistTrackerPath } from '@/lib/waitlist-privacy'
import type {
  WaitlistActor,
  WaitlistEntry,
  WaitlistPage,
  WaitlistSignupInput,
} from '@/server/waitlist/contracts/waitlist.contracts'

const good = {
  email: ' Visitor@Example.COM ',
  locale: 'es',
  source: 'landing_home',
  consent: true,
  website: '',
  campaign: 'first',
}
const uuid = '12345678-1234-4234-8234-123456789abc'
let actor: WaitlistActor
let entries: WaitlistEntry[]
let counters: Map<string, number>
let now: Date
let config: ReturnType<typeof waitlistConfig>
let signup = vi.fn<(input: WaitlistSignupInput) => Effect.Effect<void, DomainError>>()
let list = vi.fn<() => Effect.Effect<WaitlistPage, DomainError>>()
let unsubscribe = vi.fn<(id: string) => Effect.Effect<void, DomainError>>()
let handlers: ReturnType<typeof createWaitlistHandlers>

function request(value: unknown = good, headers: Record<string, string> = {}) {
  return new Request('https://app.gatherory.test/api/waitlist', {
    method: 'POST',
    headers: { Origin: 'https://gatherory.com', 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(value),
  })
}
function admin(
  method = 'GET',
  input: unknown = { id: uuid },
  origin = 'https://app.gatherory.test',
  query = ''
) {
  return new Request(`https://app.gatherory.test/api/admin/waitlist${query}`, {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    ...(method === 'GET' ? {} : { body: JSON.stringify(input) }),
  })
}
beforeEach(() => {
  actor = { id: 'owner', email: 'owner@example.com', emailVerified: true }
  entries = []
  counters = new Map()
  now = new Date('2026-10-23T12:00:00Z')
  config = waitlistConfig({
    NODE_ENV: 'production',
    BETTER_AUTH_URL: 'https://app.gatherory.test',
    WAITLIST_ADMIN_EMAILS: 'owner@example.com',
    BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
  })
  signup = vi.fn<(input: WaitlistSignupInput) => Effect.Effect<void, DomainError>>((input) =>
    Effect.sync(() => {
      if (!entries.some((e) => e.email === input.email))
        entries.push({
          id: uuid,
          email: input.email,
          locale: input.locale,
          source: input.source,
          campaign: input.campaign ?? null,
          consentVersion: 'launch-updates-v1',
          createdAt: now.toISOString(),
          unsubscribedAt: null,
        })
    })
  )
  list = vi.fn(() =>
    Effect.succeed({
      entries,
      hasNextPage: false,
      totals: {
        all: entries.length,
        active: entries.filter((e) => !e.unsubscribedAt).length,
        unsubscribed: entries.filter((e) => e.unsubscribedAt).length,
        lastSevenDays: entries.length,
      },
    })
  )
  unsubscribe = vi.fn((id: string) =>
    Effect.sync(() => {
      const entry = entries.find((e) => e.id === id)
      if (entry) entry.unsubscribedAt ??= now.toISOString()
    })
  )
  const repo = Layer.succeed(WaitlistRepo, {
    consumeRate: (key, maximum) =>
      Effect.sync(() => {
        const count = (counters.get(key) ?? 0) + 1
        counters.set(key, count)
        return count <= maximum
      }),
    signup,
    list,
    unsubscribe,
  })
  handlers = createWaitlistHandlers({
    config: () => config,
    actor: () => Effect.succeed(actor),
    signup: (input, cfg, ip) => signupToWaitlist(input, cfg, ip, now).pipe(Effect.provide(repo)),
    list: (...args) => listWaitlist(...args).pipe(Effect.provide(repo)),
    unsubscribe: (...args) => unsubscribeWaitlist(...args).pipe(Effect.provide(repo)),
  })
})

test('normalizes an opt-in, records first-touch data, and deduplicates without revealing membership', async () => {
  const first = await handlers.signup(request())
  expect(first.status).toBe(200)
  expect(await first.json()).toEqual({ ok: true, data: { accepted: true } })
  const duplicate = await handlers.signup(request({ ...good, campaign: 'different', locale: 'en' }))
  expect(await duplicate.json()).toEqual({ ok: true, data: { accepted: true } })
  expect(entries).toHaveLength(1)
  expect(entries[0]).toMatchObject({
    email: 'visitor@example.com',
    locale: 'es',
    campaign: 'first',
    consentVersion: 'launch-updates-v1',
  })
  expect(first.headers.get('cache-control')).toContain('no-store')
  expect(first.headers.get('access-control-allow-origin')).toBe('https://gatherory.com')
  expect(first.headers.has('access-control-allow-credentials')).toBe(false)
})

test.each([
  { ...good, email: 'invalid' },
  { ...good, consent: false },
  { ...good, consent: 'true' },
  { ...good, locale: 'fr' },
  { ...good, source: 'arbitrary-path' },
  { ...good, campaign: 'person@example.com' },
  { ...good, role: 'admin' },
  null,
])('rejects invalid or caller-invented fields without storage: %j', async (value) => {
  expect((await handlers.signup(request(value))).status).toBe(400)
  expect(signup).not.toHaveBeenCalled()
})

test.each([
  'https://attacker.test',
  'https://gatherory.com.attacker.test',
  'null',
  'http://localhost:4321',
])('rejects untrusted production origin %s without CORS or storage', async (origin) => {
  const response = await handlers.signup(request(good, { Origin: origin }))
  expect(response.status).toBe(403)
  expect(response.headers.has('access-control-allow-origin')).toBe(false)
  expect(signup).not.toHaveBeenCalled()
})

test('preflight needs an allowlisted origin, POST, and allowed headers; never writes', async () => {
  const preflight = (method: string, headers = 'content-type,accept-language') =>
    new Request('https://app.gatherory.test/api/waitlist', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://gatherory.com',
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': headers,
      },
    })
  expect((await handlers.signup(preflight('POST'))).status).toBe(200)
  expect((await handlers.signup(preflight('DELETE'))).status).toBe(403)
  expect((await handlers.signup(preflight('POST', 'authorization'))).status).toBe(403)
  expect(signup).not.toHaveBeenCalled()
})

test('bounds JSON bodies even without Content-Length and rejects unsupported/malformed bodies', async () => {
  expect((await handlers.signup(request(good, { 'Content-Type': 'text/plain' }))).status).toBe(415)
  expect((await handlers.signup(request({ ...good, email: 'x'.repeat(5000) }))).status).toBe(413)
  const malformed = new Request('https://app.gatherory.test/api/waitlist', {
    method: 'POST',
    headers: { Origin: 'https://gatherory.com', 'Content-Type': 'application/json' },
    body: '{',
  })
  expect((await handlers.signup(malformed)).status).toBe(400)
  expect(signup).not.toHaveBeenCalled()
})

test('honeypot gets a non-enumerating response without consuming counters or storing personal data', async () => {
  expect(await (await handlers.signup(request({ ...good, website: 'spam' }))).json()).toEqual({
    ok: true,
    data: { accepted: true },
  })
  expect(signup).not.toHaveBeenCalled()
  expect(counters.size).toBe(0)
})

test('rate limits survive repeated handlers and store only opaque short-lived bucket keys', async () => {
  for (let i = 0; i < 3; i++) expect((await handlers.signup(request())).status).toBe(200)
  const limited = await handlers.signup(request())
  expect(limited.status).toBe(429)
  expect(limited.headers.get('retry-after')).toBe('600')
  for (const key of counters.keys()) expect(key).toMatch(/^[0-9a-f]{64}$/)
  now = new Date(now.getTime() + 600_000)
  expect((await handlers.signup(request())).status).toBe(200)
})

test('ignores caller-supplied forwarded IPs except the validated Vercel proxy header on Vercel', async () => {
  await handlers.signup(
    request(good, { 'x-forwarded-for': '192.0.2.1', 'x-vercel-forwarded-for': '192.0.2.2' })
  )
  expect(counters.size).toBe(2)
  config = { ...config, trustedVercelProxy: true }
  await handlers.signup(request(good, { 'x-vercel-forwarded-for': '192.0.2.2' }))
  expect(counters.size).toBe(3)
})

test('missing rate protection fails closed and persistence failures expose no submitted email or SQL', async () => {
  config = { ...config, rateSecret: '' }
  expect((await handlers.signup(request())).status).toBe(503)
  expect(signup).not.toHaveBeenCalled()
  config = { ...config, rateSecret: 'long-enough-fixture-secret-with-32-characters' }
  signup.mockImplementation(() =>
    Effect.fail(
      new PersistenceError({
        category: 'system',
        code: 'WAITLIST_STORAGE_FAILED',
        userMessageKey: 'serverErrors.WAITLIST_UNAVAILABLE',
      })
    )
  )
  const response = await handlers.signup(request())
  expect(response.status).toBe(500)
  const text = await response.text()
  expect(text).not.toContain(good.email)
  expect(text).not.toContain('waitlist_signup')
  expect(entries).toHaveLength(0)
})

test.each([
  null,
  { id: 'owner', email: 'owner@example.com', emailVerified: false },
  { id: 'moderator', email: 'moderator@example.com', emailVerified: true },
])(
  'protects direct private API reads and mutations independently of the page: %j',
  async (value) => {
    actor = value
    expect((await handlers.admin(admin())).status).toBe(value ? 403 : 401)
    expect((await handlers.admin(admin('PATCH'))).status).toBe(value ? 403 : 401)
    expect(list).not.toHaveBeenCalled()
    expect(unsubscribe).not.toHaveBeenCalled()
  }
)

test('tracker auth is rechecked on every request and an empty allowlist denies all', async () => {
  await handlers.signup(request())
  const allowed = await handlers.admin(admin())
  expect(allowed.status).toBe(200)
  expect((await allowed.json()).data.entries[0].email).toBe('visitor@example.com')
  expect(allowed.headers.get('cache-control')).toContain('no-store')
  expect(allowed.headers.has('access-control-allow-origin')).toBe(false)
  config = { ...config, adminEmails: new Set() }
  expect((await handlers.admin(admin())).status).toBe(403)
  actor = null
  expect((await handlers.admin(admin())).status).toBe(401)
  expect(list).toHaveBeenCalledTimes(1)
})

test('private pagination validates input, and cross-origin mutations cannot opt someone out', async () => {
  expect((await handlers.admin(admin('GET', null, '', '?page=-1'))).status).toBe(400)
  expect((await handlers.admin(admin('GET', null, '', '?status=other'))).status).toBe(400)
  expect((await handlers.admin(admin('PATCH', { id: uuid }, 'https://gatherory.com'))).status).toBe(
    403
  )
  expect((await handlers.admin(admin('PATCH', { id: 'not-uuid' }))).status).toBe(400)
  expect(unsubscribe).not.toHaveBeenCalled()
})

test('admin opt-out is idempotent and anonymous signup cannot reactivate it', async () => {
  await handlers.signup(request())
  expect((await handlers.admin(admin('PATCH'))).status).toBe(200)
  const optedOutAt = entries[0].unsubscribedAt
  expect(optedOutAt).toBeTruthy()
  expect((await handlers.admin(admin('PATCH'))).status).toBe(200)
  await handlers.signup(request())
  expect(entries).toHaveLength(1)
  expect(entries[0].unsubscribedAt).toBe(optedOutAt)
})

test('CSV neutralizes formulas and quotes values without returning hidden rows', () => {
  const entry: WaitlistEntry = {
    id: uuid,
    email: '=danger@example.com',
    locale: 'en',
    source: 'landing_home',
    campaign: '-SUM(1,2)',
    consentVersion: 'launch-updates-v1',
    createdAt: now.toISOString(),
    unsubscribedAt: null,
  }
  const csv = waitlistCsv([entry])
  expect(csv).toContain('"\'=danger@example.com"')
  expect(csv).toContain('"\'-SUM(1,2)"')
  expect(csv.split('\r\n')).toHaveLength(3)
})

test('private tracker paths are excluded from product analytics', () => {
  expect(isWaitlistTrackerPath('/admin/waitlist')).toBe(true)
  expect(isWaitlistTrackerPath('/admin/waitlist/')).toBe(true)
  expect(isWaitlistTrackerPath('/admin/waitlist/export')).toBe(true)
  expect(isWaitlistTrackerPath('/admin/waitlist-other')).toBe(false)
  expect(isWaitlistTrackerPath('/workspaces')).toBe(false)
})
