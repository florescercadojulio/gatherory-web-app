import { createFileRoute } from '@tanstack/react-router'
import { mcpConnectionHandlers } from '@/server/mcp/connection.handler.live'

export { mcpConnectionHandlers }

export const Route = createFileRoute('/api/mcp/connection')({
  server: { handlers: mcpConnectionHandlers },
})
