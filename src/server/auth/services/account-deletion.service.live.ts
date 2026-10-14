import { Effect, Layer } from 'effect'
import { AccountDeletionRepo } from '../repos/account-deletion.repo'
import { AccountDeletionStorageCon } from '../connectors/account-deletion-storage.con'
import { AccountDeletionService } from './account-deletion.service'

export const AccountDeletionServiceLive = Layer.effect(
  AccountDeletionService,
  Effect.gen(function* () {
    const repo = yield* AccountDeletionRepo
    const storage = yield* AccountDeletionStorageCon
    return {
      prepare: (userId: string) => repo.prepare(userId, storage.deleteObject),
    }
  })
)
