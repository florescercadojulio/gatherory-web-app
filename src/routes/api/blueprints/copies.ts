import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintCopyRequest } from '@/server/blueprints/handlers/blueprint-copy.handler'

export const Route = createFileRoute('/api/blueprints/copies')({
  server: { handlers: { POST: ({ request }) => handleBlueprintCopyRequest(request) } },
})
