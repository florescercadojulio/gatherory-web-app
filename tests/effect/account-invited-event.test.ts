import { it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { expect } from 'vitest'
import {
  EventGuestService,
  type GuestInvitation,
} from '@/server/events/services/event-guest.service'
import { getAccountInvitedEventWorkflow } from '@/server/events/workflows/account-invited-event.workflow'

function invitation(overrides: Partial<GuestInvitation> = {}): GuestInvitation {
  return {
    id: crypto.randomUUID(),
    parentEventId: null,
    title: 'Dinner together',
    startsAt: null,
    endsAt: null,
    isAllDay: false,
    timeZone: 'America/New_York',
    locationName: 'Garden',
    locationAddress: 'Private address',
    locationAddressLine2: null,
    latitude: null,
    longitude: null,
    mapItemIdentifier: null,
    description: 'Private description omitted from this surface',
    dressCode: null,
    status: 'ongoing',
    complete: 'upcoming',
    viewerPersonId: crypto.randomUUID(),
    role: 'guest',
    attendance: 'going',
    attendanceOpen: true,
    coverURL: null,
    coverId: null,
    people: [],
    ideas: [],
    guides: [],
    moments: [],
    ...overrides,
  }
}

const service = (invitations: GuestInvitation[]) =>
  Layer.succeed(EventGuestService, {
    listInvitations: () => Effect.succeed(invitations),
    listDeviceGuestInvitations: () => Effect.succeed([]),
    invitationCoverURL: () => Effect.succeed(null),
    respondToEvent: () => Effect.die('unexpected attendance mutation'),
    leaveGuestEvent: () => Effect.die('unexpected removal'),
  })

it.effect(
  'invitation continuation reads only its exact authorized event and allowlisted fields',
  () =>
    Effect.gen(function* () {
      const authorized = invitation()
      const result = yield* getAccountInvitedEventWorkflow({
        userId: 'account-id',
        name: 'Alex',
        eventId: authorized.id,
      }).pipe(Effect.provide(service([authorized])))
      expect(result.event).toMatchObject({ id: authorized.id, name: 'Alex', attendance: 'going' })
      expect(result.event?.canRespond).toBe(true)
      expect(result.planningEventId).toBeNull()
      expect(result.event).not.toHaveProperty('people')
      expect(result.event).not.toHaveProperty('description')
      expect(result.event).not.toHaveProperty('locationAddress')
      expect(result.event).not.toHaveProperty('parentEventId')
      const missing = yield* getAccountInvitedEventWorkflow({
        userId: 'account-id',
        name: 'Alex',
        eventId: crypto.randomUUID(),
      }).pipe(Effect.provide(service([authorized])))
      expect(missing.event).toBeNull()
    })
)

it.effect(
  'child-only continuation does not infer parent access, and closed events cannot show response controls',
  () =>
    Effect.gen(function* () {
      const parentId = crypto.randomUUID()
      const child = invitation({
        parentEventId: parentId,
        status: 'finished',
        attendanceOpen: false,
      })
      const result = yield* getAccountInvitedEventWorkflow({
        userId: 'child-only',
        name: 'Sam',
        eventId: child.id,
      }).pipe(Effect.provide(service([child])))
      expect(result.event?.canRespond).toBe(false)
      const archived = invitation({ attendanceOpen: false })
      const archivedResult = yield* getAccountInvitedEventWorkflow({
        userId: 'archived-guest',
        name: 'Lee',
        eventId: archived.id,
      }).pipe(Effect.provide(service([archived])))
      expect(archivedResult.event?.canRespond).toBe(false)
      expect(JSON.stringify(result)).not.toContain(parentId)
      const parent = yield* getAccountInvitedEventWorkflow({
        userId: 'child-only',
        name: 'Sam',
        eventId: parentId,
      }).pipe(Effect.provide(service([child])))
      expect(parent.event).toBeNull()
    })
)

it.effect(
  'planner invitation continuation targets the authorized child without parent context',
  () =>
    Effect.gen(function* () {
      const parentEventId = crypto.randomUUID()
      const child = invitation({ parentEventId, role: 'collaborator' })
      const result = yield* getAccountInvitedEventWorkflow({
        userId: 'child-only-planner',
        name: 'Alex',
        eventId: child.id,
      }).pipe(Effect.provide(service([child])))
      expect(result.planningEventId).toBe(child.id)
      expect(JSON.stringify(result)).not.toContain(parentEventId)
    })
)
