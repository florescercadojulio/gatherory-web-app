import type { HookEndpointContext } from '@better-auth/core'
import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { createHash } from 'node:crypto'
import {
  safeReducedMcpScopes,
  shouldRetainMcpRefreshTokens,
} from '@/server/mcp/connection-settings'

/** Shared with the OAuth provider so the guard uses the configured token lookup key. */
export function hashMcpOAuthToken(token: string) {
  return createHash('sha256').update(token).digest('base64url')
}

type RevocationTarget = {
  id: string
  userId: string
  clientId: string
  referenceId?: string | null
}
type GrantTarget = { userId: string; clientId: string; referenceId?: string | null }
type RefreshTokenRecord = {
  id: string
  clientId: string
  sessionId: string | null
  userId: string
  referenceId?: string | null
  scopes: string[]
  resources: string[] | null
}
type ConsentRecord = {
  id: string
  clientId: string
  userId: string
  referenceId?: string | null
  scopes: string[]
  resources: string[] | null
}
type RequestContext = HookEndpointContext & {
  context: HookEndpointContext['context'] & {
    mcpConsentRevocation?: RevocationTarget
    mcpRefreshGrant?: GrantTarget
    mcpConsentUpdate?: GrantTarget
  }
}

async function deleteGrantTokens(
  adapter: RequestContext['context']['adapter'],
  target: GrantTarget
) {
  const referenceId = target.referenceId ?? null
  await Promise.all([
    adapter.deleteMany({
      model: 'oauthRefreshToken',
      where: [
        { field: 'userId', value: target.userId },
        { field: 'clientId', value: target.clientId },
        { field: 'referenceId', value: referenceId },
      ],
    }),
    adapter.deleteMany({
      model: 'oauthAccessToken',
      where: [
        { field: 'userId', value: target.userId },
        { field: 'clientId', value: target.clientId },
        { field: 'referenceId', value: referenceId },
      ],
    }),
  ])
}

/**
 * Recheck live session and consent before the provider can rotate or replay an
 * MCP refresh token. Consent deletion also removes the full refresh family.
 */
