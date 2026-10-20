import { Effect, Layer } from 'effect'
import { expect, it } from '@effect/vitest'
import { vi } from 'vitest'
import { BlueprintPersonalRepo } from '@/server/blueprints/repos/blueprint-personal.repo'
import { BlueprintAuthoringRepo } from '@/server/blueprints/repos/blueprint-authoring.repo'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'
import { createBlueprintCopyWorkflow } from '@/server/blueprints/workflows/blueprint-copy.workflow'

const content = {
  name: 'Portable copy',
  description: '',
  experienceType: 'custom' as const,
  children: [],
  ideas: [],
  instructions: [],
  todos: [],
}
const copied = {
  id: '10000000-0000-4000-8000-000000000001',
  draftVersion: 1,
  publishedRevision: 1,
  listedRevision: null,
  creatorName: null,
  activeShareLinkCount: 0,
  catalogEntry: {
    catalogKey: 'private_abc',
    revision: 1,
    contentHash: 'a'.repeat(64),
    definition: {},
    description: '',
  },
}

it.effect('validates snapshot before provisioning and creates a personal copy', () => {
  const copy = vi.fn(() => Effect.succeed(copied))
  const repo = {
    copy,
    list: () => Effect.succeed({ templates: [] }),
    save: () => Effect.die('unused'),
    publish: () => Effect.die('unused'),
    unlist: () => Effect.die('unused'),
    delete: () => Effect.die('unused'),
  }
  const context = vi.fn(() =>
    Effect.succeed({
      workspaces: [
        { id: 'personal-org', name: 'Templates', slug: 'personal-actor', personal: true },
      ],
    })
  )
  const authoring = {
    context,
    list: () => Effect.die('unused'),
    get: () => Effect.die('unused'),
    create: () => Effect.die('unused'),
    save: () => Effect.die('unused'),
    publish: () => Effect.die('unused'),
    retire: () => Effect.die('unused'),
    delete: () => Effect.die('unused'),
  }
  const auth = {
    createOrganization: () => Effect.die('must not provision existing owner'),
    listOrganizations: () => Effect.die('unused'),
    setActiveOrganization: () => Effect.die('unused'),
    listTeams: () => Effect.die('unused'),
    createTeam: () => Effect.die('unused'),
    addTeamMember: () => Effect.die('unused'),
    setActiveTeam: () => Effect.die('unused'),
    updateOrganization: () => Effect.die('unused'),
    deleteOrganization: () => Effect.die('unused'),
  }
  const layer = Layer.mergeAll(
    Layer.succeed(BlueprintPersonalRepo, repo),
    Layer.succeed(BlueprintAuthoringRepo, authoring),
    Layer.succeed(BetterAuthWorkspaceCon, auth)
  )
  return Effect.gen(function* () {
    const invalid = yield* Effect.exit(
      createBlueprintCopyWorkflow(
        { id: 'actor', name: 'A' },
        { requestId: 'bad', content: {} }
      ).pipe(Effect.provide(layer))
    )
    expect(invalid._tag).toBe('Failure')
    expect(context).not.toHaveBeenCalled()
    expect(copy).not.toHaveBeenCalled()
    const invalidActor = yield* Effect.exit(
      createBlueprintCopyWorkflow(
        { id: '', name: 'A' },
        { requestId: '10000000-0000-4000-8000-000000000002', content }
      ).pipe(Effect.provide(layer))
    )
    expect(invalidActor._tag).toBe('Failure')
    expect(context).not.toHaveBeenCalled()
    expect(copy).not.toHaveBeenCalled()
    const result = yield* createBlueprintCopyWorkflow(
      { id: 'actor', name: 'A' },
      { requestId: '10000000-0000-4000-8000-000000000002', content }
    ).pipe(Effect.provide(layer))
    expect(result.id).toBe('10000000-0000-4000-8000-000000000001')
    expect(result).toMatchObject({
      listedRevision: null,
      creatorName: null,
      activeShareLinkCount: 0,
      catalogEntry: { catalogKey: 'private_abc' },
    })
    expect(result.catalogEntry).not.toHaveProperty('creator')
    expect(copy).toHaveBeenCalledTimes(1)
    expect(copy).toHaveBeenCalledWith('actor', {
      requestId: '10000000-0000-4000-8000-000000000002',
      content,
    })
  })
})
