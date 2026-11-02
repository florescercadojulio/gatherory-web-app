import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'
import type { BlueprintEventCaptureSource } from '@/contracts/blueprint-capture.contracts'
import { BlueprintAuthoringRepo } from '@/server/blueprints/repos/blueprint-authoring.repo'
import { BlueprintCaptureRepo } from '@/server/blueprints/repos/blueprint-capture.repo'
import { BlueprintNativeCreationRepo } from '@/server/blueprints/repos/blueprint-native-creation.repo'
import {
  blueprintDraftContentHash,
  blueprintHash,
  legacyCompatibleCaptureSelection,
} from '@/server/blueprints/planning/blueprint-hash'
import { captureEventBlueprint } from '@/server/blueprints/planning/capture-event-blueprint.server'
import { blueprintNativeCreationWorkflow } from '@/server/blueprints/workflows/blueprint-native-creation.workflow'
import { BlueprintNativeCreationTransaction } from '@/server/blueprints/workflows/blueprint-native-creation-transaction'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'
import { ForbiddenError } from '@/lib/domain-errors'
import { BlueprintCoverService } from '@/server/blueprint-media/services/blueprint-cover.service'
import type { BlueprintCoverServiceShape } from '@/server/blueprint-media/services/blueprint-cover.service'

type CaptureShape = Context.Service.Shape<typeof BlueprintCaptureRepo>
type AuthoringShape = Context.Service.Shape<typeof BlueprintAuthoringRepo>
type NativeShape = Context.Service.Shape<typeof BlueprintNativeCreationRepo>
type TransactionShape = Context.Service.Shape<typeof BlueprintNativeCreationTransaction>
const eventId = '10000000-0000-4000-8000-000000000001'
const childId = '20000000-0000-4000-8000-000000000002'
const ideaId = '30000000-0000-4000-8000-000000000003'
const instructionId = '40000000-0000-4000-8000-000000000004'
const source: BlueprintEventCaptureSource = {
  todos: [],
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
}
const selection = {
  childIds: [childId],
  ideaIds: [ideaId],
  instructionIds: [instructionId],
  todoIds: [],
  includeIdeaNotes: false,
}
const sourceHash = blueprintHash(source)
const testCoverServiceLayer = Layer.succeed(BlueprintCoverService, {
  validateReferences: () => Effect.void,
  cloneAssets: () => Effect.succeed([]),
  materializeCuratedExploreCover: () => Effect.succeed(undefined),
  materializeCuratedSeedImages: () => Effect.succeed({}),
} as unknown as BlueprintCoverServiceShape)

function fixture() {
  const capture: CaptureShape = {
    listEvents: () => Effect.succeed({ events: [] }),
    source: vi.fn(() => Effect.succeed({ source, sourceHash })),
    save: vi.fn((_actorId, input) => {
      const content = captureEventBlueprint(source, input.selection, input.name)
      return Effect.succeed({
        id: '60000000-0000-4000-8000-000000000006',
        organizationId: input.organizationId,
        catalogKey: 'private_native_capture',
        draftVersion: 1,
        content,
        publishedRevision: null,
        publishedDraftVersion: null,
        retired: false,
        source: {
          kind: 'event' as const,
          eventId: input.eventId,
          selection: input.selection,
          capturedContent: content,
          requestId: input.requestId,
        },
      })
    }),
  }
  const workspaces = [{ id: 'workspace-1', name: 'Owner workspace', personal: false }]
  const authoring: AuthoringShape = {
    context: vi.fn(() => Effect.succeed({ workspaces })),
    list: () => Effect.succeed({ data: [], hasNextPage: false }),
    get: () => Effect.die('unexpected get'),
    create: () => Effect.die('unexpected create'),
    save: () => Effect.die('unexpected save'),
    publish: vi.fn((_actorId, input) =>
      Effect.succeed({
        id: input.id,
        organizationId: 'workspace-1',
        catalogKey: 'private_native_capture',
        draftVersion: 1,
        content: captureEventBlueprint(source, selection, 'Initial template'),
        publishedRevision: 1,
        publishedDraftVersion: 1,
        retired: false,
        source: null,
        publication: { revision: 1, draftVersion: 1, contentHash: 'a'.repeat(64) },
      })
    ),
    retire: () => Effect.die('unexpected retire'),
    delete: () => Effect.die('unexpected delete'),
  }
  const native: NativeShape = {
    recordRequestFingerprint: vi.fn(() => Effect.void),
    listInitialRevision: vi.fn(() => Effect.void),
  }
  const transaction: TransactionShape = {
    withTransaction: vi.fn((program) => program),
  }
  const layer = Layer.mergeAll(
    Layer.succeed(BlueprintCaptureRepo, capture),
    Layer.succeed(BlueprintAuthoringRepo, authoring),
    Layer.succeed(BlueprintNativeCreationRepo, native),
    Layer.succeed(BlueprintNativeCreationTransaction, transaction),
    testCoverServiceLayer,
    Layer.succeed(BetterAuthWorkspaceCon, {
      listOrganizations: () => Effect.succeed([]),
      createOrganization: () => Effect.die('unexpected organization create'),
      setActiveOrganization: () => Effect.void,
      listTeams: () => Effect.succeed([]),
      createTeam: () => Effect.die('unexpected team create'),
      addTeamMember: () => Effect.void,
      setActiveTeam: () => Effect.void,
    })
  )
  return { capture, authoring, native, transaction, workspaces, layer }
}

