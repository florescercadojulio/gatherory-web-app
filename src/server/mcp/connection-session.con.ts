import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'

export type McpConnectionSessionUser = {
  id: string
  email: string
  name: string
  image: string | null
}

export type McpConnectionSessionConnectorShape = {
  getUser: (headers: Headers) => Effect.Effect<McpConnectionSessionUser | null, DomainError>
}

export class McpConnectionSessionConnector extends Context.Service<
  McpConnectionSessionConnector,
  McpConnectionSessionConnectorShape
>()('McpConnectionSessionConnector') {}
