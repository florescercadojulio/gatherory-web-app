import { createFileRoute } from '@tanstack/react-router'
import { notificationInstallationResponse } from '@/server/notifications/handlers/notification-installation.handler'

export const Route = createFileRoute('/api/notifications/installations')({
  server: {
    handlers: {
      POST: ({ request }) => notificationInstallationResponse(request),
      DELETE: ({ request }) => notificationInstallationResponse(request),
    },
  },
})
