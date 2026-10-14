import { Context, type Effect } from 'effect'
import type {
  AuthWorkspace,
  CreateWorkspaceInput,
  PlanningTeam,
  WorkspaceSummary,
} from '../contracts/workspace.contracts'
import type { BetterAuthWorkspaceFailure } from '../connectors/better-auth.con'
import type { WorkspaceRepoError } from '../repos/workspace.repo'

export type WorkspaceServiceError = WorkspaceRepoError | BetterAuthWorkspaceFailure
export type WorkspaceActor = {
  userId: string
  userName: string
  email: string
  image: string | null
  headers: Headers
}

export type WorkspaceServiceShape = {
  readonly listAccessible: (input: {
    userId: string
    memberWorkspaces: AuthWorkspace[]
  }) => Effect.Effect<WorkspaceSummary[], WorkspaceServiceError>
  readonly provisionPersonal: (
    input: WorkspaceActor & { activeOrganizationId?: string | null }
  ) => Effect.Effect<
    { workspace: AuthWorkspace; planningTeam: PlanningTeam; memberWorkspaces: AuthWorkspace[] },
    WorkspaceServiceError
  >
  readonly create: (
    input: WorkspaceActor & { activeOrganizationId?: string | null; data: CreateWorkspaceInput }
  ) => Effect.Effect<{ slug: string }, WorkspaceServiceError>
  readonly resolve: (
    input: WorkspaceActor & { slug: string; activeOrganizationId?: string | null }
  ) => Effect.Effect<
    {
      workspace: WorkspaceSummary
      workspaces: WorkspaceSummary[]
      planningTeam: PlanningTeam | null
    } | null,
    WorkspaceServiceError
  >
}

export class WorkspaceService extends Context.Service<WorkspaceService, WorkspaceServiceShape>()(
  'WorkspaceService'
) {}
