import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintRequest } from '@/server/blueprints/handlers/blueprint.handler'
export const Route = createFileRoute('/api/blueprints/preview')({
  server: { handlers: { POST: ({ request }) => handleBlueprintRequest(request, 'preview') } },
})
