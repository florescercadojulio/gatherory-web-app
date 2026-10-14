import { z } from 'zod'

/** Only application-owned, email-scoped invitation paths are valid continuations. */
export function invitationPath(token: string) {
  return `/join/${z.uuid().parse(token)}`
}

export function invitationURL(baseURL: string, token: string) {
  const base = new URL(baseURL)
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('Invalid application URL')
  }
  return new URL(invitationPath(token), base.origin).href
}

export function invitationContinuation(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/join/')) return null
  const token = value.slice('/join/'.length)
  return z.uuid().safeParse(token).success ? invitationPath(token) : null
}

/** Keep existing local auth return paths, without permitting open redirects. */
export function safeAuthContinuation(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value)
  )
    return null
  const base = 'https://gatherory.invalid'
  return new URL(value, base).origin === base ? value : null
}
