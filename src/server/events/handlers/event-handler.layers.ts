import { PgClientLive } from '@/db'
import { Effect } from 'effect'
import { EventDomainLive } from '../event.layers.live'
import { EventSharingDomainLive } from '../event-sharing.layers.live'
import { EventService } from '../services/event.service'
import { EventSharingService } from '../services/event-sharing.service'

/** @deprecated Production callers should use the composed workflow entry points. */

export const provideEventLayers = <A, E>(program: Effect.Effect<A, E, EventService>) =>
  program.pipe(Effect.provide(EventDomainLive), Effect.provide(PgClientLive))

/** @deprecated Production callers should use the composed workflow entry points. */
export const provideEventSharingLayers = <A, E>(
  program: Effect.Effect<A, E, EventSharingService>
) => program.pipe(Effect.provide(EventSharingDomainLive), Effect.provide(PgClientLive))
