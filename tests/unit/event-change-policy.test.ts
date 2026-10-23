import { describe, expect, test } from 'vitest'
import {
  eventChangeDispatchAllowed,
  eventChangeKind,
  type EventChangeState,
} from '@/server/notifications/services/event-change-policy'

const root = (overrides: Partial<EventChangeState> = {}): EventChangeState => ({
  id: 'root-event',
  parentEventId: null,
  status: 'ongoing',
  planningStatus: null,
  completionStatus: 'upcoming',
  startsAt: new Date('2030-05-01T16:00:00Z'),
  endsAt: null,
  schedulingState: 'scheduled',
  isAllDay: false,
  timeZone: 'America/Detroit',
  locationName: null,
  locationAddress: null,
  locationAddressLine2: null,
  locationLatitude: null,
  locationLongitude: null,
  mapItemIdentifier: null,
  ...overrides,
})

const child = (overrides: Partial<EventChangeState> = {}): EventChangeState => ({
  ...root(),
  id: 'child-event',
  parentEventId: 'root-event',
  status: null,
  planningStatus: 'approved',
  ...overrides,
})

describe('automatic event-change policy', () => {
  test('classifies date and location changes only for live events', () => {
    const before = root()
    expect(eventChangeKind(before, root({ startsAt: new Date('2030-05-01T17:00:00Z') }))).toBe(
      'schedule'
    )
    expect(eventChangeKind(before, root({ locationAddress: '100 Main St' }))).toBe('location')
    expect(
      eventChangeKind(
        before,
        root({ startsAt: new Date('2030-05-01T17:00:00Z'), locationAddress: '100 Main St' })
      )
    ).toBe('schedule_and_location')
    expect(eventChangeKind(root({ status: 'draft' }), root())).toBe(null)
    expect(
      eventChangeKind(root(), root({ status: 'finished', completionStatus: 'complete' }))
    ).toBe(null)
  })

  test('keeps child edits quiet until approved under a live root', () => {
    const before = child({ planningStatus: 'draft' })
    const after = child({ planningStatus: 'approved', locationName: 'Venue' })
    expect(eventChangeKind(before, after, root(), root())).toBe(null)
    expect(
      eventChangeKind(
        child(),
        child({ locationName: 'Venue' }),
        root({ status: 'draft' }),
        root({ status: 'draft' })
      )
    ).toBe(null)
    expect(eventChangeKind(child(), child({ locationName: 'Venue' }), root(), root())).toBe(
      'location'
    )
    expect(
      eventChangeKind(
        child(),
        child({ locationName: 'Venue' }),
        root({ id: 'wrong-parent' }),
        root({ id: 'wrong-parent' })
      )
    ).toBe(null)
  })

  test('classifies cancellation and reopening only from an eligible lifecycle', () => {
    expect(eventChangeKind(root(), root({ status: 'cancelled' }))).toBe('cancelled')
    expect(eventChangeKind(root({ status: 'draft' }), root({ status: 'cancelled' }))).toBe(null)
    expect(eventChangeKind(root({ status: 'cancelled' }), root())).toBe('reopened')
    expect(
      eventChangeKind(
        child({ planningStatus: 'cancelled' }),
        child({ planningStatus: 'approved' }),
        root(),
        root()
      )
    ).toBe('reopened')
    expect(
      eventChangeKind(
        child({ planningStatus: 'cancelled' }),
        child({ planningStatus: 'approved' }),
        root({ status: 'draft' }),
        root({ status: 'draft' })
      )
    ).toBe(null)
    expect(
      eventChangeKind(
        child(),
        child({ planningStatus: 'cancelled' }),
        root(),
        root({ status: 'draft' })
      )
    ).toBe(null)
    expect(
      eventChangeKind(
        child({ planningStatus: 'cancelled', completionStatus: 'complete' }),
        child({ planningStatus: 'approved', completionStatus: 'upcoming' }),
        root(),
        root()
      )
    ).toBe(null)
  })

  test('dispatch rechecks current root and event state while honoring cancellation', () => {
    expect(eventChangeDispatchAllowed(root(), root(), 'schedule')).toBe(true)
    expect(
      eventChangeDispatchAllowed(root({ status: 'draft' }), root({ status: 'draft' }), 'schedule')
    ).toBe(false)
    expect(eventChangeDispatchAllowed(root({ status: 'cancelled' }), undefined, 'cancelled')).toBe(
      true
    )
    expect(eventChangeDispatchAllowed(root({ status: 'cancelled' }), undefined, 'reopened')).toBe(
      false
    )
    expect(eventChangeDispatchAllowed(child(), root(), undefined)).toBe(true)
    expect(eventChangeDispatchAllowed(child(), root({ status: 'draft' }), undefined)).toBe(false)
    expect(eventChangeDispatchAllowed(child(), root({ id: 'wrong-parent' }), undefined)).toBe(false)
  })
})
