import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'

const calls = vi.hoisted(() => ({ user: vi.fn(), list: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/auth/connectors/session-user.con.live', () => ({ sessionUser: vi.fn() }))
vi.mock('@/server/http-errors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/http-errors')>()),
  requestUser: calls.user,
}))
vi.mock('@/server/blueprints/workflows/blueprint-library.workflows.live', () => ({
  listUsedBlueprints: calls.list,
}))
const { handleBlueprintLibraryRequest } =
  await import('@/server/blueprints/handlers/blueprint-library.handler')

beforeEach(() => vi.clearAllMocks())

test('rejects anonymous callers without querying installation history', async () => {
  calls.user.mockReturnValue(
    Effect.fail(
      new ForbiddenError({ category: 'authorization', code: 'UNAUTHORIZED', httpStatus: 401 })
    )
  )
  const response = await handleBlueprintLibraryRequest(
    new Request('https://example.test/api/blueprints/library')
  )
  expect(response.status).toBe(401)
  expect(calls.list).not.toHaveBeenCalled()
})

test('returns only the documented installation fields and prevents shared caching', async () => {
  const actor = { id: 'actor-user' }
  const installation = {
    installationID: '00000000-0000-4000-8000-000000000001',
    scopeID: '00000000-0000-4000-8000-000000000002',
    catalogKey: 'wedding',
    revision: 3,
    templateName: 'Wedding Weekend',
    eventName: 'Jordan & Casey',
    installedAt: '2026-10-16T12:34:56.789Z',
  }
  calls.user.mockReturnValue(Effect.succeed(actor))
  calls.list.mockReturnValue(Effect.succeed({ installations: [installation] }))
  const response = await handleBlueprintLibraryRequest(
    new Request('https://example.test/api/blueprints/library')
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ installations: [installation] })
  expect(response.headers.get('Cache-Control')).toContain('no-store')
  expect(calls.list).toHaveBeenCalledWith(actor.id)
})
