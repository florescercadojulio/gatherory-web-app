import { Context, Effect } from 'effect'
import type {
  acceptEventShareLink,
  createEventShareLink,
  getEventIdForShareLink,
  listEventJoinRequests,
  previewEventShareLink,
  revokeEventShareLink,
  reviewEventJoinRequest,
} from './event-share-link.repo.persistence'

type NeedsPg<T> = T extends (
  ...args: infer Args
) => Effect.Effect<infer Value, infer Error, unknown>
  ? (...args: Args) => Effect.Effect<Value, Error>
  : never

export type EventSharingRepoShape = {
  readonly create: NeedsPg<typeof createEventShareLink>
  readonly getEventIdForShareLink: NeedsPg<typeof getEventIdForShareLink>
  readonly revoke: NeedsPg<typeof revokeEventShareLink>
  readonly preview: NeedsPg<typeof previewEventShareLink>
  readonly accept: NeedsPg<typeof acceptEventShareLink>
  readonly listJoinRequests: NeedsPg<typeof listEventJoinRequests>
  readonly reviewJoinRequest: NeedsPg<typeof reviewEventJoinRequest>
}

export class EventSharingRepo extends Context.Service<EventSharingRepo, EventSharingRepoShape>()(
  'EventSharingRepo'
) {}
