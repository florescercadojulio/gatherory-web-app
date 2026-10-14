import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { ForbiddenError, runServerEffect } from '@/server/effect'
import { ModerationSessionConnector } from '../connectors/moderation-session.con'
import { ModerationSessionConnectorLive } from '../connectors/moderation-session.con.live'
import { ModerationServerLive } from '../moderation.layers.live'
import { requireModeratorWorkflow } from '../workflows/require-moderator.workflow'

export const moderatorAccess = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(
    Effect.gen(function* () {
      const sessionConnector = yield* ModerationSessionConnector
      const session = yield* sessionConnector.getSession()
      if (!session?.user.emailVerified)
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'MODERATOR_SESSION_REQUIRED',
            userMessageKey: 'serverErrors.MODERATOR_SESSION_REQUIRED',
          })
        )
      yield* requireModeratorWorkflow(session.user.id)
      return { authorized: true }
    }).pipe(
      Effect.provide(ModerationSessionConnectorLive),
      Effect.provide(ModerationServerLive),
      Effect.provide(PgClientLive)
    )
  )
)
