import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'

import { cottageDraftContent } from '@/db/seeds/cottage-template'
import type {
  BlueprintCaptureSelection,
  BlueprintEventCaptureSource,
} from '@/contracts/blueprint-capture.contracts'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { BlueprintAuthoringRepo } from '@/server/blueprints/repos/blueprint-authoring.repo'
import { BlueprintCaptureRepo } from '@/server/blueprints/repos/blueprint-capture.repo'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import {
  getBlueprintCaptureSourceWorkflow,
  previewBlueprintCaptureWorkflow,
} from '@/server/blueprints/workflows/blueprint-capture.workflow'

type CaptureShape = Context.Service.Shape<typeof BlueprintCaptureRepo>
type AuthoringShape = Context.Service.Shape<typeof BlueprintAuthoringRepo>

const ids = {
  event: '10000000-0000-4000-8000-000000000001',
  child: '20000000-0000-4000-8000-000000000002',
  idea: '30000000-0000-4000-8000-000000000003',
  instruction: '40000000-0000-4000-8000-000000000004',
  foreign: '50000000-0000-4000-8000-000000000005',
  template: '60000000-0000-4000-8000-000000000006',
}

const source: BlueprintEventCaptureSource = {
  event: {
    id: ids.event,
    title: 'Capture workflow fixture',
    startsAt: '2027-06-15T19:00:00Z',
    timeZone: 'America/Detroit',
    experienceType: 'custom',
  },
  children: [
    {
      id: ids.child,
      title: 'Ceremony',
      purpose: 'part_of_event',
      category: 'ceremony',
      startsAt: '2027-06-16T14:00:00Z',
    },
  ],
  ideas: [
    {
      id: ids.idea,
      eventId: ids.child,
      title: 'Garden flowers',
      category: 'flowers',
      notes: 'Seasonal stems',
    },
  ],
  instructions: [
    {
      id: ids.instruction,
      eventId: ids.child,
      title: 'Arrival',
      body: 'Arrive early.',
      audience: 'event_participants',
    },
  ],
}

const selection: BlueprintCaptureSelection = {
  childIds: [ids.child],
  ideaIds: [ids.idea],
  instructionIds: [ids.instruction],
  includeIdeaNotes: false,
}

function fixture(
  overrides: {
    capture?: Partial<CaptureShape>
    authoring?: Partial<AuthoringShape>
    source?: BlueprintEventCaptureSource
  } = {}
) {
  const currentSource = overrides.source ?? source
  const sourceHash = blueprintHash(currentSource)
  const draft = {
    id: ids.template,
    organizationId: 'destination-workspace',
    catalogKey: 'private_fixture',
    draftVersion: 3,
    content: structuredClone(cottageDraftContent),
    publishedRevision: null,
    publishedDraftVersion: null,
    retired: false,
    source: {
      kind: 'event' as const,
      eventId: ids.event,
      selection,
      capturedContent: structuredClone(cottageDraftContent),
      requestId: '70000000-0000-4000-8000-000000000007',
      requestHash: 'a'.repeat(64),
    },
  }
  const capture: CaptureShape = {
    listEvents: vi.fn(() =>
      Effect.succeed({ events: [{ id: ids.event, title: currentSource.event.title }] })
    ),
    source: vi.fn(() => Effect.succeed({ source: currentSource, sourceHash })),
    save: vi.fn(() => Effect.die('preview must not save')),
    ...overrides.capture,
  }
  const authoring: AuthoringShape = {
    context: () => Effect.succeed({ workspaces: [] }),
    list: () => Effect.succeed({ data: [], hasNextPage: false }),
    get: vi.fn(() => Effect.succeed(draft)),
    create: () => Effect.die('preview must not create'),
    save: () => Effect.die('preview must not save authoring content'),
    publish: () => Effect.die('unexpected publish'),
    retire: () => Effect.die('unexpected retire'),
    delete: () => Effect.die('unexpected delete'),
    ...overrides.authoring,
  }
  return {
    draft,
    capture,
    authoring,
    layer: Layer.mergeAll(
      Layer.succeed(BlueprintCaptureRepo, capture),
      Layer.succeed(BlueprintAuthoringRepo, authoring)
    ),
    sourceHash,
  }
}

it.effect('validates input before reading the source or draft', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      getBlueprintCaptureSourceWorkflow('actor', { eventId: 'not-a-uuid' })
    )
    expect(failure).toBeInstanceOf(InvalidInputError)
    expect(failure).toMatchObject({ code: 'INVALID_INPUT', category: 'validation' })
    expect(fake.capture.source).not.toHaveBeenCalled()
    expect(fake.authoring.get).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('reads only the requested source through the actor scoped repository port', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const result = yield* getBlueprintCaptureSourceWorkflow('child-manager', { eventId: ids.event })
    expect(result).toEqual({ source, sourceHash: fake.sourceHash })
    expect(fake.capture.source).toHaveBeenCalledTimes(1)
    expect(fake.capture.source).toHaveBeenCalledWith('child-manager', ids.event)
    expect(fake.authoring.get).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('rejects a stale source hash before building a preview or reading a template', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      previewBlueprintCaptureWorkflow('actor', {
        eventId: ids.event,
        selection,
        expectedSourceHash: '0'.repeat(64),
        templateId: ids.template,
      })
    )
    expect(failure).toBeInstanceOf(ConflictError)
    expect(failure).toMatchObject({ code: 'BLUEPRINT_CAPTURE_SOURCE_CHANGED' })
    expect(fake.capture.source).toHaveBeenCalledWith('actor', ids.event)
    expect(fake.authoring.get).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('validates selections before source reads', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      previewBlueprintCaptureWorkflow('actor', {
        eventId: ids.event,
        selection: { ...selection, ideaIds: [ids.idea, ids.idea] },
        expectedSourceHash: fake.sourceHash,
      })
    )
    expect(failure).toBeInstanceOf(InvalidInputError)
    expect(failure).toMatchObject({ code: 'INVALID_INPUT', category: 'validation' })
    expect(fake.capture.source).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('guards a template whose recorded event differs from the requested source', () => {
  const wrongSourceDraft = fixture().draft
  const fake = fixture({
    authoring: {
      get: vi.fn(() =>
        Effect.succeed({
          ...wrongSourceDraft,
          source: {
            ...wrongSourceDraft.source!,
            eventId: ids.foreign,
          },
        })
      ),
    },
  })
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      previewBlueprintCaptureWorkflow('actor', {
        eventId: ids.event,
        selection,
        expectedSourceHash: fake.sourceHash,
        templateId: ids.template,
      })
    )
    expect(failure).toBeInstanceOf(InvalidInputError)
    expect(failure).toMatchObject({ code: 'BLUEPRINT_CAPTURE_SOURCE_MISMATCH' })
    expect(fake.capture.source).toHaveBeenCalledWith('actor', ids.event)
    expect(fake.authoring.get).toHaveBeenCalledWith('actor', ids.template)
  }).pipe(Effect.provide(fake.layer))
})
