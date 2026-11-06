import * as authTables from '@/db/schema/auth.schema'
import * as mcpOAuthTables from '@/db/schema/mcp-oauth.schema'

/** Complete runtime schema passed to Better Auth, including optional MCP tables. */
export const authSchema = {
  ...authTables,
  ...mcpOAuthTables,
}
