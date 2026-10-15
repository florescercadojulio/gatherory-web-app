import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintRequest } from '@/server/blueprints/handlers/blueprint.handler'

export const Route = createFileRoute('/api/blueprints/schedule')({
  server: { handlers: { POST: ({ request }) => handleBlueprintRequest(request, 'schedule') } },
})
