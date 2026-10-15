import { createFileRoute } from '@tanstack/react-router'
import { handleBlueprintNativeCreationRequest } from '@/server/blueprints/handlers/blueprint-native-creation.handler'

export const Route = createFileRoute('/api/blueprints/create-template')({
  server: { handlers: { POST: ({ request }) => handleBlueprintNativeCreationRequest(request) } },
})
