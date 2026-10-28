import { createFileRoute } from '@tanstack/react-router'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { oauthClient, oauthConsent, oauthRefreshToken } from '@/db/schema/mcp-oauth.schema'
import { env } from '@/env'
import { auth } from '@/lib/auth'
import { mcpResourceURL } from '@/server/mcp/auth-config'
import {
  safeReducedMcpScopes,
  shouldRetainMcpRefreshTokens,
} from '@/server/mcp/connection-settings'

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' }
function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return origin !== null && origin === new URL(env.BETTER_AUTH_URL).origin
}

async function currentUser(request: Request) {
  return auth.api.getSession({
    headers: new Headers({ cookie: request.headers.get('cookie') ?? '' }),
    query: { disableCookieCache: true, disableRefresh: true },
  })
}

async function listConnections(userId: string) {
  const rows = await db
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
    .where(and(eq(oauthConsent.userId, userId), isNull(oauthConsent.referenceId)))
  return rows
    .filter((row) => !row.disabled && row.resources?.includes(mcpResourceURL(env.BETTER_AUTH_URL)))
    .map(({ id, clientId, scopes, updatedAt, name, icon }) => ({
      id,
      clientId,
      scopes,
      updatedAt: updatedAt.toISOString(),
      name,
      icon,
    }))
}

export const mcpConnectionHandlers = {
  GET: async ({ request }: { request: Request }) => {
    if (!env.MCP_ENABLED)
      return Response.json({ enabled: false, user: null, connections: [] }, { headers })
    const session = await currentUser(request)
    return Response.json(
      {
        enabled: true,
        user: session
          ? { email: session.user.email, name: session.user.name, image: session.user.image }
          : null,
        connections: session ? await listConnections(session.user.id) : [],
      },
      { headers }
    )
  },
  POST: async ({ request }: { request: Request }) => {
    if (!env.MCP_ENABLED) return Response.json({ error: 'mcp_disabled' }, { status: 404, headers })
    if (!isSameOrigin(request))
      return Response.json({ error: 'invalid_origin' }, { status: 403, headers })
    const session = await currentUser(request)
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401, headers })
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'invalid_request' }, { status: 400, headers })
    }
    const input = body as { clientId?: unknown; scopes?: unknown }
    if (
      typeof input?.clientId !== 'string' ||
      !Array.isArray(input.scopes) ||
      input.scopes.some((scope) => typeof scope !== 'string')
    ) {
      return Response.json({ error: 'invalid_request' }, { status: 400, headers })
    }
    const requestedScopes = [...new Set(input.scopes as string[])].sort()
    const result = await db.transaction(async (tx) => {
      const [grant] = await tx
        .select()
        .from(oauthConsent)
        .where(
          and(
            eq(oauthConsent.userId, session.user.id),
            eq(oauthConsent.clientId, input.clientId as string),
            isNull(oauthConsent.referenceId)
          )
        )
        .for('update')
      if (!grant || !grant.resources?.includes(mcpResourceURL(env.BETTER_AUTH_URL))) return null
      const reducedScopes = safeReducedMcpScopes(grant.scopes, requestedScopes)
      if (!reducedScopes) return { expansion: true as const }
      if (
        reducedScopes.length === grant.scopes.length &&
        reducedScopes.every((scope) => grant.scopes.includes(scope))
      ) {
        return { unchanged: true as const, id: grant.id, scopes: grant.scopes }
      }

      const updatedAt = new Date()
      await tx
        .update(oauthConsent)
        .set({ scopes: reducedScopes, updatedAt })
        .where(eq(oauthConsent.id, grant.id))
      // Keep a refresh grant usable only with the reduced permission.
      const refreshGrantWhere = and(
        eq(oauthRefreshToken.userId, session.user.id),
        eq(oauthRefreshToken.clientId, input.clientId as string),
        isNull(oauthRefreshToken.referenceId)
      )
      if (shouldRetainMcpRefreshTokens(reducedScopes)) {
        await tx.update(oauthRefreshToken).set({ scopes: reducedScopes }).where(refreshGrantWhere)
      } else {
        await tx.delete(oauthRefreshToken).where(refreshGrantWhere)
      }
      return { id: grant.id, scopes: reducedScopes, updatedAt }
    })
    if (!result) return Response.json({ error: 'connection_not_found' }, { status: 404, headers })
    if ('expansion' in result)
      return Response.json({ error: 'fresh_consent_required' }, { status: 409, headers })
    if ('unchanged' in result)
      return Response.json(
        {
          ok: true,
          connection: { id: result.id, clientId: input.clientId, scopes: result.scopes },
        },
        { headers }
      )
    return Response.json(
      {
        ok: true,
        connection: {
          id: result.id,
          clientId: input.clientId,
          scopes: result.scopes,
          updatedAt: result.updatedAt.toISOString(),
        },
      },
      { headers }
    )
  },
}

export const Route = createFileRoute('/api/mcp/connection')({
  server: { handlers: mcpConnectionHandlers },
})
