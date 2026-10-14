import { Layer } from 'effect'
import { EventSharingRepoLive } from './repos/event-sharing.repo.live'
import { EventSharingServiceLive } from './services/event-sharing.service.live'

export const EventSharingDomainLive = EventSharingServiceLive.pipe(
  Layer.provide(EventSharingRepoLive)
)
