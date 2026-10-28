import { Effect, Layer } from 'effect'
import { beforeEach, expect, test, vi } from 'vitest'

const calls = vi.hoisted(() => ({ copy: vi.fn(), user: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/http-errors', async () => {
  const { Effect: RuntimeEffect } = await import('effect')
  return {
    requestUser: () => RuntimeEffect.succeed(calls.user()),
    requestJson: (request: Request) => RuntimeEffect.promise(() => request.json()),
  }
})
vi.mock('@/server/blueprints/workflows/blueprint-copy.workflows.live', () => ({
  createBlueprintCopy: (...args: unknown[]) => calls.copy(...args),
}))

const { handleBlueprintCopyRequest } =
  await import('@/server/blueprints/handlers/blueprint-copy.handler')

const content = {
  name: 'Portable copy',
  description: '',
  experienceType: 'custom',
  children: [],
  ideas: [],
  instructions: [],
  todos: [],
}
const requestID = '10000000-0000-4000-8000-000000000002'
const responseBody = {
  id: '10000000-0000-4000-8000-000000000001',
  draftVersion: 1,
  publishedRevision: 1,
  listedRevision: null,
  creatorName: null,
  activeShareLinkCount: 0,
  catalogEntry: {
    catalogKey: 'private_abc',
    revision: 1,
    contentHash: 'a'.repeat(64),
    definition: {
      $schema: 'https://gatherory.com/schemas/experience-blueprint-v1.json',
      kind: 'experience_blueprint',
      schemaVersion: 1,
      blueprint: { id: 'portable-copy', revision: 1, name: 'Portable copy' },
      experienceDefaults: { type: 'custom' },
      roles: [],
      modules: [
        {
          key: 'event_tree',
          type: 'experience_tree',
          version: 2,
          required: false,
          config: { mainEventType: 'custom', children: [] },
        },
      ],
    },
    description: '',
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  calls.user.mockReturnValue({
    id: 'session-actor',
    name: 'Signed in person',
    email: 'actor@example.test',
    emailVerified: true,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    hasCompletedOnboarding: true,
  })
  calls.copy.mockReturnValue(Effect.succeed(responseBody))
})

test('copy endpoint projects the full Better Auth session user to the strict workflow actor', async () => {
  const request = new Request('https://app.example/api/blueprints/copies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
    body: JSON.stringify({ requestId: requestID, content }),
  })

  const response = await handleBlueprintCopyRequest(request)

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(responseBody)
  expect(calls.copy).toHaveBeenCalledWith(
    { id: 'session-actor', name: 'Signed in person' },
    { requestId: requestID, content }
  )
})
