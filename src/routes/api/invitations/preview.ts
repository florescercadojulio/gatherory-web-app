import { createFileRoute } from '@tanstack/react-router'
import { invitationConsumptionResponse } from '@/server/events/handlers/invitation-consumption-api.handler'
export const Route = createFileRoute('/api/invitations/preview')({
  server: {
    handlers: {
      GET: ({ request }) => invitationConsumptionResponse(request, 'preview'),
    },
  },
})
