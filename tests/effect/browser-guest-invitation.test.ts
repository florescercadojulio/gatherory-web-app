import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError, PersistenceError } from '@/lib/domain-errors'
import {
  BrowserGuestRepo,
  type BrowserGuestRepoShape,
} from '@/server/events/repos/browser-guest.repo'
import {
  getBrowserGuestEventWorkflow,
  getBrowserGuestInvitationStatusWorkflow,
  joinBrowserGuestInvitationWorkflow,
  respondAsBrowserGuestWorkflow,
} from '@/server/events/workflows/browser-guest-invitation.workflow'

const identity = { id: 'f16370f1-7ab6-47a3-b91d-f44744dc98f7', credential: 'a'.repeat(43) }
const invitation = {
  title: 'Dinner',
  startsAt: new Date('2026-11-10T18:00:00Z').toISOString(),
  timeZone: 'America/Detroit',
  isAllDay: false,
  locationName: 'Library',
  role: 'guest' as const,
  status: 'pending' as const,
  expiresAt: null,
  requiresApproval: false,
  planningPermission: 'view_only' as const,
}
const event = {
  id: '8ce9c025-47d1-48ef-968d-2883b973a91d',
  title: 'Dinner',
  startsAt: invitation.startsAt,
  endsAt: null,
  isAllDay: false,
  timeZone: 'America/Detroit',
  locationName: 'Library',
  attendance: 'going' as const,
  name: 'Sam',
  canRespond: true,
}

function testLayer(overrides: Partial<BrowserGuestRepoShape> = {}) {
  const repo: BrowserGuestRepoShape = {
    register: (input) => Effect.succeed({ id: input.id, name: input.name }),
    verify: () => Effect.succeed({ id: identity.id, name: 'Sam' }),
    join: () => Effect.succeed({ eventId: event.id, role: 'guest', status: 'accepted' }),
    respond: (input) => Effect.succeed({ eventId: input.eventId, attendance: input.attendance }),
    getEvent: () => Effect.succeed(event),
    preview: () => Effect.succeed(invitation),
    getShareLinkEventId: () => Effect.succeed(event.id),
    ...overrides,
  }
  return Layer.succeed(BrowserGuestRepo, repo)
}

it.effect(
  'registers and joins through the existing guest capability using the stable identity',
  () => {
    const calls: string[] = []
    const layer = testLayer({
      verify: (input) => {
        calls.push(`verify:${input.guestId}:${input.credential}`)
        return Effect.fail(
          new ForbiddenError({ category: 'authorization', code: 'GUEST_SESSION_INVALID' })
        )
      },
      register: (input) => {
        calls.push(`register:${input.id}:${input.credential}`)
        return Effect.succeed({ id: input.id, name: input.name })
      },
      join: (input) => {
        calls.push(`join:${input.guestId}:${input.credential}:${input.token}`)
        return Effect.succeed({ eventId: event.id, role: 'guest', status: 'accepted' })
      },
    })
    return joinBrowserGuestInvitationWorkflow({
      identity,
      token: '14a417ea-e35a-4a48-b21f-b6f91d785606',
      name: 'Sam',
    }).pipe(
      Effect.provide(layer),
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result).toEqual({ eventId: event.id, joined: true })
          expect(calls).toEqual([
            `verify:${identity.id}:${identity.credential}`,
            `register:${identity.id}:${identity.credential}`,
            `join:${identity.id}:${identity.credential}:14a417ea-e35a-4a48-b21f-b6f91d785606`,
          ])
        })
      )
    )
  }
)

it.effect(
  'joins another event with the established name without re-registering the profile',
  () => {
    const calls: string[] = []
    const operation = joinBrowserGuestInvitationWorkflow({
      identity,
      token: '14a417ea-e35a-4a48-b21f-b6f91d785606',
      name: 'Sam',
    }).pipe(
      Effect.provide(
        testLayer({
          verify: () => Effect.succeed({ id: identity.id, name: 'Sam' }),
          register: () => {
            calls.push('register')
            return Effect.succeed({ id: identity.id, name: 'Sam' })
          },
          join: () => {
            calls.push('join')
            return Effect.succeed({ eventId: event.id, role: 'guest', status: 'accepted' })
          },
        })
      )
    )
    return operation.pipe(
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result).toEqual({ eventId: event.id, joined: true })
          expect(calls).toEqual(['join'])
        })
      )
    )
  }
)

