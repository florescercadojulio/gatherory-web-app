import { Context, type Effect } from 'effect'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import type { SqlError } from 'effect/sql/SqlError'
import type { DomainError } from '@/lib/domain-errors'
import type { McpGrantLookup } from './authorization'

export type McpAuthorizationRepositoryFailure = DomainError | EffectDrizzleQueryError | SqlError

export type McpAuthorizationRepositoryShape = {
  findActiveSession: (
    sessionId: Parameters<McpGrantLookup['findActiveSession']>[0]
  ) => Effect.Effect<
    Awaited<ReturnType<McpGrantLookup['findActiveSession']>>,
    McpAuthorizationRepositoryFailure
  >
  findClient: (
    clientId: Parameters<McpGrantLookup['findClient']>[0]
  ) => Effect.Effect<
    Awaited<ReturnType<McpGrantLookup['findClient']>>,
    McpAuthorizationRepositoryFailure
  >
  findConsent: (
    userId: Parameters<McpGrantLookup['findConsent']>[0],
    clientId: Parameters<McpGrantLookup['findConsent']>[1]
  ) => Effect.Effect<
    Awaited<ReturnType<McpGrantLookup['findConsent']>>,
    McpAuthorizationRepositoryFailure
  >
}

export class McpAuthorizationRepository extends Context.Service<
  McpAuthorizationRepository,
  McpAuthorizationRepositoryShape
>()('McpAuthorizationRepository') {}
