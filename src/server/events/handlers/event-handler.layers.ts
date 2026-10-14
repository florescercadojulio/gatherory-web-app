import { PgClientLive } from '@/db'
import { Effect } from 'effect'
import { EventRepoLive } from '../repos/event.repo.live'
import { EventSharingRepoLive } from '../repos/event-sharing.repo.live'
import { EventAuthorizationLive } from '../services/event-authorization.service'
import { EventService } from '../services/event.service'
import { EventServiceLive } from '../services/event.service.live'
import { EventSharingService } from '../services/event-sharing.service'
import { EventSharingServiceLive } from '../services/event-sharing.service.live'

export const provideEventLayers = <A, E>(program: Effect.Effect<A, E, EventService>) =>
  program.pipe(
    Effect.provide(EventServiceLive),
    Effect.provide(EventRepoLive),
    Effect.provide(EventAuthorizationLive),
    Effect.provide(PgClientLive)
  )

export const provideEventSharingLayers = <A, E>(
  program: Effect.Effect<A, E, EventSharingService>
) =>
  program.pipe(
    Effect.provide(EventSharingServiceLive),
    Effect.provide(EventSharingRepoLive),
    Effect.provide(PgClientLive)
  )
