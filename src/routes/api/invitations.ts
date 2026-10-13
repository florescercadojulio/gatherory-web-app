import { createFileRoute } from "@tanstack/react-router"
import { createInvitationResponse, revokeInvitationResponse } from "@/server/events/invitation-api"

export const Route = createFileRoute("/api/invitations")({
  server: { handlers: {
    POST: ({ request }) => createInvitationResponse(request),
    DELETE: ({ request }) => revokeInvitationResponse(request),
  } },
})
