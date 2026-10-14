import { Layer } from 'effect'
import { AppleTokenRevocationConLive } from './connectors/apple-token-revocation.con.live'
import { AppleAccountDeletionRepoLive } from './repos/apple-account-deletion.repo.live'
import { AppleAccountDeletionServiceLive } from './services/apple-account-deletion.service.live'

const AppleAccountDeletionDependenciesLive = Layer.mergeAll(
  AppleAccountDeletionRepoLive,
  AppleTokenRevocationConLive
)

export const AppleAccountDeletionLive = AppleAccountDeletionServiceLive.pipe(
  Layer.provide(AppleAccountDeletionDependenciesLive)
)
