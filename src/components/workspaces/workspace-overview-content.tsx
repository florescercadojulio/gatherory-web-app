import { useTranslation } from 'react-i18next'
import { CalendarDays, Lightbulb, MapPin, Smartphone, Users, WalletCards } from 'lucide-react'

import { ParticipantAvatars } from '@/components/participant-avatars'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Frame, FramePanel } from '@/components/reui/frame'
import { MoneyDecimal } from '@/lib/money'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'
import { listUpcomingWorkspaceSessions } from '@/lib/workspace-overview'

export function WorkspaceOverviewContent({
  workspaces,
  unavailableSnapshotCount,
}: {
  workspaces: NativeWorkspaceInsight[]
  unavailableSnapshotCount: number
}) {
  const { t } = useTranslation()
  const upcomingSessions = listUpcomingWorkspaceSessions(workspaces).slice(0, 5)

  return (
    <div className="app-page-shell overview-layout">
      <section className="overview-events space-y-4" aria-labelledby="your-events-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 id="your-events-heading" className="app-section-heading">
            {t('overview.yourEvents')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('overview.useIPhoneToChange')}</p>
        </div>

        {workspaces.length ? (
          <div className="space-y-3">
            {workspaces.map((workspace) => (
              <WorkspaceOverviewFrame key={workspace.id} workspace={workspace} />
            ))}
          </div>
        ) : (
          <EmptyCompanion />
        )}

        {unavailableSnapshotCount ? (
          <p className="text-xs text-muted-foreground">
            {t('overview.olderEvents', { count: unavailableSnapshotCount })}
          </p>
        ) : null}
      </section>

      {workspaces.length ? (
        <aside className="overview-upcoming space-y-4" aria-labelledby="coming-up-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="coming-up-heading" className="app-section-heading">
              {t('overview.comingUp')}
            </h2>
            {upcomingSessions.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {t('overview.nextCount', { count: upcomingSessions.length })}
              </span>
            ) : null}
          </div>

          {upcomingSessions.length ? (
            <div className="divide-y border-y">
              {upcomingSessions.map(({ workspaceId, workspaceTitle, session }) => (
                <UpcomingSessionRow
                  key={`${workspaceId}:${session.id}`}
                  session={session}
                  workspaceTitle={workspaceTitle}
                />
              ))}
            </div>
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              {t('overview.noUpcoming')}
            </p>
          )}
        </aside>
      ) : null}
    </div>
  )
}

function WorkspaceOverviewFrame({ workspace }: { workspace: NativeWorkspaceInsight }) {
  const { t, i18n } = useTranslation()
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
  const budgetUsed = calculateBudgetUsedPercentage(workspace.trackedCost, workspace.budgetCap)

  return (
    <Frame className="overview-event-frame" spacing="sm">
      <FramePanel className="space-y-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-lg font-medium tracking-[-0.015em]">
              {workspace.title}
            </h2>
            <div className="mt-1.5 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" />
                {dateFormatter.format(new Date(workspace.startsAt))}
              </span>
              {workspace.location ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="break-words">{workspace.location}</span>
                </span>
              ) : null}
            </div>
          </div>
          <ParticipantAvatars
            participants={workspace.participants}
            totalCount={workspace.participantCount}
            maxVisible={4}
            showLabel={false}
          />
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 sm:gap-3">
          <SummaryMetric
            icon={Users}
            label={t('common.people')}
            value={workspace.participantCount}
          />
          <SummaryMetric
            icon={CalendarDays}
            label={t('event.schedule')}
            value={workspace.scheduledEventCount}
          />
          <SummaryMetric
            icon={Lightbulb}
            label={t('overview.ideasToDecide')}
            value={workspace.openIdeaCount}
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <WalletCards className="size-3.5 shrink-0" />
              <span className="truncate">{t('overview.plannedSpending')}</span>
            </p>
            <p className="mt-1 break-words text-sm font-medium tabular-nums">
              {currencyFormatter.format(workspace.trackedCost)}
            </p>
            {workspace.budgetCap != null ? (
              <div className="mt-1.5 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t('overview.ofBudget', {
                    amount: currencyFormatter.format(workspace.budgetCap),
                  })}
                </p>
                {budgetUsed != null ? <Progress value={budgetUsed} className="h-1.5" /> : null}
              </div>
            ) : null}
          </div>
        </div>
      </FramePanel>
    </Frame>
  )
}

/** Returns the display percentage at the UI boundary, capped at full budget. */
export function calculateBudgetUsedPercentage(trackedCost: number, budgetCap: number | null) {
  if (budgetCap == null || budgetCap <= 0) return null

  const percentage = new MoneyDecimal(trackedCost).dividedBy(budgetCap).times(100)
  return (percentage.greaterThan(100) ? new MoneyDecimal(100) : percentage).toNumber()
}

function UpcomingSessionRow({
  session,
  workspaceTitle,
}: {
  session: NativeWorkspaceInsight['upcomingEvents'][number]
  workspaceTitle: string
}) {
  const { t, i18n } = useTranslation()
  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <article className="flex min-w-0 flex-col gap-2.5 py-3">
      <time dateTime={session.startsAt} className="text-xs tabular-nums text-muted-foreground">
        {dateTimeFormatter.format(new Date(session.startsAt))}
      </time>
      <h3 className="break-words text-sm font-medium">{session.title}</h3>
      <p className="break-words text-xs text-muted-foreground">{workspaceTitle}</p>
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="shrink-0">
          {session.purpose === 'planning_scouting'
            ? t('overview.planning')
            : t('overview.forGuests')}
        </Badge>
        <ParticipantAvatars
          participants={session.participants}
          totalCount={session.participantCount}
          maxVisible={3}
          size="sm"
          showLabel={false}
        />
      </div>
    </article>
  )
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: number
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

function EmptyCompanion() {
  const { t } = useTranslation()
  return (
    <div className="border-y py-10 text-center">
      <div className="app-icon-tile mx-auto mb-4 size-12">
        <Smartphone className="size-6" />
      </div>
      <h2 className="text-base font-medium">{t('overview.firstEvent')}</h2>
      <p className="mx-auto mt-2 w-full max-w-lg text-balance text-sm leading-6 text-muted-foreground">
        {t('overview.firstEventDescription')}
      </p>
    </div>
  )
}
