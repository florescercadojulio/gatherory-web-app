import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { resolveWorkspace } from "@/server/workspaces/handlers/workspace.handlers"

export const Route = createFileRoute(
  "/_protected/workspaces/$workspaceSlug",
)({
  beforeLoad: async ({ params }) => ({
    workspaceContext: await resolveWorkspace({
      data: { slug: params.workspaceSlug },
    }),
  }),
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { workspaceContext } = Route.useRouteContext()

  return (
    <SidebarProvider>
      <AppSidebar
        workspace={workspaceContext.workspace}
        workspaces={workspaceContext.workspaces}
        planningTeamName={workspaceContext.planningTeam?.name ?? null}
        user={workspaceContext.user}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
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
