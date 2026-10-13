import { createFileRoute } from "@tanstack/react-router"
import { invitationConsumptionResponse } from "@/server/events/invitation-consumption-api"
export const Route = createFileRoute("/api/events/invitations")({ server: { handlers: {
  GET: ({ request }) => invitationConsumptionResponse(request, "events"),
  POST: ({ request }) => invitationConsumptionResponse(request, "respond"),
} } })
