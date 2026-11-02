import { PgClient } from '@effect/sql-pg/PgClient'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { oauthClient, oauthConsent, session, user } from '@/db/schema/auth.schema'
import {
  McpAuthorizationRepository,
  type McpAuthorizationRepositoryShape,
} from './authorization.repo.contract'

const repository = {
  findActiveSession: (
    sessionId: Parameters<McpAuthorizationRepositoryShape['findActiveSession']>[0]
  ) =>
    Effect.gen(function* () {
      const database = yield* DB
      const [row] = yield* database
        .select({
          userId: session.userId,
          emailVerified: user.emailVerified,
          expiresAt: session.expiresAt,
        })
        .from(session)
        .innerJoin(user, eq(user.id, session.userId))
        .where(and(eq(session.id, sessionId), gt(session.expiresAt, new Date())))
        .limit(1)
      return row ?? null
    }),

  findClient: (clientId: Parameters<McpAuthorizationRepositoryShape['findClient']>[0]) =>
    Effect.gen(function* () {
      const database = yield* DB
      const [row] = yield* database
        .select({ disabled: oauthClient.disabled })
        .from(oauthClient)
        .where(eq(oauthClient.clientId, clientId))
        .limit(1)
      return row ?? null
    }),

  findConsent: (
    userId: Parameters<McpAuthorizationRepositoryShape['findConsent']>[0],
    clientId: Parameters<McpAuthorizationRepositoryShape['findConsent']>[1]
  ) =>
    Effect.gen(function* () {
      const database = yield* DB
      const [row] = yield* database
        .select({
          scopes: oauthConsent.scopes,
          resources: oauthConsent.resources,
          updatedAt: oauthConsent.updatedAt,
        })
        .from(oauthConsent)
        .where(
          and(
            eq(oauthConsent.userId, userId),
            eq(oauthConsent.clientId, clientId),
            // MCP access tokens do not carry Better Auth's consent referenceId.
            // Only user-level grants authorize MCP requests.
            isNull(oauthConsent.referenceId)
          )
        )
        .orderBy(desc(oauthConsent.updatedAt))
        .limit(1)
      return row ?? null
    }),
}

export const McpAuthorizationRepositoryLive = Layer.effect(
  McpAuthorizationRepository,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      findActiveSession: (sessionId) =>
        repository.findActiveSession(sessionId).pipe(Effect.provideService(PgClient, pg)),
      findClient: (clientId) =>
        repository.findClient(clientId).pipe(Effect.provideService(PgClient, pg)),
      findConsent: (userId, clientId) =>
        repository.findConsent(userId, clientId).pipe(Effect.provideService(PgClient, pg)),
    } satisfies McpAuthorizationRepositoryShape
  })
)
