import { createFileRoute } from '@tanstack/react-router'
import { handleGatheroryMcpRequest } from '@/server/mcp/handler.live'

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      POST: ({ request }) => handleGatheroryMcpRequest(request),
      GET: () =>
        new Response(null, {
          status: 405,
          headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
        }),
      DELETE: () =>
        new Response(null, {
          status: 405,
          headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
        }),
    },
  },
})
