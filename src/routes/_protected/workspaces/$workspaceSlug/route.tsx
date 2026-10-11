import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { PageUnavailable, ServerErrorToast } from "@/components/route-feedback"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { resolveWorkspace } from "@/server/workspaces/handlers/workspace.handlers"

export const Route = createFileRoute("/_protected/workspaces/$workspaceSlug")({
  beforeLoad: async ({ params, context }) => {
    if (!context.defaultWorkspaceContext) {
      return {
        workspaceContext: null,
        workspaceError: context.defaultWorkspaceError,
      }
    }

    const result = await resolveWorkspace({
      data: { slug: params.workspaceSlug },
    })

    if (!result.ok) {
      return { workspaceContext: null, workspaceError: result.error }
    }
    if (!result.data) throw notFound()

    return { workspaceContext: result.data, workspaceError: null }
  },
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { workspaceContext, workspaceError } = Route.useRouteContext()

  if (!workspaceContext) {
    return (
      <>
        <ServerErrorToast error={workspaceError} />
        <PageUnavailable
          title="This workspace could not be loaded"
          description="Your other Gatherory pages are still available. Try loading this workspace again."
        />
      </>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        workspace={workspaceContext.workspace}
        workspaces={workspaceContext.workspaces}
        planningTeamName={workspaceContext.planningTeam?.name ?? null}
        user={workspaceContext.user}
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/gatherory-icon.png"
              alt=""
              className="size-6 rounded-md"
            />
            <span className="truncate text-sm font-medium">
              {workspaceContext.workspace.name}
            </span>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
