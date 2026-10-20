import { Effect, Layer } from 'effect'
import { beforeEach, expect, test, vi } from 'vitest'
import { BlueprintEventCaptureSourceSchema } from '@/contracts/blueprint-capture.contracts'
import { BlueprintNativeCreationReviewResponseSchema } from '@/contracts/blueprint-native-creation.contracts'
import { captureEventBlueprint } from '@/server/blueprints/planning/capture-event-blueprint.server'
import {
  blueprintDraftContentHash,
  blueprintHash,
} from '@/server/blueprints/planning/blueprint-hash'

const calls = vi.hoisted(() => ({ native: vi.fn(), user: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/sync/handlers/native-sync-auth.handler', () => ({ nativeSyncUser: calls.user }))
vi.mock('@/server/blueprints/workflows/blueprint-native-creation.workflows.live', () => ({
  blueprintNativeCreation: (...args: unknown[]) => calls.native(...args),
}))

const { handleBlueprintNativeCreationRequest } =
  await import('@/server/blueprints/handlers/blueprint-native-creation.handler')
const eventId = '10000000-0000-4000-8000-000000000001'
const childId = '20000000-0000-4000-8000-000000000002'
const ideaId = '30000000-0000-4000-8000-000000000003'
const instructionId = '40000000-0000-4000-8000-000000000004'
const source = BlueprintEventCaptureSourceSchema.parse({
  event: {
    id: eventId,
    title: 'Source event',
    startsAt: null,
    timeZone: 'Etc/UTC',
    experienceType: 'custom',
  },
  children: [
    {
      id: childId,
      title: 'Ceremony',
      purpose: 'part_of_event',
      category: 'ceremony',
      startsAt: null,
    },
  ],
  ideas: [{ id: ideaId, eventId, title: 'Flowers', category: 'flowers', notes: null }],
  instructions: [
    {
      id: instructionId,
      eventId,
      title: 'Arrival',
      body: 'Arrive early.',
      audience: 'event_participants',
    },
  ],
})
const selection = {
  childIds: [childId],
  ideaIds: [ideaId],
  instructionIds: [instructionId],
  todoIds: [],
  includeIdeaNotes: false,
}
beforeEach(() => {
  vi.clearAllMocks()
  calls.user.mockResolvedValue({ id: 'actor', name: 'A Host' })
})

function post(body: unknown) {
  return new Request('https://app.example/api/blueprints/create-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('review HTTP boundary canonicalizes all UUIDs and validates its response', async () => {
  const name = 'A 🌿 Template'
  const content = captureEventBlueprint(source, selection, name)
  const expected = BlueprintNativeCreationReviewResponseSchema.parse({
    content,
    sourceHash: blueprintHash(source),
    reviewHash: blueprintDraftContentHash(content),
  })
  calls.native.mockReturnValue(Effect.succeed(expected))
  const response = await handleBlueprintNativeCreationRequest(
    post({
      action: 'review',
      eventId: eventId.toUpperCase(),
      selection: {
        childIds: [childId.toUpperCase()],
        ideaIds: [ideaId.toUpperCase()],
        instructionIds: [instructionId.toUpperCase()],
        includeIdeaNotes: false,
      },
      expectedSourceHash: expected.sourceHash,
      name,
    })
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(expected)
  expect(calls.native).toHaveBeenCalledWith(
    { id: 'actor', name: 'A Host' },
    expect.objectContaining({
      action: 'review',
      eventId,
      selection,
      name,
    })
  )
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex')
})

test('create returns only the template ID and initial revision', async () => {
  const result = { templateId: '60000000-0000-4000-8000-000000000006', revision: 1 }
  calls.native.mockReturnValue(Effect.succeed(result))
  const response = await handleBlueprintNativeCreationRequest(
    post({
      action: 'create',
      eventId,
      selection,
      expectedSourceHash: 'a'.repeat(64),
      name: 'A Template',
      organizationId: 'selected-workspace',
      requestId: '70000000-0000-4000-8000-000000000007'.toUpperCase(),
      expectedReviewHash: 'b'.repeat(64),
    })
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(result)
  expect(calls.native).toHaveBeenCalledWith(
    { id: 'actor', name: 'A Host' },
    expect.objectContaining({ requestId: '70000000-0000-4000-8000-000000000007' })
  )
})

test('invalid names and malformed requests fail before the workflow and still receive privacy headers', async () => {
  const response = await handleBlueprintNativeCreationRequest(
    post({
      action: 'review',
      eventId,
      selection,
      expectedSourceHash: 'a'.repeat(64),
      name: '   ',
    })
  )
  expect(response.status).toBe(400)
  expect(calls.native).not.toHaveBeenCalled()
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex')
})

test('anonymous creation and review cannot provision ownership or publish', async () => {
  calls.user.mockResolvedValue(null)
  for (const action of ['source', 'review', 'create', 'workspace']) {
    const response = await handleBlueprintNativeCreationRequest(post({ action, eventId }))
    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('UNAUTHORIZED')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  }
  expect(calls.native).not.toHaveBeenCalled()
})

test('public creation sends no user-selected ownership and review exposes visibility', async () => {
  const result = { templateId: crypto.randomUUID(), revision: 1 }
  calls.native.mockReturnValue(Effect.succeed(result))
  const response = await handleBlueprintNativeCreationRequest(
    post({
      action: 'create',
      eventId,
      selection,
      name: 'Wedding',
      expectedSourceHash: 'a'.repeat(64),
      expectedReviewHash: 'b'.repeat(64),
      requestId: crypto.randomUUID(),
      discoverable: true,
    })
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(result)
  const input = calls.native.mock.calls[0]![1]
  expect(input.discoverable).toBe(true)
  expect(input).not.toHaveProperty('organizationId')

  const content = captureEventBlueprint(source, selection, 'Wedding')
  const review = {
    content,
    sourceHash: blueprintHash(source),
    reviewHash: blueprintDraftContentHash(content),
    discoverable: true,
  }
  calls.native.mockReturnValue(Effect.succeed(review))
  const reviewed = await handleBlueprintNativeCreationRequest(
    post({
      action: 'review',
      eventId,
      selection,
      name: 'Wedding',
      expectedSourceHash: review.sourceHash,
      discoverable: true,
    })
  )
  expect(reviewed.status).toBe(200)
  expect(await reviewed.json()).toEqual(review)
})
