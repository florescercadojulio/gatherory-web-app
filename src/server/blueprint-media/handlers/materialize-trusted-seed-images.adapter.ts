import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { materializeCuratedSeedImages } from '../blueprint-media.workflows.live'

/** Trusted seed-script bridge; production request handlers use the HTTP use cases. */
export function materializeTrustedSeedImagesLive(
  input: Parameters<typeof materializeCuratedSeedImages>[0]
) {
  return materializeCuratedSeedImages(input).pipe(Effect.provide(PgClientLive))
}