export function mcpRefreshGrantGuard(mcpResource: string): BetterAuthPlugin {
  const before = createAuthMiddleware({}, async (input) => {
    const ctx = input as unknown as RequestContext
    if (ctx.path === '/oauth2/delete-consent') {
      const body = ctx.body as { id?: unknown } | undefined
      if (typeof body?.id === 'string') {
        const consent = await ctx.context.adapter.findOne<ConsentRecord>({
          model: 'oauthConsent',
          where: [{ field: 'id', value: body.id }],
        })
        if (consent) {
          ctx.context.mcpConsentRevocation = {
            id: consent.id,
            userId: consent.userId,
            clientId: consent.clientId,
            referenceId: consent.referenceId,
          }
        }
      }
      return
    }

    if (ctx.path === '/oauth2/update-consent') {
      const body = ctx.body as { id?: unknown; update?: { scopes?: unknown } } | undefined
      if (typeof body?.id !== 'string' || !Array.isArray(body.update?.scopes)) return
      const consent = await ctx.context.adapter.findOne<ConsentRecord>({
        model: 'oauthConsent',
        where: [{ field: 'id', value: body.id }],
      })
      const session = await getSessionFromCtx(
        ctx as unknown as Parameters<typeof getSessionFromCtx>[0],
        {
          disableCookieCache: true,
          disableRefresh: true,
        }
      )
      const actorId = session?.user.id
      if (!consent || consent.referenceId || !consent.resources?.includes(mcpResource)) return
      const scopes = body.update.scopes.filter(
        (value): value is string => typeof value === 'string'
      )
      if (
        scopes.length !== body.update.scopes.length ||
        !safeReducedMcpScopes(consent.scopes, scopes)
      ) {
        throw new APIError('BAD_REQUEST', {
          error: 'invalid_request',
          error_description:
            'MCP consent can only be reduced to read access; new scopes require fresh OAuth consent.',
        })
      }
      // The OAuth endpoint performs its own session and owner checks. The hook
      // enforces the scope ceiling before that endpoint, then only maintains
      // tokens when its authenticated actor owns the consent.
      if (!actorId || actorId !== consent.userId) return
      ctx.context.mcpConsentUpdate = {
        userId: consent.userId,
        clientId: consent.clientId,
        referenceId: consent.referenceId,
      }
      return
    }

    const body = ctx.body as
      | { grant_type?: unknown; refresh_token?: unknown; scope?: unknown; resource?: unknown }
      | undefined
    if (body?.grant_type !== 'refresh_token' || typeof body.refresh_token !== 'string') return

    const refresh = await ctx.context.adapter.findOne<RefreshTokenRecord>({
      model: 'oauthRefreshToken',
      where: [{ field: 'token', value: hashMcpOAuthToken(body.refresh_token) }],
    })
    if (!refresh) return // Let the provider return its standard invalid_grant.
    ctx.context.mcpRefreshGrant = {
      userId: refresh.userId,
      clientId: refresh.clientId,
      referenceId: refresh.referenceId,
    }

    const [activeSession, client, consent, account] = await Promise.all([
      refresh.sessionId
        ? ctx.context.adapter.findOne<{ expiresAt: Date }>({
            model: 'session',
            where: [
              { field: 'id', value: refresh.sessionId },
              { field: 'userId', value: refresh.userId },
            ],
          })
        : null,
      ctx.context.adapter.findOne<{ disabled: boolean | null }>({
        model: 'oauthClient',
        where: [{ field: 'clientId', value: refresh.clientId }],
      }),
      ctx.context.adapter.findOne<ConsentRecord>({
        model: 'oauthConsent',
        where: [
          { field: 'userId', value: refresh.userId },
          { field: 'clientId', value: refresh.clientId },
          { field: 'referenceId', value: refresh.referenceId ?? null },
        ],
      }),
      ctx.context.adapter.findOne<{ emailVerified: boolean }>({
        model: 'user',
        where: [{ field: 'id', value: refresh.userId }],
      }),
    ])
    const requestedScopes =
      typeof body.scope === 'string' ? body.scope.split(/\s+/).filter(Boolean) : refresh.scopes
    const requestedResources =
      typeof body.resource === 'string'
        ? [body.resource]
        : Array.isArray(body.resource)
          ? body.resource.filter((value): value is string => typeof value === 'string')
          : (refresh.resources ?? [])
    const consentScopes = new Set(consent?.scopes ?? [])
    const consentResources = new Set(consent?.resources ?? [])
    const invalid =
      !requestedResources.includes(mcpResource) ||
      !activeSession ||
      !(activeSession.expiresAt instanceof Date) ||
      activeSession.expiresAt <= new Date() ||
      !client ||
      client.disabled === true ||
      !account?.emailVerified ||
      !consent ||
      !requestedScopes.length ||
      requestedScopes.some((scope: string) => !consentScopes.has(scope)) ||
      requestedResources.some(
        (resource: string) =>
          !refresh.resources?.includes(resource) || !consentResources.has(resource)
      )

    if (invalid) {
      throw new APIError('BAD_REQUEST', {
        error: 'invalid_grant',
        error_description: 'The refresh grant is no longer active.',
      })
    }
  })

  const after = createAuthMiddleware({}, async (input) => {
    const ctx = input as unknown as RequestContext
    if (ctx.path === '/oauth2/token') {
      const grant = ctx.context.mcpRefreshGrant
      if (!grant) return
      const consent = await ctx.context.adapter.findOne<ConsentRecord>({
        model: 'oauthConsent',
        where: [
          { field: 'userId', value: grant.userId },
          { field: 'clientId', value: grant.clientId },
          { field: 'referenceId', value: grant.referenceId ?? null },
        ],
      })
      if (!consent) {
        await deleteGrantTokens(ctx.context.adapter, grant)
        throw new APIError('BAD_REQUEST', {
          error: 'invalid_grant',
          error_description: 'The refresh grant was revoked.',
        })
      }
      return
    }

    const updatedGrant = ctx.context.mcpConsentUpdate
    if (updatedGrant) {
      const consent = await ctx.context.adapter.findOne<ConsentRecord>({
        model: 'oauthConsent',
        where: [
          { field: 'userId', value: updatedGrant.userId },
          { field: 'clientId', value: updatedGrant.clientId },
          { field: 'referenceId', value: updatedGrant.referenceId ?? null },
        ],
      })
      if (!consent) return
      const target = [
        { field: 'userId', value: updatedGrant.userId },
        { field: 'clientId', value: updatedGrant.clientId },
        { field: 'referenceId', value: updatedGrant.referenceId ?? null },
      ]
      if (shouldRetainMcpRefreshTokens(consent.scopes)) {
        await ctx.context.adapter.updateMany({
          model: 'oauthRefreshToken',
          where: target,
          update: { scopes: consent.scopes },
        })
      } else {
        await deleteGrantTokens(ctx.context.adapter, updatedGrant)
      }
      return
    }

    const revoked = ctx.context.mcpConsentRevocation
    const actorId = ctx.context.session?.user.id
    if (!revoked || !actorId || actorId !== revoked.userId) return

    const remainingConsent = await ctx.context.adapter.findOne<ConsentRecord>({
      model: 'oauthConsent',
      where: [
        { field: 'id', value: revoked.id },
        { field: 'userId', value: revoked.userId },
        { field: 'clientId', value: revoked.clientId },
        { field: 'referenceId', value: revoked.referenceId ?? null },
      ],
    })
    if (remainingConsent) return

    await deleteGrantTokens(ctx.context.adapter, revoked)
  })

  return {
    id: 'gatherory-mcp-refresh-grant-guard',
    hooks: {
      before: [
        {
          matcher: (ctx) =>
            ctx.path === '/oauth2/token' ||
            ctx.path === '/oauth2/delete-consent' ||
            ctx.path === '/oauth2/update-consent',
          handler: before,
        },
      ],
      after: [
        {
          matcher: (ctx) =>
            ctx.path === '/oauth2/token' ||
            ctx.path === '/oauth2/delete-consent' ||
            ctx.path === '/oauth2/update-consent',
          handler: after,
        },
      ],
    },
  }
}
