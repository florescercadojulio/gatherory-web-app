import { createFileRoute } from '@tanstack/react-router'
import { deviceGuestEventsResponse } from '@/server/events/handlers/device-guest-api.handler'

export const Route = createFileRoute('/api/guest/events')({
  server: {
    handlers: {
      GET: ({ request }) => deviceGuestEventsResponse(request),
      POST: ({ request }) => deviceGuestEventsResponse(request),
      PATCH: ({ request }) => deviceGuestEventsResponse(request),
      DELETE: ({ request }) => deviceGuestEventsResponse(request),
    },
  },
})
