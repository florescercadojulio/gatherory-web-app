import { createFileRoute } from "@tanstack/react-router"
import { invitationConsumptionResponse } from "@/server/events/invitation-consumption-api"
export const Route = createFileRoute("/api/invitations/accept")({ server: { handlers: {
  POST: ({ request }) => invitationConsumptionResponse(request, "accept"),
} } })
