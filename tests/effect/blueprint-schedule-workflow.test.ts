import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'

import { BlueprintExperienceTreeModuleSchema } from '@/contracts/blueprint-install.contracts'
import type { BlueprintScheduleInput } from '@/contracts/blueprint-schedule.contracts'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import {
  BlueprintRepo,
  type CatalogRevision,
} from '@/server/blueprints/contracts/blueprint-runtime.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'
import { scheduleBlueprintWorkflow } from '@/server/blueprints/workflows/schedule-blueprint.workflow'
import {
  BetterAuthWorkspaceCon,
  type BetterAuthWorkspaceConShape,
} from '@/server/workspaces/connectors/better-auth.con'

type BlueprintRepoShape = Context.Service.Shape<typeof BlueprintRepo>

function fixture() {
  const definition = structuredClone(weddingBlueprintV1.definition)
  definition.blueprint.id = 'schedule_workflow_fixture'
  definition.blueprint.revision = 7
  definition.modules = definition.modules.map((module) => {
    if (module.type !== 'experience_tree' || module.version !== 2) return module
    const tree = BlueprintExperienceTreeModuleSchema.parse(module)
    for (const child of tree.config.children) {
      child.scheduleProposal = { anchor: 'main_start', dayOffset: -2, localTime: '10:45' }
    }
    return tree
  })
  const published: CatalogRevision = {
    id: 'persisted-schedule-revision-7',
    catalogKey: definition.blueprint.id,
    revision: definition.blueprint.revision,
    contentHash: blueprintHash(definition),
    definition,
  }
  const input: BlueprintScheduleInput = {
    catalogKey: published.catalogKey,
    revision: published.revision,
    contentHash: published.contentHash,
    mainEvent: { startsAt: '2027-06-15T19:00:00Z', timeZone: 'America/Detroit' },
  }
  return { published, input }
}

function dependencies(published: CatalogRevision) {
  const unexpectedCalls: string[] = []
  const forbidden = (operation: string) =>
    vi.fn(() => {
      unexpectedCalls.push(operation)
      return Effect.die(new Error(`Unexpected schedule operation: ${operation}`))
    })

  const repo = {
    revision: vi.fn<BlueprintRepoShape['revision']>(() => Effect.succeed(published)),
    catalog: forbidden('repo.catalog'),
    status: forbidden('repo.status'),
    claim: forbidden('repo.claim'),
    acquire: forbidden('repo.acquire'),
    recoverWorkspace: forbidden('repo.recoverWorkspace'),
    provisioned: forbidden('repo.provisioned'),
    complete: forbidden('repo.complete'),
    release: forbidden('repo.release'),
  } satisfies BlueprintRepoShape
  const auth = {
    listOrganizations: forbidden('auth.listOrganizations'),
    createOrganization: forbidden('auth.createOrganization'),
    setActiveOrganization: forbidden('auth.setActiveOrganization'),
    listTeams: forbidden('auth.listTeams'),
    createTeam: forbidden('auth.createTeam'),
    addTeamMember: forbidden('auth.addTeamMember'),
    setActiveTeam: forbidden('auth.setActiveTeam'),
  } satisfies BetterAuthWorkspaceConShape

  return {
    repo,
    layer: Layer.mergeAll(
      Layer.succeed(BlueprintRepo, repo),
      Layer.succeed(BetterAuthWorkspaceCon, auth)
    ),
    expectOnlyRevisionReads(count: number) {
      expect(repo.revision).toHaveBeenCalledTimes(count)
      expect(unexpectedCalls).toEqual([])
      for (const [name, operation] of Object.entries(repo)) {
        if (name !== 'revision') expect(operation).not.toHaveBeenCalled()
      }
      for (const operation of Object.values(auth)) expect(operation).not.toHaveBeenCalled()
    },
  }
}

