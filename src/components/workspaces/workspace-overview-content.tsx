import { useTranslation } from 'react-i18next'

import { ParticipantAvatars } from '@/components/participant-avatars'
import { Frame, FramePanel } from '@/components/reui/frame'
import { Progress } from '@/components/ui/progress'
import { MoneyDecimal } from '@/lib/money'
import { listUpcomingWorkspaceSessions } from '@/lib/workspace-overview'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

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
    <div className="app-page-shell mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="your-events-heading">
          <header className="flex flex-col gap-0.5">
            <h1 id="your-events-heading" className="app-section-heading">
              {t('overview.yourEvents')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t('overview.readOnlyDescription')}
            </p>
          </header>

          {workspaces.length ? (
            <div className="flex min-w-0 flex-col gap-3">
              {workspaces.map((workspace) => (
                <WorkspaceOverviewSummary key={workspace.id} workspace={workspace} />
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
          <section className="flex min-w-0 flex-col gap-3" aria-labelledby="coming-up-heading">
            <div className="flex flex-col gap-0.5">
              <h2 id="coming-up-heading" className="app-section-heading">
                {t('overview.comingUp')}
              </h2>
              <p className="text-xs text-muted-foreground">{t('overview.viewerLocalTime')}</p>
            </div>

            {upcomingSessions.length ? (
              <Frame variant="ghost" spacing="default">
                <FramePanel>
                  <ul className="flex min-w-0 flex-col divide-y divide-border">
                    {upcomingSessions.map(({ workspaceId, workspaceTitle, session }) => (
                      <UpcomingSessionRow
                        key={`${workspaceId}:${session.id}`}
                        session={session}
                        workspaceTitle={workspaceTitle}
                      />
                    ))}
                  </ul>
                </FramePanel>
              </Frame>
            ) : (
              <Frame variant="ghost" spacing="default">
                <FramePanel fit>
                  <p className="text-sm text-muted-foreground">{t('overview.noUpcoming')}</p>
                </FramePanel>
              </Frame>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function WorkspaceOverviewSummary({ workspace }: { workspace: NativeWorkspaceInsight }) {
  const { t, i18n } = useTranslation()
  const date = formatWorkspaceDate(workspace.startsAt, workspace.timeZone, i18n.language)
  const currency = getCurrencyFormatter(workspace.currencyCode, i18n.language)
  const amountFormatter =
    currency ??
    new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatAmount = (amount: number) =>
    amountFormatter.format(
      new MoneyDecimal(amount)
        .toDecimalPlaces(amountFormatter.resolvedOptions().maximumFractionDigits)
        .toNumber()
    )
  const budgetUsed = calculateBudgetUsedPercentage(workspace.trackedCost, workspace.budgetCap)

  return (
    <Frame variant="ghost" spacing="default">
      <FramePanel>
        <article className="flex min-w-0 flex-col gap-4">
          <header className="flex min-w-0 flex-col gap-1">
            <h2 className="break-words text-lg font-semibold leading-snug tracking-tight text-foreground">
              {workspace.title}
            </h2>
            {date ? (
              <time dateTime={workspace.startsAt} className="text-sm text-muted-foreground">
                {date}
              </time>
            ) : (
              <p className="text-sm text-muted-foreground">{t('overview.dateUnavailable')}</p>
            )}
            {workspace.location ? (
              <p className="break-words text-sm text-muted-foreground">{workspace.location}</p>
            ) : null}
          </header>

          <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-4">
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t('overview.people')}</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <ParticipantAvatars
                  participants={workspace.participants}
                  totalCount={workspace.participantCount}
                  maxVisible={3}
                  size="sm"
                  showLabel={false}
                />
                <span className="text-xs text-muted-foreground">
                  {t('overview.peopleCount', { count: workspace.participantCount })}
                </span>
              </dd>
            </div>
            <SummaryMetric
              label={t('overview.scheduledActivities')}
              value={workspace.scheduledEventCount}
            />
            <SummaryMetric label={t('overview.ideasToDecide')} value={workspace.openIdeaCount} />
            <SummaryMetric
              label={t('overview.plannedSpending')}
              value={formatAmount(workspace.trackedCost)}
            />
          </dl>

          {!currency ? (
            <p className="text-xs text-muted-foreground">{t('overview.currencyUnavailable')}</p>
          ) : null}

          {workspace.budgetCap != null ? (
            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {t('overview.budgetCap', {
                    amount: formatAmount(workspace.budgetCap),
                  })}
                </span>
                {budgetUsed != null ? (
                  <span>{t('overview.budgetUsed', { percent: Math.round(budgetUsed) })}</span>
                ) : null}
              </div>
              {budgetUsed != null ? (
                <Progress
                  value={budgetUsed}
                  className="h-1.5"
                  aria-label={t('overview.budgetUsed', { percent: Math.round(budgetUsed) })}
                />
              ) : null}
            </div>
          ) : null}
        </article>
      </FramePanel>
    </Frame>
  )
}

function getCurrencyFormatter(currencyCode: string | null, locale: string) {
  if (!currencyCode || !/^[A-Z]{3}$/.test(currencyCode)) return null
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })
  } catch {
    return null
  }
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

/** Returns the display percentage at the UI boundary, capped at full budget. */
export function calculateBudgetUsedPercentage(trackedCost: number, budgetCap: number | null) {
  if (budgetCap == null || budgetCap <= 0) return null

  const percentage = new MoneyDecimal(trackedCost).dividedBy(budgetCap).times(100)
  return (percentage.greaterThan(100) ? new MoneyDecimal(100) : percentage).toNumber()
}

function formatWorkspaceDate(startsAt: string, timeZone: string, locale: string) {
  const date = new Date(startsAt)
  if (!Number.isFinite(date.getTime())) return null

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone }).format(date)
  } catch {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)
  }
}

function UpcomingSessionRow({
  session,
  workspaceTitle,
}: {
  session: NativeWorkspaceInsight['upcomingEvents'][number]
  workspaceTitle: string
}) {
  const { t, i18n } = useTranslation()
  const date = new Date(session.startsAt)
  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  const purpose =
    session.purpose === 'planning_scouting'
      ? t('overview.planningPurpose')
      : session.purpose === 'part_of_event'
        ? t('overview.experiencePurpose')
        : null

  return (
    <li className="flex min-w-0 flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <h3 className="break-words text-sm font-medium leading-snug text-foreground">
        {session.title}
      </h3>
      <time dateTime={session.startsAt} className="text-xs text-muted-foreground">
        {dateTimeFormatter.format(date)}
      </time>
      <p className="break-words text-xs text-muted-foreground">{workspaceTitle}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {purpose ? <span>{purpose}</span> : null}
        <span>{t('overview.peopleCount', { count: session.participantCount })}</span>
      </div>
    </li>
  )
}

function EmptyCompanion() {
  const { t } = useTranslation()
  return (
    <Frame variant="ghost" spacing="default">
      <FramePanel fit>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t('overview.firstEvent')}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t('overview.firstEventDescription')}
          </p>
        </div>
      </FramePanel>
    </Frame>
  )
}
