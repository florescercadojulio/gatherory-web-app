import { createFileRoute } from '@tanstack/react-router'
import { handleAndroidAppleExchange } from '@/server/auth/handlers/android-apple-sign-in.handler'

export const Route = createFileRoute('/api/auth/android/apple/exchange')({
  server: {
    handlers: {
      POST: ({ request }) => handleAndroidAppleExchange(request),
    },
  },
})
