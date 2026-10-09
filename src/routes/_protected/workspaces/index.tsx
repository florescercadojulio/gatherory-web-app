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
import { type FormEvent, useState } from "react"

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
            <span className="truncate text-sm font-medium">All workspaces</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-10 p-4 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Workspaces
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Move between events you manage and planning spaces that have
                been shared with you.
              </p>
            </div>
            <CreateWorkspaceDialog />
          </div>

          <WorkspaceSection
            id="owned-workspaces"
            title="Your workspaces"
            description="Planning spaces where you are a workspace member."
            workspaces={ownedWorkspaces}
            currentWorkspaceId={defaultWorkspaceContext.workspace.id}
          />

          <WorkspaceSection
            id="shared-workspaces"
            title="Shared with you"
            description="Events where you participate without workspace administration access."
            workspaces={sharedWorkspaces}
            currentWorkspaceId={defaultWorkspaceContext.workspace.id}
            emptyMessage="No additional workspaces have been shared with you yet."
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function CreateWorkspaceDialog() {
  const navigate = useNavigate()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError("Enter a workspace name with at least two characters.")
      return
    }

    setError(null)
    setIsPending(true)
    try {
      const result = await createWorkspace({ data: { name: trimmedName } })
      if (!result.ok) {
        setError(result.error.userMessage)
        return
      }

      setOpen(false)
      setName("")
      await router.invalidate()
      await navigate({
        to: "/workspaces/$workspaceSlug",
        params: { workspaceSlug: result.data.slug },
      })
    } catch {
      setError("The workspace could not be created. Try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setError(null)
      }}
    >
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" />
        New workspace
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>
              Give this event-planning space a recognizable name. You can
              invite hosts, collaborators, and guests afterward.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              name="workspaceName"
              autoComplete="off"
              maxLength={80}
              placeholder="Summer cabin weekend"
              value={name}
              disabled={isPending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "workspace-name-error" : undefined}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            {error ? (
              <p id="workspace-name-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || name.trim().length < 2}>
              {isPending ? "Creating…" : "Create workspace"}
            </Button>
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
                        ? "Personal event workspace"
                        : "Organization workspace"
                      : "Shared event workspace"}
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
              {emptyMessage ?? "No workspaces to show yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  )
}
