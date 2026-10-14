import { Effect } from 'effect'
import { prepareAccountDeletionWorkflow } from '../workflows/account-deletion.workflows.live'

/** Promise compatibility adapter used by Better Auth's delete hook. */
export function prepareGatheroryAccountDeletion(userId: string) {
  return Effect.runPromise(prepareAccountDeletionWorkflow(userId))
}
