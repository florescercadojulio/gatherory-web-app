import { createFileRoute } from '@tanstack/react-router'
import { moderationResponse } from '@/server/moderation/handlers/moderation-api.handler'

export const Route = createFileRoute('/api/admin/report-image')({
  server: { handlers: { GET: ({ request }) => moderationResponse(request, 'preview') } },
})
