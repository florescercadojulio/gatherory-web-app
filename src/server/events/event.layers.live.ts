import { Layer } from 'effect'
import { EventRepoLive } from './repos/event.repo.live'
import { EventAuthorizationLive } from './services/event-authorization.service'
import { EventServiceLive } from './services/event.service.live'

// Keep PostgreSQL external so all dependencies use the caller's client/scope.
export const EventAccessLive = Layer.mergeAll(EventRepoLive, EventAuthorizationLive)
export const EventDomainLive = EventServiceLive.pipe(Layer.provide(EventAccessLive))
