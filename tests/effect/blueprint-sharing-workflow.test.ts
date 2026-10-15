import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'

import { EntityNotFoundError } from '@/lib/domain-errors'
import { cottageBlueprintDefinition } from '@/db/seeds/cottage-template'
import type { CatalogRevision } from '@/server/blueprints/contracts/blueprint-runtime.contracts'
import { BlueprintSharingRepo } from '@/server/blueprints/repos/blueprint-sharing.repo'
import {
  createBlueprintShareLinkWorkflow,
  listBlueprintShareLinksWorkflow,
  resolveBlueprintShareLinkWorkflow,
  revokeBlueprintShareLinkWorkflow,
} from '@/server/blueprints/workflows/blueprint-sharing.workflow'

type SharingRepoShape = Context.Service.Shape<typeof BlueprintSharingRepo>

const token = 'a'.repeat(64)
const revision: CatalogRevision = {
  id: 'persisted-share-revision',
  catalogKey: 'private_cottage',
  revision: 3,
  contentHash: 'b'.repeat(64),
  definition: {
    ...structuredClone(cottageBlueprintDefinition),
    blueprint: {
      ...cottageBlueprintDefinition.blueprint,
      id: 'private_cottage',
      revision: 3,
    },
  },
  description: 'A private cottage plan.',
}

function fixture(overrides: Partial<SharingRepoShape> = {}) {
  const repo: SharingRepoShape = {
    list: vi.fn(() => Effect.succeed([])),
    create: vi.fn(() =>
      Effect.succeed({
        id: 'share-link-id',
        revision: 3,
        createdAt: '2026-10-15T12:00:00.000Z',
        revokedAt: null,
        token,
      })
    ),
    revoke: vi.fn(() => Effect.void),
    resolve: vi.fn(() => Effect.succeed(revision)),
    ...overrides,
  }
  return { repo, layer: Layer.succeed(BlueprintSharingRepo, repo) }
}

it.effect('resolves a valid token to the public catalog projection', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const result = yield* resolveBlueprintShareLinkWorkflow({ token })
    expect(result).toMatchObject({ catalogKey: 'private_cottage', revision: 3 })
    expect(Object.keys(result!).sort()).toEqual(
      ['catalogKey', 'revision', 'contentHash', 'definition', 'discovery'].sort()
    )
    expect(fake.repo.resolve).toHaveBeenCalledWith(token)
    expect(fake.repo.list).not.toHaveBeenCalled()
    expect(fake.repo.create).not.toHaveBeenCalled()
    expect(fake.repo.revoke).not.toHaveBeenCalled()
  }).pipe(Effect.provide(fake.layer))
})

for (const [label, input] of [
  ['missing token', {}],
  ['short token', { token: 'a'.repeat(63) }],
  ['uppercase token', { token: 'A'.repeat(64) }],
  ['additional credentials', { token, actorId: 'must-not-be-accepted' }],
] as const) {
  it.effect(`returns the same unavailable response for ${label}`, () => {
    const fake = fixture()
    return Effect.gen(function* () {
      const failure = yield* Effect.flip(resolveBlueprintShareLinkWorkflow(input))
      expect(failure).toBeInstanceOf(EntityNotFoundError)
      expect(failure).toMatchObject({ code: 'BLUEPRINT_LINK_UNAVAILABLE' })
      expect(fake.repo.resolve).not.toHaveBeenCalled()
    }).pipe(Effect.provide(fake.layer))
  })
}

it.effect('keeps owner operations scoped to the actor and validated template or link ID', () => {
  const fake = fixture()
  return Effect.gen(function* () {
    const listed = yield* listBlueprintShareLinksWorkflow('owner-user', {
      templateId: '00000000-0000-4000-8000-000000000001',
    })
    const created = yield* createBlueprintShareLinkWorkflow('owner-user', {
      templateId: '00000000-0000-4000-8000-000000000001',
      revision: 3,
    })
    yield* revokeBlueprintShareLinkWorkflow('owner-user', {
      templateId: '00000000-0000-4000-8000-000000000001',
      linkId: '00000000-0000-4000-8000-000000000002',
    })
    expect(listed).toEqual([])
    expect(created.token).toMatch(/^[a-f0-9]{64}$/)
    expect(fake.repo.list).toHaveBeenCalledWith(
      'owner-user',
      '00000000-0000-4000-8000-000000000001'
    )
    expect(fake.repo.create).toHaveBeenCalledWith('owner-user', {
      templateId: '00000000-0000-4000-8000-000000000001',
      revision: 3,
    })
    expect(fake.repo.revoke).toHaveBeenCalledWith('owner-user', {
      templateId: '00000000-0000-4000-8000-000000000001',
      linkId: '00000000-0000-4000-8000-000000000002',
    })
  }).pipe(Effect.provide(fake.layer))
})
