import { createFileRoute } from '@tanstack/react-router'
import { moderationResponse } from '@/server/moderation/moderation.api'

export const Route = createFileRoute('/api/moderation/hide')({
  server: {
    handlers: {
      GET: ({ request }) => moderationResponse(request, 'hidden'),
      POST: ({ request }) => moderationResponse(request, 'hide'),
    },
  },
})
