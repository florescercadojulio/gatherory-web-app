import { Effect } from 'effect'
import type { McpGrantLookup } from './authorization'
import { createMcpClaimsAuthorizer } from './authorization'

export type McpAuthorizationWorkflows<R = never> = {
  findActiveSession: (
    sessionId: string
  ) => Effect.Effect<Awaited<ReturnType<McpGrantLookup['findActiveSession']>>, unknown, R>
  findClient: (
    clientId: string
  ) => Effect.Effect<Awaited<ReturnType<McpGrantLookup['findClient']>>, unknown, R>
  findConsent: (
    userId: string,
    clientId: string
  ) => Effect.Effect<Awaited<ReturnType<McpGrantLookup['findConsent']>>, unknown, R>
}

export type McpAuthorizationEffectRunner<R = never> = <A, E>(
  program: Effect.Effect<A, E, R>
) => Promise<A>

/** Adapt Effect repository workflows to the Promise lookup contract of the pure authorizer. */
export function createMcpAuthorizationPromiseAdapter<R>(
  workflows: McpAuthorizationWorkflows<R>,
  expectedResource: string,
  run: McpAuthorizationEffectRunner<R>
) {
  return createMcpClaimsAuthorizer(
    {
      findActiveSession: (sessionId) => run(workflows.findActiveSession(sessionId)),
      findClient: (clientId) => run(workflows.findClient(clientId)),
      findConsent: (userId, clientId) => run(workflows.findConsent(userId, clientId)),
    },
    expectedResource
  )
}
