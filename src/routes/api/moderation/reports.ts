import { createFileRoute } from '@tanstack/react-router'
import { moderationResponse } from '@/server/moderation/handlers/moderation-api.handler'

export const Route = createFileRoute('/api/moderation/reports')({
  server: { handlers: { POST: ({ request }) => moderationResponse(request, 'report') } },
})
