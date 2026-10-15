import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'
import { cottageDraftContent } from '@/db/seeds/cottage-template'
import { draftDefinition } from '@/contracts/blueprint-authoring.contracts'
import { BlueprintAuthoringRepo } from '@/server/blueprints/repos/blueprint-authoring.repo'
import {
  BlueprintRepo,
  type CatalogRevision,
} from '@/server/blueprints/contracts/blueprint-runtime.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import {
  createBlueprintDraftWorkflow,
  getBlueprintStarterWorkflow,
  previewBlueprintDraftWorkflow,
  saveBlueprintDraftWorkflow,
} from '@/server/blueprints/workflows/blueprint-authoring.workflow'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { ConflictError, ForbiddenError } from '@/lib/domain-errors'

type AuthoringShape = Context.Service.Shape<typeof BlueprintAuthoringRepo>
type BlueprintShape = Context.Service.Shape<typeof BlueprintRepo>

const revision: CatalogRevision = {
  id: 'curated-revision-id',
  catalogKey: weddingBlueprintV1.catalogKey,
  revision: weddingBlueprintV1.revision,
  contentHash: weddingBlueprintV1.contentHash,
  definition: weddingBlueprintV1.definition,
  description: 'Curated starter',
}

function fixture(overrides: Partial<AuthoringShape> = {}) {
  const draft = {
    id: '00000000-0000-4000-8000-000000000010',
    organizationId: 'workspace-owner-selected',
    catalogKey: 'private_fixture',
    draftVersion: 1,
    content: structuredClone(cottageDraftContent),
    publishedRevision: null,
    publishedDraftVersion: null,
    retired: false,
    source: null,
  }
  const authoring: AuthoringShape = {
    context: vi.fn(() =>
      Effect.succeed({
        workspaces: [{ id: draft.organizationId, name: 'Owner workspace', personal: false }],
      })
    ),
    list: () => Effect.succeed({ data: [], hasNextPage: false }),
    get: vi.fn(() => Effect.succeed(draft)),
    create: vi.fn((_actorId, input) =>
      Effect.succeed({ ...draft, content: input.content, source: input.source ?? null })
    ),
    save: vi.fn((_actorId, input) =>
      Effect.succeed({ ...draft, draftVersion: input.expectedVersion + 1, content: input.content })
    ),
    publish: vi.fn(() =>
      Effect.succeed({
        ...draft,
        publishedRevision: 1,
        publishedDraftVersion: draft.draftVersion,
        publication: {
          revision: 1,
          draftVersion: draft.draftVersion,
          contentHash: 'fixture-content-hash',
        },
      })
    ),
    retire: () => Effect.succeed(draft),
    delete: () => Effect.succeed({ deleted: true }),
    ...overrides,
  }
  const blueprint: BlueprintShape = {
    catalog: () => Effect.succeed([revision]),
    revision: vi.fn((catalogKey, version, actorId) =>
      catalogKey === revision.catalogKey && version === revision.revision && actorId === 'owner'
        ? Effect.succeed(revision)
        : Effect.fail(
            new ForbiddenError({ category: 'authorization', code: 'BLUEPRINT_NOT_VISIBLE' })
          )
    ),
    status: () => Effect.succeed(null),
    claim: () => Effect.die('unexpected claim'),
    acquire: () => Effect.die('unexpected acquire'),
    recoverWorkspace: () => Effect.die('unexpected recovery'),
    provisioned: () => Effect.die('unexpected provision'),
    complete: () => Effect.die('unexpected completion'),
    release: () => Effect.die('unexpected release'),
  }
  return {
    draft,
    authoring,
    blueprint,
    layer: Layer.mergeAll(
      Layer.succeed(BlueprintAuthoringRepo, authoring),
      Layer.succeed(BlueprintRepo, blueprint)
    ),
  }
}

it.effect('copies an accessible published revision into portable private draft content', () => {
  const fake = fixture()
  const requestId = '00000000-0000-4000-8000-000000000001'
  const source = { catalogKey: revision.catalogKey, revision: revision.revision }
  const content = structuredClone(cottageDraftContent)
  return Effect.gen(function* () {
    const copied = yield* createBlueprintDraftWorkflow('owner', {
      requestId,
      organizationId: fake.draft.organizationId,
      content,
      source,
    })
    expect(fake.blueprint.revision).toHaveBeenCalledWith(
      source.catalogKey,
      source.revision,
      'owner'
    )
    expect(fake.authoring.create).toHaveBeenCalledWith('owner', {
      requestId,
      organizationId: fake.draft.organizationId,
      content,
      source,
    })
    expect(copied).toMatchObject({ organizationId: fake.draft.organizationId, source, content })
  }).pipe(Effect.provide(fake.layer))
})

it.effect('does not create a draft from a curated source the actor cannot access', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      createBlueprintDraftWorkflow('guest', {
        requestId: '00000000-0000-4000-8000-000000000001',
        organizationId: fake.draft.organizationId,
        content: cottageDraftContent,
        source: { catalogKey: revision.catalogKey, revision: revision.revision },
      })
    )
    expect(failure).toBeInstanceOf(ForbiddenError)
    expect(fake.authoring.create).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('loads a starter from the exact immutable revision', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const starter = yield* getBlueprintStarterWorkflow('owner', {
      catalogKey: revision.catalogKey,
      revision: revision.revision,
    })
    expect(fake.blueprint.revision).toHaveBeenCalledWith(
      revision.catalogKey,
      revision.revision,
      'owner'
    )
    expect(starter.name).toBe(revision.definition.blueprint.name)
    expect(starter.children.length).toBeGreaterThan(0)
  }).pipe(Effect.provide(fake.layer))
})

it.effect('previews with the installer planner and makes no persistence writes', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const preview = yield* previewBlueprintDraftWorkflow('owner', {
      id: fake.draft.id,
      expectedVersion: 1,
    })
    expect(preview.previewOnly).toBe(true)
    expect(preview.contentHash).toBe(
      blueprintHash(draftDefinition(fake.draft.content, fake.draft.catalogKey, 1))
    )
    expect(fake.authoring.get).toHaveBeenCalledWith('owner', fake.draft.id)
    expect(fake.authoring.create).not.toHaveBeenCalled()
    expect(fake.authoring.save).not.toHaveBeenCalled()
    expect(fake.authoring.publish).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

it.effect('rejects a stale preview or save version before mutation', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const previewFailure = yield* Effect.flip(
      previewBlueprintDraftWorkflow('owner', { id: fake.draft.id, expectedVersion: 2 })
    )
    expect(previewFailure).toBeInstanceOf(ConflictError)
    const saveFailure = yield* Effect.flip(
      saveBlueprintDraftWorkflow('owner', {
        id: fake.draft.id,
        expectedVersion: 0,
        content: cottageDraftContent,
      })
    )
    expect(saveFailure).toMatchObject({ code: 'INVALID_INPUT' })
    expect(fake.authoring.save).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})
