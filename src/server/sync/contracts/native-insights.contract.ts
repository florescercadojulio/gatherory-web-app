export type NativeWorkspaceInsight = {
  id: string
  title: string
  startsAt: string
  endsAt: string | null
  isAllDay: boolean
  timeZone: string
  location: string | null
  status: string
  participantCount: number
  participants: Array<{ id: string; name: string; image: string | null }>
  scheduledEventCount: number
  openIdeaCount: number
  approvedIdeaCount: number
  budgetCap: number | null
  trackedCost: number
  updatedAt: string
  upcomingEvents: Array<{
    id: string
    title: string
    startsAt: string
    purpose: string
    participantCount: number
    participants: Array<{ id: string; name: string; image: string | null }>
  }>
}

export type NativeWorkspaceInsightsResult = {
  workspaces: NativeWorkspaceInsight[]
  unavailableSnapshotCount: number
}
