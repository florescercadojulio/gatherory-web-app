import { beforeEach, expect, test, vi } from 'vitest'
import { Effect } from 'effect'

const state = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: state.getSession } } }))

const { McpConnectionSessionConnectorLive } =
  await import('@/server/mcp/connection-session.con.live')
const { McpConnectionSessionConnector } = await import('@/server/mcp/connection-session.con')

beforeEach(() => {
  state.getSession.mockReset()
  state.getSession.mockResolvedValue({
    user: { id: 'user-1', email: 'person@example.test', name: 'Person', image: undefined },
  })
})

test('MCP session lookup uses the cookie with Better Auth cache and refresh disabled', async () => {
  const headers = new Headers({ cookie: 'session=opaque', authorization: 'Bearer ignored' })
  const user = await Effect.runPromise(
    Effect.flatMap(McpConnectionSessionConnector, (connector) => connector.getUser(headers)).pipe(
      Effect.provide(McpConnectionSessionConnectorLive)
    )
  )

  expect(user).toEqual({
    id: 'user-1',
    email: 'person@example.test',
    name: 'Person',
    image: null,
  })
  expect(state.getSession).toHaveBeenCalledWith({
    headers,
    query: { disableCookieCache: true, disableRefresh: true },
  })
})
