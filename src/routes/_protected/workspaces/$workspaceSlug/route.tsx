import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/workspaces/$workspaceSlug')({
  beforeLoad: () => {
    throw redirect({ to: '/workspaces' })
  },
})
