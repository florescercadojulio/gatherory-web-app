import { PgClient } from '@effect/sql-pg/PgClient'
import { and, eq, isNull } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { oauthClient, oauthConsent, oauthRefreshToken } from '@/db/schema/mcp-oauth.schema'
import {
  McpConnectionRepository,
  type McpConnectionRepositoryShape,
} from './connection.repo.contract'
import { safeReducedMcpScopes, shouldRetainMcpRefreshTokens } from './connection-settings'

const repository = {
  list: (input: Parameters<McpConnectionRepositoryShape['list']>[0]) =>
    Effect.gen(function* () {
      const database = yield* DB
      const rows = yield* database
        .select({
          id: oauthConsent.id,
          clientId: oauthConsent.clientId,
          scopes: oauthConsent.scopes,
          updatedAt: oauthConsent.updatedAt,
          resources: oauthConsent.resources,
          name: oauthClient.name,
          icon: oauthClient.icon,
          disabled: oauthClient.disabled,
        })
        .from(oauthConsent)
        .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
        .where(and(eq(oauthConsent.userId, input.userId), isNull(oauthConsent.referenceId)))
      return rows
        .filter((row) => !row.disabled && row.resources?.includes(input.resourceURL))
        .map(({ id, clientId, scopes, updatedAt, name, icon }) => ({
          id,
          clientId,
          scopes,
          updatedAt: updatedAt.toISOString(),
          name,
          icon,
        }))
    }),

  reduceScopes: (input: Parameters<McpConnectionRepositoryShape['reduceScopes']>[0]) =>
    Effect.gen(function* () {
      const database = yield* DB
      return yield* database.transaction((tx) =>
        Effect.gen(function* () {
          const [grant] = yield* tx
            .select()
            .from(oauthConsent)
            .where(
              and(
                eq(oauthConsent.userId, input.userId),
                eq(oauthConsent.clientId, input.clientId),
                isNull(oauthConsent.referenceId)
              )
            )
            .for('update')
          if (!grant || !grant.resources?.includes(input.resourceURL))
            return { kind: 'missing' as const }

          const reducedScopes = safeReducedMcpScopes(grant.scopes, input.requestedScopes)
          if (!reducedScopes) return { kind: 'expansion' as const }
          if (
            reducedScopes.length === grant.scopes.length &&
            reducedScopes.every((scope) => grant.scopes.includes(scope))
          ) {
            return { kind: 'unchanged' as const, id: grant.id, scopes: grant.scopes }
          }

          const updatedAt = new Date()
          yield* tx
            .update(oauthConsent)
            .set({ scopes: reducedScopes, updatedAt })
            .where(eq(oauthConsent.id, grant.id))
          const refreshGrantWhere = and(
            eq(oauthRefreshToken.userId, input.userId),
            eq(oauthRefreshToken.clientId, input.clientId),
            isNull(oauthRefreshToken.referenceId)
          )
          if (shouldRetainMcpRefreshTokens(reducedScopes)) {
            yield* tx
              .update(oauthRefreshToken)
              .set({ scopes: reducedScopes })
              .where(refreshGrantWhere)
          } else {
            yield* tx.delete(oauthRefreshToken).where(refreshGrantWhere)
          }
          return { kind: 'updated' as const, id: grant.id, scopes: reducedScopes, updatedAt }
        })
      )
    }),
}

export const McpConnectionRepositoryLive = Layer.effect(
  McpConnectionRepository,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      list: (input) => repository.list(input).pipe(Effect.provideService(PgClient, pg)),
      reduceScopes: (input) =>
        repository.reduceScopes(input).pipe(Effect.provideService(PgClient, pg)),
    } satisfies McpConnectionRepositoryShape
  })
)
