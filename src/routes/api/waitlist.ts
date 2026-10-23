import { createFileRoute } from '@tanstack/react-router'
import { waitlistHandlers } from '@/server/waitlist/handlers/waitlist-api.live'

export const Route = createFileRoute('/api/waitlist')({
  server: {
    handlers: {
      OPTIONS: ({ request }) => waitlistHandlers.signup(request),
      POST: ({ request }) => waitlistHandlers.signup(request),
      GET: () =>
        new Response(null, {
          status: 405,
          headers: { Allow: 'POST, OPTIONS', 'Cache-Control': 'no-store' },
        }),
    },
  },
})
