import { and, desc, eq, gt, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { oauthClient, oauthConsent, session, user } from '@/db/schema/auth.schema'
import { env } from '@/env'
import { mcpResourceURL } from '@/server/mcp/auth-config'
import { createMcpClaimsAuthorizer, type McpAccessTokenClaims } from '@/server/mcp/authorization'

const authorizeClaims = createMcpClaimsAuthorizer(
  {
    async findActiveSession(sessionId) {
      const [row] = await db
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
    },
    async findClient(clientId) {
      const [row] = await db
        .select({ disabled: oauthClient.disabled })
        .from(oauthClient)
        .where(eq(oauthClient.clientId, clientId))
        .limit(1)
      return row ?? null
    },
    async findConsent(userId, clientId) {
      const [row] = await db
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
            // Only user-level grants can therefore authorize MCP requests.
            isNull(oauthConsent.referenceId)
          )
        )
        .orderBy(desc(oauthConsent.updatedAt))
        .limit(1)
      return row ?? null
    },
  },
  mcpResourceURL(env.BETTER_AUTH_URL)
)

/**
 * Rechecks session, client, and current OAuth consent on every MCP request.
 * The caller must first verify JWT signature, issuer, resource audience,
 * expiration, and required operation scope with Better Auth's MCP helper.
 */
export async function authorizeMcpClaims(claims: McpAccessTokenClaims) {
  return authorizeClaims(claims)
}
