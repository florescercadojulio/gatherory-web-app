import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'

import { AccountSidebar } from '@/components/account-sidebar'
import { ServerErrorToast } from '@/components/route-feedback'
import { Frame, FramePanel } from '@/components/reui/frame'
import { Button } from '@/components/ui/button'
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

  const insight = insightResult.ok ? insightResult.data : null

  return (
    <SidebarProvider>
      <ServerErrorToast error={insightResult.ok ? null : insightResult.error} />
      <AccountSidebar
        user={defaultWorkspaceContext.user}
        summaryLabel={
          insight ? t('common.events', { count: insight.workspaces.length }) : undefined
        }
      />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1 size-11 shrink-0" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="size-4 text-brand-ink" />
            <span className="truncate text-sm font-medium">{t('overview.events')}</span>
          </div>
        </header>
        {insight ? (
          <WorkspaceOverviewContent
            workspaces={insight.workspaces}
            unavailableSnapshotCount={insight.unavailableSnapshotCount}
          />
        ) : (
          <div className="app-page-shell">
            <Frame variant="ghost" spacing="default">
              <FramePanel>
                <section className="flex flex-col items-start gap-4" role="alert">
                  <h1 className="app-section-heading">{t('overview.yourEvents')}</h1>
                  <p className="text-sm text-muted-foreground">
                    {insightResult.ok ? null : insightResult.error.userMessage}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => window.location.reload()}
                  >
                    {t('common.tryAgain')}
                  </Button>
                </section>
              </FramePanel>
            </Frame>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
