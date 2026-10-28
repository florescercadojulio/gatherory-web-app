import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/env'
import { auth } from '@/lib/auth'

/** Forward only the provider's standard discovery documents; keep other paths private. */
export const Route = createFileRoute('/.well-known/$')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const path = new URL(request.url).pathname
        const allowed = [
          '/.well-known/oauth-authorization-server',
          '/.well-known/oauth-authorization-server/api/auth',
          '/.well-known/oauth-protected-resource',
          '/.well-known/oauth-protected-resource/mcp',
        ]
        if (!env.MCP_ENABLED || !allowed.includes(path)) return new Response(null, { status: 404 })
        return auth.handler(request)
      },
    },
  },
})
