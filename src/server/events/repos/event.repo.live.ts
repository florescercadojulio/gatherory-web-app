import { Layer } from "effect"

import { tryPersistence } from "@/server/effect"

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

function repositoryOperation<A>(code: string, operation: () => Promise<A>) {
  return tryPersistence(code, operation)
}

export const EventRepoLive = Layer.succeed(EventRepo, {
  hasWorkspaceMembership: (input) =>
    repositoryOperation("EVENT_WORKSPACE_MEMBERSHIP_QUERY_FAILED", () =>
      hasWorkspaceMembership(input),
    ),
  getEventParticipant: (input) =>
    repositoryOperation("EVENT_PARTICIPANT_QUERY_FAILED", () =>
      getEventParticipant(input),
    ),
  createEventWithParticipants: (input) =>
    repositoryOperation("EVENT_CREATE_FAILED", () =>
      createEventWithParticipants(input),
    ),
  listVisibleMainEvents: (input) =>
    repositoryOperation("EVENT_LIST_FAILED", () => listVisibleMainEvents(input)),
  createEventInvitation: (input) =>
    repositoryOperation("EVENT_INVITATION_CREATE_FAILED", () =>
      createEventInvitation(input),
    ),
  acceptEventInvitation: (input) =>
    repositoryOperation("EVENT_INVITATION_ACCEPT_FAILED", () =>
      acceptEventInvitation(input),
    ),
} satisfies EventRepoShape)
