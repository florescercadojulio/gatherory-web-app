import { Effect } from 'effect'
import type { WorkspaceUser } from '../contracts/workspace.contracts'
import { WorkspaceService } from '../services/workspace.service'
import { workspaceOperationError } from './workspace-operation-error'

export const ensurePersonalWorkspaceWorkflow = (input: {
  user: WorkspaceUser
  headers: Headers
  activeOrganizationId?: string | null
}) =>
  Effect.gen(function* () {
    const service = yield* WorkspaceService
    const provisioned = yield* service.provisionPersonal({
      headers: input.headers,
      userId: input.user.id,
      userName: input.user.name,
      email: input.user.email,
      image: input.user.image ?? null,
      activeOrganizationId: input.activeOrganizationId,
    })
    const workspaces = yield* service.listAccessible({
      userId: input.user.id,
      memberWorkspaces: provisioned.memberWorkspaces,
    })
    return {
      workspace: {
        id: provisioned.workspace.id,
        name: provisioned.workspace.name,
        slug: provisioned.workspace.slug,
        type: provisioned.workspace.workspaceType,
        access: 'member' as const,
      },
      workspaces,
      planningTeam: { id: provisioned.planningTeam.id, name: provisioned.planningTeam.name },
      user: input.user,
    }
  }).pipe(
    Effect.mapError((cause) =>
      workspaceOperationError(cause, {
        category: 'system',
        code: 'PERSONAL_WORKSPACE_PROVISION_FAILED',
        userMessageKey: 'serverErrors.PERSONAL_WORKSPACE_PROVISION_FAILED',
      })
    )
  )