it.effect('source reads return the authorized event snapshot and current owned workspaces', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const result = yield* blueprintNativeCreationWorkflow(
      { id: 'actor', name: 'A Host' },
      { action: 'source', eventId }
    )
    expect(result).toEqual({ source, sourceHash, workspaces: fake.workspaces })
    expect(fake.capture.source).toHaveBeenCalledWith('actor', eventId)
    expect(fake.authoring.context).toHaveBeenCalledWith('actor')
  }).pipe(Effect.provide(fake.layer))
})

it.effect(
  'review canonicalizes uppercase UUIDs and hashes a name-overridden capture without writes',
  () => {
    const fake = fixture()
    const name = 'A 🌿 New name'
    return Effect.gen(function* () {
      const result = yield* blueprintNativeCreationWorkflow(
        { id: 'actor', name: 'A Host' },
        {
          action: 'review',
          eventId: eventId.toUpperCase(),
          selection: {
            childIds: [childId.toUpperCase()],
            ideaIds: [ideaId.toUpperCase()],
            instructionIds: [instructionId.toUpperCase()],
            includeIdeaNotes: false,
          },
          expectedSourceHash: sourceHash,
          name,
        }
      )
      const expectedContent = captureEventBlueprint(source, selection, name)
      const expectedReviewHash = blueprintDraftContentHash(expectedContent)
      expect(result).toEqual({
        content: expectedContent,
        sourceHash,
        reviewHash: expectedReviewHash,
      })
      const { todos: _todos, ...legacyContent } = expectedContent
      expect(expectedReviewHash).toBe(blueprintHash(legacyContent))
      expect(fake.capture.source).toHaveBeenCalledWith('actor', eventId)
      expect(fake.capture.save).not.toHaveBeenCalled()
      expect(fake.transaction.withTransaction).not.toHaveBeenCalled()
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect('create captures, fingerprints, publishes, and lists in one transaction', () => {
  const fake = fixture()
  const name = 'Initial template'
  const content = captureEventBlueprint(source, selection, name)
  const request = {
    action: 'create' as const,
    eventId,
    selection,
    expectedSourceHash: sourceHash,
    name,
    organizationId: 'workspace-1',
    requestId: '70000000-0000-4000-8000-000000000007',
    expectedReviewHash: blueprintDraftContentHash(content),
    discoverable: false,
  }
  return Effect.gen(function* () {
    const result = yield* blueprintNativeCreationWorkflow({ id: 'actor', name: 'A Host' }, request)
    expect(result).toEqual({
      templateId: '60000000-0000-4000-8000-000000000006',
      revision: 1,
    })
    expect(fake.transaction.withTransaction).toHaveBeenCalledOnce()
    expect(fake.capture.source).toHaveBeenCalledTimes(2)
    expect(fake.capture.save).toHaveBeenCalledWith('actor', {
      eventId,
      selection,
      expectedSourceHash: sourceHash,
      name,
      organizationId: 'workspace-1',
      requestId: request.requestId,
    })
    expect(fake.native.recordRequestFingerprint).toHaveBeenCalledWith(
      '60000000-0000-4000-8000-000000000006',
      blueprintHash({
        ...request,
        selection: legacyCompatibleCaptureSelection(selection),
      })
    )
    expect(fake.authoring.publish).toHaveBeenCalledWith(
      'actor',
      {
        id: '60000000-0000-4000-8000-000000000006',
        expectedVersion: 1,
      },
      expect.objectContaining({
        validateReferences: expect.any(Function),
        cloneAssets: expect.any(Function),
        materializeCuratedExploreCover: expect.any(Function),
        materializeCuratedSeedImages: expect.any(Function),
      })
    )
    expect(fake.native.listInitialRevision).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('keeps fingerprint and publication writes behind the reviewed content check', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      blueprintNativeCreationWorkflow(
        { id: 'actor', name: 'A Host' },
        {
          action: 'create',
          eventId,
          selection,
          expectedSourceHash: sourceHash,
          name: 'Changed after review',
          organizationId: 'workspace-1',
          requestId: crypto.randomUUID(),
          expectedReviewHash: 'f'.repeat(64),
          discoverable: true,
        }
      )
    )
    expect(failure).toMatchObject({ code: 'BLUEPRINT_NATIVE_REVIEW_CHANGED' })
    expect(fake.transaction.withTransaction).toHaveBeenCalledOnce()
    expect(fake.capture.source).toHaveBeenCalledTimes(2)
    expect(fake.native.recordRequestFingerprint).not.toHaveBeenCalled()
    expect(fake.authoring.publish).not.toHaveBeenCalled()
    expect(fake.native.listInitialRevision).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('exact retries return the original publication without re-listing', () => {
  const fake = fixture()
  const name = 'Published wedding'
  const content = captureEventBlueprint(source, selection, name)
  const request = {
    action: 'create' as const,
    eventId,
    selection,
    expectedSourceHash: sourceHash,
    name,
    organizationId: 'workspace-1',
    requestId: crypto.randomUUID(),
    expectedReviewHash: blueprintDraftContentHash(content),
    discoverable: true,
  }
  const requestHash = blueprintHash({
    ...request,
    selection: legacyCompatibleCaptureSelection(selection),
  })
  const draft = {
    id: '60000000-0000-4000-8000-000000000006',
    organizationId: 'workspace-1',
    catalogKey: 'private_native_capture',
    draftVersion: 1,
    content,
    publishedRevision: 1,
    publishedDraftVersion: 1,
    retired: false,
    source: {
      kind: 'event' as const,
      eventId,
      selection,
      capturedContent: content,
      requestId: request.requestId,
      nativeCreationRequestHash: requestHash,
    },
  }
  fake.capture.save = vi.fn(() => Effect.succeed(draft))
  fake.authoring.publish = vi.fn(() =>
    Effect.succeed({
      ...draft,
      publication: { revision: 1, draftVersion: 1, contentHash: 'a'.repeat(64) },
    })
  )

  return Effect.gen(function* () {
    const result = yield* blueprintNativeCreationWorkflow({ id: 'actor', name: 'A Host' }, request)
    expect(result).toEqual({
      templateId: '60000000-0000-4000-8000-000000000006',
      revision: 1,
    })
    expect(fake.capture.save).toHaveBeenCalledOnce()
    expect(fake.authoring.publish).toHaveBeenCalledWith(
      'actor',
      {
        id: draft.id,
        expectedVersion: 1,
      },
      expect.objectContaining({
        validateReferences: expect.any(Function),
        cloneAssets: expect.any(Function),
        materializeCuratedExploreCover: expect.any(Function),
        materializeCuratedSeedImages: expect.any(Function),
      })
    )
    expect(fake.native.recordRequestFingerprint).not.toHaveBeenCalled()
    expect(fake.native.listInitialRevision).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect(
  'automatic ownership chooses the personal owner without selecting a business workspace',
  () => {
    const fake = fixture()
    const workspaces = [
      { id: 'business-owner', name: 'Business', personal: false },
      { id: 'personal-owner', name: 'Personal', personal: true },
    ]
    const request = {
      action: 'create' as const,
      eventId,
      selection,
      expectedSourceHash: sourceHash,
      name: 'Searchable wedding',
      requestId: crypto.randomUUID(),
      expectedReviewHash: blueprintDraftContentHash(
        captureEventBlueprint(source, selection, 'Searchable wedding')
      ),
      discoverable: true,
    }
    return Effect.gen(function* () {
      yield* blueprintNativeCreationWorkflow({ id: 'actor', name: 'A Host' }, request).pipe(
        Effect.provideService(BlueprintAuthoringRepo, {
          ...fake.authoring,
          context: () => Effect.succeed({ workspaces }),
        })
      )
      expect(fake.capture.save).toHaveBeenCalledWith('actor', {
        eventId,
        selection,
        expectedSourceHash: sourceHash,
        name: 'Searchable wedding',
        organizationId: 'personal-owner',
        requestId: request.requestId,
      })
      expect(fake.native.listInitialRevision).toHaveBeenCalledWith(
        '60000000-0000-4000-8000-000000000006',
        1
      )
      expect(fake.capture.source).toHaveBeenCalledWith('actor', eventId)
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect(
  'personal template ownership is provisioned only after source authorization on create',
  () => {
    const fake = fixture()
    let provisioned = false
    const personal = { id: 'personal-owner', name: "A Host's Templates", personal: true }
    const createOrganization = vi.fn(() => {
      expect(fake.capture.source).toHaveBeenCalledWith('actor', eventId)
      provisioned = true
      return Effect.succeed({
        id: personal.id,
        name: personal.name,
        slug: 'personal-actor',
        workspaceType: 'personal',
      })
    })
    return Effect.gen(function* () {
      const auth = yield* BetterAuthWorkspaceCon
      yield* blueprintNativeCreationWorkflow(
        { id: 'actor', name: 'A Host' },
        {
          action: 'create',
          eventId,
          selection,
          expectedSourceHash: sourceHash,
          name: 'Wedding',
          requestId: crypto.randomUUID(),
          expectedReviewHash: blueprintDraftContentHash(
            captureEventBlueprint(source, selection, 'Wedding')
          ),
          discoverable: true,
        }
      ).pipe(
        Effect.provideService(BlueprintAuthoringRepo, {
          ...fake.authoring,
          context: () =>
            Effect.succeed({
              workspaces: provisioned ? [...fake.workspaces, personal] : fake.workspaces,
            }),
        }),
        Effect.provideService(BetterAuthWorkspaceCon, { ...auth, createOrganization })
      )
      expect(createOrganization).toHaveBeenCalledExactlyOnceWith({
        userId: 'actor',
        name: "A Host's Templates",
        slug: 'personal-actor',
      })
      expect(fake.capture.save).toHaveBeenCalledWith(
        'actor',
        expect.objectContaining({ organizationId: personal.id })
      )
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect('public review returns its visibility without provisioning or publishing', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const result = yield* blueprintNativeCreationWorkflow(
      { id: 'actor', name: 'A Host' },
      {
        action: 'review',
        eventId,
        selection,
        expectedSourceHash: sourceHash,
        name: 'Wedding',
        discoverable: true,
      }
    )
    expect(result).toMatchObject({ discoverable: true })
    expect(fake.authoring.context).not.toHaveBeenCalled()
    expect(fake.transaction.withTransaction).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('explicit workspace creation checks source access before provisioning', () => {
  const fake = fixture()
  const personal = { id: 'personal-workspace', name: "A Host's Workspace", personal: true }
  let hasWorkspace = false
  const authoring: AuthoringShape = {
    ...fake.authoring,
    context: vi.fn(() => Effect.succeed({ workspaces: hasWorkspace ? [personal] : [] })),
  }
  const auth = {
    listOrganizations: () => Effect.succeed([]),
    createOrganization: vi.fn(() => {
      hasWorkspace = true
      return Effect.succeed({
        id: personal.id,
        name: personal.name,
        slug: 'personal-actor',
        workspaceType: 'personal',
      })
    }),
    setActiveOrganization: () => Effect.void,
    listTeams: () => Effect.succeed([]),
    createTeam: () => Effect.die('unexpected team create'),
    addTeamMember: () => Effect.void,
    setActiveTeam: () => Effect.void,
  }
  const layer = Layer.mergeAll(
    Layer.succeed(BlueprintCaptureRepo, fake.capture),
    Layer.succeed(BlueprintAuthoringRepo, authoring),
    Layer.succeed(BlueprintNativeCreationRepo, fake.native),
    Layer.succeed(BlueprintNativeCreationTransaction, fake.transaction),
    Layer.succeed(BetterAuthWorkspaceCon, auth),
    testCoverServiceLayer
  )
  return Effect.gen(function* () {
    const result = yield* blueprintNativeCreationWorkflow(
      { id: 'actor', name: 'A Host' },
      { action: 'workspace', eventId }
    )
    expect(result).toEqual({ workspaces: [personal] })
    expect(fake.capture.source).toHaveBeenCalledWith('actor', eventId)
    expect(auth.createOrganization).toHaveBeenCalledWith({
      userId: 'actor',
      name: "A Host's Workspace",
      slug: 'personal-actor',
    })
  }).pipe(Effect.provide(layer))
})

it.effect('denied source reads do not load authoring context or provision a workspace', () => {
  const fake = fixture()
  const forbidden = new ForbiddenError({
    category: 'authorization',
    code: 'BLUEPRINT_CAPTURE_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
  const capture: CaptureShape = {
    ...fake.capture,
    source: vi.fn(() => Effect.fail(forbidden)),
  }
  const createOrganization = vi.fn(() => Effect.die('must not provision without source access'))
  const auth = {
    listOrganizations: () => Effect.succeed([]),
    createOrganization,
    setActiveOrganization: () => Effect.void,
    listTeams: () => Effect.succeed([]),
    createTeam: () => Effect.die('unexpected team create'),
    addTeamMember: () => Effect.void,
    setActiveTeam: () => Effect.void,
  }
  const layer = Layer.mergeAll(
    Layer.succeed(BlueprintCaptureRepo, capture),
    Layer.succeed(BlueprintAuthoringRepo, fake.authoring),
    Layer.succeed(BlueprintNativeCreationRepo, fake.native),
    Layer.succeed(BlueprintNativeCreationTransaction, fake.transaction),
    Layer.succeed(BetterAuthWorkspaceCon, auth),
    testCoverServiceLayer
  )
  return Effect.gen(function* () {
    const sourceFailure = yield* Effect.flip(
      blueprintNativeCreationWorkflow(
        { id: 'actor', name: 'A Host' },
        { action: 'source', eventId }
      )
    )
    expect(sourceFailure).toBe(forbidden)
    expect(fake.authoring.context).not.toHaveBeenCalled()

    const workspaceFailure = yield* Effect.flip(
      blueprintNativeCreationWorkflow(
        { id: 'actor', name: 'A Host' },
        { action: 'workspace', eventId }
      )
    )
    expect(workspaceFailure).toBe(forbidden)
    const createFailure = yield* Effect.flip(
      blueprintNativeCreationWorkflow(
        { id: 'actor', name: 'A Host' },
        {
          action: 'create',
          eventId,
          selection,
          expectedSourceHash: sourceHash,
          name: 'Wedding',
          requestId: crypto.randomUUID(),
          expectedReviewHash: 'b'.repeat(64),
          discoverable: true,
        }
      )
    )
    expect(createFailure).toBe(forbidden)
    expect(createOrganization).not.toHaveBeenCalled()
    expect(fake.authoring.context).not.toHaveBeenCalled()
    expect(fake.transaction.withTransaction).not.toHaveBeenCalled()
    expect(capture.source).toHaveBeenCalledTimes(3)
  }).pipe(Effect.provide(layer))
})
