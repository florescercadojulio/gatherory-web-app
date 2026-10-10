import { Context, Effect, Layer } from "effect"

import {
  hasEventPermission,
  type EventParticipantAccess,
  type EventPermissions,
} from "@/lib/permissions"
import { ForbiddenError } from "@/server/effect"

type EventAuthorizationShape = {
  readonly require: (
    participant: EventParticipantAccess,
    permissions: EventPermissions,
  ) => Effect.Effect<void, ForbiddenError>
}

export class EventAuthorization extends Context.Service<
  EventAuthorization,
  EventAuthorizationShape
>()("EventAuthorization") {}

export const EventAuthorizationLive = Layer.succeed(EventAuthorization, {
  require: (participant, permissions) =>
    hasEventPermission(participant, permissions)
      ? Effect.void
      : Effect.fail(
          new ForbiddenError({
            category: "authorization",
            code: "EVENT_PERMISSION_REQUIRED",
          }),
        ),
})
