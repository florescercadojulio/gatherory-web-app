import { Effect, Layer } from 'effect'
import { isDomainError } from '@/lib/domain-errors'
import { auth } from '@/lib/auth'
import { BetterAuthWorkspaceCon, BetterAuthWorkspaceError } from './better-auth.con'
import type { AuthWorkspace, PlanningTeam } from '../contracts/workspace.contracts'

function authCall<A>(operation: string, run: () => Promise<A>) {
  return Effect.tryPromise({
    try: run,
    catch: (cause) => {
      if (isDomainError(cause)) return cause
      return new BetterAuthWorkspaceError({
        category: 'external',
        code: 'WORKSPACE_AUTH_OPERATION_FAILED',
        userMessageKey: 'serverErrors.SYSTEM',
        debugMessage: `Better Auth failed during ${operation}.`,
        cause,
      })
    },
  })
}

export const BetterAuthWorkspaceConLive = Layer.succeed(BetterAuthWorkspaceCon, {
  listOrganizations: (headers) =>
    authCall('list organizations', async () => {
      const organizations = await auth.api.listOrganizations({ headers })
      return organizations.map((organization) => organization satisfies AuthWorkspace)
    }),
  createOrganization: ({ headers, name, slug, userId }) =>
    authCall('create organization', async () => {
      const organization = await auth.api.createOrganization({
        ...(headers ? { headers } : {}),
        body: { name, slug, ...(userId ? { userId } : {}) },
      })
      return organization satisfies AuthWorkspace
    }),
  setActiveOrganization: (headers, organizationId) =>
    authCall('set active organization', async () => {
      await auth.api.setActiveOrganization({ headers, body: { organizationId } })
    }),
  listTeams: (headers, organizationId) =>
    authCall('list teams', async () => {
      const teams = await auth.api.listOrganizationTeams({
        headers,
        query: { organizationId },
      })
      return teams.map((team) => team satisfies PlanningTeam)
    }),
  createTeam: (headers, organizationId) =>
    authCall('create team', async () => {
      const team = await auth.api.createTeam({
        headers,
        body: { name: 'Planning', organizationId },
      })
      return team satisfies PlanningTeam
    }),
  addTeamMember: (headers, organizationId, teamId, userId) =>
    authCall('add team member', async () => {
      await auth.api.addTeamMember({ headers, body: { teamId, userId, organizationId } })
    }),
  setActiveTeam: (headers, teamId) =>
    authCall('set active team', async () => {
      await auth.api.setActiveTeam({ headers, body: { teamId } })
    }),
})
