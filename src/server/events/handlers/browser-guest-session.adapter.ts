import { env } from '@/env'
import { getRequest, getRequestHeader, useSession } from '@tanstack/react-start/server'
import { randomBytes, randomUUID } from 'node:crypto'
import { allowBrowserGuestPost } from './browser-guest.request-guard'

const SESSION_COOKIE = '__Host-browser-guest'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
type BrowserGuestSessionData = { guestId: string; credential: string; issuedAt: number }

export type BrowserGuestSessionIdentity = { id: string; credential: string }

async function browserGuestSession() {
  return useSession<BrowserGuestSessionData>({
    name: SESSION_COOKIE,
    password: env.BETTER_AUTH_SECRET,
    maxAge: SESSION_MAX_AGE_SECONDS,
    sessionHeader: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  })
}

/** Invalid or expired browser cookies recover as a clean anonymous session. */
export async function readBrowserGuestSessionIdentity(): Promise<BrowserGuestSessionIdentity | null> {
  if (
    !getRequestHeader('cookie')
      ?.split(/;\s*/)
      .some((part) => part.startsWith(`${SESSION_COOKIE}=`))
  ) {
    return null
  }
  try {
    const session = await browserGuestSession()
    const value = session.data
    if (
      !value.guestId ||
      !/^[0-9a-f-]{36}$/i.test(value.guestId) ||
      !value.credential ||
      !/^[A-Za-z0-9_-]{43}$/.test(value.credential) ||
      !value.issuedAt ||
      Date.now() < value.issuedAt ||
      Date.now() - value.issuedAt > SESSION_MAX_AGE_SECONDS * 1000
    )
      return null
    return { id: value.guestId, credential: value.credential }
  } catch {
    return null
  }
}

export async function prepareBrowserGuestSessionIdentity() {
  const session = await browserGuestSession()
  const existing = await readBrowserGuestSessionIdentity()
  if (existing) return existing
  const identity = { id: randomUUID(), credential: randomBytes(32).toString('base64url') }
  await session.update({
    guestId: identity.id,
    credential: identity.credential,
    issuedAt: Date.now(),
  })
  return identity
}

export async function endBrowserGuestSessionIdentity() {
  const session = await browserGuestSession()
  await session.clear()
}

/** Returns false before consuming a rate-limit slot for cross-origin attempts. */
export function isAllowedBrowserGuestPost() {
  return allowBrowserGuestPost(getRequest(), env.BETTER_AUTH_URL)
}
