import { PgClient } from '@effect/sql-pg/PgClient'
import { expect, it } from '@effect/vitest'
import { Effect, Exit, Layer } from 'effect'
import { BlueprintNativeCreationTransaction } from '@/server/blueprints/workflows/blueprint-native-creation-transaction'
import { BlueprintNativeCreationTransactionLive } from '@/server/blueprints/workflows/blueprint-native-creation-transaction.live'
import { ConflictError } from '@/lib/domain-errors'

it.effect('uses its captured PgClient as the ambient transaction client', () => {
  const pg = {
    withTransaction: (program: Effect.Effect<unknown, unknown, never>) =>
      program.pipe(Effect.provideService(PgClient, pg as never)),
  } as unknown as typeof PgClient.Service
  const layer = BlueprintNativeCreationTransactionLive.pipe(
    Layer.provide(Layer.succeed(PgClient, pg))
  )

  return Effect.gen(function* () {
    const transaction = yield* BlueprintNativeCreationTransaction
    const result = yield* transaction.withTransaction(
      Effect.gen(function* () {
        return yield* PgClient
      })
    )
    expect(result).toBe(pg)
  }).pipe(Effect.provide(layer))
})

it.effect('preserves domain failures from the transaction body for rollback', () => {
  const pg = {
    withTransaction: (program: Effect.Effect<unknown, unknown, never>) =>
      program.pipe(Effect.provideService(PgClient, pg as never)),
  } as unknown as typeof PgClient.Service
  const layer = BlueprintNativeCreationTransactionLive.pipe(
    Layer.provide(Layer.succeed(PgClient, pg))
  )
  const conflict = new ConflictError({
    category: 'conflict',
    code: 'BLUEPRINT_NATIVE_REVIEW_CHANGED',
    userMessageKey: 'serverErrors.CONFLICT',
  })

  return Effect.gen(function* () {
    const transaction = yield* BlueprintNativeCreationTransaction
    const exit = yield* Effect.exit(transaction.withTransaction(Effect.fail(conflict)))
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit))
      expect(exit.cause.reasons).toContainEqual(expect.objectContaining({ error: conflict }))
  }).pipe(Effect.provide(layer))
})
