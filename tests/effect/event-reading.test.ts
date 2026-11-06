import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import type { ParticipantRole } from '@/lib/permissions'
import { EventRepo } from '@/server/events/repos/event.repo.contract'
import {
  EventReadingRepo,
  type EventReadingProjection,
} from '@/server/events/repos/event-reading.repo'
import { EventAuthorizationLive } from '@/server/events/services/event-authorization.service'
import { getEventReadingWorkflow } from '@/server/events/workflows/event-reading.workflow'

function projection(): EventReadingProjection {
  return {
    event: {
      id: 'selected-event',
      title: 'Selected event',
      description: 'Plan together',
      startsAt: null,
      endsAt: null,
      timeZone: 'America/New_York',
      isAllDay: false,
      locationName: null,
      version: 1,
    },
    attendance: { value: 'pending', canRespond: false },
    people: [],
    schedule: [],
    tasks: [],
    notes: [],
    truncated: { people: false, schedule: false, tasks: false, notes: false },
    lifecycle: {
      status: 'ongoing',
      planningStatus: null,
      completionStatus: 'upcoming',
      parentStatus: null,
      snapshotAvailable: true,
      eventVersionAvailable: true,
    },
  }
}

function layer(
  role: ParticipantRole,
  permission: 'manage' | 'contribute' | 'view_only',
  value = projection(),
  onRead = () => {}
) {
  return Layer.mergeAll(
    Layer.mock(EventRepo, {
      getEventParticipant: () => Effect.succeed({ role, planningPermission: permission }),
    }),
    EventAuthorizationLive,
    Layer.succeed(EventReadingRepo, {
      read: () => {
        onRead()
        return Effect.succeed(value)
      },
    })
  )
}

it.effect(
  'read-only collaborators retain scoped reading and own attendance without planner writes',
  () =>
    Effect.gen(function* () {
      const result = yield* getEventReadingWorkflow({
        userId: 'viewer',
        eventId: 'selected-event',
      }).pipe(Effect.provide(layer('collaborator', 'view_only')))
      expect(result.permissions).toMatchObject({
        canReadTasks: true,
        canReadNotes: true,
        canRespond: true,
        canCompleteTasks: false,
        canCreateNotes: false,
        canEditDetails: false,
      })
      expect(result.isReadOnly).toBe(true)
      expect(result).not.toHaveProperty('lifecycle')
    })
)

it.effect('guest planning access is denied before private section reads', () =>
  Effect.gen(function* () {
    let read = false
    const result = yield* Effect.flip(
      getEventReadingWorkflow({ userId: 'guest', eventId: 'selected-event' }).pipe(
        Effect.provide(
          layer('guest', 'view_only', projection(), () => {
            read = true
          })
        )
      )
    )
    expect(result).toMatchObject({ code: 'EVENT_PLANNING_REQUIRED' })
    expect(read).toBe(false)
  })
)

it.effect('closed parent lifecycle disables all updates without exposing parent metadata', () =>
  Effect.gen(function* () {
    const data = projection()
    data.lifecycle.parentStatus = 'cancelled'
    const result = yield* getEventReadingWorkflow({
      userId: 'host',
      eventId: 'selected-event',
    }).pipe(Effect.provide(layer('host', 'manage', data)))
    expect(result.permissions).toMatchObject({
      canRespond: false,
      canCompleteTasks: false,
      canCreateNotes: false,
      canEditDetails: false,
    })
    expect(result.isReadOnly).toBe(true)
    expect(result).not.toHaveProperty('lifecycle')
  })
)

it.effect(
  'a canonical event without a compatible native snapshot is readable but cannot emit unsynchronized writes',
  () =>
    Effect.gen(function* () {
      const data = projection()
      data.lifecycle.snapshotAvailable = false
      const result = yield* getEventReadingWorkflow({
        userId: 'host',
        eventId: 'selected-event',
      }).pipe(Effect.provide(layer('host', 'manage', data)))
      expect(result.permissions.canRespond).toBe(true)
      expect(result.permissions.canCreateNotes).toBe(false)
      expect(result.permissions.canCompleteTasks).toBe(false)
      expect(result.permissions.canEditDetails).toBe(false)
    })
)
