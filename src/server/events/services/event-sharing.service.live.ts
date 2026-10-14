import { Effect, Layer } from 'effect'
import { EventSharingRepo } from '../repos/event-sharing.repo'
import { EventSharingService } from './event-sharing.service'

export const EventSharingServiceLive = Layer.effect(
  EventSharingService,
  Effect.gen(function* () {
    const repo = yield* EventSharingRepo
    return {
      create: repo.create,
      getEventIdForShareLink: repo.getEventIdForShareLink,
      revoke: repo.revoke,
      preview: repo.preview,
      accept: repo.accept,
      listJoinRequests: repo.listJoinRequests,
      reviewJoinRequest: repo.reviewJoinRequest,
    }
  })
)
