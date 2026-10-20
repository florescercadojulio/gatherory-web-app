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
} from '@/server/blueprints/planning/blueprint-hash'
import { captureEventBlueprint } from '@/server/blueprints/planning/capture-event-blueprint.server'
import { blueprintNativeCreationWorkflow } from '@/server/blueprints/workflows/blueprint-native-creation.workflow'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'
import { ForbiddenError } from '@/lib/domain-errors'

type CaptureShape = Context.Service.Shape<typeof BlueprintCaptureRepo>
type AuthoringShape = Context.Service.Shape<typeof BlueprintAuthoringRepo>
type NativeShape = Context.Service.Shape<typeof BlueprintNativeCreationRepo>
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

function fixture() {
  const capture: CaptureShape = {
    listEvents: () => Effect.succeed({ events: [] }),
    source: vi.fn(() => Effect.succeed({ source, sourceHash })),
    save: vi.fn(() => Effect.die('source and review must not save')),
  }
  const workspaces = [{ id: 'workspace-1', name: 'Owner workspace', personal: false }]
  const authoring: AuthoringShape = {
    context: vi.fn(() => Effect.succeed({ workspaces })),
    list: () => Effect.succeed({ data: [], hasNextPage: false }),
    get: () => Effect.die('unexpected get'),
    create: () => Effect.die('unexpected create'),
    save: () => Effect.die('unexpected save'),
    publish: () => Effect.die('unexpected publish'),
    retire: () => Effect.die('unexpected retire'),
    delete: () => Effect.die('unexpected delete'),
  }
  const native: NativeShape = {
    create: vi.fn((_actorId, _input) =>
      Effect.succeed({ templateId: '60000000-0000-4000-8000-000000000006', revision: 1 })
    ),
  }
  const layer = Layer.mergeAll(
    Layer.succeed(BlueprintCaptureRepo, capture),
    Layer.succeed(BlueprintAuthoringRepo, authoring),
    Layer.succeed(BlueprintNativeCreationRepo, native),
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
  return { capture, authoring, native, workspaces, layer }
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
      expect(fake.native.create).not.toHaveBeenCalled()
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect('create dispatches the reviewed payload to the atomic native creation port', () => {
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
    expect(fake.native.create).toHaveBeenCalledWith('actor', request)
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
      expect(fake.native.create).toHaveBeenCalledWith('actor', {
        ...request,
        organizationId: 'personal-owner',
      })
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
          expectedReviewHash: blueprintHash(captureEventBlueprint(source, selection, 'Wedding')),
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
      expect(fake.native.create).toHaveBeenCalledWith(
        'actor',
        expect.objectContaining({
          organizationId: personal.id,
          discoverable: true,
        })
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
    expect(fake.native.create).not.toHaveBeenCalled()
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
    Layer.succeed(BetterAuthWorkspaceCon, auth)
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
    Layer.succeed(BetterAuthWorkspaceCon, auth)
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
    expect(fake.native.create).not.toHaveBeenCalled()
    expect(capture.source).toHaveBeenCalledTimes(3)
  }).pipe(Effect.provide(layer))
})
