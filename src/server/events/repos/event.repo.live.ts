import { Layer } from "effect"

import {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  EventRepo,
  getEventParticipant,
  hasWorkspaceMembership,
  listVisibleMainEvents,
  type EventRepoShape,
} from "./event.repo"

export const EventRepoLive = Layer.succeed(EventRepo, {
  hasWorkspaceMembership,
  getEventParticipant,
  createEventWithParticipants,
  listVisibleMainEvents,
  createEventInvitation,
  acceptEventInvitation,
} satisfies EventRepoShape)
