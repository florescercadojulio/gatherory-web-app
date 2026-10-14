import { expect, it } from '@effect/vitest'
import { Cause, Effect, Layer } from 'effect'
import { PersistenceError } from '@/server/effect'
import {
  BetterAuthWorkspaceCon,
  type BetterAuthWorkspaceConShape,
} from '@/server/workspaces/connectors/better-auth.con'
import { WorkspaceRepo, type WorkspaceRepoShape } from '@/server/workspaces/repos/workspace.repo'
import { WorkspaceService } from '@/server/workspaces/services/workspace.service'
import { WorkspaceServiceLive } from '@/server/workspaces/services/workspace.service.live'
import { createWorkspaceWorkflow } from '@/server/workspaces/workflows/create-workspace.workflow'
import { ensurePersonalWorkspaceWorkflow } from '@/server/workspaces/workflows/ensure-personal-workspace.workflow'
import { resolveWorkspaceWorkflow } from '@/server/workspaces/workflows/resolve-workspace.workflow'

const headers = new Headers()
const account = {
  id: 'user-1',
  name: 'Nexus',
  email: 'nexus@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  hasCompletedOnboarding: false,
}

const withPorts = <A, E>(
  program: Effect.Effect<A, E, WorkspaceService>,
  repo: WorkspaceRepoShape,
  connector: BetterAuthWorkspaceConShape
) =>
  program.pipe(
    Effect.provide(WorkspaceServiceLive),
    Effect.provide(Layer.succeed(WorkspaceRepo, repo)),
    Effect.provide(Layer.succeed(BetterAuthWorkspaceCon, connector))
  )

const unusedRepo: WorkspaceRepoShape = {
  listAccessible: () => Effect.die(new Error('Unexpected workspace listing')),
  ensurePlanningSettings: () => Effect.die(new Error('Unexpected settings write')),
  hasTeamMembership: () => Effect.die(new Error('Unexpected membership lookup')),
  normalizeOrganizationType: () => Effect.die(new Error('Unexpected organization update')),
  findAvailableSlug: () => Effect.die(new Error('Unexpected slug lookup')),
  findReusableActiveWorkspace: () => Effect.die(new Error('Unexpected workspace lookup')),
  rename: () => Effect.die(new Error('Unexpected rename')),
  createMainEvent: () => Effect.die(new Error('Unexpected event create')),
  rollbackWorkspaceCreation: () => Effect.die(new Error('Unexpected rollback')),
}

const unusedConnector: BetterAuthWorkspaceConShape = {
  listOrganizations: () => Effect.die(new Error('Unexpected organization listing')),
  createOrganization: () => Effect.die(new Error('Unexpected organization create')),
  setActiveOrganization: () => Effect.die(new Error('Unexpected active organization update')),
  listTeams: () => Effect.die(new Error('Unexpected team listing')),
  createTeam: () => Effect.die(new Error('Unexpected team create')),
  addTeamMember: () => Effect.die(new Error('Unexpected team membership create')),
  setActiveTeam: () => Effect.die(new Error('Unexpected active team update')),
}

it.effect('personal workspace workflow uses the live service with injected ports', () => {
  const workspace = {
    id: 'ws-1',
    name: 'Nexus Workspace',
    slug: 'personal-user1',
    workspaceType: 'event',
  }
  let addedMember: string | undefined
  let settingsOrganization: string | undefined
  const repo: WorkspaceRepoShape = {
    ...unusedRepo,
    listAccessible: () =>
      Effect.succeed([
        {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          type: 'event',
          access: 'member',
        },
      ]),
    ensurePlanningSettings: (organizationId) =>
      Effect.sync(() => {
        settingsOrganization = organizationId
      }),
    hasTeamMembership: () => Effect.succeed(false),
  }
  const connector: BetterAuthWorkspaceConShape = {
    ...unusedConnector,
    listOrganizations: () => Effect.succeed([workspace]),
    listTeams: () => Effect.succeed([{ id: 'team-1', name: 'Planning' }]),
    addTeamMember: (_headers, _organizationId, _teamId, userId) =>
      Effect.sync(() => {
        addedMember = userId
      }),
    setActiveTeam: () => Effect.void,
  }

  return ensurePersonalWorkspaceWorkflow({
    user: account,
    headers,
    activeOrganizationId: workspace.id,
  }).pipe(
    Effect.provide(WorkspaceServiceLive),
    Effect.provide(Layer.succeed(WorkspaceRepo, repo)),
    Effect.provide(Layer.succeed(BetterAuthWorkspaceCon, connector)),
    Effect.tap((result) =>
      Effect.sync(() => {
        expect(result.workspace.id).toBe(workspace.id)
        expect(result.workspaces[0]?.access).toBe('member')
        expect(result.planningTeam).toEqual({ id: 'team-1', name: 'Planning' })
        expect(result.user.id).toBe('user-1')
        expect(addedMember).toBe('user-1')
        expect(settingsOrganization).toBe(workspace.id)
      })
    )
  )
})

