import { Effect } from 'effect'
import type { WorkspaceUser } from '../contracts/workspace.contracts'
import { WorkspaceService } from '../services/workspace.service'
import { workspaceOperationError } from './workspace-operation-error'

export const resolveWorkspaceWorkflow = (input: {
  slug: string
  user: WorkspaceUser
  headers: Headers
  activeOrganizationId?: string | null
}) =>
  Effect.gen(function* () {
    const service = yield* WorkspaceService
    const resolved = yield* service.resolve({
      slug: input.slug,
      headers: input.headers,
      userId: input.user.id,
      userName: input.user.name,
      email: input.user.email,
      image: input.user.image ?? null,
      activeOrganizationId: input.activeOrganizationId,
    })
    if (!resolved) return null
    return { ...resolved, user: input.user }
  }).pipe(
    Effect.mapError((cause) =>
      workspaceOperationError(cause, {
        category: 'system',
        code: 'WORKSPACE_RESOLVE_FAILED',
        userMessageKey: 'serverErrors.WORKSPACE_RESOLVE_FAILED',
      })
    )
  )
