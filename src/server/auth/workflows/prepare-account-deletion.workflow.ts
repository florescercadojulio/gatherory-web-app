import { Effect } from 'effect'
import { AccountDeletionService } from '../services/account-deletion.service'

export const prepareAccountDeletionWorkflow = (userId: string) =>
  Effect.gen(function* () {
    const service = yield* AccountDeletionService
    return yield* service.prepare(userId)
  })
