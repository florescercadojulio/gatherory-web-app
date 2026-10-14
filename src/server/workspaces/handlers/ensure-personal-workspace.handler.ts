import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { BetterAuthWorkspaceConLive } from '../connectors/better-auth.con.live'
import { WorkspaceRepoLive } from '../repos/workspace.repo.live'
import { WorkspaceServiceLive } from '../services/workspace.service.live'
import { ensurePersonalWorkspaceWorkflow } from '../workflows/ensure-personal-workspace.workflow'

export const ensurePersonalWorkspace = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) =>
    runServerEffect(
      ensurePersonalWorkspaceWorkflow({
        user: context.user,
        headers: getRequestHeaders(),
        activeOrganizationId: context.session.activeOrganizationId,
      }).pipe(
        Effect.provide(WorkspaceServiceLive),
        Effect.provide(WorkspaceRepoLive),
        Effect.provide(BetterAuthWorkspaceConLive),
        Effect.provide(PgClientLive)
      )
    )
  )
