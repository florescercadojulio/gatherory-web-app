import { requireMcpAuth } from '@better-auth/mcp'
import { env } from '@/env'
import { auth } from '@/lib/auth'
import { createMcpHttpHandler, MCP_READ_SCOPE } from './http'
import { authorizeMcpClaims } from './authorization.live'
import { mcpResourceURL } from './auth-config'
import { MCP_EVENT_TOOLS, createMcpEventTools } from './tools'
import { liveMcpContentPort } from './content/live'
import { MCP_BLUEPRINT_SEARCH } from './blueprints'
import { searchMcpBlueprints } from './blueprints.live'

export async function handleGatheroryMcpRequest(request: Request) {
  if (!env.MCP_ENABLED)
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  const resource = mcpResourceURL(env.BETTER_AUTH_URL)
  const service = createMcpEventTools(liveMcpContentPort)
  return createMcpHttpHandler({
    resource,
    authenticate: (request, next) =>
      requireMcpAuth(auth, next, {
        resource,
        requiredScopes: [MCP_READ_SCOPE],
      })(request),
    authorizeClaims: authorizeMcpClaims,
    tools: [...MCP_EVENT_TOOLS, MCP_BLUEPRINT_SEARCH],
    callTool: (name, input, actor) => {
      if (name === MCP_BLUEPRINT_SEARCH.name) return searchMcpBlueprints(input, actor)
      return service.call(name, input, actor)
    },
  })(request)
}
