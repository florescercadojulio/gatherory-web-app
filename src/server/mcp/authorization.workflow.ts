import { Effect } from 'effect'
import { McpAuthorizationRepository } from './authorization.repo.contract'

export const findMcpActiveSessionWorkflow = (sessionId: string) =>
  Effect.flatMap(McpAuthorizationRepository, (repository) =>
    repository.findActiveSession(sessionId)
  )

export const findMcpClientWorkflow = (clientId: string) =>
  Effect.flatMap(McpAuthorizationRepository, (repository) => repository.findClient(clientId))

export const findMcpConsentWorkflow = (userId: string, clientId: string) =>
  Effect.flatMap(McpAuthorizationRepository, (repository) =>
    repository.findConsent(userId, clientId)
  )
