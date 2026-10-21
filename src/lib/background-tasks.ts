import '@tanstack/react-start/server-only'

import { waitUntil } from '@vercel/functions'

/**
 * Keep callback work alive after the response on Vercel. Without a Vercel
 * request context the SDK is a no-op; the promise still runs and failures
 * remain observed in local development.
 */
export function runInBackground(promise: Promise<unknown>): void {
  waitUntil(
    promise.catch((error: unknown) => {
      console.error('Background task failed', error)
    })
  )
}
