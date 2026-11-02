import { Effect } from 'effect'
import { McpConnectionService } from './connection.service'
import { McpConnectionSessionConnector } from './connection-session.con'

export const getMcpConnectionSessionWorkflow = (headers: Headers) =>
  Effect.flatMap(McpConnectionSessionConnector, (connector) => connector.getUser(headers))

export const listMcpConnectionsWorkflow = (input: { userId: string; resourceURL: string }) =>
  Effect.flatMap(McpConnectionService, (service) => service.list(input))

export const reduceMcpConnectionScopesWorkflow = (input: {
  userId: string
  clientId: string
  resourceURL: string
  requestedScopes: string[]
}) => Effect.flatMap(McpConnectionService, (service) => service.reduceScopes(input))
