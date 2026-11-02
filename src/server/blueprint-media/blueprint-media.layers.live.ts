import { Layer } from 'effect'

import { BlueprintCoverImageLive } from './connectors/blueprint-cover-image.con.live'
import { BlueprintCoverSourceLive } from './connectors/blueprint-cover-source.con.live'
import { BlueprintCoverStorageLive } from './connectors/blueprint-cover-storage.con.live'
import { BlueprintCoverRepoLive } from './repos/blueprint-cover.repo.live'
import { BlueprintCoverServiceLive } from './services/blueprint-cover.service.live'

const BlueprintCoverDependenciesLive = Layer.mergeAll(
  BlueprintCoverRepoLive,
  BlueprintCoverStorageLive,
  BlueprintCoverImageLive,
  BlueprintCoverSourceLive
)

/** Reusable Blueprint cover graph; PgClient remains ambient for callers. */
export const BlueprintCoverDomainLive = BlueprintCoverServiceLive.pipe(
  Layer.provide(BlueprintCoverDependenciesLive)
)
