import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { PersistenceError } from '@/lib/domain-errors'
import {
  BetterAuthWorkspaceCon,
  BetterAuthWorkspaceError,
} from '@/server/workspaces/connectors/better-auth.con'
import { WorkspaceRepo } from '@/server/workspaces/repos/workspace.repo'
import { createEventWorkspaceWorkflow } from '@/server/workspaces/workflows/create-event-workspace.workflow'

const input = { name: 'Seed workspace', slug: 'seed-workspace', userId: 'owner-1' }
const workspace = { id: 'org-1', name: input.name, slug: input.slug, workspaceType: 'event' }

it.effect('trusted provisioning forwards the owner without needing session headers', () =>
  Effect.gen(function* () {
    expect(yield* createEventWorkspaceWorkflow(input)).toBe(workspace)
  }).pipe(
    Effect.provide(
      Layer.mock(BetterAuthWorkspaceCon, {
        createOrganization: (received) =>
          Effect.sync(() => {
            expect(received).toEqual(input)
            return workspace
          }),
      })
    ),
    Effect.provide(Layer.mock(WorkspaceRepo, {}))
  )
)

it.effect('legacy organization type is normalized only after organization creation', () => {
  const calls: string[] = []
  return Effect.gen(function* () {
    expect(yield* createEventWorkspaceWorkflow(input)).toEqual(workspace)
    expect(calls).toEqual(['create', 'normalize:org-1'])
  }).pipe(
    Effect.provide(
      Layer.mock(BetterAuthWorkspaceCon, {
        createOrganization: () =>
          Effect.sync(() => {
            calls.push('create')
            return { ...workspace, workspaceType: 'wedding' }
          }),
      })
    ),
    Effect.provide(
      Layer.mock(WorkspaceRepo, {
        normalizeOrganizationType: (id) =>
          Effect.sync(() => {
            calls.push(`normalize:${id}`)
          }),
      })
    )
  )
})

it.effect('creation failure does not trigger normalization', () => {
  const error = new BetterAuthWorkspaceError({
    category: 'external',
    code: 'WORKSPACE_AUTH_OPERATION_FAILED',
  })
  return Effect.gen(function* () {
    expect(yield* Effect.flip(createEventWorkspaceWorkflow(input))).toBe(error)
  }).pipe(
    Effect.provide(
      Layer.mock(BetterAuthWorkspaceCon, { createOrganization: () => Effect.fail(error) })
    ),
    Effect.provide(Layer.mock(WorkspaceRepo, {}))
  )
})

it.effect('normalization failure remains a failure without deleting the created workspace', () => {
  const error = new PersistenceError({ category: 'system', code: 'NORMALIZATION_FAILED' })
  return Effect.gen(function* () {
    expect(yield* Effect.flip(createEventWorkspaceWorkflow(input))).toBe(error)
  }).pipe(
    Effect.provide(
      Layer.mock(BetterAuthWorkspaceCon, {
        createOrganization: () => Effect.succeed({ ...workspace, workspaceType: 'wedding' }),
      })
    ),
    Effect.provide(
      Layer.mock(WorkspaceRepo, { normalizeOrganizationType: () => Effect.fail(error) })
    )
  )
})
