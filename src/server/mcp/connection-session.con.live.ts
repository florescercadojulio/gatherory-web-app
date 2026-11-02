import { Effect, Layer } from 'effect'
import { auth } from '@/lib/auth'
import { ServerOperationError } from '@/lib/domain-errors'
import { McpConnectionSessionConnector } from './connection-session.con'

export const McpConnectionSessionConnectorLive = Layer.succeed(McpConnectionSessionConnector, {
  getUser: (headers) =>
    Effect.tryPromise({
      try: async () => {
        const session = await auth.api.getSession({
          headers,
          query: { disableCookieCache: true, disableRefresh: true },
        })
        return session
          ? {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              image: session.user.image ?? null,
            }
          : null
      },
      catch: (cause) =>
        new ServerOperationError({
          category: 'system',
          code: 'MCP_SESSION_UNAVAILABLE',
          userMessageKey: 'serverErrors.SYSTEM',
          cause,
        }),
    }),
})
