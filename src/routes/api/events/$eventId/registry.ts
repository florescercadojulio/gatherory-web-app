import { createFileRoute } from '@tanstack/react-router'
import { accountRegistryReservationResponse } from '@/server/events/handlers/registry-reservation.handler'

export const Route = createFileRoute('/api/events/$eventId/registry')({
  server: {
    handlers: {
      GET: ({ request, params }) => accountRegistryReservationResponse(request, params.eventId),
      POST: ({ request, params }) => accountRegistryReservationResponse(request, params.eventId),
      DELETE: ({ request, params }) => accountRegistryReservationResponse(request, params.eventId),
    },
  },
})
