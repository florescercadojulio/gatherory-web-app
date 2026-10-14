import { Effect } from 'effect'
import { AppleAccountDeletionLive } from '../apple-account-deletion.layers.live'
import { revokeAppleAccountsBeforeDeletionWorkflow as program } from './revoke-apple-accounts-before-deletion.workflow'

export const revokeAppleAccountsBeforeDeletionWorkflow = (...args: Parameters<typeof program>) =>
  program(...args).pipe(Effect.provide(AppleAccountDeletionLive))
