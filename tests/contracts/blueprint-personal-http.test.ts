import { Effect, Layer } from 'effect'
import { beforeEach, expect, test, vi } from 'vitest'

const calls = vi.hoisted(() => ({ execute: vi.fn(), user: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/sync/handlers/native-sync-auth.handler', () => ({ nativeSyncUser: calls.user }))
vi.mock('@/server/blueprints/repos/blueprint-personal.repo.live', () => ({
  BlueprintPersonalRepoLive: Layer.empty,
}))
vi.mock('@/server/blueprints/workflows/blueprint-personal.workflows.live', () => ({
  managePersonalBlueprints: (...args: unknown[]) => calls.execute(...args),
}))
const { handlePersonalBlueprintRequest } =
  await import('@/server/blueprints/handlers/blueprint-personal.handler')

const request = (body: unknown) =>
  new Request('https://app.example/api/blueprints/personal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  calls.user.mockResolvedValue({ id: 'actor' })
})

test('personal lifecycle dispatches authenticated list, save, publish, unlist, and delete commands', async () => {
  for (const [input, output] of [
    [{ action: 'list' }, { templates: [] }],
    [
      {
        action: 'save',
        id: '10000000-0000-4000-8000-000000000001',
        expectedVersion: 2,
        content: {},
      },
      { id: 'template' },
    ],
    [
      {
        action: 'publish',
        id: '10000000-0000-4000-8000-000000000001',
        expectedVersion: 2,
      },
      { id: 'template' },
    ],
    [
      {
        action: 'unlist',
        id: '10000000-0000-4000-8000-000000000001',
        expectedVersion: 3,
        expectedListedRevision: 2,
      },
      { id: 'template', listedRevision: null },
    ],
    [{ action: 'delete', id: '10000000-0000-4000-8000-000000000001' }, { deleted: true }],
  ] as const) {
    calls.execute.mockReturnValue(Effect.succeed(output))
    const response = await handlePersonalBlueprintRequest(request(input))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(output)
    expect(calls.execute).toHaveBeenCalledWith('actor', input)
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  }
})

test('anonymous callers cannot list or mutate personal blueprints', async () => {
  calls.user.mockResolvedValue(null)
  const response = await handlePersonalBlueprintRequest(
    request({
      action: 'unlist',
      id: '10000000-0000-4000-8000-000000000001',
      expectedVersion: 3,
      expectedListedRevision: 2,
    })
  )
  expect(response.status).toBe(401)
  expect(calls.execute).not.toHaveBeenCalled()
})

test('malformed JSON is rejected before dispatch', async () => {
  const response = await handlePersonalBlueprintRequest(
    new Request('https://app.example/api/blueprints/personal', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
      body: '{broken',
    })
  )
  expect(response.status).toBe(400)
  expect(calls.execute).not.toHaveBeenCalled()
})
