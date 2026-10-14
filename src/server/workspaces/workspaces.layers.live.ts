import { Layer } from 'effect'

import { BetterAuthWorkspaceConLive } from './connectors/better-auth.con.live'
import { WorkspaceRepoLive } from './repos/workspace.repo.live'
import { WorkspaceServiceLive } from './services/workspace.service.live'

/** Trusted event-workspace provisioning uses only its repository and connector. */
export const EventWorkspaceProvisioningLive = Layer.mergeAll(
  WorkspaceRepoLive,
  BetterAuthWorkspaceConLive
)

/** Production workspace service graph; PgClient remains unresolved. */
export const WorkspaceDomainLive = WorkspaceServiceLive.pipe(
  Layer.provide(EventWorkspaceProvisioningLive)
)
