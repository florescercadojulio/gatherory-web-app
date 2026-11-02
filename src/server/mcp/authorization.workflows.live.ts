import { Effect } from 'effect'
import { McpAuthorizationRepositoryLive } from './authorization.repo.live'
import {
  findMcpActiveSessionWorkflow as findActiveSession,
  findMcpClientWorkflow as findClient,
  findMcpConsentWorkflow as findConsent,
} from './authorization.workflow'

export const findMcpActiveSessionWorkflow = (...args: Parameters<typeof findActiveSession>) =>
  findActiveSession(...args).pipe(Effect.provide(McpAuthorizationRepositoryLive))

export const findMcpClientWorkflow = (...args: Parameters<typeof findClient>) =>
  findClient(...args).pipe(Effect.provide(McpAuthorizationRepositoryLive))

export const findMcpConsentWorkflow = (...args: Parameters<typeof findConsent>) =>
  findConsent(...args).pipe(Effect.provide(McpAuthorizationRepositoryLive))
