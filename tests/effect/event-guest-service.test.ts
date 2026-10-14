import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { guestIdeaContent } from '@/lib/guest-invitation-content'
import { EventInvitationArtwork } from '@/server/events/connectors/event-invitation-artwork.con'
import { EventGuestRepo, type EventGuestRepoShape } from '@/server/events/repos/event-guest.repo'
import { EventGuestService } from '@/server/events/services/event-guest.service'
import { EventGuestServiceLive } from '@/server/events/services/event-guest.service.live'

type InvitationProjections = Effect.Success<
  ReturnType<EventGuestRepoShape['listInvitationProjections']>
>

const emptyProjection = {
  id: 'event-1',
  parentEventId: null,
  title: 'Dinner',
  startsAt: null,
  endsAt: null,
  isAllDay: false,
  timeZone: 'UTC',
  locationName: null,
  locationAddress: null,
  locationAddressLine2: null,
  latitude: null,
  longitude: null,
  mapItemIdentifier: null,
  description: null,
  dressCode: null,
  status: 'planned',
  complete: 'upcoming',
  viewerPersonId: 'person-1',
  role: 'guest',
  attendance: 'going',
  coverAsset: null,
  people: [],
  ideas: [],
  moments: [],
} satisfies InvitationProjections[number]

function dependencies(
  projections: InvitationProjections,
  sign: (asset: { bucket: string; storageKey: string }) => Effect.Effect<string, unknown>
) {
  const repo = {
    listInvitationProjections: () => Effect.succeed(projections),
    getInvitationCoverAsset: () => Effect.succeed(null),
    respondToEvent: () => Effect.succeed({ eventId: 'event-1', attendance: 'going' as const }),
    leaveGuestEvent: () => Effect.succeed({ eventId: 'event-1' }),
  } satisfies EventGuestRepoShape

  return EventGuestServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(EventGuestRepo, repo),
        Layer.succeed(EventInvitationArtwork, { sign })
      )
    )
  )
}

it.effect('does not call the artwork connector when projections have no artwork', () => {
  let signCount = 0
  const service = dependencies([emptyProjection], () =>
    Effect.sync(() => {
      signCount += 1
      return 'https://signed.example/unexpected'
    })
  )

  return Effect.gen(function* () {
    const guests = yield* EventGuestService
    const result = yield* guests.listInvitations('viewer-1')
    expect(signCount).toBe(0)
    expect(result[0]).toMatchObject({ coverURL: null, coverId: null, ideas: [], moments: [] })
  }).pipe(Effect.provide(service))
})

it.effect('keeps the invitation response shape and artwork order while signing assets', () => {
  const projection = {
    ...emptyProjection,
    coverAsset: { id: 'cover-1', bucket: 'private', storageKey: 'cover.webp' },
    ideas: [
      {
        id: 'idea-1',
        category: 'other',
        title: 'Walk',
        note: '',
        submittedByUserId: 'author-1',
        ...guestIdeaContent('other', {}),
        imageAsset: { id: 'idea-cover-1', bucket: 'private', storageKey: 'idea.webp' },
      },
    ],
    moments: [
      {
        id: 'moment-1',
        addedAt: '2026-10-14T12:00:00Z',
        addedBy: 'Host',
        addedByUserId: 'host-1',
        imageAsset: {
          id: 'moment-1',
          bucket: 'private',
          storageKey: 'moment.webp',
          addedAt: new Date('2026-10-14T12:00:00Z'),
          addedBy: 'Host',
          addedByUserId: 'host-1',
        },
      },
    ],
  } satisfies InvitationProjections[number]
  const signed: string[] = []
  const service = dependencies([projection], (asset) =>
    Effect.sync(() => {
      signed.push(asset.storageKey)
      return `https://signed.example/${asset.storageKey}`
    })
  )

  return Effect.gen(function* () {
    const guests = yield* EventGuestService
    const [result] = yield* guests.listInvitations('viewer-1')
    expect(signed).toEqual(['idea.webp', 'moment.webp', 'cover.webp'])
    expect(result.coverURL).toBe('https://signed.example/cover.webp')
    expect(result.coverId).toBe('cover-1')
    expect(result.ideas[0]).toMatchObject({
      id: 'idea-1',
      imageURL: 'https://signed.example/idea.webp',
      imageId: 'idea-cover-1',
    })
    expect(result.moments[0]).toMatchObject({
      id: 'moment-1',
      imageURL: 'https://signed.example/moment.webp',
    })
    expect(JSON.stringify(result)).not.toContain('storageKey')
    expect(JSON.stringify(result)).not.toContain('bucket')
  }).pipe(Effect.provide(service))
})

it.effect('falls back to null artwork URLs when signing fails', () => {
  const projection = {
    ...emptyProjection,
    coverAsset: { id: 'cover-1', bucket: 'private', storageKey: 'cover.webp' },
    ideas: [
      {
        id: 'idea-1',
        category: 'other',
        title: 'Walk',
        note: '',
        submittedByUserId: null,
        ...guestIdeaContent('other', {}),
        imageAsset: { id: 'idea-cover-1', bucket: 'private', storageKey: 'idea.webp' },
      },
    ],
    moments: [],
  } satisfies InvitationProjections[number]
  const service = dependencies([projection], () => Effect.fail(new Error('storage offline')))

  return Effect.gen(function* () {
    const guests = yield* EventGuestService
    const [result] = yield* guests.listInvitations('viewer-1')
    expect(result.coverURL).toBeNull()
    expect(result.ideas[0].imageURL).toBeNull()
    expect(result.ideas[0].imageId).toBe('idea-cover-1')
  }).pipe(Effect.provide(service))
})

it.effect('returns no invitations when no authorized event projections are available', () => {
  const repo = {
    listInvitationProjections: () => Effect.succeed([]),
    getInvitationCoverAsset: () => Effect.succeed(null),
    respondToEvent: () => Effect.succeed({ eventId: 'event-1', attendance: 'going' as const }),
    leaveGuestEvent: () => Effect.succeed({ eventId: 'event-1' }),
  } satisfies EventGuestRepoShape
  const service = EventGuestServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(EventGuestRepo, repo),
        Layer.succeed(EventInvitationArtwork, {
          sign: () => Effect.succeed('https://signed.example/image'),
        })
      )
    )
  )

  return Effect.gen(function* () {
    const guests = yield* EventGuestService
    const result = yield* guests.listInvitations('stranger')
    expect(result).toEqual([])
  }).pipe(Effect.provide(service))
})
