import { expect, test } from 'vitest'

import {
  createReviewWorkspaceArchive,
  encodeNativeWorkspaceSnapshot,
  reviewWorkspaceIds,
} from '@/db/review-workspace-fixture'

const users = [
  { id: 'alex-user', name: 'Alex Morgan', email: 'planner@gatherory.test' },
  { id: 'jordan-user', name: 'Jordan Lee', email: 'jordan@gatherory.test' },
  { id: 'maya-user', name: 'Maya Chen', email: 'coordinator@gatherory.test' },
  { id: 'sam-user', name: 'Sam Rivera', email: 'guest@gatherory.test' },
  {
    id: 'app-review-user',
    name: 'Gatherory App Review',
    email: 'appreview@gatherory.test',
  },
] as const

test('App Review fixture creates a populated iOS workspace snapshot', () => {
  const archive = createReviewWorkspaceArchive({ users })
  const decoded = JSON.parse(
    Buffer.from(encodeNativeWorkspaceSnapshot(archive), 'base64').toString('utf8')
  ) as typeof archive

  expect(decoded.mainEventID).toBe(reviewWorkspaceIds.events.main)
  expect(decoded.title).toBe("Alex & Jordan's Wedding")
  expect(decoded.members.at(-1)?.userID).toBe(users[4].id)
  expect(decoded.members.at(-1)?.planningPermission).toBe('manage')
  expect(decoded.timeline.length >= 3).toBeTruthy()
  expect(new Set(decoded.ideas.map((idea) => idea.category))).toEqual(
    new Set([
      'event',
      'registry',
      'link',
      'venue',
      'attire',
      'flowers',
      'food',
      'photography',
      'music',
      'decor',
      'invitations',
      'honeymoon',
      'other',
    ])
  )
  expect(
    decoded.ideas.every((idea) =>
      ['new', 'maybe', 'shortlisted', 'chosen', 'passed', 'archived'].includes(idea.status)
    ),
    'fixture idea statuses must use iOS IdeaStatus raw values'
  ).toBeTruthy()
  expect(decoded.eventExpenses.length >= 1).toBeTruthy()
  expect(decoded.registry.length >= 1).toBeTruthy()
  expect(decoded.mainEventLocation.locationName).toBe('Willow & Stone Estate')
  expect(
    (
      decoded.ideas[1].configuration as {
        music: {
          _0: {
            tracks: Array<{
              providerID: string
              catalogID: string
              title: string
              artistName: string
              artworkURL: string
              duration: number
            }>
          }
        }
      }
    ).music._0.tracks[0]?.providerID
  ).toBe('apple-music')
  const track = (
    decoded.ideas[1].configuration as {
      music: {
        _0: {
          tracks: Array<{
            providerID: string
            catalogID: string
            title: string
            artistName: string
            artworkURL: string
            duration: number
          }>
        }
      }
    }
  ).music._0.tracks[0]
  expect(track?.catalogID).toBe('i.4YBN1YWf2a62bq9')
  expect(track?.title).toBe('BABYDOLL (Speed)')
  expect(track?.artistName).toBe('Ari Abdul')
  expect(track?.duration).toBe(156.651)
  expect(track?.artworkURL ?? '').toMatch(/^musicKit:\/\/artwork\/library\//)
})

test('App Review snapshot uses Foundation reference dates and valid UUIDs', () => {
  const archive = createReviewWorkspaceArchive({ users })

  expect(typeof archive.mainEventStartsAt).toBe('number')
  expect(archive.mainEventStartsAt > 0).toBeTruthy()
  expect('weddingDate' in archive).toBe(false)
  expect(archive.mainEventID).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )
  for (const participation of archive.eventParticipations) {
    expect(participation.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  }
})
