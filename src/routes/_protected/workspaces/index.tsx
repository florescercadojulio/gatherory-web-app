import { useForm } from "@tanstack/react-form"
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router"
import {
  ArrowUpRight,
  CalendarDays,
  LayoutGrid,
  Plus,
  Users,
} from "lucide-react"
import { useState } from "react"

import { AccountSidebar } from "@/components/account-sidebar"
import type { WorkspaceSwitcherItem } from "@/components/workspace-switcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createWorkspace } from "@/server/workspaces/handlers/workspace.handlers"

export const Route = createFileRoute("/_protected/workspaces/")({
  component: WorkspaceDirectory,
})

function WorkspaceDirectory() {
  const { defaultWorkspaceContext } = Route.useRouteContext()
  const ownedWorkspaces = defaultWorkspaceContext.workspaces.filter(
    (workspace) => workspace.access === "member",
  )
  const sharedWorkspaces = defaultWorkspaceContext.workspaces.filter(
    (workspace) => workspace.access === "participant",
  )

  return (
    <SidebarProvider>
      <AccountSidebar
        workspaces={defaultWorkspaceContext.workspaces}
        user={defaultWorkspaceContext.user}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <LayoutGrid className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium">All events</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-10 p-4 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Plan an event of your own or join one that has been shared with
                you.
              </p>
            </div>
            <CreateEventDialog />
          </div>

          <WorkspaceSection
            id="owned-workspaces"
            title="Your events"
            description="Events you host and plan with your people."
            workspaces={ownedWorkspaces}
            currentWorkspaceId={defaultWorkspaceContext.workspace.id}
          />

          <WorkspaceSection
            id="shared-workspaces"
            title="Shared with you"
            description="Events where you participate without managing the planning space."
            workspaces={sharedWorkspaces}
            currentWorkspaceId={defaultWorkspaceContext.workspace.id}
            emptyMessage="No additional events have been shared with you yet."
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function CreateEventDialog() {
  const navigate = useNavigate()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: emptyEventFormValues(),
    onSubmit: async ({ value }) => {
      const eventName = value.eventName.trim()
      if (eventName.length < 2) {
        setError("Enter an event name with at least two characters.")
        return
      }
      if (!value.startsAt) {
        setError("Choose when the event starts.")
        return
      }
      if (!value.timeZone.trim()) {
        setError("Enter the event time zone.")
        return
      }
      if (
        value.endsAt &&
        new Date(eventDateToIso(value.endsAt, value.isAllDay)) <
          new Date(eventDateToIso(value.startsAt, value.isAllDay))
      ) {
        setError("The event must end after it starts.")
        return
      }
      if (value.budgetCap && !/^\d+(?:\.\d{1,2})?$/.test(value.budgetCap)) {
        setError("Enter a valid budget with up to two decimal places.")
        return
      }

      setError(null)
      try {
        const result = await createWorkspace({
          data: {
            eventName,
            startsAt: eventDateToIso(value.startsAt, value.isAllDay),
            endsAt: value.endsAt
              ? eventDateToIso(value.endsAt, value.isAllDay)
              : undefined,
            isAllDay: value.isAllDay,
            timeZone: value.timeZone.trim(),
            locationName: value.locationName.trim() || undefined,
            locationAddress: value.locationAddress.trim() || undefined,
            budgetCap: value.budgetCap.trim() || undefined,
          },
        })
        if (!result.ok) {
          setError(result.error.userMessage)
          return
        }

        setOpen(false)
        form.reset(emptyEventFormValues())
        await router.invalidate()
        await navigate({
          to: "/workspaces/$workspaceSlug",
          params: { workspaceSlug: result.data.slug },
        })
      } catch {
        setError("The event could not be created. Try again.")
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        setError(null)
        if (nextOpen) form.reset(defaultEventFormValues())
      }}
    >
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" />
        New event
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,52rem)] overflow-y-auto sm:max-w-2xl">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
          className="contents"
        >
          <DialogHeader>
            <DialogTitle>Create an event</DialogTitle>
            <DialogDescription>
              Start with the details everyone needs. You can add cover art and
              invite hosts, collaborators, and guests after creating it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            <section
              className="grid gap-3"
              aria-labelledby="event-details-heading"
            >
              <div>
                <h3 id="event-details-heading" className="font-medium">
                  Event details
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the name people will recognize on the invitation.
                </p>
              </div>
              <form.Field name="eventName">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Event name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="off"
                      maxLength={120}
                      placeholder="Alex & Jordan's wedding"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      autoFocus
                    />
                  </div>
                )}
              </form.Field>
            </section>

            <Separator />

            <section
              className="grid gap-3"
              aria-labelledby="event-schedule-heading"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="event-schedule-heading" className="font-medium">
                    Date & time
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sub-events can be added to the timeline later.
                  </p>
                </div>
                <form.Field name="isAllDay">
                  {(field) => (
                    <Label className="flex items-center gap-2 pt-0.5 font-normal">
                      <Checkbox
                        id="event-is-all-day"
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          const isAllDay = checked === true
                          field.handleChange(isAllDay)
                          for (const fieldName of [
                            "startsAt",
                            "endsAt",
                          ] as const) {
                            const value = form.getFieldValue(fieldName)
                            if (!value) continue
                            form.setFieldValue(
                              fieldName,
                              isAllDay
                                ? value.slice(0, 10)
                                : value.length === 10
                                  ? `${value}T18:00`
                                  : value,
                            )
                          }
                        }}
                      />
                      All-day
                    </Label>
                  )}
                </form.Field>
              </div>
              <form.Subscribe selector={(state) => state.values.isAllDay}>
                {(isAllDay) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <form.Field name="startsAt">
                      {(field) => (
                        <div className="grid gap-2">
                          <Label htmlFor={field.name}>Starts</Label>
                          <Input
                            id={field.name}
                            type={isAllDay ? "date" : "datetime-local"}
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="endsAt">
                      {(field) => (
                        <div className="grid gap-2">
                          <Label htmlFor={field.name}>Ends (optional)</Label>
                          <Input
                            id={field.name}
                            type={isAllDay ? "date" : "datetime-local"}
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}
              </form.Subscribe>
              <form.Field name="timeZone">
                {(field) => (
                  <div className="grid gap-2 sm:max-w-xs">
                    <Label htmlFor={field.name}>Time zone</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </div>
                )}
              </form.Field>
            </section>

            <Separator />

            <section
              className="grid gap-3"
              aria-labelledby="event-location-heading"
            >
              <div>
                <h3 id="event-location-heading" className="font-medium">
                  Location (optional)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add a venue now or leave it open while you decide.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <form.Field name="locationName">
                  {(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Location name</Label>
                      <Input
                        id={field.name}
                        placeholder="Willow & Stone Estate"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="locationAddress">
                  {(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Address</Label>
                      <Input
                        id={field.name}
                        placeholder="Ann Arbor, Michigan"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </section>

            <Separator />

            <form.Field name="budgetCap">
              {(field) => (
                <section
                  className="grid gap-2"
                  aria-labelledby="event-budget-heading"
                >
                  <div>
                    <h3 id="event-budget-heading" className="font-medium">
                      Budget (optional)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This starts as the main event budget. You can allocate it
                      across sub-events later.
                    </p>
                  </div>
                  <Label htmlFor={field.name} className="sr-only">
                    Budget cap
                  </Label>
                  <Input
                    id={field.name}
                    inputMode="decimal"
                    placeholder="12000"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    className="sm:max-w-xs"
                  />
                </section>
              )}
            </form.Field>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <form.Subscribe
              selector={(state) =>
                [
                  state.values.eventName,
                  state.values.startsAt,
                  state.isSubmitting,
                ] as const
              }
            >
              {([eventName, startsAt, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || eventName.trim().length < 2 || !startsAt
                  }
                >
                  {isSubmitting ? "Creating…" : "Create event"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function WorkspaceSection({
  id,
  title,
  description,
  workspaces,
  currentWorkspaceId,
  emptyMessage,
}: {
  id: string
  title: string
  description: string
  workspaces: WorkspaceSwitcherItem[]
  currentWorkspaceId: string
  emptyMessage?: string
}) {
  return (
    <section className="space-y-4" aria-labelledby={`${id}-heading`}>
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {workspaces.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to="/workspaces/$workspaceSlug"
              params={{ workspaceSlug: workspace.slug }}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-[border-color,box-shadow,transform] group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-md">
                <CardHeader>
                  <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {workspace.access === "member" ? (
                      <CalendarDays className="size-5" />
                    ) : (
                      <Users className="size-5" />
                    )}
                  </div>
                  <CardTitle className="pr-8">{workspace.name}</CardTitle>
                  <CardDescription>
                    {workspace.access === "member"
                      ? workspace.type === "personal"
                        ? "Your event"
                        : "Team event"
                      : "Shared with you"}
                  </CardDescription>
                  <CardAction className="flex items-center gap-2">
                    {workspace.id === currentWorkspaceId ? (
                      <Badge variant="secondary">Current</Badge>
                    ) : null}
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </CardAction>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed bg-muted/25">
          <CardHeader>
            <CardDescription>
              {emptyMessage ?? "No events to show yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  )
}

function emptyEventFormValues() {
  return {
    eventName: "",
    startsAt: "",
    endsAt: "",
    isAllDay: false,
    timeZone: "UTC",
    locationName: "",
    locationAddress: "",
    budgetCap: "",
  }
}

function defaultEventFormValues() {
  const startsAt = new Date()
  startsAt.setMonth(startsAt.getMonth() + 6)
  startsAt.setHours(18, 0, 0, 0)

  return {
    ...emptyEventFormValues(),
    startsAt: toLocalDateTimeValue(startsAt),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  }
}

function toLocalDateTimeValue(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

function eventDateToIso(value: string, isAllDay: boolean) {
  const date = new Date(
    isAllDay && value.length === 10 ? `${value}T00:00` : value,
  )
  if (isAllDay) date.setHours(0, 0, 0, 0)
  return date.toISOString()
}
