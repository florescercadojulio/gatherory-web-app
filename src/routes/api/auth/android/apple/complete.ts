import { createFileRoute } from '@tanstack/react-router'
import { handleAndroidAppleComplete } from '@/server/auth/handlers/android-apple-sign-in.handler'

export const Route = createFileRoute('/api/auth/android/apple/complete')({
  server: {
    handlers: {
      GET: ({ request }) => handleAndroidAppleComplete(request),
    },
  },
})
