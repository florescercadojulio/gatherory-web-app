import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'

const calls = vi.hoisted(() => ({
  user: vi.fn(),
  catalog: vi.fn(),
  catalogPage: vi.fn(),
  preview: vi.fn(),
  schedule: vi.fn(),
  install: vi.fn(),
  status: vi.fn(),
}))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/auth/connectors/session-user.con.live', () => ({ sessionUser: vi.fn() }))
vi.mock('@/server/http-errors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/http-errors')>()),
  requestUser: calls.user,
}))
vi.mock('@/server/blueprints/workflows/blueprint.workflows.live', () => ({
  blueprintCatalog: calls.catalog,
  blueprintCatalogPage: calls.catalogPage,
  previewBlueprint: calls.preview,
  scheduleBlueprint: calls.schedule,
  installBlueprint: calls.install,
  blueprintStatus: calls.status,
}))
const { handleBlueprintRequest } = await import('@/server/blueprints/handlers/blueprint.handler')
beforeEach(() => {
  vi.clearAllMocks()
})

test.each(['catalog', 'preview', 'install', 'status', 'schedule'] as const)(
  '%s rejects anonymous callers before reading or writing',
  async (action) => {
    calls.user.mockReturnValue(
      Effect.fail(
        new ForbiddenError({ category: 'authorization', code: 'UNAUTHORIZED', httpStatus: 401 })
      )
    )
    const response = await handleBlueprintRequest(
      new Request('https://example.test/api/blueprints/install', { method: 'POST' }),
      action
    )
    expect(response.status).toBe(401)
    expect(calls.catalog).not.toHaveBeenCalled()
    expect(calls.preview).not.toHaveBeenCalled()
    expect(calls.schedule).not.toHaveBeenCalled()
    expect(calls.install).not.toHaveBeenCalled()
    expect(calls.status).not.toHaveBeenCalled()
  }
)

test('schedule returns suggestions without creating an installation', async () => {
  const { weddingBlueprintV1 } = await import('@/server/blueprints/catalog/wedding.v1')
  const { suggestBlueprintSchedule } =
    await import('@/server/blueprints/planning/suggest-blueprint-schedule.server')
  const input = {
    catalogKey: weddingBlueprintV1.catalogKey,
    revision: weddingBlueprintV1.revision,
    contentHash: weddingBlueprintV1.contentHash,
    mainEvent: { startsAt: '2027-06-15T19:00:00Z', timeZone: 'America/Detroit' },
  }
  const result = suggestBlueprintSchedule(input, weddingBlueprintV1.definition)
  calls.user.mockReturnValue(Effect.succeed({ id: 'host' }))
  calls.schedule.mockReturnValue(Effect.succeed(result))
  const response = await handleBlueprintRequest(
    new Request('https://example.test/api/blueprints/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
    'schedule'
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(result)
  expect(response.headers.get('Cache-Control')).toContain('no-store')
  expect(calls.schedule).toHaveBeenCalledWith(input, 'host')
  expect(calls.install).not.toHaveBeenCalled()
  expect(calls.preview).not.toHaveBeenCalled()
})

test('install uses authenticated identity and serializes the durable manifest without an extra envelope', async () => {
  const actor = { id: 'actor', name: 'Host', email: 'host@example.test' }
  const result = {
    installationID: crypto.randomUUID(),
    organizationID: 'workspace',
    scopeID: crypto.randomUUID(),
    manifest: {
      events: { main: crypto.randomUUID() },
      ideas: {},
      guides: {},
      personID: crypto.randomUUID(),
      participations: {},
    },
  }
  calls.user.mockReturnValue(Effect.succeed(actor))
  calls.install.mockReturnValue(Effect.succeed(result))
  const input = { requestId: crypto.randomUUID() }
  const response = await handleBlueprintRequest(
    new Request('https://example.test/api/blueprints/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
    'install'
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(result)
  expect(response.headers.get('Cache-Control')).toContain('no-store')
  expect(calls.install).toHaveBeenCalledWith(actor, input)
})

test('catalog reads the device context from its header and ignores malformed context for typed search', async () => {
  calls.user.mockReturnValue(Effect.succeed({ id: 'actor' }))
  calls.catalogPage.mockReturnValue(Effect.succeed({ entries: [], availableCategories: [] }))
  const discoverySession = {
    version: 1,
    sessionId: '7e9d1f13-5a19-4a1e-9ad6-6f4f68081a54',
    startedAt: '2026-10-22T23:30:00.000Z',
    seen: [{ catalogKey: 'wedding', lastSeenAt: '2026-10-22T22:30:00.000Z' }],
  }
  const browse = await handleBlueprintRequest(
    new Request('https://example.test/api/blueprints?limit=2&ranking=baseline_v1', {
      headers: { 'X-Gatherory-Discovery-Context': JSON.stringify(discoverySession) },
    }),
    'catalog'
  )
  expect(browse.status).toBe(200)
  expect(calls.catalogPage).toHaveBeenLastCalledWith('actor', {
    limit: 2,
    q: '',
    ranking: 'baseline_v1',
    discoverySession,
  })

  calls.catalogPage.mockClear()
  const search = await handleBlueprintRequest(
    new Request('https://example.test/api/blueprints?limit=2&ranking=baseline_v1&q=wedding', {
      headers: { 'X-Gatherory-Discovery-Context': '{ malformed json' },
    }),
    'catalog'
  )
  expect(search.status).toBe(200)
  expect(calls.catalogPage).toHaveBeenCalledWith('actor', {
    limit: 2,
    q: 'wedding',
    ranking: 'baseline_v1',
  })
})

test('catalog rejects malformed discovery context during browse before paging', async () => {
  calls.user.mockReturnValue(Effect.succeed({ id: 'actor' }))
  const response = await handleBlueprintRequest(
    new Request('https://example.test/api/blueprints?ranking=baseline_v1', {
      headers: { 'X-Gatherory-Discovery-Context': '{ malformed json' },
    }),
    'catalog'
  )
  expect(response.status).toBe(400)
  expect(calls.catalogPage).not.toHaveBeenCalled()
})
