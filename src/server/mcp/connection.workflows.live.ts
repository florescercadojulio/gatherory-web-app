import { Effect, Layer } from 'effect'
import { McpConnectionRepositoryLive } from './connection.repo.live'
import { McpConnectionServiceLive } from './connection.service.live'
import {
  listMcpConnectionsWorkflow as list,
  reduceMcpConnectionScopesWorkflow as reduce,
} from './connection.workflow'

const McpConnectionDomainLive = McpConnectionServiceLive.pipe(
  Layer.provide(McpConnectionRepositoryLive)
)

export const listMcpConnectionsWorkflow = (...args: Parameters<typeof list>) =>
  list(...args).pipe(Effect.provide(McpConnectionDomainLive))

export const reduceMcpConnectionScopesWorkflow = (...args: Parameters<typeof reduce>) =>
  reduce(...args).pipe(Effect.provide(McpConnectionDomainLive))
