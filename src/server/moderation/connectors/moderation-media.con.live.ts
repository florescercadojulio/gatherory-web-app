import { Effect, Layer } from 'effect'
import { MediaStorage } from '@/server/media/connectors/media-storage.con.contract'
import { ModerationMediaConnector } from './moderation-media.con'

export const ModerationMediaConnectorLive = Layer.effect(
  ModerationMediaConnector,
  Effect.gen(function* () {
    const mediaStorage = yield* MediaStorage
    return {
      createEvidenceReadUrl: (input) => mediaStorage.createReadUrl(input),
    }
  })
)
