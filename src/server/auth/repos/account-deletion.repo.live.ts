import { Effect, Layer } from 'effect'
import { prepareGatheroryAccountDeletion } from './account-deletion.persistence'
import { AccountDeletionRepo } from './account-deletion.repo'

export const AccountDeletionRepoLive = Layer.succeed(AccountDeletionRepo, {
  prepare: (userId, deleteObject) =>
    Effect.tryPromise({
      try: () => prepareGatheroryAccountDeletion(userId, deleteObject),
      // Keep the original rejection value observable to Better Auth callers.
      catch: (cause) => cause,
    }),
})
