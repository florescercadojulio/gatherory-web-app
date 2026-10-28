import { createFileRoute } from '@tanstack/react-router'
import { guestRegistryReservationResponse } from '@/server/events/handlers/registry-reservation.handler'

export const Route = createFileRoute('/api/guest/events/$eventId/registry')({
  server: {
    handlers: {
      GET: ({ request, params }) => guestRegistryReservationResponse(request, params.eventId),
      POST: ({ request, params }) => guestRegistryReservationResponse(request, params.eventId),
      DELETE: ({ request, params }) => guestRegistryReservationResponse(request, params.eventId),
    },
  },
})
