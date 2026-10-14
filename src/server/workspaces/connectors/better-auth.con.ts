import { Context, Data, Effect } from 'effect'
import type { DomainError, DomainErrorShape } from '@/server/effect'
import type { AuthWorkspace, PlanningTeam } from '../contracts/workspace.contracts'

export class BetterAuthWorkspaceError extends Data.TaggedError(
  'BetterAuthWorkspaceError'
)<DomainErrorShape> {}

export type BetterAuthWorkspaceFailure = DomainError

export type BetterAuthWorkspaceConShape = {
  readonly listOrganizations: (
    headers: Headers
  ) => Effect.Effect<AuthWorkspace[], BetterAuthWorkspaceFailure>
  readonly createOrganization: (input: {
    headers: Headers
    name: string
    slug: string
  }) => Effect.Effect<AuthWorkspace, BetterAuthWorkspaceFailure>
  readonly setActiveOrganization: (
    headers: Headers,
    organizationId: string | null
  ) => Effect.Effect<void, BetterAuthWorkspaceFailure>
  readonly listTeams: (
    headers: Headers,
    organizationId: string
  ) => Effect.Effect<PlanningTeam[], BetterAuthWorkspaceFailure>
  readonly createTeam: (
    headers: Headers,
    organizationId: string
  ) => Effect.Effect<PlanningTeam, BetterAuthWorkspaceFailure>
  readonly addTeamMember: (
    headers: Headers,
    organizationId: string,
    teamId: string,
    userId: string
  ) => Effect.Effect<void, BetterAuthWorkspaceFailure>
  readonly setActiveTeam: (
    headers: Headers,
    teamId: string
  ) => Effect.Effect<void, BetterAuthWorkspaceFailure>
}

export class BetterAuthWorkspaceCon extends Context.Service<
  BetterAuthWorkspaceCon,
  BetterAuthWorkspaceConShape
>()('BetterAuthWorkspaceCon') {}
