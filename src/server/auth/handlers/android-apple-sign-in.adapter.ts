import { auth } from '@/lib/auth'
import { env } from '@/env'

export const androidAppleSignInEnabled = () => env.ANDROID_APPLE_SIGN_IN_ENABLED
export const androidAppleBetterAuthUrl = () => env.BETTER_AUTH_URL
export const runAndroidAppleBetterAuth = (request: Request) => auth.handler(request)
export const getAndroidAppleSession = (headers: Headers) =>
  auth.api.getSession({
    headers,
    query: { disableCookieCache: true, disableRefresh: true },
  })
