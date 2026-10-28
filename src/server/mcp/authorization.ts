import type { JWTPayload } from 'jose'

export interface McpAccessTokenClaims extends JWTPayload {
  azp?: string
  client_id?: string
  scope?: string
  sid?: string
  sub?: string
}

export interface McpGrantLookup {
  findActiveSession(
    sessionId: string
  ): Promise<{ userId: string; emailVerified: boolean; expiresAt: Date } | null>
  findClient(clientId: string): Promise<{ disabled: boolean | null } | null>
  findConsent(
    userId: string,
    clientId: string
  ): Promise<{
    scopes: readonly string[]
    resources: readonly string[] | null
    updatedAt: Date
  } | null>
}

/**
 * Build a request-time authorization check for a cryptographically verified
 * MCP JWT. This is separate from token verification and event ACL checks.
 */
export function createMcpClaimsAuthorizer(lookup: McpGrantLookup, expectedResource: string) {
  return async (claims: McpAccessTokenClaims, now = new Date()): Promise<{ userId: string } | null> => {
    const userId = typeof claims.sub === 'string' ? claims.sub : null
    const sessionId = typeof claims.sid === 'string' ? claims.sid : null
    const authorizedParty = typeof claims.azp === 'string' ? claims.azp : null
    const clientId = typeof claims.client_id === 'string' ? claims.client_id : null

    if (!userId || !sessionId || !authorizedParty || !clientId || clientId !== authorizedParty) {
      return null
    }

    const tokenScopes = typeof claims.scope === 'string' ? claims.scope.split(/\s+/).filter(Boolean) : []
    if (tokenScopes.length === 0 || new Set(tokenScopes).size !== tokenScopes.length) return null
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!audiences.includes(expectedResource)) return null
    if (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat)) return null

    const [activeSession, client, consent] = await Promise.all([
      lookup.findActiveSession(sessionId),
      lookup.findClient(clientId),
      lookup.findConsent(userId, clientId),
    ])

    if (
      !activeSession ||
      activeSession.userId !== userId ||
      !activeSession.emailVerified ||
      activeSession.expiresAt <= now ||
      !client ||
      client.disabled === true ||
      !consent ||
      !consent.resources?.includes(expectedResource) ||
      // JWT `iat` is only second-precision. Tokens from the same second as a
      // consent update remain valid; tokens from an earlier second do not.
      claims.iat < Math.floor(consent.updatedAt.getTime() / 1000)
    ) {
      return null
    }

    const grantedScopes = new Set(consent.scopes)
    if (!tokenScopes.every((scope) => grantedScopes.has(scope))) return null

    return { userId }
  }
}
