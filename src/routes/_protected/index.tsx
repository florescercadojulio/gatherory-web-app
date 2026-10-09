import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_protected/")({
  beforeLoad: ({ context }) => {
    throw redirect({
      to: "/workspaces/$workspaceSlug",
      params: {
        workspaceSlug: context.defaultWorkspaceContext.workspace.slug,
      },
      replace: true,
    })
  },
})
