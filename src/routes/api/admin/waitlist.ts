import { createFileRoute } from '@tanstack/react-router'
import { waitlistHandlers } from '@/server/waitlist/handlers/waitlist-api.live'

export const Route = createFileRoute('/api/admin/waitlist')({
  server: {
    handlers: {
      GET: ({ request }) => waitlistHandlers.admin(request),
      PATCH: ({ request }) => waitlistHandlers.admin(request),
    },
  },
})
