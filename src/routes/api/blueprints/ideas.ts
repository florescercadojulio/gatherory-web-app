import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintIdeasRequest } from '@/server/blueprints/handlers/blueprint-ideas.handler'

export const Route = createFileRoute('/api/blueprints/ideas')({
  server: { handlers: { GET: ({ request }) => handleBlueprintIdeasRequest(request) } },
})
