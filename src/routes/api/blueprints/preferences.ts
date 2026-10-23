import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintPreferences } from '@/server/blueprints/handlers/blueprint-discovery-actions.handler'

export const Route = createFileRoute('/api/blueprints/preferences')({
  server: {
    handlers: {
      GET: ({ request }) => handleBlueprintPreferences(request),
      PATCH: ({ request }) => handleBlueprintPreferences(request),
    },
  },
})
