import { describe, expect, test } from 'vitest'
import { listUpcomingWorkspaceSessions } from '@/lib/workspace-overview'
import { isUpcomingWorkspaceEvent } from '@/server/sync/workflows/workspace-insight-policy'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

function workspace(
  id: string,
  title: string,
  upcomingEvents: NativeWorkspaceInsight['upcomingEvents']
): NativeWorkspaceInsight {
  return {
    id,
    title,
    startsAt: '2026-10-25T09:00:00.000Z',
    endsAt: null,
    isAllDay: false,
    timeZone: 'America/Detroit',
    location: null,
    status: 'ongoing',
    participantCount: 0,
    participants: [],
    scheduledEventCount: upcomingEvents.length,
    openIdeaCount: 0,
    approvedIdeaCount: 0,
    budgetCap: null,
    trackedCost: 0,
    updatedAt: '2026-10-25T09:00:00.000Z',
    upcomingEvents,
  }
}

function session(id: string, title: string, startsAt: string) {
  return {
    id,
    title,
    startsAt,
    purpose: 'planning_scouting',
    participantCount: 0,
    participants: [],
  }
}

describe('workspace overview sessions', () => {
  test('sorts sessions chronologically while retaining the exact parent event context', () => {
    const workspaces = [
      workspace('event-a', 'A very long event name that remains available in the overview', [
        session('session-later', 'Later session', '2026-11-04T18:00:00.000Z'),
        session('session-sooner', 'Sooner session', '2026-10-28T18:00:00.000Z'),
      ]),
      workspace('event-b', 'Second event', [
        session('session-first', 'First session', '2026-10-26T15:00:00.000Z'),
      ]),
    ]

    expect(listUpcomingWorkspaceSessions(workspaces)).toEqual([
      {
        workspaceId: 'event-b',
        workspaceTitle: 'Second event',
        session: workspaces[1]!.upcomingEvents[0],
      },
      {
        workspaceId: 'event-a',
        workspaceTitle: workspaces[0]!.title,
        session: workspaces[0]!.upcomingEvents[1],
      },
      {
        workspaceId: 'event-a',
        workspaceTitle: workspaces[0]!.title,
        session: workspaces[0]!.upcomingEvents[0],
      },
    ])
  })

  test('returns no sessions for an empty event schedule', () => {
    expect(listUpcomingWorkspaceSessions([workspace('event-a', 'Event A', [])])).toEqual([])
  })

  test('excludes past, completed, unscheduled, cancelled, and finished sessions', () => {
    const now = new Date('2026-10-25T12:00:00.000Z')
    const scheduled = {
      schedulingState: 'scheduled',
      completionStatus: 'upcoming',
      status: null,
      planningStatus: null,
      startsAt: new Date('2026-10-26T12:00:00.000Z'),
    }

    expect(isUpcomingWorkspaceEvent(scheduled, now, 'ongoing')).toBe(true)
    expect(isUpcomingWorkspaceEvent({ ...scheduled, startsAt: now }, now, 'ongoing')).toBe(true)
    expect(
      isUpcomingWorkspaceEvent({ ...scheduled, startsAt: new Date(now.getTime() - 1) }, now, null)
    ).toBe(false)
    expect(
      isUpcomingWorkspaceEvent({ ...scheduled, completionStatus: 'complete' }, now, null)
    ).toBe(false)
    expect(
      isUpcomingWorkspaceEvent({ ...scheduled, schedulingState: 'unscheduled' }, now, null)
    ).toBe(false)
    expect(isUpcomingWorkspaceEvent({ ...scheduled, status: 'cancelled' }, now, null)).toBe(false)
    expect(isUpcomingWorkspaceEvent({ ...scheduled, status: 'finished' }, now, null)).toBe(false)
    expect(isUpcomingWorkspaceEvent({ ...scheduled, planningStatus: 'cancelled' }, now, null)).toBe(
      false
    )
    expect(isUpcomingWorkspaceEvent(scheduled, now, 'cancelled')).toBe(false)
    expect(isUpcomingWorkspaceEvent(scheduled, now, 'finished')).toBe(false)
  })
})
