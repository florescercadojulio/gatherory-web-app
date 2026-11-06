import { beforeEach, describe, expect, it } from 'vitest'
import {
  allowBrowserGuestPost,
  consumeBrowserGuestRateLimit,
  hasBrowserGuestSameOrigin,
  resetBrowserGuestRateLimitForTests,
} from '@/server/events/handlers/browser-guest.request-guard'

describe('browser guest request guard', () => {
  beforeEach(() => resetBrowserGuestRateLimitForTests())

  it('accepts only the exact configured origin', () => {
    const request = new Request('https://app.example.test/rpc', {
      headers: { origin: 'https://app.example.test' },
    })
    expect(hasBrowserGuestSameOrigin(request, 'https://app.example.test/')).toBe(true)
    expect(
      hasBrowserGuestSameOrigin(
        new Request('https://app.example.test/rpc', {
          headers: { origin: 'https://app.example.test/path' },
        }),
        'https://app.example.test'
      )
    ).toBe(false)
    expect(
      hasBrowserGuestSameOrigin(
        new Request('https://app.example.test/rpc', { headers: { origin: 'https://evil.test' } }),
        'https://app.example.test'
      )
    ).toBe(false)
    expect(
      hasBrowserGuestSameOrigin(
        new Request('https://app.example.test/rpc'),
        'https://app.example.test'
      )
    ).toBe(false)
  })

  it('limits requests by client address for a sliding window', () => {
    const request = new Request('https://app.example.test/rpc', {
      headers: { 'cf-connecting-ip': '192.0.2.42' },
    })
    const limits = { maxRequests: 2, windowMs: 1000 }
    expect(consumeBrowserGuestRateLimit(request, 5000, limits)).toBe(true)
    expect(consumeBrowserGuestRateLimit(request, 5200, limits)).toBe(true)
    expect(consumeBrowserGuestRateLimit(request, 5400, limits)).toBe(false)
    expect(consumeBrowserGuestRateLimit(request, 6000, limits)).toBe(true)
  })

  it('does not spend a rate-limit slot on a cross-origin request', () => {
    const denied = new Request('https://app.example.test/rpc', {
      headers: { origin: 'https://attacker.test', 'cf-connecting-ip': '192.0.2.42' },
    })
    const allowed = new Request('https://app.example.test/rpc', {
      headers: { origin: 'https://app.example.test', 'cf-connecting-ip': '192.0.2.42' },
    })
    expect(allowBrowserGuestPost(denied, 'https://app.example.test', 5000)).toBe(false)
    expect(allowBrowserGuestPost(allowed, 'https://app.example.test', 5000)).toBe(true)
  })
})
