/** Analytics payloads are JSON. Bearer tokens must not enter URLs, breadcrumbs, or text captures. */
export function redactTemplateLinkCredentials<T>(payload: T): T {
  if (payload === undefined || payload === null) return payload
  // Also covers token-only values and encoded URL paths. Content hashes may be
  // redacted too; preserving them in telemetry is less important than credentials.
  return JSON.parse(JSON.stringify(payload).replace(/[0-9a-f]{64}/gi, '[redacted]'))
}
