import { and, eq } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { account } from '@/db/schema/auth.schema'
import { isDomainError, PersistenceError } from '@/lib/domain-errors'
import { AppleAccountDeletionRepo } from './apple-account-deletion.repo'

export const AppleAccountDeletionRepoLive = Layer.effect(
  AppleAccountDeletionRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      findAccounts: (userId: string) =>
        Effect.gen(function* () {
          const db = yield* DB
          return yield* db
            .select({
              idToken: account.idToken,
              refreshToken: account.refreshToken,
              accessToken: account.accessToken,
            })
            .from(account)
            .where(and(eq(account.userId, userId), eq(account.providerId, 'apple')))
        })
          .pipe(Effect.provideService(PgClient, pg))
          .pipe(
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
          ),
    }
  })
)
