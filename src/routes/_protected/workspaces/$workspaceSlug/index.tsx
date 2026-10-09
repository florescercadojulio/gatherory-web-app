import { createFileRoute } from "@tanstack/react-router"
import {
  CalendarDays,
  Clock3,
  Compass,
  MailPlus,
  MapPin,
  PartyPopper,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { EventWorkspaceSummary } from "@/server/events/contracts/event.contracts"
import { listEvents } from "@/server/events/handlers/event.handlers"

export const Route = createFileRoute(
  "/_protected/workspaces/$workspaceSlug/",
)({
  loader: ({ context }) =>
    listEvents({
      data: {
        organizationId: context.workspaceContext.workspace.id,
      },
    }),
  component: Home,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Detroit",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Detroit",
})

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function label(value: string) {
  return value.replaceAll("_", " ")
}

function EventWorkspace({
  event,
  shared,
}: {
  event: EventWorkspaceSummary
  shared: boolean
}) {
  const planningEvents = event.childEvents.filter(
    (child) => child.purpose === "planning_scouting",
  )
  const guestEvents = event.childEvents.filter(
    (child) => child.purpose === "part_of_event",
  )

  return (
    <section className="space-y-6" aria-labelledby={`event-${event.id}`}>
      <Card className="relative min-h-72 overflow-hidden bg-linear-to-br from-primary/15 via-card to-sky-500/10">
        <div className="pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-primary/15 blur-3xl" />
        <CardHeader className="relative">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
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
              {shared ? (
                <Badge variant="outline">Shared with you</Badge>
              ) : null}
              <Badge variant="secondary" className="capitalize">
                {event.currentParticipant.role}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {event.status}
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="relative mt-auto grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              {event.startsAt
                ? dateFormatter.format(new Date(event.startsAt))
                : "Date not set"}
            </span>
            {event.locationName ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                {event.locationName}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2" aria-label="Event participants">
              {event.participants.slice(0, 4).map((participant) => (
                <Avatar
                  key={participant.id}
                  className="size-8 border-2 border-card"
                >
                  <AvatarImage
                    src={participant.image ?? undefined}
                    alt={participant.name}
                  />
                  <AvatarFallback className="text-[10px]">
                    {initials(participant.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {event.participants.length} people
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Event schedule</CardTitle>
            <CardDescription>
              Planning work and guest-facing moments share one event model.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{event.childEvents.length} events</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6">
            <EventGroup
              title="Planning & scouting"
              icon={Compass}
              events={planningEvents}
            />
            <Separator />
            <EventGroup
              title="Part of the experience"
              icon={PartyPopper}
              events={guestEvents}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
            <CardDescription>
              Event roles stay separate from workspace membership.
            </CardDescription>
            {event.pendingInvitationCount ? (
              <CardAction>
                <Badge variant="outline" className="gap-1">
                  <MailPlus />
                  {event.pendingInvitationCount} pending
                </Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {event.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarImage
                    src={participant.image ?? undefined}
                    alt={participant.name}
                  />
                  <AvatarFallback className="text-xs">
                    {initials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {participant.name}
                  </p>
                  <p className="capitalize text-xs text-muted-foreground">
                    {participant.role}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {label(participant.attendanceStatus)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
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
  events: EventWorkspaceSummary["childEvents"]
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border bg-muted/25 p-4 transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">{event.title}</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                {event.startsAt
                  ? dateTimeFormatter.format(new Date(event.startsAt))
                  : "Date not set"}
              </p>
              {event.locationName ? (
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {event.locationName}
                </p>
              ) : null}
              <p className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {event.participantCount} participants
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Home() {
  const result = Route.useLoaderData()
  const { workspaceContext } = Route.useRouteContext()

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your events</h1>
        <p className="text-sm text-muted-foreground">
          Events in this workspace that are available to your event role.
        </p>
      </div>

      {!result.ok ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Events are temporarily unavailable</CardTitle>
            <CardDescription>{result.error.userMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : result.data.length === 0 ? (
        <Card className="max-w-2xl border-dashed bg-muted/30">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>
            <CardTitle>Your first event starts here</CardTitle>
            <CardDescription>
              Create a main event, add its schedule, and invite hosts,
              collaborators, and guests.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        result.data.map((event) => (
          <EventWorkspace
            key={event.id}
            event={event}
            shared={workspaceContext.workspace.access === "participant"}
          />
        ))
      )}
    </div>
  )
}
