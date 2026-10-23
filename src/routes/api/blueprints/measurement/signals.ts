import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintDiscoverySignal } from '@/server/blueprints/handlers/blueprint-discovery-actions.handler'

export const Route = createFileRoute('/api/blueprints/measurement/signals')({
  server: { handlers: { POST: ({ request }) => handleBlueprintDiscoverySignal(request) } },
})
