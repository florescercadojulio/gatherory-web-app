import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintLinkManagementRequest } from '@/server/blueprints/handlers/blueprint-link-management.handler'

export const Route = createFileRoute('/api/blueprints/sharing')({
  server: { handlers: { POST: ({ request }) => handleBlueprintLinkManagementRequest(request) } },
})
