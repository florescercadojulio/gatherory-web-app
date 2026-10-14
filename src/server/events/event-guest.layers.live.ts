import { Layer } from 'effect'
import { EventInvitationArtworkLive } from './connectors/event-invitation-artwork.con.live'
import { EventGuestRepoLive } from './repos/event-guest.repo.live'
import { EventGuestServiceLive } from './services/event-guest.service.live'

export const EventGuestDomainLive = EventGuestServiceLive.pipe(
  Layer.provide(Layer.mergeAll(EventGuestRepoLive, EventInvitationArtworkLive))
)
