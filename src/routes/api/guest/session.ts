import { createFileRoute } from '@tanstack/react-router'
import { deviceGuestSessionResponse } from '@/server/events/handlers/device-guest-api.handler'

export const Route = createFileRoute('/api/guest/session')({
  server: {
    handlers: {
      POST: ({ request }) => deviceGuestSessionResponse(request),
    },
  },
})
