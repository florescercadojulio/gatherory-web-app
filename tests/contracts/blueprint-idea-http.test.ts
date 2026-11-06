import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'

const calls = vi.hoisted(() => ({ user: vi.fn(), catalog: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/auth/connectors/session-user.con.live', () => ({ sessionUser: vi.fn() }))
vi.mock('@/server/http-errors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/http-errors')>()),
  requestUser: calls.user,
}))
vi.mock('@/server/blueprints/workflows/blueprint.workflows.live', () => ({
  blueprintCatalog: calls.catalog,
}))
const { handleBlueprintIdeasRequest } =
  await import('@/server/blueprints/handlers/blueprint-ideas.handler')

beforeEach(() => vi.clearAllMocks())

test('rejects anonymous search before reading the public catalog', async () => {
  calls.user.mockReturnValue(
    Effect.fail(
      new ForbiddenError({ category: 'authorization', code: 'UNAUTHORIZED', httpStatus: 401 })
    )
  )
  const response = await handleBlueprintIdeasRequest(
    new Request('https://example.test/api/blueprints/ideas?q=venue')
  )
  expect(response.status).toBe(401)
  expect(calls.catalog).not.toHaveBeenCalled()
})

test('validates query parameters and returns the sanitized public idea projection', async () => {
  const { weddingBlueprintV1 } = await import('@/server/blueprints/catalog/wedding.v1')
  const { buildBlueprintCatalog, publicBlueprintCatalog } =
    await import('@/server/blueprints/services/blueprint-discovery')
  calls.user.mockReturnValue(Effect.succeed({ id: 'actor' }))
  calls.catalog.mockReturnValue(
    Effect.succeed(publicBlueprintCatalog(buildBlueprintCatalog([weddingBlueprintV1])))
  )
  const response = await handleBlueprintIdeasRequest(
    new Request('https://example.test/api/blueprints/ideas?q=photography&limit=5')
  )
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.ideas).toHaveLength(1)
  expect(body.ideas[0].idea.key).toBe('photography')
  expect(JSON.stringify(body)).not.toContain('coverAssetId')
  expect(JSON.stringify(body)).not.toContain('privateURL')
  expect(calls.catalog).toHaveBeenCalledWith('actor')

  const invalid = await handleBlueprintIdeasRequest(
    new Request('https://example.test/api/blueprints/ideas?limit=1000')
  )
  expect(invalid.status).toBe(400)
})
