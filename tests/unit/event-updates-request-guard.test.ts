import { describe, expect, it } from 'vitest'
import { isSameOriginEventUpdateRequest } from '@/server/events/handlers/event-updates.request-guard'

describe('event update same-origin guard', () => {
  it('accepts a matching Origin and same-origin fetch metadata', () => {
    const request = new Request('https://app.example/events/event-1', {
      method: 'POST',
      headers: {
        origin: 'https://app.example',
        'sec-fetch-site': 'same-origin',
      },
    })
    expect(isSameOriginEventUpdateRequest(request)).toBe(true)
  })

  it('rejects missing, cross-origin, and non-same-origin fetch metadata', () => {
    expect(isSameOriginEventUpdateRequest(new Request('https://app.example/write'))).toBe(false)
    expect(
      isSameOriginEventUpdateRequest(
        new Request('https://app.example/write', {
          method: 'POST',
          headers: { origin: 'https://attacker.example' },
        })
      )
    ).toBe(false)
    expect(
      isSameOriginEventUpdateRequest(
        new Request('https://app.example/write', {
          method: 'POST',
          headers: {
            origin: 'https://app.example',
            'sec-fetch-site': 'same-site',
          },
        })
      )
    ).toBe(false)
  })
})
