import { Effect } from 'effect'
import type { CreateWorkspaceInput, WorkspaceUser } from '../contracts/workspace.contracts'
import { WorkspaceService } from '../services/workspace.service'
import { workspaceOperationError } from './workspace-operation-error'

export const createWorkspaceWorkflow = (input: {
  data: CreateWorkspaceInput
  user: WorkspaceUser
  headers: Headers
  activeOrganizationId?: string | null
}) =>
  Effect.gen(function* () {
    const service = yield* WorkspaceService
    return yield* service.create({
      data: input.data,
      headers: input.headers,
      userId: input.user.id,
      userName: input.user.name,
      email: input.user.email,
      image: input.user.image ?? null,
      activeOrganizationId: input.activeOrganizationId,
    })
  }).pipe(
    Effect.mapError((cause) =>
      workspaceOperationError(cause, {
        category: 'system',
        code: 'WORKSPACE_CREATE_FAILED',
        userMessageKey: 'serverErrors.WORKSPACE_CREATE_FAILED',
      })
    )
  )
