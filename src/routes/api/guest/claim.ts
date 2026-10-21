import { createFileRoute } from '@tanstack/react-router'
import { deviceGuestClaimResponse } from '@/server/events/handlers/device-guest-api.handler'

export const Route = createFileRoute('/api/guest/claim')({
  server: {
    handlers: {
      POST: ({ request }) => deviceGuestClaimResponse(request),
    },
  },
})
