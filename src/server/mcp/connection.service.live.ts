import { ConflictError, EntityNotFoundError } from '@/server/effect-utils'
import { Effect, Layer } from 'effect'
import { McpConnectionRepository } from './connection.repo.contract'
import { McpConnectionService, type McpConnectionServiceShape } from './connection.service'

export const McpConnectionServiceLive = Layer.effect(
  McpConnectionService,
  Effect.gen(function* () {
    const repository = yield* McpConnectionRepository
    return {
      list: (input) => repository.list(input),
      reduceScopes: (input) =>
        Effect.gen(function* () {
          const result = yield* repository.reduceScopes(input)
          if (result.kind === 'missing')
            return yield* Effect.fail(
              new EntityNotFoundError({
                category: 'not_found',
                code: 'connection_not_found',
                userMessageKey: 'serverErrors.NOT_FOUND',
              })
            )
          if (result.kind === 'expansion')
            return yield* Effect.fail(
              new ConflictError({
                category: 'conflict',
                code: 'fresh_consent_required',
                userMessageKey: 'serverErrors.CONFLICT',
              })
            )
          return result
        }),
    } satisfies McpConnectionServiceShape
  })
)
