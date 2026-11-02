import { createFileRoute } from '@tanstack/react-router'

import { handleBlueprintCoverMediaRequest } from '@/server/blueprint-media/handlers/blueprint-cover-media.handler'

export const Route = createFileRoute('/api/blueprints/media/$action')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleBlueprintCoverMediaRequest(request, params.action),
    },
  },
})
