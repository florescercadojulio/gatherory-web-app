import { PgClientLive } from '@/db'
import type { EventPermissions } from '@/lib/permissions'
import { Effect, Layer } from 'effect'
import { EventService } from '@/server/events/services/event.service'
import { EventAccessLive, EventDomainLive } from '@/server/events/event.layers.live'
import { ensureEventPermission } from '@/server/events/authorization'
import {
  bootstrapNativeSync,
  pushNativeSync,
} from '@/server/sync/workflows/native-sync.workflows.live'
import type { McpContentPort } from './service'

function run<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
  return Effect.runPromise(effect)
}

export const liveMcpContentPort: McpContentPort = {
  bootstrap: (userId) =>
    run(bootstrapNativeSync({ userId, supportsBlueprintGuides: true, supportsTodos: true })),

  push: async ({ userId, mutation, fingerprint }) => {
    const result = await run(
      pushNativeSync({
        userId,
        mutations: [mutation],
        requestFingerprints: { [mutation.id]: fingerprint },
        supportsBlueprintGuides: true,
        supportsTodos: true,
      }).pipe(Effect.provide(PgClientLive))
    )
    const item = result.results[0]
    if (!item) throw new Error('Native sync returned no result for the MCP mutation.')
    return item
  },

  authorize: (userId, eventId, permissions: EventPermissions) =>
    run(
      ensureEventPermission(permissions, { userId, eventId }).pipe(
        Effect.provide(EventAccessLive.pipe(Layer.provide(PgClientLive)))
      )
    ).then(() => undefined),

  isRootEvent: (_userId, eventId) =>
    run(
      Effect.gen(function* () {
        const events = yield* EventService
        const parent = yield* events.getParentEventId(eventId)
        return parent !== null && parent.parentEventId === null
      }).pipe(Effect.provide(EventDomainLive.pipe(Layer.provide(PgClientLive))))
    ),
}
