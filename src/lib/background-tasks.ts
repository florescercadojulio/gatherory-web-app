import '@tanstack/react-start/server-only'

/**
 * Start non-critical work without coupling the application to a hosting
 * provider's request-lifetime API. The Node server keeps pending I/O alive;
 * rejected tasks are observed so they cannot become unhandled rejections.
 */
export function runInBackground(promise: Promise<unknown>): void {
  void promise.catch((error: unknown) => {
    console.error('Background task failed', error)
  })
}
