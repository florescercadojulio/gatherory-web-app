import { Layer } from 'effect'

import { MediaStorageLive } from './connectors/media-storage.con.live'
import { MediaRepoLive } from './repos/media.repo.live'
import { MediaServiceLive } from './services/media.service.live'

/** Production media graph. PgClient remains an external transport dependency. */
export const MediaDomainLive = MediaServiceLive.pipe(
  Layer.provide(Layer.mergeAll(MediaRepoLive, MediaStorageLive))
)
