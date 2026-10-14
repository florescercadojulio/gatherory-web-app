import { symmetricEncrypt } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { account } from '@/db/schema/auth.schema'
import { env } from '@/env'
import { isDomainError, PersistenceError, type DomainError } from '@/lib/domain-errors'
import { AppleTokenRepo } from './apple-token.repo'

function persistence<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, DomainError, R> {
  return effect.pipe(
    Effect.mapError((cause) =>
      isDomainError(cause)
        ? cause
        : new PersistenceError({
            category: 'system',
            code: 'APPLE_TOKEN_PERSISTENCE_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
            cause,
          })
    )
  )
}

export const AppleTokenRepoLive = Layer.effect(
  AppleTokenRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E>(effect: Effect.Effect<A, E, PgClient>): Effect.Effect<A, DomainError> =>
      persistence(effect.pipe(Effect.provideService(PgClient, pg)))

    return {
      findLinkedAccount: ({ userId, subject }) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const [linked] = yield* db
              .select({ id: account.id })
              .from(account)
              .where(
                and(
                  eq(account.userId, userId),
                  eq(account.providerId, 'apple'),
                  eq(account.accountId, subject)
                )
              )
              .limit(1)
            return linked?.id ?? null
          })
        ),
      saveTokens: ({ accountId, userId, accessToken, refreshToken, expiresIn }) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const encrypted = yield* Effect.tryPromise({
              try: () =>
                Promise.all([
                  symmetricEncrypt({ key: env.BETTER_AUTH_SECRET, data: accessToken }),
                  symmetricEncrypt({ key: env.BETTER_AUTH_SECRET, data: refreshToken }),
                ]),
              catch: (cause) =>
                new PersistenceError({
                  category: 'system',
                  code: 'APPLE_TOKEN_PERSISTENCE_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                  cause,
                }),
            })
            yield* db
              .update(account)
              .set({
                accessToken: encrypted[0],
                refreshToken: encrypted[1],
                accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
              })
              .where(and(eq(account.id, accountId), eq(account.userId, userId)))
          })
        ),
    }
  })
)
