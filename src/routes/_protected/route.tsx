import { createFileRoute, Outlet } from "@tanstack/react-router"

import { PageUnavailable, ServerErrorToast } from "@/components/route-feedback"
import { ensurePersonalWorkspace } from "@/server/workspaces/handlers/workspace.handlers"

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const result = await ensurePersonalWorkspace()

    return {
      defaultWorkspaceContext: result.ok ? result.data : null,
      defaultWorkspaceError: result.ok ? null : result.error,
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { defaultWorkspaceContext, defaultWorkspaceError } =
    Route.useRouteContext()

  if (!defaultWorkspaceContext) {
    return (
      <>
        <ServerErrorToast error={defaultWorkspaceError} />
        <PageUnavailable
          title="Your workspace could not be prepared"
          description="Gatherory kept the rest of the app available. Try loading your workspace again."
        />
      </>
    )
  }

  return <Outlet />
}
