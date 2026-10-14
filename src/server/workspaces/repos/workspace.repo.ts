import { Context, type Effect } from 'effect'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import type { PersistenceError } from '@/server/effect'
import type {
  CreateWorkspaceInput,
  AuthWorkspace,
  WorkspaceSummary,
} from '../contracts/workspace.contracts'

export type CreateMainEventInput = {
  organizationId: string
  userId: string
  userName: string
  email: string
  image: string | null
  data: CreateWorkspaceInput
}

export type WorkspaceRepoError = EffectDrizzleQueryError | SqlError | PersistenceError
export type WorkspaceRepoShape = {
  readonly listAccessible: (input: {
    userId: string
    memberWorkspaces: AuthWorkspace[]
  }) => Effect.Effect<WorkspaceSummary[], WorkspaceRepoError>
  readonly ensurePlanningSettings: (
    organizationId: string
  ) => Effect.Effect<void, WorkspaceRepoError>
  readonly hasTeamMembership: (
    teamId: string,
    userId: string
  ) => Effect.Effect<boolean, WorkspaceRepoError>
  readonly normalizeOrganizationType: (
    organizationId: string
  ) => Effect.Effect<void, WorkspaceRepoError>
  readonly findAvailableSlug: (name: string) => Effect.Effect<string, WorkspaceRepoError>
  readonly findReusableActiveWorkspace: (input: {
    organizationId?: string | null
    userId: string
  }) => Effect.Effect<AuthWorkspace | null, WorkspaceRepoError>
  readonly rename: (input: {
    organizationId: string
    name: string
  }) => Effect.Effect<void, WorkspaceRepoError>
  readonly createMainEvent: (input: CreateMainEventInput) => Effect.Effect<void, WorkspaceRepoError>
  readonly rollbackWorkspaceCreation: (input: {
    disposableWorkspaceId?: string
    previousName?: { id: string; name: string }
  }) => Effect.Effect<void, WorkspaceRepoError>
}

export class WorkspaceRepo extends Context.Service<WorkspaceRepo, WorkspaceRepoShape>()(
  'WorkspaceRepo'
) {}
