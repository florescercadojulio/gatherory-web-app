/** Display-only parsing. Better Auth verifies the signed query on every auth/consent POST. */
export function mcpConnectionRequest(search: string) {
  const params = new URLSearchParams(search)
  const clientId = params.get('client_id')
  const scopes = params.get('scope')?.split(' ').filter(Boolean) ?? []
  if (
    !clientId ||
    !params.get('sig') ||
    !params.get('ba_param') ||
    scopes.length === 0 ||
    scopes.some((scope) => !['gatherory:read', 'gatherory:write', 'offline_access'].includes(scope))
  )
    return null
  return { clientId, scopes: [...new Set(scopes)] }
}

/** Narrow a grant to read-only while retaining its refresh-token policy. */
export function mcpReadOnlyScopes(scopes: string[]) {
  return [...new Set(scopes.filter((scope) => scope !== 'gatherory:write'))]
}

/** Merge a partial permissions update without discarding app registry metadata. */
export function mcpMergeUpdatedConnection<T extends { id: string }>(
  connections: T[],
  updated: Partial<T> & Pick<T, 'id'>
) {
  return connections.map((connection) =>
    connection.id === updated.id ? { ...connection, ...updated } : connection
  )
}

/** Redirects come from Better Auth's verified response, never a URL query field. */
export function oauthResponseRedirect(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('url' in value) || typeof value.url !== 'string')
    return null
  return value.url
}

function signedMcpOAuthQuery(search: string) {
  const params = new URLSearchParams(search)
  const signedNames = new Set(params.getAll('ba_param'))
  if (!params.has('sig') || !signedNames.has('client_id') || !signedNames.has('state')) return ''
  const signedQuery = new URLSearchParams()
  for (const [key, value] of params) {
    if (key === 'sig' || key === 'ba_param' || signedNames.has(key)) signedQuery.append(key, value)
  }
  return signedQuery.toString()
}

/** Resume Better Auth authorization after an OAuth callback establishes the session. */
export function mcpAuthorizationResumeURL(search: string) {
  const params = new URLSearchParams(search)
  if (params.has('error') || params.has('error_description')) return null
  if (!mcpConnectionRequest(search)) return null
  const query = signedMcpOAuthQuery(search)
  return query ? `/mcp/consent?${query}` : null
}

/** Destination after password sign-in succeeds; authorization still needs explicit consent. */
export function mcpPasswordSignInDestination(search: string, response: unknown) {
  if (!mcpConnectionRequest(search)) return null
  return oauthResponseRedirect(response)
}

/** Keep the verified OAuth request on this same-origin callback through social auth. */
export function mcpSocialSignInOptions(provider: 'google' | 'apple', search = '') {
  const query = signedMcpOAuthQuery(search)
  const callbackURL = `/mcp/connect${query ? `?${query}` : ''}`
  return {
    provider,
    callbackURL,
    errorCallbackURL: callbackURL,
  } as const
}

export function isMcpConnectionPath(pathname: string) {
  return ['/mcp/connect', '/mcp/consent', '/mcp/connections'].includes(pathname.replace(/\/+$/, ''))
}
