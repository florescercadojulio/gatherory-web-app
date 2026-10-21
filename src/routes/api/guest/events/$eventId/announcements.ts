import { createFileRoute } from '@tanstack/react-router'
import { guestAnnouncementsResponse } from '@/server/announcements/handlers/announcement-api.handler'

export const Route = createFileRoute('/api/guest/events/$eventId/announcements')({
  server: {
    handlers: {
      GET: ({ request, params }) => guestAnnouncementsResponse(request, params.eventId),
    },
  },
})
