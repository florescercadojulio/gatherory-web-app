import { createFileRoute } from '@tanstack/react-router'
import { handlePersonalBlueprintRequest } from '@/server/blueprints/handlers/blueprint-personal.handler'

export const Route = createFileRoute('/api/blueprints/personal')({
  server: { handlers: { POST: ({ request }) => handlePersonalBlueprintRequest(request) } },
})
