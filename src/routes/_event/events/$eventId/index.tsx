import { createFileRoute, redirect } from '@tanstack/react-router'

/** Keep direct legacy planner URLs inside the overview-only web experience. */
export const Route = createFileRoute('/_event/events/$eventId/')({
  beforeLoad: () => {
    throw redirect({ to: '/workspaces' })
  },
})
