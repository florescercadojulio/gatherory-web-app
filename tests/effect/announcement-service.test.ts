import { expect, it } from '@effect/vitest'
import { Effect, Layer, Result } from 'effect'
import {
  AnnouncementRepository,
  type AnnouncementRepositoryShape,
} from '@/server/announcements/repos/announcement.repo.contract'
import { AnnouncementServiceLive } from '@/server/announcements/services/announcement.service.live'
import {
  listAnnouncementsWorkflow,
  sendAnnouncementWorkflow,
} from '@/server/announcements/workflows/announcement.workflows'
import { ForbiddenError } from '@/lib/domain-errors'

const eventId = '7bcc6c2a-cc96-42cc-aab2-305771a2ce37'
const requestId = 'b2027174-07b7-49ae-b55a-f89993decb16'
const announcement = {
  id: requestId,
  eventId,
  message: 'Meet upstairs.',
  audience: 'all' as const,
  authorId: 'host-user',
  authorName: 'Host' as const,
  createdAt: '2026-10-20T12:00:00.000Z',
}
function fixture(overrides: Partial<AnnouncementRepositoryShape> = {}) {
  const sent: Parameters<AnnouncementRepositoryShape['send']>[0][] = []
  const reads: Parameters<AnnouncementRepositoryShape['list']>[0][] = []
  const layer = AnnouncementServiceLive.pipe(
    Layer.provide(
      Layer.succeed(AnnouncementRepository, {
        list: (input) =>
          Effect.sync(() => {
            reads.push(input)
            return {
              announcements: [announcement],
              canSend: input.actor.kind === 'user',
              allowedAudiences: input.actor.kind === 'user' ? ['all', 'planning', 'guests'] : [],
            }
          }),
        send: (input) =>
          Effect.sync(() => {
            sent.push(input)
            return announcement
          }),
        ...overrides,
      })
    )
  )
  return { layer, sent, reads }
}

it.effect(
  'validates before persistence and preserves the actor/event/receipt during trimming',
  () => {
    const { layer, sent } = fixture()
    return Effect.gen(function* () {
      const result = yield* sendAnnouncementWorkflow({
        eventId: eventId.toUpperCase(),
        requestId,
        userId: 'host',
        message: '  Meet upstairs.\n',
      })
      expect(result).toEqual(announcement)
      expect(sent).toEqual([
        { eventId, requestId, userId: 'host', message: 'Meet upstairs.', audience: 'all' },
      ])
      const invalid = yield* Effect.result(
        sendAnnouncementWorkflow({ eventId, requestId, userId: 'host', message: ' ' })
      )
      expect(Result.isFailure(invalid)).toBe(true)
      expect(sent).toHaveLength(1)
    }).pipe(Effect.provide(layer))
  }
)

it.effect('preserves exact device identity and never adds a planning grant to a read', () => {
  const { layer, reads, sent } = fixture()
  return Effect.gen(function* () {
    const result = yield* listAnnouncementsWorkflow({
      eventId,
      actor: { kind: 'device_guest', id: 'verified-guest' },
    })
    expect(result).toEqual({ announcements: [announcement], canSend: false, allowedAudiences: [] })
    expect(reads).toEqual([{ eventId, actor: { kind: 'device_guest', id: 'verified-guest' } }])
    expect(sent).toEqual([])
  }).pipe(Effect.provide(layer))
})

it.effect('preserves the explicitly chosen audience through validation and persistence', () => {
  const { layer, sent } = fixture()
  return Effect.gen(function* () {
    yield* sendAnnouncementWorkflow({
      eventId,
      requestId,
      userId: 'collaborator',
      message: 'Planning only',
      audience: 'planning',
    })
    expect(sent).toEqual([
      {
        eventId,
        requestId,
        userId: 'collaborator',
        message: 'Planning only',
        audience: 'planning',
      },
    ])
  }).pipe(Effect.provide(layer))
})

it.effect('keeps authorization failures typed through the service boundary', () => {
  const failure = new ForbiddenError({
    category: 'authorization',
    code: 'EVENT_ANNOUNCEMENT_FORBIDDEN',
  })
  const { layer } = fixture({ send: () => Effect.fail(failure) })
  return Effect.gen(function* () {
    const result = yield* Effect.result(
      sendAnnouncementWorkflow({ eventId, requestId, userId: 'collaborator', message: 'Update' })
    )
    expect(Result.isFailure(result)).toBe(true)
    if (Result.isFailure(result)) expect(result.failure).toBe(failure)
  }).pipe(Effect.provide(layer))
})
