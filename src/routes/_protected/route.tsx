import { createFileRoute, Outlet } from "@tanstack/react-router"

import { ensurePersonalWorkspace } from "@/server/workspaces/handlers/workspace.handlers"

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => ({
    defaultWorkspaceContext: await ensurePersonalWorkspace(),
  }),
  component: () => <Outlet />,
})
