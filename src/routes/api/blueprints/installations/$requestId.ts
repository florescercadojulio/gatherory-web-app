import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintRequest } from '@/server/blueprints/handlers/blueprint.handler'
export const Route = createFileRoute('/api/blueprints/installations/$requestId')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleBlueprintRequest(request, 'status', params.requestId),
    },
  },
})
