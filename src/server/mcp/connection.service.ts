import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type { McpConnection, McpConnectionReduction } from './connection.contract'
import type { McpConnectionRepositoryFailure } from './connection.repo.contract'

export type McpConnectionServiceShape = {
  list: (input: {
    userId: string
    resourceURL: string
  }) => Effect.Effect<McpConnection[], McpConnectionRepositoryFailure>
  reduceScopes: (input: {
    userId: string
    clientId: string
    resourceURL: string
    requestedScopes: string[]
  }) => Effect.Effect<
    Extract<McpConnectionReduction, { kind: 'unchanged' | 'updated' }>,
    McpConnectionRepositoryFailure | DomainError
  >
}

export class McpConnectionService extends Context.Service<
  McpConnectionService,
  McpConnectionServiceShape
>()('McpConnectionService') {}
