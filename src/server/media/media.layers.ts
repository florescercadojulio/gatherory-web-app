import { Effect } from 'effect'
import type { PgClient } from '@effect/sql-pg/PgClient'

import { PgClientLive } from '@/db'
import { MediaDomainLive } from './media.layers.live'
import type { MediaService } from './services/media.service'

export { MediaDomainLive } from './media.layers.live'

/** @deprecated Use composed media workflows and provide PgClientLive at the boundary. */
export function provideMediaLayers<A, E, R extends MediaService | PgClient>(
  program: Effect.Effect<A, E, R>
) {
  return program.pipe(Effect.provide(MediaDomainLive), Effect.provide(PgClientLive))
}
