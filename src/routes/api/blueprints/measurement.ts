import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintMeasurementSettings } from '@/server/blueprints/handlers/blueprint-discovery-actions.handler'

export const Route = createFileRoute('/api/blueprints/measurement')({
  server: {
    handlers: {
      GET: ({ request }) => handleBlueprintMeasurementSettings(request),
      PATCH: ({ request }) => handleBlueprintMeasurementSettings(request),
    },
  },
})
