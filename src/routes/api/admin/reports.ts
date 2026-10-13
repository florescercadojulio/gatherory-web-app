import { createFileRoute } from "@tanstack/react-router"
import { moderationResponse } from "@/server/moderation/moderation.api"

export const Route = createFileRoute("/api/admin/reports")({
  server: { handlers: {
    GET: ({ request }) => moderationResponse(request, "list"),
    PATCH: ({ request }) => moderationResponse(request, "review"),
  } },
})
