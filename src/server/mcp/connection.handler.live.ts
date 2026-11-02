import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { env } from '@/env'
import { mcpResourceURL } from './auth-config'
import { createMcpConnectionHandlers } from './connection.handler'
import { McpConnectionSessionConnectorLive } from './connection-session.con.live'
import { getMcpConnectionSessionWorkflow } from './connection.workflow'
import {
  listMcpConnectionsWorkflow,
  reduceMcpConnectionScopesWorkflow,
} from './connection.workflows.live'

const resourceURL = mcpResourceURL(env.BETTER_AUTH_URL)

export const mcpConnectionHandlers = createMcpConnectionHandlers({
  enabled: env.MCP_ENABLED,
  origin: new URL(env.BETTER_AUTH_URL).origin,
  resourceURL,
  session: (headers) =>
    getMcpConnectionSessionWorkflow(headers).pipe(
      Effect.provide(McpConnectionSessionConnectorLive)
    ),
  list: (input) => listMcpConnectionsWorkflow(input).pipe(Effect.provide(PgClientLive)),
  reduce: (input) => reduceMcpConnectionScopesWorkflow(input).pipe(Effect.provide(PgClientLive)),
})
