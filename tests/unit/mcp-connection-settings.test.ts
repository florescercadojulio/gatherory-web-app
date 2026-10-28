import { expect, test } from 'vitest'
import {
  safeReducedMcpScopes,
  shouldRetainMcpRefreshTokens,
} from '@/server/mcp/connection-settings'

test('permits only permission reductions while retaining the required read scope', () => {
  expect(
    safeReducedMcpScopes(
      ['gatherory:read', 'gatherory:write', 'offline_access'],
      ['gatherory:read', 'offline_access']
    )
  ).toEqual(['gatherory:read', 'offline_access'])
  expect(
    safeReducedMcpScopes(
      ['gatherory:read', 'gatherory:write', 'offline_access'],
      ['offline_access', 'gatherory:write', 'gatherory:read']
    )
  ).toEqual(['gatherory:read', 'gatherory:write', 'offline_access'])
  expect(safeReducedMcpScopes(['gatherory:read'], ['gatherory:read'])).toEqual(['gatherory:read'])
  expect(safeReducedMcpScopes(['gatherory:read'], ['gatherory:read', 'gatherory:write'])).toBeNull()
  expect(safeReducedMcpScopes(['gatherory:read'], ['gatherory:read', 'unknown'])).toBeNull()
  expect(
    safeReducedMcpScopes(['gatherory:read', 'gatherory:write'], ['gatherory:write'])
  ).toBeNull()
  expect(safeReducedMcpScopes(['gatherory:write'], ['gatherory:read'])).toBeNull()
})

test('refresh token family is retained only when offline access remains granted', () => {
  expect(shouldRetainMcpRefreshTokens(['gatherory:read', 'offline_access'])).toBe(true)
  expect(shouldRetainMcpRefreshTokens(['gatherory:read'])).toBe(false)
})
