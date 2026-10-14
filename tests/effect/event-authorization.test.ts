import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import type { EventPermissions } from '@/lib/permissions'
import { EventRepositoryError } from '@/server/events/errors'
import { ensureEventPermission } from '@/server/events/authorization'
import { EventRepo } from '@/server/events/repos/event.repo.contract'
import { EventAuthorizationLive } from '@/server/events/services/event-authorization.service'

const eventId = 'event-1'
const userId = 'user-1'

const provide =
  (
    participant:
      | {
          role: 'host' | 'collaborator' | 'guest'
          planningPermission: 'manage' | 'contribute' | 'view_only'
        }
      | undefined,
    onLookup?: (input: { eventId: string; userId: string }) => void
  ) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    effect.pipe(
      Effect.provide(
        Layer.mock(EventRepo, {
          getEventParticipant: (input) => {
            onLookup?.(input)
            return Effect.succeed(participant)
          },
        })
      ),
      Effect.provide(EventAuthorizationLive)
    )

const input = { eventId, userId }

it.effect('allows a host to manage the event', () =>
  Effect.gen(function* () {
    const access = yield* ensureEventPermission({ event: ['update'] }, input)
    expect(access).toEqual({ role: 'host', planningPermission: 'manage' })
  }).pipe(provide({ role: 'host', planningPermission: 'manage' }))
)

for (const [planningPermission, permission] of [
  ['manage', { media: ['manage'] }],
  ['contribute', { idea: ['create'] }],
  ['view_only', { event: ['read'] }],
] as const satisfies ReadonlyArray<['manage' | 'contribute' | 'view_only', EventPermissions]>) {
  it.effect(`applies collaborator ${planningPermission} permissions`, () =>
    Effect.gen(function* () {
      const access = yield* ensureEventPermission(permission, input)
      expect(access).toEqual({
        role: 'collaborator',
        planningPermission: planningPermission === 'view_only' ? 'viewOnly' : planningPermission,
      })
    }).pipe(provide({ role: 'collaborator', planningPermission }))
  )
}

it.effect('allows guests to read and respond to attendance', () =>
  Effect.gen(function* () {
    const access = yield* ensureEventPermission({ event: ['read'], attendance: ['respond'] }, input)
    expect(access).toEqual({ role: 'guest', planningPermission: 'viewOnly' })
  }).pipe(provide({ role: 'guest', planningPermission: 'view_only' }))
)

for (const permission of [
  { event: ['update'] },
  { media: ['upload'] },
] satisfies EventPermissions[]) {
  it.effect(`denies guest planning permission ${JSON.stringify(permission)}`, () =>
    Effect.gen(function* () {
      const failure = yield* Effect.flip(ensureEventPermission(permission, input))
      expect(failure).toMatchObject({ code: 'EVENT_PERMISSION_REQUIRED' })
    }).pipe(provide({ role: 'guest', planningPermission: 'manage' }))
  )
}

it.effect('rejects a user without event participation', () =>
  Effect.gen(function* () {
    const failure = yield* Effect.flip(ensureEventPermission({ event: ['read'] }, input))
    expect(failure).toMatchObject({ code: 'EVENT_PARTICIPANT_REQUIRED' })
  }).pipe(provide(undefined))
)

it.effect('looks up the supplied event and user IDs', () => {
  let requested: { eventId: string; userId: string } | undefined
  return Effect.gen(function* () {
    yield* ensureEventPermission(
      { event: ['read'] },
      { eventId: 'requested-event', userId: 'requested-user' }
    )
    expect(requested).toEqual({ eventId: 'requested-event', userId: 'requested-user' })
  }).pipe(
    provide({ role: 'guest', planningPermission: 'view_only' }, (lookup) => {
      requested = lookup
    })
  )
})

it.effect('provider failures remain failures rather than authorization grants', () => {
  const failure = new EventRepositoryError({ category: 'system', code: 'EVENT_LOOKUP_FAILED' })
  return Effect.gen(function* () {
    expect(yield* Effect.flip(ensureEventPermission({ event: ['read'] }, input))).toBe(failure)
  }).pipe(
    Effect.provide(
      Layer.mock(EventRepo, {
        getEventParticipant: () => Effect.fail(failure),
      })
    ),
    Effect.provide(EventAuthorizationLive)
  )
})

it.effect('rejects an empty permission declaration without looking up participation', () => {
  let lookedUp = false
  const program = ensureEventPermission({ event: [] }, input).pipe(
    Effect.provide(
      Layer.mock(EventRepo, {
        getEventParticipant: () => {
          lookedUp = true
          return Effect.succeed({ role: 'host', planningPermission: 'manage' })
        },
      })
    ),
    Effect.provide(EventAuthorizationLive)
  )

  return Effect.gen(function* () {
    const failure = yield* Effect.flip(program)
    expect(failure).toMatchObject({ code: 'EVENT_PERMISSION_REQUIRED' })
    expect(lookedUp).toBe(false)
  })
})

for (const planningPermission of ['contribute', 'view_only'] as const) {
  it.effect(`denies participant management for ${planningPermission} collaborators`, () =>
    Effect.gen(function* () {
      const failure = yield* Effect.flip(
        ensureEventPermission({ event: ['manage_participants'] }, input)
      )
      expect(failure).toMatchObject({ code: 'EVENT_PERMISSION_REQUIRED' })
    }).pipe(provide({ role: 'collaborator', planningPermission }))
  )
}

it.effect('requires every declared resource/action, not just an allowed subset', () =>
  Effect.gen(function* () {
    const failure = yield* Effect.flip(
      ensureEventPermission({ event: ['read'], media: ['upload'] }, input)
    )
    expect(failure).toMatchObject({ code: 'EVENT_PERMISSION_REQUIRED' })
  }).pipe(provide({ role: 'guest', planningPermission: 'view_only' }))
)
