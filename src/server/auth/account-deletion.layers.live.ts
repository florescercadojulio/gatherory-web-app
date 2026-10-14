import { Layer } from 'effect'
import { AccountDeletionStorageConLive } from './connectors/account-deletion-storage.con.live'
import { AccountDeletionRepoLive } from './repos/account-deletion.repo.live'
import { AccountDeletionServiceLive } from './services/account-deletion.service.live'

const AccountDeletionDependenciesLive = Layer.mergeAll(
  AccountDeletionRepoLive,
  AccountDeletionStorageConLive
)

export const AccountDeletionLive = AccountDeletionServiceLive.pipe(
  Layer.provide(AccountDeletionDependenciesLive)
)
