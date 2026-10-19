import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintLibraryRequest } from '@/server/blueprints/handlers/blueprint-library.handler'

export const Route = createFileRoute('/api/blueprints/library')({
  server: { handlers: { GET: ({ request }) => handleBlueprintLibraryRequest(request) } },
})
