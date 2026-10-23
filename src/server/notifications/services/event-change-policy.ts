import type { EventChangeKind } from '../contracts/notification.contracts'

/** Canonical event fields used to decide whether an automatic change alert is warranted. */
export type EventChangeState = {
  id: string
  parentEventId: string | null
  status: string | null
  planningStatus: string | null
  completionStatus: string
  startsAt: Date | null
  endsAt: Date | null
  schedulingState: string
  isAllDay: boolean
  timeZone: string
  locationName: string | null
  locationAddress: string | null
  locationAddressLine2: string | null
  locationLatitude: number | null
  locationLongitude: number | null
  mapItemIdentifier: string | null
}

const scheduleFields = ['startsAt', 'endsAt', 'schedulingState', 'isAllDay', 'timeZone'] as const

const locationFields = [
  'locationName',
  'locationAddress',
  'locationAddressLine2',
  'locationLatitude',
  'locationLongitude',
  'mapItemIdentifier',
] as const

function fieldsChanged(
  before: EventChangeState,
  after: EventChangeState,
  fields: readonly (keyof EventChangeState)[]
) {
  return fields.some((key) => {
    const previous = before[key]
    const current = after[key]
    if (previous instanceof Date && current instanceof Date) {
      return previous.getTime() !== current.getTime()
    }
    return !Object.is(previous, current)
  })
}

function rootIsLive(root: EventChangeState | undefined, child?: EventChangeState) {
  return (
    root?.parentEventId === null &&
    (!child || root.id === child.parentEventId) &&
    root.status === 'ongoing' &&
    root.completionStatus === 'upcoming'
  )
}

function eventIsLive(event: EventChangeState) {
  return (
    event.completionStatus === 'upcoming' &&
    (event.parentEventId === null
      ? event.status === 'ongoing'
      : event.planningStatus === 'approved')
  )
}

function eventIsCancelled(event: EventChangeState) {
  return event.parentEventId === null
    ? event.status === 'cancelled'
    : event.planningStatus === 'cancelled'
}

function becameCancelled(before: EventChangeState, after: EventChangeState) {
  return !eventIsCancelled(before) && eventIsCancelled(after)
}

function reopened(before: EventChangeState, after: EventChangeState) {
  return before.completionStatus === 'upcoming' && eventIsCancelled(before) && eventIsLive(after)
}

/**
 * Classifies an already-materialized event mutation. Draft and terminal edits are quiet;
 * status-only transitions become alerts only for cancellation and reopening.
 */
export function eventChangeKind(
  before: EventChangeState,
  after: EventChangeState,
  beforeRoot?: EventChangeState,
  afterRoot?: EventChangeState
): EventChangeKind | null {
  if (before.id !== after.id || before.parentEventId !== after.parentEventId) return null

  const isRoot = after.parentEventId === null
  const priorRoot = isRoot ? before : beforeRoot
  const currentRoot = isRoot ? after : afterRoot
  const rootWasLive = rootIsLive(priorRoot, isRoot ? undefined : before)
  const rootIsCurrentlyLive = rootIsLive(currentRoot, isRoot ? undefined : after)

  if (becameCancelled(before, after)) {
    const wasEligible = eventIsLive(before) && (isRoot || (rootWasLive && rootIsCurrentlyLive))
    const remainsInUpcomingLifecycle = after.completionStatus === 'upcoming'
    return wasEligible && remainsInUpcomingLifecycle ? 'cancelled' : null
  }

  if (reopened(before, after)) {
    const parentWasLive = isRoot || rootWasLive
    return parentWasLive && rootIsCurrentlyLive ? 'reopened' : null
  }

  if (!eventIsLive(before) || !eventIsLive(after) || !rootWasLive || !rootIsCurrentlyLive) {
    return null
  }

  const scheduleChanged = fieldsChanged(before, after, scheduleFields)
  const locationChanged = fieldsChanged(before, after, locationFields)
  if (scheduleChanged && locationChanged) return 'schedule_and_location'
  if (scheduleChanged) return 'schedule'
  if (locationChanged) return 'location'
  return null
}

/** Revalidates the captured event-change intent against current canonical lifecycle state. */
export function eventChangeDispatchAllowed(
  event: EventChangeState,
  root: EventChangeState | undefined,
  kind: EventChangeKind | null | undefined
) {
  const isRoot = event.parentEventId === null
  const currentRoot = isRoot ? event : root
  const parentAllowsDispatch = isRoot || rootIsLive(currentRoot, event)

  if (kind === 'cancelled') {
    return eventIsCancelled(event) && event.completionStatus === 'upcoming' && parentAllowsDispatch
  }

  if (kind === 'reopened') {
    return eventIsLive(event) && parentAllowsDispatch
  }

  // Older intents have no reason tag, so treat them as ordinary detail-change alerts.
  return eventIsLive(event) && parentAllowsDispatch
}
