import { Context, type Effect } from 'effect'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import type { SqlError } from 'effect/sql/SqlError'
import type { DomainError } from '@/lib/domain-errors'
import type { McpConnection, McpConnectionReduction } from './connection.contract'

export type McpConnectionRepositoryFailure = DomainError | EffectDrizzleQueryError | SqlError

export type McpConnectionRepositoryShape = {
  list: (input: {
    userId: string
    resourceURL: string
  }) => Effect.Effect<McpConnection[], McpConnectionRepositoryFailure>
  reduceScopes: (input: {
    userId: string
    clientId: string
    resourceURL: string
    requestedScopes: string[]
  }) => Effect.Effect<McpConnectionReduction, McpConnectionRepositoryFailure>
}

export class McpConnectionRepository extends Context.Service<
  McpConnectionRepository,
  McpConnectionRepositoryShape
>()('McpConnectionRepository') {}
