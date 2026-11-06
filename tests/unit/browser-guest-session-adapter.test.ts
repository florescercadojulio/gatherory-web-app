import { beforeEach, describe, expect, it, vi } from 'vitest'

const sessionMocks = vi.hoisted(() => ({
  cookieHeader: '',
  request: new Request('https://app.gatherory.test/rpc'),
  stored: {} as Record<string, unknown>,
  sessionConfigs: [] as Array<Record<string, unknown>>,
  cookieWrites: [] as string[],
  throwOnUse: false,
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => sessionMocks.request,
  getRequestHeader: (name: string) => (name === 'cookie' ? sessionMocks.cookieHeader : undefined),
  getRequestHeaders: () => new Headers(),
  useSession: async (config: Record<string, unknown>) => {
    sessionMocks.sessionConfigs.push(config)
    if (sessionMocks.throwOnUse) throw new Error('private credential failure')
    return {
      data: sessionMocks.stored,
      clear: async () => {
        sessionMocks.stored = {}
        sessionMocks.cookieHeader = ''
        sessionMocks.cookieWrites.push('__Host-browser-guest=; Max-Age=0')
      },
      update: async (next: Record<string, unknown>) => {
        sessionMocks.stored = { ...sessionMocks.stored, ...next }
        sessionMocks.cookieHeader = '__Host-browser-guest=sealed-session'
        sessionMocks.cookieWrites.push(
          '__Host-browser-guest=sealed-session; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000'
        )
      },
    }
  },
}))

import {
  endBrowserGuestSessionIdentity,
  prepareBrowserGuestSessionIdentity,
  readBrowserGuestSessionIdentity,
} from '@/server/events/handlers/browser-guest-session.adapter'
import { ServerOperationError } from '@/server/effect'
import { runServerEffect } from '@/server/effect-utils'
import { Effect } from 'effect'

describe('browser guest session adapter', () => {
  beforeEach(() => {
    sessionMocks.cookieHeader = ''
    sessionMocks.request = new Request('https://app.gatherory.test/rpc')
    sessionMocks.stored = {}
    sessionMocks.sessionConfigs.length = 0
    sessionMocks.cookieWrites.length = 0
    sessionMocks.throwOnUse = false
  })

  it('does not issue a session or access the session utility for consent-free GET without a cookie', async () => {
    expect(await readBrowserGuestSessionIdentity()).toBeNull()
    expect(sessionMocks.sessionConfigs).toHaveLength(0)
    expect(sessionMocks.cookieWrites).toEqual([])
  })

  it('ignores session identity supplied through request headers', async () => {
    sessionMocks.request = new Request('https://app.gatherory.test/rpc', {
      headers: { 'x-__Host-browser-guest-session': 'attacker-supplied-value' },
    })
    expect(await readBrowserGuestSessionIdentity()).toBeNull()
    expect(sessionMocks.sessionConfigs).toHaveLength(0)
  })

  it('writes a stable identity once and preserves it across prepare retries', async () => {
    const first = await prepareBrowserGuestSessionIdentity()
    const second = await prepareBrowserGuestSessionIdentity()
    expect(second).toEqual(first)
    expect(first.credential).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(sessionMocks.cookieWrites).toHaveLength(1)
    expect(sessionMocks.sessionConfigs[0]).toMatchObject({
      name: '__Host-browser-guest',
      sessionHeader: false,
      maxAge: 2_592_000,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 2_592_000,
      },
    })
    expect(sessionMocks.cookieWrites[0]).not.toContain(first.id)
    expect(sessionMocks.cookieWrites[0]).not.toContain(first.credential)
  })

  it.each([
    ['malformed', { guestId: 'not-a-uuid', credential: 'bad', issuedAt: Date.now() }],
    [
      'expired',
      {
        guestId: '8ce9c025-47d1-48ef-968d-2883b973a91d',
        credential: 'a'.repeat(43),
        issuedAt: Date.now() - 2_592_001_000,
      },
    ],
    [
      'future-issued',
      {
        guestId: '8ce9c025-47d1-48ef-968d-2883b973a91d',
        credential: 'a'.repeat(43),
        issuedAt: Date.now() + 60_000,
      },
    ],
  ])('treats %s cookie data as anonymous', async (_case, stored) => {
    sessionMocks.cookieHeader = '__Host-browser-guest=sealed-session'
    sessionMocks.stored = stored
    expect(await readBrowserGuestSessionIdentity()).toBeNull()
  })

  it('clears only the session cookie when a different guest starts', async () => {
    sessionMocks.cookieHeader = '__Host-browser-guest=sealed-session'
    sessionMocks.stored = {
      guestId: '8ce9c025-47d1-48ef-968d-2883b973a91d',
      credential: 'a'.repeat(43),
      issuedAt: Date.now(),
    }
    await endBrowserGuestSessionIdentity()
    expect(sessionMocks.stored).toEqual({})
    expect(sessionMocks.cookieWrites).toEqual(['__Host-browser-guest=; Max-Age=0'])
  })

  it('turns transport exceptions into the shared safe server result', async () => {
    sessionMocks.cookieHeader = '__Host-browser-guest=sealed-session'
    sessionMocks.throwOnUse = true
    expect(await readBrowserGuestSessionIdentity()).toBeNull()
    const result = await runServerEffect(
      Effect.fail(
        new ServerOperationError({
          category: 'system',
          code: 'BROWSER_GUEST_SESSION_FAILED',
          userMessageKey: 'serverErrors.SYSTEM',
          debugMessage: 'private credential failure',
        })
      )
    )
    expect(JSON.stringify(result)).not.toContain('private credential failure')
    expect(JSON.stringify(result)).not.toContain('sealed-session')
  })
})
