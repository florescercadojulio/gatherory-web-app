import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'
import type { BlueprintLibraryInstallation } from '@/contracts/blueprint-library.contracts'
import { BlueprintLibraryRepo } from '@/server/blueprints/repos/blueprint-library.repo'
import { listUsedBlueprintsWorkflow } from '@/server/blueprints/workflows/blueprint-library.workflow'

type RepoShape = Context.Service.Shape<typeof BlueprintLibraryRepo>

const installation: BlueprintLibraryInstallation = {
  installationID: '00000000-0000-4000-8000-000000000001',
  scopeID: '00000000-0000-4000-8000-000000000002',
  catalogKey: 'wedding',
  revision: 3,
  templateName: 'Wedding Weekend',
  eventName: 'Jordan & Casey',
  installedAt: '2026-10-16T12:34:56.789Z',
}

it.effect('lists only the repository projection for the authenticated actor', () => {
  const repo: RepoShape = {
    listUsed: vi.fn(() => Effect.succeed([installation])),
  }
  return Effect.gen(function* () {
    const result = yield* listUsedBlueprintsWorkflow('actor-user')
    expect(result).toEqual({ installations: [installation] })
    expect(Object.keys(result.installations[0]!).sort()).toEqual(
      [
        'installationID',
        'scopeID',
        'catalogKey',
        'revision',
        'templateName',
        'eventName',
        'installedAt',
      ].sort()
    )
    expect(repo.listUsed).toHaveBeenCalledWith('actor-user')
  }).pipe(Effect.provide(Layer.succeed(BlueprintLibraryRepo, repo)))
})

it.effect('rejects invalid or over-limit repository results before serialization', () => {
  const repo: RepoShape = {
    listUsed: vi.fn(() =>
      Effect.succeed(
        Array.from({ length: 201 }, (_, index) => ({
          ...installation,
          installationID: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        }))
      )
    ),
  }
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(listUsedBlueprintsWorkflow('actor-user'))
    expect(failure).toMatchObject({ code: 'BLUEPRINT_LIBRARY_RESPONSE_INVALID' })
  }).pipe(Effect.provide(Layer.succeed(BlueprintLibraryRepo, repo)))
})
