import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintRequest } from '@/server/blueprints/handlers/blueprint.handler'
export const Route = createFileRoute('/api/blueprints/install')({
  server: { handlers: { POST: ({ request }) => handleBlueprintRequest(request, 'install') } },
})
