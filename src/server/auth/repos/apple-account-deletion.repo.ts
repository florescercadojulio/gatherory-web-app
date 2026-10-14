import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'

export type StoredAppleAccountTokens = {
  readonly idToken: string | null
  readonly refreshToken: string | null
  readonly accessToken: string | null
}

export class AppleAccountDeletionRepo extends Context.Service<
  AppleAccountDeletionRepo,
  {
    readonly findAccounts: (
      userId: string
    ) => Effect.Effect<ReadonlyArray<StoredAppleAccountTokens>, DomainError>
  }
>()('AppleAccountDeletionRepo') {}
