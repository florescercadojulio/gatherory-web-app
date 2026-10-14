import { createFileRoute } from '@tanstack/react-router'
import { invitationConsumptionResponse } from '@/server/events/handlers/invitation-consumption-api.handler'
export const Route = createFileRoute('/api/events/invitations')({
  server: {
    handlers: {
      GET: ({ request }) => invitationConsumptionResponse(request, 'events'),
      POST: ({ request }) => invitationConsumptionResponse(request, 'respond'),
      DELETE: ({ request }) => invitationConsumptionResponse(request, 'leave'),
    },
  },
})
