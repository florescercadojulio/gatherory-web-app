import { Effect, Layer } from 'effect'

import { isDomainError, PersistenceError, type UserMessageKey } from '@/lib/domain-errors'
import {
  applyNativeMutations,
  listNativeWorkspaceSnapshots,
  pullNativeChanges,
} from './native-sync-legacy.persistence'
import { NativeSyncRepo } from './native-sync.repo'

function persist<A>(code: string, userMessageKey: UserMessageKey, operation: () => Promise<A>) {
  return Effect.tryPromise({
    try: operation,
    catch: (cause) =>
      isDomainError(cause)
        ? cause
        : new PersistenceError({ category: 'system', code, userMessageKey, cause }),
  })
}

export const NativeSyncRepoLive = Layer.succeed(NativeSyncRepo, {
  applyMutations: (input) =>
    persist('SYNC_PUSH_FAILED', 'serverErrors.SYNC_PUSH_FAILED', () => applyNativeMutations(input)),
  pullChanges: (input) =>
    persist('SYNC_PULL_FAILED', 'serverErrors.SYNC_PULL_FAILED', () => pullNativeChanges(input)),
  listWorkspaceSnapshots: (input) =>
    persist('SYNC_BOOTSTRAP_FAILED', 'serverErrors.SYNC_BOOTSTRAP_FAILED', () =>
      listNativeWorkspaceSnapshots(input)
    ),
})
