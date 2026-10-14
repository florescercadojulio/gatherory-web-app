import { Effect, Layer } from 'effect'
import type { PgClient } from '@effect/sql-pg/PgClient'

import { PgClientLive } from '@/db'
import { MediaService } from './services/media.service'
import { MediaStorageLive } from './connectors/media-storage.con.live'
import { MediaRepoLive } from './repos/media.repo.live'
import { MediaServiceLive } from './services/media.service.live'

/** Composition point for server-function and API-route transports. */
export const MediaDomainLive = MediaServiceLive.pipe(
  Layer.provide(Layer.mergeAll(MediaRepoLive, MediaStorageLive))
)

export function provideMediaLayers<A, E, R extends MediaService | PgClient>(
  program: Effect.Effect<A, E, R>
) {
  return program.pipe(Effect.provide(MediaDomainLive), Effect.provide(PgClientLive))
}
