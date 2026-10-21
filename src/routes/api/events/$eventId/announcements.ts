import { createFileRoute } from '@tanstack/react-router'
import { announcementsResponse } from '@/server/announcements/handlers/announcement-api.handler'

export const Route = createFileRoute('/api/events/$eventId/announcements')({
  server: {
    handlers: {
      GET: ({ request, params }) => announcementsResponse(request, params.eventId),
      POST: ({ request, params }) => announcementsResponse(request, params.eventId),
    },
  },
})
