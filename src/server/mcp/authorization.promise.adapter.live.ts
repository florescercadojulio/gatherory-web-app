import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { env } from '@/env'
import { mcpResourceURL } from './auth-config'
import {
  findMcpActiveSessionWorkflow,
  findMcpClientWorkflow,
  findMcpConsentWorkflow,
} from './authorization.workflows.live'
import { createMcpAuthorizationPromiseAdapter } from './authorization.promise.adapter'

const runEffect = <A, E>(program: Effect.Effect<A, E, PgClient>) =>
  Effect.runPromise(program.pipe(Effect.provide(PgClientLive)))

export const authorizeMcpClaims = createMcpAuthorizationPromiseAdapter(
  {
    findActiveSession: findMcpActiveSessionWorkflow,
    findClient: findMcpClientWorkflow,
    findConsent: findMcpConsentWorkflow,
  },
  mcpResourceURL(env.BETTER_AUTH_URL),
  runEffect
)
