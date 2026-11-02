import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { serverOperationError } from '@/lib/domain-errors'
import { BlueprintNativeCreationTransaction } from './blueprint-native-creation-transaction'

export const BlueprintNativeCreationTransactionLive = Layer.effect(
  BlueprintNativeCreationTransaction,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      withTransaction: <A, E extends import('@/lib/domain-errors').DomainError, R>(
        program: Effect.Effect<A, E, R>
      ) =>
        pg.withTransaction(program).pipe(
          Effect.provideService(PgClient, pg),
          Effect.mapError((cause) =>
            serverOperationError(cause, {
              category: 'system',
              code: 'BLUEPRINT_NATIVE_CREATION_FAILED',
              userMessageKey: 'serverErrors.SYSTEM',
            })
          )
        ),
    }
  })
)
