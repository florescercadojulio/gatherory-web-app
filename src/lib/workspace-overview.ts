import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

export function listUpcomingWorkspaceSessions(workspaces: NativeWorkspaceInsight[]) {
  return workspaces
    .flatMap((workspace) =>
      workspace.upcomingEvents.map((session) => ({
        workspaceId: workspace.id,
        workspaceTitle: workspace.title,
        session,
      }))
    )
    .sort(
      (first, second) =>
        new Date(first.session.startsAt).getTime() - new Date(second.session.startsAt).getTime()
    )
}
