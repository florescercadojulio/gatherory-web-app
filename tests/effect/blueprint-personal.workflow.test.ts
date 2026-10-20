import { Effect, Exit, Layer } from 'effect'
import { expect, it } from '@effect/vitest'
import { vi } from 'vitest'
import { BlueprintPersonalRepo } from '@/server/blueprints/repos/blueprint-personal.repo'
import { managePersonalBlueprintsWorkflow } from '@/server/blueprints/workflows/blueprint-personal.workflow'

const row = {
  id: '10000000-0000-4000-8000-000000000001',
  draftVersion: 3,
  publishedRevision: 2,
  listedRevision: 2,
  creatorName: 'Rae Host',
  activeShareLinkCount: 0,
  catalogEntry: {
    catalogKey: 'private_abc',
    revision: 2,
    contentHash: 'a'.repeat(64),
    definition: {},
    description: '',
    creator: { displayName: 'Rae Host' },
  },
}

it.effect('dispatches list and save only after validating personal lifecycle commands', () => {
  const repo = {
    copy: vi.fn(() => Effect.succeed(row)),
    list: vi.fn(() => Effect.succeed({ templates: [row] })),
    save: vi.fn(() => Effect.succeed(row)),
    publish: vi.fn(() => Effect.succeed(row)),
    unlist: vi.fn(() => Effect.succeed(row)),
    delete: vi.fn(() => Effect.succeed({ deleted: true as const })),
  }
  const layer = Layer.succeed(BlueprintPersonalRepo, repo)
  return Effect.gen(function* () {
    const listed = yield* managePersonalBlueprintsWorkflow('actor', { action: 'list' }).pipe(
      Effect.provide(layer)
    )
    expect(listed).toEqual({ templates: [row] })
    const invalid = yield* Effect.exit(
      managePersonalBlueprintsWorkflow('actor', {
        action: 'save',
        id: row.id,
        expectedVersion: 2,
        content: {},
      }).pipe(Effect.provide(layer))
    )
    expect(Exit.isFailure(invalid)).toBe(true)
    expect(repo.list).toHaveBeenCalledWith('actor')
    expect(repo.save).not.toHaveBeenCalled()
  })
})

it.effect('routes delete through the owner scoped repository operation', () => {
  const repo = {
    copy: vi.fn(() => Effect.succeed(row)),
    list: vi.fn(() => Effect.succeed({ templates: [] })),
    save: vi.fn(() => Effect.succeed(row)),
    publish: vi.fn(() => Effect.succeed(row)),
    unlist: vi.fn(() => Effect.succeed(row)),
    delete: vi.fn(() => Effect.succeed({ deleted: true as const })),
  }
  return Effect.gen(function* () {
    const result = yield* managePersonalBlueprintsWorkflow('actor', {
      action: 'delete',
      id: row.id,
    }).pipe(Effect.provide(Layer.succeed(BlueprintPersonalRepo, repo)))
    expect(result).toEqual({ deleted: true })
    expect(repo.delete).toHaveBeenCalledWith('actor', row.id)
  })
})

it.effect('routes publish through the owner scoped repository operation', () => {
  const repo = {
    copy: vi.fn(() => Effect.succeed(row)),
    list: vi.fn(() => Effect.succeed({ templates: [] })),
    save: vi.fn(() => Effect.succeed(row)),
    publish: vi.fn(() => Effect.succeed(row)),
    unlist: vi.fn(() => Effect.succeed(row)),
    delete: vi.fn(() => Effect.succeed({ deleted: true as const })),
  }
  return Effect.gen(function* () {
    const result = yield* managePersonalBlueprintsWorkflow('actor', {
      action: 'publish',
      id: row.id,
      expectedVersion: 3,
    }).pipe(Effect.provide(Layer.succeed(BlueprintPersonalRepo, repo)))
    expect(result).toEqual(row)
    expect(repo.publish).toHaveBeenCalledWith('actor', {
      action: 'publish',
      id: row.id,
      expectedVersion: 3,
    })
  })
})

it.effect('trims the selected public creator name and enforces 1–80 Unicode characters', () => {
  const repo = {
    copy: vi.fn(() => Effect.succeed(row)),
    list: vi.fn(() => Effect.succeed({ templates: [row] })),
    save: vi.fn(() => Effect.succeed(row)),
    publish: vi.fn(() => Effect.succeed(row)),
    unlist: vi.fn(() => Effect.succeed(row)),
    delete: vi.fn(() => Effect.succeed({ deleted: true as const })),
  }
  const layer = Layer.succeed(BlueprintPersonalRepo, repo)
  return Effect.gen(function* () {
    const published = yield* managePersonalBlueprintsWorkflow('actor', {
      action: 'publish',
      id: row.id,
      expectedVersion: 3,
      creatorName: '  Rae 🌿  ',
    }).pipe(Effect.provide(layer))
    expect(published).toEqual(row)
    expect(repo.publish).toHaveBeenCalledWith('actor', {
      action: 'publish',
      id: row.id,
      expectedVersion: 3,
      creatorName: 'Rae 🌿',
    })

    for (const creatorName of ['', '   ', '🌿'.repeat(81)]) {
      const invalid = yield* Effect.exit(
        managePersonalBlueprintsWorkflow('actor', {
          action: 'publish',
          id: row.id,
          expectedVersion: 3,
          creatorName,
        }).pipe(Effect.provide(layer))
      )
      expect(Exit.isFailure(invalid)).toBe(true)
    }
    expect(repo.publish).toHaveBeenCalledTimes(1)
  })
})

it.effect('routes unlisting through the owner scoped compare-and-set operation', () => {
  const unlisted = { ...row, listedRevision: null }
  const repo = {
    copy: vi.fn(() => Effect.succeed(row)),
    list: vi.fn(() => Effect.succeed({ templates: [row] })),
    save: vi.fn(() => Effect.succeed(row)),
    publish: vi.fn(() => Effect.succeed(row)),
    unlist: vi.fn(() => Effect.succeed(unlisted)),
    delete: vi.fn(() => Effect.succeed({ deleted: true as const })),
  }
  return Effect.gen(function* () {
    const input = {
      action: 'unlist' as const,
      id: row.id,
      expectedVersion: 3,
      expectedListedRevision: 2,
    }
    const result = yield* managePersonalBlueprintsWorkflow('actor', input).pipe(
      Effect.provide(Layer.succeed(BlueprintPersonalRepo, repo))
    )
    expect(result).toEqual(unlisted)
    expect(repo.unlist).toHaveBeenCalledWith('actor', input)

    for (const malformed of [
      { ...input, expectedVersion: 0 },
      { ...input, expectedListedRevision: 0 },
      { ...input, expectedListedRevision: null },
    ]) {
      const invalid = yield* Effect.exit(
        managePersonalBlueprintsWorkflow('actor', malformed).pipe(
          Effect.provide(Layer.succeed(BlueprintPersonalRepo, repo))
        )
      )
      expect(Exit.isFailure(invalid)).toBe(true)
    }
    expect(repo.unlist).toHaveBeenCalledTimes(1)
  })
})