it.effect(
  'failed workspace creation compensates by deleting the new workspace and restoring active scope',
  () => {
    const failure = new PersistenceError({
      category: 'system',
      code: 'MAIN_EVENT_CREATE_FAILED',
      userMessageKey: 'serverErrors.MAIN_EVENT_CREATE_FAILED',
    })
    const calls: string[] = []
    const workspace = {
      id: 'new-workspace',
      name: 'New event',
      slug: 'new-event',
      workspaceType: 'event',
    }
    const repo: WorkspaceRepoShape = {
      ...unusedRepo,
      findReusableActiveWorkspace: () => Effect.succeed(null),
      findAvailableSlug: () => Effect.succeed('new-event'),
      normalizeOrganizationType: (organizationId) =>
        Effect.sync(() => calls.push(`normalize:${organizationId}`)),
      hasTeamMembership: () => Effect.succeed(true),
      createMainEvent: () => Effect.fail(failure),
      rollbackWorkspaceCreation: ({ disposableWorkspaceId }) =>
        Effect.sync(() => calls.push(`delete:${disposableWorkspaceId}`)),
    }
    const connector: BetterAuthWorkspaceConShape = {
      ...unusedConnector,
      createOrganization: () => Effect.succeed(workspace),
      setActiveOrganization: (_headers, organizationId) =>
        Effect.sync(() => calls.push(`active:${organizationId ?? 'none'}`)),
      listTeams: () => Effect.succeed([{ id: 'team-1', name: 'Planning' }]),
      setActiveTeam: (_headers, teamId) => Effect.sync(() => calls.push(`active-team:${teamId}`)),
    }

    const exit = Effect.exit(
      withPorts(
        createWorkspaceWorkflow({
          data: {
            eventName: 'New event',
            startsAt: '2026-10-14T12:00:00Z',
            isAllDay: false,
            timeZone: 'UTC',
          },
          user: account,
          headers,
          activeOrganizationId: 'previous-workspace',
        }),
        repo,
        connector
      )
    )

    return exit.pipe(
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result._tag).toBe('Failure')
          if (result._tag === 'Failure') {
            const failed = result.cause.reasons.find(Cause.isFailReason)
            expect(failed?.error, Cause.pretty(result.cause)).toBe(failure)
          }
          expect(calls).toEqual([
            'normalize:new-workspace',
            'active:new-workspace',
            'active-team:team-1',
            'delete:new-workspace',
            'active:previous-workspace',
          ])
        })
      )
    )
  }
)

it.effect(
  'participant workspace resolution does not change active organization or team state',
  () => {
    const calls: string[] = []
    const guestWorkspace = {
      id: 'guest-workspace',
      name: 'Guest event',
      slug: 'guest-event',
      type: 'event',
      access: 'participant' as const,
    }
    const repo: WorkspaceRepoShape = {
      ...unusedRepo,
      listAccessible: () => Effect.succeed([guestWorkspace]),
    }
    const connector: BetterAuthWorkspaceConShape = {
      ...unusedConnector,
      listOrganizations: () => Effect.succeed([]),
      setActiveOrganization: () => Effect.sync(() => calls.push('set-active-organization')),
      listTeams: () =>
        Effect.sync(() => {
          calls.push('list-teams')
          return []
        }),
      createTeam: () =>
        Effect.sync(() => {
          calls.push('create-team')
          return { id: 'unexpected-team', name: 'Planning' }
        }),
      addTeamMember: () => Effect.sync(() => calls.push('add-team-member')),
      setActiveTeam: () => Effect.sync(() => calls.push('set-active-team')),
    }

    return resolveWorkspaceWorkflow({
      slug: guestWorkspace.slug,
      user: account,
      headers,
      activeOrganizationId: 'member-workspace',
    }).pipe(
      Effect.provide(WorkspaceServiceLive),
      Effect.provide(Layer.succeed(WorkspaceRepo, repo)),
      Effect.provide(Layer.succeed(BetterAuthWorkspaceCon, connector)),
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result?.workspace).toEqual(guestWorkspace)
          expect(result?.planningTeam).toBeNull()
          expect(calls).toEqual([])
        })
      )
    )
  }
)
