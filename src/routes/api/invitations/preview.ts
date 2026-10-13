import { createFileRoute } from "@tanstack/react-router"
import { invitationConsumptionResponse } from "@/server/events/invitation-consumption-api"
export const Route = createFileRoute("/api/invitations/preview")({ server: { handlers: {
  GET: ({ request }) => invitationConsumptionResponse(request, "preview"),
} } })
