import { Context, Effect } from 'effect'
import type { ExternalServiceError } from '@/lib/domain-errors'

export type ModerationMediaConnectorShape = {
  readonly createEvidenceReadUrl: (input: {
    bucket: string
    key: string
    expiresInSeconds: number
  }) => Effect.Effect<string, ExternalServiceError>
}

export class ModerationMediaConnector extends Context.Service<
  ModerationMediaConnector,
  ModerationMediaConnectorShape
>()('ModerationMediaConnector') {}
