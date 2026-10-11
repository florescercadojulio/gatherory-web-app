import { createFileRoute } from "@tanstack/react-router"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MapPin,
  Smartphone,
  Users,
  WalletCards,
} from "lucide-react"

import { AccountSidebar } from "@/components/account-sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  listNativeWorkspaceInsights,
  type NativeWorkspaceInsight,
} from "@/server/sync/native-insights"

export const Route = createFileRoute("/_protected/workspaces/")({
  loader: () => listNativeWorkspaceInsights(),
  component: WorkspaceCompanion,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function WorkspaceCompanion() {
  const { defaultWorkspaceContext } = Route.useRouteContext()
  const insight = Route.useLoaderData()
  const workspaces = insight.workspaces
  const totals = workspaces.reduce(
    (result, workspace) => ({
      scheduledEvents: result.scheduledEvents + workspace.scheduledEventCount,
      openIdeas: result.openIdeas + workspace.openIdeaCount,
      trackedCost: result.trackedCost + workspace.trackedCost,
      participantCount: result.participantCount + workspace.participantCount,
    }),
    { scheduledEvents: 0, openIdeas: 0, trackedCost: 0, participantCount: 0 },
  )

  return (
    <SidebarProvider>
      <AccountSidebar
        user={defaultWorkspaceContext.user}
        summaryLabel={`${workspaces.length} ${workspaces.length === 1 ? "event" : "events"}`}
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="truncate text-sm font-medium">Your events</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:p-8">
          <section className="relative overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,#0b2c8f_0%,#1462df_48%,#1aa9dd_100%)] px-6 py-8 text-white shadow-xl shadow-blue-950/10 md:px-10 md:py-12">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-blue-950/35 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl space-y-5">
                <Badge className="border-white/20 bg-white/12 text-white hover:bg-white/12">
                  <Smartphone className="size-3.5" />
                  Works with Gatherory on iPhone
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    Your plans, at a glance.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-blue-50/85 sm:text-base">
                    Plan on your iPhone, then come here for a simple view of
                    your events, ideas, people, and spending.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/10 px-4 py-3 backdrop-blur-xl">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-200 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-cyan-200" />
                </span>
                <div>
                  <p className="text-sm font-medium">Up to date</p>
                  <p className="text-xs text-blue-100/75">
                    Your latest plans are here
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Planning overview">
            <Metric
              icon={CalendarDays}
              label="Events"
              value={String(workspaces.length)}
              detail={`${totals.scheduledEvents} activities planned`}
            />
            <Metric
              icon={Lightbulb}
              label="Ideas to decide"
              value={String(totals.openIdeas)}
              detail="Across all your events"
            />
            <Metric
              icon={WalletCards}
              label="Planned spending"
              value={currencyFormatter.format(totals.trackedCost)}
              detail="What you expect to spend so far"
            />
            <Metric
              icon={Users}
              label="People"
              value={String(totals.participantCount)}
              detail="Hosts, helpers, and guests"
            />
          </section>

          <section className="space-y-4" aria-labelledby="your-events-heading">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="your-events-heading" className="text-xl font-semibold tracking-tight">
                  Your events
                </h2>
                <p className="text-sm text-muted-foreground">
                  Everything important, gathered in one place.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Use the iPhone app to make changes.
              </p>
            </div>

            {workspaces.length ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {workspaces.map((workspace) => (
                  <WorkspaceInsightCard key={workspace.id} workspace={workspace} />
                ))}
              </div>
            ) : (
              <EmptyCompanion />
            )}

            {insight.unavailableSnapshotCount ? (
              <p className="text-xs text-muted-foreground">
                {insight.unavailableSnapshotCount} older event
                {insight.unavailableSnapshotCount === 1 ? "" : "s"} will appear
                after you open and save{" "}
                {insight.unavailableSnapshotCount === 1 ? "it" : "them"} on
                your iPhone.
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
    <Card className="gap-4 py-5">
      <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-3 px-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-0.5 truncate text-2xl tabular-nums">
            {value}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 text-xs text-muted-foreground">
        {detail}
      </CardContent>
    </Card>
  )
}

function WorkspaceInsightCard({ workspace }: { workspace: NativeWorkspaceInsight }) {
  const budgetUsed = workspace.budgetCap
    ? Math.min((workspace.trackedCost / workspace.budgetCap) * 100, 100)
    : null

  return (
    <Card className="overflow-hidden py-0">
      <div className="h-1.5 bg-[linear-gradient(90deg,#1555e6,#18a6dc)]" />
      <CardHeader className="gap-4 px-6 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                <CheckCircle2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                {workspace.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Updated {dateTimeFormatter.format(new Date(workspace.updatedAt))}
              </span>
            </div>
            <CardTitle className="pt-2 text-2xl">{workspace.title}</CardTitle>
            <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
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
            </CardDescription>
          </div>
          <div className="rounded-2xl bg-blue-500/10 px-3 py-2 text-right text-blue-700 dark:text-blue-300">
            <p className="text-lg font-semibold tabular-nums">
              {workspace.participantCount}
            </p>
            <p className="text-[11px]">people</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-6">
        <div className="grid grid-cols-3 gap-2">
          <SmallStat label="Schedule" value={workspace.scheduledEventCount} />
          <SmallStat label="Open ideas" value={workspace.openIdeaCount} />
          <SmallStat label="Approved" value={workspace.approvedIdeaCount} />
        </div>

        {workspace.budgetCap != null ? (
          <div className="space-y-2 rounded-2xl border bg-muted/25 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Budget overview</p>
                <p className="font-medium tabular-nums">
                  {currencyFormatter.format(workspace.trackedCost)} planned
                </p>
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                of {currencyFormatter.format(workspace.budgetCap)}
              </p>
            </div>
            <Progress value={budgetUsed ?? 0} className="h-2" />
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Coming up</p>
            <span className="text-xs text-muted-foreground">
              Next {workspace.upcomingEvents.length || 0}
            </span>
          </div>
          {workspace.upcomingEvents.length ? (
            <div className="divide-y rounded-2xl border">
              {workspace.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Clock3 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateTimeFormatter.format(new Date(event.startsAt))}
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden capitalize sm:inline-flex">
                    {event.purpose === "planning" ? "Planning" : "For guests"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
              No upcoming activities are planned.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/55 px-3 py-3">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyCompanion() {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="mx-auto w-full max-w-xl justify-items-center px-6 py-12 text-center sm:px-8">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Smartphone className="size-7" />
        </div>
        <CardTitle>Start on your iPhone</CardTitle>
        <CardDescription className="w-full max-w-lg text-balance leading-6">
          Create an event in Gatherory on your iPhone. Its schedule, people,
          ideas, and budget will appear here.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
