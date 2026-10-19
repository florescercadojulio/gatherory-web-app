import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { vi } from 'vitest'

import { ConflictError, EntityNotFoundError } from '@/lib/domain-errors'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import {
  BlueprintRepo,
  type BlueprintActor,
  type BlueprintInstallResult,
  type CatalogRevision,
  type InstallationRecord,
} from '@/server/blueprints/contracts/blueprint-runtime.contracts'
import { installBlueprintWorkflow } from '@/server/blueprints/workflows/install-blueprint.workflow'
import {
  BetterAuthWorkspaceCon,
  type BetterAuthWorkspaceConShape,
} from '@/server/workspaces/connectors/better-auth.con'

type RepoShape = Context.Service.Shape<typeof BlueprintRepo>

const shareToken = 'a'.repeat(64)
const source: CatalogRevision = {
  id: 'persisted-wedding-revision',
  catalogKey: weddingBlueprintV1.catalogKey,
  revision: weddingBlueprintV1.revision,
  contentHash: weddingBlueprintV1.contentHash,
  definition: weddingBlueprintV1.definition,
}
const actor: BlueprintActor = {
  id: 'owner-user',
  name: 'Jamie',
  email: 'jamie@example.test',
}
const customizations = {
  version: 1 as const,
  children: [
    {
      key: 'after_party',
      title: 'After party',
      purpose: 'part_of_event' as const,
      category: 'other' as const,
    },
  ],
  ideas: [
    {
      key: 'after_party_idea',
      title: 'Late night snacks',
      category: 'other' as const,
      target: { kind: 'child' as const, key: 'after_party' },
      configuration: { version: 1 as const },
    },
  ],
}

function input(requestId: string, title = 'Late night snacks', token?: string) {
  return {
    requestId,
    catalogKey: source.catalogKey,
    revision: source.revision,
    contentHash: source.contentHash,
    ...(token ? { shareToken: token } : {}),
    mainEvent: {
      name: 'Jamie and Alex',
      startsAt: '2027-06-15T15:00:00-04:00',
      timeZone: 'America/Detroit',
    },
    selectedChildren: [{ key: 'after_party', startsAt: '2027-06-15T20:00:00-04:00' }],
    selectedIdeaKeys: ['after_party_idea'],
    capabilities: [
      'event.children_v1',
      'planning.ideas_v2',
      'planning.instructions_v1',
      'planning.portable_idea_config_v1',
    ],
    customizations: {
      ...customizations,
      ideas: [{ ...customizations.ideas[0], title }],
    },
  }
}

function fixture() {
  const receipts = new Map<string, InstallationRecord>()
  const claims: Parameters<RepoShape['claim']>[0][] = []
  const acquisitionHashes: string[] = []
  let nextInstallation = 1
  let nextOrganization = 1
  const key = (actorId: string, requestId: string) => `${actorId}:${requestId}`
  const unavailable = () =>
    new EntityNotFoundError({
      category: 'not_found',
      code: 'BLUEPRINT_LINK_UNAVAILABLE',
      userMessageKey: 'serverErrors.NOT_FOUND',
    })
  const auth: BetterAuthWorkspaceConShape = {
    listOrganizations: () => Effect.die('Unexpected organization listing'),
    createOrganization: () => Effect.die('Unexpected organization creation'),
    setActiveOrganization: () => Effect.die('Unexpected organization selection'),
    listTeams: () => Effect.die('Unexpected team listing'),
    createTeam: () => Effect.die('Unexpected team creation'),
    addTeamMember: () => Effect.die('Unexpected team membership'),
    setActiveTeam: () => Effect.die('Unexpected team selection'),
  }
  const repo: RepoShape = {
    catalog: () => Effect.die('Unexpected catalog listing'),
    revision: vi.fn<RepoShape['revision']>((catalogKey, revision, actorId, token) => {
      const authorizedLink = token === shareToken
      const ownerCanRead = actorId === actor.id && token === undefined
      if (
        catalogKey !== source.catalogKey ||
        revision !== source.revision ||
        (!authorizedLink && !ownerCanRead)
      ) {
        return Effect.fail(unavailable())
      }
      if (token !== undefined && !authorizedLink) return Effect.fail(unavailable())
      return Effect.succeed(source)
    }),
    status: vi.fn<RepoShape['status']>((actorId, requestId) =>
      Effect.succeed(receipts.get(key(actorId, requestId)) ?? null)
    ),
    claim: vi.fn<RepoShape['claim']>((claim) => {
      claims.push(claim)
      const result: BlueprintInstallResult = {
        installationID: `installation-${nextInstallation}`,
        organizationID: `organization-${nextOrganization}`,
        scopeID: `scope-${nextInstallation}`,
        manifest: { events: {}, ideas: {}, guides: {}, personID: 'person-1', participations: {} },
      }
      const receipt: InstallationRecord = {
        id: result.installationID,
        requestHash: claim.hash,
        state: 'completed',
        plan: claim.plan,
        provisioningSlug: `workspace-${nextInstallation}`,
        organizationId: result.organizationID,
        result,
      }
      receipts.set(key(claim.actor.id, claim.request.requestId), receipt)
      nextInstallation += 1
      nextOrganization += 1
      return Effect.succeed(receipt)
    }),
    acquire: vi.fn<RepoShape['acquire']>((actorId, requestId, hash) => {
      acquisitionHashes.push(hash)
      const receipt = receipts.get(key(actorId, requestId))
      if (!receipt) return Effect.fail(unavailable())
      if (receipt.requestHash !== hash) {
        return Effect.fail(
          new ConflictError({
            category: 'conflict',
            code: 'BLUEPRINT_REQUEST_CONFLICT',
            userMessageKey: 'serverErrors.CONFLICT',
          })
        )
      }
      return Effect.succeed(receipt)
    }),
    recoverWorkspace: () => Effect.die('Unexpected workspace recovery'),
    provisioned: () => Effect.die('Unexpected provisioning update'),
    complete: () => Effect.die('Unexpected installation completion'),
    release: () => Effect.die('Unexpected installation release'),
  }

  return {
    repo,
    claims,
    acquisitionHashes,
    layer: Layer.mergeAll(
      Layer.succeed(BlueprintRepo, repo),
      Layer.succeed(BetterAuthWorkspaceCon, auth)
    ),
  }
}

