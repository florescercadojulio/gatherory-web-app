import { readFileSync } from 'node:fs'
import * as PgClient from '@effect/sql-pg/PgClient'
import { Effect, Layer, Redacted } from 'effect'
import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { WaitlistRepo } from '@/server/waitlist/repos/waitlist.repo'
import { WaitlistRepoLive } from '@/server/waitlist/repos/waitlist.repo.live'
import { signupToWaitlist } from '@/server/waitlist/services/waitlist.service'
import { waitlistConfig } from '@/server/waitlist/waitlist.config'
import type { WaitlistSignupInput } from '@/server/waitlist/contracts/waitlist.contracts'

const enabled = process.env.RUN_WAITLIST_DB_TESTS === '1'
describe.skipIf(!enabled)('waitlist disposable PostgreSQL integration', () => {
  let pool: Pool
  let layer: Layer.Layer<WaitlistRepo, unknown>
  const input: WaitlistSignupInput = {
    email: 'fixture@example.com',
    locale: 'es',
    source: 'landing_home',
    consent: true,
    website: '',
    campaign: 'original',
  }
  const run = <A, E>(effect: Effect.Effect<A, E, WaitlistRepo>) =>
    Effect.runPromise(effect.pipe(Effect.provide(layer)))
  beforeAll(async () => {
    // Deliberately never use DATABASE_URL, which may point at real development data.
    const url = new URL(process.env.WAITLIST_TEST_DATABASE_URL ?? '')
    expect(['localhost', '127.0.0.1']).toContain(url.hostname)
    expect(url.port).toBe('55437')
    expect(url.pathname).toBe('/waitlist_test')
    pool = new Pool({ connectionString: url.toString() })
    expect((await pool.query('select current_database() as name')).rows[0].name).toBe(
      'waitlist_test'
    )
    if (!(await pool.query("select to_regclass('public.waitlist_signup') as name")).rows[0].name) {
      await pool.query(
        readFileSync('drizzle/20261023172442_friendly_leopardon/migration.sql', 'utf8')
      )
    }
    layer = WaitlistRepoLive.pipe(
      Layer.provide(PgClient.layer({ url: Redacted.make(url.toString()), maxConnections: 5 }))
    )
  })
  beforeEach(async () => {
    await pool.query('delete from waitlist_signup; delete from waitlist_rate_bucket')
  })
  afterAll(async () => {
    await pool?.end()
  })

  test('concurrent retries create one opt-in and preserve first touch, consent, and opt-out', async () => {
    await run(
      Effect.gen(function* () {
        const repo = yield* WaitlistRepo
        yield* Effect.all(
          Array.from({ length: 12 }, () => repo.signup(input)),
          { concurrency: 5 }
        )
        const first = yield* repo.list({ status: 'all', page: 1 })
        expect(first.entries).toHaveLength(1)
        expect(first.entries[0]).toMatchObject({
          email: input.email,
          locale: 'es',
          campaign: 'original',
          consentVersion: 'launch-updates-v1',
        })
        expect(first.entries[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
        yield* repo.unsubscribe(first.entries[0].id)
        yield* repo.signup({ ...input, locale: 'en', campaign: 'changed' })
        const optedOut = yield* repo.list({ status: 'unsubscribed', page: 1 })
        expect(optedOut.entries).toHaveLength(1)
        expect(optedOut.entries[0].campaign).toBe('original')
        expect(optedOut.entries[0].unsubscribedAt).toBeTruthy()
        expect(optedOut.totals).toEqual({ all: 1, active: 0, unsubscribed: 1, lastSevenDays: 1 })
        expect((yield* repo.list({ status: 'active', page: 1 })).entries).toHaveLength(0)
      })
    )
  })

  test('rate increments are atomic across concurrent requests and expired counters are pruned', async () => {
    await pool.query(
      "insert into waitlist_rate_bucket (key, expires_at) values ('expired-fixture', now() - interval '1 minute')"
    )
    await run(
      Effect.gen(function* () {
        const repo = yield* WaitlistRepo
        const results = yield* Effect.all(
          Array.from({ length: 30 }, () =>
            repo.consumeRate('fixture-bucket', 10, new Date(Date.now() + 600_000))
          ),
          { concurrency: 10 }
        )
        expect(results.filter(Boolean)).toHaveLength(10)
      })
    )
    expect((await pool.query('select key, attempts from waitlist_rate_bucket')).rows).toEqual([
      { key: 'fixture-bucket', attempts: 10 },
    ])
  })

  test('pagination is bounded and deterministic when rows have the same timestamp', async () => {
    await pool.query(`insert into waitlist_signup (email, locale, source, consent_version, created_at)
      select 'person-' || n || '@example.com', 'en', 'landing_iphone', 'launch-updates-v1', now()
      from generate_series(1, 62) as n`)
    await run(
      Effect.gen(function* () {
        const repo = yield* WaitlistRepo
        const first = yield* repo.list({ status: 'all', page: 1 })
        const second = yield* repo.list({ status: 'all', page: 2 })
        expect(first.entries).toHaveLength(50)
        expect(first.hasNextPage).toBe(true)
        expect(second.entries).toHaveLength(12)
        expect(second.hasNextPage).toBe(false)
        expect(new Set([...first.entries, ...second.entries].map((e) => e.id)).size).toBe(62)
        expect(first.totals.all).toBe(62)
      })
    )
  })

  test('service rate protection persists between separate request runtimes', async () => {
    const config = waitlistConfig({
      BETTER_AUTH_SECRET: 'disposable-fixture-secret-at-least-32-characters',
    })
    for (let i = 0; i < 3; i++)
      expect(await run(signupToWaitlist(input, config))).toEqual({ accepted: true })
    const result = await Effect.runPromise(
      Effect.result(signupToWaitlist(input, config).pipe(Effect.provide(layer)))
    )
    expect(result._tag).toBe('Failure')
    expect(
      (await pool.query('select count(*)::int as count from waitlist_signup')).rows[0].count
    ).toBe(1)
  })
})
