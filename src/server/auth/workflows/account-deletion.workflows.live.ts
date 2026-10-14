import { Effect } from 'effect'
import { AccountDeletionLive } from '../account-deletion.layers.live'
import { prepareAccountDeletionWorkflow as program } from './prepare-account-deletion.workflow'

export const prepareAccountDeletionWorkflow = (...args: Parameters<typeof program>) =>
  program(...args).pipe(Effect.provide(AccountDeletionLive))
