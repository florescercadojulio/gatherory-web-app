import { createFileRoute } from '@tanstack/react-router'
import { moderationResponse } from '@/server/moderation/moderation.api'

export const Route = createFileRoute('/api/admin/report-image')({
  server: { handlers: { GET: ({ request }) => moderationResponse(request, 'preview') } },
})
