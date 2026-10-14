import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock3, Compass, MailPlus, MapPin, PartyPopper } from 'lucide-react'

import { ParticipantAvatars } from '@/components/participant-avatars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ServerErrorToast } from '@/components/route-feedback'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { EventWorkspaceSummary } from '@/server/events/contracts/event.contracts'
import { listEvents } from '@/server/events/handlers/event.handlers'

export const Route = createFileRoute('/_protected/workspaces/$workspaceSlug/')({
  loader: ({ context }) => {
    if (!context.workspaceContext) {
      return {
        ok: false as const,
        error: context.workspaceError ?? {
          userMessage: 'This workspace could not be loaded. Try again.',
          errorId: crypto.randomUUID(),
        },
      }
    }

    return listEvents({
      data: {
        organizationId: context.workspaceContext.workspace.id,
      },
    })
  },
  component: Home,
})

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function EventWorkspace({ event, shared }: { event: EventWorkspaceSummary; shared: boolean }) {
  const { t, i18n } = useTranslation()
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Detroit',
  })
  const planningEvents = event.childEvents.filter((child) => child.purpose === 'planning_scouting')
  const guestEvents = event.childEvents.filter((child) => child.purpose === 'part_of_event')

  return (
    <section className="space-y-6" aria-labelledby={`event-${event.id}`}>
      <Card className="min-h-72 overflow-hidden py-0">
        <div className="h-1 bg-[linear-gradient(90deg,#1858cf_0%,#2878ff_48%,#55dcff_100%)]" />
        <CardHeader className="px-6 pt-6">
          <div className="app-icon-tile mb-6 size-12">
            <PartyPopper className="size-6" />
          </div>
          <CardTitle id={`event-${event.id}`} className="text-2xl sm:text-3xl">
            {event.title}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-relaxed sm:text-base">
            {event.description}
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap justify-end gap-2">
              {shared ? <Badge variant="outline">{t('event.sharedWithYou')}</Badge> : null}
              <Badge variant="secondary" className="capitalize">
                {t(`event.roles.${event.currentParticipant.role}`)}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {t(`event.status.${event.status}`)}
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="mt-auto grid gap-5 px-6 pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-brand-ink" />
              {event.startsAt
                ? dateFormatter.format(new Date(event.startsAt))
                : t('event.dateNotSet')}
            </span>
            {event.locationName ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-brand-ink" />
                {event.locationName}
              </span>
            ) : null}
          </div>
          <ParticipantAvatars participants={event.participants} />
        </CardContent>
      </Card>

      <div className="grid gap-10 pt-2 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="border-t pt-6">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="app-section-heading">{t('event.schedule')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('event.scheduleDescription')}</p>
            </div>
            <div>
              <Badge variant="outline">
                {t('event.eventCount', { count: event.childEvents.length })}
              </Badge>
            </div>
          </header>
          <div className="space-y-6">
            <EventGroup
              title={t('event.purpose.planning_scouting')}
              icon={Compass}
              events={planningEvents}
            />
            <Separator />
            <EventGroup
              title={t('event.purpose.part_of_event')}
              icon={PartyPopper}
              events={guestEvents}
            />
          </div>
        </section>

        <section className="border-t pt-6">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="app-section-heading">{t('common.people')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('event.peopleDescription')}</p>
            </div>
            {event.pendingInvitationCount ? (
              <div>
                <Badge variant="outline" className="gap-1">
                  <MailPlus />
                  {t('event.pending', { count: event.pendingInvitationCount })}
                </Badge>
              </div>
            ) : null}
          </header>
          <div className="divide-y border-y">
            {event.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 py-3">
                <Avatar className="size-9">
                  <AvatarImage src={participant.image ?? undefined} alt={participant.name} />
                  <AvatarFallback className="text-xs">{initials(participant.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{participant.name}</p>
                  <p className="capitalize text-xs text-muted-foreground">
                    {t(`event.roles.${participant.role}`)}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {t(`event.attendance.${participant.attendanceStatus}`)}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function EventGroup({
  title,
  icon: Icon,
  events,
}: {
  title: string
  icon: typeof Compass
  events: EventWorkspaceSummary['childEvents']
}) {
  const { t, i18n } = useTranslation()
  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Detroit',
  })
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-brand-ink" />
        {title}
      </div>
      <div className="divide-y border-y">
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{event.title}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {event.startsAt
                    ? dateTimeFormatter.format(new Date(event.startsAt))
                    : t('event.dateNotSet')}
                </p>
                {event.locationName ? (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {event.locationName}
                  </p>
                ) : null}
              </div>
            </div>
            <ParticipantAvatars
              participants={event.participants}
              totalCount={event.participantCount}
              maxVisible={3}
              size="sm"
              showLabel={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Home() {
  const { t } = useTranslation()
  const result = Route.useLoaderData()
  const { workspaceContext } = Route.useRouteContext()

  if (!workspaceContext) return null

  return (
    <div className="app-page-shell">
      <ServerErrorToast error={result.ok ? null : result.error} />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium tracking-[-0.015em]">{t('event.overview')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('event.description')}</p>
      </div>

      {!result.ok ? (
        <Card className="max-w-2xl border-dashed bg-muted/30">
          <CardHeader>
            <CardTitle>{t('event.detailsWillAppear')}</CardTitle>
            <CardDescription>{t('event.couldNotRefresh')}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <Card className="max-w-2xl border-dashed bg-muted/30">
          <CardHeader>
            <div className="app-icon-tile mb-3">
              <CalendarDays className="size-5" />
            </div>
            <CardTitle>{t('event.firstEvent')}</CardTitle>
            <CardDescription>{t('event.firstEventDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        result.data.map((event) => (
          <EventWorkspace
            key={event.id}
            event={event}
            shared={workspaceContext.workspace.access === 'participant'}
          />
        ))
      )}
    </div>
  )
}
