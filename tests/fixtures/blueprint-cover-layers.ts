import { Effect, Layer } from 'effect'

import { BlueprintCoverImageLive } from '@/server/blueprint-media/connectors/blueprint-cover-image.con.live'
import { BlueprintCoverSource } from '@/server/blueprint-media/connectors/blueprint-cover-source.con'
import type { BlueprintCoverSourceShape } from '@/server/blueprint-media/connectors/blueprint-cover-source.con'
import { BlueprintCoverStorage } from '@/server/blueprint-media/connectors/blueprint-cover-storage.con'
import type { BlueprintCoverStorageShape } from '@/server/blueprint-media/connectors/blueprint-cover-storage.con'
import { BlueprintCoverRepoLive } from '@/server/blueprint-media/repos/blueprint-cover.repo.live'
import { BlueprintCoverServiceLive } from '@/server/blueprint-media/services/blueprint-cover.service.live'

export { blueprintSeedImageTestSource } from './blueprint-seed-image-source'

/**
 * Real Blueprint cover service/repository/image graph for database tests.
 * Storage and source downloading stay offline and are supplied by each test.
 * PgClient/DB remains an outer dependency so callers keep their own transaction.
 */
export function blueprintCoverTestLive(
  storage: BlueprintCoverStorageShape,
  source: BlueprintCoverSourceShape = {
    download: () => Effect.die('unexpected Blueprint cover source download'),
  }
) {
  return BlueprintCoverServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        BlueprintCoverRepoLive,
        BlueprintCoverImageLive,
        Layer.succeed(BlueprintCoverStorage, storage),
        Layer.succeed(BlueprintCoverSource, source)
      )
    )
  )
}
