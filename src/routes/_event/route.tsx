import { createFileRoute, redirect } from '@tanstack/react-router'

/** Planner event routes are shelved; the signed-in web companion starts at the overview. */
export const Route = createFileRoute('/_event')({
  beforeLoad: () => {
    throw redirect({ to: '/workspaces' })
  },
})
