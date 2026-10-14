import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { NativeInsightsRepoLive } from '../repos/native-insights.repo.live'
import { NativeInsightsServiceLive } from '../services/native-insights.service.live'
import { listNativeWorkspaceInsightsWorkflow } from '../workflows/native-workspace-insights.workflow'

export const listNativeWorkspaceInsights = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) =>
    runServerEffect(
      listNativeWorkspaceInsightsWorkflow(context.user.id).pipe(
        Effect.provide(NativeInsightsServiceLive),
        Effect.provide(NativeInsightsRepoLive),
        Effect.provide(PgClientLive)
      )
    )
  )
