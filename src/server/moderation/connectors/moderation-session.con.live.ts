import { getRequestHeaders } from '@tanstack/react-start/server'
import { Layer } from 'effect'
import { auth } from '@/lib/auth'
import { tryServerOperation } from '@/server/effect'
import { ModerationSessionConnector } from './moderation-session.con'

export const ModerationSessionConnectorLive = Layer.succeed(ModerationSessionConnector, {
  getSession: () =>
    tryServerOperation(
      {
        category: 'system',
        code: 'SESSION_LOOKUP_FAILED',
        userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
      },
      () => auth.api.getSession({ headers: getRequestHeaders() })
    ),
})
