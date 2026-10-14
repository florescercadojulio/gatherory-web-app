import { createFileRoute } from '@tanstack/react-router'
import { handleAppleTokenRequest } from '@/server/auth/handlers/apple-token.handler'

export const Route = createFileRoute('/api/auth/apple-token')({
  server: {
    handlers: {
      POST: ({ request }) => handleAppleTokenRequest(request),
    },
  },
})
