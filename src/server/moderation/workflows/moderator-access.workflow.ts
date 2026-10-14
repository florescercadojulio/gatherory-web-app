import { Effect } from 'effect'
import { ForbiddenError } from '@/server/effect'
import { ModerationSessionConnector } from '../connectors/moderation-session.con'
import { ModerationService } from '../services/moderation.service'

export const moderatorAccessWorkflow = () =>
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
    const moderation = yield* ModerationService
    yield* moderation.requireModerator(session.user.id)
    return { authorized: true as const }
  })
