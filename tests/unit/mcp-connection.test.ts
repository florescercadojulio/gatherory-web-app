import { expect, test, vi } from 'vitest'
import {
  isMcpConnectionPath,
  mcpAuthorizationResumeURL,
  mcpConnectionRequest,
  mcpMergeUpdatedConnection,
  mcpPasswordSignInDestination,
  mcpReadOnlyScopes,
  mcpSocialSignInOptions,
  oauthResponseRedirect,
} from '@/lib/mcp-connection'
import { createMcpBlueprintSearch } from '@/server/mcp/blueprints'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'

test('MCP telemetry exclusion stays limited to connection and consent pages', () => {
  for (const path of ['/mcp/connect', '/mcp/consent/', '/mcp/connections']) {
    expect(isMcpConnectionPath(path)).toBe(true)
  }
  for (const path of ['/auth/sign-in', '/workspaces', '/mcp/admin', '/mcp/consent/other']) {
    expect(isMcpConnectionPath(path)).toBe(false)
  }
})

test('read-only permission changes remove write while preserving read and refresh access', () => {
  expect(mcpReadOnlyScopes(['gatherory:read', 'gatherory:write', 'offline_access'])).toEqual([
    'gatherory:read',
    'offline_access',
  ])
  expect(mcpReadOnlyScopes(['gatherory:read', 'offline_access'])).toEqual([
    'gatherory:read',
    'offline_access',
  ])
})

test('partial permission update keeps registered app name and icon', () => {
  const connections = [
    {
      id: 'consent-1',
      clientId: 'client-1',
      name: 'Gatherory Assistant',
      icon: 'https://client.example/icon.png',
      scopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
      updatedAt: '2026-10-25T12:00:00.000Z',
    },
  ]
  expect(
    mcpMergeUpdatedConnection(connections, {
      id: 'consent-1',
      scopes: ['gatherory:read', 'offline_access'],
      updatedAt: '2026-10-25T12:01:00.000Z',
    })
  ).toEqual([
    {
      ...connections[0],
      scopes: ['gatherory:read', 'offline_access'],
      updatedAt: '2026-10-25T12:01:00.000Z',
    },
  ])
})

test('connection display rejects unsigned and unknown-scope requests; redirects never use query fields', () => {
  const query = new URLSearchParams({
    client_id: 'https://client.example/metadata',
    scope: 'gatherory:read gatherory:write',
    sig: 'signed-by-provider',
    ba_param: 'client_id',
  })
  expect(mcpConnectionRequest(query.toString())).toEqual({
    clientId: 'https://client.example/metadata',
    scopes: ['gatherory:read', 'gatherory:write'],
  })
  query.set('scope', 'admin')
  expect(mcpConnectionRequest(query.toString())).toBeNull()
  query.delete('sig')
  expect(mcpConnectionRequest(query.toString())).toBeNull()
  expect(oauthResponseRedirect({ redirect_uri: 'https://attacker.example' })).toBeNull()
  expect(oauthResponseRedirect({ url: '/mcp/consent?signed=true' })).toBe(
    '/mcp/consent?signed=true'
  )
})