it.effect('reads the exact pinned revision once and returns the pure planner result', () => {
  const { published, input } = fixture()
  const fake = dependencies(published)
  const expected = suggestBlueprintSchedule(input, published.definition)

  return Effect.gen(function* () {
    const result = yield* scheduleBlueprintWorkflow(input, 'host')
    expect(result).toEqual(expected)
    expect(result.suggestions).not.toHaveLength(0)
    expect(result.suggestions[0]).toMatchObject({
      localDateTime: '2027-06-13T10:45:00',
      candidates: ['2027-06-13T14:45:00Z'],
    })
    expect(fake.repo.revision).toHaveBeenCalledWith(
      input.catalogKey,
      input.revision,
      'host',
      undefined
    )
    fake.expectOnlyRevisionReads(1)
  }).pipe(Effect.provide(fake.layer))
})

const invalidInputs: Array<{
  label: string
  make: (input: BlueprintScheduleInput) => unknown
}> = [
  { label: 'null input', make: () => null },
  { label: 'missing content hash', make: (input) => ({ ...input, contentHash: undefined }) },
  { label: 'invalid revision', make: (input) => ({ ...input, revision: 0 }) },
  {
    label: 'unconfirmed local start',
    make: (input) => ({
      ...input,
      mainEvent: { ...input.mainEvent, startsAt: '2027-06-15T15:00:00' },
    }),
  },
]

for (const { label, make } of invalidInputs) {
  it.effect(`rejects ${label} before any repository operation`, () => {
    const { published, input } = fixture()
    const fake = dependencies(published)

    return Effect.gen(function* () {
      const failure = yield* Effect.flip(scheduleBlueprintWorkflow(make(input), 'host'))
      expect(failure).toBeInstanceOf(InvalidInputError)
      expect(failure).toMatchObject({
        _tag: 'InvalidInputError',
        category: 'validation',
        code: 'INVALID_INPUT',
        userMessageKey: 'serverErrors.VALIDATION',
      })
      fake.expectOnlyRevisionReads(0)
    }).pipe(Effect.provide(fake.layer))
  })
}

it.effect(
  'returns a typed conflict when the requested content hash differs from the revision',
  () => {
    const { published, input } = fixture()
    const fake = dependencies(published)
    const changedHash = '0'.repeat(64)
    expect(changedHash).not.toBe(published.contentHash)

    return Effect.gen(function* () {
      const failure = yield* Effect.flip(
        scheduleBlueprintWorkflow({ ...input, contentHash: changedHash }, 'host')
      )
      expect(failure).toBeInstanceOf(ConflictError)
      expect(failure).toMatchObject({
        _tag: 'ConflictError',
        category: 'conflict',
        code: 'BLUEPRINT_REVISION_CHANGED',
        userMessageKey: 'serverErrors.CONFLICT',
      })
      expect(fake.repo.revision).toHaveBeenCalledWith(
        input.catalogKey,
        input.revision,
        'host',
        undefined
      )
      fake.expectOnlyRevisionReads(1)
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect('maps an invalid schedule zone to typed INVALID_BLUEPRINT_SCHEDULE', () => {
  const { published, input } = fixture()
  const fake = dependencies(published)

  return Effect.gen(function* () {
    const failure = yield* Effect.flip(
      scheduleBlueprintWorkflow(
        {
          ...input,
          mainEvent: { ...input.mainEvent, timeZone: 'Not/A_Zone' },
        },
        'host'
      )
    )
    expect(failure).toBeInstanceOf(InvalidInputError)
    expect(failure).toMatchObject({
      _tag: 'InvalidInputError',
      category: 'validation',
      code: 'INVALID_BLUEPRINT_SCHEDULE',
      userMessageKey: 'serverErrors.VALIDATION',
    })
    expect(failure.cause).toBeInstanceOf(Error)
    expect(fake.repo.revision).toHaveBeenCalledWith(
      input.catalogKey,
      input.revision,
      'host',
      undefined
    )
    fake.expectOnlyRevisionReads(1)
  }).pipe(Effect.provide(fake.layer))
})
