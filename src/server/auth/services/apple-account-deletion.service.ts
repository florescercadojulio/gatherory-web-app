import { Context, type Effect } from 'effect'
import type { AppleProviderOptions } from '../connectors/apple-auth.con'

export class AppleAccountDeletionService extends Context.Service<
  AppleAccountDeletionService,
  {
    readonly revokeBeforeDeletion: (
      userId: string,
      options?: AppleProviderOptions
    ) => Effect.Effect<void, unknown>
  }
>()('AppleAccountDeletionService') {}