it.effect(
  'passes customized preview plans to the transaction port as independent installations',
  () => {
    const fake = fixture()
    const firstInput = input('70000000-0000-4000-8000-000000000001')
    const secondInput = input('70000000-0000-4000-8000-000000000002', 'Dessert bar')
    return Effect.gen(function* () {
      const first = yield* installBlueprintWorkflow(actor, firstInput)
      const second = yield* installBlueprintWorkflow(actor, secondInput)

      expect(first.installationID).not.toBe(second.installationID)
      expect(fake.repo.claim).toHaveBeenCalledTimes(2)
      expect(
        fake.claims.map(({ plan }) => ({
          child: plan.children.find(({ sourceKey }) => sourceKey === 'after_party')?.name,
          idea: plan.ideas.find(({ sourceKey }) => sourceKey === 'after_party_idea')?.title,
          categories: plan.categoryOrder,
        }))
      ).toEqual([
        {
          child: 'After party',
          idea: 'Late night snacks',
          categories: ['venue', 'attire', 'food', 'flowers', 'photography', 'other'],
        },
        {
          child: 'After party',
          idea: 'Dessert bar',
          categories: ['venue', 'attire', 'food', 'flowers', 'photography', 'other'],
        },
      ])
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect(
  'rejects changed customizations for a reused request UUID through receipt acquisition',
  () => {
    const fake = fixture()
    const requestId = '70000000-0000-4000-8000-000000000003'
    return Effect.gen(function* () {
      yield* installBlueprintWorkflow(actor, input(requestId, 'Late night snacks'))
      const failure = yield* Effect.flip(
        installBlueprintWorkflow(actor, input(requestId, 'Dessert bar'))
      )

      expect(failure).toBeInstanceOf(ConflictError)
      expect(failure).toMatchObject({ code: 'BLUEPRINT_REQUEST_CONFLICT' })
      expect(fake.repo.status).toHaveBeenCalledTimes(2)
      expect(fake.repo.acquire).toHaveBeenCalledTimes(1)
      expect(fake.acquisitionHashes).toHaveLength(1)
      expect(fake.repo.claim).toHaveBeenCalledTimes(1)
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect(
  'retains source access and share-token revocation checks before claiming an installation',
  () => {
    const fake = fixture()
    const revokedToken = 'b'.repeat(64)
    const requestId = '70000000-0000-4000-8000-000000000004'
    return Effect.gen(function* () {
      const sharedInput = input(requestId, undefined, shareToken)
      const sharedResult = yield* installBlueprintWorkflow(
        { ...actor, id: 'guest-user' },
        sharedInput
      )
      expect(sharedResult.installationID).toBe('installation-1')
      expect(fake.repo.revision).toHaveBeenCalledWith(
        source.catalogKey,
        source.revision,
        'guest-user',
        shareToken
      )

      const denied = yield* Effect.flip(
        installBlueprintWorkflow(
          { ...actor, id: 'guest-user' },
          input('70000000-0000-4000-8000-000000000005')
        )
      )
      expect(denied).toBeInstanceOf(EntityNotFoundError)
      expect(denied).toMatchObject({ code: 'BLUEPRINT_LINK_UNAVAILABLE' })

      const revoked = yield* Effect.flip(
        installBlueprintWorkflow(
          actor,
          input('70000000-0000-4000-8000-000000000006', undefined, revokedToken)
        )
      )
      expect(revoked).toBeInstanceOf(EntityNotFoundError)
      expect(revoked).toMatchObject({ code: 'BLUEPRINT_LINK_UNAVAILABLE' })
      expect(fake.repo.claim).toHaveBeenCalledTimes(1)
    }).pipe(Effect.provide(fake.layer))
  }
)

it.effect(
  'rejects a source access mismatch even when the request carries a valid customization payload',
  () => {
    const fake = fixture()
    const unauthorizedInput = input('70000000-0000-4000-8000-000000000007')
    return Effect.gen(function* () {
      const failure = yield* Effect.flip(
        installBlueprintWorkflow({ ...actor, id: 'unrelated-user' }, unauthorizedInput)
      )
      expect(failure).toBeInstanceOf(EntityNotFoundError)
      expect(fake.repo.claim).not.toHaveBeenCalled()
      expect(fake.repo.revision).toHaveBeenCalledTimes(1)
    }).pipe(Effect.provide(fake.layer))
  }
)
