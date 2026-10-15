import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintRequest } from '@/server/blueprints/handlers/blueprint.handler'
export const Route = createFileRoute('/api/blueprints/catalog')({
  server: { handlers: { GET: ({ request }) => handleBlueprintRequest(request, 'catalog') } },
})
