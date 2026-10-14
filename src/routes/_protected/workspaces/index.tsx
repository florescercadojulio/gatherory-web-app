import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MapPin,
  Smartphone,
  Users,
  WalletCards,
} from 'lucide-react'

import { AccountSidebar } from '@/components/account-sidebar'
import { ParticipantAvatars } from '@/components/participant-avatars'
import { ServerErrorToast } from '@/components/route-feedback'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { listNativeWorkspaceInsights } from '@/server/sync/handlers/native-workspace-insights.handler'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

export const Route = createFileRoute('/_protected/workspaces/')({
  loader: () => listNativeWorkspaceInsights(),
  component: WorkspaceCompanion,
})

function WorkspaceCompanion() {
  const { t, i18n } = useTranslation()
  const currencyFormatter = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
  const { defaultWorkspaceContext } = Route.useRouteContext()
  const insightResult = Route.useLoaderData()
  if (!defaultWorkspaceContext) return null

  const insight = insightResult.ok
    ? insightResult.data
    : { workspaces: [], unavailableSnapshotCount: 0 }
  const workspaces = insight.workspaces
  const totals = workspaces.reduce(
    (result, workspace) => ({
      scheduledEvents: result.scheduledEvents + workspace.scheduledEventCount,
      openIdeas: result.openIdeas + workspace.openIdeaCount,
      trackedCost: result.trackedCost + workspace.trackedCost,
      participantCount: result.participantCount + workspace.participantCount,
    }),
    { scheduledEvents: 0, openIdeas: 0, trackedCost: 0, participantCount: 0 }
  )

  return (
    <SidebarProvider>
      <ServerErrorToast error={insightResult.ok ? null : insightResult.error} />
      <AccountSidebar
        user={defaultWorkspaceContext.user}
        summaryLabel={t('common.events', { count: workspaces.length })}
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

        <main className="app-page-shell">
          <section className="app-brand-panel px-6 py-8 md:px-8 md:py-10">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_17rem] md:items-end">
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 overflow-hidden rounded-lg border border-white/10 bg-[#121212]">
                    <img src="/gatherory-icon.png" alt="" className="size-full object-cover" />
                  </div>
                  <span className="app-keycap">
                    <Smartphone className="mr-1.5 size-3.5" />
                    {t('overview.eyebrow')}
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
                    {t('overview.title')}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-[#cdcdcd] sm:text-base">
                    {t('overview.description')}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#101111] p-3">
                <div className="flex items-center gap-3 rounded-md bg-[#121212] px-3 py-2.5">
                  <span className="size-2 rounded-full bg-[#57c1ff]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{t('overview.upToDate')}</p>
                    <p className="truncate text-xs text-[#9c9c9d]">{t('overview.latestPlans')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="grid border-y sm:grid-cols-2 xl:grid-cols-4"
            aria-label={t('ui.planningOverview')}
          >
            <Metric
              icon={CalendarDays}
              label={t('overview.events')}
              value={String(workspaces.length)}
              detail={t('overview.plannedActivities', { count: totals.scheduledEvents })}
            />
            <Metric
              icon={Lightbulb}
              label={t('overview.ideasToDecide')}
              value={String(totals.openIdeas)}
              detail={t('overview.acrossEvents')}
            />
            <Metric
              icon={WalletCards}
              label={t('overview.plannedSpending')}
              value={currencyFormatter.format(totals.trackedCost)}
              detail={t('overview.spendingSoFar')}
            />
            <Metric
              icon={Users}
              label={t('common.people')}
              value={String(totals.participantCount)}
              detail={t('overview.hostsHelpersGuests')}
            />
          </section>

          <section className="space-y-4" aria-labelledby="your-events-heading">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="your-events-heading" className="app-section-heading">
                  {t('overview.yourEvents')}
                </h2>
                <p className="text-sm text-muted-foreground">{t('overview.allTogether')}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t('overview.useIPhoneToChange')}</p>
            </div>

            {workspaces.length ? (
              <div className="divide-y border-y">
                {workspaces.map((workspace) => (
                  <WorkspaceInsightCard key={workspace.id} workspace={workspace} />
                ))}
              </div>
            ) : (
              <EmptyCompanion />
            )}

            {insight.unavailableSnapshotCount ? (
              <p className="text-xs text-muted-foreground">
                {t('overview.olderEvents', { count: insight.unavailableSnapshotCount })}
              </p>
            ) : null}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="flex min-w-0 gap-3 py-5 sm:px-5 sm:first:pl-0 xl:border-r xl:last:border-r-0 xl:first:pl-0">
      <div className="app-icon-tile">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-2xl leading-tight font-medium tabular-nums">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function WorkspaceInsightCard({ workspace }: { workspace: NativeWorkspaceInsight }) {
  const { t, i18n } = useTranslation()
  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const currencyFormatter = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
  const budgetUsed = workspace.budgetCap
    ? Math.min((workspace.trackedCost / workspace.budgetCap) * 100, 100)
    : null

  return (
    <article className="grid gap-8 py-8 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            <CheckCircle2 className="size-3.5 text-brand-ink" />
            {workspace.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t('overview.updatedAt', {
              date: dateTimeFormatter.format(new Date(workspace.updatedAt)),
            })}
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-medium tracking-[-0.02em]">{workspace.title}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {dateFormatter.format(new Date(workspace.startsAt))}
            </span>
            {workspace.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {workspace.location}
              </span>
            ) : null}
          </div>
        </div>
        <ParticipantAvatars
          participants={workspace.participants}
          totalCount={workspace.participantCount}
          maxVisible={5}
        />
        <div className="grid grid-cols-4 divide-x border-y py-3">
          <SmallStat label={t('common.people')} value={workspace.participantCount} />
          <SmallStat label={t('event.schedule')} value={workspace.scheduledEventCount} />
          <SmallStat label={t('overview.ideasToDecide')} value={workspace.openIdeaCount} />
          <SmallStat label={t('event.approved')} value={workspace.approvedIdeaCount} />
        </div>
      </header>

      <div className="space-y-6">
        {workspace.budgetCap != null ? (
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('overview.budget')}</p>
                <p className="font-medium tabular-nums">
                  {currencyFormatter.format(workspace.trackedCost)} {t('overview.planned')}
                </p>
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                {t('overview.ofBudget', { amount: currencyFormatter.format(workspace.budgetCap) })}
              </p>
            </div>
            <Progress value={budgetUsed ?? 0} className="h-2" />
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{t('overview.comingUp')}</p>
            <span className="text-xs text-muted-foreground">
              {t('overview.nextCount', { count: workspace.upcomingEvents.length || 0 })}
            </span>
          </div>
          {workspace.upcomingEvents.length ? (
            <div className="divide-y border-y">
              {workspace.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Clock3 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateTimeFormatter.format(new Date(event.startsAt))}
                    </p>
                  </div>
                  <ParticipantAvatars
                    participants={event.participants}
                    totalCount={event.participantCount}
                    maxVisible={3}
                    size="sm"
                    showLabel={false}
                  />
                  <Badge variant="outline" className="hidden capitalize sm:inline-flex">
                    {event.purpose === 'planning'
                      ? t('overview.planning')
                      : t('overview.forGuests')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              {t('overview.noUpcoming')}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <p className="text-lg font-medium tabular-nums">{value}</p>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyCompanion() {
  const { t } = useTranslation()
  return (
    <div className="border-y py-14 text-center">
      <div className="app-icon-tile mx-auto mb-4 size-14">
        <Smartphone className="size-7" />
      </div>
      <h3 className="text-base font-medium">{t('overview.firstEvent')}</h3>
      <p className="mx-auto mt-2 w-full max-w-lg text-balance text-sm leading-6 text-muted-foreground">
        {t('overview.firstEventDescription')}
      </p>
    </div>
  )
}