test('social sign-in returns to the MCP connection page on success and error', () => {
  const search = new URLSearchParams({
    client_id: 'client-1',
    sig: 'signed',
    ba_iat: '123',
    scope: 'gatherory:read',
  })
  search.append('ba_param', 'client_id')
  search.append('ba_param', 'state')
  search.append('ba_param', 'ba_iat')
  search.append('ba_param', 'ba_param')
  search.append('ba_param', 'scope')
  search.append('state', 'pkce-state')
  search.append('tracking', 'remove-me')
  const callbackURL = `/mcp/connect?${new URLSearchParams({
    client_id: 'client-1',
    sig: 'signed',
    ba_iat: '123',
    scope: 'gatherory:read',
    ba_param: 'client_id',
  })}&ba_param=state&ba_param=ba_iat&ba_param=ba_param&ba_param=scope&state=pkce-state`

  expect(mcpSocialSignInOptions('google', `?${search}`)).toEqual({
    provider: 'google',
    callbackURL,
    errorCallbackURL: callbackURL,
  })
  expect(mcpSocialSignInOptions('apple')).toEqual({
    provider: 'apple',
    callbackURL: '/mcp/connect',
    errorCallbackURL: '/mcp/connect',
  })
  expect(mcpAuthorizationResumeURL(`?${search}`)).toBe(
    callbackURL.replace('/mcp/connect', '/mcp/consent')
  )
  expect(mcpAuthorizationResumeURL('?client_id=untrusted')).toBeNull()
  expect(mcpAuthorizationResumeURL('?sig=s&state=s&ba_param=client_id')).toBeNull()
  expect(
    mcpAuthorizationResumeURL('?sig=s&client_id=c&state=s&ba_param=client_id&ba_param=state')
  ).toBeNull()
  expect(
    mcpAuthorizationResumeURL(
      '?sig=s&client_id=c&state=s&ba_param=client_id&ba_param=state&error=access_denied'
    )
  ).toBeNull()
  expect(
    mcpAuthorizationResumeURL('?sig=s&client_id=c&ba_param=client_id&state=s&ba_param=state')
  ).toBeNull()
  const loginPrompt = new URLSearchParams(search)
  loginPrompt.delete('tracking')
  loginPrompt.set('prompt', 'login')
  loginPrompt.append('ba_param', 'prompt')
  expect(mcpAuthorizationResumeURL(`?${loginPrompt}`)).toBe(`/mcp/consent?${loginPrompt}`)
})

test('password sign-in can recover from provider cancellation using Better Auth’s verified response URL', () => {
  const valid = new URLSearchParams({
    client_id: 'client-1',
    sig: 'signed',
    state: 'state-1',
    scope: 'gatherory:read',
  })
  valid.append('ba_param', 'client_id')
  valid.append('ba_param', 'state')
  valid.append('ba_param', 'scope')

  const signedSearch = `?${valid}&redirect_uri=${encodeURIComponent('https://attacker.example/callback')}&error=access_denied`
  const verifiedURL = 'https://assistant.example.test/callback?code=issued-by-better-auth'

  expect(mcpPasswordSignInDestination(signedSearch, { url: verifiedURL })).toBe(verifiedURL)
  expect(mcpPasswordSignInDestination(signedSearch, {})).toBeNull()
  expect(mcpAuthorizationResumeURL(signedSearch)).toBeNull()
  expect(mcpPasswordSignInDestination(`?${valid}`, {})).toBeNull()
  expect(mcpPasswordSignInDestination(`?${valid}`, { url: 42 })).toBeNull()
  expect(mcpPasswordSignInDestination('?redirectTo=%2Fevents', { url: '/events' })).toBeNull()
})

test('Blueprint search reuses typed search and returns only published discovery summaries', async () => {
  const catalog = vi.fn(async () => ({
    entries: [
      {
        ...weddingBlueprintV1,
        discovery: {
          categories: ['weddings'] as ['weddings'],
          tags: ['private implementation field'],
          summary: 'Plan a wedding',
        },
        discoveryContext: undefined,
      },
    ],
    nextCursor: 'next',
    availableCategories: ['weddings'] as ['weddings'],
  }))
  const search = createMcpBlueprintSearch(catalog)
  const result = await search({ query: 'Wédding', limit: 4 }, { userId: 'verified-account' })
  expect(catalog).toHaveBeenCalledWith('verified-account', { q: 'wedding', limit: 4 })
  expect(result).toEqual({
    items: [{ catalogKey: 'wedding', revision: 1, name: 'Wedding', summary: 'Plan a wedding' }],
    nextCursor: 'next',
  })
  expect(JSON.stringify(result)).not.toContain('modules')
  expect(JSON.stringify(result)).not.toContain('private implementation field')
  await expect(search({ query: '', limit: 400 }, { userId: 'verified-account' })).rejects.toThrow()
  expect(catalog).toHaveBeenCalledTimes(1)
})
