import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AppSidebar } from "@/components/app-sidebar";
import { PageUnavailable, ServerErrorToast } from "@/components/route-feedback";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { resolveWorkspace } from "@/server/workspaces/handlers/workspace.handlers";

export const Route = createFileRoute("/_protected/workspaces/$workspaceSlug")({
  beforeLoad: async ({ params, context }) => {
    if (!context.defaultWorkspaceContext) {
      return {
        workspaceContext: null,
        workspaceError: context.defaultWorkspaceError,
      };
    }

    const result = await resolveWorkspace({
      data: { slug: params.workspaceSlug },
    });

    if (!result.ok) {
      return { workspaceContext: null, workspaceError: result.error };
    }
    if (!result.data) throw notFound();

    return { workspaceContext: result.data, workspaceError: null };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { t } = useTranslation();
  const { workspaceContext, workspaceError } = Route.useRouteContext();

  if (!workspaceContext) {
    return (
      <>
        <ServerErrorToast error={workspaceError} />
        <PageUnavailable
          title={t("feedback.workspaceLoadTitle")}
          description={t("feedback.workspaceLoadDescription")}
        />
      </>
    );
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
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/gatherory-icon.png"
              alt=""
              className="size-6 rounded-sm"
            />
            <span className="truncate text-sm font-medium">
              {workspaceContext.workspace.name}
            </span>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
