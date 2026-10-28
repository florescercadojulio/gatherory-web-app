import { getTableConfig } from 'drizzle-orm/pg-core'
import { expect, test } from 'vitest'
import * as authSchema from '@/db/schema/auth.schema'
import { createMcpAuthPlugins } from '@/server/mcp/auth-config'

import {
  jwks,
  oauthAccessToken,
  oauthClient,
  oauthClientAssertion,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthResource,
} from '@/db/schema/mcp-oauth.schema'

test('MCP schema contains the complete Better Auth OAuth persistence model', () => {
  const tables = [
    jwks,
    oauthClient,
    oauthResource,
    oauthClientResource,
    oauthRefreshToken,
    oauthAccessToken,
    oauthConsent,
    oauthClientAssertion,
  ]
  expect(tables.map((table) => getTableConfig(table).name)).toEqual([
    'jwks',
    'oauth_client',
    'oauth_resource',
    'oauth_client_resource',
    'oauth_refresh_token',
    'oauth_access_token',
    'oauth_consent',
    'oauth_client_assertion',
  ])

  expect(getTableConfig(oauthClient).columns.map((column) => column.name)).toContain(
    'client_discovery_id'
  )
  expect(getTableConfig(oauthResource).columns.map((column) => column.name)).toContain(
    'allowed_scopes'
  )
  expect(getTableConfig(oauthClientResource).indexes).toHaveLength(3)
  expect(getTableConfig(oauthRefreshToken).columns.map((column) => column.name)).toContain(
    'rotation_replay_response'
  )
  expect(getTableConfig(oauthAccessToken).columns.map((column) => column.name)).toContain('revoked')
  expect(getTableConfig(oauthConsent).columns.map((column) => column.name)).toContain('resources')
  expect(getTableConfig(oauthClientAssertion).columns.map((column) => column.name)).toEqual([
    'id',
    'expires_at',
  ])
})

test('auth exports provide every table and field required by the installed JWT and MCP plugins', () => {
  const pluginSchema: Record<string, { fields: Record<string, unknown> }> = {}
  for (const plugin of createMcpAuthPlugins('https://gatherory.test/api/auth')) {
    if ('schema' in plugin && plugin.schema) Object.assign(pluginSchema, plugin.schema)
  }
  const schemaTables = [
    jwks,
    oauthAccessToken,
    oauthClient,
    oauthClientAssertion,
    oauthClientResource,
    oauthConsent,
    oauthRefreshToken,
    oauthResource,
  ]
  expect([
    authSchema.jwks,
    authSchema.oauthAccessToken,
    authSchema.oauthClient,
    authSchema.oauthClientAssertion,
    authSchema.oauthClientResource,
    authSchema.oauthConsent,
    authSchema.oauthRefreshToken,
    authSchema.oauthResource,
  ]).toEqual(schemaTables)
  const toSnakeCase = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
  const expectedTables = Object.fromEntries(
    Object.entries(pluginSchema).map(([model, definition]) => [
      toSnakeCase(model),
      ['id', ...Object.keys(definition.fields).map(toSnakeCase)].sort(),
    ])
  )
  const actualTables = Object.fromEntries(
    schemaTables.map((table) => {
      const config = getTableConfig(table)
      return [config.name, config.columns.map((column) => column.name).sort()]
    })
  )

  expect(actualTables).toEqual(expectedTables)
})

test('MCP-owned rows cascade on account removal while nullable sessions keep set-null semantics', () => {
  const foreignKeyDeleteAction = (table: Parameters<typeof getTableConfig>[0], column: string) =>
    getTableConfig(table).foreignKeys.find((key) =>
      key.reference().columns.some((foreignKeyColumn) => foreignKeyColumn.name === column)
    )?.onDelete

  expect(foreignKeyDeleteAction(oauthClient, 'user_id')).toBe('cascade')
  expect(foreignKeyDeleteAction(oauthConsent, 'user_id')).toBe('cascade')
  expect(foreignKeyDeleteAction(oauthAccessToken, 'user_id')).toBe('cascade')
  expect(foreignKeyDeleteAction(oauthRefreshToken, 'user_id')).toBe('cascade')
  expect(foreignKeyDeleteAction(oauthAccessToken, 'refresh_id')).toBe('cascade')
  expect(foreignKeyDeleteAction(oauthAccessToken, 'session_id')).toBe('set null')
  expect(foreignKeyDeleteAction(oauthRefreshToken, 'session_id')).toBe('set null')
})
