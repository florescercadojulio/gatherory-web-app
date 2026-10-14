import { ServerOperationError, serverOperationError } from '@/server/effect'
import type { DomainErrorShape, DomainError } from '@/server/effect'
import { BetterAuthWorkspaceError } from '../connectors/better-auth.con'
import type { WorkspaceServiceError } from '../services/workspace.service'

export function workspaceOperationError(
  cause: WorkspaceServiceError,
  fallback: Omit<DomainErrorShape, 'cause'>
): DomainError {
  if (cause instanceof BetterAuthWorkspaceError) {
    return new ServerOperationError({ ...fallback, cause })
  }
  return serverOperationError(cause, fallback)
}
