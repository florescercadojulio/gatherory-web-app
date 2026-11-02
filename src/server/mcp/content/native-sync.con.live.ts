import { PgClientLive } from '@/db'
import type { EventPermissions } from '@/lib/permissions'
import { ServerOperationError } from '@/lib/domain-errors'
import { Effect, Layer } from 'effect'
import { EventService } from '@/server/events/services/event.service'
import { EventAccessLive, EventDomainLive } from '@/server/events/event.layers.live'
import { ensureEventPermission } from '@/server/events/authorization'
import {
  bootstrapNativeSync,
  pushNativeSync,
} from '@/server/sync/workflows/native-sync.workflows.live'
import { McpContentNativePort, type McpContentNativePortShape } from './native-sync.con'

export const McpContentNativePortLive = Layer.succeed(McpContentNativePort, {
  bootstrap: (userId) =>
    bootstrapNativeSync({
      userId,
      supportsBlueprintGuides: true,
      supportsTodos: true,
      supportsBudgetAtomic: true,
    }),

  push: ({ userId, mutation, fingerprint }) =>
    Effect.flatMap(
      pushNativeSync({
        userId,
        mutations: [mutation],
        requestFingerprints: { [mutation.id]: fingerprint },
        supportsBlueprintGuides: true,
        supportsTodos: true,
        supportsBudgetAtomic: true,
      }).pipe(Effect.provide(PgClientLive)),
      (result) => {
        const item = result.results[0]
        return item
          ? Effect.succeed(item)
          : Effect.fail(
              new ServerOperationError({
                category: 'system',
                code: 'MCP_SYNC_RESULT_MISSING',
                userMessageKey: 'serverErrors.SYSTEM',
              })
            )
      }
    ),

  authorize: (userId, eventId, permissions: EventPermissions) =>
    ensureEventPermission(permissions, { userId, eventId }).pipe(
      Effect.provide(EventAccessLive.pipe(Layer.provide(PgClientLive))),
      Effect.asVoid
    ),

  isRootEvent: (_userId, eventId) =>
    Effect.gen(function* () {
      const events = yield* EventService
      const parent = yield* events.getParentEventId(eventId)
      return parent !== null && parent.parentEventId === null
    }).pipe(Effect.provide(EventDomainLive.pipe(Layer.provide(PgClientLive)))),
} satisfies McpContentNativePortShape)
