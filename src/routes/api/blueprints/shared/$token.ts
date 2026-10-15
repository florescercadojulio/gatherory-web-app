import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintShareRequest } from '@/server/blueprints/handlers/blueprint-sharing.handler'

export const Route = createFileRoute('/api/blueprints/shared/$token')({
  server: {
    handlers: { GET: ({ request, params }) => handleBlueprintShareRequest(request, params.token) },
  },
})
