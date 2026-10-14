import { Effect } from 'effect'
import type { AppleProviderOptions } from '../connectors/apple-auth.con'
import { AppleAccountDeletionService } from '../services/apple-account-deletion.service'

export const revokeAppleAccountsBeforeDeletionWorkflow = (
  userId: string,
  options?: AppleProviderOptions
) =>
  Effect.gen(function* () {
    const service = yield* AppleAccountDeletionService
    return yield* service.revokeBeforeDeletion(userId, options)
  })