it.effect(
  'respond verifies the same identity and writes only the requested event attendance',
  () => {
    const calls: string[] = []
    const layer = testLayer({
      verify: (input) => {
        calls.push(`verify:${input.guestId}:${input.credential}`)
        return Effect.succeed({ id: identity.id, name: 'Sam' })
      },
      respond: (input) => {
        calls.push(`respond:${input.guestId}:${input.eventId}:${input.attendance}`)
        return Effect.succeed({ eventId: input.eventId, attendance: input.attendance })
      },
    })
    return respondAsBrowserGuestWorkflow({
      identity,
      eventId: event.id,
      attendance: 'not_sure',
    }).pipe(
      Effect.provide(layer),
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result).toEqual({ eventId: event.id, attendance: 'not_sure' })
          expect(calls).toEqual([
            `verify:${identity.id}:${identity.credential}`,
            `respond:${identity.id}:${event.id}:not_sure`,
          ])
        })
      )
    )
  }
)

it.effect('reads an exact event through the own guest identity and returns no roster', () =>
  getBrowserGuestEventWorkflow({ identity, eventId: event.id }).pipe(
    Effect.provide(testLayer()),
    Effect.tap(({ event: result }) =>
      Effect.sync(() => {
        expect(result).toEqual(event)
        expect(JSON.stringify(result)).not.toContain('people')
        expect(JSON.stringify(result)).not.toContain('budget')
      })
    )
  )
)

it.effect('returns invitation status with the guest own RSVP', () =>
  getBrowserGuestInvitationStatusWorkflow({
    identity,
    token: '14a417ea-e35a-4a48-b21f-b6f91d785606',
  }).pipe(
    Effect.provide(testLayer()),
    Effect.tap((result) =>
      Effect.sync(() => {
        expect(result.invitation).toMatchObject({
          eventId: event.id,
          title: 'Dinner',
          role: 'guest',
        })
        expect(result.guest).toEqual({
          eventId: event.id,
          name: 'Sam',
          attendance: 'going',
          canRespond: true,
        })
        expect(result.identityName).toBe('Sam')
      })
    )
  )
)

it.effect('keeps unexpected exact-event read failures as retryable errors', () => {
  const failure = new PersistenceError({
    category: 'system',
    code: 'BROWSER_GUEST_EVENT_READ_FAILED',
    userMessageKey: 'serverErrors.SYSTEM',
  })
  return Effect.flip(
    getBrowserGuestInvitationStatusWorkflow({
      identity,
      token: '14a417ea-e35a-4a48-b21f-b6f91d785606',
    }).pipe(
      Effect.provide(
        testLayer({
          getEvent: () => Effect.fail(failure),
        })
      )
    )
  ).pipe(Effect.tap((error) => Effect.sync(() => expect(error).toBe(failure))))
})

it.effect(
  'returns the verified browser guest name before this identity joins the invited event',
  () =>
    getBrowserGuestInvitationStatusWorkflow({
      identity,
      token: '14a417ea-e35a-4a48-b21f-b6f91d785606',
    }).pipe(
      Effect.provide(testLayer({ getEvent: () => Effect.succeed(null) })),
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result.identityName).toBe('Sam')
          expect(result.guest).toBeNull()
          expect(result.invitation).toMatchObject({ status: 'pending' })
        })
      )
    )
)

it.effect('rejects a different name for an already registered browser guest', () => {
  const calls: string[] = []
  const operation = joinBrowserGuestInvitationWorkflow({
    identity,
    token: '14a417ea-e35a-4a48-b21f-b6f91d785606',
    name: 'Alex',
  }).pipe(
    Effect.provide(
      testLayer({
        verify: () => Effect.succeed({ id: identity.id, name: 'Sam' }),
        register: () => {
          calls.push('register')
          return Effect.succeed({ id: identity.id, name: 'Alex' })
        },
        join: () => {
          calls.push('join')
          return Effect.succeed({ eventId: event.id, role: 'guest', status: 'accepted' })
        },
      })
    )
  )
  return Effect.flip(operation).pipe(
    Effect.tap((error) =>
      Effect.sync(() => {
        expect(error).toMatchObject({
          _tag: 'ConflictError',
          code: 'BROWSER_GUEST_NAME_MISMATCH',
        })
        expect(calls).toEqual([])
      })
    )
  )
})
