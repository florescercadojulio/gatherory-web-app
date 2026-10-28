import { createFileRoute } from '@tanstack/react-router'
import { McpConnectionPage } from '@/components/mcp/connection-page'

export const Route = createFileRoute('/mcp/connect')({
  head: () => ({
    meta: [
      { name: 'referrer', content: 'no-referrer' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: () => <McpConnectionPage mode="connect" />,
})
