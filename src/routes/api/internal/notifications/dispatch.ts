import { createFileRoute } from '@tanstack/react-router'
import { scheduledNotificationDispatchResponse } from '@/server/notifications/scheduler/notification-dispatch.adapter.live'

export const Route = createFileRoute('/api/internal/notifications/dispatch')({
  server: { handlers: { GET: ({ request }) => scheduledNotificationDispatchResponse(request) } },
})
