import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { listNativeWorkspaceInsightsWorkflow } from '../workflows/native-insights.workflows.live'

export const listNativeWorkspaceInsights = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) =>
    runServerEffect(
      listNativeWorkspaceInsightsWorkflow(context.user.id).pipe(Effect.provide(PgClientLive))
    )
  )
