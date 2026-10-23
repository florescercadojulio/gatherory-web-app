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
  expect(decoded.members.find((person) => person.userID === users[4].id)?.planningPermission).toBe(
    'manage'
  )
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
  expect(decoded.mainEventLocation).toMatchObject({
    placeName: 'Leila Arboretum',
    address: '928 Michigan Ave W, Battle Creek, MI  49037, United States',
    shortAddress: '928 Michigan Ave W, Battle Creek',
    latitude: 42.3351401,
    longitude: -85.2133352,
    mapItemIdentifier: 'I23C0AE2C81FA20E5',
  })
  const tracks = (
    decoded.ideas[1].configuration as {
      music: {
        _0: {
          tracks: Array<{
            providerID: string
            catalogID: string
            title: string
            artistName: string
            artworkURL: string | null
            duration: number
          }>
        }
      }
    }
  ).music._0.tracks
  expect(tracks).toHaveLength(4)
  expect(
    tracks.map(({ providerID, catalogID, title, artistName, duration }) => ({
      providerID,
      catalogID,
      title,
      artistName,
      duration,
    }))
  ).toEqual([
    {
      providerID: 'apple-music',
      catalogID: 'i.4YBN1YWf2a62bq9',
      title: 'BABYDOLL (Speed)',
      artistName: 'Ari Abdul',
      duration: 156.651,
    },
    {
      providerID: 'apple-music',
      catalogID: 'i.ldDQxgmf8gp8kM7',
      title: 'BAILE INoLVIDABLE',
      artistName: 'Bad Bunny',
      duration: 367.725,
    },
    {
      providerID: 'apple-music',
      catalogID: 'i.RBrxbNxT1rk1dGm',
      title: 'VUELVE CANDY B',
      artistName: 'Bad Bunny',
      duration: 266.171,
    },
    {
      providerID: 'apple-music',
      catalogID: 'i.XMDVeZXSv87vQoq',
      title: "I'm Fine (feat. Cherry Lena) [IMANU Remix]",
      artistName: 'Apashe & High Klassified',
      duration: 243.977,
    },
  ])
  expect(tracks[0]?.artworkURL ?? '').toMatch(/^musicKit:\/\/artwork\/library\//)
  expect(tracks.slice(1).map((track) => track.artworkURL)).toEqual([null, null, null])
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

test('App Review catering expense uses the native expense category rather than the idea category', () => {
  const archive = createReviewWorkspaceArchive({ users })
  const decoded = JSON.parse(
    Buffer.from(encodeNativeWorkspaceSnapshot(archive), 'base64').toString('utf8')
  ) as typeof archive

  expect(
    decoded.eventExpenses.find(
      (expense) => expense.id === reviewWorkspaceIds.planning.receptionExpense
    )?.category
  ).toBe('foodAndDrink')
  expect(
    decoded.ideas.find((idea) => idea.id === reviewWorkspaceIds.planning.foodIdea)?.category
  ).toBe('food')
})
