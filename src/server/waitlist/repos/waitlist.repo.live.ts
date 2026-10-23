import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { PersistenceError } from '@/lib/domain-errors'
import { WAITLIST_CONSENT_VERSION, type WaitlistEntry } from '../contracts/waitlist.contracts'
import { WaitlistRepo } from './waitlist.repo'

// Driver errors may include submitted values; do not attach raw SQL failures to logs.
const safeFailure = () =>
  new PersistenceError({
    category: 'system',
    code: 'WAITLIST_STORAGE_FAILED',
    userMessageKey: 'serverErrors.WAITLIST_UNAVAILABLE',
  })

export const WaitlistRepoLive = Layer.effect(
  WaitlistRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      consumeRate: (key, maximum, expiresAt) =>
        Effect.gen(function* () {
          yield* pg`delete from waitlist_rate_bucket where expires_at <= now()`
          const rows = yield* pg<{ key: string }>`
        insert into waitlist_rate_bucket (key, attempts, expires_at) values (${key}, 1, ${expiresAt})
        on conflict (key) do update set attempts = waitlist_rate_bucket.attempts + 1
        where waitlist_rate_bucket.attempts < ${maximum}
        returning key`
          return rows.length === 1
        }).pipe(Effect.mapError(safeFailure)),
      // First-touch attribution/consent stays intact. Anonymous retries cannot revive opt-outs.
      signup: (input) =>
        pg`
      insert into waitlist_signup (email, locale, source, campaign, consent_version)
      values (${input.email}, ${input.locale}, ${input.source}, ${input.campaign ?? null}, ${WAITLIST_CONSENT_VERSION})
      on conflict (email) do nothing`.pipe(Effect.asVoid, Effect.mapError(safeFailure)),
      list: (input) =>
        Effect.gen(function* () {
          // One repeatable snapshot keeps dashboard totals and the page consistent.
          return yield* pg.withTransaction(
            Effect.gen(function* () {
              yield* pg`set transaction isolation level repeatable read, read only`
              const [totals] = yield* pg<{
                all: number
                active: number
                unsubscribed: number
                lastSevenDays: number
              }>`
          select count(*)::int as "all",
          count(*) filter (where unsubscribed_at is null)::int as active,
          count(*) filter (where unsubscribed_at is not null)::int as unsubscribed,
          count(*) filter (where created_at >= now() - interval '7 days')::int as "lastSevenDays"
          from waitlist_signup`
              const rows = yield* pg<WaitlistEntry>`
          select id, email, locale, source, campaign, consent_version as "consentVersion",
          to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
          to_char(unsubscribed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "unsubscribedAt"
          from waitlist_signup
          where (${input.status} = 'all' or (${input.status} = 'active' and unsubscribed_at is null)
            or (${input.status} = 'unsubscribed' and unsubscribed_at is not null))
          order by created_at desc, id desc limit 51 offset ${(input.page - 1) * 50}`
              return { entries: [...rows].slice(0, 50), hasNextPage: rows.length > 50, totals }
            })
          )
        }).pipe(Effect.mapError(safeFailure)),
      unsubscribe: (id) =>
        pg`
      update waitlist_signup set unsubscribed_at = coalesce(unsubscribed_at, now()) where id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(safeFailure)
        ),
    }
  })
)
