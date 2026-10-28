const manageableScopes = new Set(['gatherory:read', 'offline_access'])

/** Return requested scopes only when they are a permission subset of the grant. */
export function safeReducedMcpScopes(
  currentScopes: readonly string[],
  requestedScopes: readonly string[]
) {
  const requested = [...new Set(requestedScopes)].sort()
  const current = new Set(currentScopes)
  if (requested.length === current.size && requested.every((scope) => current.has(scope)))
    return requested
  if (
    !requested.includes('gatherory:read') ||
    requested.some((scope) => !manageableScopes.has(scope) || !current.has(scope))
  ) {
    return null
  }
  return requested
}

/** Refresh tokens exist only when the grant retains OAuth offline access. */
export function shouldRetainMcpRefreshTokens(scopes: readonly string[]) {
  return scopes.includes('offline_access')
}
