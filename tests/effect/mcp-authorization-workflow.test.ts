import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import {
  McpAuthorizationRepository,
  type McpAuthorizationRepositoryShape,
} from '@/server/mcp/authorization.repo.contract'
import {
  findMcpActiveSessionWorkflow,
  findMcpClientWorkflow,
  findMcpConsentWorkflow,
} from '@/server/mcp/authorization.workflow'

it.effect(
  'authorization lookup workflows delegate each exact lookup to the injected repository',
  () => {
    const calls: unknown[][] = []
    const repository = {
      findActiveSession: (sessionId) => {
        calls.push(['session', sessionId])
        return Effect.succeed({
          userId: 'account-1',
          emailVerified: true,
          expiresAt: new Date('2026-11-03T00:00:00.000Z'),
        })
      },
      findClient: (clientId) => {
        calls.push(['client', clientId])
        return Effect.succeed({ disabled: false })
      },
      findConsent: (userId, clientId) => {
        calls.push(['consent', userId, clientId])
        return Effect.succeed({
          scopes: ['gatherory:read'],
          resources: ['https://app.example.test/mcp'],
          updatedAt: new Date('2026-11-01T00:00:00.000Z'),
        })
      },
    } satisfies McpAuthorizationRepositoryShape
    const dependencies = Layer.succeed(McpAuthorizationRepository, repository)

    return Effect.gen(function* () {
      const session = yield* findMcpActiveSessionWorkflow('session-1')
      const client = yield* findMcpClientWorkflow('client-1')
      const consent = yield* findMcpConsentWorkflow('account-1', 'client-1')

      expect(session?.userId).toBe('account-1')
      expect(client?.disabled).toBe(false)
      expect(consent?.scopes).toEqual(['gatherory:read'])
      expect(calls).toEqual([
        ['session', 'session-1'],
        ['client', 'client-1'],
        ['consent', 'account-1', 'client-1'],
      ])
    }).pipe(Effect.provide(dependencies))
  }
)
