import { Effect, Layer } from 'effect'
import { createMediaReadUrl } from '@/server/media/connectors/media-storage.con'
import { EventInvitationArtwork } from './event-invitation-artwork.con'

export const EventInvitationArtworkLive = Layer.succeed(EventInvitationArtwork, {
  sign: (asset) =>
    Effect.tryPromise({
      try: () => createMediaReadUrl({ bucket: asset.bucket, key: asset.storageKey }),
      catch: (cause) => cause,
    }),
})
