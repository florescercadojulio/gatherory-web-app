type WorkspaceEventSchedule = {
  startsAt: Date | null
  schedulingState: string
  completionStatus: string
  status: string | null
  planningStatus: string | null
}

export function isUpcomingWorkspaceEvent(
  event: WorkspaceEventSchedule,
  now: Date,
  parentStatus: string | null
) {
  return (
    event.schedulingState === 'scheduled' &&
    event.completionStatus !== 'complete' &&
    event.status !== 'cancelled' &&
    event.status !== 'finished' &&
    event.planningStatus !== 'cancelled' &&
    parentStatus !== 'cancelled' &&
    parentStatus !== 'finished' &&
    event.startsAt !== null &&
    event.startsAt.getTime() >= now.getTime()
  )
}
