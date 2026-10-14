import { expect, test } from 'vitest'
import { guestIdeaContent } from '@/lib/guest-invitation-content'

test('invitation configuration is explicitly allowlisted, including nested music fields', () => {
  const content = guestIdeaContent('music', {
    version: 1,
    secret: 'PRIVATE',
    native: {
      music: {
        _0: {
          privateBudget: 1234,
          tracks: [
            {
              providerID: 'apple-music',
              catalogID: '123',
              title: 'Song',
              artistName: 'Artist',
              privateNotes: 'PRIVATE',
            },
          ],
        },
      },
    },
  })
  expect(content.tracks.length).toBe(1)
  expect(JSON.stringify(content)).not.toMatch(/PRIVATE|privateBudget|privateNotes/)
  expect(
    guestIdeaContent('link', { native: { link: { _0: { url: 'javascript:alert(1)' } } } }).linkURL
  ).toBe(null)
  expect(
    guestIdeaContent('attire', {
      native: { attire: { _0: { style: 'garden', restrictions: 'No white', internalPrice: 999 } } },
    }).configuration
  ).toEqual({ attire: { _0: { style: 'garden', restrictions: 'No white' } } })
})
