import { Context, Effect } from 'effect'
import type { auth } from '@/lib/auth'
import type { DomainError } from '@/lib/domain-errors'

export type ModerationSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export class ModerationSessionConnector extends Context.Service<
  ModerationSessionConnector,
  {
    readonly getSession: () => Effect.Effect<ModerationSession | null, DomainError>
  }
>()('ModerationSessionConnector') {}
