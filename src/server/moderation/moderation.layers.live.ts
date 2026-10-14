import { Layer } from 'effect'
import { MediaStorageLive } from '@/server/media/connectors/media-storage.con.live'
import { MediaRepoLive } from '@/server/media/repos/media.repo.live'
import { ModerationMediaConnectorLive } from './connectors/moderation-media.con.live'
import { ModerationRepoLive } from './repos/moderation.repo.live'
import { UserBlockRepoLive } from './repos/user-block.repo.live'
import { ModerationServiceLive } from './services/moderation.service.live'

const ModerationDependenciesLive = Layer.mergeAll(
  ModerationRepoLive.pipe(Layer.provide(MediaRepoLive)),
  UserBlockRepoLive,
  ModerationMediaConnectorLive.pipe(Layer.provide(MediaStorageLive))
)

export const ModerationServerLive = ModerationServiceLive.pipe(
  Layer.provide(ModerationDependenciesLive)
)
