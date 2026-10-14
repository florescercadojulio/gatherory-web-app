import { createFileRoute } from '@tanstack/react-router'
import { moderationResponse } from '@/server/moderation/handlers/moderation-api.handler'
export const Route = createFileRoute('/api/moderation/blocks')({
  server: {
    handlers: {
      GET: ({ request }) => moderationResponse(request, 'blocks'),
      POST: ({ request }) => moderationResponse(request, 'block'),
      DELETE: ({ request }) => moderationResponse(request, 'unblock'),
    },
  },
})
