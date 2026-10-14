import { createFileRoute } from "@tanstack/react-router"
import { createInvitationResponse, revokeInvitationResponse, eventJoinRequestsResponse } from "@/server/events/invitation-api"

export const Route = createFileRoute("/api/invitations")({
  server: { handlers: {
    GET: ({ request }) => eventJoinRequestsResponse(request),
    PATCH: ({ request }) => eventJoinRequestsResponse(request),
    POST: ({ request }) => createInvitationResponse(request),
    DELETE: ({ request }) => revokeInvitationResponse(request),
  } },
})
