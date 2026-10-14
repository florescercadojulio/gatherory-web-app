import { createFileRoute } from '@tanstack/react-router'
import { moderationResponse } from '@/server/moderation/handlers/moderation-api.handler'

export const Route = createFileRoute('/api/admin/reports')({
  server: {
    handlers: {
      GET: ({ request }) => moderationResponse(request, 'list'),
      PATCH: ({ request }) => moderationResponse(request, 'review'),
    },
  },
})
