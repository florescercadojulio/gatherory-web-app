import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Layer } from 'effect'
import type { EventPermissions } from '@/lib/permissions'
import { ForbiddenError } from '@/server/effect'
import { EventRepo } from '@/server/events/repos/event.repo.contract'
import { EventAuthorization } from '@/server/events/services/event-authorization.service'
import {
  EventSharingRepo,
  type EventSharingRepoShape,
} from '@/server/events/repos/event-sharing.repo'
import { EventService } from '@/server/events/services/event.service'
import { EventServiceLive } from '@/server/events/services/event.service.live'
import { EventSharingService } from '@/server/events/services/event-sharing.service'
import { EventSharingServiceLive } from '@/server/events/services/event-sharing.service.live'

it.effect('EventSharingServiceLive delegates preview through the injected repository', () => {
  const preview = {
    title: 'Family dinner',
    startsAt: null,
    locationName: null,
    role: 'guest',
    status: 'pending',
    requiresApproval: false,
    planningPermission: 'view_only',
    expiresAt: '2026-10-28T12:00:00.000Z',
  } as const satisfies NonNullable<EffectSuccess<ReturnType<EventSharingRepoShape['preview']>>>
  const repo = {
    create: () => Effect.die('not used by this test'),
    getEventIdForShareLink: () => Effect.die('not used by this test'),
    revoke: () => Effect.die('not used by this test'),
    preview: (token: string) =>
      token === 'share-token' ? Effect.succeed(preview) : Effect.succeed(null),
    accept: () => Effect.die('not used by this test'),
    listJoinRequests: () => Effect.die('not used by this test'),
    listActiveLinks: () => Effect.die('not used by this test'),
    reviewJoinRequest: () => Effect.die('not used by this test'),
  } satisfies EventSharingRepoShape
  const repoLayer = Layer.succeed(EventSharingRepo, repo)

  return Effect.gen(function* () {
    const sharing = yield* EventSharingService
    const result = yield* sharing.preview('share-token')
    expect(result).toEqual(preview)
  }).pipe(Effect.provide(EventSharingServiceLive), Effect.provide(repoLayer))
})

type EffectSuccess<T> = T extends Effect.Effect<infer A, infer _E, infer _R> ? A : never

it.effect('EventServiceLive checks child-event permission before writing', () => {
  let requestedPermissions: EventPermissions | undefined
  const repo = Layer.mock(EventRepo, {
    getEventParticipant: () => Effect.succeed({ role: 'guest', planningPermission: 'view_only' }),
  })
  const authorization = Layer.succeed(EventAuthorization, {
    require: (_participant, permissions) => {
      requestedPermissions = permissions
      return Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'EVENT_PERMISSION_REQUIRED',
          userMessageKey: 'serverErrors.AUTHORIZATION',
        })
      )
    },
  })

  return Effect.gen(function* () {
    const events = yield* EventService
    const result = yield* Effect.exit(
      events.create(
        { organizationId: 'workspace-id', userId: 'guest-user' },
        {
          title: 'Child event',
          description: undefined,
          parentEventId: '11111111-1111-4111-8111-111111111111',
          purpose: 'part_of_event',
          category: 'other',
          planningStatus: 'approved',
          timeZone: 'UTC',
        }
      )
    )
    expect(Exit.isFailure(result)).toBe(true)
    if (Exit.isFailure(result)) {
      expect(
        result.cause.reasons.some(
          (reason) => Cause.isFailReason(reason) && reason.error instanceof ForbiddenError
        )
      ).toBe(true)
    }
    expect(requestedPermissions).toEqual({ event: ['create_child'] })
  }).pipe(Effect.provide(EventServiceLive), Effect.provide(repo), Effect.provide(authorization))
})
