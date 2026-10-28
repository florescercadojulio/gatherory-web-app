import { createFileRoute } from '@tanstack/react-router'
import { handleAndroidAppleStart } from '@/server/auth/handlers/android-apple-sign-in.handler'

export const Route = createFileRoute('/api/auth/android/apple/start')({
  server: {
    handlers: {
      GET: ({ request }) => handleAndroidAppleStart(request),
    },
  },
})
