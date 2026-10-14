import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import {
  acceptEventShareLink,
  createEventShareLink,
  getEventIdForShareLink,
  listEventJoinRequests,
  previewEventShareLink,
  revokeEventShareLink,
  reviewEventJoinRequest,
} from './event-share-link.repo.persistence'
import { EventSharingRepo } from './event-sharing.repo'

export const EventSharingRepoLive = Layer.effect(
  EventSharingRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(PgClient, pg))
    return {
      create: (userId, input) => bindPg(createEventShareLink(userId, input)),
      getEventIdForShareLink: (token) => bindPg(getEventIdForShareLink(token)),
      revoke: (userId, eventId) => bindPg(revokeEventShareLink(userId, eventId)),
      preview: (token, userId) => bindPg(previewEventShareLink(token, userId)),
      accept: (userId, token) => bindPg(acceptEventShareLink(userId, token)),
      listJoinRequests: (userId, eventId) => bindPg(listEventJoinRequests(userId, eventId)),
      reviewJoinRequest: (userId, eventId, requestId, action) =>
        bindPg(reviewEventJoinRequest(userId, eventId, requestId, action)),
    }
  })
)
