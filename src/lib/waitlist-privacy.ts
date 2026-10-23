/** The marketing list contains third-party contact details, not product analytics content. */
export function isWaitlistTrackerPath(path: string) {
  return path === '/admin/waitlist' || path.startsWith('/admin/waitlist/')
}
