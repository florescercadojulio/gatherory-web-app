import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MapPin,
  Smartphone,
  Users,
  WalletCards,
} from "lucide-react";

import { AccountSidebar } from "@/components/account-sidebar";
import { ParticipantAvatars } from "@/components/participant-avatars";
import { ServerErrorToast } from "@/components/route-feedback";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  listNativeWorkspaceInsights,
  type NativeWorkspaceInsight,
} from "@/server/sync/native-insights";

export const Route = createFileRoute("/_protected/workspaces/")({
  loader: () => listNativeWorkspaceInsights(),
  component: WorkspaceCompanion,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function WorkspaceCompanion() {
  const { defaultWorkspaceContext } = Route.useRouteContext();
  const insightResult = Route.useLoaderData();
  if (!defaultWorkspaceContext) return null;

  const insight = insightResult.ok
    ? insightResult.data
    : { workspaces: [], unavailableSnapshotCount: 0 };
  const workspaces = insight.workspaces;
  const totals = workspaces.reduce(
    (result, workspace) => ({
      scheduledEvents: result.scheduledEvents + workspace.scheduledEventCount,
      openIdeas: result.openIdeas + workspace.openIdeaCount,
      trackedCost: result.trackedCost + workspace.trackedCost,
      participantCount: result.participantCount + workspace.participantCount,
    }),
    { scheduledEvents: 0, openIdeas: 0, trackedCost: 0, participantCount: 0 },
  );

  return (
    <SidebarProvider>
      <ServerErrorToast error={insightResult.ok ? null : insightResult.error} />
      <AccountSidebar
        user={defaultWorkspaceContext.user}
        summaryLabel={`${workspaces.length} ${workspaces.length === 1 ? "event" : "events"}`}
      />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="size-4 text-brand-ink" />
            <span className="truncate text-sm font-medium">Your events</span>
          </div>
        </header>

        <main className="app-page-shell">
          <section className="app-brand-panel px-6 py-8 md:px-8 md:py-10">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_17rem] md:items-end">
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 overflow-hidden rounded-lg border border-white/10 bg-[#121212]">
                    <img
                      src="/gatherory-icon.png"
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                  <span className="app-keycap">
                    <Smartphone className="mr-1.5 size-3.5" />
                    iPhone companion
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
                    Your plans, at a glance.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-[#cdcdcd] sm:text-base">
                    Plan on your iPhone, then come here for a focused view of
                    your events, ideas, people, and spending.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#101111] p-3">
                <div className="flex items-center gap-3 rounded-md bg-[#121212] px-3 py-2.5">
                  <span className="size-2 rounded-full bg-[#57c1ff]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">Up to date</p>
                    <p className="truncate text-xs text-[#9c9c9d]">
                      Your latest plans are here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="grid border-y sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Planning overview"
          >
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
                <h2 id="your-events-heading" className="app-section-heading">
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
              <div className="divide-y border-y">
                {workspaces.map((workspace) => (
                  <WorkspaceInsightCard
                    key={workspace.id}
                    workspace={workspace}
                  />
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
                {insight.unavailableSnapshotCount === 1 ? "it" : "them"} on your
                iPhone.
              </p>
            ) : null}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 py-5 sm:px-5 sm:first:pl-0 xl:border-r xl:last:border-r-0 xl:first:pl-0">
      <div className="app-icon-tile">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-2xl leading-tight font-medium tabular-nums">
          {value}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function WorkspaceInsightCard({
  workspace,
}: {
  workspace: NativeWorkspaceInsight;
}) {
  const budgetUsed = workspace.budgetCap
    ? Math.min((workspace.trackedCost / workspace.budgetCap) * 100, 100)
    : null;

  return (
    <article className="grid gap-8 py-8 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            <CheckCircle2 className="size-3.5 text-brand-ink" />
            {workspace.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {dateTimeFormatter.format(new Date(workspace.updatedAt))}
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-medium tracking-[-0.02em]">
            {workspace.title}
          </h3>
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
          <SmallStat label="People" value={workspace.participantCount} />
          <SmallStat label="Schedule" value={workspace.scheduledEventCount} />
          <SmallStat label="Open ideas" value={workspace.openIdeaCount} />
          <SmallStat label="Approved" value={workspace.approvedIdeaCount} />
        </div>
      </header>

      <div className="space-y-6">
        {workspace.budgetCap != null ? (
          <div className="space-y-2">
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
            <div className="divide-y border-y">
              {workspace.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Clock3 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {event.title}
                    </p>
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
                  <Badge
                    variant="outline"
                    className="hidden capitalize sm:inline-flex"
                  >
                    {event.purpose === "planning" ? "Planning" : "For guests"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              No upcoming activities are planned.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <p className="text-lg font-medium tabular-nums">{value}</p>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyCompanion() {
  return (
    <div className="border-y py-14 text-center">
      <div className="app-icon-tile mx-auto mb-4 size-14">
        <Smartphone className="size-7" />
      </div>
      <h3 className="text-base font-medium">Start on your iPhone</h3>
      <p className="mx-auto mt-2 w-full max-w-lg text-balance text-sm leading-6 text-muted-foreground">
        Create an event in Gatherory on your iPhone. Its schedule, people,
        ideas, and budget will appear here.
      </p>
    </div>
  );
}
