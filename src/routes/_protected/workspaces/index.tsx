import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'

import { AccountSidebar } from '@/components/account-sidebar'
import { ServerErrorToast } from '@/components/route-feedback'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { WorkspaceOverviewContent } from '@/components/workspaces/workspace-overview-content'
import { listNativeWorkspaceInsights } from '@/server/sync/handlers/native-workspace-insights.handler'

export const Route = createFileRoute('/_protected/workspaces/')({
  loader: () => listNativeWorkspaceInsights(),
  component: WorkspaceCompanion,
})

function WorkspaceCompanion() {
  const { t } = useTranslation()
  const { defaultWorkspaceContext } = Route.useRouteContext()
  const insightResult = Route.useLoaderData()
  if (!defaultWorkspaceContext) return null

  const insight = insightResult.ok
    ? insightResult.data
    : { workspaces: [], unavailableSnapshotCount: 0 }

  return (
    <SidebarProvider>
      <ServerErrorToast error={insightResult.ok ? null : insightResult.error} />
      <AccountSidebar
        user={defaultWorkspaceContext.user}
        summaryLabel={t('common.events', { count: insight.workspaces.length })}
      />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="size-4 text-brand-ink" />
            <span className="truncate text-sm font-medium">{t('overview.events')}</span>
          </div>
        </header>
        <WorkspaceOverviewContent
          workspaces={insight.workspaces}
          unavailableSnapshotCount={insight.unavailableSnapshotCount}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
